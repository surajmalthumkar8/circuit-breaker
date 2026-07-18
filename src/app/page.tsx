import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";

/**
 * Landing page.
 *
 * States the problem and the approach in plain text — which is also what makes the
 * purpose of the project legible to anyone (or anything) reading the page rather than
 * exploring the app. The primary action goes straight into a working, populated
 * dashboard: there is no sign-up, no wall, and no setup.
 */

const PILLARS = [
  {
    title: "Intelligent nudges",
    body:
      "Every urge you route through the Airlock is scored by a deterministic model that weighs " +
      "craving strength, time of day, your own history with that trigger, recent sleep and " +
      "stress, and how mature the habit change is. The interface then changes to match the " +
      "state it found.",
    href: "/airlock",
    linkLabel: "Open the Airlock",
  },
  {
    title: "Personalized tracking",
    body:
      "A daily check-in and a full journal of every urge, outcome, and intervention. Insights " +
      "turns that history into a map of which triggers actually beat you and at which hours, " +
      "rather than a count of days.",
    href: "/insights",
    linkLabel: "See the insights",
  },
  {
    title: "Adaptive coaching",
    body:
      "Generated implementation intentions — if-then plans bound to your real cues — that get " +
      "rewritten after a lapse. Plus a coach that uses motivational interviewing: it asks, " +
      "reflects, and lets you supply your own reasons.",
    href: "/plans",
    linkLabel: "View your plans",
  },
  {
    title: "Support mechanisms",
    body:
      "A craving SOS that generates a spoken, ninety-second urge-surfing script for the " +
      "specific trigger you are facing, with a breathing pacer. Plus a safety layer that knows " +
      "when to stop coaching and hand you to a human.",
    href: "/sos",
    linkLabel: "Try the SOS",
  },
];

const EVIDENCE = [
  {
    claim: "If-then plans are the strongest lever software can deliver",
    detail:
      "Implementation intentions show d≈0.65 across 94 tests and more than 8,000 people. They " +
      "work by deciding your response in advance, so you do not have to decide in the moment " +
      "when your control is already low.",
  },
  {
    claim: "Urge surfing measurably reduces craving",
    detail:
      "Mindfulness-based craving interventions show g≈−0.70 across 17 randomised trials. " +
      "Cravings rise, crest, and fall on their own — usually within minutes.",
  },
  {
    claim: "Hard blocks backfire",
    detail:
      "Controlling, lockout-style designs provoke psychological reactance and can increase the " +
      "behaviour they target. Every restriction here is framed as your own pre-commitment.",
  },
  {
    claim: "A lapse does not reset your progress",
    detail:
      "Habit-formation research found that missing a single day did not disturb the " +
      "automaticity curve. What turns a slip into a relapse is believing the attempt is ruined.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl py-8 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
          GenAI habit change
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Break the habit loop, not your willpower
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-muted)]">
          Your self-control is not a constant. It is a physical state that drops with tiredness,
          stress, and the wrong hour of the night. Circuit Breaker senses when yours is weakest and
          rewrites itself to meet you there.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/dashboard">Open the dashboard</ButtonLink>
          <ButtonLink href="/airlock" variant="secondary">
            I am having an urge right now
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No sign-up. No API key needed. Loaded with 30 days of demo history so every screen works
          immediately.
        </p>
      </section>

      <section aria-labelledby="how-heading" className="mt-12">
        <h2 id="how-heading" className="mb-5 text-xl font-semibold">
          What it does
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} as="article">
              <h3 className="text-base font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{pillar.body}</p>
              <Link
                href={pillar.href}
                className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline"
              >
                {pillar.linkLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="why-heading" className="mt-14">
        <h2 id="why-heading" className="mb-2 text-xl font-semibold">
          Why it is built this way
        </h2>
        <p className="mb-5 max-w-3xl text-sm text-[var(--text-muted)]">
          Every mechanism in this app traces to published behaviour-change research. Where the
          evidence is mixed or the effect is small, the app says so rather than overclaiming.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {EVIDENCE.map((item) => (
            <Card key={item.claim} as="li">
              <h3 className="text-sm font-semibold">{item.claim}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.detail}</p>
            </Card>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Sources and the full method are on the{" "}
          <Link href="/help" className="underline">
            help and safety page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
