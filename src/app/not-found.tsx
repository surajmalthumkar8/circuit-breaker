import Link from "next/link";
import { Card } from "@/components/ui";
import { NAV_LINKS } from "@/components/nav-links";

/**
 * 404.
 *
 * Turned into a recovery point rather than a dead end: every main route is listed, so a
 * wrong URL still leads somewhere useful.
 */

export default function NotFound() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">That page does not exist</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        The link may be out of date, or the item may have been deleted from this browser. Here is
        everything else:
      </p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-[var(--border)] p-3 text-sm transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <span className="font-medium">{link.label}</span>
              <span className="mt-0.5 block text-[var(--text-muted)]">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
