/**
 * Tests for the trend selectors.
 *
 * These feed a dashboard, so the thing that matters most is that an empty or sparse
 * history produces a well-formed, honest result rather than a crash or a misleading
 * zero. A chart that quietly renders "0%" for "no data" is a lie the user will act on.
 */

import { describe, it, expect } from "vitest";
import {
  selectDailyMinutes,
  selectOutcomeTotals,
  selectWeekdayHeatmap,
  selectWeekOverWeek,
  HOUR_BLOCKS,
} from "./trends";
import { createInitialState, type AppState } from "./state";
import type { CheckIn, UrgeEvent } from "@/lib/domain/types";

const NOW = new Date("2026-07-18T12:00:00.000Z");

const EMPTY: AppState = {
  profile: createInitialState().profile,
  plans: [],
  urges: [],
  checkIns: [],
  interventions: [],
  coachMessages: [],
};

const urge = (at: string, outcome: UrgeEvent["outcome"]): UrgeEvent => ({
  id: `u-${at}-${outcome}`,
  at,
  intent: "scroll",
  intensity: 6,
  trigger: "boredom",
  mood: "restless",
  risk: { score: 50, state: "tempted", factors: [], headline: "" },
  outcome,
});

const checkIn = (date: string, minutes: number): CheckIn => ({
  id: `c-${date}`,
  date,
  mood: "ok",
  sleepHours: 7,
  stress: 5,
  minutesOnHabit: minutes,
  triggers: [],
  createdAt: `${date}T20:00:00.000Z`,
});

describe("selectOutcomeTotals", () => {
  it("counts each outcome and reports the resolved total separately from pending", () => {
    const state: AppState = {
      ...EMPTY,
      urges: [
        urge("2026-07-17T22:00:00.000Z", "rode_it_out"),
        urge("2026-07-17T23:00:00.000Z", "rode_it_out"),
        urge("2026-07-16T21:00:00.000Z", "lapsed"),
        urge("2026-07-15T20:00:00.000Z", "partial"),
        urge("2026-07-18T11:00:00.000Z", "pending"),
      ],
    };
    const totals = selectOutcomeTotals(state);
    expect(totals.rode_it_out).toBe(2);
    expect(totals.lapsed).toBe(1);
    expect(totals.partial).toBe(1);
    expect(totals.pending).toBe(1);
    expect(totals.resolved).toBe(4);
  });

  it("reports a null win rate rather than zero when nothing has resolved", () => {
    // A 0% win rate and "no data yet" are completely different claims.
    expect(selectOutcomeTotals(EMPTY).winRate).toBeNull();
  });

  it("computes the win rate over resolved urges only, counting partial as a half", () => {
    const state: AppState = {
      ...EMPTY,
      urges: [
        urge("2026-07-17T22:00:00.000Z", "rode_it_out"),
        urge("2026-07-16T21:00:00.000Z", "lapsed"),
        urge("2026-07-18T11:00:00.000Z", "pending"),
      ],
    };
    expect(selectOutcomeTotals(state).winRate).toBeCloseTo(0.5, 5);
  });
});

describe("selectWeekdayHeatmap", () => {
  it("produces a full seven-by-block grid even with no data", () => {
    const grid = selectWeekdayHeatmap(EMPTY);
    expect(grid).toHaveLength(7);
    for (const row of grid) {
      expect(row.blocks).toHaveLength(HOUR_BLOCKS.length);
      expect(row.blocks.every((cell) => cell.count === 0)).toBe(true);
    }
  });

  it("places an urge in the correct weekday and hour block", () => {
    // 2026-07-17 is a Friday; 22:00 UTC falls in the late-night block.
    const state: AppState = { ...EMPTY, urges: [urge("2026-07-17T22:00:00.000Z", "lapsed")] };
    const grid = selectWeekdayHeatmap(state);
    const friday = grid.find((row) => row.label === "Fri")!;
    const lateBlock = friday.blocks.findIndex((cell) => cell.count > 0);

    expect(HOUR_BLOCKS[lateBlock]!.from).toBe(21);
    expect(friday.blocks[lateBlock]!.count).toBe(1);
    expect(friday.blocks[lateBlock]!.lapses).toBe(1);
  });

  it("counts lapses separately from total urges in a cell", () => {
    const state: AppState = {
      ...EMPTY,
      urges: [
        urge("2026-07-17T22:00:00.000Z", "lapsed"),
        urge("2026-07-17T23:00:00.000Z", "rode_it_out"),
      ],
    };
    const friday = selectWeekdayHeatmap(state).find((row) => row.label === "Fri")!;
    const cell = friday.blocks.find((entry) => entry.count > 0)!;
    expect(cell.count).toBe(2);
    expect(cell.lapses).toBe(1);
  });
});

describe("selectDailyMinutes", () => {
  it("returns one point per day for the requested window, oldest first", () => {
    const series = selectDailyMinutes(EMPTY, NOW, 7);
    expect(series).toHaveLength(7);
    expect(series[0]!.date < series[6]!.date).toBe(true);
    expect(series[6]!.date).toBe("2026-07-18");
  });

  it("marks days with no check-in as null rather than zero minutes", () => {
    // Zero minutes is an achievement; a missing log is not. They must not look the same.
    const state: AppState = { ...EMPTY, checkIns: [checkIn("2026-07-18", 120)] };
    const series = selectDailyMinutes(state, NOW, 3);
    expect(series[2]!.minutes).toBe(120);
    expect(series[0]!.minutes).toBeNull();
  });
});

describe("selectWeekOverWeek", () => {
  it("compares the last seven days against the seven before", () => {
    const state: AppState = {
      ...EMPTY,
      checkIns: [
        checkIn("2026-07-17", 100),
        checkIn("2026-07-16", 100),
        checkIn("2026-07-10", 200),
        checkIn("2026-07-09", 200),
      ],
    };
    const comparison = selectWeekOverWeek(state, NOW);
    expect(comparison.thisWeek).toBe(100);
    expect(comparison.lastWeek).toBe(200);
    expect(comparison.change).toBeCloseTo(-0.5, 5);
  });

  it("returns null averages and no change when a period has no data", () => {
    const comparison = selectWeekOverWeek(EMPTY, NOW);
    expect(comparison.thisWeek).toBeNull();
    expect(comparison.lastWeek).toBeNull();
    expect(comparison.change).toBeNull();
  });

  it("does not divide by zero when the previous week averaged nothing", () => {
    const state: AppState = {
      ...EMPTY,
      checkIns: [checkIn("2026-07-17", 60), checkIn("2026-07-10", 0)],
    };
    const comparison = selectWeekOverWeek(state, NOW);
    expect(comparison.lastWeek).toBe(0);
    expect(comparison.change).toBeNull();
  });
});
