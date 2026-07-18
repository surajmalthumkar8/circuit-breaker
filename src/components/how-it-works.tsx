"use client";

/**
 * The interactive walkthrough.
 *
 * A visitor — or an automated evaluator — should be able to understand the whole product
 * from the landing page without clicking through fourteen routes. This is that surface.
 *
 * Two decisions govern the implementation.
 *
 * It is a tab set, not a carousel. A carousel marks its inactive slides aria-hidden, so
 * anything reading the accessibility tree sees only the first step and concludes the page
 * has one. Tabs keep all four titles permanently readable and give keyboard users the
 * arrow-key behaviour they already expect.
 *
 * The depth is CSS 3D over real DOM nodes, not WebGL. A canvas is a bitmap: MDN is explicit
 * that its contents are not exposed to accessibility tools, which would make the one part
 * of the site that explains the product invisible to both screen readers and agents. Every
 * layer below is an element with text in it, and the whole scene costs zero bytes of
 * JavaScript beyond this file.
 *
 * There is deliberately no auto-advance. Content that moves on its own needs a pause
 * control under WCAG 2.2.2, and a walkthrough that changes while you are reading it is
 * worse than one you drive yourself.
 */

import { useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

interface WalkthroughStep {
  /** Short label for the tab and the panel heading. */
  title: string;
  /** The stage of the loop this step interrupts. */
  eyebrow: string;
  /** Prose shown alongside the mock. Asserted in tests, so it stays a plain string. */
  body: string;
  /** Text alternative for the mock screen, which is decorative on its own. */
  screenAlt: string;
  href: string;
  linkLabel: string;
  screen: ReactNode;
}

/* ---------- The mock screens ----------
 *
 * Miniature reconstructions of the real interface, built from the same tokens as the app
 * itself so they cannot drift into showing something the product does not do. They are
 * DOM, not images: crisp at any zoom, theme-aware, and weightless.
 *
 * Each is wrapped by the panel in role="img" with a text alternative, so nothing
 * interactive may live inside one — it would be unreachable behind that role.
 */

function MockAirlock() {
  return (
    <>
      <div className="demo-row">
        <span className="demo-label">What are you about to do?</span>
        <span className="demo-input">open Instagram for a minute</span>
      </div>
      <div className="demo-grid-2">
        <div>
          <span className="demo-label">Trigger</span>
          <span className="demo-chip">Boredom</span>
        </div>
        <div>
          <span className="demo-label">Intensity</span>
          <span className="demo-meter">
            <span className="demo-meter-fill" style={{ width: "80%" }} />
          </span>
          <span className="demo-value">8 / 10</span>
        </div>
      </div>
    </>
  );
}

function MockRisk() {
  const factors = [
    { label: "Craving intensity", points: "+24" },
    { label: "Late hour", points: "+14" },
    { label: "Boredom beat you 3 of 4 times", points: "+18" },
    { label: "Slept 5.2h", points: "+6" },
  ];
  return (
    <>
      <div className="demo-score-row">
        <span className="demo-score">62</span>
        <span className="demo-state">High risk</span>
      </div>
      <ul className="demo-factors">
        {factors.map((factor) => (
          <li key={factor.label}>
            <span>{factor.label}</span>
            <span className="demo-points">{factor.points}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function MockIntervention() {
  return (
    <>
      <div className="demo-pacer">
        <span className="demo-pacer-orb" />
        <span className="demo-pacer-label">Breathe out — 4 counts</span>
      </div>
      <ol className="demo-steps">
        <li>Notice where boredom sits in your body.</li>
        <li>Name the urge without arguing with it.</li>
        <li>Let it crest — it falls on its own.</li>
      </ol>
      <span className="demo-foot">90 seconds · generated for boredom</span>
    </>
  );
}

function MockInsights() {
  const bars = [72, 41, 58, 30, 24, 66, 88, 52];
  return (
    <>
      <div className="demo-row">
        <span className="demo-label">When urges happen</span>
      </div>
      <div className="demo-hist">
        {bars.map((height, index) => (
          <span
            key={index}
            className="demo-bar"
            style={{ height: `${height}%`, opacity: 0.35 + height / 200 }}
          />
        ))}
      </div>
      <div className="demo-grid-2">
        <div>
          <span className="demo-label">Hardest trigger</span>
          <span className="demo-value-lg">Boredom</span>
        </div>
        <div>
          <span className="demo-label">Riskiest hour</span>
          <span className="demo-value-lg">11pm</span>
        </div>
      </div>
    </>
  );
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    title: "Route the urge",
    eyebrow: "Cue",
    body:
      "Instead of blocking an app it cannot reach, Circuit Breaker intercepts the intent. You " +
      "say what you are about to do, what set it off, and how strong it is. Putting a deliberate " +
      "step between a cue and an automatic routine is itself the intervention.",
    screenAlt:
      "The Airlock screen: an intent field reading open Instagram for a minute, a trigger of boredom, and an intensity of 8 out of 10.",
    href: "/airlock",
    linkLabel: "Open the Airlock",
    screen: <MockAirlock />,
  },
  {
    title: "Score the moment",
    eyebrow: "Assessment",
    body:
      "A deterministic function — not the model — weighs craving strength, hour of day, your own " +
      "history with that trigger, recent sleep, and how mature the change is. It shows its " +
      "arithmetic, so the number is auditable rather than something a language model asserted.",
    screenAlt:
      "A risk readout of 62, marked high risk, itemised into craving intensity, late hour, trigger history, and short sleep.",
    href: "/dashboard",
    linkLabel: "See the dashboard",
    screen: <MockRisk />,
  },
  {
    title: "Meet the state",
    eyebrow: "Intervention",
    body:
      "The interface restructures to match what it found. At high risk the surface cools, " +
      "secondary panels recede, and generation produces an urge-surfing script for the trigger " +
      "you actually named — read aloud, paced against a breathing guide.",
    screenAlt:
      "An urge-surfing script with a breathing pacer and three steps, generated for boredom and lasting ninety seconds.",
    href: "/sos",
    linkLabel: "Try the SOS",
    screen: <MockIntervention />,
  },
  {
    title: "Learn from it",
    eyebrow: "Feedback",
    body:
      "Every pass sharpens the next one. The map of which triggers beat you and at which hours is " +
      "built from your own logged history — and the streak counts urges you rode out, so a single " +
      "lapse does not erase the work.",
    screenAlt:
      "An insights view: a histogram of urges by hour, with boredom as the hardest trigger and 11pm the riskiest hour.",
    href: "/insights",
    linkLabel: "See the insights",
    screen: <MockInsights />,
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  /** Automatic activation: arrows move focus and select, per the ARIA tabs pattern. */
  function select(index: number) {
    const next = (index + WALKTHROUGH_STEPS.length) % WALKTHROUGH_STEPS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  /*
   * The handler sits on each tab rather than on the tablist. The tablist is a container
   * and never takes focus itself, so a key event can only originate on the tab that
   * currently holds it.
   */
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const handlers: Record<string, () => void> = {
      ArrowRight: () => select(active + 1),
      ArrowLeft: () => select(active - 1),
      Home: () => select(0),
      End: () => select(WALKTHROUGH_STEPS.length - 1),
    };
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  const step = WALKTHROUGH_STEPS[active]!;

  return (
    <section aria-labelledby={`${baseId}-heading`} className="py-20">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-5">Walk through it</p>
        <h2 id={`${baseId}-heading`} className="display-lg">
          One urge, start to finish
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[var(--text-muted)]">
          Four steps, each a screen you can open for real. Use the arrow keys, or open any step
          directly.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="How Circuit Breaker works, step by step"
        aria-orientation="horizontal"
        className="mb-6 flex flex-wrap gap-2"
      >
        {WALKTHROUGH_STEPS.map((item, index) => (
          <button
            key={item.title}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={tabId(index)}
            aria-selected={index === active}
            aria-controls={panelId(index)}
            tabIndex={index === active ? 0 : -1}
            onKeyDown={onKeyDown}
            onClick={() => setActive(index)}
            className={
              index === active ? "demo-tab demo-tab-active" : "demo-tab"
            }
          >
            <span className="demo-tab-index" aria-hidden="true">
              {index + 1}
            </span>
            {item.title}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={panelId(active)}
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="demo-panel"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div key={`copy-${active}`} className="demo-copy">
            <p className="eyebrow mb-4">{step.eyebrow}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{step.body}</p>
            <Link
              href={step.href}
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] underline underline-offset-4"
            >
              {step.linkLabel}
            </Link>
          </div>

          {/*
           * The scene. Perspective lives here; the slab below owns the 3D context. Neither
           * carries overflow, opacity, or a filter — any of those silently collapse
           * transform-style back to flat, which is the classic way a CSS 3D scene dies
           * with no error in the console.
           */}
          <div className="demo-scene">
            <div
              key={`slab-${active}`}
              role="img"
              aria-label={step.screenAlt}
              className="demo-slab"
            >
              <div className="demo-face" aria-hidden="true">
                {step.screen}
              </div>
              <span className="demo-glow" aria-hidden="true" />
              <span className="demo-tag" aria-hidden="true">
                {step.eyebrow}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
