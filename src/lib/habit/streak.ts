/**
 * Resilience streak.
 *
 * Lally et al. (2010) tracked habit formation over 12 weeks and found that missing a
 * single day did NOT reset the automaticity curve — consistency matters more than
 * perfection. Marlatt's relapse-prevention model adds that treating a lapse as total
 * failure is what converts one slip into a full relapse (the abstinence-violation
 * effect).
 *
 * So this streak is deliberately not a fragile chain. A lapse costs progress but does not
 * erase it, and the interface never says "streak lost".
 */

import type { UrgeEvent } from "@/lib/domain/types";

export interface StreakSummary {
  /** Consecutive days since the most recent lapse. */
  currentDays: number;
  /** Best run achieved so far. */
  bestDays: number;
  /** Urges consciously resisted, all time. */
  urgesRidden: number;
  /** Lapses recorded, all time. Shown without judgement. */
  lapses: number;
  /** Share of resolved urges that were ridden out, 0–1. */
  resilienceRate: number;
  /** Copy that never frames a lapse as failure. */
  message: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two instants, floored, never negative. */
function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

function messageFor(currentDays: number, lapses: number, resilienceRate: number): string {
  if (lapses === 0 && currentDays === 0) {
    return "You are just getting started. The first ride-out is the one that proves it works.";
  }
  if (currentDays === 0) {
    return "You lapsed recently, and that is data rather than failure. The plan updates and you carry on.";
  }
  if (currentDays >= 66) {
    return `${currentDays} days. Past the point where this typically becomes automatic.`;
  }
  const pct = Math.round(resilienceRate * 100);
  return `${currentDays} day${currentDays === 1 ? "" : "s"} clear, and you have ridden out ${pct}% of the urges you logged.`;
}

/**
 * Summarise streak state from the urge log.
 *
 * @param events every urge ever logged, any order
 * @param now the current instant, passed in so the function stays pure and testable
 * @param startedAt when the user began, used when no lapse has ever occurred
 */
export function summariseStreak(events: UrgeEvent[], now: Date, startedAt: Date): StreakSummary {
  const resolved = events.filter((event) => event.outcome !== "pending");
  const lapseEvents = resolved
    .filter((event) => event.outcome === "lapsed")
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const urgesRidden = resolved.filter((event) => event.outcome === "rode_it_out").length;
  const lapses = lapseEvents.length;
  const resilienceRate = resolved.length === 0 ? 0 : urgesRidden / resolved.length;

  const mostRecentLapse = lapseEvents[0];
  const currentDays = mostRecentLapse
    ? daysBetween(new Date(mostRecentLapse.at), now)
    : daysBetween(startedAt, now);

  // Best run: the largest gap between consecutive lapses, including the run before the
  // first lapse and the run since the last one.
  const boundaries = [startedAt, ...[...lapseEvents].reverse().map((e) => new Date(e.at)), now];
  let bestDays = 0;
  for (let index = 1; index < boundaries.length; index += 1) {
    const start = boundaries[index - 1];
    const end = boundaries[index];
    if (!start || !end) continue;
    bestDays = Math.max(bestDays, daysBetween(start, end));
  }

  return {
    currentDays,
    bestDays: Math.max(bestDays, currentDays),
    urgesRidden,
    lapses,
    resilienceRate,
    message: messageFor(currentDays, lapses, resilienceRate),
  };
}
