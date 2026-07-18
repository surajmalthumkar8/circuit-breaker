/**
 * Dependence severity screening.
 *
 * The single most important safety rule in this application: it must never coach abrupt,
 * unsupervised cessation of alcohol or benzodiazepines. Withdrawal from these can cause
 * seizures and delirium tremens, which are potentially fatal, with danger peaking 24–72
 * hours after the last dose. Behavioural habits (screen time, social media, gaming, junk
 * food) carry no such risk and are safe for self-directed change.
 */

import type { HabitKind, SeverityResult } from "@/lib/domain/types";
import { MEDICAL_RISK_HABITS } from "@/lib/domain/types";

export interface SeverityInput {
  habit: HabitKind;
  /** Roughly how many days per week the habit occurs, 0–7. */
  daysPerWeek: number;
  /** Has the user experienced physical symptoms when stopping before? */
  physicalSymptomsOnStopping: boolean;
  /** Has a previous attempt to stop failed? Raises support level, not medical level. */
  previousFailedAttempts: boolean;
}

const SELF_HELP_REASON =
  "This is a behavioural habit. Self-directed change with structured plans and in-the-moment " +
  "support is appropriate here.";

const SEEK_SUPPORT_REASON =
  "You have tried before and it did not stick. That is normal and it is data, not failure — but " +
  "pairing this app with a counsellor or support group meaningfully improves the odds.";

const MEDICAL_REASON =
  "Stopping this substance without medical supervision can be dangerous. Withdrawal from alcohol " +
  "can cause seizures and delirium tremens, which can be fatal. Circuit Breaker will help you " +
  "track and prepare, but it will not coach you to stop on your own — please speak to a doctor " +
  "or a medically supervised detox service first.";

const PHYSICAL_SYMPTOMS_REASON =
  "You have had physical symptoms when stopping before. That indicates physical dependence, which " +
  "needs medical supervision rather than a self-help app. Please speak to a doctor first.";

/**
 * Screen a habit for whether self-directed cessation coaching is safe.
 *
 * Escalates to `medical_supervision` when either the substance itself carries withdrawal
 * risk, or the user reports physical symptoms on stopping — regardless of habit type,
 * because physical symptoms indicate physical dependence.
 */
export function screenSeverity(input: SeverityInput): SeverityResult {
  const isMedicalRiskSubstance = MEDICAL_RISK_HABITS.includes(input.habit);

  if (isMedicalRiskSubstance) {
    return {
      requiresMedicalGuidance: true,
      level: "medical_supervision",
      reason: MEDICAL_REASON,
    };
  }

  if (input.physicalSymptomsOnStopping) {
    return {
      requiresMedicalGuidance: true,
      level: "medical_supervision",
      reason: PHYSICAL_SYMPTOMS_REASON,
    };
  }

  if (input.previousFailedAttempts && input.daysPerWeek >= 5) {
    return {
      requiresMedicalGuidance: false,
      level: "seek_support",
      reason: SEEK_SUPPORT_REASON,
    };
  }

  return {
    requiresMedicalGuidance: false,
    level: "self_help",
    reason: SELF_HELP_REASON,
  };
}
