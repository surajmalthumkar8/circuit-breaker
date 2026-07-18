"use client";

/**
 * Daily check-in.
 *
 * This is ecological momentary assessment, kept deliberately short — four taps and a
 * number. Sleep and stress feed the depletion factor in the vulnerability score, which
 * is why they are asked rather than inferred: a browser cannot measure either honestly.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/provider";
import { addCheckIn } from "@/lib/store/state";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { MOODS, TRIGGER_LABELS, TRIGGER_TAGS, type Mood, type TriggerTag } from "@/lib/domain/types";
import { DEMO_ANCHOR } from "@/lib/data/seed";
import { formatMinutes } from "@/lib/format";

/** Today's date key, derived from the demo anchor so it is stable across renders. */
const TODAY = DEMO_ANCHOR.toISOString().slice(0, 10);

export default function CheckInPage() {
  const { state, update } = useStore();

  const existing = state.checkIns.find((entry) => entry.date === TODAY);

  const [date, setDate] = useState(TODAY);
  const [mood, setMood] = useState<Mood>(existing?.mood ?? "ok");
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours ?? 7);
  const [stress, setStress] = useState(existing?.stress ?? 4);
  const [minutes, setMinutes] = useState(existing?.minutesOnHabit ?? 60);
  const [triggers, setTriggers] = useState<TriggerTag[]>(existing?.triggers ?? []);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  const history = useMemo(
    () => [...state.checkIns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [state.checkIns],
  );

  const average = useMemo(() => {
    if (state.checkIns.length === 0) return 0;
    const total = state.checkIns.reduce((sum, entry) => sum + entry.minutesOnHabit, 0);
    return Math.round(total / state.checkIns.length);
  }, [state.checkIns]);

  function toggleTrigger(tag: TriggerTag) {
    setTriggers((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update((current) =>
      addCheckIn(current, {
        date,
        mood,
        sleepHours,
        stress,
        minutesOnHabit: minutes,
        triggers,
        note: note.trim() || undefined,
        at: new Date(),
      }),
    );
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        title="Daily check-in"
        lede="Four taps and a number. Sleep and stress genuinely change how much self-control you have available, so they feed directly into your risk score."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="checkin-heading" className="lg:col-span-2">
          <h2 id="checkin-heading" className="sr-only">
            Record today
          </h2>
          <Card>
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Date" htmlFor="checkin-date">
                <input
                  id="checkin-date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="How has your mood been?" htmlFor="checkin-mood">
                <select
                  id="checkin-mood"
                  name="mood"
                  value={mood}
                  onChange={(event) => setMood(event.target.value as Mood)}
                  className={inputClass}
                >
                  {MOODS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={`Sleep: ${sleepHours} hours`}
                htmlFor="checkin-sleep"
                hint="Short sleep is one of the strongest predictors of a hard evening."
              >
                <input
                  id="checkin-sleep"
                  name="sleep"
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={sleepHours}
                  onChange={(event) => setSleepHours(Number(event.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>

              <Field label={`Stress: ${stress} out of 10`} htmlFor="checkin-stress">
                <input
                  id="checkin-stress"
                  name="stress"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={stress}
                  onChange={(event) => setStress(Number(event.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>

              <Field
                label="Minutes on the habit today"
                htmlFor="checkin-minutes"
                hint="Your own estimate is fine. A browser cannot read your device's screen time, and pretending otherwise would be dishonest."
              >
                <input
                  id="checkin-minutes"
                  name="minutes"
                  type="number"
                  min={0}
                  max={1440}
                  value={minutes}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                  className={inputClass}
                />
              </Field>

              <fieldset className="mb-5">
                <legend className="mb-2 block text-sm font-medium">
                  Which triggers showed up today?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_TAGS.map((tag) => {
                    const checked = triggers.includes(tag);
                    return (
                      <label
                        key={tag}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                          checked
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="triggers"
                          value={tag}
                          checked={checked}
                          onChange={() => toggleTrigger(tag)}
                          className="sr-only"
                        />
                        {TRIGGER_LABELS[tag]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <Field label="Anything worth remembering?" htmlFor="checkin-note" hint="Optional.">
                <textarea
                  id="checkin-note"
                  name="note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Button type="submit" className="w-full">
                {existing ? "Update today's check-in" : "Save check-in"}
              </Button>

              {saved ? (
                <p role="status" className="mt-3 text-sm">
                  Saved. It now feeds your{" "}
                  <Link href="/airlock" className="text-[var(--accent)] underline">
                    risk score
                  </Link>{" "}
                  and your{" "}
                  <Link href="/insights" className="text-[var(--accent)] underline">
                    insights
                  </Link>
                  .
                </p>
              ) : null}
            </form>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">Your average</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{formatMinutes(average)}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Across {state.checkIns.length} check-ins. Your goal is {state.profile.goal}.
            </p>
          </Card>

          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 text-lg font-semibold">
              Recent check-ins
            </h2>
            <ul className="space-y-2">
              {history.map((entry) => (
                <Card key={entry.id} as="li" className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{entry.date}</span>
                    <Badge>{formatMinutes(entry.minutesOnHabit)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {entry.sleepHours}h sleep · stress {entry.stress}/10 · feeling {entry.mood}
                  </p>
                </Card>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
