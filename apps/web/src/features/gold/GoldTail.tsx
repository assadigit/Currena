/**
 * GoldTail — the Zone O tail's lazy boundary (GUX-S5 M3b, the S4-D10/S5-D1
 * budget play): the page's three heaviest tail sections (the Episode
 * Explorer + the if-you'd-bought calculator + the publication-notes
 * disclosure) render through ONE near-viewport lazy mount, moving their
 * bytes out of the GoldPage chunk into a second gold-route chunk that
 * loads only as the reader approaches the page's history tail.
 *
 * WHY THIS SHAPE (11 §11 option (b), executed per S5-D1's standing rule
 * 2): the S5 scope (the BriefingCard + the CompositionStack + the
 * content module + the five-force overview) cannot fit the 240/50
 * ceiling's ~1.2 kB headroom; the recorded budget strategy pays for it
 * by returning the tail's bytes (~15–20 kB raw, S4-D10's estimate) — a
 * pure code-organization change inside §9.3's routine-refactoring
 * authority, with the `GoldPage-*.js` basename freeze preserved (the
 * GoldPage chunk stays the route's entry; this is a SIBLING chunk).
 *
 * THE CONTRACT THIS KEEPS (verified by the rebased GoldPage tests):
 *   - COLLAPSED BY DEFAULT, always: every rider keeps its own collapsed
 *     shape (the GPE discipline incl. 390 — the daily reader pays
 *     nothing until the tap), and the lazy boundary is INVISIBLE in the
 *     DOM shape: the sections render in the same order with the same
 *     ids/anchors (#gold-zone-o · #gold-ifbought · #gold-blocked), so
 *     every legacy link and every characterization query still lands.
 *   - NEVER A CONTENT FLASH: the mount happens near-viewport BEFORE the
 *     reader can scroll to the tail (rootMargin 600px — the sections'
 *     collapsed heights ×2), so by the time the tail is visible its
 *     content is on screen; the one-frame placeholder is a
 *     layout-stable skeleton (the #24 cold-load precedent), never a
 *     blank-then-pop.
 *   - NO OBSERVER, NO DELAY: environments without IntersectionObserver
 *     (jsdom, old browsers) mount eagerly — the boundary degrades to a
 *     plain lazy() with zero behavior change. A same-document hash
 *     navigation targeting a tail anchor (#gold-blocked) mounts
 *     immediately too (the anchor contract is never hostage to the
 *     observer).
 */

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../shared/lib/locale';

const GoldTailContent = lazy(() => import('./gold-tail-content').then((m) => ({ default: m.GoldTailContent })));

/** The near-viewport margin — mounts two collapsed sections ahead of
 *  the scroll, before the tail can be visible. */
const PREFETCH_ROOT_MARGIN = '600px';

/** The one-frame placeholder: layout-stable (the sections' own
 *  collapsed heights are small and flow anyway — the skeleton only
 *  needs to reserve SOME height so the scroll bar does not jump), the
 *  honest loading word, never a fake section. */
function TailSkeleton(): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div role="status" data-gold-tail-skeleton className="flex min-h-[96px] flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60">
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-currena-muted">{t('pd.gold.loadingLine')}</p>
      <span className="flex justify-start gap-2.5" aria-hidden="true">
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </span>
    </div>
  );
}

/** A same-document hash navigation that targets a tail anchor mounts
 *  the tail immediately — the anchor contract (R10/#gold-blocked) is
 *  never hostage to the scroll observer. */
function hashTargetsTail(): boolean {
  if (typeof window === 'undefined' || window.location.hash === '') return false;
  return /^#(gold-zone-o|gold-ifbought|gold-blocked)$/.test(window.location.hash);
}

export function GoldTail({ absentCount }: { absentCount: number }): React.JSX.Element {
  const [mounted, setMounted] = useState(hashTargetsTail);
  const probeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mounted) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      // jsdom/old browsers: eager mount, zero behavior change.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the no-observer fallback is the boundary's own trigger (the Signals expand-on-token precedent)
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
      <div data-gold-tail ref={probeRef}>
        <Suspense fallback={<TailSkeleton />}>
          <GoldTailContent absentCount={absentCount} />
        </Suspense>
      </div>
    );
  }
  return (
    <div
      ref={probeRef}
      data-gold-tail-probe
      aria-hidden="true"
      className="min-h-[1px] w-full"
    />
  );
}
