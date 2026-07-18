import { describe, it, expect } from "vitest";
import {
  addCheckIn,
  addPlan,
  createInitialState,
  deletePlan,
  logUrge,
  resolveUrge,
  selectDashboard,
  selectTriggerBreakdown,
  updatePlan,
} from "./state";
import { DEMO_ANCHOR } from "@/lib/data/seed";

const LATER = new Date(DEMO_ANCHOR.getTime() + 60 * 60 * 1000);

describe("createInitialState", () => {
  it("starts populated so no screen is ever empty", () => {
    const state = createInitialState();
    expect(state.plans.length).toBeGreaterThan(3);
    expect(state.urges.length).toBeGreaterThan(10);
    expect(state.checkIns.length).toBeGreaterThan(5);
    expect(state.profile.onboardedAt).not.toBeNull();
  });

  it("is deterministic, so server and client renders match", () => {
    expect(createInitialState()).toEqual(createInitialState());
  });
});

describe("logUrge", () => {
  it("adds the urge to the journal", () => {
    const before = createInitialState();
    const { state, urge } = logUrge(before, {
      intent: "open Instagram",
      intensity: 8,
      trigger: "boredom",
      mood: "restless",
      at: LATER,
    });

    expect(state.urges.length).toBe(before.urges.length + 1);
    expect(state.urges.find((u) => u.id === urge.id)).toBeDefined();
  });

  it("computes and stores a risk assessment rather than leaving it to the model", () => {
    const { urge } = logUrge(createInitialState(), {
      intent: "scroll",
      intensity: 9,
      trigger: "habit_cue",
      mood: "restless",
      at: LATER,
    });

    expect(urge.risk.score).toBeGreaterThan(0);
    expect(urge.risk.factors.length).toBeGreaterThan(3);
  });

  it("starts as pending so the outcome can be reported later", () => {
    const { urge } = logUrge(createInitialState(), {
      intent: "scroll",
      intensity: 5,
      trigger: "stress",
      mood: "ok",
      at: LATER,
    });
    expect(urge.outcome).toBe("pending");
  });

  // The property that matters most for a whole-app evaluation: one write is
  // independently observable from several different screens.
  it("is visible from the dashboard and the insights breakdown, not just the journal", () => {
    const before = createInitialState();
    const beforeDashboard = selectDashboard(before, LATER);
    const beforeLoneliness = selectTriggerBreakdown(before).find((t) => t.trigger === "loneliness");

    const { state } = logUrge(before, {
      intent: "scroll because the flat is quiet",
      intensity: 7,
      trigger: "loneliness",
      mood: "low",
      at: LATER,
    });

    const afterDashboard = selectDashboard(state, LATER);
    const afterLoneliness = selectTriggerBreakdown(state).find((t) => t.trigger === "loneliness");

    expect(afterDashboard.totalUrges).toBe(beforeDashboard.totalUrges + 1);
    expect(afterDashboard.pendingUrges).toBe(beforeDashboard.pendingUrges + 1);
    expect(afterLoneliness!.count).toBe(beforeLoneliness!.count + 1);
  });
});

describe("resolveUrge", () => {
  it("records the outcome and clears it from pending", () => {
    const { state, urge } = logUrge(createInitialState(), {
      intent: "scroll",
      intensity: 6,
      trigger: "boredom",
      mood: "ok",
      at: LATER,
    });

    const resolved = resolveUrge(state, urge.id, "rode_it_out", LATER);
    const found = resolved.urges.find((u) => u.id === urge.id);

    expect(found?.outcome).toBe("rode_it_out");
    expect(selectDashboard(resolved, LATER).pendingUrges).toBe(0);
  });

  it("credits the matching plan when an urge is ridden out", () => {
    const initial = createInitialState();
    const plan = initial.plans.find((p) => p.tag === "boredom" && p.active)!;
    const { state, urge } = logUrge(initial, {
      intent: "scroll",
      intensity: 6,
      trigger: "boredom",
      mood: "ok",
      at: LATER,
    });

    const resolved = resolveUrge(state, urge.id, "rode_it_out", LATER);
    const updated = resolved.plans.find((p) => p.id === plan.id)!;

    expect(updated.timesUsed).toBe(plan.timesUsed + 1);
    expect(updated.timesWorked).toBe(plan.timesWorked + 1);
  });

  it("counts a lapse as plan usage but not as a success", () => {
    const initial = createInitialState();
    const plan = initial.plans.find((p) => p.tag === "stress" && p.active)!;
    const { state, urge } = logUrge(initial, {
      intent: "doomscroll",
      intensity: 9,
      trigger: "stress",
      mood: "anxious",
      at: LATER,
    });

    const resolved = resolveUrge(state, urge.id, "lapsed", LATER);
    const updated = resolved.plans.find((p) => p.id === plan.id)!;

    expect(updated.timesUsed).toBe(plan.timesUsed + 1);
    expect(updated.timesWorked).toBe(plan.timesWorked);
  });

  it("ignores an unknown urge id instead of throwing", () => {
    const state = createInitialState();
    expect(() => resolveUrge(state, "does-not-exist", "lapsed", LATER)).not.toThrow();
  });
});

