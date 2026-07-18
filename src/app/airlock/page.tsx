"use client";

/**
 * The Airlock.
 *
 * A pure web application cannot intercept other apps or websites — the browser sandbox
 * forbids it, and claiming otherwise would be dishonest. So instead of intercepting the
 * action, this intercepts the INTENT: you route the urge through here first.
 *
 * That routing is not a workaround, it is the intervention. Putting a deliberate step
 * between a cue and an automatic routine is textbook stimulus control, and it is the same
 * mechanism that makes a friction pause work.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { logUrge, resolveUrge, selectTriggerBreakdown } from "@/lib/store/state";
import { summariseStreak } from "@/lib/habit/streak";
import { assessRisk } from "@/lib/risk/vulnerability";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedRiskNarrative } from "@/lib/ai/schemas";
import {
  MOODS,
  TRIGGER_LABELS,
  TRIGGER_TAGS,
  type Mood,
  type TriggerTag,
  type UrgeEvent,
} from "@/lib/domain/types";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Field,
  PageHeader,
  SourceNote,
  inputClass,
} from "@/components/ui";
import { RISK_DESCRIPTIONS } from "@/lib/format";
import { CrisisPanel } from "@/components/crisis-panel";

export default function AirlockPage() {
  const { state, update } = useStore();

  const [intent, setIntent] = useState("");
  const [intensity, setIntensity] = useState(6);
  const [trigger, setTrigger] = useState<TriggerTag>("boredom");
  const [mood, setMood] = useState<Mood>("restless");
  const [logged, setLogged] = useState<UrgeEvent | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);

  const narrative = useGenerate<GeneratedRiskNarrative>();

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  // Live preview: the score updates as the form changes, before anything is committed.
  const preview = useMemo(
    () =>
      assessRisk({
        intensity,
        trigger,
        at: DEMO_ANCHOR,
        history: state.urges,
        checkIns: state.checkIns,
        streakDays: streak.currentDays,
      }),
    [intensity, trigger, state.urges, state.checkIns, streak.currentDays],
  );

  const active = logged?.risk ?? preview;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const now = new Date();
    const result = logUrge(state, {
      intent: intent.trim() || "scroll",
      intensity,
      trigger,
      mood,
      at: now,
    });
    update(() => result.state);
    setLogged(result.urge);
    setResolved(null);

    await narrative.run({
      task: "risk_narrative",
      context: {
        habitLabel: state.profile.habitLabel,
        goal: state.profile.goal,
        why: state.profile.why,
        streakDays: streak.currentDays,
      },
      risk: result.urge.risk,
      intent: result.urge.intent,
      trigger,
    });
  }

  function handleOutcome(outcome: "rode_it_out" | "partial" | "lapsed") {
    if (!logged) return;
    update((current) => resolveUrge(current, logged.id, outcome, new Date()));
    setResolved(outcome);
  }

  function reset() {
    setLogged(null);
    setResolved(null);
    setIntent("");
  }

  const topTriggers = selectTriggerBreakdown(state)
    .slice(0, 5)
    .map((entry) => TRIGGER_LABELS[entry.trigger]);

  return (
    <div data-risk={active.state}>
      <PageHeader
        title="The Airlock"
        lede="Route the urge through here before you act on it. The pause is the point — it puts a deliberate step between the cue and the routine."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="form-heading" className="lg:col-span-3">
          <h2 id="form-heading" className="sr-only">
            Describe the urge
          </h2>

          <Card>
            <form onSubmit={handleSubmit} noValidate>
              <Field
                label="What do you want to do right now?"
                htmlFor="intent"
                hint="Plain words are fine. This is only stored in your browser."
              >
                <input
                  id="intent"
                  name="intent"
                  type="text"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder="open Instagram in bed"
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>

              <Field
                label={`How strong is it? ${intensity} out of 10`}
                htmlFor="intensity"
                hint="Craving strength is the single biggest predictor of the next few minutes."
              >
                <input
                  id="intensity"
                  name="intensity"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={intensity}
                  onChange={(event) => setIntensity(Number(event.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>

              <Field label="What set it off?" htmlFor="trigger">
                <select
                  id="trigger"
                  name="trigger"
                  value={trigger}
                  onChange={(event) => setTrigger(event.target.value as TriggerTag)}
                  className={inputClass}
                >
                  {TRIGGER_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {TRIGGER_LABELS[tag]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="How do you feel?" htmlFor="mood">
                <select
                  id="mood"
                  name="mood"
                  value={mood}
                  onChange={(event) => setMood(event.target.value as Mood)}
                  className={inputClass}
                >
                  {MOODS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Button type="submit" className="w-full">
                Assess this moment
              </Button>
            </form>
          </Card>

          {logged ? (
            <Card className="mt-4">
              <h3 className="text-base font-semibold">How did it go?</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Answer whenever you know. Every outcome — including a lapse — teaches the model
                something about your triggers.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => handleOutcome("rode_it_out")}>
                  I rode it out
                </Button>
                <Button variant="secondary" onClick={() => handleOutcome("partial")}>
                  Partly held
                </Button>
                <Button variant="secondary" onClick={() => handleOutcome("lapsed")}>
                  I lapsed
                </Button>
              </div>

              {resolved ? (
                <div
                  role="status"
                  className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-4 text-sm"
                >
                  {resolved === "lapsed" ? (
                    <>
                      <p>
                        Logged, and it is data rather than failure. Missing once does not reset your
                        progress — what turns a slip into a relapse is deciding the attempt is
                        ruined.
                      </p>
                      <Link
                        href={`/journal/${logged.id}`}
                        className="mt-2 inline-block font-medium text-[var(--accent)] underline"
                      >
                        Write the post-mortem and get a better plan
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Logged. That is one more vote for the person you are becoming.</p>
                      <Link
                        href="/journal"
                        className="mt-2 inline-block font-medium text-[var(--accent)] underline"
                      >
                        See it in your journal
                      </Link>
                    </>
                  )}
                  <div className="mt-3">
                    <Button variant="quiet" onClick={reset}>
                      Log another urge
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}
        </section>

        <aside className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">
            {logged ? "Assessment" : "Live estimate"}
          </h2>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold tabular-nums">{active.score}</p>
              <Badge tone={active.state}>{active.state.replace(/_/g, " ")}</Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {RISK_DESCRIPTIONS[active.state]}
            </p>
            <p className="mt-3 text-sm">{active.headline}</p>

            <h3 className="mt-5 text-sm font-semibold">What drives this number</h3>
            <ul className="mt-2 space-y-2">
              {active.factors.map((factor) => (
                <li key={factor.key} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{factor.label}</span>
                    <span className="tabular-nums text-[var(--text-muted)]">
                      +{factor.points}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)]">{factor.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              This score is calculated, not generated. A model explains it — it never invents it.
            </p>
          </Card>

          {narrative.loading ? (
            <Card className="mt-4">
              <p role="status" className="text-sm text-[var(--text-muted)]">
                Reading your situation…
              </p>
            </Card>
          ) : null}

          {narrative.outcome?.blocked ? (
            <div className="mt-4">
              <CrisisPanel
                message={narrative.outcome.crisisMessage}
                resources={narrative.outcome.resources}
              />
            </div>
          ) : null}

          {narrative.outcome?.data && !narrative.outcome.blocked ? (
            <Card className="mt-4">
              <h3 className="text-base font-semibold">What this means</h3>
              <p className="mt-2 text-sm leading-relaxed">{narrative.outcome.data.summary}</p>

              <h4 className="mt-4 text-sm font-semibold">Watch for</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
                {narrative.outcome.data.watchFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className="mt-4 rounded-lg bg-[var(--surface-sunken)] p-3 text-sm">
                {narrative.outcome.data.suggestion}
              </p>

              <div className="mt-4">
                <ButtonLink href="/sos" className="w-full">
                  Ride it out with a guided session
                </ButtonLink>
              </div>

              <SourceNote source={narrative.outcome.source} live={narrative.outcome.live} />
            </Card>
          ) : null}

          <Card className="mt-4 deprioritise">
            <h3 className="text-sm font-semibold">Your most frequent triggers</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {topTriggers.length > 0 ? topTriggers.join(", ") : "Nothing logged yet."}
            </p>
            <Link href="/insights" className="mt-3 inline-block text-sm text-[var(--accent)] underline">
              See the full trigger map
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
