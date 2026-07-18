/**
 * The single generation endpoint.
 *
 * Everything the model produces flows through here, which keeps the safety checks,
 * validation, rate limiting, and provider fallback in one auditable place rather than
 * scattered across features.
 *
 * Request handling, in order:
 *   1. Rate limit by client.
 *   2. Validate the request body against a schema — reject anything unexpected.
 *   3. Screen free text for crisis signals BEFORE any model sees it.
 *   4. Generate through the provider chain, falling back to deterministic content.
 *
 * The response always has the same shape and this route never returns a 500 for a
 * generation failure — a model being unavailable degrades to offline content instead.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithProviders } from "@/lib/ai/generate";
import { activeProviders } from "@/lib/ai/providers";
import { PROMPTS } from "@/lib/ai/prompts";
import { TASK_SCHEMAS, isTaskName, type TaskName } from "@/lib/ai/schemas";
import { demoContentFor } from "@/lib/ai/demo-content";
import { checkForCrisis, CRISIS_RESOURCES } from "@/lib/safety/crisis";
import { looksLikePromptLeak, stripUnverifiedNumbers } from "@/lib/safety/sanitise";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { TRIGGER_TAGS, type RiskState, type TriggerTag } from "@/lib/domain/types";

export const runtime = "nodejs";

const riskFactorSchema = z.object({
  key: z.string(),
  label: z.string(),
  points: z.number(),
  detail: z.string(),
});

const riskSchema = z.object({
  score: z.number(),
  state: z.enum(["steady", "tempted", "high_risk", "crisis"]),
  factors: z.array(riskFactorSchema),
  headline: z.string(),
});

const contextSchema = z.object({
  habitLabel: z.string().max(200),
  goal: z.string().max(300),
  why: z.string().max(500),
  streakDays: z.number().int().min(0).max(100_000),
});

/** Free-text fields are length-capped: a bounded prompt cannot be used to drain quota. */
const requestSchema = z.object({
  task: z.string(),
  context: contextSchema,
  risk: riskSchema.optional(),
  intent: z.string().max(300).optional(),
  trigger: z.enum(TRIGGER_TAGS as unknown as [string, ...string[]]).optional(),
  note: z.string().max(1000).optional(),
  message: z.string().max(1000).optional(),
  history: z.string().max(4000).optional(),
  knownTriggers: z.array(z.string().max(60)).max(12).optional(),
  windows: z.array(z.string().max(60)).max(6).optional(),
});

/** The request after the task name has been narrowed to a known generation task. */
type GenerateBody = Omit<z.infer<typeof requestSchema>, "task"> & { task: TaskName };

function buildPrompt(body: GenerateBody): { system: string; user: string } | null {
  const { context } = body;

  switch (body.task) {
    case "intervention": {
      if (!body.risk || !body.intent || !body.trigger) return null;
      return {
        system: PROMPTS.intervention.system,
        user: PROMPTS.intervention.user(
          context,
          body.risk,
          body.intent,
          body.trigger as TriggerTag,
        ),
      };
    }
    case "plans":
      return {
        system: PROMPTS.plans.system,
        user: PROMPTS.plans.user(context, body.knownTriggers ?? []),
      };
    case "risk_narrative": {
      if (!body.risk) return null;
      return {
        system: PROMPTS.risk_narrative.system,
        user: PROMPTS.risk_narrative.user(context, body.risk),
      };
    }
    case "post_mortem": {
      if (!body.intent || !body.trigger) return null;
      return {
        system: PROMPTS.post_mortem.system,
        user: PROMPTS.post_mortem.user(
          context,
          body.intent,
          body.trigger as TriggerTag,
          body.note ?? "",
        ),
      };
    }
    case "future_self":
      return { system: PROMPTS.future_self.system, user: PROMPTS.future_self.user(context) };
    case "coach_reply": {
      if (!body.message) return null;
      return {
        system: PROMPTS.coach_reply.system,
        user: PROMPTS.coach_reply.user(context, body.history ?? "", body.message),
      };
    }
    case "nudges":
      return { system: PROMPTS.nudges.system, user: PROMPTS.nudges.user(context, body.windows ?? []) };
    default:
      return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = checkRateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "That is a lot of requests in a short time. Please wait a moment and try again.",
      },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success || !isTaskName(parsed.data.task)) {
    return NextResponse.json(
      { error: "invalid_request", detail: parsed.success ? "unknown task" : "schema mismatch" },
      { status: 400 },
    );
  }

  // isTaskName has verified the task above; restate it so the narrowing carries through.
  const body: GenerateBody = { ...parsed.data, task: parsed.data.task as TaskName };

  // Safety gate. Every piece of free text the user wrote is screened before a model sees
  // it, and a positive match stops generation entirely rather than softening it.
  const userText = [body.message, body.note, body.intent].filter(Boolean).join(" ");
  const crisis = checkForCrisis(userText);
  if (crisis.blocked) {
    return NextResponse.json(
      {
        blocked: true,
        severity: crisis.severity,
        message: crisis.message,
        resources: CRISIS_RESOURCES,
      },
      { status: 200 },
    );
  }

  const prompt = buildPrompt(body);
  if (!prompt) {
    return NextResponse.json({ error: "missing_fields_for_task" }, { status: 400 });
  }

  const schema = TASK_SCHEMAS[body.task];
  const demoContent = demoContentFor({
    task: body.task,
    riskState: body.risk?.state as RiskState | undefined,
    trigger: body.trigger as TriggerTag | undefined,
    seed: body.intent ?? body.message ?? "",
  });

  const result = await generateWithProviders(activeProviders(), {
    system: prompt.system,
    prompt: prompt.user,
    schema: schema as never,
    demoContent: schema.parse(demoContent) as never,
  });

  // Outbound safety. Two things must never reach the screen: a phone number the model
  // invented (a wrong crisis line is an active hazard), and the system prompt itself.
  const safe = sanitiseOutput(result.data);
  if (safe.leaked) {
    return NextResponse.json({
      blocked: false,
      data: schema.parse(demoContent),
      source: "demo",
      live: false,
      note: "The generated reply was discarded because it echoed system instructions.",
    });
  }

  return NextResponse.json({
    blocked: false,
    data: safe.data,
    source: result.source,
    live: result.live,
    ...(safe.redacted.length > 0 ? { redactedNumbers: safe.redacted.length } : {}),
  });
}

/**
 * Walk generated output and clean every string it contains, at any depth. Generated
 * artifacts are nested (steps arrays, plan objects), so a shallow pass would miss most
 * of the surface that actually reaches the screen.
 */
function sanitiseOutput(value: unknown): {
  data: unknown;
  redacted: string[];
  leaked: boolean;
} {
  const redacted: string[] = [];
  let leaked = false;

  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      if (looksLikePromptLeak(node)) leaked = true;
      const cleaned = stripUnverifiedNumbers(node);
      redacted.push(...cleaned.redacted);
      return cleaned.text;
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.fromEntries(
        Object.entries(node as Record<string, unknown>).map(([key, item]) => [key, walk(item)]),
      );
    }
    return node;
  };

  return { data: walk(value), redacted, leaked };
}
