# Working in this codebase

Conventions for anyone — human or AI agent — changing this project. These are the rules the
existing code follows; deviating from them silently is what produces the drift and bloat that
makes an AI-assisted codebase hard to read later.

## Non-negotiable rules

1. **Never weaken the safety layer.** `src/lib/safety/` decides when the app stops coaching.
   Do not soften a crisis check, do not remove the medical-supervision branch, and do not let
   generated content bypass `checkForCrisis`. Every change there needs a test.
2. **Never let a model compute risk.** `src/lib/risk/vulnerability.ts` is deterministic and pure.
   The model *explains* the score; it must never produce it. This is what makes risk testable and
   un-hallucinatable.
3. **No `any`, no `@ts-ignore`, no `eslint-disable` without a comment saying why.** TypeScript runs
   with `strict` plus `noUncheckedIndexedAccess`. If a type is fighting you, the design is usually
   wrong.
4. **No secrets in the repo.** Keys are read from `process.env` in server code only. Never prefix an
   AI key with `NEXT_PUBLIC_`. `.env` is gitignored; `.env.example` documents names with empty values.
5. **Every feature must work with no API key.** If you add a generation task, add matching
   deterministic content in `src/lib/ai/demo-content.ts`. A reviewer with no key must see the whole app.

## Architecture

```
src/
  app/            Routes. One directory per workflow.
    api/generate/ The ONLY server route. All generation flows through it.
  components/     Presentational primitives + navigation. No business logic.
  lib/
    ai/           Provider chain, prompts, schemas, deterministic fallbacks
    data/         The static seed history
    domain/       Shared types — the single source of truth
    habit/        Streak logic
    risk/         Vulnerability scoring
    safety/       Crisis detection, dependence screening
    store/        State shape, pure transitions, React binding
```

**Where logic goes:** pure functions in `lib/`, rendering in `app/` and `components/`. If a
component contains a calculation worth testing, it belongs in `lib/` instead.

## Rules that keep the app functional end to end

- **Every interactive element needs an accessible name.** A `<div onClick>` or an icon-only button
  is invisible to screen readers *and* to automated agents, both of which read the accessibility
  tree. Use real `<button>` and `<a>` elements, always labelled.
- **No route may dead-end.** Persistent navigation is in the layout; every list links to detail,
  every detail links back. Add new routes to `src/components/nav-links.ts` — the navigation, the 404
  page, and the sitemap all read from it.
- **No blocking modals, banners, or onboarding walls.** The app must be usable immediately on load.
- **Never render an empty screen.** State seeds synchronously from `src/lib/data/seed.ts`. If a
  collection can genuinely be empty, render an `EmptyState` with a way forward.
- **No unbounded spinners.** Every AI call has a timeout and a fallback.

## Hydration safety

The server render and the first client render must be byte-identical. Therefore, **never in a
render path**:

- `Date.now()`, `new Date()` with no argument, or `Math.random()`
- `localStorage`, `sessionStorage`, or `window`
- Local-time methods like `getHours()` — use the UTC variants, since server and client are in
  different zones

Read storage in `useEffect` after mount (see `src/lib/store/provider.tsx`). Time is passed in as an
argument to pure functions, never read inside them.

## Testing

Test-first for anything in `lib/`. The suite runs with **no API key and no network**, which is
deliberate — it must stay that way.

```bash
npm run verify   # typecheck + lint + test
npm test         # tests alone
npm run build    # production build
```

Good test targets are the pure functions: risk scoring, crisis detection, streak arithmetic,
schema validation, state transitions. If something is hard to test, it usually needs extracting.

## Style

- Comments explain *why*, never *what*. If a line needs a comment to say what it does, rename things.
- Prefer explicit names over short ones. `summariseStreak` beats `getStreak`.
- British-neutral English in user-facing copy. No exclamation marks, no hype, no guilt.
- Never claim a capability the app does not have. A browser cannot read device screen time, and the
  interface says so plainly rather than implying otherwise.
