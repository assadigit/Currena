/**
 * AboutTheData — sources, update schedule, how "warning" is decided, and
 * the full disclaimer (02-page-design-spec.md §4 item 7). The no-advice
 * wording rule (D4) lives here in its strongest form.
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
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      insightsCsvFilename(snapshot.generatedAt),
    );
  };

  return (
    <section id="insights-about" aria-labelledby="insights-about-title" className="scroll-mt-24">
      <h2 id="insights-about-title" className="m-0 mb-3 text-lg font-extrabold">
        {copy.ui.aboutTitle}
      </h2>
      <div className="flex flex-col gap-3 rounded-[18px] bg-white p-5 ring-1 ring-black/[0.06] dark:bg-[#1A222E] dark:ring-white/[0.08]">
        <div>
          <h3 className="m-0 mb-1 text-sm font-bold text-currena-blue">{copy.ui.aboutSourcesTitle}</h3>
          <p className="m-0 text-sm leading-relaxed text-currena-dark/90">{copy.ui.aboutSourcesBody}</p>
        </div>
        <div>
          <h3 className="m-0 mb-1 text-sm font-bold text-currena-blue">{copy.ui.aboutScheduleTitle}</h3>
          <p className="m-0 text-sm leading-relaxed text-currena-dark/90">{copy.ui.aboutScheduleBody}</p>
        </div>
        <div>
          <h3 className="m-0 mb-1 text-sm font-bold text-currena-blue">{copy.ui.aboutRulesTitle}</h3>
          <p className="m-0 text-sm leading-relaxed text-currena-dark/90">{copy.ui.aboutRulesBody}</p>
        </div>
        <div className="rounded-2xl bg-currena-muted/10 p-4">
          <h3 className="m-0 mb-1 text-sm font-bold text-currena-dark">{copy.ui.disclaimerTitle}</h3>
          <p className="m-0 text-sm leading-relaxed text-currena-dark/90">{copy.ui.disclaimerBody1}</p>
          <p className="mt-2 mb-0 text-sm leading-relaxed text-currena-dark/90">{copy.ui.disclaimerBody2}</p>
        </div>
        {/* I13: the snapshot export — after the trust copy so it inherits the
            "this is the exact data you just read about" framing. no-print:
            paper readers can't click a download. */}
        <div className="no-print flex flex-col gap-1.5 border-t border-black/[0.06] pt-3.5 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-5 text-xs font-bold text-currena-blue-deep transition-colors duration-200 hover:bg-currena-blue/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:text-currena-blue"
          >
            <span aria-hidden="true">⬇</span>
            {copy.ui.downloadCsv}
          </button>
          <p className="m-0 text-[0.7rem] leading-relaxed text-currena-muted">{copy.ui.csvHint}</p>
        </div>
      </div>
    </section>
  );
}
