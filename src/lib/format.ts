/**
 * Formatting helpers.
 *
 * Relative times are computed against an explicit reference rather than the current
 * clock, so server and client renders agree and nothing shifts during hydration.
 */

import type { RiskState } from "@/lib/domain/types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "3 days ago", "just now".
 *
 * The reference instant is a REQUIRED argument rather than a default, deliberately.
 * Defaulting it to the demo anchor made every entry created after that date read
 * "just now" forever, and the bug was invisible to tests because tests always passed an
 * explicit reference. Callers get their reference from `useNow()`, which is the demo
 * anchor during server render and the real clock once mounted.
 */
export function relativeTime(iso: string, reference: Date): string {
  const delta = reference.getTime() - new Date(iso).getTime();

  if (delta < 0) return "just now";
  if (delta < MINUTE) return "just now";
  if (delta < HOUR) {
    const minutes = Math.floor(delta / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (delta < DAY) {
    const hours = Math.floor(delta / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(delta / DAY);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/** "Tue 14 Jul, 23:00" — fixed locale so server and client agree exactly. */
export function absoluteTime(iso: string): string {
  const date = new Date(iso);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][date.getUTCMonth()];
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${weekday} ${date.getUTCDate()} ${month}, ${hours}:${minutes}`;
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export function formatMinutes(minutes: number): string {
  // Guard non-finite input: Math.min over an empty array yields Infinity, which would
  // otherwise render as "Infinityh NaNm" on a dashboard with no check-ins.
  if (!Number.isFinite(minutes)) return "—";
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export const OUTCOME_LABELS: Record<string, string> = {
  pending: "Awaiting outcome",
  rode_it_out: "Rode it out",
  partial: "Partly held",
  lapsed: "Lapsed",
};

export const RISK_DESCRIPTIONS: Record<RiskState, string> = {
  steady: "Self-control capacity looks good right now.",
  tempted: "Some pull, but you are still in charge of the decision.",
  high_risk: "Conditions are stacked against you at this moment.",
  crisis: "Support matters more than coaching right now.",
};
