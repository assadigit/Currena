/**
 * AboutTheData — sources, update schedule, how "alert" is decided, the
 * REQUIRED source notices (Block N1: the exact FRED® attribution line +
 * RBA/ABS/ECB attribution lines, data spec §9), and the full disclaimer
 * (N2: the ONE full disclaimer lives here — the hero carries the short
 * line). The no-advice wording rule (D4) lives here in its strongest form.
 *
 * I13: a CSV export of the exact snapshot the page is showing — the data
 * portability piece the "About" block was missing. Pure builder in
 * ./insights-csv.ts (unit-tested); this component only wraps it in a Blob
 * and hands it to the shared downloadBlob helper.
 */

import type { InsightsSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { downloadBlob } from '../../lib/download';
import { buildInsightsCsv, insightsCsvFilename } from './insights-csv';

/** The FRED API terms-of-use URL (Block N1: link to the terms). */
const FRED_TERMS_URL = 'https://fred.stlouisfed.org/docs/api/terms_of_use.html';

export function AboutTheData({
  copy,
  snapshot,
}: {
  copy: InsightsCopy;
  /** The snapshot the page is currently rendering (may be the cached one). */
  snapshot: InsightsSnapshot;
}) {
  const downloadCsv = (): void => {
    const csv = buildInsightsCsv(snapshot, copy);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), insightsCsvFilename(snapshot.generatedAt));
  };

  return (
    <section id="insights-about" aria-labelledby="insights-about-title" className="scroll-mt-24">
      <h2 id="insights-about-title" className="m-0 mb-3 text-lg font-extrabold">
        {copy.ui.aboutTitle}
      </h2>
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 ring-1 ring-[var(--color-border)]">
        <div>
          <h3 className="m-0 mb-1 text-[var(--type-label)] font-bold text-[var(--color-status-context)]">
            {copy.ui.aboutSourcesTitle}
          </h3>
          <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.ui.aboutSourcesBody}
          </p>
        </div>
        {/* N1: the REQUIRED notices, prominently — the exact FRED sentence
            (linked to the API terms) + the publisher attribution lines. */}
        <div className="rounded-[var(--radius-md)] bg-currena-soft/60 p-4 dark:bg-white/[0.05]">
          <h3 className="m-0 mb-1.5 text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {copy.ui.attributionTitle}
          </h3>
          <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi dir="ltr">{copy.ui.fredNotice}</bdi>{' '}
            <a
              href={FRED_TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="insights-focusable font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
            >
              {copy.ui.fredTerms} ↗
            </a>
          </p>
          <ul className="mt-2 mb-0 grid list-none gap-1 p-0 text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            <li>{copy.ui.attributionRba}</li>
            <li>{copy.ui.attributionAbs}</li>
            <li>{copy.ui.attributionEcb}</li>
            <li>{copy.ui.attributionBasket}</li>
          </ul>
        </div>
        <div>
          <h3 className="m-0 mb-1 text-[var(--type-label)] font-bold text-[var(--color-status-context)]">
            {copy.ui.aboutScheduleTitle}
          </h3>
          <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.ui.aboutScheduleBody}
          </p>
        </div>
        <div>
          <h3 className="m-0 mb-1 text-[var(--type-label)] font-bold text-[var(--color-status-context)]">
            {copy.ui.aboutRulesTitle}
          </h3>
          <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.ui.aboutRulesBody}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-currena-muted/10 p-4">
          <h3 className="m-0 mb-1 text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {copy.ui.disclaimerTitle}
          </h3>
          <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.ui.disclaimerBody1}
          </p>
          <p className="mt-2 mb-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {copy.ui.disclaimerBody2}
          </p>
        </div>
        {/* I13: the snapshot export — after the trust copy so it inherits the
            "this is the exact data you just read about" framing. no-print:
            paper readers can't click a download. */}
        <div className="no-print flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3.5">
          <button
            type="button"
            onClick={downloadCsv}
            className="insights-focusable inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-5 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors duration-200 hover:bg-currena-blue/25"
          >
            <span aria-hidden="true">⬇</span>
            {copy.ui.downloadCsv}
          </button>
          <p className="m-0 text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            {copy.ui.csvHint}
          </p>
        </div>
      </div>
    </section>
  );
}