describe("plan management", () => {
  it("adds a plan that is immediately visible in the library", () => {
    const before = createInitialState();
    const { state, plan } = addPlan(before, {
      trigger: "When I sit on the sofa after dinner",
      action: "I will put the remote and my phone in the drawer",
      rationale: "Removes both cues at once.",
      tag: "habit_cue",
      source: "user",
      at: LATER,
    });

    expect(state.plans.length).toBe(before.plans.length + 1);
    expect(state.plans.find((p) => p.id === plan.id)?.trigger).toContain("sofa");
  });

  it("edits a plan in place without disturbing the others", () => {
    const before = createInitialState();
    const target = before.plans[0]!;
    const state = updatePlan(before, target.id, { action: "I will go for a short walk" });

    expect(state.plans.find((p) => p.id === target.id)?.action).toBe("I will go for a short walk");
    expect(state.plans.length).toBe(before.plans.length);
  });

  it("deletes a plan", () => {
    const before = createInitialState();
    const target = before.plans[0]!;
    const state = deletePlan(before, target.id);

    expect(state.plans.find((p) => p.id === target.id)).toBeUndefined();
    expect(state.plans.length).toBe(before.plans.length - 1);
  });
});

describe("addCheckIn", () => {
  it("adds a check-in and surfaces it on the dashboard", () => {
    const before = createInitialState();
    // A date with no seeded entry, so this is an insert rather than an upsert.
    const state = addCheckIn(before, {
      date: "2026-07-19",
      mood: "good",
      sleepHours: 8,
      stress: 2,
      minutesOnHabit: 30,
      triggers: [],
      at: LATER,
    });

    expect(state.checkIns.length).toBe(before.checkIns.length + 1);
    expect(selectDashboard(state, LATER).latestCheckIn?.date).toBe("2026-07-19");
  });

  it("replaces an existing check-in for the same day rather than duplicating it", () => {
    const before = createInitialState();
    const existingDate = before.checkIns[0]!.date;

    const state = addCheckIn(before, {
      date: existingDate,
      mood: "low",
      sleepHours: 4,
      stress: 9,
      minutesOnHabit: 200,
      triggers: ["stress"],
      at: LATER,
    });

    expect(state.checkIns.length).toBe(before.checkIns.length);
    expect(state.checkIns.find((c) => c.date === existingDate)?.sleepHours).toBe(4);
  });
});

describe("selectDashboard", () => {
  it("summarises the seeded history into non-zero statistics", () => {
    const dashboard = selectDashboard(createInitialState(), DEMO_ANCHOR);

    expect(dashboard.totalUrges).toBeGreaterThan(10);
    expect(dashboard.streak.urgesRidden).toBeGreaterThan(5);
    expect(dashboard.activePlans).toBeGreaterThan(2);
    expect(dashboard.latestCheckIn).toBeDefined();
  });

  it("returns the most recent urges first", () => {
    const dashboard = selectDashboard(createInitialState(), DEMO_ANCHOR);
    const times = dashboard.recentUrges.map((u) => new Date(u.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("selectTriggerBreakdown", () => {
  it("ranks triggers by frequency, largest first", () => {
    const breakdown = selectTriggerBreakdown(createInitialState());
    const counts = breakdown.map((t) => t.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(breakdown[0]!.count).toBeGreaterThan(0);
  });

  it("reports a lapse rate between 0 and 1 for every listed trigger", () => {
    for (const entry of selectTriggerBreakdown(createInitialState())) {
      expect(entry.lapseRate).toBeGreaterThanOrEqual(0);
      expect(entry.lapseRate).toBeLessThanOrEqual(1);
    }
  });
});
