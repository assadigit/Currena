/**
 * GoldSectionNav — the sticky in-page navigation, FOUNDATION tier
 * (GUX-S5 M5, the master plan §10 Session 5 "sticky section navigation
 * foundation" + the F-03 fix): one sticky chip row of plain section
 * links (Briefing · Lanes · Signals · Bridge · Ratios · History) with
 * the current section's chip highlighted.
 *
 * FOUNDATION means (deliberately small): the sections and their anchors
 * are the page's OWN (every href is a real #hash — the R10 anchor
 * contract, native scroll on click); the highlight follows a plain
 * scroll listener over getBoundingClientRect (throttled by rAF) — NO
 * IntersectionObserver edge cases, NO scroll-spy heuristics beyond
 * "the last section whose top passed the line". S8 (the interaction
 * session) may upgrade the spy; the links and anchors are stable.
 *
 * The honesty rules: the nav NEVER renders on the hero (it sticks only
 * after the reader passes it — sticky top-0, the page's own flow); a
 * section whose anchor is absent (the skeleton or an outage band)
 * simply does not appear in the row; reduced-motion keeps the native
 * instant jump (no smooth-scroll override).
 *
 * jsdom-safe: no matchMedia, no IntersectionObserver — a plain scroll
 * listener added in an effect and removed on unmount.
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
    let raf = 0;
    const onScroll = (): void => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        let current: string | null = null;
        for (const { id } of SECTIONS) {
          const el = document.getElementById(id);
          if (el !== null && el.getBoundingClientRect().top <= SPY_LINE_PX) current = id;
        }
        // The hero (before the first section) highlights nothing.
        setActive(current);
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
