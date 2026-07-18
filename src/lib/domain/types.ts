/**
 * Domain model for Circuit Breaker.
 *
 * One source of truth shared by the local database, the AI schemas, and the UI, so a
 * value created in one workflow (an urge logged in the Airlock) is the same shape the
 * Journal, Insights, and Coach read back.
 */

/** Habits the app can work on. Screen time is the default vertical. */
export type HabitKind =
  | "screen_time"
  | "social_media"
  | "gaming"
  | "smoking"
  | "vaping"
  | "alcohol"
  | "junk_food"
  | "other";

/**
 * Habits involving physical dependence, where abrupt unsupervised cessation can be
 * medically dangerous. Withdrawal from alcohol (and benzodiazepines) can cause seizures
 * and delirium tremens, which are potentially fatal. The app never coaches cessation for
 * these — it routes to medical supervision. See lib/safety/severity.ts.
 */
export const MEDICAL_RISK_HABITS: readonly HabitKind[] = ["alcohol"] as const;

/** What set the urge off. Used for pattern matching against past lapses. */
export type TriggerTag =
  | "boredom"
  | "stress"
  | "loneliness"
  | "tiredness"
  | "habit_cue"
  | "social_pressure"
  | "procrastination"
  | "celebration"
  | "low_mood";

export const TRIGGER_TAGS: readonly TriggerTag[] = [
  "boredom",
  "stress",
  "loneliness",
  "tiredness",
  "habit_cue",
  "social_pressure",
  "procrastination",
  "celebration",
  "low_mood",
] as const;

export const TRIGGER_LABELS: Record<TriggerTag, string> = {
  boredom: "Boredom",
  stress: "Stress",
  loneliness: "Loneliness",
  tiredness: "Tiredness",
  habit_cue: "Habit cue",
  social_pressure: "Social pressure",
  procrastination: "Procrastination",
  celebration: "Celebration",
  low_mood: "Low mood",
};

export type Mood = "good" | "ok" | "low" | "anxious" | "restless";

export const MOODS: readonly Mood[] = ["good", "ok", "low", "anxious", "restless"] as const;

/** Inferred self-control state. Drives which interface the user is shown. */
export type RiskState = "steady" | "tempted" | "high_risk" | "crisis";

export const RISK_STATE_LABELS: Record<RiskState, string> = {
  steady: "Steady",
  tempted: "Tempted",
  high_risk: "High risk",
  crisis: "Needs support",
};

/** One explainable contributor to the risk score. Shown to the user verbatim. */
export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  detail: string;
}

export interface RiskAssessment {
  /** 0–100. Higher means less self-control capacity available right now. */
  score: number;
  state: RiskState;
  /** Sorted by contribution, largest first. */
  factors: RiskFactor[];
  headline: string;
}

/** How an urge ended. `pending` means the user has not reported back yet. */
export type UrgeOutcome = "pending" | "rode_it_out" | "partial" | "lapsed";

export interface UrgeEvent {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** What the user said they wanted to do, e.g. "open Instagram". */
  intent: string;
  /** Self-reported craving strength, 1–10. */
  intensity: number;
  trigger: TriggerTag;
  mood: Mood;
  risk: RiskAssessment;
  interventionId?: string;
  outcome: UrgeOutcome;
  outcomeAt?: string;
  note?: string;
}

/**
 * An implementation intention ("when X, I will Y").
 * The highest-evidence lever software can deliver: d≈0.65 (Gollwitzer & Sheeran 2006).
 */
export interface Plan {
  id: string;
  /** The "when" — a concrete, detectable cue. */
  trigger: string;
  /** The "I will" — a specific, small, immediate action. */
  action: string;
  /** Why this pairing should work, in plain language. */
  rationale: string;
  /** Which trigger family this plan defends against. */
  tag: TriggerTag;
  source: "ai" | "user";
  timesUsed: number;
  timesWorked: number;
  active: boolean;
  createdAt: string;
}

/** Daily ecological momentary assessment. Feeds the depletion signal in risk scoring. */
export interface CheckIn {
  id: string;
  /** YYYY-MM-DD, local date. One check-in per day. */
  date: string;
  mood: Mood;
  sleepHours: number;
  /** 1–10. */
  stress: number;
  /** Minutes on the target habit that day. */
  minutesOnHabit: number;
  triggers: TriggerTag[];
  note?: string;
  createdAt: string;
}

export type InterventionKind = "urge_surf" | "reframe" | "swap" | "grounding";

/** Which engine produced a piece of generated content. Surfaced in the UI for honesty. */
export type GenerationSource = "groq" | "gemini" | "demo";

export interface Intervention {
  id: string;
  urgeEventId: string;
  at: string;
  kind: InterventionKind;
  title: string;
  /** Ordered steps, read aloud one at a time. */
  steps: string[];
  /** Closing line delivered after the steps. */
  closing: string;
  durationSec: number;
  generatedBy: GenerationSource;
  helpful?: boolean;
}

/** Result of the dependence-severity screen taken during onboarding. */
export interface SeverityResult {
  /** True when self-directed cessation coaching is unsafe for this habit. */
  requiresMedicalGuidance: boolean;
  level: "self_help" | "seek_support" | "medical_supervision";
  reason: string;
}

export interface Profile {
  /** Single-user local app, so the id is a constant. */
  id: "me";
  displayName: string;
  habit: HabitKind;
  /** User's own words, e.g. "late-night Instagram scrolling". */
  habitLabel: string;
  /** What success looks like, e.g. "under 45 minutes a day". */
  goal: string;
  /** Why it matters — used to personalise generated content. */
  why: string;
  severity: SeverityResult;
  createdAt: string;
  onboardedAt: string | null;
}

/** A generated letter from the user's future self (future-self continuity). */
export interface FutureSelfLetter {
  id: string;
  at: string;
  /** How many years ahead the author is. */
  horizonYears: number;
  body: string;
  generatedBy: GenerationSource;
}

export interface CoachMessage {
  id: string;
  at: string;
  role: "user" | "assistant";
  content: string;
  generatedBy?: GenerationSource;
}
