/**
 * Signals — UI spec Blocks S1–S3 (I17), restructured by round-2 R26.
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim; the public
 * surface unchanged: GoldPage imports Signals from here):
 *
 *   signals/verdict.tsx    — the stated outlook (goldOutlookOf), the
 *                            icons/artwork, VerdictStrip
 *   signals/icons.tsx      — the condition/lean glyph set (no check or
 *                            cross glyphs anywhere — R26)
 *   signals/MergedCard.tsx — the ONE gold conditions card (Q3-A)
 *
 * The shell keeps: the gold signal evaluation (evaluateSignal gold —
 * the Outlook's speed/position inputs), the session-only open state
 * + expand-token effect (round 27), the collapsed summary line and
 * the section chrome.
 *
 * GUX-S10 (Q3-A, the owner's 2026-11-2x answer — the ratio-only home):
 * the section is GOLD-ONLY. The silver signal evaluation (its 6-condition
 * model), the silver collapsed line + takeaway, and the whole merged
 * gold-and-silver structure RETIRED from /gold — silver lives in the
 * seats it already owns honestly (the gold-silver ratio seat, the
 * if-you'd-bought row, the London vault's silver row); the
 * OI-4-protected silver sentence is consciously ended on this page.
 *
 * Round 27 (owner): the card OPENS by default on every visit — the
 * condition rows, live values and footing rows ARE the section; a
 * persisted "collapsed" made them look deleted. "Show details" keeps
 * working (and any targeted pill/hash link still expands), but the
 * choice is session-only — a fresh load always shows the full card.
 */

import { useEffect, useMemo, useState } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { evaluateSignal, goldBalance } from '@currena/insights';
import { Activity, ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import type { InsightsCopy } from '../../shared/i18n/insights-copy-en';
import { SIGNALS_ENABLED } from '../../shared/config';
import {
  balanceVerdictCountsParts,
  balanceVerdictWordOf,
  type BalanceCounts,
} from './signals/BalanceScale';
import { MergedSignalsCard } from './signals/MergedCard';
import { VerdictIcon, goldOutlookOf, verdictTone, type OutlookState } from './signals/verdict';

/** Round 24: the collapsed line's takeaway — the estimation, icon + word
 * + ink (round 26: the icon joined the line); unreadable states stay
 * silent. 2026-10-21 (owner): the word is the seven-state outlook's
 * short NAME (the full sentences live in the strip card).
 * GB-S5 (P3, AC-3): the lane-derived override — the gold takeaway
 * derives from the SAME goldBalance() result as the card.
 * GB-S6 (the flip): the override is unconditional (the flag-off legacy
 * path retired with the flag). GUX-S10 (Q3-A): gold is the section's
 * ONLY takeaway — the silver collapsed verdict retired with its
 * sub-analysis. */
function CollapsedVerdict({
  copy,
  outlook,
}: {
  copy: InsightsCopy;
  outlook: OutlookState | null;
}) {
  const s = copy.signals;
  if (outlook === null) return null;
  return (
    <span
      className={`ms-1.5 inline-flex items-center gap-1 font-bold ${verdictTone[outlook]}`}
      data-collapsed-verdict={outlook}
    >
      <VerdictIcon verdict={outlook} size={16} desktopSize={20} />
      {interpolate(s.collapsedVerdict, { verdict: s.verdictStateNames[outlook] })}
    </span>
  );
}

export function Signals({
  readings,
  copy,
  numberLocale,
  expandToken,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
}) {
  const gold = useMemo(() => evaluateSignal('gold', readings), [readings]);
  /* GB-S5 (P3, AC-3): the collapsed gold takeaway ALSO derives from the
   * lane balance — the same pure engine the merged card runs (one
   * engine, no drift), so the collapsed line can never contradict the
   * balance beside it (D-GB-6). GB-S6 (the flip): unconditional.
   * GUX-S10 (Q3-A): the section's ONLY signal evaluation — silver's
   * evaluateSignal call retired with its sub-analysis. */
  const goldBalanceReading = useMemo(() => goldBalance(readings), [readings]);
  const goldLaneOutlook = useMemo(
    () => goldOutlookOf(goldBalanceReading, gold.speed, gold.position),
    [goldBalanceReading, gold],
  );
  /* Round 27 (owner): open by default — the detail is the content.
   * No persistence: collapsing is a per-session choice (spec R7b's
   * remembered default made the card look removed). */
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // R10-5: expand-on-token — see AboutTheData.tsx for the same pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expand-on-token: external trigger → local open state
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  if (!SIGNALS_ENABLED) return null;

  // Collapsed summary (R7b, now session-only): the gold lane-model line
  // — the verdict word + the counts parts (the same words the card
  // renders) + the footing band sentence. GUX-S10 (Q3-A): the silver
  // per-condition line retired with its sub-analysis (the OI-4
  // sentence consciously ended on this page).
  const goldLaneCounts: BalanceCounts = {
    ...goldBalanceReading.counts,
    total: goldBalanceReading.lanes.length,
    net: goldBalanceReading.net,
    readable: goldBalanceReading.readable,
  };
  const collapsedLine = (): string => {
    const s = copy.signals;
    const base = interpolate(s.metalLeanLanes, {
      metal: s.metals.gold,
      lean: balanceVerdictWordOf(goldLaneCounts, copy),
      counts: balanceVerdictCountsParts(goldLaneCounts, copy, numberLocale).join(' · '),
    });
    const position = gold.position;
    if (position === null) return base;
    const p = formatNumber(
      Math.round((position.band === 'high' ? 1 - position.percentile : position.percentile) * 100),
      numberLocale,
      { maximumFractionDigits: 0 },
    );
    const band =
      position.band === 'high'
        ? interpolate(s.bandTop, { p })
        : position.band === 'low'
          ? interpolate(s.bandBottom, { p })
          : s.bandMid;
    return `${base}; ${interpolate(s.collapsedFooting, { band })}`;
  };

  return (
    <section id="insights-signals" aria-labelledby="insights-signals-title" className="gold-anchor-mt">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-signals-title" className="type-section m-0">
          <span className="inline-flex items-center gap-1.5">
            <Activity aria-hidden size={23} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.signals.title}
          </span>
        </h2>
        <span className="inline-flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="insights-signals-body"
            onClick={() => setOpen(!open)}
            className="insights-focusable inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          >
            <span aria-hidden="true">
              <ChevronDown
                size={16}
                strokeWidth={2}
                className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
              />
            </span>
            {open ? copy.ui.showFewer : copy.ui.aboutShowDetails}
          </button>
        </span>
      </header>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.signals.subtitle}
      </p>

      <div id="insights-signals-body">
        {open ? (
          <MergedSignalsCard
            gold={gold}
            readings={readings}
            copy={copy}
            numberLocale={numberLocale}
          />
        ) : (
          /* Collapsed (spec R7b): the gold lane-model line + its
           * takeaway. GUX-S10 (Q3-A): the section's ONLY line. */
          <ul className="m-0 flex list-none flex-col gap-1 p-0" data-signals-summary>
            <li
              className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
              data-signal-metal="gold"
            >
              {collapsedLine()}
              {/* Round 24 (roast #4): the collapsed line now ends with
               * its takeaway — the round-23 estimation, in the ink.
               * GB-S5 (P3): the takeaway rides the lane-derived state
               * (AC-3); GB-S6 (the flip): unconditional. */}
              <CollapsedVerdict copy={copy} outlook={goldLaneOutlook} />
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
