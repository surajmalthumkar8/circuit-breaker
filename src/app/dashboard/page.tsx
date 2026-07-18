"use client";

/**
 * The dashboard hub.
 *
 * Every statistic on this page is a link to the screen that explains it, so the hub never
 * dead-ends and any area of the app is reachable within two clicks of arriving.
 */

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store/provider";
import { selectDashboard, selectHourlyRisk } from "@/lib/store/state";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { Badge, ButtonLink, Card, PageHeader, StatTile } from "@/components/ui";
import { formatHour, formatMinutes, OUTCOME_LABELS, relativeTime } from "@/lib/format";
import { TRIGGER_LABELS } from "@/lib/domain/types";

export default function DashboardPage() {
  const { state } = useStore();
  const summary = useMemo(() => selectDashboard(state, DEMO_ANCHOR), [state]);
  const hourly = useMemo(() => selectHourlyRisk(state), [state]);

  const riskiestHour = [...hourly].sort((a, b) => b.lapses - a.lapses || b.count - a.count)[0];
  const peakMinutes = Math.max(...summary.minutesTrend.map((point) => point.minutes), 1);

  return (
    <div>
      <PageHeader
        title={`Hello ${state.profile.displayName}`}
        lede={`You are working on ${state.profile.habitLabel}. Goal: ${state.profile.goal}.`}
        action={<ButtonLink href="/airlock">Log an urge</ButtonLink>}
      />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Your numbers
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Days clear"
            value={summary.streak.currentDays}
            detail={`Best run: ${summary.streak.bestDays} days`}
            href="/journal"
          />
          <StatTile
            label="Urges ridden out"
            value={summary.streak.urgesRidden}
            detail={`${Math.round(summary.streak.resilienceRate * 100)}% of those you logged`}
            href="/journal"
          />
          <StatTile
            label="Active plans"
            value={summary.activePlans}
            detail="If-then plans defending your triggers"
            href="/plans"
          />
          <StatTile
            label="Yesterday's screen time"
            value={
              summary.latestCheckIn ? formatMinutes(summary.latestCheckIn.minutesOnHabit) : "—"
            }
            detail={summary.latestCheckIn ? `Slept ${summary.latestCheckIn.sleepHours}h` : "No check-in yet"}
            href="/checkin"
          />
        </div>
      </section>

      <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-4 text-sm">
        {summary.streak.message}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="recent-heading" className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent urges
            </h2>
            <Link href="/journal" className="text-sm text-[var(--accent)] underline">
              See the full journal
            </Link>
          </div>

          <ul className="space-y-2">
            {summary.recentUrges.map((urge) => (
              <Card key={urge.id} as="li" className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/journal/${urge.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      Wanted to {urge.intent}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {TRIGGER_LABELS[urge.trigger]} · intensity {urge.intensity}/10 ·{" "}
                      {relativeTime(urge.at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={urge.risk.state}>Risk {urge.risk.score}</Badge>
                    <Badge>{OUTCOME_LABELS[urge.outcome]}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="pattern-heading">
            <h2 id="pattern-heading" className="mb-3 text-lg font-semibold">
              Your hardest hour
            </h2>
            <Card>
              <p className="text-3xl font-semibold tabular-nums">
                {riskiestHour ? formatHour(riskiestHour.hour) : "—"}
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {riskiestHour
                  ? `${riskiestHour.count} urges logged in this hour, ${riskiestHour.lapses} of which became a lapse.`
                  : "Not enough history yet."}
              </p>
              <Link
                href="/insights"
                className="mt-3 inline-block text-sm text-[var(--accent)] underline"
              >
                See the full pattern
              </Link>
            </Card>
          </section>

          <section aria-labelledby="trend-heading" className="deprioritise">
            <h2 id="trend-heading" className="mb-3 text-lg font-semibold">
              Screen time trend
            </h2>
            <Card>
              <ul className="flex h-24 items-end gap-1" aria-hidden="true">
                {summary.minutesTrend.map((point) => (
                  <li
                    key={point.date}
                    className="flex-1 rounded-t bg-[var(--accent)]"
                    style={{ height: `${Math.max(6, (point.minutes / peakMinutes) * 100)}%` }}
                  />
                ))}
              </ul>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Last {summary.minutesTrend.length} check-ins, from{" "}
                {formatMinutes(Math.min(...summary.minutesTrend.map((p) => p.minutes)))} to{" "}
                {formatMinutes(peakMinutes)} a day.
              </p>
              <Link
                href="/checkin"
                className="mt-3 inline-block text-sm text-[var(--accent)] underline"
              >
                Add today&apos;s check-in
              </Link>
            </Card>
          </section>
        </aside>
      </div>

      <section aria-labelledby="next-heading" className="mt-10">
        <h2 id="next-heading" className="mb-3 text-lg font-semibold">
          What would help right now
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ButtonLink href="/sos" variant="secondary" className="justify-start">
            Ride out a craving
          </ButtonLink>
          <ButtonLink href="/coach" variant="secondary" className="justify-start">
            Talk it through
          </ButtonLink>
          <ButtonLink href="/plans/new" variant="secondary" className="justify-start">
            Write a new plan
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
