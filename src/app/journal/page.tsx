"use client";

/**
 * The journal.
 *
 * Every urge ever logged, filterable. This is the read surface that proves the write
 * surfaces work: anything created in the Airlock or the SOS appears here immediately.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag, type UrgeOutcome } from "@/lib/domain/types";
import { absoluteTime, OUTCOME_LABELS, relativeTime } from "@/lib/format";

type OutcomeFilter = UrgeOutcome | "any";

export default function JournalPage() {
  const { state, now } = useStore();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<OutcomeFilter>("any");
  const [trigger, setTrigger] = useState<TriggerTag | "any">("any");

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...state.urges]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .filter((urge) => {
        if (outcome !== "any" && urge.outcome !== outcome) return false;
        if (trigger !== "any" && urge.trigger !== trigger) return false;
        if (!needle) return true;
        return (
          urge.intent.toLowerCase().includes(needle) ||
          (urge.note ?? "").toLowerCase().includes(needle)
        );
      });
  }, [state.urges, query, outcome, trigger]);

  const lapses = entries.filter((entry) => entry.outcome === "lapsed").length;
  const ridden = entries.filter((entry) => entry.outcome === "rode_it_out").length;

  return (
    <div>
      <PageHeader
        title="Journal"
        lede="Every urge you have routed through the app. Lapses are recorded exactly like wins, because both are information."
        action={<ButtonLink href="/airlock">Log an urge</ButtonLink>}
      />

      <section aria-labelledby="journal-filter-heading" className="mb-6">
        <h2 id="journal-filter-heading" className="sr-only">
          Filter the journal
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="journal-search" className="mb-1.5 block text-sm font-medium">
              Search
            </label>
            <input
              id="journal-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="instagram, bed, work…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="journal-outcome" className="mb-1.5 block text-sm font-medium">
              Outcome
            </label>
            <select
              id="journal-outcome"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as OutcomeFilter)}
              className={inputClass}
            >
              <option value="any">Any outcome</option>
              <option value="rode_it_out">Rode it out</option>
              <option value="partial">Partly held</option>
              <option value="lapsed">Lapsed</option>
              <option value="pending">Awaiting outcome</option>
            </select>
          </div>
          <div>
            <label htmlFor="journal-trigger" className="mb-1.5 block text-sm font-medium">
              Trigger
            </label>
            <select
              id="journal-trigger"
              value={trigger}
              onChange={(event) => setTrigger(event.target.value as TriggerTag | "any")}
              className={inputClass}
            >
              <option value="any">Any trigger</option>
              {TRIGGER_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {TRIGGER_LABELS[tag]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <p aria-live="polite" className="mb-3 text-sm text-[var(--text-muted)]">
        {entries.length} of {state.urges.length} entries · {ridden} ridden out · {lapses} lapses.
      </p>

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          body="Try clearing the search box or setting the outcome back to Any."
          action={<ButtonLink href="/airlock">Log an urge</ButtonLink>}
        />
      ) : (
        <ul className="space-y-2">
          {entries.map((urge) => (
            <Card key={urge.id} as="li" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium">
                    <Link
                      href={`/journal/${urge.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      Wanted to {urge.intent}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {TRIGGER_LABELS[urge.trigger]} · intensity {urge.intensity}/10 ·{" "}
                    {absoluteTime(urge.at)} ({relativeTime(urge.at, now)})
                  </p>
                  {urge.note ? <p className="mt-2 text-sm italic">“{urge.note}”</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Badge tone={urge.risk.state}>Risk {urge.risk.score}</Badge>
                  <Badge>{OUTCOME_LABELS[urge.outcome]}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
