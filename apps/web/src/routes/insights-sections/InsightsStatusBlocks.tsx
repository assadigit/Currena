/**
 * The Insights page's status chrome — moved verbatim from routes/Insights.tsx
 * in the Phase 3-e route split: the LoadState type the route's /api/insights
 * fetch produces, the I10 reading-progress bar, and the shared loading /
 * error / stale-cache shells. The route shell renders each at the same place
 * in the page order as before.
 */

import { useEffect, useState } from 'react';
import type { InsightsSnapshot } from '@currena/core';
import { formatRelative } from '@currena/core';
import { TriangleAlert } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { Locale } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { Skeleton } from '../../components/ui';
import { Button } from '../../components/ui';

export type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; snapshot: InsightsSnapshot; fromCache: boolean }
  | { kind: 'error'; message: string; cached: InsightsSnapshot | null };

function SummarySkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" aria-hidden="true">
      <Skeleton className="h-44 rounded-[18px]" />
      <Skeleton className="h-44 rounded-[18px]" />
    </div>
  );
}

/** The route's loading state (skeletons only, no copy). */
export function InsightsLoadingState() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      <SummarySkeleton />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}

/** The route's error card — the retry button bumps the fetch's retry token. */
export function InsightsErrorState({
  copy,
  message,
  onRetry,
}: {
  copy: InsightsCopy;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius-lg)] bg-currena-warning/10 px-5 py-6 text-center ring-1 ring-currena-warning/30">
        <p className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-status-alert)]">
          <TriangleAlert aria-hidden size={18} strokeWidth={1.9} className="me-1 inline-block align-[-4px]" />
          {copy.ui.loadError}
        </p>
        <p className="mt-1 mb-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{message}</p>
        <Button variant="cta" onClick={onRetry}>
          {copy.ui.retry}
        </Button>
      </div>
    </div>
  );
}

/** The last-good-cache banner ("Data from …") shown while revalidating. */
export function StaleCacheNotice({
  copy,
  locale,
  generatedAt,
}: {
  copy: InsightsCopy;
  locale: Locale;
  generatedAt: string;
}) {
  return (
    <div
      role="status"
      className="slide-down flex items-center gap-3 rounded-[var(--radius-md)] border-s-4 border-currena-warning bg-currena-warning/15 px-4 py-3"
    >
      <TriangleAlert aria-hidden size={22} strokeWidth={1.9} className="shrink-0 text-[var(--color-status-alert)]" />
      <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-status-alert)]">
        {interpolate(copy.ui.dataFrom, {
          date: formatRelative(generatedAt, locale === 'fa' ? 'fa-IR' : 'en-US'),
        })}
      </p>
    </div>
  );
}

/**
 * I10: a thin reading-progress bar pinned above the app header — on a page
 * this long, "how far through am I?" is orientation, not decoration.
 * rAF-throttled passive listeners; fills from the inline-start edge in
 * both directions; hidden on paper.
 */
export function ReadingProgress({ label }: { label: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPct(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="no-print fixed inset-x-0 top-0 z-[1001] h-[3px]"
    >
      <div className="h-full bg-currena-blue" style={{ width: `${pct}%` }} />
    </div>
  );
}
