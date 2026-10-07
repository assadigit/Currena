/**
 * JumpNav — the sideways-scrolling row of jump links to the page sections
 * (02-page-design-spec.md §4: "it scrolls sideways on mobile and must
 * mirror correctly in Farsi"). Buttons + scrollIntoView, not <a href="#…">:
 * the app is a HASH router, so in-page anchors would fight the route.
 * Reduced motion gets instant jumps.
 */

import { useCallback } from 'react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

export interface JumpTarget {
  id: string;
  label: string;
}

export function JumpNav({ targets, copy }: { targets: readonly JumpTarget[]; copy: InsightsCopy }) {
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
        {targets.map((target) => (
          <li key={target.id} className="shrink-0">
            <button
              type="button"
              onClick={() => jump(target.id)}
              className="cursor-pointer whitespace-nowrap rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-currena-dark transition-all duration-300 hover:border-currena-blue/40 hover:bg-currena-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark"
            >
              {target.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
