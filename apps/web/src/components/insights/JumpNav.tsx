/**
 * JumpNav — the sideways-scrolling row of jump links to the page sections
 * (02-page-design-spec.md §4: "it scrolls sideways on mobile and must
 * mirror correctly in Farsi"). Buttons + scrollIntoView, not <a href="#…">:
 * the app is a HASH router, so in-page anchors would fight the route.
 * Reduced motion gets instant jumps.
 *
 * I6 audit F6: the pills now carry an active-section state — a passive
 * scroll listener (rAF-throttled) marks the section whose top edge passed
 * the scan line, so the row answers "where am I?" while reading. Buttons
 * also meet the 44px touch-target minimum (they were 30px).
 */

import { useCallback, useEffect, useState } from 'react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

export interface JumpTarget {
  id: string;
  label: string;
}

/** Pixels below the viewport top that count as "reached" (sticky header + context). */
const SCAN_LINE_OFFSET = 140;

export function JumpNav({ targets, copy }: { targets: readonly JumpTarget[]; copy: InsightsCopy }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.scrollY + SCAN_LINE_OFFSET;
      let current: string | null = null;
      for (const target of targets) {
        const el = document.getElementById(target.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = target.id;
      }
      // Parked at the very bottom → the last section (About) is the truth
      // even if its header never crosses the scan line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = targets.length > 0 ? targets[targets.length - 1]!.id : current;
      }
      setActiveId(current);
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
  }, [targets]);

  const jump = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    // Focus the section so keyboard users land somewhere meaningful.
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  return (
    <nav aria-label={copy.ui.jumpTo.replace(/:$/, '')} className="-mx-1 px-1">
      <ul className="m-0 flex list-none gap-2 overflow-x-auto p-1 [scrollbar-width:thin]">
        {targets.map((target) => {
          const active = target.id === activeId;
          return (
            <li key={target.id} className="shrink-0">
              <button
                type="button"
                onClick={() => jump(target.id)}
                aria-current={active ? 'true' : undefined}
                className={`inline-flex min-h-[44px] cursor-pointer items-center whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                  active
                    ? 'border-currena-blue/40 bg-currena-blue/15 text-currena-blue-deep'
                    : 'border-black/10 bg-white text-currena-dark hover:border-currena-blue/40 hover:bg-currena-blue/10 dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark'
                }`}
              >
                {target.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
