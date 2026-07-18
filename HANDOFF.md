# Session handoff — Circuit Breaker

**Written:** 18 July 2026, ~13:20 IST
**Repo:** https://github.com/surajmalthumkar8/circuit-breaker (public, single branch `main`)
**Local:** `c:\Users\Suraj\Downloads\main_hack2skill`

---

## What this is

A GenAI habit-change web application for the Hack2skill "Breaking Bad Habits & Addiction"
challenge. Next.js 15 + TypeScript, deployed target Vercel. Judged by an AI evaluator on
**Code Quality, Security, Efficiency, Testing, Accessibility, Problem Statement Alignment**,
with **one submission attempt**.

**The premise:** self-control is not a character trait, it is a fluctuating physiological state
(Volkow documents measurable hypofrontality). So the app models that state and adapts to it.

**The load-bearing design decision:** the vulnerability score is a **deterministic pure
function**. The model explains and acts on it, never computes it. That is what makes risk
testable, un-hallucinatable, free of an API round-trip, and honest enough to show the user the
arithmetic. See `src/lib/risk/vulnerability.ts`.

---

## State: what is done

| Area | Status |
|---|---|
| 14 connected routes | ✅ All verified HTTP 200 on a production build; 404 correct |
| Tests | ✅ **142 passing**, no API key and no network required |
| Typecheck / lint | ✅ Clean (`npm run verify`) |
| Production build | ✅ Clean, 102 kB shared first-load JS |
| Live AI | ✅ Groq confirmed working end-to-end (`"source":"groq","live":true`) |
| Offline fallback | ✅ Whole app works with zero keys |
| Security headers | ✅ CSP, HSTS, nosniff, DENY framing, referrer, permissions — verified via `curl -I` |
| Repo hygiene | ✅ ~500 KB, single branch, `.env` gitignored and verified unstaged on every commit |
| CI | ✅ `.github/workflows/ci.yml` — typecheck, lint, test, build on push; needs no secrets |
| **Vercel deploy** | ❌ **NOT DONE — blocked, see below** |

---

## ⚠️ The two things that still need a human

### 1. Deploy to Vercel (blocked on interactive login)

```bash
npx vercel login          # cannot be automated — OAuth
npx vercel --prod
```
Then in the Vercel dashboard add `GROQ_API_KEY`. The app deploys and works fine **without**
it (deterministic offline engine), but live generation is a better demo.

Afterwards set `NEXT_PUBLIC_SITE_URL` so `sitemap.xml` and `robots.txt` emit the real domain
instead of the placeholder `https://circuit-breaker.vercel.app`.

### 2. 🔑 Rotate the Groq API key

The key was pasted into the chat transcript in plaintext. It lives in `.env` (gitignored,
verified absent from git history), but **rotate it at console.groq.com** once the hackathon is
done.

---

## Architecture, in one screen

```
src/
  app/                14 routes, each independently functional
    api/generate/     THE only server route. All generation flows through it.
  components/         Presentational primitives, nav, crisis panel. No business logic.
  lib/
    ai/       generate.ts      provider fallback chain (tested)
              providers.ts     Groq + Gemini over plain fetch, no SDK
              prompts.ts       prompt text as data; user text is fenced
              schemas.ts       Zod contract per generated artifact
              demo-content.ts  hand-written fallbacks — app works with no key
              use-generate.ts  client hook; never throws, always falls back
    data/     seed.ts          30 days of deterministic demo history
    domain/   types.ts         single source of truth
    habit/    streak.ts        resilience streak — survives a lapse (tested)
    risk/     vulnerability.ts THE scoring function (tested, 100%)
    safety/   crisis.ts        crisis detection + verified helplines (tested, 100%)
              severity.ts      dependence screening (tested, 100%)
              sanitise.ts      prompt fencing + outbound number stripping (tested)
    store/    state.ts         pure transitions + selectors (tested)
              provider.tsx     SSR-safe React binding, supplies `now`
```

**Data:** localStorage, seeded synchronously from a static module. No database, no auth. This
is deliberate — see README §4 for the four reasons (privacy, no auth wall, no cold database,
populated first paint).

**Provider chain:** Groq (`llama-3.1-8b-instant`) → Gemini 2.5 Flash-Lite → deterministic
offline content. Every rung tested.

---

## Non-obvious things that will bite you

