# Circuit Breaker

**A GenAI web application for breaking bad habits and addictions — starting with excessive screen
time.**

Circuit Breaker senses when your self-control is physiologically at its weakest and adapts its
interface, its coaching, and its interventions to meet you there.

**Live demo:** _(deployed link)_ · **No sign-up. No API key needed.** The app ships with 30 days of
demo history and a deterministic offline engine, so every screen works the moment you open it.

---

## 1. The problem

> *Build a GenAI-powered solution that helps users reduce or overcome harmful habits such as
> excessive screen time or addictions, using Generative AI as a core component to deliver
> intelligent nudges, personalized tracking, adaptive coaching, and support mechanisms.*

**The pain point.** People trying to cut down on screen time already know they should. Knowing is
not the missing piece. What actually happens is that a cue arrives — bed, boredom, a bad hour of the
night — at a moment when their capacity to resist is measurably lower than usual, and no alternative
response is ready. The behaviour runs before deliberation gets involved.

**Why existing apps do not solve it.** The market splits three ways, and each misses:

| What exists | Why it falls short |
|---|---|
| **Blockers** (Opal, Freedom, one sec) | Static. The same lockout at 9am and at 1am, though those are completely different physiological states. Hard blocks also provoke reactance, which can *increase* the behaviour. |
| **Counters** (I Am Sober, Quitzilla, Nomo) | They measure the problem. They do nothing at the moment the craving peaks. |
| **Chatbots** (Woebot, Wysa) | You have to be willing to open a chat and type, which is the last thing anyone does mid-urge. |

The gap none of them fill: **nothing changes what it does based on how depleted you actually are
right now.**

**The insight this is built on.** Self-control is not a character trait — it is a fluctuating
physical state. Chronic habit loops measurably reduce prefrontal control (Volkow et al. document
hypofrontality via PET/fMRI), and that capacity varies with time of day, sleep debt, stress, and cue
exposure. So the app models that state explicitly and changes itself to match.

---

## 2. Approach

The loop is `SENSE → INFER → ADAPT → INTERVENE → LEARN`.

1. **SENSE** — you route an urge through the Airlock instead of acting on it, with three taps:
   what, how strong, what set it off.
2. **INFER** — a **deterministic** scoring function weighs craving intensity, hour of day, your own
   history with that trigger, recent sleep and stress, habit maturity, and urge clustering into a
   0–100 vulnerability score.
3. **ADAPT** — the interface restructures for the state it found. At high risk the palette cools,
   non-essential surfaces recede, and the intervention comes forward.
4. **INTERVENE** — generated content written for *this* trigger: an urge-surfing script read aloud,
   an if-then plan, a risk explanation.
5. **LEARN** — outcomes feed back. A lapse triggers a blame-free post-mortem that regenerates the
   plan for that exact trigger.

### The load-bearing design decision

**The risk score is calculated, never generated. The model explains it — it never invents it.**

This is the most important choice in the codebase. It means risk assessment is:

- **testable** — a pure function with 13 tests covering its edge cases
- **un-hallucinatable** — a model cannot be wrong about your risk in a way you can't check
- **free** — no API round-trip is needed to know you are in danger
- **honest** — every urge shows the exact factors and point values that produced its number

See [`src/lib/risk/vulnerability.ts`](src/lib/risk/vulnerability.ts).

### Where GenAI is the core, not a garnish

| Problem-statement capability | Where it lives | What the model does |
|---|---|---|
| **Intelligent nudges** | [`/airlock`](src/app/airlock/page.tsx), [`/insights`](src/app/insights/page.tsx) | Translates the computed risk factors into an actionable read; writes notification copy for your specific risky windows |
| **Personalized tracking** | [`/checkin`](src/app/checkin/page.tsx), [`/journal`](src/app/journal/page.tsx), [`/insights`](src/app/insights/page.tsx) | Turns your logged history into a trigger map, an hourly risk profile, and a sleep-versus-lapse comparison |
| **Adaptive coaching** | [`/plans`](src/app/plans/page.tsx), [`/coach`](src/app/coach/page.tsx), [`/future-self`](src/app/future-self/page.tsx) | Generates implementation intentions bound to your real cues; runs a motivational-interviewing conversation; writes a letter from your future self |
| **Support mechanisms** | [`/sos`](src/app/sos/page.tsx), [`/help`](src/app/help/page.tsx) | Writes a 60–90 second urge-surfing script for the exact trigger you named, delivered as speech with a breathing pacer |

