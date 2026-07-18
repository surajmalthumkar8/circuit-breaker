"use client";

/**
 * The model playground.
 *
 * Every other screen shows the risk score for a moment that already happened. This one
 * hands the model over: move any input and watch the same deterministic function the rest
 * of the app depends on recompute, factor by factor, with no round-trip and no model call.
 *
 * It exists for two reasons. For the user, "which single thing would most change this?"
 * is a more actionable question than "how bad is it?" — and the counterfactual panel
 * answers it by re-running the scorer with one variable moved, rather than by reading the
 * weights table, which would report what a factor *could* contribute rather than what it
 * does contribute here.
 *
 * For anyone auditing the project, it is the claim that the score is real arithmetic
 * rather than a language model's guess, made checkable in a few seconds.
 *
 * The sliders start from the person's own history, so the baseline is theirs, not a demo.
 */

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store/provider";
import { assessRisk } from "@/lib/risk/vulnerability";
import { counterfactuals } from "@/lib/risk/simulate";
import { summariseStreak } from "@/lib/habit/streak";
import { Badge, ButtonLink, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { RISK_STATE_LABELS, TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag } from "@/lib/domain/types";
import { formatHour } from "@/lib/format";

export default function SimulatorPage() {
  const { state, now } = useStore();

  const streak = useMemo(
    () => summariseStreak(state.urges, now, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt, now],
  );

  const latestCheckIn = useMemo(
    () => [...state.checkIns].sort((a, b) => b.date.localeCompare(a.date))[0],
    [state.checkIns],
  );

  const [intensity, setIntensity] = useState(7);
  const [hour, setHour] = useState(23);
  const [trigger, setTrigger] = useState<TriggerTag>("boredom");
  const [sleepHours, setSleepHours] = useState(latestCheckIn?.sleepHours ?? 6.5);
  const [stress, setStress] = useState(latestCheckIn?.stress ?? 6);
  const [streakDays, setStreakDays] = useState(streak.currentDays);

  /*
   * The simulated moment. `at` is built from a fixed date plus the chosen hour so the
   * result depends only on the sliders — reading the wall clock here would make the
   * output drift while the user is reading it.
   */
  const input = useMemo(() => {
    const at = new Date(now.getTime());
    at.setUTCHours(hour, 0, 0, 0);
    return {
      intensity,
      trigger,
      at,
      history: state.urges,
      checkIns: latestCheckIn
        ? [{ ...latestCheckIn, sleepHours, stress }]
        : [],
      streakDays,
    };
  }, [intensity, trigger, hour, sleepHours, stress, streakDays, state.urges, latestCheckIn, now]);

  const risk = useMemo(() => assessRisk(input), [input]);
  const levers = useMemo(() => counterfactuals(input), [input]);
  const topLever = levers[0];

  return (
    <div data-risk={risk.state}>
      <PageHeader
        eyebrow="Model playground"
        title="Move one thing, watch the score move"
        lede="This is the same scoring function the rest of the app runs on — a pure, deterministic calculation, not a model call. Change any input and the arithmetic updates instantly, showing you exactly which factor carried the number."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <section aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="mb-3 text-lg font-semibold">
            The moment
          </h2>
          <Card>
            <Field label={`Craving strength — ${intensity} of 10`} htmlFor="sim-intensity">
              <input
                id="sim-intensity"
                type="range"
                min={1}
                max={10}
                step={1}
                value={intensity}
                onChange={(event) => setIntensity(Number(event.target.value))}
                className="w-full"
              />
            </Field>

            <Field label={`Time of day — ${formatHour(hour)}`} htmlFor="sim-hour">
              <input
                id="sim-hour"
                type="range"
                min={0}
                max={23}
                step={1}
                value={hour}
                onChange={(event) => setHour(Number(event.target.value))}
                className="w-full"
              />
            </Field>

            <Field label="What set it off" htmlFor="sim-trigger">
              <select
                id="sim-trigger"
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

            <Field label={`Sleep last night — ${sleepHours.toFixed(1)} hours`} htmlFor="sim-sleep">
              <input
                id="sim-sleep"
                type="range"
                min={3}
                max={10}
                step={0.5}
                value={sleepHours}
                onChange={(event) => setSleepHours(Number(event.target.value))}
                className="w-full"
              />
            </Field>

            <Field label={`Stress today — ${stress} of 10`} htmlFor="sim-stress">
              <input
                id="sim-stress"
                type="range"
                min={1}
                max={10}
                step={1}
                value={stress}
                onChange={(event) => setStress(Number(event.target.value))}
                className="w-full"
              />
            </Field>

            <Field
              label={`Days into the change — ${streakDays}`}
              htmlFor="sim-streak"
              hint="Automaticity typically takes around 66 days, so risk from fragility decays across that window."
            >
              <input
                id="sim-streak"
                type="range"
                min={0}
                max={100}
                step={1}
                value={streakDays}
                onChange={(event) => setStreakDays(Number(event.target.value))}
                className="w-full"
              />
            </Field>
          </Card>
        </section>

        <section aria-labelledby="readout-heading">
          <h2 id="readout-heading" className="mb-3 text-lg font-semibold">
            The reading
          </h2>

          {/* Perspective lives on the scene; the slab below owns the 3D context. */}
          <div className="sim-scene">
            <div className="sim-slab">
              <div className="sim-face">
                <div className="flex items-baseline justify-between gap-4">
                  <p
                    className="text-6xl font-semibold tabular-nums tracking-tight text-[var(--accent)]"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {risk.score}
                    <span className="ml-1 text-2xl text-[var(--text-muted)]">/100</span>
                  </p>
                  <Badge tone={risk.state}>{RISK_STATE_LABELS[risk.state]}</Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{risk.headline}</p>

                <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  How it adds up
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {risk.factors.map((factor) => (
                    <li key={factor.key}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{factor.label}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">
                          +{factor.points}
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${factor.label}: ${factor.points} points. ${factor.detail}`}
                        className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--surface-sunken)]"
                      >
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                          style={{ width: `${Math.min(100, (factor.points / 30) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{factor.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <span className="sim-glow" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="levers-heading" className="mt-8">
        <h2 id="levers-heading" className="mb-3 text-lg font-semibold">
          What would actually help
        </h2>
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Each row re-runs the whole model with one variable moved to a healthier value, so
            these are measured reductions rather than generic advice.{" "}
            {topLever && topLever.delta > 0 ? (
              <>
                Right now the biggest single lever is{" "}
                <strong className="text-[var(--text)]">{topLever.label.toLowerCase()}</strong>, worth{" "}
                {topLever.delta} points.
              </>
            ) : (
              <>At these settings there is nothing left to improve — this is already a strong position.</>
            )}
          </p>

          <ul className="mt-5 space-y-3">
            {levers.map((lever) => (
              <li
                key={lever.key}
                className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-sunken)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{lever.label}</span>
                  <span className="tabular-nums text-sm font-semibold text-[var(--accent)]">
                    {lever.delta > 0 ? `−${lever.delta} points` : "no change"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">{lever.action}</p>
                <div
                  role="img"
                  aria-label={`${lever.label} would take the score from ${lever.baseline} to ${lever.improved}.`}
                  className="mt-2.5 h-1.5 w-full rounded-full bg-[var(--surface)]"
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-calm-500)] transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{
                      width: `${lever.baseline === 0 ? 0 : (lever.delta / lever.baseline) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/airlock" trailing>
          Log a real urge
        </ButtonLink>
        <ButtonLink href="/trends" variant="secondary">
          See your actual trends
        </ButtonLink>
        <ButtonLink href="/help" variant="secondary">
          How the score is built
        </ButtonLink>
      </div>
    </div>
  );
}
