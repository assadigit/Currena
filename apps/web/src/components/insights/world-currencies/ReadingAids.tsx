/**
 * The section's reading aids (Phase 3-d split of the former
 * WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx): the "How to read this section" disclosure next
 * to the title (HowToRead, v1.3 CR §4.5) and the "In plain words" block
 * directly under the verdict line (PlainWords, v1.3 CR §4.2).
 */

import { useMemo, useState } from 'react';
import type { FxSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { fxPlainWords } from '../../../lib/fx-presentation';
import { GlossaryTip } from './GlossaryTip';

/* ------------------------------------------------------------------ *
 * v1.3 — "How to read this section" (CR §4.5): a small button next to the
 * title, closed by default; five short items + the glossary tips.
 * ------------------------------------------------------------------ */

export function HowToRead({ copy }: { copy: InsightsCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="insights-fx-howto"
        onClick={() => setOpen((v) => !v)}
        className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
      >
        {copy.fx.howToRead}
        <span aria-hidden="true" className="ms-1">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div
          id="insights-fx-howto"
          className="mt-2 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
        >
          <ol className="m-0 flex list-decimal flex-col gap-1.5 ps-5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.fx.howToReadItems.map((item, i) => (
              <li key={i}>
                <bdi>{item}</bdi>
              </li>
            ))}
          </ol>
          <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            {copy.fx.glossaryTitle}
          </p>
          <ul className="m-0 grid list-none gap-1 p-0">
            {Object.values(copy.fx.glossary).map((g) => (
              <li key={g.term} className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
                <span className="font-semibold">{g.term}</span>
                <GlossaryTip def={g.def} srLabel={g.term} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * v1.3 — the "In plain words" block (CR §4.2), directly under the verdict
 * line: three to four short lines built from the numbers. This is what
 * most visitors read.
 * ------------------------------------------------------------------ */

export function PlainWords({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const words = useMemo(() => fxPlainWords(snapshot, copy.fx, numberLocale), [snapshot, copy, numberLocale]);
  /* 2026-10-29 owner round ("make this section more visual-weight and
   * prominent, like a verdict: show them as bulleted items"): the block
   * wears the page's VERDICT anatomy — a bold title row on a tinted
   * field with a severity accent on the reading-start edge (calm days
   * keep the neutral ink; an active pattern turns the accent amber) —
   * and every line is a real BULLETED item (list-disc), not a bare
   * paragraph row. */
  const signal = snapshot.summary.signal;
  const attention = signal === 'attention' || signal === 'unusual';
  return (
    <div
      className={`flex flex-col gap-2 rounded-[var(--radius-md)] px-3.5 py-3 ring-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] ${
        attention
          ? 'bg-currena-warning/[0.07] ring-currena-warning/40'
          : 'bg-[var(--color-surface)] ring-[var(--color-border)]'
      }`}
      data-plain-words
      data-plain-signal={signal}
    >
      <p
        className={`m-0 flex items-center gap-2 text-[length:calc(var(--type-label)*1.15)] font-bold ${
          attention ? 'text-[var(--color-status-alert)]' : 'text-[var(--color-text-primary)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-1.5 shrink-0 rounded-full ${attention ? 'bg-[var(--color-status-alert)]' : 'bg-[var(--color-accent-gold)]'}`}
        />
        {copy.fx.plainTitle}
      </p>
      <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5">
        <li className="text-[length:var(--type-label)] font-medium leading-relaxed text-[var(--color-text-primary)]/90">
          <bdi>{words.s1}</bdi>
        </li>
        {words.s2 !== null ? (
          <li className="text-[length:var(--type-label)] font-medium leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{words.s2}</bdi>
          </li>
        ) : null}
        {words.s3 !== null ? (
          <li className="text-[length:var(--type-label)] font-medium leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{words.s3}</bdi>
          </li>
        ) : null}
        <li className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{words.s4}</bdi>
        </li>
      </ul>
    </div>
  );
}
