"use client";

/**
 * Persistent navigation.
 *
 * Present on every route, using real anchors, so every page stays reachable and no screen
 * can become a dead end. Routes come from the shared list in nav-links so the navigation,
 * the 404 recovery page, and the sitemap cannot drift apart.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { NAV_LINKS } from "@/components/nav-links";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2.5">
        <Link href="/" className="mr-3 flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className="text-base">
            ⚡
          </span>
          Circuit Breaker
        </Link>

        <ul className="flex flex-wrap items-center gap-x-0.5 gap-y-1">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
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
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--text-muted)]">
        <p className="max-w-3xl">
          <strong className="font-medium text-[var(--text)]">Circuit Breaker is not therapy</strong>{" "}
          and not a medical device. It is a behaviour-change tool built on published research. If
          you are in crisis, or you are stopping a substance your body depends on, please use the{" "}
          <Link href="/help" className="underline">
            help and safety page
          </Link>{" "}
          to reach a real person.
        </p>
        <p className="mt-4">
          Your data stays in this browser. Nothing about your habits is sent to a server.
        </p>
      </div>
    </footer>
  );
}
