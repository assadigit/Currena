/**
 * GoldSectionNav — the sticky in-page navigation (GUX-S5 M5's
 * foundation, upgraded to the S8 tier at GUX-S6 M5): one sticky chip
 * row of plain section links (Briefing · Lanes · Signals · Bridge ·
 * Ratios · Relationships · History) with the current section's chip
 * highlighted.
 *
 * THE S8-TIER SPY (this session's upgrade, still deliberately small):
 * the foundation tier's scroll listener + getBoundingClientRect sweep
 * is replaced by an IntersectionObserver over the section anchors —
 * the last section whose top has passed the spy line still wins (the
 * same plain rule, no heuristics added), but the work now happens on
 * observer callbacks instead of every scroll frame. The rAF throttle
 * and the scroll listener REMAIN as the no-observer fallback (jsdom,
 * old browsers — the boundary components' own discipline), so the
 * behavior is identical everywhere and the jsdom pins still hold.
 *
 * The honesty rules (unchanged): the nav NEVER renders on the hero (it
 * sticks only after the reader passes it); a section whose anchor is
 * absent (the skeleton or an outage band) simply does not appear in
 * the row; reduced-motion keeps the native instant jump.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';

/** One nav chip: the section's label key + its real anchor. */
const SECTIONS: ReadonlyArray<{ id: string; key: TranslationKey }> = [
  { id: 'gold-zone-d', key: 'pd.gold.navBriefing' },
  { id: 'gold-zone-f', key: 'pd.gold.navBridge' },
  { id: 'insights-signals', key: 'pd.gold.navSignals' },
  { id: 'gold-seats', key: 'pd.gold.navLanes' },
  { id: 'gold-context', key: 'pd.gold.navRatios' },
  // GUX-S6 M1: the relationship explorer's own chip (12 §5's surface).
  { id: 'gold-relationships', key: 'pd.gold.navRelations' },
  { id: 'gold-zone-o', key: 'pd.gold.navHistory' },
];

/** The scroll-spy line: a section is "current" when its top has passed
 *  96px below the viewport top (the nav's own height + breathing room);
 *  the LAST such section wins (the reading position). */
const SPY_LINE_PX = 96;

export function GoldSectionNav(): React.JSX.Element | null {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    /** The plain rule, computed once: the last section whose top has
     *  passed the spy line. Shared by the observer path and the
     *  scroll-listener fallback. */
    const computeCurrent = (): string | null => {
      let current: string | null = null;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el !== null && el.getBoundingClientRect().top <= SPY_LINE_PX) current = id;
      }
      // The hero (before the first section) highlights nothing.
      return current;
    };

    // The S8 tier: observe the section anchors with a spy-line root
    // margin — the callback recomputes the same plain rule only when a
    // section top actually crosses the line (no per-frame work).
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        () => {
          setActive(computeCurrent());
        },
        // The observed band: from the top of the viewport down past the
        // spy line — a section top entering OR leaving this band is
        // exactly a crossing of the line.
        { rootMargin: `0px 0px -${window.innerHeight - SPY_LINE_PX}px 0px`, threshold: 0 },
      );
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el !== null) observer.observe(el);
      }
      // Set the initial state (the observer fires on observe, but the
      // first paint should not depend on it).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the initial spy position is the observer path's own trigger (the foundation tier's onScroll() call did the same)
      setActive(computeCurrent());
      return () => observer.disconnect();
    }

    // The no-observer fallback (jsdom, old browsers): the foundation
    // tier verbatim — a rAF-throttled scroll listener.
    let raf = 0;
    const onScroll = (): void => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setActive(computeCurrent());
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      aria-label={t('pd.gold.navAria')}
      data-gold-section-nav
      className="sticky top-0 z-40 -mx-2 border-block-end border-[var(--color-border)]/70 bg-[var(--color-surface)]/92 px-2 py-1.5 backdrop-blur-sm"
    >
      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 overflow-x-auto p-0">
        {SECTIONS.map(({ id, key }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={isActive ? 'true' : undefined}
                data-nav-chip={id}
                data-nav-active={isActive ? 'true' : undefined}
                className={`insights-focusable inline-flex min-h-[36px] items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[length:var(--type-caption)] font-semibold no-underline ring-1 transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent-gold)]/15 text-[var(--color-text-primary)] ring-[var(--color-accent-gold)]/45'
                    : 'bg-transparent text-[var(--color-text-secondary)] ring-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {t(key)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
