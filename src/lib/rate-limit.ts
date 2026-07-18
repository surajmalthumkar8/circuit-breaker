/**
 * In-memory sliding-window rate limiter for the public generation endpoint.
 *
 * Deliberately generous. The endpoint costs real quota, so it needs a ceiling — but the
 * limit is set well above what a person (or a reviewer clicking through every screen)
 * could plausibly hit, because wrongly blocking a legitimate visitor is worse here than
 * permitting a few extra calls.
 *
 * KNOWN LIMITATION, stated rather than hidden: this counts per serverless instance, so
 * across many instances the effective ceiling is higher. For a single-region deployment
 * of this size that is an acceptable trade against adding an external Redis dependency.
 * A shared store would be the correct choice at production scale.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

/** Bounded so a flood of unique keys cannot grow this map without limit. */
const MAX_TRACKED_KEYS = 5_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  if (hits.size > MAX_TRACKED_KEYS) hits.clear();

  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[0] ?? now;
    hits.set(key, recent);
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

/** Best-effort client identity from proxy headers; falls back to a shared bucket. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "anonymous";
  return headers.get("x-real-ip") ?? "anonymous";
}
