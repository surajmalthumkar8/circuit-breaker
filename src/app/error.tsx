"use client";

/**
 * Route-level error boundary.
 *
 * Errors bubble to the nearest boundary, so this one contains a failure to the page that
 * caused it — the navigation, and every other route, keep working. That containment is
 * the point: one broken feature must not take the application down with it.
 */

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced rather than swallowed, so a real failure is visible in the console.
    console.error("Route error:", error);
  }, [error]);

  return (
    <Card>
      <h1 className="text-xl font-semibold">This page hit a problem</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Something in this section failed to load. The rest of the app is unaffected, and your data
        is untouched — it lives in your browser, not here.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">Reference: {error.digest}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={reset}>Try this page again</Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium"
        >
          Back to the dashboard
        </Link>
      </div>
    </Card>
  );
}
