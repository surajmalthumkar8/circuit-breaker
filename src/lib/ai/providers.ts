/**
 * Concrete provider callers, built from environment variables.
 *
 * Both providers are called over plain REST rather than through an SDK. That keeps the
 * dependency tree small, makes the request shape obvious to a reader, and means adding a
 * provider is a dozen lines rather than a package.
 *
 * These functions run ONLY on the server. Keys are read from non-public environment
 * variables and never reach the browser.
 */

import type { ProviderCaller } from "@/lib/ai/generate";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Cap output so a runaway generation cannot drain the quota or stall a response. */
const MAX_OUTPUT_TOKENS = 900;

function groqProvider(): ProviderCaller {
  const apiKey = process.env.GROQ_API_KEY ?? "";
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  return {
    name: "groq",
    available: apiKey.length > 0,
    call: async (system, prompt, signal) => {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`groq responded ${response.status}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("groq returned no content");
      return content;
    },
  };
}

function geminiProvider(): ProviderCaller {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  return {
    name: "gemini",
    available: apiKey.length > 0,
    call: async (system, prompt, signal) => {
      const response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`gemini responded ${response.status}`);
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("gemini returned no content");
      return content;
    },
  };
}

/**
 * The fallback chain, in order. Groq leads because its free tier is the most generous
 * and its latency makes generated content feel immediate; Gemini covers Groq outages.
 * When DEMO_MODE is set, or neither key exists, generation falls through to the
 * deterministic library instead.
 */
export function activeProviders(): ProviderCaller[] {
  if (process.env.DEMO_MODE === "true") return [];
  return [groqProvider(), geminiProvider()];
}

/** Reported to the interface so users can see which engine is actually serving them. */
export function providerStatus(): { name: string; configured: boolean }[] {
  return [
    { name: "Groq (llama-3.1-8b-instant)", configured: Boolean(process.env.GROQ_API_KEY) },
    {
      name: "Google Gemini (2.5 Flash-Lite)",
      configured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    },
  ];
}
