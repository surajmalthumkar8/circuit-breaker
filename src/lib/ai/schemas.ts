/**
 * Contracts for everything the model generates.
 *
 * The model never returns free prose that the UI renders blindly. It returns structured
 * data validated against these schemas, which the interface renders as components. That
 * keeps generation testable, keeps malformed output from reaching the screen, and is what
 * makes this an artifact engine rather than a chat window.
 */

import { z } from "zod";
import { TRIGGER_TAGS } from "@/lib/domain/types";

const triggerTag = z.enum(TRIGGER_TAGS as unknown as [string, ...string[]]);

/**
 * An urge-surfing script: short, spoken aloud one step at a time while a breathing
 * animation runs. Mindfulness-based craving interventions show g≈-0.70 across 17 RCTs.
 */
export const interventionSchema = z.object({
  title: z.string().min(3).max(80),
  kind: z.enum(["urge_surf", "reframe", "swap", "grounding"]),
  steps: z.array(z.string().min(8).max(240)).min(3).max(6),
  closing: z.string().min(8).max(240),
  durationSec: z.number().int().min(30).max(180),
});
export type GeneratedIntervention = z.infer<typeof interventionSchema>;

/**
 * Implementation intentions. The "when" must be a concrete, noticeable cue and the "I
 * will" a small action doable in under two minutes — that is what makes the pairing
 * automatic rather than aspirational.
 */
export const planSchema = z.object({
  trigger: z.string().min(8).max(160),
  action: z.string().min(8).max(160),
  rationale: z.string().min(10).max(300),
  tag: triggerTag,
});
export const planListSchema = z.object({ plans: z.array(planSchema).min(1).max(5) });
export type GeneratedPlan = z.infer<typeof planSchema>;

/** A plain-language read on the user's current risk, written from the computed factors. */
export const riskNarrativeSchema = z.object({
  summary: z.string().min(20).max(600),
  watchFor: z.array(z.string().min(5).max(160)).min(1).max(4),
  suggestion: z.string().min(10).max(300),
});
export type GeneratedRiskNarrative = z.infer<typeof riskNarrativeSchema>;

/** A blame-free post-mortem after a lapse, in the Marlatt relapse-prevention tradition. */
export const postMortemSchema = z.object({
  reframe: z.string().min(20).max(500),
  whatHappened: z.string().min(10).max(400),
  nextTime: z.string().min(10).max(400),
  newPlan: planSchema,
});
export type GeneratedPostMortem = z.infer<typeof postMortemSchema>;

/** A letter from the user's future self (future-self continuity). */
export const futureSelfSchema = z.object({
  horizonYears: z.number().int().min(1).max(20),
  body: z.string().min(120).max(2000),
});
export type GeneratedFutureSelf = z.infer<typeof futureSelfSchema>;

/** A short coaching reply. Bounded length keeps the coach from drifting into therapy. */
export const coachReplySchema = z.object({
  reply: z.string().min(10).max(900),
});
export type GeneratedCoachReply = z.infer<typeof coachReplySchema>;

/** Personalised nudge copy for a predicted high-risk window. */
export const nudgeSchema = z.object({
  window: z.string().min(3).max(60),
  headline: z.string().min(5).max(90),
  body: z.string().min(10).max(240),
});
export const nudgeListSchema = z.object({ nudges: z.array(nudgeSchema).min(1).max(4) });
export type GeneratedNudge = z.infer<typeof nudgeSchema>;

/** Every generation task the API route can serve. */
export const TASK_SCHEMAS = {
  intervention: interventionSchema,
  plans: planListSchema,
  risk_narrative: riskNarrativeSchema,
  post_mortem: postMortemSchema,
  future_self: futureSelfSchema,
  coach_reply: coachReplySchema,
  nudges: nudgeListSchema,
} as const;

export type TaskName = keyof typeof TASK_SCHEMAS;

export const TASK_NAMES = Object.keys(TASK_SCHEMAS) as TaskName[];

export function isTaskName(value: unknown): value is TaskName {
  return typeof value === "string" && TASK_NAMES.includes(value as TaskName);
}
