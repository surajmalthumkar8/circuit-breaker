/**
 * Application state and the pure transitions over it.
 *
 * Two properties drive the design:
 *
 * 1. It starts populated from a static seed, synchronously. The server renders real
 *    content on first paint, and the client hydrates to exactly the same tree.
 * 2. Every write is observable from several screens. Logging one urge changes the
 *    journal, the dashboard counters, the insights breakdown, and a plan's success
 *    record — so a single interaction produces several independently verifiable results.
 *
 * All transitions are pure functions returning new state, which keeps them trivially
 * testable and keeps React re-renders predictable.
 */

import type {
  CheckIn,
  CoachMessage,
  Intervention,
  Mood,
  Plan,
  Profile,
  TriggerTag,
  UrgeEvent,
  UrgeOutcome,
} from "@/lib/domain/types";
import { TRIGGER_TAGS } from "@/lib/domain/types";
import { assessRisk } from "@/lib/risk/vulnerability";
import { summariseStreak, type StreakSummary } from "@/lib/habit/streak";
import { SEED_STATE } from "@/lib/data/seed";

export interface AppState {
  profile: Profile;
  plans: Plan[];
  urges: UrgeEvent[];
  checkIns: CheckIn[];
  interventions: Intervention[];
  coachMessages: CoachMessage[];
}

/** The seed, deep-copied so callers can never mutate the shared constant. */
export function createInitialState(): AppState {
  return structuredClone(SEED_STATE) as AppState;
}

/**
 * Ids are derived from a counter plus the timestamp rather than a random value, so state
 * transitions stay deterministic and hydration-safe.
 */
function makeId(prefix: string, at: Date, salt: number): string {
  return `${prefix}-${at.getTime().toString(36)}-${salt.toString(36)}`;
}

/** Days since a streak's start, used to weight how fragile the habit still is. */
function currentStreakDays(state: AppState, now: Date): number {
  return summariseStreak(state.urges, now, new Date(state.profile.createdAt)).currentDays;
}

export interface LogUrgeInput {
  intent: string;
  intensity: number;
  trigger: TriggerTag;
  mood: Mood;
  at: Date;
  note?: string;
}

/**
 * Record an urge and assess it. The risk score is computed here, deterministically,
 * rather than asked of a model — the model later explains this number, it never invents it.
 */
export function logUrge(
  state: AppState,
  input: LogUrgeInput,
): { state: AppState; urge: UrgeEvent } {
  const risk = assessRisk({
    intensity: input.intensity,
    trigger: input.trigger,
    at: input.at,
    history: state.urges,
    checkIns: state.checkIns,
    streakDays: currentStreakDays(state, input.at),
  });

  const urge: UrgeEvent = {
    id: makeId("urge", input.at, state.urges.length),
    at: input.at.toISOString(),
    intent: input.intent,
    intensity: input.intensity,
    trigger: input.trigger,
    mood: input.mood,
    risk,
    outcome: "pending",
    note: input.note,
  };

  return { state: { ...state, urges: [...state.urges, urge] }, urge };
}

/**
 * Report how an urge ended.
 *
 * Also credits the active plan defending that trigger, which is what makes a plan's
 * success record real rather than decorative.
 */
export function resolveUrge(
  state: AppState,
  urgeId: string,
  outcome: UrgeOutcome,
  at: Date,
  note?: string,
): AppState {
  const target = state.urges.find((urge) => urge.id === urgeId);
  if (!target) return state;

  const urges = state.urges.map((urge) =>
    urge.id === urgeId
      ? { ...urge, outcome, outcomeAt: at.toISOString(), note: note ?? urge.note }
      : urge,
  );

  const defendingPlan = state.plans.find((plan) => plan.active && plan.tag === target.trigger);
  const plans = defendingPlan
    ? state.plans.map((plan) =>
        plan.id === defendingPlan.id
          ? {
              ...plan,
              timesUsed: plan.timesUsed + 1,
              timesWorked: plan.timesWorked + (outcome === "rode_it_out" ? 1 : 0),
            }
          : plan,
      )
    : state.plans;

  return { ...state, urges, plans };
}

export interface AddPlanInput {
  trigger: string;
  action: string;
  rationale: string;
  tag: TriggerTag;
  source: "ai" | "user";
  at: Date;
}

