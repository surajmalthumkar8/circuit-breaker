/**
 * Shared presentational primitives.
 *
 * Two rules govern everything here.
 *
 * Depth is built with nested enclosures — an outer tray holding an inner plate with
 * concentric radii — rather than with drop shadows, so surfaces read as physical objects
 * under ambient light instead of rectangles floating on a page.
 *
 * Every interactive element is a real <button> or <a> carrying an accessible name. An
 * icon-only control is invisible to a screen reader and to any automated agent, both of
 * which read the accessibility tree rather than the pixels.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { RiskState } from "@/lib/domain/types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Trailing glyph for calls to action, nested in its own disc for kinetic tension. */
export function ArrowDisc() {
  return (
    <span
      aria-hidden="true"
      className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-current/12 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
}) {
  return (
    <Tag className={cn("bezel", interactive && "bezel-hover", className)}>
      <div className="bezel-core p-6">{children}</div>
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <header className="rise mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h1 className="display-lg">{title}</h1>
        {lede ? (
          <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)]">{lede}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--lift)] hover:shadow-[var(--lift-lg)]",
  secondary:
    "border border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-sunken)]",
  quiet: "text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]",
  danger:
    "border border-[var(--color-urgent-500)] text-[var(--color-urgent-500)] hover:bg-[var(--color-urgent-500)] hover:text-white",
};

const BUTTON_BASE =
  "group inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3 text-sm font-medium " +
  "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  className,
  ariaLabel,
  trailing = false,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  trailing?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(BUTTON_BASE, BUTTON_STYLES[variant], className)}
    >
      {children}
      {trailing ? <ArrowDisc /> : null}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  trailing = false,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  trailing?: boolean;
}) {
  return (
    <Link href={href} className={cn(BUTTON_BASE, BUTTON_STYLES[variant], className)}>
      {children}
      {trailing ? <ArrowDisc /> : null}
    </Link>
  );
}

const RISK_TONE: Record<RiskState, string> = {
  steady: "text-[var(--color-calm-600)] border-[var(--color-calm-500)]/35 bg-[var(--color-calm-500)]/12",
  tempted: "text-[var(--color-alert-500)] border-[var(--color-alert-500)]/35 bg-[var(--color-alert-500)]/12",
  high_risk: "text-[var(--color-urgent-500)] border-[var(--color-urgent-500)]/35 bg-[var(--color-urgent-500)]/12",
  crisis: "text-[var(--color-urgent-500)] border-[var(--color-urgent-500)]/50 bg-[var(--color-urgent-500)]/18",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: RiskState | "neutral";
}) {
  const style =
    tone === "neutral"
      ? "text-[var(--text-muted)] border-[var(--hairline)] bg-[var(--surface-sunken)]"
      : RISK_TONE[tone];
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium",
        style,
      )}
    >
      {children}
    </span>
  );
}

/** A dashboard statistic. Always a link, so the hub never dead-ends. */
export function StatTile({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string | number;
  detail?: string;
  href: string;
}) {
  return (
    <Link href={href} className="bezel bezel-hover group block">
      <span className="bezel-core block p-5">
        <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="mt-3 block text-4xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        {detail ? (
          <span className="mt-2 block text-sm text-[var(--text-muted)]">{detail}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {hint ? <p className="mb-2.5 text-xs text-[var(--text-muted)]">{hint}</p> : null}
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-[var(--hairline)] bg-[var(--surface-sunken)] px-4 py-3 text-sm " +
  "transition-colors duration-300 placeholder:text-[var(--text-muted)] focus:bg-[var(--surface-raised)]";

/** Shown when a collection is genuinely empty — never a blank screen. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center">
      <div className="py-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
          {body}
        </p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  );
}

/** Honest labelling of which engine produced a piece of content. */
export function SourceNote({ source, live }: { source: string; live: boolean }) {
  return (
    <p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          live ? "bg-[var(--color-calm-400)]" : "bg-[var(--text-muted)]",
        )}
      />
      {live
        ? `Generated just now by ${source}.`
        : "Written offline from the built-in library — no API key is configured, so the app used its deterministic fallback."}
    </p>
  );
}

/** A labelled meter. Used for risk and for trigger frequency. */
export function Meter({
  value,
  max = 100,
  label,
  tone = "neutral",
}: {
  value: number;
  max?: number;
  label: string;
  tone?: RiskState | "neutral";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill =
    tone === "neutral" ? "var(--accent)" : `var(--color-${tone === "steady" ? "calm" : tone === "tempted" ? "alert" : "urgent"}-500)`;
  return (
    <div
      role="img"
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--surface-sunken)]"
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  );
}
