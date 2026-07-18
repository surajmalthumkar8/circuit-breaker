"use client";

/**
 * React binding for the application state.
 *
 * Hydration safety is the whole design here. State initialises SYNCHRONOUSLY from the
 * static seed, so the server-rendered HTML and the first client render are identical.
 * Only after mount do we read localStorage and layer the user's own history on top.
 * Reading storage during render — or calling Date.now() — is the most common cause of
 * hydration mismatches, and it would also leave the first paint empty.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialState, type AppState } from "@/lib/store/state";
import { DEMO_ANCHOR } from "@/lib/data/seed";

const STORAGE_KEY = "circuit-breaker.state.v1";

interface StoreValue {
  state: AppState;
  /** Apply a pure transition. */
  update: (transition: (state: AppState) => AppState) => void;
  /** Discard local changes and return to the seeded demo history. */
  reset: () => void;
  /** True once localStorage has been read. Used to avoid flashing stale content. */
  hydrated: boolean;
  /**
   * The app's reference "now".
   *
   * The demo anchor during server render and the first client render, so both produce
   * identical HTML; the real clock once mounted, so relative times stay truthful as the
   * user creates new entries. Reading the clock during render would break hydration.
   */
  now: Date;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadPersisted(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Shape check: a corrupt or outdated payload falls back to the seed rather than
    // rendering a broken screen.
    if (!parsed.profile || !Array.isArray(parsed.plans) || !Array.isArray(parsed.urges)) {
      return null;
    }
    return parsed as AppState;
  } catch {
    return null;
  }
}

function persist(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private browsing). The app still works for this
    // session, so this is intentionally non-fatal.
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Synchronous seed: identical on server and client.
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date>(DEMO_ANCHOR);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) setState(persisted);
    setHydrated(true);
    setNow(new Date());

    // Keep relative times honest during a long session without re-rendering constantly.
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hydrated) persist(state);
  }, [state, hydrated]);

  const update = useCallback((transition: (current: AppState) => AppState) => {
    setState((current) => transition(current));
  }, []);

  const reset = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-fatal, same reasoning as persist().
    }
  }, []);

  const value = useMemo(
    () => ({ state, update, reset, hydrated, now }),
    [state, update, reset, hydrated, now],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return context;
}
