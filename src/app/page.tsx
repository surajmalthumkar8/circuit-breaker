import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { LoopDiagram } from "@/components/loop-diagram";

/**
 * Landing page.
 *
 * A Server Component — it holds no state, so it renders as static HTML. It states the
 * problem and the approach in plain prose, which is what makes the purpose of the project
 * legible without having to explore the app first. The primary action goes straight into
 * a fully populated dashboard: no sign-up, no wall, no setup.
 */

const PILLARS = [
  {
    tag: "Intelligent nudges",
    title: "It knows when you are weakest",
    body:
      "Every urge you route through the Airlock is scored by a deterministic model weighing craving " +
      "strength, hour of day, your own history with that trigger, recent sleep and stress, and how " +
      "mature the habit change is. The interface then restructures to match the state it found.",
    href: "/airlock",
    linkLabel: "Open the Airlock",
    span: "lg:col-span-3",
  },
  {
    tag: "Support",
    title: "Ninety seconds, out loud",
    body:
      "A craving SOS that generates an urge-surfing script for the specific trigger you named, " +
      "spoken aloud with a breathing pacer.",
    href: "/sos",
    linkLabel: "Try the SOS",
    span: "lg:col-span-2",
  },
  {
    tag: "Adaptive coaching",
    title: "Plans bound to your real cues",
    body:
      "Generated if-then plans that rewrite themselves after a lapse, plus a coach that asks rather " +
      "than lectures.",
    href: "/plans",
    linkLabel: "View the plans",
    span: "lg:col-span-2",
  },
  {
    tag: "Personalized tracking",
    title: "Which triggers actually beat you",
    body:
      "Not a count of days. A map of the hours and the triggers where your logged history says the " +
      "loop wins, and how sleep moves the odds.",
    href: "/insights",
    linkLabel: "See the insights",
    span: "lg:col-span-3",
  },
];

const EVIDENCE = [
  {
    stat: "d≈0.65",
    claim: "If-then plans",
    detail:
      "Implementation intentions across 94 tests and more than 8,000 people — the strongest lever " +
      "software can deliver, because the response is decided before the moment arrives.",
  },
  {
    stat: "g≈−0.70",
    claim: "Urge surfing",
    detail:
      "Mindfulness-based craving reduction across 17 randomised trials. Cravings rise, crest, and " +
      "fall on their own, usually within minutes.",
  },
  {
    stat: "66 days",
    claim: "To automaticity",
    detail:
      "Median time for a new routine to become automatic. Critically, missing a single day did not " +
      "reset the curve — so the streak here survives a lapse.",
  },
  {
    stat: "0 keys",
    claim: "Needed to use it",
    detail:
      "The generation chain falls back to a hand-written offline engine, so every feature works and " +
      "the whole test suite passes with no API key at all.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="grid items-center gap-12 py-8 lg:grid-cols-[1.15fr_1fr] lg:py-16">
        <div className="rise">
          <p className="eyebrow mb-6">GenAI habit change</p>
          <h1 className="display-xl">
            Break the habit loop,
            <br />
            <span className="text-[var(--accent)]">not your willpower</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
            Your self-control is not a constant. It is a physical state that drops with tiredness,
            stress, and the wrong hour of the night. Circuit Breaker senses when yours is weakest
            and rewrites itself to meet you there.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" trailing>
              Open the dashboard
            </ButtonLink>
            <ButtonLink href="/airlock" variant="secondary">
              I am having an urge right now
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-[var(--text-muted)]">
            No sign-up. No API key needed. Loaded with 30 days of history so every screen works
            immediately.
          </p>
        </div>

        <div className="rise rise-2 relative mx-auto aspect-square w-full max-w-md">
          <LoopDiagram />
        </div>
      </section>

      <section aria-labelledby="how-heading" className="py-20">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow mb-5">What it does</p>
          <h2 id="how-heading" className="display-lg">
            Four things, each doing real work
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} as="article" interactive className={pillar.span}>
              <p className="eyebrow mb-4">{pillar.tag}</p>
              <h3 className="text-xl font-semibold tracking-tight">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{pillar.body}</p>
              <Link
                href={pillar.href}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] underline underline-offset-4"
              >
                {pillar.linkLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="why-heading" className="py-20">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow mb-5">The evidence</p>
          <h2 id="why-heading" className="display-lg">
            Every mechanism traces to a study
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-muted)]">
            Where the evidence is mixed or an effect is small, the app says so rather than
            overclaiming. A health-adjacent tool that oversells is worse than one that does less.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVIDENCE.map((item) => (
            <Card key={item.claim} as="li" interactive>
              <p className="text-3xl font-semibold tracking-tight text-[var(--accent)]">
                {item.stat}
              </p>
              <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.12em]">
                {item.claim}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{item.detail}</p>
            </Card>
          ))}
        </ul>

        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Sources and the full method are on the{" "}
          <Link href="/help" className="text-[var(--accent)] underline underline-offset-4">
            help and safety page
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="honest-heading" className="py-20">
        <Card>
          <div className="grid gap-8 py-4 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="eyebrow mb-5">Being honest</p>
              <h2 id="honest-heading" className="text-2xl font-semibold tracking-tight">
                What a web app genuinely cannot do
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                A browser cannot read your device&apos;s screen time, and it cannot see or modify
                other apps. That is the sandbox, not a limitation of effort, and no web application
                can honestly claim otherwise.
              </p>
              <p>
                So Circuit Breaker intercepts the <strong className="text-[var(--text)]">intent</strong>{" "}
                instead. You route the urge through it before acting. That routing is not a
                workaround — putting a deliberate step between a cue and an automatic routine is
                the intervention itself.
              </p>
              <Link
                href="/help"
                className="inline-flex text-sm font-medium text-[var(--accent)] underline underline-offset-4"
              >
                Read the full list of limits
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
