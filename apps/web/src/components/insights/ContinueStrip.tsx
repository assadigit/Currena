/**
 * ContinueStrip — the UI-fidelity round's bottom information strip
 * (2026-10-19, the owner's correction brief §7 "Bottom information
 * strip"): the approved reference closes its dashboard with a compact
 * one-line strip that names what follows. This is Currena's equivalent,
 * built ONLY from existing content and behavior — the same section
 * labels the sticky JumpNav pills speak, in the same order, wired to the
 * same expand-then-scroll navigation (onWillNavigate expands collapsed
 * sections first, exactly like a JumpNav pill).
 *
 * Deliberately quiet: one caption-size line, a ChevronDown glyph (the
 * project's established lucide outline family), muted separators, and
 * 44px-effective hover targets that underline on hover only. It sits
 * directly under the hero (after the biggest-move line) so the reader
 * finishing the two regional cards always knows the page continues —
 * the reference's "describe the next sections in their intended order".
 */

import { ChevronDown } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { JumpTarget } from './JumpNav';

export function ContinueStrip({
  targets,
  copy,
  onWillNavigate,
}: {
  /** The page's jump targets in reading order (the hero itself excluded
   * by the caller — the strip names what comes NEXT). */
  targets: readonly JumpTarget[];
  copy: InsightsCopy;
  /** JumpNav's contract: fires BEFORE the scroll so the route can expand
   *  collapsed sections (Together/Signals/About) first. */
  onWillNavigate?: (id: string) => void;
}) {
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
    <nav aria-label={copy.ui.continueLabel} data-continue-strip className="no-print">
      <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.8}
          className="shrink-0 text-[var(--color-text-tertiary)]"
        />
        <span className="font-bold text-[var(--color-text-primary)]">{copy.ui.continueLabel}</span>
        {targets.map((t, i) => (
          <span key={t.id} className="flex items-center gap-1.5">
            {i > 0 ? (
              <span aria-hidden="true" className="text-[var(--color-text-tertiary)]">
                ·
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => jump(t.id)}
              className="insights-focusable -my-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-1 font-semibold text-[var(--color-text-secondary)] underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--color-text-primary)] hover:decoration-[var(--color-border)]"
              data-continue-target={t.id}
            >
              {t.label}
            </button>
          </span>
        ))}
      </p>
    </nav>
  );
}
