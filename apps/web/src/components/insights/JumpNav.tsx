/**
 * JumpNav — Block P1, round-2 R19: the STICKY section pills (Status, Prices,
 * Together, Signals when enabled, Indicators, About), aligned to the content
 * width (the old full-bleed negative margins are gone), scroll-spy kept,
 * targets ≥44px. Selecting a pill also EXPANDS its section when it is
 * collapsed (R19/R7b) — the route does that via onWillNavigate.
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

export function JumpNav({
  targets,
  copy,
  onWillNavigate,
}: {
  targets: readonly JumpTarget[];
  copy: InsightsCopy;
  /** R19: fires BEFORE the scroll so the route can expand collapsed
   *  sections (Together/Signals/About) first. */
  onWillNavigate?: (id: string) => void;
}) {
  const active = useActiveTarget(targets);
  if (targets.length === 0) return null;
  const jump = (id: string): void => {
    onWillNavigate?.(id);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  };
  return (
    <nav aria-label={copy.ui.navLabel} className="insights-sticky-nav mt-4">
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
              className={`insights-focusable inline-flex min-h-[36px] shrink-0 cursor-pointer items-center rounded-full px-3.5 text-[length:var(--type-caption)] font-bold transition-colors duration-200 ${
                isActive
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)] shadow-sm ring-1 ring-[var(--color-accent-gold)]/40'
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
