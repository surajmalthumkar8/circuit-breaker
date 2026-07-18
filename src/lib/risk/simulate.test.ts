import { describe, it, expect } from "vitest";
import { counterfactuals, LEVER_KEYS } from "./simulate";
import { assessRisk, type RiskInput } from "./vulnerability";
import type { CheckIn, UrgeEvent } from "@/lib/domain/types";

/**
 * A deliberately bad moment: strong craving, 1am, short sleep, high stress, day-two streak.
 * Every lever therefore has room to move, which is what makes the assertions meaningful.
 */
const CHECK_IN: CheckIn = {
  id: "c1",
  date: "2026-07-17",
  mood: "low",
  sleepHours: 4.5,
  stress: 9,
  minutesOnHabit: 240,
  triggers: ["boredom"],
  createdAt: "2026-07-17T21:00:00.000Z",
};

const assessment = (score: number): UrgeEvent["risk"] => ({
  score,
  state: "high_risk",
  factors: [],
  headline: "",
});

const HISTORY: UrgeEvent[] = [
  {
    id: "u1",
    at: "2026-07-17T22:10:00.000Z",
    trigger: "boredom",
    intensity: 7,
    intent: "scroll",
    mood: "restless",
    risk: assessment(60),
    outcome: "lapsed",
  },
  {
    id: "u2",
    at: "2026-07-16T23:40:00.000Z",
    trigger: "boredom",
    intensity: 6,
    intent: "scroll",
    mood: "low",
    risk: assessment(55),
    outcome: "lapsed",
  },
];

const BASE: RiskInput = {
  intensity: 9,
  trigger: "boredom",
  at: new Date("2026-07-18T01:00:00.000Z"),
  history: HISTORY,
  checkIns: [CHECK_IN],
  streakDays: 2,
};

describe("counterfactuals", () => {
  it("returns one lever per modelled intervention", () => {
    const levers = counterfactuals(BASE);
    expect(levers.map((lever) => lever.key).sort()).toEqual([...LEVER_KEYS].sort());
  });

  it("reports the unchanged score as the baseline on every lever", () => {
    const expected = assessRisk(BASE).score;
    for (const lever of counterfactuals(BASE)) {
      expect(lever.baseline).toBe(expected);
    }
  });

  it("computes each improved score from the real model, not an estimate", () => {
    const sleep = counterfactuals(BASE).find((lever) => lever.key === "sleep")!;
    const expected = assessRisk({
      ...BASE,
      checkIns: [{ ...CHECK_IN, sleepHours: 8 }],
    }).score;
    expect(sleep.improved).toBe(expected);
  });

  it("orders levers by how much they actually move the score", () => {
    const deltas = counterfactuals(BASE).map((lever) => lever.delta);
    const sorted = [...deltas].sort((a, b) => b - a);
    expect(deltas).toEqual(sorted);
  });

  it("states delta as the reduction, so a helpful lever is a positive number", () => {
    for (const lever of counterfactuals(BASE)) {
      expect(lever.delta).toBe(lever.baseline - lever.improved);
      expect(lever.delta).toBeGreaterThanOrEqual(0);
    }
  });

  it("never invents a reduction for a lever that is already optimal", () => {
    // Well-slept, unstressed, mature streak, morning, mild craving: nothing left to gain.
    const optimal: RiskInput = {
      ...BASE,
      intensity: 1,
      at: new Date("2026-07-18T09:00:00.000Z"),
      streakDays: 120,
      checkIns: [{ ...CHECK_IN, sleepHours: 8, stress: 1 }],
      history: [],
    };
    for (const lever of counterfactuals(optimal)) {
      expect(lever.delta).toBe(0);
    }
  });

  it("gives every lever a label and an action the person could actually take", () => {
    for (const lever of counterfactuals(BASE)) {
      expect(lever.label.length).toBeGreaterThan(3);
      expect(lever.action.length).toBeGreaterThan(10);
    }
  });

  it("is pure — the same input yields the same result", () => {
    expect(counterfactuals(BASE)).toEqual(counterfactuals(BASE));
  });

  it("does not mutate the input it was given", () => {
    const snapshot = JSON.parse(JSON.stringify({ ...BASE, at: BASE.at.toISOString() }));
    counterfactuals(BASE);
    expect(JSON.parse(JSON.stringify({ ...BASE, at: BASE.at.toISOString() }))).toEqual(snapshot);
  });

  it("handles an empty history and no check-ins without throwing", () => {
    const sparse: RiskInput = { ...BASE, history: [], checkIns: [] };
    expect(() => counterfactuals(sparse)).not.toThrow();
    expect(counterfactuals(sparse)).toHaveLength(LEVER_KEYS.length);
  });
});
