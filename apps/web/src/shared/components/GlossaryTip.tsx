/**
 * GlossaryTip — the shared "?" pill (v1.3 CR §4.6) used by the how-to-read
 * glossary list, the dollar row and the pairs table legend (Phase 3-d split
 * of the former WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx).
 */

import { useId, useState } from 'react';
import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ *
 * v1.3 — the glossary tip (CR §4.6): a small "?" after a term opens the
 * one-sentence definition. Tap or keyboard, never hover-only.
 * ------------------------------------------------------------------ */

export function GlossaryTip({
  def,
  srLabel,
  children,
  panelClassName,
}: {
  /** The one-sentence definition. Omit when `children` carries the panel. */
  def?: string;
  srLabel: string;
  /** Round 42: richer panels (the hero's how-calculated tip adds a link to
   * the full explainer) — replaces the plain `def` text when given. */
  children?: ReactNode;
  /** Round 43: extra classes for the panel span — the hero seats the tip
   * inside flex rows, where the panel must wrap onto its own full-width
   * line (`w-full basis-full`) instead of squeezing beside its button. */
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={srLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="insights-focusable ms-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-currena-muted/25 align-middle text-[0.66rem] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/45"
      >
        ?
      </button>
      {open ? (
        <span
          id={panelId}
          className={`mt-1 block rounded-[var(--radius-md)] bg-currena-soft/70 px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]${panelClassName ? ` ${panelClassName}` : ''}`}
        >
          {children ?? <bdi>{def}</bdi>}
        </span>
      ) : null}
    </>
  );
}
