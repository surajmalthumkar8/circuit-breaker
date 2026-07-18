"use client";

/**
 * Future self.
 *
 * Generates a letter from the person's own self, five years on. Research on future-self
 * continuity found that a single session interacting with an AI-generated future self
 * reduced anxiety and increased motivation — feeling connected to who you will become
 * improves long-term self-control.
 */

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store/provider";
import { summariseStreak } from "@/lib/habit/streak";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedFutureSelf } from "@/lib/ai/schemas";
import { Button, ButtonLink, Card, PageHeader, SourceNote } from "@/components/ui";

export default function FutureSelfPage() {
  const { state } = useStore();
  const letter = useGenerate<GeneratedFutureSelf>();
  const [requested, setRequested] = useState(false);

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  async function generate() {
    setRequested(true);
    await letter.run({
      task: "future_self",
      context: {
        habitLabel: state.profile.habitLabel,
        goal: state.profile.goal,
        why: state.profile.why,
        streakDays: streak.currentDays,
      },
    });
  }

  const body = letter.outcome?.data;

  return (
    <div>
      <PageHeader
        title="A letter from your future self"
        lede="Written as you, five years from now, having kept this going. It is a strange exercise and it works better than it sounds."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="letter-heading" className="lg:col-span-2">
          <h2 id="letter-heading" className="sr-only">
            The letter
          </h2>

          {!requested ? (
            <Card>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                People who feel connected to their future self make better long-term decisions —
                they save more, procrastinate less, and hold habit changes for longer. The gap is
                that your future self usually feels like a stranger. This is a way of narrowing
                that gap.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                The letter uses what you told the app: that you are working on{" "}
                {state.profile.habitLabel}, and that it matters to you because “{state.profile.why}”
              </p>
              <Button className="mt-5" onClick={generate}>
                Write my letter
              </Button>
            </Card>
          ) : null}

          {letter.loading ? (
            <Card>
              <p role="status">Writing…</p>
            </Card>
          ) : null}

          {body ? (
            <Card>
              <p className="text-sm text-[var(--text-muted)]">
                From you, {body.horizonYears} years from now
              </p>
              <div className="mt-4 space-y-4 text-base leading-relaxed">
                {body.body.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={generate} disabled={letter.loading}>
                  Write another
                </Button>
                <ButtonLink href="/plans" variant="secondary">
                  Turn this into a plan
                </ButtonLink>
              </div>
              <SourceNote
                source={letter.outcome?.source ?? "demo"}
                live={Boolean(letter.outcome?.live)}
              />
            </Card>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">Why this works</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              In a study of 344 people, a single conversation with an AI-generated future self
              reduced anxiety and increased future-self continuity — the sense that the person you
              will be is really you, and worth acting on behalf of.
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">An honest caveat</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              This letter is generated fiction. It is not a prediction and it cannot promise you an
              outcome. It is useful as a way of thinking, not as evidence about your life.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
