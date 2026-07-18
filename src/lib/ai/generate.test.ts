import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { generateWithProviders, type ProviderCaller } from "./generate";

const schema = z.object({ reply: z.string().min(3) });

const demoValue = { reply: "demo fallback reply" };

function options(overrides: Partial<Parameters<typeof generateWithProviders>[1]> = {}) {
  return {
    system: "you are a coach",
    prompt: "help me",
    schema,
    demoContent: demoValue,
    timeoutMs: 1000,
    ...overrides,
  };
}

function provider(
  name: "groq" | "gemini",
  behaviour: () => Promise<string>,
  available = true,
): ProviderCaller {
  return { name, available, call: behaviour };
}

describe("generateWithProviders", () => {
  it("returns deterministic demo content when no provider is available", async () => {
    const result = await generateWithProviders([], options());

    expect(result.data).toEqual(demoValue);
    expect(result.source).toBe("demo");
    expect(result.live).toBe(false);
  });

  it("skips providers that are configured but unavailable", async () => {
    const call = vi.fn();
    const result = await generateWithProviders(
      [provider("groq", call as never, false)],
      options(),
    );

    expect(call).not.toHaveBeenCalled();
    expect(result.source).toBe("demo");
  });

  it("uses the first available provider and reports it as the source", async () => {
    const result = await generateWithProviders(
      [provider("groq", async () => JSON.stringify({ reply: "live groq reply" }))],
      options(),
    );

    expect(result.data).toEqual({ reply: "live groq reply" });
    expect(result.source).toBe("groq");
    expect(result.live).toBe(true);
  });

  it("falls back to the next provider when the first one throws", async () => {
    const result = await generateWithProviders(
      [
        provider("groq", async () => {
          throw new Error("429 rate limited");
        }),
        provider("gemini", async () => JSON.stringify({ reply: "gemini saved it" })),
      ],
      options(),
    );

    expect(result.data).toEqual({ reply: "gemini saved it" });
    expect(result.source).toBe("gemini");
  });

  it("falls back to demo content when every provider fails", async () => {
    const result = await generateWithProviders(
      [
        provider("groq", async () => {
          throw new Error("network down");
        }),
        provider("gemini", async () => {
          throw new Error("also down");
        }),
      ],
      options(),
    );

    expect(result.data).toEqual(demoValue);
    expect(result.source).toBe("demo");
    expect(result.live).toBe(false);
  });

  it("rejects malformed JSON and falls through rather than crashing", async () => {
    const result = await generateWithProviders(
      [provider("groq", async () => "this is not json at all")],
      options(),
    );

    expect(result.source).toBe("demo");
    expect(result.data).toEqual(demoValue);
  });

  it("rejects well-formed JSON that violates the schema", async () => {
    const result = await generateWithProviders(
      // Valid JSON, but `reply` is too short for the schema.
      [provider("groq", async () => JSON.stringify({ reply: "x" }))],
      options(),
    );

    expect(result.source).toBe("demo");
  });

  it("extracts JSON when a model wraps it in a markdown code fence", async () => {
    const fenced = '```json\n{"reply":"fenced but valid"}\n```';
    const result = await generateWithProviders([provider("groq", async () => fenced)], options());

    expect(result.data).toEqual({ reply: "fenced but valid" });
    expect(result.source).toBe("groq");
  });

  it("gives up on a provider that exceeds the timeout and still returns content", async () => {
    const slow = provider(
      "groq",
      () => new Promise((resolve) => setTimeout(() => resolve('{"reply":"too late"}'), 500)),
    );

    const result = await generateWithProviders([slow], options({ timeoutMs: 20 }));

    expect(result.source).toBe("demo");
    expect(result.data).toEqual(demoValue);
  });

  it("never throws, because a failed generation must not break a page render", async () => {
    await expect(
      generateWithProviders(
        [
          provider("groq", async () => {
            throw new Error("catastrophic");
          }),
        ],
        options(),
      ),
    ).resolves.toBeDefined();
  });
});
