"use client";

/**
 * Create a plan, either by hand or by generating a set tailored to the triggers this
 * person has actually logged.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/provider";
import { addPlan, selectTriggerBreakdown } from "@/lib/store/state";
import { summariseStreak } from "@/lib/habit/streak";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedPlan } from "@/lib/ai/schemas";
import { TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag } from "@/lib/domain/types";
import {
  Button,
  Card,
  Field,
  PageHeader,
  SourceNote,
  inputClass,
} from "@/components/ui";

interface GeneratedPlanList {
  plans: GeneratedPlan[];
}

export default function NewPlanPage() {
  const router = useRouter();
  const { state, update } = useStore();

  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [rationale, setRationale] = useState("");
  const [tag, setTag] = useState<TriggerTag>("habit_cue");
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useGenerate<GeneratedPlanList>();

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  const context = {
    habitLabel: state.profile.habitLabel,
    goal: state.profile.goal,
    why: state.profile.why,
    streakDays: streak.currentDays,
  };

  function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (trigger.trim().length < 8 || action.trim().length < 8) {
      setError(
        "Both fields need a bit more detail. A cue you can actually notice, and an action you could do in under two minutes.",
      );
      return;
    }

    setError(null);
    const result = addPlan(state, {
      trigger: trigger.trim(),
      action: action.trim(),
      rationale: rationale.trim() || "Written by you.",
      tag,
      source: "user",
      at: new Date(),
    });
    update(() => result.state);
    setSaved(result.plan.id);
    setTrigger("");
    setAction("");
    setRationale("");
  }

  function acceptSuggestion(plan: GeneratedPlan) {
    const result = addPlan(state, {
      trigger: plan.trigger,
      action: plan.action,
      rationale: plan.rationale,
      tag: plan.tag as TriggerTag,
      source: "ai",
      at: new Date(),
    });
    update(() => result.state);
    router.push(`/plans/${result.plan.id}`);
  }

  return (
    <div>
      <PageHeader
        title="New plan"
        lede="A good plan names a cue you will genuinely notice and an action small enough that it needs no willpower."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="manual-heading">
          <h2 id="manual-heading" className="mb-3 text-lg font-semibold">
            Write it yourself
          </h2>
          <Card>
            <form onSubmit={handleSave} noValidate>
              <Field
                label="When…"
                htmlFor="plan-trigger"
                hint="A place, a time, or a physical action. Not a mood on its own."
              >
                <input
                  id="plan-trigger"
                  name="trigger"
                  value={trigger}
                  onChange={(event) => setTrigger(event.target.value)}
                  placeholder="When I get into bed and pick up my phone"
                  className={inputClass}
                />
              </Field>

              <Field
                label="…I will"
                htmlFor="plan-action"
                hint="Small, specific, doable in under two minutes."
              >
                <input
                  id="plan-action"
                  name="action"
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  placeholder="I will put it on the dresser and open my book"
                  className={inputClass}
                />
              </Field>

              <Field label="Why this should work" htmlFor="plan-rationale" hint="Optional.">
                <textarea
                  id="plan-rationale"
                  name="rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Field>

              <Field label="Which trigger does this defend?" htmlFor="plan-new-tag">
                <select
                  id="plan-new-tag"
                  name="tag"
                  value={tag}
                  onChange={(event) => setTag(event.target.value as TriggerTag)}
                  className={inputClass}
                >
                  {TRIGGER_TAGS.map((option) => (
                    <option key={option} value={option}>
                      {TRIGGER_LABELS[option]}
                    </option>
                  ))}
                </select>
              </Field>

              {error ? (
                <p role="alert" className="mb-4 text-sm text-[var(--color-urgent-500)]">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full">
                Save plan
              </Button>

              {saved ? (
                <p role="status" className="mt-3 text-sm">
                  Saved.{" "}
                  <a href={`/plans/${saved}`} className="text-[var(--accent)] underline">
                    Open it
                  </a>
                  .
                </p>
              ) : null}
            </form>
          </Card>
        </section>

        <section aria-labelledby="generate-heading">
          <h2 id="generate-heading" className="mb-3 text-lg font-semibold">
            Or generate a set
          </h2>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">
              Written against the triggers you have actually logged, not generic advice.
            </p>
            <Button
              className="mt-4 w-full"
              disabled={suggestions.loading}
              onClick={() =>
                suggestions.run({
                  task: "plans",
                  context,
                  knownTriggers: selectTriggerBreakdown(state)
                    .slice(0, 5)
                    .map((entry) => TRIGGER_LABELS[entry.trigger]),
                })
              }
            >
              {suggestions.loading ? "Writing…" : "Generate three plans"}
            </Button>

            {suggestions.outcome?.data ? (
              <div className="mt-5 space-y-3">
                {suggestions.outcome.data.plans.map((plan) => (
                  <div
                    key={plan.trigger}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-4"
                  >
                    <p className="text-sm font-medium">{plan.trigger}</p>
                    <p className="mt-1 text-sm">
                      <span className="text-[var(--text-muted)]">…then </span>
                      {plan.action}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{plan.rationale}</p>
                    <Button
                      variant="secondary"
                      className="mt-3"
                      onClick={() => acceptSuggestion(plan)}
                    >
                      Add this plan
                    </Button>
                  </div>
                ))}
                <SourceNote
                  source={suggestions.outcome.source}
                  live={suggestions.outcome.live}
                />
              </div>
            ) : null}
          </Card>
        </section>
      </div>
    </div>
  );
}
