/**
 * Integration tests for the generation endpoint.
 *
 * These exercise the real route handler — real validation, real safety gate, real provider
 * chain — with no provider keys present, so they run offline and deterministically. That
 * is the same path a reviewer with no API key takes, which makes this the test that proves
 * the app is usable out of the box.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const ORIGINAL_ENV = { ...process.env };

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const context = {
  habitLabel: "late-night scrolling",
  goal: "nothing after 10pm",
  why: "I want my evenings back",
  streakDays: 5,
};

const risk = {
  score: 72,
  state: "high_risk" as const,
  factors: [
    { key: "intensity", label: "Craving strength", points: 27, detail: "Rated 9 out of 10." },
  ],
  headline: "This is a high-risk moment.",
};

beforeEach(() => {
  // No provider keys: the chain must fall through to deterministic content.
  delete process.env.GROQ_API_KEY;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("POST /api/generate — offline behaviour", () => {
  it("returns usable content with no API key configured", async () => {
    const response = await POST(
      request({ task: "intervention", context, risk, intent: "open Instagram", trigger: "habit_cue" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.blocked).toBe(false);
    expect(payload.source).toBe("demo");
    expect(payload.live).toBe(false);
    expect(payload.data.steps.length).toBeGreaterThanOrEqual(3);
    expect(payload.data.title).toBeTruthy();
  });

  it("serves every generation task the app depends on", async () => {
    const cases = [
      { task: "plans", knownTriggers: ["Boredom"] },
      { task: "risk_narrative", risk },
      { task: "future_self" },
      { task: "nudges", windows: ["10pm"] },
      { task: "coach_reply", message: "I keep slipping at night" },
      { task: "post_mortem", intent: "scrolled for an hour", trigger: "tiredness" },
      { task: "intervention", risk, intent: "open TikTok", trigger: "boredom" },
    ];

    for (const body of cases) {
      const response = await POST(request({ ...body, context }));
      const payload = await response.json();
      expect(response.status, `task ${body.task} should succeed`).toBe(200);
      expect(payload.data, `task ${body.task} should return data`).toBeTruthy();
    }
  });

  it("is deterministic — the same request twice gives the same content", async () => {
    const body = { task: "intervention", context, risk, intent: "open Instagram", trigger: "habit_cue" };
    const first = await (await POST(request(body))).json();
    const second = await (await POST(request(body))).json();
    expect(first.data).toEqual(second.data);
  });
});

describe("POST /api/generate — safety gate", () => {
  it("blocks generation on a suicidal statement and returns crisis resources", async () => {
    const response = await POST(
      request({ task: "coach_reply", context, message: "honestly I want to die" }),
    );
    const payload = await response.json();

    expect(payload.blocked).toBe(true);
    expect(payload.severity).toBe("crisis");
    expect(payload.data).toBeUndefined();
    expect(payload.resources.length).toBeGreaterThan(3);
    expect(JSON.stringify(payload.resources)).toContain("988");
  });

  it("screens the note field, not only the message field", async () => {
    const response = await POST(
      request({
        task: "post_mortem",
        context,
        intent: "scrolled all night",
        trigger: "low_mood",
        note: "I have been thinking about hurting myself",
      }),
    );
    const payload = await response.json();
    expect(payload.blocked).toBe(true);
  });

  it("flags a described withdrawal emergency as medical, not as a coaching moment", async () => {
    const response = await POST(
      request({ task: "coach_reply", context, message: "I am shaking uncontrollably" }),
    );
    const payload = await response.json();

    expect(payload.blocked).toBe(true);
    expect(payload.severity).toBe("medical_emergency");
  });

  it("lets ordinary habit language through", async () => {
    const response = await POST(
      request({ task: "coach_reply", context, message: "I really want to open Instagram" }),
    );
    const payload = await response.json();
    expect(payload.blocked).toBe(false);
    expect(payload.data.reply).toBeTruthy();
  });
});

describe("POST /api/generate — input validation", () => {
  it("rejects an unknown task", async () => {
    const response = await POST(request({ task: "delete_everything", context }));
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("this is not json"));
    expect(response.status).toBe(400);
  });

  it("rejects a request missing the required context", async () => {
    const response = await POST(request({ task: "future_self" }));
    expect(response.status).toBe(400);
  });

  it("rejects a task whose required fields are absent", async () => {
    // intervention needs risk, intent, and trigger.
    const response = await POST(request({ task: "intervention", context }));
    expect(response.status).toBe(400);
  });

  it("rejects free text beyond the length cap, so the endpoint cannot be used to drain quota", async () => {
    const response = await POST(
      request({ task: "coach_reply", context, message: "a".repeat(5000) }),
    );
    expect(response.status).toBe(400);
  });

  it("never reflects an API key back in a response", async () => {
    process.env.GROQ_API_KEY = "gsk_secret_value_that_must_not_leak";
    const response = await POST(request({ task: "future_self", context }));
    const text = await response.text();
    expect(text).not.toContain("gsk_secret_value_that_must_not_leak");
  });
});

describe("POST /api/generate — rate limiting", () => {
  it("eventually rejects a flood from one client with 429 and a retry hint", async () => {
    const headers = { "x-forwarded-for": "203.0.113.99" };
    let limited: Response | null = null;

    // The limit is 30/min; 40 attempts guarantees we cross it.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await POST(request({ task: "future_self", context }, headers));
      if (response.status === 429) {
        limited = response;
        break;
      }
    }

    expect(limited).not.toBeNull();
    expect(limited!.headers.get("retry-after")).toBeTruthy();
  });

  it("does not penalise a different client for the first client's flood", async () => {
    const response = await POST(
      request({ task: "future_self", context }, { "x-forwarded-for": "198.51.100.7" }),
    );
    expect(response.status).toBe(200);
  });
});