1. **Never read the clock during render.** `Date.now()`, `new Date()`, `localStorage`, or
   local-time methods like `getHours()` in a render path cause hydration mismatches. Time comes
   from `useStore().now` — the demo anchor on the server, the real clock after mount. This was
   a real bug that got fixed; don't reintroduce it.
2. **Hour-of-day analysis is UTC everywhere** (`getUTCHours`). Local time differed between
   server and client. Documented limitation: users far from UTC see shifted analysis hours.
3. **All store writes must use the functional form** — `update(current => f(current))`. Passing
   a render-time snapshot drops concurrent writes. Four places had this bug.
4. **Forms must sync on `hydrated`.** State initialisers run against the seed because
   localStorage loads in an effect. Settings and check-in were silently overwriting real user
   data because of this.
5. **The CSP is deliberately the simpler version.** A nonce + `strict-dynamic` policy was built
   and it blocked all 26 Next.js scripts, leaving inert HTML. Verified in a real browser, then
   replaced. If you revisit it, **test in a browser, not just via `npm run build`** — the build
   passes with the app completely broken.
6. **Add new routes to `src/components/nav-links.ts`.** The nav, the 404 recovery page, and the
   sitemap all read from it, so they cannot drift.
7. **Every generation task needs matching demo content** in `demo-content.ts`, or the app stops
   working without a key.

---

## Where the remaining risk is

From the adversarial code review — fixed items are gone; these are what is left:

**Not yet done (medium):**
- `src/app/insights/page.tsx` hardcodes "your risk is concentrated in the late hours" regardless
  of the actual histogram. Should be derived from `riskyWindows` or removed — it contradicts the
  app's own "never overclaim" principle.
- Same file renders `0.0h` for average sleep on lapse days when there is no overlap; should be `—`.
- `src/components/ui.test.tsx` — axe's `color-contrast` rule silently no-ops under jsdom (no
  canvas). Either disable it explicitly so the gap is honest, or check contrast in a browser.
- Dashboard tile says "Yesterday's screen time" but shows the most recent check-in.
- `coverage/**` missing from the eslint `ignores` list.
- `useGenerate` and `StoreProvider` have no tests; page components have no render tests.

**Accepted limitations, documented in README §7:**
- Rate limiting is per serverless instance.
- Risk model is a reasoned heuristic, not a validated clinical instrument.
- Crisis detection is keyword-based — a net, not a guarantee.
- `npm audit` shows 7 transitive advisories through Next's own bundled deps; the only "fix"
  downgrades Next to v9, so it was deliberately not applied. Next is on 15.5.20, above the
  May-2026 advisory line of 15.5.18.

---

## Ideas researched but not built

From the features research, ranked by judge-impact × buildability:

1. **RAG over the user's own journal** — "you've been here before", surfacing similar past
   entries at the craving moment. Highest-rated idea. Can be done with deterministic similarity
   (trigger + hour + intensity + text overlap), no model download needed.
2. **Agentic weekly review with a visible tool trace** — let the model call read-only tools over
   the user's data and render the calls live as a reasoning trace.
3. **Streaming generative UI** (`streamObject`) so artifacts materialise progressively.
4. **Future-self avatar image** via Gemini 2.5 Flash Image (free tier 500/day). Generate from a
   text self-description, never an uploaded photo, to stay clear of biometric consent.
5. **Voice check-in** via Web Speech `SpeechRecognition`. ⚠️ Chrome streams audio to Google
   servers, which contradicts "nothing leaves your device" — needs explicit opt-in and honest
   disclosure.
6. **Counterfactual two-futures simulation** — Monte Carlo over the existing deterministic risk
   score; LLM only narrates.

**Explicitly rejected:** webcam emotion inference (contested science, permission prompt is a
demo failure risk, and health-literate judges would penalise it).

---

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run verify         # typecheck + lint + test
npm test               # 142 tests, no key needed
npm run test:coverage
npm run build
```

Safety, risk, schemas, and seed are at 100% statement coverage. Page components are covered
functionally via Playwright rather than unit tests.

---

## Submission form answers (drafted)

**GenAI services used:**
> Groq (Llama-3.1-8B-Instant) — primary generation for urge-surfing scripts, if-then plans, risk
> narratives, lapse post-mortems, future-self letters, coaching replies, and nudge copy. Google
> Gemini 2.5 Flash-Lite — automatic fallback. A deterministic offline engine as the final rung so
> the app is fully functional with no key. Web Speech API for spoken delivery of interventions.

**Repo:** https://github.com/surajmalthumkar8/circuit-breaker
**Deployed link:** _pending Vercel login_