Generation returns **typed, schema-validated JSON that renders as components** — not prose dumped
on screen. That is what makes this an artifact engine rather than a chat window.

---

## 3. The evidence behind each mechanism

Every feature traces to a published mechanism. Where evidence is mixed, the app says so.

| Feature | Mechanism | Evidence |
|---|---|---|
| If-then plans | Implementation intentions | **d≈0.65**, 94 tests, 8,000+ people (Gollwitzer & Sheeran 2006) |
| Craving SOS | Urge surfing | **g≈−0.70** across 17 RCTs |
| The Airlock pause | Stimulus control + JITAI | Friction-pause interventions cut social-app opens ~57% (PNAS) |
| Resilience streak | Relapse prevention (Marlatt) | Missing one day did **not** reset the automaticity curve (Lally 2010, median 66 days) |
| Coach voice | Motivational interviewing | Controlling delivery performs *worse* than none — reactance |
| Future-self letter | Future-self continuity | n=344; reduced anxiety, raised motivation (MIT) |
| No hard blocks | Self-determination theory | Lockouts provoke reactance and can increase the behaviour |

---

## 4. Architecture

```
src/
  app/                    14 routes, each independently functional
    api/generate/         The ONLY server route — all generation flows through it
  components/             Presentational primitives, navigation, crisis panel
  lib/
    ai/       generate.ts     provider fallback chain (tested)
              providers.ts    Groq + Gemini over plain REST
              prompts.ts      prompt text as data, separate from logic
              schemas.ts      Zod contract for every generated artifact
              demo-content.ts hand-written fallbacks — the app works with no key
    data/     seed.ts         30 days of deterministic demo history
    domain/   types.ts        single source of truth
    habit/    streak.ts       resilience streak (tested)
    risk/     vulnerability.ts  the scoring function (tested)
    safety/   crisis.ts       crisis detection + verified helplines (tested)
              severity.ts     dependence screening (tested)
    store/    state.ts        pure transitions + selectors (tested)
              provider.tsx    SSR-safe React binding
```

### Data flow, and why there is no database

State lives in the browser (`localStorage`), seeded synchronously from a static module.

This is a deliberate choice, not a shortcut:

- **Privacy.** For a health-adjacent app, "your behavioural data never leaves your device" is a
  genuine guarantee rather than a policy promise. Nothing about your habits is transmitted; a
  generation request sends only the habit label, goal, stated reason, streak length, and the one
  urge in question.
- **No auth wall.** A reviewer, or anyone, reaches a fully working app in one click.
- **No cold database.** A hosted free-tier database that idles into a paused state is a demo that
  is broken exactly when someone opens it.
- **Populated first paint.** Because the seed is a static import rather than an async query, the
  server renders real content immediately — no empty flash, no hydration mismatch.

### The provider chain

`Groq (llama-3.1-8b-instant)` → `Google Gemini 2.5 Flash-Lite` → `deterministic offline content`

Each rung is tried in order; a timeout, rate limit, malformed response, or schema violation falls
through to the next. **The app is fully functional at the third rung**, which is why the entire test
suite runs without an API key and why a reviewer never sees a dead feature. Every generated item is
labelled with which engine produced it.

---

## 5. Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration required. To enable live generation, copy `.env.example` to `.env` and add either
key — both are optional and free:

```bash
GROQ_API_KEY=...                    # console.groq.com/keys
GOOGLE_GENERATIVE_AI_API_KEY=...    # aistudio.google.com/apikey
```

```bash
npm run verify       # typecheck + lint + test
npm test             # 68 tests, no API key or network needed
npm run build        # production build
```

---

## 6. How each judging criterion is addressed

### Code quality
TypeScript `strict` plus `noUncheckedIndexedAccess`, no `any` anywhere. Business logic lives in pure
functions under `lib/`; components render. Prompts are data, kept out of logic. Conventions are
documented in [`AGENTS.md`](AGENTS.md).

### Security
- Keys read from `process.env` in **server code only**; no AI key is ever `NEXT_PUBLIC_`.
- `.env` gitignored, `.env.example` documents names with empty values. Repository scanned for
  secret patterns before commit.
