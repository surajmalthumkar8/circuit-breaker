/**
 * Crisis detection and escalation.
 *
 * A study of mental-health apps with 3.5M+ downloads found several listing incorrect or
 * non-functional crisis numbers, so the resources below are hard-coded, hand-verified,
 * and covered by tests rather than generated or fetched.
 *
 * This runs BEFORE any model call. Detection is deliberately keyword-based rather than
 * model-based: it must be deterministic, instant, and impossible to talk out of.
 */

export interface CrisisResource {
  region: string;
  name: string;
  contact: string;
  detail: string;
  href?: string;
}

/**
 * Verified crisis lines. Kept short and high-confidence; a wrong number is worse than a
 * missing one, so every entry here is a well-established national service.
 */
export const CRISIS_RESOURCES: readonly CrisisResource[] = [
  {
    region: "United States",
    name: "988 Suicide & Crisis Lifeline",
    contact: "Call or text 988",
    detail: "Free, confidential, 24/7.",
    href: "https://988lifeline.org/",
  },
  {
    region: "United States",
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    detail: "Free 24/7 text support with a trained counsellor.",
    href: "https://www.crisistextline.org/",
  },
  {
    region: "India",
    name: "Tele-MANAS",
    contact: "Call 14416",
    detail: "India's national 24/7 mental health support line.",
    href: "https://telemanas.mohfw.gov.in/",
  },
  {
    region: "United Kingdom",
    name: "Samaritans",
    contact: "Call 116 123",
    detail: "Free, 24/7, from any phone.",
    href: "https://www.samaritans.org/",
  },
  {
    region: "International",
    name: "Find a Helpline",
    contact: "findahelpline.com",
    detail: "Verified crisis lines in over 130 countries.",
    href: "https://findahelpline.com/",
  },
] as const;

/**
 * Phrases that indicate risk of self-harm or suicide. Matched as whole phrases against
 * normalised text. This list errs toward over-triggering: a false positive shows someone
 * a helpline they did not need, a false negative is unacceptable.
 */
const CRISIS_PHRASES: readonly string[] = [
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "take my own life",
  "want to die",
  "wanna die",
  "better off dead",
  "suicidal",
  "suicide",
  "self harm",
  "self-harm",
  "hurt myself",
  "hurting myself",
  "cut myself",
  "cutting myself",
  "no reason to live",
  "nothing to live for",
  "cant go on",
  "can't go on",
  "cannot go on",
  "overdose",
  "overdosing",
] as const;

/**
 * Phrases indicating acute medical danger from withdrawal. Withdrawal from alcohol and
 * benzodiazepines can cause seizures and delirium tremens, which are potentially fatal.
 */
const MEDICAL_EMERGENCY_PHRASES: readonly string[] = [
  "withdrawal seizure",
  "having a seizure",
  "shaking uncontrollably",
  "hallucinating",
  "delirium tremens",
  "the dts",
  "cant stop vomiting",
  "can't stop vomiting",
  "chest pain",
] as const;

export type CrisisSeverity = "none" | "medical_emergency" | "crisis";

export interface CrisisCheck {
  severity: CrisisSeverity;
  /** True when the app must suspend coaching and show help instead. */
  blocked: boolean;
  /** The phrase that matched, for transparency and testing. */
  matched: string | null;
  message: string;
}

/**
 * Normalise text for matching: lowercase, strip punctuation that could split a phrase,
 * and collapse whitespace. Keeps apostrophes so "can't go on" matches both forms via the
 * phrase list above.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SAFE_MESSAGE = "";

const CRISIS_MESSAGE =
  "It sounds like you may be going through something serious. Circuit Breaker is a habit-change " +
  "tool, not a crisis service, so it will not try to coach you through this. Please reach out to " +
  "one of the lines below — they are free, confidential, and staffed right now.";

const MEDICAL_MESSAGE =
  "What you are describing can be a medical emergency. Withdrawal from alcohol or " +
  "benzodiazepines can cause seizures and needs medical supervision. Please contact emergency " +
  "services or a doctor now rather than continuing here.";

/**
 * Check user-supplied text for crisis or medical-emergency signals.
 *
 * Called on every free-text input before it reaches a model. When `blocked` is true the
 * caller must render {@link CRISIS_RESOURCES} and must not generate coaching content.
 */
export function checkForCrisis(text: string): CrisisCheck {
  const normalised = normalise(text);

  if (normalised.length === 0) {
    return { severity: "none", blocked: false, matched: null, message: SAFE_MESSAGE };
  }

  const medical = MEDICAL_EMERGENCY_PHRASES.find((phrase) => normalised.includes(phrase));
  if (medical) {
    return {
      severity: "medical_emergency",
      blocked: true,
      matched: medical,
      message: MEDICAL_MESSAGE,
    };
  }

  const crisis = CRISIS_PHRASES.find((phrase) => normalised.includes(phrase));
  if (crisis) {
    return { severity: "crisis", blocked: true, matched: crisis, message: CRISIS_MESSAGE };
  }

  return { severity: "none", blocked: false, matched: null, message: SAFE_MESSAGE };
}