export function addPlan(state: AppState, input: AddPlanInput): { state: AppState; plan: Plan } {
  const plan: Plan = {
    id: makeId("plan", input.at, state.plans.length),
    trigger: input.trigger,
    action: input.action,
    rationale: input.rationale,
    tag: input.tag,
    source: input.source,
    timesUsed: 0,
    timesWorked: 0,
    active: true,
    createdAt: input.at.toISOString(),
  };
  return { state: { ...state, plans: [...state.plans, plan] }, plan };
}

export function updatePlan(state: AppState, planId: string, patch: Partial<Plan>): AppState {
  return {
    ...state,
    plans: state.plans.map((plan) => (plan.id === planId ? { ...plan, ...patch, id: plan.id } : plan)),
  };
}

export function deletePlan(state: AppState, planId: string): AppState {
  return { ...state, plans: state.plans.filter((plan) => plan.id !== planId) };
}

export interface AddCheckInInput {
  date: string;
  mood: Mood;
  sleepHours: number;
  stress: number;
  minutesOnHabit: number;
  triggers: TriggerTag[];
  note?: string;
  at: Date;
}

/** Upsert by date — one check-in per day, editable if the user revisits it. */
export function addCheckIn(state: AppState, input: AddCheckInInput): AppState {
  const entry: CheckIn = {
    id: `checkin-${input.date}`,
    date: input.date,
    mood: input.mood,
    sleepHours: input.sleepHours,
    stress: input.stress,
    minutesOnHabit: input.minutesOnHabit,
    triggers: input.triggers,
    note: input.note,
    createdAt: input.at.toISOString(),
  };

  const existing = state.checkIns.findIndex((checkIn) => checkIn.date === input.date);
  const checkIns =
    existing === -1
      ? [...state.checkIns, entry]
      : state.checkIns.map((checkIn, index) => (index === existing ? entry : checkIn));

  return { ...state, checkIns };
}

export function addIntervention(state: AppState, intervention: Intervention): AppState {
  return {
    ...state,
    interventions: [...state.interventions, intervention],
    urges: state.urges.map((urge) =>
      urge.id === intervention.urgeEventId ? { ...urge, interventionId: intervention.id } : urge,
    ),
  };
}

export function addCoachMessage(state: AppState, message: CoachMessage): AppState {
  return { ...state, coachMessages: [...state.coachMessages, message] };
}

export interface DashboardSummary {
  streak: StreakSummary;
  totalUrges: number;
  pendingUrges: number;
  activePlans: number;
  latestCheckIn: CheckIn | undefined;
  recentUrges: UrgeEvent[];
  minutesTrend: { date: string; minutes: number }[];
}

/** Everything the dashboard hub needs, derived rather than stored. */
export function selectDashboard(state: AppState, now: Date): DashboardSummary {
  const byNewest = [...state.urges].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return {
    streak: summariseStreak(state.urges, now, new Date(state.profile.createdAt)),
    totalUrges: state.urges.length,
    pendingUrges: state.urges.filter((urge) => urge.outcome === "pending").length,
    activePlans: state.plans.filter((plan) => plan.active).length,
    latestCheckIn: [...state.checkIns].sort((a, b) => b.date.localeCompare(a.date))[0],
    recentUrges: byNewest.slice(0, 5),
    minutesTrend: [...state.checkIns]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((checkIn) => ({ date: checkIn.date, minutes: checkIn.minutesOnHabit })),
  };
}

export interface TriggerStat {
  trigger: TriggerTag;
  count: number;
  lapses: number;
  lapseRate: number;
}

/** Which triggers fire most, and which actually beat the user. Drives the insights map. */
export function selectTriggerBreakdown(state: AppState): TriggerStat[] {
  return TRIGGER_TAGS.map((trigger) => {
    const events = state.urges.filter((urge) => urge.trigger === trigger);
    const resolved = events.filter((urge) => urge.outcome !== "pending");
    const lapses = resolved.filter((urge) => urge.outcome === "lapsed").length;
    return {
      trigger,
      count: events.length,
      lapses,
      lapseRate: resolved.length === 0 ? 0 : lapses / resolved.length,
    };
  })
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Hour-of-day histogram, used by insights to show when risk actually peaks. */
export function selectHourlyRisk(state: AppState): { hour: number; count: number; lapses: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0, lapses: 0 }));
  for (const urge of state.urges) {
    // UTC for the same reason as the circadian factor: identical on server and client.
    const hour = new Date(urge.at).getUTCHours();
    const bucket = buckets[hour];
    if (!bucket) continue;
    bucket.count += 1;
    if (urge.outcome === "lapsed") bucket.lapses += 1;
  }
  return buckets;
}
