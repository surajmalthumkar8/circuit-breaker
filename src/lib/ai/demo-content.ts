/**
 * Deterministic fallback content.
 *
 * The application must be fully explorable with no API key configured — for reviewers,
 * for offline use, for the test suite, and as the last rung when a live provider is rate
 * limited or down. Every response here is hand-authored to satisfy the same schema the
 * model must satisfy, so the interface cannot tell the difference structurally.
 *
 * Selection is keyed off the request so the same situation always yields the same
 * content: deterministic, never random, which keeps server and client render identical.
 */

import type {
  GeneratedFutureSelf,
  GeneratedIntervention,
  GeneratedPostMortem,
  GeneratedRiskNarrative,
  TaskName,
} from "@/lib/ai/schemas";
import type { RiskState, TriggerTag } from "@/lib/domain/types";

/** Stable hash so the same input always selects the same variant. */
function pick<T>(options: readonly T[], seed: string): T {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  const chosen = options[Math.abs(hash) % options.length];
  // options is always non-empty at every call site below.
  return chosen as T;
}

const URGE_SURF_SCRIPTS: readonly GeneratedIntervention[] = [
  {
    title: "Ride this one out",
    kind: "urge_surf",
    steps: [
      "Put both feet flat on the floor and let your shoulders drop away from your ears.",
      "Breathe in for four counts, hold for four, and out slowly for six. Do that three times.",
      "Notice where the urge actually sits in your body. Chest, throat, hands. Just locate it.",
      "Watch it like a wave rather than an order. It rose, it will crest, and it will fall.",
      "It is already changing. Cravings peak in a few minutes and then subside on their own.",
    ],
    closing: "You did not need to win an argument with it. You just outlasted it.",
    durationSec: 90,
  },
  {
    title: "Name it and let it pass",
    kind: "grounding",
    steps: [
      "Say quietly, out loud if you can: this is a craving, and cravings pass.",
      "Name five things you can see, then four you can hear, then three you can feel.",
      "Take one slow breath in through the nose and a longer one out through the mouth.",
      "Ask what you actually wanted from the scroll. Rest, distraction, company, or numbing?",
      "Give yourself the real version of that thing for the next two minutes instead.",
    ],
    closing: "The want underneath is real. The scroll was just the fastest fake version of it.",
    durationSec: 100,
  },
  {
    title: "Two minutes of something else",
    kind: "swap",
    steps: [
      "Stand up and move to a different room, or at least a different chair.",
      "Set a timer for two minutes and do one small physical thing: water, stretch, window.",
      "Breathe out longer than you breathe in while you do it.",
      "When the timer ends, check the urge again and rate it out of ten.",
      "If it dropped even a point, that is the loop weakening. That is the whole mechanism.",
    ],
    closing: "You changed the context, and the cue lost most of its power.",
    durationSec: 120,
  },
];

const RISK_NARRATIVES: Record<RiskState, GeneratedRiskNarrative> = {
  steady: {
    summary:
      "You are in a strong position right now. Sleep and stress are working in your favour and " +
      "nothing in your recent pattern suggests an imminent pull. This is the best time to do " +
      "the boring, useful work: tidy your plans and set up the environment for tonight.",
    watchFor: [
      "The late-evening window, which has been your weakest hour historically",
      "Unstructured time after dinner with the phone within reach",
    ],
    suggestion:
      "Put one plan in place now for tonight, while it is cheap to decide. Deciding in advance " +
      "is far easier than deciding in the moment.",
  },
  tempted: {
    summary:
      "You are tempted but still steady. The pull is real and you are noticing it, which is the " +
      "part that matters — noticing is what gives you a choice at all. Your history says urges " +
      "like this one usually fade within a few minutes if you give them somewhere else to go.",
    watchFor: [
      "Reaching for the phone without deciding to",
      "Telling yourself it is only a few minutes",
      "Tiredness quietly lowering your threshold",
    ],
    suggestion:
      "Run a short urge-surfing session before you do anything else. Ninety seconds is usually " +
      "enough to get past the peak.",
  },
  high_risk: {
    summary:
      "This is a high-risk moment and it deserves to be treated as one. Late hours, a strong " +
      "craving, and a trigger that has caught you before are stacking together. None of that " +
      "means you will lapse — it means the automatic route is unusually cheap right now, so " +
      "the deliberate route needs to be made cheaper.",
    watchFor: [
      "Bargaining with yourself about just one look",
      "Being alone, tired, and unobserved at once",
      "The phone being physically within arm's reach",
    ],
    suggestion:
      "Change your physical context first — put the phone in another room — then run an " +
      "urge-surfing session. Do the environment change before the willpower part.",
  },
  crisis: {
    summary:
      "Support matters more than coaching right now. This app is not the right tool for what " +
      "you are describing, and there are people available who are.",
    watchFor: ["Being alone with this"],
    suggestion: "Please reach out to one of the crisis lines listed on the Support page.",
  },
};

