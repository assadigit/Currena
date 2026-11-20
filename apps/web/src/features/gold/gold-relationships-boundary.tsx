/**
 * gold-relationships-boundary.tsx — the relationship explorer's
 * near-viewport lazy boundary (GUX-S6 M1's budget play, the GoldTail
 * pattern extended per S5-D1 standing rule 2's pre-authorized ladder):
 * the explorer's bytes (the record module + the component, ~20 kB raw)
 * move to their OWN sibling chunk that mounts only as the reader
 * approaches the section — the same code-organization authority the
 * S5 close exercised for the Zone O tail (S5-D5), preserving the
 * `GoldPage-*.js` basename freeze (the GoldPage chunk stays the route
 * entry; this is a SIBLING chunk like gold-tail-content).
 *
 * THE CONTRACT (GoldTail's own, verbatim):
 *   - near-viewport mount (IntersectionObserver, 600px rootMargin) —
 *     by the time the section is visible its content is on screen;
 *   - NO OBSERVER (jsdom, old browsers) → eager mount, zero behavior
 *     change;
 *   - a same-document hash navigation targeting the section's anchor
 *     (#gold-relationships) mounts immediately (the anchor contract is
 *     never hostage to the observer);
 *   - the section's DOM/ids render VERBATIM once mounted — the
 *     characterization queries still land (the pins waitFor the rows).
 */

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../shared/lib/locale';

const GoldRelationships = lazy(() => import('./GoldRelationships').then((m) => ({ default: m.GoldRelationships })));

/** The near-viewport margin — mounts before the section can be visible. */
const PREFETCH_ROOT_MARGIN = '600px';

/** The one-frame placeholder: layout-stable, the honest loading word. */
function RelationshipsSkeleton(): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div role="status" data-gold-relationships-skeleton className="flex min-h-[96px] flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60">
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-currena-muted">{t('pd.gold.loadingLine')}</p>
      <span className="flex justify-start gap-2.5" aria-hidden="true">
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </span>
    </div>
  );
}

function hashTargetsRelationships(): boolean {
  if (typeof window === 'undefined' || window.location.hash === '') return false;
  return window.location.hash === '#gold-relationships';
}

export function GoldRelationshipsBoundary(): React.JSX.Element {
  const [mounted, setMounted] = useState(hashTargetsRelationships);
  const probeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mounted) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      // jsdom/old browsers: eager mount, zero behavior change.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the no-observer fallback is the boundary's own trigger (the GoldTail precedent)
      setMounted(true);
      return undefined;
    }
    const el = probeRef.current;
    if (el === null) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          setMounted(true);
        }
      },
      { rootMargin: PREFETCH_ROOT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  if (mounted) {
    return (
      <div data-gold-relationships-boundary ref={probeRef}>
        <Suspense fallback={<RelationshipsSkeleton />}>
          <GoldRelationships />
        </Suspense>
      </div>
    );
  }
  return <div ref={probeRef} data-gold-relationships-probe aria-hidden="true" className="min-h-[1px] w-full" />;
}
