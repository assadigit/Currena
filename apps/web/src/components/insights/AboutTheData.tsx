/**
 * AboutTheData — sources, update schedule, how "warning" is decided, and
 * the full disclaimer (02-page-design-spec.md §4 item 7). The no-advice
 * wording rule (D4) lives here in its strongest form.
 */

import type { InsightsCopy } from '../../i18n/insights-copy-en';

export function AboutTheData({ copy }: { copy: InsightsCopy }) {
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
      </div>
    </section>
  );
}
