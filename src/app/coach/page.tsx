"use client";

/**
 * The coach.
 *
 * Uses motivational interviewing: open questions, reflection, affirming specific effort,
 * and supporting the person's autonomy. That style is chosen deliberately — MI delivered
 * in a controlling or lecturing register performs measurably WORSE than not intervening,
 * because it provokes reactance.
 *
 * The conversation is deliberately bounded. Safety guardrails erode over long exchanges,
 * so there is a turn cap and every message is screened before it reaches a model.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { addCoachMessage } from "@/lib/store/state";
import { summariseStreak } from "@/lib/habit/streak";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedCoachReply } from "@/lib/ai/schemas";
import { Button, ButtonLink, Card, PageHeader, inputClass } from "@/components/ui";
import { CrisisPanel } from "@/components/crisis-panel";
import { relativeTime } from "@/lib/format";

/** Guardrails degrade across long conversations, so the session is capped. */
const MAX_USER_TURNS = 12;

const STARTERS = [
  "I keep doing well all day and then losing it at night.",
  "I do not really know why I reach for it.",
  "I lapsed yesterday and I feel like giving up.",
  "What should I do when the urge is really strong?",
];

export default function CoachPage() {
  const { state, update } = useStore();
  const [draft, setDraft] = useState("");
  const coach = useGenerate<GeneratedCoachReply>();
  const endRef = useRef<HTMLDivElement>(null);

  const messages = state.coachMessages;
  const userTurns = messages.filter((message) => message.role === "user").length;
  const atLimit = userTurns >= MAX_USER_TURNS;

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, coach.loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || coach.loading || atLimit) return;

    const now = new Date();
    update((current) =>
      addCoachMessage(current, {
        id: `coach-${now.getTime().toString(36)}-u`,
        at: now.toISOString(),
        role: "user",
        content: message,
      }),
    );
    setDraft("");

    const history = messages
      .slice(-6)
      .map((entry) => `${entry.role === "user" ? "Them" : "You"}: ${entry.content}`)
      .join("\n");

    const result = await coach.run({
      task: "coach_reply",
      context: {
        habitLabel: state.profile.habitLabel,
        goal: state.profile.goal,
        why: state.profile.why,
        streakDays: streak.currentDays,
      },
      message,
      history,
    });

    if (result.data && !result.blocked) {
      const replyAt = new Date();
      update((current) =>
        addCoachMessage(current, {
          id: `coach-${replyAt.getTime().toString(36)}-a`,
          at: replyAt.toISOString(),
          role: "assistant",
          content: result.data!.reply,
          generatedBy: result.source,
        }),
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Coach"
        lede="This one asks more than it tells. The evidence is clear that being lectured about a habit makes people less likely to change it, not more."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="conversation-heading" className="lg:col-span-2">
          <h2 id="conversation-heading" className="sr-only">
            Conversation
          </h2>

          <Card className="p-0">
            <ul className="max-h-[28rem] space-y-4 overflow-y-auto p-5">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "bg-[var(--surface-sunken)]"
                    }`}
                  >
                    <p className="sr-only">
                      {message.role === "user" ? "You said" : "The coach replied"}:
                    </p>
                    <p>{message.content}</p>
                    <p
                      className={`mt-1.5 text-xs ${
                        message.role === "user"
                          ? "text-[var(--accent-contrast)] opacity-75"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {relativeTime(message.at)}
                    </p>
                  </div>
                </li>
              ))}

              {coach.loading ? (
                <li className="flex justify-start">
                  <p
                    role="status"
                    className="rounded-xl bg-[var(--surface-sunken)] px-4 py-3 text-sm text-[var(--text-muted)]"
                  >
                    Thinking…
                  </p>
                </li>
              ) : null}
              <div ref={endRef} />
            </ul>

            <div className="border-t border-[var(--border)] p-4">
              {coach.outcome?.blocked ? (
                <CrisisPanel
                  message={coach.outcome.crisisMessage}
                  resources={coach.outcome.resources}
                />
              ) : atLimit ? (
                <p className="text-sm text-[var(--text-muted)]">
                  This session has reached its length limit. Long conversations are where AI safety
                  guardrails tend to drift, so the app stops rather than pretending that is not a
                  risk.{" "}
                  <Link href="/settings" className="text-[var(--accent)] underline">
                    Clear the conversation
                  </Link>{" "}
                  to start fresh.
                </p>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send(draft);
                  }}
                >
                  <label htmlFor="coach-input" className="mb-1.5 block text-sm font-medium">
                    Say what is actually going on
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coach-input"
                      name="message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="I keep telling myself just five minutes…"
                      className={inputClass}
                      autoComplete="off"
                    />
                    <Button type="submit" disabled={coach.loading || draft.trim().length === 0}>
                      Send
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>

          {!atLimit && !coach.outcome?.blocked ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Or start with one of these</h3>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <Button
                    key={starter}
                    variant="secondary"
                    onClick={() => void send(starter)}
                    disabled={coach.loading}
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">What this is</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              A behaviour-change coach, not a therapist and not a crisis service. It will not
              diagnose anything, will not give medical advice, and will hand you to a real person if
              you need one.
            </p>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold">Where you are</h2>
            <p className="mt-2 text-sm">{streak.message}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Working on {state.profile.habitLabel}.
            </p>
          </Card>

          <Card className="deprioritise">
            <h2 className="text-sm font-semibold">Might help more right now</h2>
            <div className="mt-3 space-y-2">
              <ButtonLink href="/sos" variant="secondary" className="w-full justify-start">
                Ride out a craving
              </ButtonLink>
              <ButtonLink href="/plans/new" variant="secondary" className="w-full justify-start">
                Write a plan
              </ButtonLink>
              <ButtonLink href="/help" variant="secondary" className="w-full justify-start">
                Talk to a human
              </ButtonLink>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
