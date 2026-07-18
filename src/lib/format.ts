/**
 * Formatting helpers.
 *
 * Relative times are computed against an explicit reference rather than the current
 * clock, so server and client renders agree and nothing shifts during hydration.
 */

import { DEMO_ANCHOR } from "@/lib/data/seed";
import type { RiskState } from "@/lib/domain/types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "3 days ago", "just now". Reference defaults to the demo anchor for determinism. */
export function relativeTime(iso: string, reference: Date = DEMO_ANCHOR): string {
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
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
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
