/**
 * Trend selectors.
 *
 * Pure reads over the stored history, used by the trends dashboard. They are separated
 * from `state.ts` because that module owns the write transitions and these own nothing —
 * keeping them apart makes it obvious that rendering a chart can never mutate state.
 *
 * One rule runs through all of them: absence of data and a value of zero are different
 * claims, and they are never collapsed into each other. A day with no check-in yields
 * `null`, not `0`, because zero minutes on the habit is a good day and a missing log is
 * not a day at all. The same applies to win rate and week-over-week change.
 *
 * All bucketing is UTC, matching the risk scorer, so the server and the browser agree.
 */

import type { AppState } from "./state";
import type { UrgeOutcome } from "@/lib/domain/types";

/** Weekday labels indexed by `Date.getUTCDay()`. */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Hour bands rather than 24 columns. A day-by-hour grid is 168 cells, which is unreadable
 * at any size a phone can show; these five map onto how people actually describe their day.
 */
export const HOUR_BLOCKS = [
  { from: 0, to: 6, label: "Night" },
  { from: 6, to: 11, label: "Morning" },
  { from: 11, to: 16, label: "Midday" },
  { from: 16, to: 21, label: "Evening" },
  { from: 21, to: 24, label: "Late" },
] as const;

function blockIndexFor(hour: number): number {
  const index = HOUR_BLOCKS.findIndex((block) => hour >= block.from && hour < block.to);
  return index === -1 ? HOUR_BLOCKS.length - 1 : index;
}

/** `YYYY-MM-DD` for a date, in UTC. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* ---------- Outcomes ---------- */

export interface OutcomeTotals extends Record<UrgeOutcome, number> {
  /** Urges the user has reported back on. */
  resolved: number;
  /**
   * Share of resolved urges that went well, counting `partial` as a half.
   * `null` when nothing has resolved — not zero, which would read as total failure.
   */
  winRate: number | null;
}

export function selectOutcomeTotals(state: AppState): OutcomeTotals {
  const totals = { pending: 0, rode_it_out: 0, partial: 0, lapsed: 0 };
  for (const urge of state.urges) totals[urge.outcome] += 1;

  const resolved = totals.rode_it_out + totals.partial + totals.lapsed;
  const winRate = resolved === 0 ? null : (totals.rode_it_out + totals.partial * 0.5) / resolved;

  return { ...totals, resolved, winRate };
}

/* ---------- Weekday × time-of-day heatmap ---------- */

export interface HeatCell {
  blockLabel: string;
  count: number;
  lapses: number;
}

export interface HeatRow {
  label: string;
  blocks: HeatCell[];
}

/**
 * A full 7 × 5 grid, always. Rendering code should never have to handle a missing row,
 * and an all-zero grid is the honest picture when nothing has been logged.
 */
export function selectWeekdayHeatmap(state: AppState): HeatRow[] {
  const grid: HeatRow[] = WEEKDAYS.map((label) => ({
    label,
    blocks: HOUR_BLOCKS.map((block) => ({ blockLabel: block.label, count: 0, lapses: 0 })),
  }));

  for (const urge of state.urges) {
    const at = new Date(urge.at);
    const row = grid[at.getUTCDay()];
    const cell = row?.blocks[blockIndexFor(at.getUTCHours())];
    if (!cell) continue;
    cell.count += 1;
    if (urge.outcome === "lapsed") cell.lapses += 1;
  }

  return grid;
}

/* ---------- Daily minutes ---------- */

export interface DailyPoint {
  date: string;
  /** `null` when there is no check-in for that day — distinct from a logged zero. */
  minutes: number | null;
}

/**
 * A contiguous day-by-day series ending today, oldest first.
 *
 * @param days how many days the window covers, including today.
 */
export function selectDailyMinutes(state: AppState, now: Date, days: number): DailyPoint[] {
  const byDate = new Map(state.checkIns.map((entry) => [entry.date, entry.minutesOnHabit]));

  return Array.from({ length: days }, (_, offset) => {
    const day = new Date(now.getTime());
    day.setUTCDate(day.getUTCDate() - (days - 1 - offset));
    const date = isoDay(day);
    return { date, minutes: byDate.get(date) ?? null };
  });
}

/* ---------- Week over week ---------- */

export interface WeekComparison {
  /** Mean minutes across days that were actually logged, or `null` if none were. */
  thisWeek: number | null;
  lastWeek: number | null;
  /** Signed proportional change, e.g. -0.5 for a halving. `null` when not computable. */
  change: number | null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function selectWeekOverWeek(state: AppState, now: Date): WeekComparison {
  const recent = selectDailyMinutes(state, now, 14);
  const logged = (points: DailyPoint[]) =>
    points.flatMap((point) => (point.minutes === null ? [] : [point.minutes]));

  const lastWeek = mean(logged(recent.slice(0, 7)));
  const thisWeek = mean(logged(recent.slice(7)));

  /*
   * Guard the division separately from the null check. A previous week that genuinely
   * averaged zero cannot produce a proportional change — reporting Infinity, or silently
   * showing 0%, would both be wrong.
   */
  const change =
    thisWeek === null || lastWeek === null || lastWeek === 0
      ? null
      : (thisWeek - lastWeek) / lastWeek;

  return { thisWeek, lastWeek, change };
}
