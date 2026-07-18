/**
 * Crisis escalation panel.
 *
 * Rendered whenever the safety layer blocks coaching. Every number here is hard-coded and
 * hand-verified rather than generated or fetched, because a wrong crisis number is worse
 * than no crisis number — a published study found mental-health apps with millions of
 * downloads listing hotlines that did not work.
 */

import type { CrisisResource } from "@/lib/safety/crisis";
import { CRISIS_RESOURCES } from "@/lib/safety/crisis";

export function CrisisPanel({
  message,
  resources = CRISIS_RESOURCES,
}: {
  message?: string;
  resources?: readonly CrisisResource[];
}) {
  return (
    <section
      aria-labelledby="crisis-heading"
      role="alert"
      className="rounded-xl border-2 border-[var(--color-urgent-500)] bg-[var(--surface-raised)] p-5"
    >
      <h2 id="crisis-heading" className="text-lg font-semibold">
        Please talk to someone
      </h2>
      {message ? <p className="mt-2 text-sm leading-relaxed">{message}</p> : null}

      <ul className="mt-4 space-y-3">
        {resources.map((resource) => (
          <li key={`${resource.region}-${resource.name}`} className="text-sm">
            <p className="font-medium">
              {resource.name}{" "}
              <span className="font-normal text-[var(--text-muted)]">({resource.region})</span>
            </p>
            <p className="text-[var(--accent)]">{resource.contact}</p>
            <p className="text-[var(--text-muted)]">{resource.detail}</p>
            {resource.href ? (
              <a
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open {resource.name} in a new tab
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        If you are in immediate danger, please call your local emergency number.
      </p>
    </section>
  );
}
