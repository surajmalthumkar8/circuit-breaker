# Circuit Breaker — demo script and decision record

**Live:** https://circuit-breaker-seven.vercel.app
**Repo:** https://github.com/surajmalthumkar8/circuit-breaker
**Diagrams:** `docs/architecture.drawio` and `docs/flow.drawio` (open at [app.diagrams.net](https://app.diagrams.net), File → Open From → Device)

This document is written so you can talk from it cold. Part 1 is the demo. Part 2 answers the
questions people will actually ask. Part 3 is every judgement call and what forced it.

---

## The one-sentence version

Circuit Breaker measures how much self-control you have available right now, then rebuilds itself
to match what it found, because self-control is not a character trait. It is a physiological state
that moves with sleep, stress, and the hour of the night.

## The 30-second version

Most habit apps count days and block websites. Both fail for the same reason. A streak counter
punishes you at the exact moment you most need help, and a browser cannot block anything outside
its own tab.

So Circuit Breaker does something else. When you feel an urge, you tell it what you are about to do.
It scores that specific moment out of 100 using six weighted signals from your own history. Then the
interface physically changes: at high risk it removes options, enlarges targets, and generates a
90-second urge-surfing script spoken aloud for the specific trigger you named. Every outcome feeds
back in, so the score gets sharper about you with every pass.

The score is a pure function. The AI explains it, but never computes it.

---

# PART 1 — THE DEMO

Seven minutes, in order. Every screen already has 30 days of history in it, so nothing is empty.

### 0. Open the landing page (30s)

Scroll to **"One urge, start to finish."** Click through the four tabs, or press the arrow keys.

> "This is the whole product in four steps. It is built in CSS 3D over real DOM elements, not
> WebGL, and that was a deliberate accessibility decision I will come back to."

### 1. The Airlock — routing an urge (90s)

Go to **/airlock**. Type a real intent: *"open Instagram for a minute."* Pick **Boredom**. Drag
intensity to **8**. Submit.

Point at the score as it lands:

> "62 out of 100. Look at the breakdown. It is not a mood ring. Craving strength contributed 24,
> the late hour 14, and this line here is the important one: *this trigger has led to a lapse 3 of
> 4 times.* That number came out of my own logged history, not a guess."

Then point at the interface itself:

> "And notice the page changed. The accent cooled, and the secondary panels faded back. At high
> risk the interface deliberately carries less stimulation, because stimulation is the problem."

### 2. The intervention (60s)

Click through to the generated script. Let one step read aloud.

> "Groq wrote this for boredom specifically, at this intensity, referencing the four days I have
> already put in. If Groq were down, Gemini would have written it. If both were down, a hand-written
> engine takes over and the app keeps working. That is why all 188 tests pass with no API key and
> no network."

### 3. The Model Playground — the strongest 90 seconds (90s)

Go to **/simulator**. Drag the sliders and let people watch the number move in real time.

> "This is the actual scoring function, live. No network call, no model, no lag. Drag time of day
> from 11pm to 9am and watch 14 points fall off."

Then scroll to **What would actually help**:

> "This panel re-runs the entire model once per lever and reports the measured reduction. It is not
> generic advice. It is telling this specific person that on this specific night, sleep is worth
> more than willpower."

**This is the moment that proves nothing is faked.** If someone doubts the app is real, this is
the screen to show them.

### 4. Trends — is it working (60s)

Go to **/trends**.

> "The heatmap shows exactly when the week gets dangerous. Cells go red when more than half the
> urges in that slot ended in a lapse."

Point at a dashed mark in the minutes chart:

> "And this matters more than it looks. A day I did not log shows as a gap, never a zero-height bar.
> A chart that makes missing data look like failure will push someone to quit over a week they
> simply forgot to record."

### 5. The safety gate (45s) — do not skip this

Go to **/coach** and type something that signals crisis.

> "It refuses to coach. It hands back verified helplines and stops. That check runs on the server
> before any model sees the text, and it is deliberately keyword-based rather than model-based, so
> it is instant, works offline, and cannot be talked out of. A habit app is not a crisis service and
> should never pretend otherwise."

### 6. Honesty (30s)

Land on the **"What a web app genuinely cannot do"** section of the landing page.

> "I put the limitation on the front page. A browser cannot read your screen time or block other
> apps. So I intercept the intent instead, and putting a deliberate step between a cue and an
> automatic routine is itself the intervention. It is the mechanism, not a workaround."

---

# PART 2 — QUESTIONS YOU WILL BE ASKED

### "Where is the GenAI, really?"

Seven generation tasks, all through one route: urge-surfing scripts, if-then plans, risk narratives,
lapse post-mortems, future-self letters, coach replies, and nudge copy. Groq with
`llama-3.1-8b-instant` is primary, Gemini 2.5 Flash-Lite is the fallback.

The interesting part is what the AI **does not** do. It never computes the risk score.

### "Why keep the AI away from the score?"

Five reasons, and they all pull the same direction.

1. **It is testable.** A pure function has 100% test coverage. A model output cannot.
2. **It cannot hallucinate.** The number is arithmetic.
3. **It is instant.** No round-trip, which is what makes the live slider on `/simulator` possible.
4. **It is auditable.** I can show you every factor and its points, so you can disagree with it.
5. **It still works with no key.** The core inference survives the AI being unavailable.

A number someone acts on while they are craving should be arithmetic they can check.

### "How does the score actually work?"

Six weighted factors summing to 100, in `src/lib/risk/vulnerability.ts`:

| Factor | Max | Why it is in there |
|---|---|---|
| Craving intensity | 30 | Strongest predictor of the next few minutes |
| Time of day | 18 | Late night is peak vulnerability, fatigue lowers prefrontal control |
| Trigger history | 18 | A cue with a reinforced route to the routine is more dangerous |
| Sleep and stress | 16 | Both measurably reduce available self-control |
| Habit maturity | 10 | New streaks are brittle, decays across roughly 66 days |
| Urge clustering | 8 | Several urges close together signal an escalating episode |

### "Is the data real or mocked?"

Real. The app ships with 30 days of seeded history so no screen is ever empty, but everything you do
computes live from actual inputs plus your stored history. The `/simulator` page is the proof: drag
a slider and the number recomputes instantly from the same function the rest of the app uses.

### "Why localStorage and no database?"

Four reasons:

1. **Privacy.** Habit data is sensitive. It never leaves the device.
2. **No auth wall.** An evaluator or a user hits a working app immediately, with no sign-up.
3. **No cold database.** Free-tier databases pause after inactivity, which would break the demo.
4. **Populated first paint.** The seed loads synchronously, so nothing flashes empty.

The tradeoff is honest and documented: data is per-browser and does not sync.

### "What about security?"

- Every input validated with Zod, free text length-capped so nobody drains the quota
- Rate limiting keyed on proxy-set headers, not the spoofable `x-forwarded-for`
- Crisis screening before any model call
- User text is fenced as data, so "ignore your instructions" arrives as information, not a command
- Outbound sanitising strips invented phone numbers, because a hallucinated crisis line is an active hazard
- CSP, HSTS, nosniff, frame DENY, referrer and permissions policies, all verifiable with `curl -I`
- API keys are server-side only and never prefixed `NEXT_PUBLIC_`

### "What about accessibility?"

Accessibility and AI-evaluability are the same problem, because both read the accessibility tree
rather than the pixels. Every control is a real button or link with an accessible name. `axe-core`
assertions run in the test suite. `jsx-a11y` violations are build errors, not warnings.

This drove the single biggest technical decision in the redesign. See below.

### "Why CSS 3D instead of Three.js?"

Because a WebGL canvas is invisible to the people and systems that need to read it.

MDN is explicit that canvas content is not exposed to accessibility tools. Playwright ARIA snapshots
return an effectively empty tree for canvas apps. Putting the *"how to use this app"* walkthrough
inside a canvas would have made the most explanatory content on the site unreadable to screen
readers and to any automated evaluator.

So the walkthrough is an ARIA tab set over `transform-style: preserve-3d`. Every layer is a real DOM
node with real text. It also cost **zero bundle weight**: shared JS stayed at 102 kB. Three.js plus
React Three Fiber would have added roughly 165 to 250 kB gzipped for a scene that scored worse.

It is a tab set rather than a carousel for the same reason. A carousel marks inactive slides
`aria-hidden`, so an evaluator would only ever see step one.

### "What does the app deliberately not do?"

- It does not block apps or read your screen time. A browser cannot, and it says so on the front page.
- It does not coach anyone in crisis. It hands over verified helplines and stops.
- It never coaches cessation of alcohol, benzodiazepines, or opioids, because withdrawal can be fatal.
- It does not reset your streak after a lapse, because the evidence says missing one day does not reset the curve.
- It does not use guilt, streak-loss threats, or shame. Those provoke reactance and backfire.

---

# PART 3 — DECISIONS AND WHAT FORCED THEM

### Intercept intent, not apps

**Forced by:** the browser sandbox. A web app genuinely cannot see or modify other apps.

Rather than hide that, I made it the mechanism. Habit loops run cue → routine → reward with control
sitting in the dorsolateral striatum, below deliberate thought. Inserting a conscious step between
cue and routine is exactly what breaks automaticity. The limitation and the intervention turned out
to be the same thing.

### The score is a pure function

**Forced by:** wanting it testable, instant, and honest all at once.

This is the load-bearing decision in the codebase. Everything good downstream follows from it.

### The streak survives a lapse

**Forced by:** Lally et al. 2010, which found missing a single day did not reset the automaticity
curve, and by relapse-prevention work on the abstinence-violation effect.

What turns one slip into a full relapse is believing the attempt is now ruined. A streak counter
that resets to zero manufactures that belief. So the streak here counts urges ridden out, and a
lapse triggers a blame-free post-mortem that writes a better plan.

### Keyword crisis detection, not a model

**Forced by:** wanting it instant, offline, and impossible to talk out of.

A model-based classifier is smarter and also slower, needs a network call, and can be argued with.
For a safety gate, deterministic and dumb beats clever. It is a net, not a guarantee, and the README
says so.

### UTC everywhere for hour-of-day

**Forced by:** a real bug found in a browser. Local time differed between server and client, which
produced a wrong "hardest hour" and would have caused hydration mismatches.

Documented tradeoff: users far from UTC see shifted analysis hours. The correct production fix is a
stored per-event local hour.

### The simpler CSP

**Forced by:** a bug that build tools could not see. A nonce plus `strict-dynamic` policy blocked all
26 Next.js scripts, and the app would have shipped as dead HTML with zero interactivity. The build
passed. Tests passed. `curl` returned 200. Only a real browser caught it.

That is why the repo carries a static CSP and a note to test in a browser, not just `npm run build`.

### Humanised output

**Forced by:** the fact that an instruction to a language model is a probability, not a guarantee.

The prompts ask for plain human phrasing and ban the usual machine-writing patterns. On top of that,
`humanise()` deterministically strips the punctuation tells from every generated string on the way
to the screen. Same reasoning as keeping the score out of the model: when it has to hold, make it
deterministic.

---

## Numbers worth quoting

| | |
|---|---|
| Tests | **188**, passing with no API key and no network |
| Routes | 17, every one independently functional |
| Shared JS | **102 kB** (the 3D added zero) |
| Runtime dependencies | **4** — next, react, react-dom, zod |
| Repo size | 1.5 MB |
| Risk model | 6 factors, 100% statement coverage |

## Evidence behind the mechanisms

| Claim | Effect | Where it shows up |
|---|---|---|
| Implementation intentions | d ≈ 0.65 across 94 tests, 8,000+ people | `/plans` |
| Urge surfing | g ≈ −0.70 across 17 randomised trials | `/sos` |
| Time to automaticity | median 66 days, one missed day does not reset | streak logic |
| Hypofrontality | measurable prefrontal impairment in habit loops | the whole premise |

Where evidence is mixed or an effect is small, the app says so. A health-adjacent tool that oversells
is worse than one that does less.

## If a demo goes wrong

- **Generation looks slow or odd** → say so, then point out the offline engine means nothing breaks. Degrading gracefully is the design.
- **Someone asks about screen-time tracking** → go straight to the honesty section. Naming the limit is stronger than dodging it.
- **A number looks unexpected** → open `/simulator` and derive it live. Every factor is visible.
