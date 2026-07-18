import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { CrisisPanel } from "@/components/crisis-panel";

export const metadata: Metadata = {
  title: "Help & safety",
  description:
    "Crisis resources, what Circuit Breaker will and will not do, how the risk score works, and the research behind each mechanism.",
};

/**
 * Help and safety.
 *
 * A Server Component: it holds no state, so it renders as static HTML. Crisis resources
 * must be reachable even if every interactive part of the app fails.
 */

const MECHANISMS = [
  {
    feature: "The Airlock and the risk score",
    mechanism: "Just-in-time adaptive intervention, plus stimulus control",
    evidence:
      "Routing an urge through a deliberate step puts distance between a cue and an automatic " +
      "routine. The score itself is a deterministic function of craving strength, hour, your own " +
      "trigger history, sleep and stress, and habit maturity — a model explains it, never invents it.",
  },
  {
    feature: "Plans (if-then)",
    mechanism: "Implementation intentions",
    evidence:
      "The strongest lever software can offer: d≈0.65 across 94 tests and more than 8,000 people. " +
      "They work by deciding the response in advance, so you are not deciding at the moment your " +
      "control is lowest.",
  },
  {
    feature: "Craving SOS",
    mechanism: "Urge surfing",
    evidence:
      "Mindfulness-based craving interventions show g≈−0.70 across 17 randomised trials. Cravings " +
      "rise, crest, and fall on their own, usually within minutes.",
  },
  {
    feature: "The resilience streak",
    mechanism: "Relapse prevention",
    evidence:
      "Habit-formation research found that missing one day did not disturb the automaticity curve. " +
      "What turns a slip into a relapse is believing the attempt is ruined, so the streak here " +
      "survives a lapse and the app never says you lost it.",
  },
  {
    feature: "The coach",
    mechanism: "Motivational interviewing",
    evidence:
      "MI asks rather than tells, because controlling and lecturing styles provoke reactance and " +
      "make the target behaviour more likely, not less.",
  },
  {
    feature: "A letter from your future self",
    mechanism: "Future-self continuity",
    evidence:
      "In a study of 344 people, one conversation with an AI-generated future self reduced anxiety " +
      "and increased motivation.",
  },
];

const LIMITS = [
  "It is not therapy, not a medical device, and not a crisis service.",
  "It will not diagnose anything, and it will not give medical, dosage, or tapering advice.",
  "It will never coach you to stop alcohol, benzodiazepines, or opioids on your own. Withdrawal from these can cause seizures and can be fatal — that needs medical supervision.",
  "It cannot see your device's screen time. A web page cannot read other apps, and the app asks you rather than pretending otherwise.",
  "It cannot detect a crisis reliably. It screens for obvious signals and stops, but it will miss things.",
  "Generated content can be wrong. Everything it writes is a suggestion to weigh, not an instruction to follow.",
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help & safety"
        lede="What this app does, what it deliberately will not do, and how to reach a real person."
      />

      <div className="mb-10">
        <CrisisPanel message="If any of this is bigger than a habit right now, these lines are free, confidential, and staffed by people." />
      </div>

      <section aria-labelledby="limits-heading" className="mb-10">
        <h2 id="limits-heading" className="mb-3 text-xl font-semibold">
          What Circuit Breaker will not do
        </h2>
        <Card>
          <ul className="list-disc space-y-2.5 pl-5 text-sm leading-relaxed">
            {LIMITS.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="mechanism-heading" className="mb-10">
        <h2 id="mechanism-heading" className="mb-3 text-xl font-semibold">
          How each part works, and why
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-[var(--text-muted)]">
          Every feature traces to a published mechanism. Where evidence is mixed or an effect is
          small, this page says so rather than overclaiming.
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {MECHANISMS.map((item) => (
            <Card key={item.feature} as="li">
              <h3 className="text-base font-semibold">{item.feature}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--accent)]">{item.mechanism}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.evidence}
              </p>
            </Card>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacy-heading" className="mb-10">
        <h2 id="privacy-heading" className="mb-3 text-xl font-semibold">
          Privacy
        </h2>
        <Card>
          <p className="text-sm leading-relaxed">
            Everything you record — urges, notes, check-ins, plans, conversations — is stored in
            this browser only. There is no account, no server database, and no analytics.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            When you generate something, the request sends only the context needed for that one
            piece of writing: the habit you named, your goal, your stated reason, your streak
            length, and the specific urge. Your journal is never transmitted. You can export or
            erase everything from{" "}
            <Link href="/settings" className="text-[var(--accent)] underline">
              settings
            </Link>
            .
          </p>
        </Card>
      </section>

      <section aria-labelledby="ai-heading">
        <h2 id="ai-heading" className="mb-3 text-xl font-semibold">
          About the AI
        </h2>
        <Card>
          <p className="text-sm leading-relaxed">
            Generated content comes from Groq (Llama 3.1 8B Instant), falling back to Google Gemini
            2.5 Flash-Lite. If neither is reachable — or no key is configured — the app falls back
            to a hand-written library so every feature still works. Each generated item is labelled
            with which engine produced it.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            The risk score is deliberately not generated. It is a deterministic function you can
            read in the source, and every urge shows the exact factors that produced its number.
            A model that could invent your risk score would be a model that could be wrong about
            it in ways you could not check.
          </p>
        </Card>
      </section>
    </div>
  );
}
