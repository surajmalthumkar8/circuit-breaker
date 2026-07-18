"use client";

/**
 * The plan library.
 *
 * Implementation intentions — "when X, I will Y" — are the highest-evidence technique
 * software can deliver for changing an automatic behaviour (d≈0.65 across 94 tests).
 * They work by deciding the response in advance, so the decision does not have to be
 * made in the moment when self-control is already low.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag } from "@/lib/domain/types";

type Filter = "all" | "active" | "retired";

export default function PlansPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [tag, setTag] = useState<TriggerTag | "any">("any");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.plans.filter((plan) => {
      if (filter === "active" && !plan.active) return false;
      if (filter === "retired" && plan.active) return false;
      if (tag !== "any" && plan.tag !== tag) return false;
      if (!needle) return true;
      return (
        plan.trigger.toLowerCase().includes(needle) ||
        plan.action.toLowerCase().includes(needle) ||
        plan.rationale.toLowerCase().includes(needle)
      );
    });
  }, [state.plans, query, filter, tag]);

  return (
    <div>
      <PageHeader
        title="Your plans"
        lede="Each one pairs a cue you will actually notice with a response small enough to do without deciding."
        action={<ButtonLink href="/plans/new">New plan</ButtonLink>}
      />

      <section aria-labelledby="filter-heading" className="mb-6">
        <h2 id="filter-heading" className="sr-only">
          Filter plans
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="plan-search" className="mb-1.5 block text-sm font-medium">
              Search
            </label>
            <input
              id="plan-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="bed, boredom, walk…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="plan-status" className="mb-1.5 block text-sm font-medium">
              Status
            </label>
            <select
              id="plan-status"
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="retired">Retired</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label htmlFor="plan-tag" className="mb-1.5 block text-sm font-medium">
              Trigger
            </label>
            <select
              id="plan-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value as TriggerTag | "any")}
              className={inputClass}
            >
              <option value="any">Any trigger</option>
              {TRIGGER_TAGS.map((option) => (
                <option key={option} value={option}>
                  {TRIGGER_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <p aria-live="polite" className="mb-3 text-sm text-[var(--text-muted)]">
        Showing {visible.length} of {state.plans.length} plans.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title="No plans match that filter"
          body="Try clearing the search box or switching the status back to All."
          action={<ButtonLink href="/plans/new">Write a new plan</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((plan) => {
            const rate =
              plan.timesUsed === 0 ? null : Math.round((plan.timesWorked / plan.timesUsed) * 100);
            return (
              <Card key={plan.id} as="li">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold">
                    <Link href={`/plans/${plan.id}`} className="underline-offset-2 hover:underline">
                      {plan.trigger}
                    </Link>
                  </h2>
                  <div className="flex shrink-0 gap-1.5">
                    <Badge>{TRIGGER_LABELS[plan.tag]}</Badge>
                    {!plan.active ? <Badge>Retired</Badge> : null}
                  </div>
                </div>

                <p className="mt-2 text-sm">
                  <span className="text-[var(--text-muted)]">…then </span>
                  {plan.action}
                </p>

                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  {rate === null
                    ? "Not used yet."
                    : `Worked ${plan.timesWorked} of ${plan.timesUsed} times (${rate}%).`}{" "}
                  {plan.source === "ai" ? "Generated." : "Written by you."}
                </p>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
