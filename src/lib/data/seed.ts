/**
 * Seeded demo history.
 *
 * The application ships populated. A reviewer opening any route sees a real 30-day
 * history rather than an empty state, and every list, chart, and statistic has something
 * to show without setup, sign-up, or an API key.
 *
 * Everything derives from a FIXED anchor date rather than the current time. That keeps
 * the server render and the client hydration byte-identical (calling Date.now() during
 * render is the most common cause of hydration errors) and makes the whole app
 * deterministic and testable.
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
import { assessRisk } from "@/lib/risk/vulnerability";

/**
 * The reference "now" for all seeded content. Seeded events occupy the 30 days before
 * this instant, so anything the user creates later sorts naturally after them.
 */
export const DEMO_ANCHOR = new Date("2026-07-18T00:00:00.000Z");

const DAY_MS = 24 * 60 * 60 * 1000;

/** A timestamp N days before the anchor, at a given local hour. */
function ago(days: number, hour: number, minute = 0): string {
  const date = new Date(DEMO_ANCHOR.getTime() - days * DAY_MS);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function dateKey(days: number): string {
  const date = new Date(DEMO_ANCHOR.getTime() - days * DAY_MS);
  return date.toISOString().slice(0, 10);
}

export const SEED_PROFILE: Profile = {
  id: "me",
  displayName: "Sam",
  habit: "screen_time",
  habitLabel: "late-night Instagram and TikTok scrolling",
  goal: "Under 45 minutes a day, and nothing after 10pm",
  why: "I want my evenings back, and I want to stop starting every day already tired.",
  severity: {
    requiresMedicalGuidance: false,
    level: "self_help",
    reason:
      "This is a behavioural habit. Self-directed change with structured plans and " +
      "in-the-moment support is appropriate here.",
  },
  createdAt: ago(30, 9),
  onboardedAt: ago(30, 9),
};

export const SEED_PLANS: Plan[] = [
  {
    id: "plan-bed",
    trigger: "When I get into bed and pick up my phone",
    action: "I will put it face-down on the dresser and read one page of my book",
    rationale:
      "Late-night use is your single biggest driver and it costs you sleep, which lowers your " +
      "control the next day. Moving the phone attacks the cue itself rather than relying on " +
      "willpower at the worst possible hour.",
    tag: "habit_cue",
    source: "ai",
    timesUsed: 14,
    timesWorked: 11,
    active: true,
    createdAt: ago(30, 9),
  },
  {
    id: "plan-queue",
    trigger: "When I feel bored waiting in a queue or a lift",
    action: "I will take one slow breath and find one thing in the room to actually look at",
    rationale:
      "Boredom is your most frequent trigger. Giving it a two-second alternative interrupts the " +
      "automatic reach before it becomes a scroll.",
    tag: "boredom",
    source: "ai",
    timesUsed: 22,
    timesWorked: 16,
    active: true,
    createdAt: ago(30, 9),
  },
  {
    id: "plan-stress",
    trigger: "When I notice I am stressed and reaching for my phone",
    action: "I will stand up, stretch, and drink a glass of water before deciding",
    rationale:
      "Stress-driven scrolling soothes for about a minute and then makes the stress worse. A " +
      "physical action interrupts the loop and addresses the actual arousal.",
    tag: "stress",
    source: "ai",
    timesUsed: 9,
    timesWorked: 6,
    active: true,
    createdAt: ago(24, 20),
  },
  {
    id: "plan-morning",
    trigger: "When I wake up and want to check my phone before getting out of bed",
    action: "I will put my feet on the floor first and open the curtains",
    rationale:
      "Starting the day inside the feed sets the tone for every reach that follows. Morning " +
      "light also helps the sleep cycle you are trying to repair.",
    tag: "habit_cue",
    source: "user",
    timesUsed: 18,
    timesWorked: 15,
    active: true,
    createdAt: ago(18, 8),
  },
  {
    id: "plan-lonely",
    trigger: "When I am scrolling because the flat is quiet and I feel alone",
    action: "I will message one actual person instead of watching strangers",
    rationale:
      "Loneliness-driven scrolling gives the appearance of company without any of the benefit. " +
      "Replacing it with real contact addresses the need underneath.",
    tag: "loneliness",
    source: "ai",
    timesUsed: 6,
    timesWorked: 5,
    active: true,
    createdAt: ago(11, 21),
  },
  {
    id: "plan-retired",
    trigger: "When I open my laptop in the evening",
    action: "I will log out of all social accounts first",
    rationale:
      "Retired because it did not fit how you actually work. Kept for the record — abandoned " +
      "plans are data about what does not suit you.",
    tag: "habit_cue",
    source: "user",
    timesUsed: 3,
    timesWorked: 1,
    active: false,
    createdAt: ago(27, 19),
  },
];

/** Compact spec expanded into full urge events below. */
interface UrgeSpec {
  days: number;
  hour: number;
  intent: string;
  intensity: number;
  trigger: TriggerTag;
  mood: Mood;
  outcome: UrgeOutcome;
  note?: string;
  streakDaysAtTime: number;
}

const URGE_SPECS: UrgeSpec[] = [
  { days: 29, hour: 23, intent: "open Instagram in bed", intensity: 8, trigger: "habit_cue", mood: "restless", outcome: "lapsed", note: "Went in for a minute, came out forty minutes later.", streakDaysAtTime: 0 },
  { days: 28, hour: 22, intent: "check TikTok before sleep", intensity: 7, trigger: "boredom", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 1 },
  { days: 27, hour: 15, intent: "scroll during a work break", intensity: 5, trigger: "procrastination", mood: "low", outcome: "rode_it_out", streakDaysAtTime: 2 },
  { days: 26, hour: 23, intent: "open Instagram in bed", intensity: 9, trigger: "habit_cue", mood: "restless", outcome: "lapsed", note: "Phone was on the pillow. That was the whole problem.", streakDaysAtTime: 3 },
  { days: 24, hour: 20, intent: "doomscroll the news", intensity: 7, trigger: "stress", mood: "anxious", outcome: "partial", note: "Ten minutes instead of an hour. Counting it.", streakDaysAtTime: 1 },
  { days: 23, hour: 12, intent: "check notifications at lunch", intensity: 4, trigger: "boredom", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 2 },
  { days: 22, hour: 22, intent: "open TikTok in bed", intensity: 8, trigger: "tiredness", mood: "restless", outcome: "rode_it_out", note: "Put it on the dresser. Worked.", streakDaysAtTime: 3 },
  { days: 21, hour: 9, intent: "check phone before getting up", intensity: 6, trigger: "habit_cue", mood: "ok", outcome: "lapsed", streakDaysAtTime: 4 },
  { days: 19, hour: 16, intent: "scroll instead of finishing a task", intensity: 6, trigger: "procrastination", mood: "low", outcome: "rode_it_out", streakDaysAtTime: 1 },
  { days: 18, hour: 21, intent: "open Instagram on the sofa", intensity: 7, trigger: "loneliness", mood: "low", outcome: "rode_it_out", note: "Rang my sister instead. Much better evening.", streakDaysAtTime: 2 },
  { days: 17, hour: 23, intent: "just one video before sleep", intensity: 8, trigger: "habit_cue", mood: "restless", outcome: "rode_it_out", streakDaysAtTime: 3 },
  { days: 16, hour: 14, intent: "check phone in a meeting", intensity: 5, trigger: "boredom", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 4 },
  { days: 15, hour: 22, intent: "open TikTok in bed", intensity: 9, trigger: "tiredness", mood: "restless", outcome: "lapsed", note: "Very tired, no plan ready, phone in reach.", streakDaysAtTime: 5 },
  { days: 13, hour: 20, intent: "scroll after an argument", intensity: 9, trigger: "stress", mood: "anxious", outcome: "partial", streakDaysAtTime: 1 },
  { days: 12, hour: 11, intent: "check Instagram at my desk", intensity: 4, trigger: "procrastination", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 2 },
  { days: 11, hour: 21, intent: "scroll because the flat is quiet", intensity: 7, trigger: "loneliness", mood: "low", outcome: "rode_it_out", streakDaysAtTime: 3 },
  { days: 10, hour: 23, intent: "open Instagram in bed", intensity: 7, trigger: "habit_cue", mood: "restless", outcome: "rode_it_out", streakDaysAtTime: 4 },
  { days: 9, hour: 15, intent: "afternoon slump scroll", intensity: 6, trigger: "boredom", mood: "low", outcome: "rode_it_out", streakDaysAtTime: 5 },
  { days: 8, hour: 22, intent: "check TikTok before sleep", intensity: 6, trigger: "tiredness", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 6 },
  { days: 7, hour: 19, intent: "scroll while dinner cooks", intensity: 5, trigger: "boredom", mood: "good", outcome: "rode_it_out", streakDaysAtTime: 7 },
  { days: 6, hour: 23, intent: "one more video", intensity: 8, trigger: "habit_cue", mood: "restless", outcome: "lapsed", note: "Sunday night. Unstructured evening, nothing planned.", streakDaysAtTime: 8 },
  { days: 4, hour: 20, intent: "doomscroll the news", intensity: 7, trigger: "stress", mood: "anxious", outcome: "rode_it_out", streakDaysAtTime: 2 },
  { days: 3, hour: 22, intent: "open Instagram in bed", intensity: 6, trigger: "habit_cue", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 3 },
  { days: 2, hour: 16, intent: "scroll instead of starting work", intensity: 5, trigger: "procrastination", mood: "ok", outcome: "rode_it_out", streakDaysAtTime: 4 },
  { days: 1, hour: 23, intent: "check TikTok before sleep", intensity: 7, trigger: "tiredness", mood: "restless", outcome: "rode_it_out", note: "Ran a breathing session. It passed in about two minutes.", streakDaysAtTime: 5 },
];

export const SEED_CHECKINS: CheckIn[] = [
  { days: 0, mood: "ok" as Mood, sleep: 6.5, stress: 5, minutes: 52, triggers: ["tiredness"] as TriggerTag[] },
  { days: 1, mood: "good" as Mood, sleep: 7.5, stress: 3, minutes: 41, triggers: ["boredom"] as TriggerTag[] },
  { days: 2, mood: "ok" as Mood, sleep: 7, stress: 4, minutes: 48, triggers: ["procrastination"] as TriggerTag[] },
  { days: 3, mood: "good" as Mood, sleep: 8, stress: 3, minutes: 38, triggers: [] as TriggerTag[] },
  { days: 4, mood: "anxious" as Mood, sleep: 5.5, stress: 8, minutes: 96, triggers: ["stress"] as TriggerTag[] },
  { days: 5, mood: "ok" as Mood, sleep: 7, stress: 5, minutes: 55, triggers: ["boredom"] as TriggerTag[] },
  { days: 6, mood: "low" as Mood, sleep: 5, stress: 7, minutes: 142, triggers: ["habit_cue", "loneliness"] as TriggerTag[] },
  { days: 7, mood: "good" as Mood, sleep: 8, stress: 2, minutes: 35, triggers: [] as TriggerTag[] },
  { days: 8, mood: "ok" as Mood, sleep: 7, stress: 4, minutes: 47, triggers: ["tiredness"] as TriggerTag[] },
  { days: 9, mood: "low" as Mood, sleep: 6, stress: 6, minutes: 71, triggers: ["boredom"] as TriggerTag[] },
  { days: 10, mood: "ok" as Mood, sleep: 7, stress: 4, minutes: 44, triggers: ["habit_cue"] as TriggerTag[] },
  { days: 12, mood: "ok" as Mood, sleep: 6.5, stress: 5, minutes: 58, triggers: ["procrastination"] as TriggerTag[] },
  { days: 13, mood: "anxious" as Mood, sleep: 5, stress: 9, minutes: 118, triggers: ["stress"] as TriggerTag[] },
  { days: 15, mood: "restless" as Mood, sleep: 5.5, stress: 7, minutes: 134, triggers: ["tiredness", "habit_cue"] as TriggerTag[] },
].map((spec) => ({
  id: `checkin-${dateKey(spec.days)}`,
  date: dateKey(spec.days),
  mood: spec.mood,
  sleepHours: spec.sleep,
  stress: spec.stress,
  minutesOnHabit: spec.minutes,
  triggers: spec.triggers,
  createdAt: ago(spec.days, 21),
}));

/** Expand the compact specs into full events, computing each risk score honestly. */
export const SEED_URGES: UrgeEvent[] = URGE_SPECS.map((spec, index) => {
  const at = ago(spec.days, spec.hour);
  const priorCheckIns = SEED_CHECKINS.filter((c) => c.createdAt < at);
  const risk = assessRisk({
    intensity: spec.intensity,
    trigger: spec.trigger,
    at: new Date(at),
    history: [],
    checkIns: priorCheckIns,
    streakDays: spec.streakDaysAtTime,
  });

  return {
    id: `urge-${String(index + 1).padStart(2, "0")}`,
    at,
    intent: spec.intent,
    intensity: spec.intensity,
    trigger: spec.trigger,
    mood: spec.mood,
    risk,
    outcome: spec.outcome,
    outcomeAt: at,
    note: spec.note,
    interventionId: spec.outcome === "rode_it_out" ? `intervention-${index + 1}` : undefined,
  };
});

export const SEED_INTERVENTIONS: Intervention[] = SEED_URGES.filter(
  (urge) => urge.interventionId,
).map((urge, index) => ({
  id: urge.interventionId as string,
  urgeEventId: urge.id,
  at: urge.at,
  kind: index % 3 === 0 ? "urge_surf" : index % 3 === 1 ? "grounding" : "swap",
  title:
    index % 3 === 0 ? "Ride this one out" : index % 3 === 1 ? "Name it and let it pass" : "Two minutes of something else",
  steps: [
    "Put both feet flat on the floor and let your shoulders drop.",
    "Breathe in for four, hold for four, out for six. Three times.",
    "Notice where the urge sits in your body. Just locate it.",
    "Watch it like a wave rather than an order. It will crest and fall.",
  ],
  closing: "You did not need to win an argument with it. You just outlasted it.",
  durationSec: 90,
  generatedBy: "demo",
  helpful: index % 4 !== 3,
}));

export const SEED_COACH_MESSAGES: CoachMessage[] = [
  {
    id: "coach-1",
    at: ago(2, 21),
    role: "user",
    content: "I keep doing well all day and then losing it completely at night.",
  },
  {
    id: "coach-2",
    at: ago(2, 21, 1),
    role: "assistant",
    generatedBy: "demo",
    content:
      "That pattern makes a lot of sense, and it is not a character problem. Self-control is not " +
      "a fixed trait — it draws down over the day, and by eleven at night you are working with " +
      "much less of it than you had at nine in the morning. What does the moment just before it " +
      "happen usually look like for you?",
  },
  {
    id: "coach-3",
    at: ago(2, 21, 4),
    role: "user",
    content: "I get into bed, I am tired, and the phone is right there on the pillow.",
  },
  {
    id: "coach-4",
    at: ago(2, 21, 5),
    role: "assistant",
    generatedBy: "demo",
    content:
      "Then the phone being on the pillow is doing more work than your willpower ever will. That " +
      "is genuinely good news, because a phone on a dresser is a much easier problem to solve " +
      "than being tired. What would need to be true for it to end up across the room instead?",
  },
];

/** Everything the app starts with. */
export const SEED_STATE = {
  profile: SEED_PROFILE,
  plans: SEED_PLANS,
  urges: SEED_URGES,
  checkIns: SEED_CHECKINS,
  interventions: SEED_INTERVENTIONS,
  coachMessages: SEED_COACH_MESSAGES,
} as const;
