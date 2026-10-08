/**
 * JumpNav — Block P1: the pill row is now STICKY below the site navigation,
 * renamed to the owner's five sections (Status, Prices, Indicators, About —
 * "Together" waits for v2), and highlights the section in view (scroll
 * spy). Horizontal scroll on phones stays (I4), safe-area aware, and the
 * active pill mirrors.
 */

import { useEffect, useRef, useState } from 'react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

export interface JumpTarget {
  id: string;
  label: string;
}

/** Scroll-spy: which target's section currently holds the viewport top? */
function useActiveTarget(targets: readonly JumpTarget[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const raf = useRef(0);
  useEffect(() => {
    const measure = () => {
      raf.current = 0;
      // The sticky bar occupies the first ~110px below the site header —
      // the section under that line is the one being read.
      const probe = window.scrollY + 140;
      let current: string | null = null;
      for (const t of targets) {
        const el = document.getElementById(t.id);
        if (!el) continue;
        if (el.offsetTop <= probe) current = t.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (raf.current === 0) raf.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf.current !== 0) cancelAnimationFrame(raf.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targets]);
  return active;
}

export function JumpNav({ targets, copy }: { targets: readonly JumpTarget[]; copy: InsightsCopy }) {
  const active = useActiveTarget(targets);
  if (targets.length === 0) return null;
  const jump = (id: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  return (
    <nav aria-label={copy.ui.navLabel} className="insights-sticky-nav -mx-4 mt-4 px-4 lg:-mx-8 lg:px-8">
      <span
        role="list"
        className="no-print flex list-none items-center gap-1.5 overflow-x-auto py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {targets.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => jump(t.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`insights-focusable inline-flex min-h-[36px] shrink-0 cursor-pointer items-center rounded-full px-3.5 text-[var(--type-caption)] font-bold transition-colors duration-200 ${
                isActive
                  ? 'bg-currena-blue text-white shadow-sm ring-1 ring-currena-blue/40'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-status-context)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </span>
    </nav>
  );
}
