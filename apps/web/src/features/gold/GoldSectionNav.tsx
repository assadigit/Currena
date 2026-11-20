/**
 * GoldSectionNav — the sticky in-page navigation (GUX-S5 M5's
 * foundation, upgraded to the S8 tier at GUX-S6 M5, REBUILT for the
 * mobile-first pass at GUX-S8 M1): one sticky row of plain section
 * links (Briefing · Lanes · Signals · Bridge · Ratios · Relationships ·
 * History) with the current section's chip highlighted.
 *
 * THE S8 MOBILE REBUILD (this session's remediation, 11 §12 item 5 +
 * master plan §7.1): the wrapping chip rows (132px tall in en at 390px
 * — a sixth of the viewport, and taller than the sections' own
 * scroll-mt-24 so the anchor jumps LANDED UNDER the bar) become ONE
 * horizontally-scrollable row — the shipped chip-scroller pattern
 * (GlobalBoard's .ln row): nowrap chips that scroll inside the track,
 * never wrap; 44px touch targets (the 36px chips were under the floor);
 * a direction-aware soft fade that appears only while more chips sit
 * that way (JS-toggled data attributes — the fade is decorative and
 * never carries meaning); the ACTIVE chip centers itself in the track
 * (physical-pixel scrollBy — RTL-safe) so the reading position stays
 * visible without any page scroll.
 *
 * THE S8-TIER SPY (GUX-S6 M5, unchanged): the IntersectionObserver over
 * the section anchors — the last section whose top has passed the spy
 * line still wins (the same plain rule, no heuristics added), but the
 * work happens on observer callbacks instead of every scroll frame. The
 * rAF throttle and the scroll listener REMAIN as the no-observer
 * fallback (jsdom, old browsers — the boundary components' own
 * discipline), so the behavior is identical everywhere and the jsdom
 * pins still hold.
 *
 * The honesty rules (unchanged): the nav NEVER renders on the hero (it
 * sticks only after the reader passes it); a section whose anchor is
 * absent (the skeleton or an outage band) simply does not appear in the
 * row; reduced-motion keeps the native instant jump and the chip
 * centering snaps instead of gliding.
 */

import { useEffect, useRef, useState } from 'react';
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
 *  the LAST such section wins (the reading position). The 96px matches
 *  the sections' scroll-mt-24 (the anchor-jump contract). */
const SPY_LINE_PX = 96;

export function GoldSectionNav(): React.JSX.Element | null {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  const trackRef = useRef<HTMLUListElement | null>(null);

  /** The scroller's own state: which edges still have chips beyond them
   *  (the fades), and the active chip's centering. Physical pixels
   *  throughout — scrollBy/scrollLeft deltas are direction-agnostic, so
   *  the one code path serves LTR and RTL. */
  useEffect(() => {
    const track = trackRef.current;
    if (track === null) return;
    // jsdom-safe (the boundary components' own discipline: no matchMedia
    // there): absent matchMedia degrades to the smooth centering — the
    // CSS reduced-motion guards own the visual stillness regardless.
    const reduced = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    const syncFades = (): void => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const at = Math.abs(track.scrollLeft);
      track.dataset.fadeStart = at > 4 ? 'true' : 'false';
      track.dataset.fadeEnd = at < maxScroll - 4 ? 'true' : 'false';
    };

    const centerActive = (): void => {
      const chip = track.querySelector<HTMLAnchorElement>(`[data-nav-chip="${active ?? ''}"]`);
      if (chip === null) return;
      const trackRect = track.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const delta = chipRect.left + chipRect.width / 2 - (trackRect.left + trackRect.width / 2);
      if (Math.abs(delta) < 2) return;
      track.scrollBy({ left: delta, behavior: (reduced?.matches ?? false) ? 'auto' : 'smooth' });
    };

    syncFades();
    centerActive();
    track.addEventListener('scroll', syncFades, { passive: true });
    window.addEventListener('resize', syncFades);
    return () => {
      track.removeEventListener('scroll', syncFades);
      window.removeEventListener('resize', syncFades);
    };
  }, [active]);

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
      {/* The S8 chip-scroller track: ONE row, nowrap, hidden scrollbars,
       * the JS-toggled direction-aware fades (index.css's
       * .gold-nav-track). Keyboard focus keeps the browser's native
       * horizontal bring-into-view; touch scrolls the track itself. */}
      <ul
        ref={trackRef}
        data-chip-scroller
        className="gold-nav-track m-0 flex list-none flex-nowrap items-center gap-1.5 overflow-x-auto p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SECTIONS.map(({ id, key }) => {
          const isActive = active === id;
          return (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={isActive ? 'true' : undefined}
                data-nav-chip={id}
                data-nav-active={isActive ? 'true' : undefined}
                className={`insights-focusable inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-2.5 text-[length:var(--type-caption)] font-semibold no-underline ring-1 transition-colors ${
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
