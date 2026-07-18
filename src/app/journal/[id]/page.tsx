"use client";

/**
 * A single journal entry, including the blame-free post-mortem after a lapse.
 *
 * The post-mortem exists because of a specific finding: what converts one slip into a
 * full relapse is the belief that the whole attempt is now ruined (the
 * abstinence-violation effect). So the first thing generated here dismantles that belief,
 * and the second thing is a better plan for that exact trigger.
 */

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { addPlan, resolveUrge } from "@/lib/store/state";
import { summariseStreak } from "@/lib/habit/streak";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedPostMortem } from "@/lib/ai/schemas";
import { Badge, Button, ButtonLink, Card, PageHeader, SourceNote, inputClass } from "@/components/ui";
import { CrisisPanel } from "@/components/crisis-panel";
import { TRIGGER_LABELS, type TriggerTag } from "@/lib/domain/types";
import { absoluteTime, OUTCOME_LABELS, RISK_DESCRIPTIONS } from "@/lib/format";

export default function JournalEntryPage() {
  const params = useParams<{ id: string }>();
  const { state, update } = useStore();
  const [note, setNote] = useState("");
  const [planAdded, setPlanAdded] = useState(false);

  const urge = state.urges.find((candidate) => candidate.id === params.id);
  const intervention = state.interventions.find(
    (candidate) => candidate.id === urge?.interventionId,
  );

  const postMortem = useGenerate<GeneratedPostMortem>();

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  if (!urge) {
    return (
      <div>
        <PageHeader
          title="Entry not found"
          lede="That journal entry does not exist, or it was cleared from this browser."
        />
        <ButtonLink href="/journal">Back to the journal</ButtonLink>
      </div>
    );
  }

  const defendingPlan = state.plans.find((plan) => plan.active && plan.tag === urge.trigger);

  function setOutcome(outcome: "rode_it_out" | "partial" | "lapsed") {
    if (!urge) return;
    update((current) => resolveUrge(current, urge.id, outcome, new Date(), note.trim() || undefined));
  }

  async function runPostMortem() {
    if (!urge) return;
    await postMortem.run({
      task: "post_mortem",
      context: {
        habitLabel: state.profile.habitLabel,
        goal: state.profile.goal,
        why: state.profile.why,
        streakDays: streak.currentDays,
      },
      intent: urge.intent,
      trigger: urge.trigger,
      note: urge.note ?? note,
    });
  }

  function acceptNewPlan() {
    const generated = postMortem.outcome?.data?.newPlan;
    if (!generated) return;
    update((current) =>
      addPlan(current, {
        trigger: generated.trigger,
        action: generated.action,
        rationale: generated.rationale,
        tag: generated.tag as TriggerTag,
        source: "ai",
        at: new Date(),
      }).state,
    );
    setPlanAdded(true);
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/journal" className="text-[var(--text-muted)] underline">
          Journal
        </Link>
        <span className="mx-2 text-[var(--text-muted)]" aria-hidden="true">
          /
        </span>
        <span>Entry</span>
      </nav>

      <PageHeader
        title={`Wanted to ${urge.intent}`}
        lede={`${absoluteTime(urge.at)} · ${TRIGGER_LABELS[urge.trigger]} · intensity ${urge.intensity}/10`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={urge.risk.state}>Risk {urge.risk.score}/100</Badge>
              <Badge>{OUTCOME_LABELS[urge.outcome]}</Badge>
              <Badge>Feeling {urge.mood}</Badge>
            </div>
            <p className="mt-3 text-sm">{urge.risk.headline}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {RISK_DESCRIPTIONS[urge.risk.state]}
            </p>

            <h2 className="mt-5 text-sm font-semibold">How that score was reached</h2>
            <ul className="mt-2 space-y-2">
              {urge.risk.factors.map((factor) => (
                <li key={factor.key} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{factor.label}</span>
                    <span className="tabular-nums text-[var(--text-muted)]">+{factor.points}</span>
                  </div>
                  <p className="text-[var(--text-muted)]">{factor.detail}</p>
                </li>
              ))}
            </ul>

            {urge.note ? (
              <p className="mt-5 rounded-lg bg-[var(--surface-sunken)] p-4 text-sm italic">
                “{urge.note}”
              </p>
            ) : null}
          </Card>

          {urge.outcome === "pending" ? (
            <Card>
              <h2 className="text-base font-semibold">How did this one end?</h2>
              <label htmlFor="outcome-note" className="mt-3 block text-sm font-medium">
                Add a note first, if you want
              </label>
              <textarea
                id="outcome-note"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="What was going on around you?"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => setOutcome("rode_it_out")}>I rode it out</Button>
                <Button variant="secondary" onClick={() => setOutcome("partial")}>
                  Partly held
                </Button>
                <Button variant="secondary" onClick={() => setOutcome("lapsed")}>
                  I lapsed
                </Button>
              </div>
            </Card>
          ) : null}

          {urge.outcome === "lapsed" ? (
            <Card>
              <h2 className="text-base font-semibold">Review this lapse</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Not to make you feel worse. A lapse is almost always a cue arriving when your
                capacity was low and no alternative was ready — that is a fixable, specific
                mechanism.
              </p>
              <Button
                className="mt-4"
                disabled={postMortem.loading}
                onClick={runPostMortem}
              >
                {postMortem.loading ? "Thinking…" : "Write the post-mortem"}
              </Button>

              {postMortem.outcome?.blocked ? (
                <div className="mt-4">
                  <CrisisPanel
                    message={postMortem.outcome.crisisMessage}
                    resources={postMortem.outcome.resources}
                  />
                </div>
              ) : null}

              {postMortem.outcome?.data && !postMortem.outcome.blocked ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-lg bg-[var(--surface-sunken)] p-4">
                    <h3 className="text-sm font-semibold">First, the important part</h3>
                    <p className="mt-1.5 text-sm leading-relaxed">
                      {postMortem.outcome.data.reframe}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">What actually happened</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      {postMortem.outcome.data.whatHappened}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Next time</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      {postMortem.outcome.data.nextTime}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--accent)] p-4">
                    <h3 className="text-sm font-semibold">A better plan for this trigger</h3>
                    <p className="mt-2 text-sm font-medium">
                      {postMortem.outcome.data.newPlan.trigger}
                    </p>
                    <p className="text-sm">
                      <span className="text-[var(--text-muted)]">…then </span>
                      {postMortem.outcome.data.newPlan.action}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {postMortem.outcome.data.newPlan.rationale}
                    </p>
                    {planAdded ? (
                      <p role="status" className="mt-3 text-sm">
                        Added.{" "}
                        <Link href="/plans" className="text-[var(--accent)] underline">
                          See it in your plans
                        </Link>
                        .
                      </p>
                    ) : (
                      <Button variant="secondary" className="mt-3" onClick={acceptNewPlan}>
                        Add this plan
                      </Button>
                    )}
                  </div>

                  <SourceNote
                    source={postMortem.outcome.source}
                    live={postMortem.outcome.live}
                  />
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          {intervention ? (
            <Card>
              <h2 className="text-sm font-semibold">The session you ran</h2>
              <p className="mt-2 font-medium">{intervention.title}</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[var(--text-muted)]">
                {intervention.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm italic">{intervention.closing}</p>
            </Card>
          ) : null}

          {defendingPlan ? (
            <Card>
              <h2 className="text-sm font-semibold">The plan defending this trigger</h2>
              <p className="mt-2 text-sm font-medium">
                <Link href={`/plans/${defendingPlan.id}`} className="underline">
                  {defendingPlan.trigger}
                </Link>
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">…then {defendingPlan.action}</p>
            </Card>
          ) : (
            <Card>
              <h2 className="text-sm font-semibold">No plan for this trigger</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Nothing is currently defending {TRIGGER_LABELS[urge.trigger].toLowerCase()}.
              </p>
              <ButtonLink href="/plans/new" variant="secondary" className="mt-3">
                Write one
              </ButtonLink>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