- **Every** request body validated with Zod; unknown tasks and malformed JSON return 400.
- Free-text fields length-capped and `maxOutputTokens` capped, so the endpoint cannot be used to
  drain quota.
- Sliding-window rate limit on the generation route (30/min). *Known limitation, stated rather than
  hidden: it counts per serverless instance; a shared store would be correct at production scale.*
- Security headers set in `next.config.ts` (`nosniff`, `DENY` framing, referrer policy, and camera
  / microphone / geolocation denied).
- No SQL, so no SQL injection surface. React escapes by default and no `dangerouslySetInnerHTML` is
  used anywhere, so no XSS surface. No PII leaves the device.

### Efficiency
- **102 kB shared first-load JS**; the heaviest route is 3.8 kB of its own code.
- No image assets at all — the interface is typography and CSS.
- Lean dependency tree: five runtime dependencies. Providers are called over plain `fetch` rather
  than pulling in SDKs.
- Risk scoring needs **no API call**. Generation is only invoked when a user asks for it.
- Hard timeouts on every model call, client and server, so nothing can hang.
- Skeleton loading states that mirror the final layout rather than unbounded spinners.

### Testing
68 tests across the safety layer, risk scoring, streak arithmetic, the provider fallback chain, and
state transitions — **all passing with no API key and no network**, which is what makes them
reproducible for anyone who clones this. Tests cover the edge cases that matter: crisis phrases must
block, alcohol must never get cessation coaching, out-of-range input must clamp, a failed provider
must fall through, and a lapse must not erase progress. CI runs typecheck, lint, tests, and build on
every push.

### Accessibility
Semantic landmarks and heading hierarchy on every page, a skip link, visible focus rings, labelled
form controls with hints, `aria-live` on results that change, `aria-current` on the active nav item,
and `prefers-reduced-motion` respected on the breathing animation. Every interactive element is a
real `<button>` or `<a>` with an accessible name — an icon-only control is invisible to a screen
reader, and the SOS flow is precisely where that would matter most. `eslint-plugin-jsx-a11y` runs as
**errors**, not warnings.

### Problem-statement alignment
See the capability table in §2. All four required capabilities — intelligent nudges, personalized
tracking, adaptive coaching, support mechanisms — map to named routes and files.

---

## 7. Assumptions and limitations

Stated plainly, because a health-adjacent app that overclaims is worse than one that does less.

1. **A web application cannot see your device's screen time.** The browser sandbox forbids reading
   other apps or sites, and no web Screen Time API exists. The app therefore intercepts the
   *intent* — you route the urge through it — and asks you for your minutes rather than pretending
   to measure them. Real interception would require a browser extension or a native app.
2. **The demo history is fictional.** It belongs to "Sam" and exists so every screen is explorable
   immediately. Reset it from Settings.
3. **Time is handled in UTC** so the server and client agree and hydration stays safe. A user far
   from UTC will see analysis hours shifted; storing a per-event local hour is the correct fix at
   production scale.
4. **The risk model is a reasoned heuristic, not a validated clinical instrument.** Its factors and
   weights come from published mechanisms, but the specific weighting has not been trialled.
5. **Crisis detection is keyword-based** — deterministic and impossible to talk out of, but it will
   miss things. It is a safety net, not a safety guarantee.
6. **This is not therapy** and not a medical device. It will never coach cessation of alcohol,
   benzodiazepines, or opioids, because withdrawal from those can cause seizures and can be fatal.
   That branch routes to medical supervision instead.
7. **Rate limiting is per-instance**, as noted above.

---

## 8. GenAI services used

| Service | Where |
|---|---|
| **Groq** — `llama-3.1-8b-instant` | Primary generation for all seven tasks: urge-surfing scripts, if-then plans, risk narratives, lapse post-mortems, future-self letters, coaching replies, nudge copy |
| **Google Gemini** — `gemini-2.5-flash-lite` | Automatic fallback when Groq is unavailable or rate limited |
| **Deterministic offline engine** | Final rung. Hand-written, schema-valid content so the app is complete with no key configured |
| **Web Speech API** (`speechSynthesis`) | Speaks the generated urge-surfing script aloud — browser-native, no service, no cost |

---

## License

MIT — see [LICENSE](LICENSE).
