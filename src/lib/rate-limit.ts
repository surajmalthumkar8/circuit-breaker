/**
 * Sliding-window rate limiter for the public generation endpoint.
 *
 * The endpoint spends real model quota, so it needs a ceiling — but the limit is set well
 * above what a person, or a reviewer clicking through every screen, could plausibly reach.
 * Wrongly blocking a legitimate visitor is worse here than permitting a few extra calls.
 *
 * KNOWN LIMITATION, stated rather than hidden: counters live in process memory, so across
 * several serverless instances the effective ceiling is higher. A shared store would be
 * the correct choice at production scale.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

/** Bounded so a flood of distinct keys cannot grow this map without limit. */
const MAX_TRACKED_KEYS = 5_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Drop keys whose windows have fully expired.
 *
 * Deliberately NOT a blanket clear: wiping the whole map would let an attacker reset
 * every other client's counter simply by sending enough distinct keys to trip the cap.
 */
function evictExpired(now: number): void {
  const windowStart = now - WINDOW_MS;
  for (const [key, timestamps] of hits) {
    if (timestamps.length === 0 || timestamps[timestamps.length - 1]! <= windowStart) {
      hits.delete(key);
    }
  }
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  if (hits.size >= MAX_TRACKED_KEYS) {
    evictExpired(now);
    // Still full of live windows: refuse new keys rather than evicting active ones,
    // which would hand an attacker a way to reset everyone else's counter.
    if (hits.size >= MAX_TRACKED_KEYS && !hits.has(key)) {
      return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
    }
  }

  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    const oldest = recent[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, remaining: MAX_REQUESTS - recent.length, retryAfterSeconds: 0 };
}

/**
 * Identify the caller.
 *
 * Order matters. `x-forwarded-for` is client-supplied and trivially spoofed — rotating it
 * would defeat the limiter entirely — so platform-signed headers are preferred and it is
 * used only as a last resort. On Vercel, `x-vercel-forwarded-for` is set by the platform
 * and cannot be overridden by the client.
 */
export function clientKey(headers: Headers): string {
  const trusted =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip");

  if (trusted) return trusted.trim();

  // Untrusted fallback for self-hosting behind an unknown proxy. Prefixed so it is
  // obvious in any diagnostics that this identity is not verified.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return `untrusted:${forwarded.split(",")[0]?.trim() || "anonymous"}`;

  return "anonymous";
}

/** Test seam: reset counters between cases. Never called by application code. */
export function __resetRateLimitForTests(): void {
  hits.clear();
}
