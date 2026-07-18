"use client";

/**
 * Floating navigation.
 *
 * A detached glass pill rather than a bar glued to the top edge. Backdrop blur is applied
 * here only because this element is sticky — blurring a scrolling container forces
 * continuous GPU repaints and drops frames on mobile.
 *
 * Routes come from the shared list so the navigation, the 404 recovery page, and the
 * sitemap can never drift apart and strand a route.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/components/ui";
import { NAV_LINKS } from "@/components/nav-links";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 px-4 pt-5">
      <nav
        aria-label="Main"
        className="mx-auto max-w-6xl rounded-full border border-[var(--hairline)] bg-[var(--surface-raised)]/70 px-3 py-2 shadow-[var(--lift)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-full px-2 py-1 text-sm font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]">
              <svg width="13" height="13" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M17.6 4 9 18h5.2l-1.8 10L22 14h-5.4z" fill="var(--accent-contrast)" />
              </svg>
            </span>
            Circuit Breaker
          </Link>

          {/* Wide viewports: the full route list inline. */}
          <ul className="hidden flex-wrap items-center gap-0.5 xl:flex">
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-3 py-1.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      active
                        ? "bg-[var(--accent)] font-medium text-[var(--accent-contrast)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="nav-panel"
            className="flex items-center gap-2 rounded-full border border-[var(--hairline)] px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-[var(--surface-sunken)] xl:hidden"
          >
            <span className="flex h-3 w-4 flex-col justify-between" aria-hidden="true">
              <span
                className={cn(
                  "h-px w-full origin-center bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  open && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-opacity duration-300",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-px w-full origin-center bg-current transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  open && "-translate-y-[5.5px] -rotate-45",
                )}
              />
            </span>
            Menu
          </button>
        </div>

        {/*
         * Narrow viewports: an expanding panel rather than an overlay that covers the page.
         * An overlay here would block navigation, which is worse than a slightly taller nav.
         */}
        {open ? (
          <ul
            id="nav-panel"
            className="grid gap-1 border-t border-[var(--hairline)] px-1 pb-2 pt-3 sm:grid-cols-2 xl:hidden"
          >
            {NAV_LINKS.map((item, index) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} className="rise" style={{ animationDelay: `${index * 35}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-2.5 text-sm transition-colors duration-300",
                      active
                        ? "bg-[var(--accent)] font-medium text-[var(--accent-contrast)]"
                        : "hover:bg-[var(--surface-sunken)]",
                    )}
                  >
                    <span className="block font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        active ? "opacity-80" : "text-[var(--text-muted)]",
                      )}
                    >
                      {item.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-28 px-4 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="bezel">
          <div className="bezel-core p-8">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="eyebrow mb-4">Please read</p>
                <p className="max-w-2xl text-sm leading-relaxed">
                  <strong className="font-semibold">Circuit Breaker is not therapy</strong> and not a
                  medical device. It is a behaviour-change tool built on published research. If you
                  are in crisis, or you are stopping a substance your body depends on, please use
                  the{" "}
                  <Link href="/help" className="text-[var(--accent)] underline underline-offset-4">
                    help and safety page
                  </Link>{" "}
                  to reach a real person.
                </p>
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                <p className="font-medium text-[var(--text)]">Your data stays here</p>
                <p className="mt-2 leading-relaxed">
                  Everything is stored in this browser. No account, no server database, and nothing
                  about your habits is transmitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
