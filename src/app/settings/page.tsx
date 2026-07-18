"use client";

/**
 * Settings.
 *
 * Also the data-control surface: export everything, or wipe it. Because all state lives
 * in this browser, "delete my data" is genuinely complete here rather than a request
 * someone else has to honour.
 */

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store/provider";
import { updatePlan } from "@/lib/store/state";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { screenSeverity } from "@/lib/safety/severity";
import type { HabitKind } from "@/lib/domain/types";

const HABIT_OPTIONS: { value: HabitKind; label: string }[] = [
  { value: "screen_time", label: "Screen time" },
  { value: "social_media", label: "Social media" },
  { value: "gaming", label: "Gaming" },
  { value: "smoking", label: "Smoking" },
  { value: "vaping", label: "Vaping" },
  { value: "alcohol", label: "Alcohol" },
  { value: "junk_food", label: "Junk food" },
  { value: "other", label: "Something else" },
];

export default function SettingsPage() {
  const { state, update, reset, hydrated } = useStore();

  const [displayName, setDisplayName] = useState(state.profile.displayName);
  const [habit, setHabit] = useState<HabitKind>(state.profile.habit);
  const [habitLabel, setHabitLabel] = useState(state.profile.habitLabel);
  const [goal, setGoal] = useState(state.profile.goal);
  const [why, setWhy] = useState(state.profile.why);
  const [saved, setSaved] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Re-screening on habit change is a safety requirement, not a preference: switching to
  // a substance with withdrawal risk must change what the app is willing to coach.
  const severity = useMemo(
    () =>
      screenSeverity({
        habit,
        daysPerWeek: 5,
        physicalSymptomsOnStopping: false,
        previousFailedAttempts: false,
      }),
    [habit],
  );

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        displayName: displayName.trim() || "there",
        habit,
        habitLabel: habitLabel.trim() || current.profile.habitLabel,
        goal: goal.trim() || current.profile.goal,
        why: why.trim() || current.profile.why,
        severity,
      },
    }));
    setSaved(true);
  }

  function exportData() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "circuit-breaker-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearConversation() {
    update((current) => ({ ...current, coachMessages: [] }));
  }

  function retireAllPlans() {
    update((current) =>
      current.plans.reduce((next, plan) => updatePlan(next, plan.id, { active: false }), current),
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        lede="Your profile shapes everything the app generates. Your data never leaves this browser."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="mb-3 text-lg font-semibold">
            Profile
          </h2>
          <Card>
            <form onSubmit={saveProfile} noValidate>
              <Field label="What should the app call you?" htmlFor="setting-name">
                <input
                  id="setting-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Which habit are you working on?" htmlFor="setting-habit">
                <select
                  id="setting-habit"
                  value={habit}
                  onChange={(event) => setHabit(event.target.value as HabitKind)}
                  className={inputClass}
                >
                  {HABIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              {severity.requiresMedicalGuidance ? (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border-2 border-[var(--color-urgent-500)] p-4 text-sm"
                >
                  <p className="font-semibold">This app will not coach you to stop this.</p>
                  <p className="mt-2">{severity.reason}</p>
                </div>
              ) : null}

              <Field
                label="Describe it in your own words"
                htmlFor="setting-label"
                hint="Used in everything the app generates, so specifics help."
              >
                <input
                  id="setting-label"
                  value={habitLabel}
                  onChange={(event) => setHabitLabel(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="What does success look like?" htmlFor="setting-goal">
                <input
                  id="setting-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Why does it matter to you?" htmlFor="setting-why">
                <textarea
                  id="setting-why"
                  rows={3}
                  value={why}
                  onChange={(event) => setWhy(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Button type="submit">Save profile</Button>
              {saved ? (
                <p role="status" className="mt-3 text-sm">
                  Saved.
                </p>
              ) : null}
            </form>
          </Card>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="data-heading">
            <h2 id="data-heading" className="mb-3 text-lg font-semibold">
              Your data
            </h2>
            <Card>
              <p className="text-sm text-[var(--text-muted)]">
                Everything lives in this browser&apos;s local storage. There is no account, no
                server database, and nothing about your habits is transmitted anywhere. When you
                generate something, only the prompt context is sent — never your journal.
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--text-muted)]">Urges logged</dt>
                  <dd className="text-lg font-semibold tabular-nums">{state.urges.length}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Plans</dt>
                  <dd className="text-lg font-semibold tabular-nums">{state.plans.length}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Check-ins</dt>
                  <dd className="text-lg font-semibold tabular-nums">{state.checkIns.length}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Storage</dt>
                  <dd className="text-lg font-semibold">{hydrated ? "Local" : "Loading"}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                <Button variant="secondary" className="w-full" onClick={exportData}>
                  Export everything as JSON
                </Button>
                <Button variant="secondary" className="w-full" onClick={clearConversation}>
                  Clear the coach conversation
                </Button>
                <Button variant="secondary" className="w-full" onClick={retireAllPlans}>
                  Retire all plans
                </Button>
              </div>
            </Card>
          </section>

          <section aria-labelledby="reset-heading">
            <h2 id="reset-heading" className="mb-3 text-lg font-semibold">
              Reset
            </h2>
            <Card>
              <p className="text-sm text-[var(--text-muted)]">
                Deletes everything you have added and restores the 30-day demo history, so the app
                is explorable again from a clean state.
              </p>
              {confirmingReset ? (
                <div className="mt-4">
                  <p className="text-sm font-medium">
                    This deletes your own entries permanently. Continue?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        reset();
                        setConfirmingReset(false);
                      }}
                    >
                      Yes, reset to demo data
                    </Button>
                    <Button variant="quiet" onClick={() => setConfirmingReset(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" className="mt-4" onClick={() => setConfirmingReset(true)}>
                  Reset to demo data
                </Button>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
