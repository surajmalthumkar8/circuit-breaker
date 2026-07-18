"use client";

/**
 * Insights.
 *
 * Turns the logged history into the two things that actually change behaviour: which
 * triggers beat you, and at which hours. This is a lightweight, honest version of digital
 * phenotyping — it uses what the person told us, not covert sensing a browser cannot do.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { selectHourlyRisk, selectTriggerBreakdown } from "@/lib/store/state";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedNudge } from "@/lib/ai/schemas";
import { summariseStreak } from "@/lib/habit/streak";
import { Badge, Button, ButtonLink, Card, PageHeader, SourceNote } from "@/components/ui";
import { TRIGGER_LABELS, type CheckIn } from "@/lib/domain/types";
import { formatHour, formatMinutes } from "@/lib/format";

interface NudgeList {
  nudges: GeneratedNudge[];
}

export default function InsightsPage() {
  const { state, now } = useStore();
  const nudges = useGenerate<NudgeList>();

  const triggers = useMemo(() => selectTriggerBreakdown(state), [state]);
  const hourly = useMemo(() => selectHourlyRisk(state), [state]);
  const streak = useMemo(
    () => summariseStreak(state.urges, now, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt, now],
  );

  const peakCount = Math.max(...hourly.map((bucket) => bucket.count), 1);
  const riskyWindows = [...hourly]
    .filter((bucket) => bucket.count > 0)
    .sort((a, b) => b.lapses - a.lapses || b.count - a.count)
    .slice(0, 3)
    .map((bucket) => formatHour(bucket.hour));

  const worstTrigger = [...triggers].sort((a, b) => b.lapseRate - a.lapseRate)[0];

  /*
   * Derived from the actual histogram rather than asserted. The previous copy claimed
   * risk was concentrated in the late hours no matter what the data showed, which
   * contradicts this app's own rule about never overclaiming.
   */
  const lateNightShare = (() => {
    const total = hourly.reduce((sum, bucket) => sum + bucket.count, 0);
    if (total === 0) return 0;
    const late = hourly
      .filter((bucket) => bucket.hour >= 21 || bucket.hour < 4)
      .reduce((sum, bucket) => sum + bucket.count, 0);
    return late / total;
  })();

  const peakWindowNote =
    hourly.every((bucket) => bucket.count === 0)
      ? "Log a few urges and this chart will show when your risk actually clusters."
      : lateNightShare >= 0.4
        ? `${Math.round(lateNightShare * 100)}% of your urges land between 9pm and 4am, which is when self-control is most depleted.`
        : `Your urges are spread across the day rather than clustered at night — ${Math.round(lateNightShare * 100)}% fall between 9pm and 4am.`;
  const sleepOnLapseDays = useMemo(() => {
    const lapseDates = new Set(
      state.urges.filter((urge) => urge.outcome === "lapsed").map((urge) => urge.at.slice(0, 10)),
    );
    const mean = (list: CheckIn[]) =>
      list.length === 0 ? 0 : list.reduce((sum, entry) => sum + entry.sleepHours, 0) / list.length;
    return {
      onLapse: mean(state.checkIns.filter((entry) => lapseDates.has(entry.date))),
      otherwise: mean(state.checkIns.filter((entry) => !lapseDates.has(entry.date))),
    };
  }, [state.urges, state.checkIns]);

  const averageMinutes =
    state.checkIns.length === 0
      ? 0
      : Math.round(
          state.checkIns.reduce((sum, entry) => sum + entry.minutesOnHabit, 0) /
            state.checkIns.length,
        );

  return (
    <div>
      <PageHeader
        title="Insights"
        lede="Your own history, read back to you. These are patterns in what you logged, not predictions about who you are."
      />

      <section aria-labelledby="summary-heading" className="mb-8">
        <h2 id="summary-heading" className="sr-only">
          Headline numbers
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Hardest trigger</p>
            <p className="mt-1 text-2xl font-semibold">
              {worstTrigger ? TRIGGER_LABELS[worstTrigger.trigger] : "—"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {worstTrigger
                ? `Became a lapse ${Math.round(worstTrigger.lapseRate * 100)}% of the time.`
                : "Not enough data yet."}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Riskiest hours</p>
            <p className="mt-1 text-2xl font-semibold">{riskyWindows.join(", ") || "—"}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Where most of your lapses happened.
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Average per day</p>
            <p className="mt-1 text-2xl font-semibold">{formatMinutes(averageMinutes)}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Goal: {state.profile.goal}</p>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="trigger-heading">
          <h2 id="trigger-heading" className="mb-3 text-lg font-semibold">
            Trigger map
          </h2>
          <Card>
            <ul className="space-y-4">
              {triggers.map((entry) => (
                <li key={entry.trigger}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{TRIGGER_LABELS[entry.trigger]}</span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {entry.count} urges · {Math.round(entry.lapseRate * 100)}% became lapses
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                    role="img"
                    aria-label={`${TRIGGER_LABELS[entry.trigger]}: ${entry.count} urges, ${entry.lapses} lapses`}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${(entry.count / (triggers[0]?.count ?? 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section aria-labelledby="hour-heading">
          <h2 id="hour-heading" className="mb-3 text-lg font-semibold">
            When urges happen
          </h2>
          <Card>
            <ul className="flex h-40 items-end gap-0.5" aria-hidden="true">
              {hourly.map((bucket) => (
                <li key={bucket.hour} className="flex flex-1 flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t bg-[var(--color-urgent-500)]"
                    style={{ height: `${(bucket.lapses / peakCount) * 100}%` }}
                  />
                  <div
                    className="w-full rounded-t bg-[var(--accent)]"
                    style={{ height: `${((bucket.count - bucket.lapses) / peakCount) * 100}%` }}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Teal is urges you handled, red is urges that became lapses.{" "}
              {peakWindowNote}
            </p>
          </Card>
        </section>
      </div>

      <section aria-labelledby="sleep-heading" className="mt-6">
        <h2 id="sleep-heading" className="mb-3 text-lg font-semibold">
          Sleep and lapses
        </h2>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Average sleep on days you lapsed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {sleepOnLapseDays.onLapse > 0 ? `${sleepOnLapseDays.onLapse.toFixed(1)}h` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Average sleep on other days</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {sleepOnLapseDays.otherwise > 0 ? `${sleepOnLapseDays.otherwise.toFixed(1)}h` : "—"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Short sleep reduces prefrontal control, which is the part of you that does the
            resisting. This is an association in your own log, not proof of cause — but it is worth
            noticing.{" "}
            <Link href="/checkin" className="text-[var(--accent)] underline">
              Add a check-in
            </Link>{" "}
            to keep it accurate.
          </p>
        </Card>
      </section>

      <section aria-labelledby="nudge-heading" className="mt-6">
        <h2 id="nudge-heading" className="mb-3 text-lg font-semibold">
          Nudges for your risky windows
        </h2>
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Written for the specific hours above. A good nudge names the moment and gives one
            concrete action — it never guilts you or threatens a streak.
          </p>
          <Button
            className="mt-4"
            disabled={nudges.loading}
            onClick={() =>
              nudges.run({
                task: "nudges",
                context: {
                  habitLabel: state.profile.habitLabel,
                  goal: state.profile.goal,
                  why: state.profile.why,
                  streakDays: streak.currentDays,
                },
                windows: riskyWindows,
              })
            }
          >
            {nudges.loading ? "Writing…" : "Generate my nudges"}
          </Button>

          {nudges.outcome?.data ? (
            <div className="mt-5 space-y-3">
              {nudges.outcome.data.nudges.map((nudge) => (
                <div
                  key={nudge.headline}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-4"
                >
                  <Badge>{nudge.window}</Badge>
                  <p className="mt-2 font-medium">{nudge.headline}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{nudge.body}</p>
                </div>
              ))}
              <SourceNote source={nudges.outcome.source} live={nudges.outcome.live} />
            </div>
          ) : null}
        </Card>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/plans" variant="secondary">
          Turn these patterns into plans
        </ButtonLink>
        <ButtonLink href="/journal" variant="secondary">
          See the underlying entries
        </ButtonLink>
      </div>
    </div>
  );
}
