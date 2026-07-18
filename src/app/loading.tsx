/**
 * Route-level loading skeleton.
 *
 * Mirrors the shape of a typical page rather than showing a bare spinner, so the layout
 * does not jump when content arrives and the wait communicates what is coming.
 */

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>

      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 rounded bg-[var(--surface-sunken)]" />
        <div className="h-4 w-96 max-w-full rounded bg-[var(--surface-sunken)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)]"
          />
        ))}
      </div>

      <div className="mt-8 space-y-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-20 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)]"
          />
        ))}
      </div>
    </div>
  );
}
