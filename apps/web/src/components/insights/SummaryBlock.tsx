/**
 * SummaryBlock — the two summary lines (Global, Australia) with the
 * warning-count LED modules (the page's one recognisable Currena element —
 * "LED-board number style for headline numbers only"), the excluded note,
 * the "How this is calculated" explainer, and the one-line disclaimer bar
 * (02-page-design-spec.md §4).
 *
 * Labels describe how many indicators sit in their warning zone — they are
 * not advice and never phrased as one. votingCount === 0 renders the
 * honest "not enough voting data" line instead of an invented label.
 */

import { useState } from 'react';
import type { SummaryLine } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { LedDigits } from '../led/LedParts';

type SummaryTone = 'success' | 'info' | 'muted' | 'danger' | 'coral';

const LABEL_TONE: Record<NonNullable<SummaryLine['label']>, SummaryTone> = {
  relaxed: 'success',
  cautious: 'coral',
  stressed: 'danger',
  alarmed: 'danger',
};

const TONE_DOT: Record<SummaryTone, string> = {
  success: 'bg-currena-success',
  info: 'bg-currena-blue',
  muted: 'bg-currena-muted',
  danger: 'bg-currena-warning',
  coral: 'bg-currena-coral',
};

/* I6 audit F1/F4: the label WORDS are small text — ink-grade -deep tokens
 * (light: ≥4.5:1 on the page bg; dark: remapped bright hues). The dot is
 * decoration (aria-hidden) and keeps the bright accent. */
const TONE_TEXT: Record<SummaryTone, string> = {
  success: 'text-currena-success-deep',
  info: 'text-currena-blue-deep',
  muted: 'text-currena-muted',
  danger: 'text-currena-warning-deep',
  coral: 'text-currena-coral-deep',
};

function SummaryLineRow({
  line,
  copy,
}: {
  line: SummaryLine;
  copy: InsightsCopy;
}) {
  const ledValue = String(line.warningCount);
  const ledLabel = interpolate(copy.ui.inWarning, {
    warnings: line.warningCount,
    voting: line.votingCount,
  });
  return (
    <div className="flex items-center gap-3">
      <span
        role="img"
        aria-label={ledLabel}
        className="shrink-0 leading-none"
      >
        <LedDigits value={ledValue} className="text-2xl led-cell-hot sm:text-3xl" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.95rem] font-bold leading-tight">
          {copy.sections[line.section]}
        </p>
        <p className="m-0 text-sm text-currena-muted">
          {ledLabel}
          {line.label ? (
            <span className="ms-2 inline-flex items-center gap-1.5 align-middle">
              <span
                className={`inline-block h-2 w-2 rounded-full ${LABEL_TONE[line.label] ? TONE_DOT[LABEL_TONE[line.label]] : ''}`}
                aria-hidden="true"
              />
              <span className={`font-bold ${TONE_TEXT[LABEL_TONE[line.label]]}`}>
                {copy.label[line.label]}
              </span>
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function SummaryBlock({
  summary,
  copy,
  onJumpAbout,
}: {
  summary: { global: SummaryLine; australia: SummaryLine };
  copy: InsightsCopy;
  /** Scroll to the About-the-data section (full disclaimer lives there). */
  onJumpAbout: () => void;
}) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const global = summary.global;
  const australia = summary.australia;

  return (
    <section aria-label={copy.sections.global} className="m-0">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <SummaryLineRow line={global} copy={copy} />
        <SummaryLineRow line={australia} copy={copy} />
      </div>

      {(australia.excludedCount > 0 || global.excludedCount > 0) && (
        <p className="mt-2 mb-0 text-xs text-currena-muted">
          {interpolate(copy.ui.excludedNote, {
            n: australia.excludedCount + global.excludedCount,
          })}
        </p>
      )}
      {australia.votingCount === 0 && global.votingCount === 0 ? (
        <p className="mt-2 mb-0 text-xs text-currena-muted">{copy.ui.noSummary}</p>
      ) : null}

      {/* How this is calculated — the voting rules in plain language. */}
      <div className="mt-3">
        <button
          type="button"
          aria-expanded={explainerOpen}
          onClick={() => setExplainerOpen((open) => !open)}
          className="cursor-pointer rounded-full border-0 bg-transparent px-0 text-sm font-semibold text-currena-blue underline decoration-currena-blue/40 underline-offset-4 transition-colors duration-300 hover:decoration-currena-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
        >
          {explainerOpen ? copy.ui.howCalculatedHide : copy.ui.howCalculated}
        </button>
        {explainerOpen ? (
          <ul className="mt-2 mb-0 grid list-disc gap-1.5 rounded-2xl bg-currena-soft/70 p-4 ps-6 text-sm leading-relaxed dark:bg-white/[0.05]">
            <li>{copy.ui.explainerIntro}</li>
            <li>{copy.ui.explainerScore}</li>
            <li>{copy.ui.explainerLabels}</li>
            <li>{copy.ui.explainerStale}</li>
            <li>{copy.ui.explainerBacktest}</li>
          </ul>
        ) : null}
      </div>

      {/* One-line disclaimer bar — links to the full text below. */}
      <div
        role="note"
        className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[15px] border-s-4 border-currena-muted/60 bg-currena-muted/10 px-3.5 py-2.5 text-xs font-medium text-currena-muted"
      >
        <span aria-hidden="true">ⓘ</span>
        <span>{copy.ui.disclaimerBar}</span>
        <button
          type="button"
          onClick={onJumpAbout}
          className="cursor-pointer border-0 bg-transparent px-0 py-0 font-semibold text-currena-blue underline decoration-currena-blue/40 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
        >
          {copy.ui.aboutTitle} ↧
        </button>
      </div>
    </section>
  );
}
