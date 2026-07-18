/**
 * Shared presentational primitives.
 *
 * Everything interactive here is a real <button> or <a> with a visible or explicitly
 * labelled accessible name. That is both an accessibility requirement and a functional
 * one: assistive technology and automated agents alike read the accessibility tree, and
 * an unlabelled icon control is invisible to both.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import type { RiskState } from "@/lib/domain/types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={cn(
        "rounded-xl border p-5",
        "bg-[var(--surface-raised)] border-[var(--border)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {lede ? <p className="mt-2 text-[var(--text-muted)]">{lede}</p> : null}
      </div>
      {action}
    </header>
  );
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90",
  secondary: "border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-sunken)]",
  quiet: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)]",
  danger: "border border-[var(--color-urgent-500)] text-[var(--color-urgent-500)] hover:bg-[var(--color-urgent-500)] hover:text-white",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
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
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(BUTTON_BASE, BUTTON_STYLES[variant], className)}>
      {children}
    </Link>
  );
}

const RISK_TONE: Record<RiskState, string> = {
  steady: "bg-[var(--color-calm-500)]/15 text-[var(--color-calm-600)] border-[var(--color-calm-500)]/30",
  tempted: "bg-[var(--color-alert-500)]/15 text-[var(--color-alert-600)] border-[var(--color-alert-500)]/30",
  high_risk: "bg-[var(--color-urgent-500)]/15 text-[var(--color-urgent-600)] border-[var(--color-urgent-500)]/30",
  crisis: "bg-[var(--color-urgent-600)]/20 text-[var(--color-urgent-600)] border-[var(--color-urgent-600)]/40",
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
      ? "bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)]"
      : RISK_TONE[tone];
  return (
    <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium", style)}>
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
    <Link
      href={href}
      className="block rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition-colors hover:bg-[var(--surface-sunken)]"
    >
      <span className="block text-sm text-[var(--text-muted)]">{label}</span>
      <span className="mt-1 block text-2xl font-semibold tabular-nums">{value}</span>
      {detail ? <span className="mt-1 block text-xs text-[var(--text-muted)]">{detail}</span> : null}
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
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mb-2 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)]";

/** Shown when a genuinely empty collection occurs, never as a blank screen. */
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
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}

/** Honest labelling of which engine produced a piece of content. */
export function SourceNote({ source, live }: { source: string; live: boolean }) {
  return (
    <p className="mt-3 text-xs text-[var(--text-muted)]">
      {live
        ? `Generated just now by ${source}.`
        : "Written offline from the built-in library — no API key is configured, so the app used its deterministic fallback."}
    </p>
  );
}
