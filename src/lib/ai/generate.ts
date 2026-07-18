/**
 * Generation with a provider fallback chain.
 *
 * Ported from the production pattern in our FastAPI backend's llm.py: several providers
 * behind one uniform result type, with a deterministic stub as the final rung so the
 * application works with no keys configured at all.
 *
 * The chain is: Groq (fast, generous free tier) → Gemini (fallback) → hand-authored demo
 * content. A page render must never fail because a model was rate limited, so this
 * function does not throw; it degrades.
 */

import type { ZodType } from "zod";
import type { GenerationSource } from "@/lib/domain/types";

export interface ProviderCaller {
  name: Exclude<GenerationSource, "demo">;
  /** False when the provider has no API key configured. */
  available: boolean;
  /** Returns the model's raw text response. */
  call: (system: string, prompt: string, signal: AbortSignal) => Promise<string>;
}

export interface GenerateOptions<T> {
  system: string;
  prompt: string;
  schema: ZodType<T>;
  /** Schema-valid content used when no provider succeeds. */
  demoContent: T;
  /** Per-provider budget. Kept tight so a slow model cannot stall a page. */
  timeoutMs?: number;
}

export interface GenerateResult<T> {
  data: T;
  source: GenerationSource;
  /** True when a real model produced this, false when it came from demo content. */
  live: boolean;
}

const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * Pull a JSON object out of a model response. Models often wrap JSON in prose or a
 * markdown fence despite instructions, so we extract the outermost braces rather than
 * trusting the response to be clean.
 */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  const direct = tryParse(trimmed);
  if (direct !== undefined) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== undefined) return parsed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const parsed = tryParse(trimmed.slice(firstBrace, lastBrace + 1));
    if (parsed !== undefined) return parsed;
  }

  return undefined;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Race a provider call against its timeout, aborting the request when it expires. */
async function callWithTimeout(
  provider: ProviderCaller,
  system: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      provider.call(system, prompt, controller.signal),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error(`${provider.name} timed out after ${timeoutMs}ms`)),
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try each available provider in order, returning the first response that parses and
 * validates. Falls back to demo content rather than throwing.
 */
export async function generateWithProviders<T>(
  providers: ProviderCaller[],
  options: GenerateOptions<T>,
): Promise<GenerateResult<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (const provider of providers) {
    if (!provider.available) continue;

    try {
      const raw = await callWithTimeout(provider, options.system, options.prompt, timeoutMs);
      const parsed = extractJson(raw);
      if (parsed === undefined) continue;

      const validated = options.schema.safeParse(parsed);
      if (!validated.success) continue;

      return { data: validated.data, source: provider.name, live: true };
    } catch {
      // Transient failure (timeout, rate limit, network). Try the next rung.
      continue;
    }
  }

  return { data: options.demoContent, source: "demo", live: false };
}
