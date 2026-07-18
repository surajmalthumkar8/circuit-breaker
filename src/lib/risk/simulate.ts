/**
 * Counterfactual levers.
 *
 * The risk score tells someone how bad this moment is. That is only half of what is
 * useful — the other half is which single thing would most change it. This module answers
 * that by re-running the real scoring function with one variable moved to its healthy
 * value and reporting the difference.
 *
 * It re-runs the model rather than reading the weights table on purpose. Reading weights
 * would report the maximum a factor *could* contribute; re-running reports what it
 * actually contributes for this person at this moment, after clamping and the sub-linear
 * curves inside each factor. The two diverge, and only the second is honest.
 *
 * Everything here is pure, for the same reason the scorer is: a number a user is asked to
 * act on should be reproducible and testable, not the output of a language model.
 */

import { assessRisk, type RiskInput } from "./vulnerability";
import type { CheckIn } from "@/lib/domain/types";

export const LEVER_KEYS = ["sleep", "stress", "timing", "craving", "maturity"] as const;

export type LeverKey = (typeof LEVER_KEYS)[number];

export interface Lever {
  key: LeverKey;
  label: string;
  /** What the person would actually do to realise this. */
  action: string;
  /** Score with nothing changed. */
  baseline: number;
  /** Score with this one variable moved to its healthy value. */
  improved: number;
  /** Points removed. Always >= 0, so a bigger number is a better lever. */
  delta: number;
}

/** A rested, unstressed stand-in used when the person has never checked in. */
const NEUTRAL_CHECK_IN: CheckIn = {
  id: "simulated",
  date: "1970-01-01",
  mood: "ok",
  sleepHours: 7,
  stress: 5,
  minutesOnHabit: 0,
  triggers: [],
  createdAt: "1970-01-01T00:00:00.000Z",
};

/**
 * Replace the check-in the scorer would pick — the most recent one — leaving the rest of
 * the history untouched. Returns a new array; the caller's input is never mutated.
 */
function withLatestCheckIn(
  checkIns: CheckIn[],
  patch: Partial<CheckIn>,
): CheckIn[] {
  if (checkIns.length === 0) return [{ ...NEUTRAL_CHECK_IN, ...patch }];
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const [latest, ...rest] = sorted as [CheckIn, ...CheckIn[]];
  return [{ ...latest, ...patch }, ...rest];
}

/** Same instant, moved to 9am UTC — the model's lowest-risk window. */
function atMorning(at: Date): Date {
  const morning = new Date(at.getTime());
  morning.setUTCHours(9, 0, 0, 0);
  return morning;
}

interface LeverSpec {
  key: LeverKey;
  label: string;
  action: string;
  apply: (input: RiskInput) => RiskInput;
}

const SPECS: LeverSpec[] = [
  {
    key: "sleep",
    label: "A full night's sleep",
    action: "Eight hours instead of what you logged last.",
    apply: (input) => ({
      ...input,
      checkIns: withLatestCheckIn(input.checkIns, { sleepHours: 8 }),
    }),
  },
  {
    key: "stress",
    label: "Lower stress",
    action: "Bring the day's stress down to a 2 out of 10.",
    apply: (input) => ({
      ...input,
      checkIns: withLatestCheckIn(input.checkIns, { stress: 2 }),
    }),
  },
  {
    key: "timing",
    label: "Facing it in the morning",
    action: "Move the decision to 9am, when prefrontal control is highest.",
    apply: (input) => ({ ...input, at: atMorning(input.at) }),
  },
  {
    key: "craving",
    label: "Riding the craving down",
    action: "Urge-surf until the peak passes — cravings crest and fall within minutes.",
    apply: (input) => ({ ...input, intensity: 1 }),
  },
  {
    key: "maturity",
    label: "A mature routine",
    action: "Reach roughly 66 days, where the replacement routine is close to automatic.",
    apply: (input) => ({ ...input, streakDays: 66 }),
  },
];

/**
 * Score the moment, then score it again with each lever pulled on its own.
 *
 * @returns one lever per modelled intervention, ordered by how much it actually reduces
 * the score. `delta` is floored at zero: a lever that cannot help is reported as no help
 * rather than as harm, since the interface offers these as suggested actions.
 */
export function counterfactuals(input: RiskInput): Lever[] {
  const baseline = assessRisk(input).score;

  return SPECS.map((spec) => {
    const improved = assessRisk(spec.apply(input)).score;
    return {
      key: spec.key,
      label: spec.label,
      action: spec.action,
      baseline,
      improved: Math.min(improved, baseline),
      delta: Math.max(0, baseline - improved),
    };
  }).sort((a, b) => b.delta - a.delta);
}
