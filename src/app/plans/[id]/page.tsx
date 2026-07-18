"use client";

/**
 * Plan detail, edit, retire, and delete.
 *
 * The success record shown here is real: it is incremented whenever an urge with this
 * plan's trigger is resolved in the Airlock or the SOS. One write elsewhere in the app is
 * observable here, which is what makes the plans feel connected rather than decorative.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { deletePlan, updatePlan } from "@/lib/store/state";
import { Badge, Button, ButtonLink, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag } from "@/lib/domain/types";
import { absoluteTime, OUTCOME_LABELS, relativeTime } from "@/lib/format";

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, update, now } = useStore();

  const plan = state.plans.find((candidate) => candidate.id === params.id);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draftTrigger, setDraftTrigger] = useState(plan?.trigger ?? "");
  const [draftAction, setDraftAction] = useState(plan?.action ?? "");
  const [draftTag, setDraftTag] = useState<TriggerTag>(plan?.tag ?? "habit_cue");

  // Urges this plan defends, so the detail page links back into the journal.
  const relatedUrges = useMemo(() => {
    if (!plan) return [];
    return state.urges
      .filter((urge) => urge.trigger === plan.tag)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [plan, state.urges]);

  if (!plan) {
    return (
      <div>
        <PageHeader
          title="Plan not found"
          lede="That plan does not exist, or it was deleted from this browser."
        />
        <ButtonLink href="/plans">Back to all plans</ButtonLink>
      </div>
    );
  }

  const successRate =
    plan.timesUsed === 0 ? null : Math.round((plan.timesWorked / plan.timesUsed) * 100);

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!plan) return;
    update((current) =>
      updatePlan(current, plan.id, {
        trigger: draftTrigger.trim() || plan.trigger,
        action: draftAction.trim() || plan.action,
        tag: draftTag,
      }),
    );
    setEditing(false);
  }

  function toggleActive() {
    if (!plan) return;
    update((current) => updatePlan(current, plan.id, { active: !plan.active }));
  }

  function confirmDelete() {
    if (!plan) return;
    update((current) => deletePlan(current, plan.id));
    router.push("/plans");
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/plans" className="text-[var(--text-muted)] underline">
          All plans
        </Link>
        <span className="mx-2 text-[var(--text-muted)]" aria-hidden="true">
          /
        </span>
        <span>Plan detail</span>
      </nav>

      <PageHeader
        title={plan.trigger}
        lede={`…then ${plan.action}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
              {editing ? "Cancel edit" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={toggleActive}>
              {plan.active ? "Retire" : "Reactivate"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {editing ? (
            <Card>
              <h2 className="mb-4 text-base font-semibold">Edit this plan</h2>
              <form onSubmit={saveEdit} noValidate>
                <Field label="When…" htmlFor="edit-trigger">
                  <input
                    id="edit-trigger"
                    value={draftTrigger}
                    onChange={(event) => setDraftTrigger(event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="…I will" htmlFor="edit-action">
                  <input
                    id="edit-action"
                    value={draftAction}
                    onChange={(event) => setDraftAction(event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Trigger family" htmlFor="edit-tag">
                  <select
                    id="edit-tag"
                    value={draftTag}
                    onChange={(event) => setDraftTag(event.target.value as TriggerTag)}
                    className={inputClass}
                  >
                    {TRIGGER_TAGS.map((option) => (
                      <option key={option} value={option}>
                        {TRIGGER_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit">Save changes</Button>
              </form>
            </Card>
          ) : (
            <Card>
              <h2 className="text-base font-semibold">Why this should work</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {plan.rationale}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[var(--text-muted)]">Defends against</dt>
                  <dd className="mt-1 font-medium">{TRIGGER_LABELS[plan.tag]}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Written</dt>
                  <dd className="mt-1 font-medium">
                    {plan.source === "ai" ? "Generated" : "By you"}, {relativeTime(plan.createdAt, now)}
                  </dd>
                </div>
              </dl>
            </Card>
          )}

          <section aria-labelledby="related-heading" className="mt-6">
            <h2 id="related-heading" className="mb-3 text-lg font-semibold">
              Urges this plan defends
            </h2>
            {relatedUrges.length === 0 ? (
              <Card>
                <p className="text-sm text-[var(--text-muted)]">
                  No urges logged with this trigger yet.
                </p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {relatedUrges.map((urge) => (
                  <Card key={urge.id} as="li" className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/journal/${urge.id}`} className="text-sm font-medium underline">
                        Wanted to {urge.intent}
                      </Link>
                      <div className="flex gap-2">
                        <Badge tone={urge.risk.state}>Risk {urge.risk.score}</Badge>
                        <Badge>{OUTCOME_LABELS[urge.outcome]}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{absoluteTime(urge.at)}</p>
                  </Card>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">Success record</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {successRate === null ? "—" : `${successRate}%`}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {plan.timesUsed === 0
                ? "Not used yet. It gets a record the first time an urge with this trigger is resolved."
                : `Worked ${plan.timesWorked} of ${plan.timesUsed} times it was in play.`}
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Status</h2>
            <p className="mt-2">
              <Badge>{plan.active ? "Active" : "Retired"}</Badge>
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {plan.active
                ? "In play. It will be credited when a matching urge is resolved."
                : "Retired. Kept for the record — an abandoned plan is data about what does not suit you."}
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Delete</h2>
            {confirmingDelete ? (
              <div className="mt-3">
                <p className="text-sm">Delete this plan permanently?</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" onClick={confirmDelete}>
                    Yes, delete
                  </Button>
                  <Button variant="quiet" onClick={() => setConfirmingDelete(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" className="mt-3" onClick={() => setConfirmingDelete(true)}>
                Delete this plan
              </Button>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
