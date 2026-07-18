"use client";

/**
 * Client hook for calling the generation endpoint.
 *
 * Never throws and never leaves the interface in an indefinite loading state: a network
 * failure resolves to the deterministic offline content for that task, so a page always
 * has something real to render.
 */

import { useCallback, useState } from "react";
import type { TaskName } from "@/lib/ai/schemas";
import { demoContentFor } from "@/lib/ai/demo-content";
import type { CrisisResource } from "@/lib/safety/crisis";
import { CRISIS_RESOURCES, checkForCrisis } from "@/lib/safety/crisis";
import type { GenerationSource, RiskAssessment, RiskState, TriggerTag } from "@/lib/domain/types";

export interface GenerateRequest {
  task: TaskName;
  context: { habitLabel: string; goal: string; why: string; streakDays: number };
  risk?: RiskAssessment;
  intent?: string;
  trigger?: TriggerTag;
  note?: string;
  message?: string;
  history?: string;
  knownTriggers?: string[];
  windows?: string[];
}

export interface GenerateOutcome<T> {
  data: T | null;
  source: GenerationSource;
  live: boolean;
  blocked: boolean;
  crisisMessage?: string;
  resources?: readonly CrisisResource[];
}

/** Requests time out client-side too, so a hung network cannot freeze the interface. */
const CLIENT_TIMEOUT_MS = 20_000;

export function useGenerate<T>() {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<GenerateOutcome<T> | null>(null);

  const run = useCallback(async (request: GenerateRequest): Promise<GenerateOutcome<T>> => {
    setLoading(true);

    // Screen locally first so an obvious crisis never leaves the device at all.
    const localText = [request.message, request.note, request.intent].filter(Boolean).join(" ");
    const localCrisis = checkForCrisis(localText);
    if (localCrisis.blocked) {
      const blockedOutcome: GenerateOutcome<T> = {
        data: null,
        source: "demo",
        live: false,
        blocked: true,
        crisisMessage: localCrisis.message,
        resources: CRISIS_RESOURCES,
      };
      setOutcome(blockedOutcome);
      setLoading(false);
      return blockedOutcome;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const payload = (await response.json()) as {
        blocked?: boolean;
        data?: T;
        source?: GenerationSource;
        live?: boolean;
        message?: string;
        resources?: CrisisResource[];
      };

      const result: GenerateOutcome<T> = payload.blocked
        ? {
            data: null,
            source: "demo",
            live: false,
            blocked: true,
            crisisMessage: payload.message,
            resources: payload.resources ?? CRISIS_RESOURCES,
          }
        : {
            data: (payload.data ?? null) as T | null,
            source: payload.source ?? "demo",
            live: Boolean(payload.live),
            blocked: false,
          };

      setOutcome(result);
      return result;
    } catch {
      // Offline, aborted, or the endpoint is unreachable. Fall back locally so the
      // feature still works rather than showing an error.
      const fallback: GenerateOutcome<T> = {
        data: demoContentFor({
          task: request.task,
          riskState: request.risk?.state as RiskState | undefined,
          trigger: request.trigger,
          seed: request.intent ?? request.message ?? "",
        }) as T,
        source: "demo",
        live: false,
        blocked: false,
      };
      setOutcome(fallback);
      return fallback;
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  /** Clear the last result so a feature can start a fresh session. */
  const reset = useCallback(() => setOutcome(null), []);

  return { run, loading, outcome, reset };
}
