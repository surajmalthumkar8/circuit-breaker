"use client";

/**
 * Trends.
 *
 * Insights answers "which trigger and which hour". This answers "is any of this working",
 * which is a different and harder question — and the one people actually quit over.
 *
 * The honesty rule from the selectors carries all the way to the pixels here: a day with
 * no check-in renders as a gap, not a zero-height bar, and a win rate with nothing
 * resolved renders as an em dash, not 0%. A chart that makes missing data look like bad
 * data will push someone to give up over a week they simply did not log.
 */

import { useMemo } from "react";
import { useStore } from "@/lib/store/provider";
import {
  HOUR_BLOCKS,
  selectDailyMinutes,
  selectOutcomeTotals,
  selectWeekOverWeek,
  selectWeekdayHeatmap,
} from "@/lib/store/trends";
import { summariseStreak } from "@/lib/habit/streak";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatMinutes } from "@/lib/format";

/** Cell tint scales with volume; lapses shift it from the calm ramp to the urgent one. */
function cellStyle(count: number, lapses: number, peak: number): React.CSSProperties {
  if (count === 0) return { background: "var(--surface-sunken)" };
  const weight = 0.18 + (count / peak) * 0.72;
  const colour = lapses > count / 2 ? "var(--color-urgent-500)" : "var(--accent)";
  return { background: `color-mix(in srgb, ${colour} ${Math.round(weight * 100)}%, transparent)` };
}

export default function TrendsPage() {
  const { state, now } = useStore();

  const outcomes = useMemo(() => selectOutcomeTotals(state), [state]);
  const heatmap = useMemo(() => selectWeekdayHeatmap(state), [state]);
  const daily = useMemo(() => selectDailyMinutes(state, now, 21), [state, now]);
  const week = useMemo(() => selectWeekOverWeek(state, now), [state, now]);
  const streak = useMemo(
    () => summariseStreak(state.urges, now, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt, now],
  );

  const peakCell = Math.max(
    1,
    ...heatmap.flatMap((row) => row.blocks.map((cell) => cell.count)),
  );
  const loggedMinutes = daily.flatMap((point) => (point.minutes === null ? [] : [point.minutes]));
  const peakMinutes = Math.max(1, ...loggedMinutes);

  const changeLabel =
    week.change === null
      ? "Not enough logged days to compare yet."
      : week.change < 0
        ? `Down ${Math.abs(Math.round(week.change * 100))}% on the week before.`
        : week.change === 0
          ? "Level with the week before."
          : `Up ${Math.round(week.change * 100)}% on the week before.`;

  return (
    <div>
      <PageHeader
        eyebrow="Trends"
        title="Is any of this working?"
        lede="The longer view: how often urges end well, when in the week they cluster, and where your minutes are going. Days you did not log show as gaps rather than zeros — a week you forgot to record is not a week you failed."
      />

      <section aria-labelledby="headline-heading" className="mb-8">
        <h2 id="headline-heading" className="sr-only">
          Headline numbers
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Urges ridden out</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {outcomes.winRate === null ? "—" : `${Math.round(outcomes.winRate * 100)}%`}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {outcomes.resolved === 0
                ? "No urges resolved yet."
                : `Across ${outcomes.resolved} resolved urge${outcomes.resolved === 1 ? "" : "s"}.`}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Resilience streak</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{streak.currentDays}d</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Best run: {streak.bestDays} days.</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Daily average, last 7</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {week.thisWeek === null ? "—" : formatMinutes(Math.round(week.thisWeek))}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{changeLabel}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--text-muted)]">Still open</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{outcomes.pending}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {outcomes.pending === 0 ? "Everything is closed out." : "Urges awaiting an outcome."}
            </p>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="heatmap-heading">
          <h2 id="heatmap-heading" className="mb-3 text-lg font-semibold">
            Where the week gets dangerous
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] border-separate border-spacing-1 text-sm">
                <caption className="sr-only">
                  Urges by day of the week and time of day. Each cell gives the number of urges
                  logged and how many became lapses.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="sr-only">
                      Day
                    </th>
                    {HOUR_BLOCKS.map((block) => (
                      <th
                        key={block.label}
                        scope="col"
                        className="pb-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]"
                      >
                        {block.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row) => (
                    <tr key={row.label}>
                      <th
                        scope="row"
                        className="pr-2 text-right text-xs font-medium text-[var(--text-muted)]"
                      >
                        {row.label}
                      </th>
                      {row.blocks.map((cell) => (
                        <td
                          key={cell.blockLabel}
                          className="h-9 rounded-md text-center text-xs tabular-nums"
                          style={cellStyle(cell.count, cell.lapses, peakCell)}
                        >
                          <span className="sr-only">
                            {row.label} {cell.blockLabel}: {cell.count} urge
                            {cell.count === 1 ? "" : "s"}, {cell.lapses} lapse
                            {cell.lapses === 1 ? "" : "s"}.
                          </span>
                          <span aria-hidden="true">{cell.count > 0 ? cell.count : ""}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Deeper cells hold more urges. A cell turns red when more than half of the urges in it
              ended in a lapse — that is a slot worth planning for rather than willing through.
            </p>
          </Card>
        </section>

        <section aria-labelledby="minutes-heading">
          <h2 id="minutes-heading" className="mb-3 text-lg font-semibold">
            Minutes, last three weeks
          </h2>
          <Card>
            <ul className="flex h-40 items-end gap-1" aria-hidden="true">
              {daily.map((point) => (
                <li key={point.date} className="flex flex-1 flex-col justify-end">
                  {point.minutes === null ? (
                    // A gap, drawn as a dotted stub. Never a zero-height bar.
                    <span className="mx-auto block h-1.5 w-full rounded-full border-b border-dashed border-[var(--hairline)]" />
                  ) : (
                    <span
                      className="block w-full rounded-t bg-[var(--accent)]"
                      style={{ height: `${Math.max(4, (point.minutes / peakMinutes) * 100)}%` }}
                    />
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              <span>{daily[0]?.date.slice(5)}</span>
              <span>{daily[daily.length - 1]?.date.slice(5)}</span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {loggedMinutes.length === 0
                ? "No check-ins in this window yet."
                : `${loggedMinutes.length} of the last ${daily.length} days logged. Dashed marks are days with no check-in, not days at zero.`}
            </p>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              How urges ended
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["Rode it out", outcomes.rode_it_out, "var(--color-calm-500)"],
                  ["Partial", outcomes.partial, "var(--color-alert-500)"],
                  ["Lapsed", outcomes.lapsed, "var(--color-urgent-500)"],
                ] as const
              ).map(([label, count, colour]) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[var(--text-muted)]">{label}</span>
                  <span
                    role="img"
                    aria-label={`${label}: ${count} of ${outcomes.resolved} resolved urges.`}
                    className="h-2 flex-1 rounded-full bg-[var(--surface-sunken)]"
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${outcomes.resolved === 0 ? 0 : (count / outcomes.resolved) * 100}%`,
                        background: colour,
                      }}
                    />
                  </span>
                  <span className="w-8 text-right tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/checkin" trailing>
          Log today
        </ButtonLink>
        <ButtonLink href="/insights" variant="secondary">
          Trigger and hour detail
        </ButtonLink>
        <ButtonLink href="/simulator" variant="secondary">
          Try the model playground
        </ButtonLink>
      </div>
    </div>
  );
}