const POST_MORTEMS: readonly GeneratedPostMortem[] = [
  {
    reframe:
      "A lapse is information, not a verdict. Habit research is clear that missing once does not " +
      "reset your progress — what turns a slip into a relapse is deciding the whole attempt is " +
      "ruined. It is not. You logged it, which most people never do.",
    whatHappened:
      "The cue arrived at a moment when your capacity was already low, and there was no " +
      "pre-decided alternative ready, so the automatic route was the cheapest one available.",
    nextTime:
      "The fix is not more willpower at the same moment. It is making the automatic route more " +
      "expensive and the alternative route nearly free, before that moment arrives.",
    newPlan: {
      trigger: "When I get into bed and reach for my phone",
      action: "I will put it on the dresser across the room and open the book on my nightstand",
      rationale:
        "This attacks the cue rather than the craving. Distance adds just enough friction that " +
        "the deliberate choice has time to happen.",
      tag: "habit_cue",
    },
  },
];

const FUTURE_SELF: GeneratedFutureSelf = {
  horizonYears: 5,
  body:
    "I want to tell you something that took me a while to understand: you did not fix this by " +
    "becoming a different person. You fixed it by making a hundred small, boring decisions when " +
    "nobody was watching.\n\n" +
    "The nights you rode out an urge instead of scrolling — you barely remember any of them " +
    "individually. That is the strange part. None of them felt like turning points. They felt " +
    "like ordinary Tuesdays where you were slightly bored and went to sleep anyway.\n\n" +
    "What I do remember is what came back. Reading again, properly, for an hour without reaching " +
    "for anything. Mornings that started before the first notification. Conversations where I was " +
    "actually there for the whole thing.\n\n" +
    "You are going to lapse a few more times. Please do not treat those nights as proof of " +
    "anything. Every time you logged one instead of hiding it, you learned something specific " +
    "about your own triggers, and that is genuinely how this got easier.\n\n" +
    "Keep going. It works, and it works faster than you think it will.",
};

const COACH_REPLIES: readonly string[] = [
  "That sounds genuinely difficult, and it makes sense that the pull is strong at that hour. " +
    "What do you think you are usually reaching for when it hits — rest, distraction, or company? " +
    "There is no wrong answer here, I am just curious what it does for you.",
  "Thank you for saying that plainly. Before we look at what to change, what has actually worked " +
    "for you before, even once, even a little? I would rather build on something you have already " +
    "proved you can do than hand you a new system.",
  "It is worth noticing that you spotted it at all. That is the part that gives you a choice. " +
    "What would a version of tonight that you would feel okay about tomorrow look like — not a " +
    "perfect one, just an okay one?",
  "That is a real trade-off and I do not want to talk you out of it. On a scale of one to ten, " +
    "how much do you want this change right now? Whatever number you give, I am interested in why " +
    "it is not lower.",
];

const NUDGES = {
  nudges: [
    {
      window: "10:30 pm",
      headline: "Your phone is about to get very interesting",
      body: "This is the hour it usually happens. Put it on the dresser now, while it is still easy.",
    },
    {
      window: "3:00 pm",
      headline: "The afternoon dip is arriving",
      body: "You have logged three urges in this window. A two-minute walk usually resets it.",
    },
    {
      window: "Sunday evening",
      headline: "Sunday nights have been your hardest",
      body: "Nothing is wrong with you. Unstructured time plus tiredness is just a strong combination.",
    },
  ],
};

const DEMO_PLANS = {
  plans: [
    {
      trigger: "When I get into bed and pick up my phone",
      action: "I will put it face-down on the dresser and read one page of a book",
      rationale:
        "Late-night use is the single biggest driver of screen time and it costs you sleep, " +
        "which lowers your control the following day. Moving the phone attacks the cue itself.",
      tag: "habit_cue" as const,
    },
    {
      trigger: "When I feel bored waiting in a queue or a lift",
      action: "I will take one slow breath and look at something in the room instead",
      rationale:
        "Boredom is your most common trigger. Giving it a two-second alternative stops the " +
        "automatic reach before it starts.",
      tag: "boredom" as const,
    },
    {
      trigger: "When I notice I am stressed and reaching for my phone",
      action: "I will stand up, stretch, and drink a glass of water first",
      rationale:
        "Stress-driven scrolling is soothing for about a minute and then makes the stress worse. " +
        "A physical action interrupts the loop and actually addresses the arousal.",
      tag: "stress" as const,
    },
  ],
};

export interface DemoRequest {
  task: TaskName;
  riskState?: RiskState;
  trigger?: TriggerTag;
  seed?: string;
}

/**
 * Return schema-valid content for a task without calling any provider.
 * Deterministic: the same request always produces the same result.
 */
export function demoContentFor(request: DemoRequest): unknown {
  const seed = `${request.task}:${request.riskState ?? ""}:${request.trigger ?? ""}:${request.seed ?? ""}`;

  switch (request.task) {
    case "intervention":
      return pick(URGE_SURF_SCRIPTS, seed);
    case "plans":
      return DEMO_PLANS;
    case "risk_narrative":
      return RISK_NARRATIVES[request.riskState ?? "tempted"];
    case "post_mortem":
      return pick(POST_MORTEMS, seed);
    case "future_self":
      return FUTURE_SELF;
    case "coach_reply":
      return { reply: pick(COACH_REPLIES, seed) };
    case "nudges":
      return NUDGES;
  }
}
