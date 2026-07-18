"use client";

/**
 * Craving SOS.
 *
 * Generates an urge-surfing script for the specific trigger the person is facing, then
 * delivers it one step at a time with a breathing pacer and optional spoken audio.
 *
 * Urge surfing treats a craving as a wave that rises, crests, and falls rather than an
 * order to obey — mindfulness-based craving interventions show g≈-0.70 across 17
 * randomised trials. Existing apps ship a fixed recording; this writes the script for
 * the trigger you actually named.
 *
 * Speech uses the browser's own synthesis, so it costs nothing and needs no service.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { addIntervention, logUrge, resolveUrge } from "@/lib/store/state";
import { summariseStreak } from "@/lib/habit/streak";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { useGenerate } from "@/lib/ai/use-generate";
import type { GeneratedIntervention } from "@/lib/ai/schemas";
import { TRIGGER_LABELS, TRIGGER_TAGS, type TriggerTag } from "@/lib/domain/types";
import { Button, ButtonLink, Card, Field, PageHeader, SourceNote, inputClass } from "@/components/ui";
import { CrisisPanel } from "@/components/crisis-panel";

export default function SosPage() {
  const { state, update } = useStore();
  const [intent, setIntent] = useState("");
  const [trigger, setTrigger] = useState<TriggerTag>("habit_cue");
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [finished, setFinished] = useState(false);
  const urgeIdRef = useRef<string | null>(null);

  const intervention = useGenerate<GeneratedIntervention>();
  const script = intervention.outcome?.data ?? null;

  const streak = useMemo(
    () => summariseStreak(state.urges, DEMO_ANCHOR, new Date(state.profile.createdAt)),
    [state.urges, state.profile.createdAt],
  );

  // Feature-detect speech synthesis after mount; it is absent in some browsers and must
  // never be assumed during render.
  useEffect(() => {
    setSpeechAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!speechAvailable) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      utterance.onend = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [speechAvailable],
  );

  async function startSession(event: React.FormEvent) {
    event.preventDefault();
    const now = new Date();

    // The SOS is itself a logged urge, so it appears in the journal and the counts.
    const result = logUrge(state, {
      intent: intent.trim() || "act on the craving",
      intensity: 8,
      trigger,
      mood: "restless",
      at: now,
    });
    update(() => result.state);
    urgeIdRef.current = result.urge.id;
    setStep(0);
    setFinished(false);

    const generated = await intervention.run({
      task: "intervention",
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

    if (generated.data && urgeIdRef.current) {
      const urgeId = urgeIdRef.current;
      update((current) =>
        addIntervention(current, {
          id: `intervention-${Date.now().toString(36)}`,
          urgeEventId: urgeId,
          at: now.toISOString(),
          kind: generated.data!.kind,
          title: generated.data!.title,
          steps: generated.data!.steps,
          closing: generated.data!.closing,
          durationSec: generated.data!.durationSec,
          generatedBy: generated.source,
        }),
      );
      speak(generated.data.steps[0] ?? "");
    }
  }

  function nextStep() {
    if (!script) return;
    if (step < script.steps.length - 1) {
      const next = step + 1;
      setStep(next);
      speak(script.steps[next] ?? "");
    } else {
      setFinished(true);
      speak(script.closing);
    }
  }

  function reportOutcome(outcome: "rode_it_out" | "lapsed") {
    if (urgeIdRef.current) {
      const id = urgeIdRef.current;
      update((current) => resolveUrge(current, id, outcome, new Date()));
    }
    if (speechAvailable) window.speechSynthesis.cancel();
    setFinished(false);
    setStep(0);
    setIntent("");
    urgeIdRef.current = null;
  }

  const running = Boolean(script) && !intervention.loading;

  return (
    <div data-risk="high_risk">
      <PageHeader
        title="Craving SOS"
        lede="Ninety seconds. You do not have to beat the craving, you only have to outlast it — they rise, crest, and fall on their own."
      />

      {intervention.outcome?.blocked ? (
        <CrisisPanel
          message={intervention.outcome.crisisMessage}
          resources={intervention.outcome.resources}
        />
      ) : null}

      {!running && !intervention.loading && !intervention.outcome?.blocked ? (
        <Card className="mx-auto max-w-xl">
          <form onSubmit={startSession} noValidate>
            <Field
              label="What are you fighting right now?"
              htmlFor="sos-intent"
              hint="The script is written for this exact situation, so be specific if you can."
            >
              <input
                id="sos-intent"
                name="intent"
                type="text"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                placeholder="open TikTok even though I said I would sleep"
                className={inputClass}
                autoComplete="off"
              />
            </Field>

            <Field label="What set it off?" htmlFor="sos-trigger">
              <select
                id="sos-trigger"
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

            <Button type="submit" className="w-full">
              Start the session
            </Button>
            <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
              Works with the sound off. Speech is optional and uses your browser&apos;s own voice.
            </p>
          </form>
        </Card>
      ) : null}

      {intervention.loading ? (
        <Card className="mx-auto max-w-xl text-center">
          <p role="status">Writing a script for this moment…</p>
        </Card>
      ) : null}

      {running && script ? (
        <div className="mx-auto max-w-xl">
          <Card>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{script.title}</h2>
              <span className="text-sm text-[var(--text-muted)]">
                {finished ? "Done" : `Step ${step + 1} of ${script.steps.length}`}
              </span>
            </div>

            <div className="my-8 flex justify-center" aria-hidden="true">
              <div className="breathing-orb h-32 w-32 rounded-full bg-[var(--accent)] opacity-80" />
            </div>
            <p className="mb-6 text-center text-sm text-[var(--text-muted)]">
              Let your breathing follow the circle. In as it grows, out as it shrinks.
            </p>

            <p
              aria-live="polite"
              className="min-h-24 rounded-lg bg-[var(--surface-sunken)] p-5 text-center text-lg leading-relaxed"
            >
              {finished ? script.closing : script.steps[step]}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {!finished ? (
                <Button onClick={nextStep}>
                  {step < script.steps.length - 1 ? "Next step" : "Finish"}
                </Button>
              ) : null}

              {speechAvailable ? (
                <Button
                  variant="secondary"
                  onClick={() => speak(finished ? script.closing : (script.steps[step] ?? ""))}
                  ariaLabel="Read the current step aloud"
                >
                  {speaking ? "Speaking…" : "Read aloud"}
                </Button>
              ) : null}
            </div>

            {finished ? (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <h3 className="text-base font-semibold">How did that land?</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Either answer is useful. This is how the next script gets better.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => reportOutcome("rode_it_out")}>I rode it out</Button>
                  <Button variant="secondary" onClick={() => reportOutcome("lapsed")}>
                    I lapsed
                  </Button>
                </div>
                <Link
                  href="/journal"
                  className="mt-4 inline-block text-sm text-[var(--accent)] underline"
                >
                  This session is saved in your journal
                </Link>
              </div>
            ) : null}

            <SourceNote
              source={intervention.outcome?.source ?? "demo"}
              live={Boolean(intervention.outcome?.live)}
            />
          </Card>
        </div>
      ) : null}

      <section aria-labelledby="more-heading" className="mx-auto mt-8 max-w-xl deprioritise">
        <h2 id="more-heading" className="mb-3 text-base font-semibold">
          If this is not enough
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <ButtonLink href="/coach" variant="secondary" className="justify-start">
            Talk it through with the coach
          </ButtonLink>
          <ButtonLink href="/help" variant="secondary" className="justify-start">
            Reach a real person
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
