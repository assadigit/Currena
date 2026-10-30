/**
 * Signals — UI spec Blocks S1–S3 (I17), restructured by round-2 R26.
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim; the public
 * surface unchanged: Insights.tsx imports Signals from here):
 *
 *   signals/verdict.tsx    — the stated outlook (outlookOf), the icons
 *                            /artwork, MetalTrendChart, VerdictStrip
 *   signals/icons.tsx      — the condition/lean glyph set (no check or
 *                            cross glyphs anywhere — R26)
 *   signals/MergedCard.tsx — the ONE merged gold-and-silver card (R26)
 *
 * The shell keeps: the signal evaluations (evaluateSignal gold/silver),
 * the session-only open state + expand-token effect (round 27), the
 * collapsed summary lines and the section chrome.
 *
 * ONE merged gold-and-silver card (R26): the four global conditions the
 * metals share are listed once (identical by construction — the evaluators
 * read the same global series); each metal gets its own footing row; the
 * silver-only industrial condition sits in a separate short list. The
 * 30-day speed rides the footing row ONLY when the data exists — no more
 * "Measuring…" tile.
 *
 * The "before you act" box (S3) was removed entirely (2026-10-10 owner
 * request) — the collapsed summary and the merged card carry the honesty
 * framing instead.
 *
 * Round 27 (owner): the card OPENS by default on every visit — the
 * condition rows, live values and footing rows ARE the section; a
 * persisted "collapsed" made them look deleted. "Show details" keeps
 * working (and any targeted pill/hash link still expands), but the
 * choice is session-only — a fresh load always shows the full card.
 */

import { useEffect, useMemo, useState } from 'react';
import type { GoldSummary, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { evaluateSignal, type SignalReading } from '@currena/insights';
import { Activity, ChevronDown } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { SIGNALS_ENABLED } from './config';
import { MergedSignalsCard } from './signals/MergedCard';
import { VerdictIcon, outlookOf, verdictTone } from './signals/verdict';

/** Round 24: the collapsed per-metal line's takeaway — the estimation,
 * icon + word + ink (round 26: the icon joined the line); unreadable
 * metals stay silent. 2026-10-21 (owner): the word is the seven-state
 * outlook's short NAME (the full sentences live in the strip chips). */
function CollapsedVerdict({ reading, copy }: { reading: SignalReading; copy: InsightsCopy }) {
  const s = copy.signals;
  const verdict = outlookOf(reading);
  if (verdict === null) return null;
  return (
    <span
      className={`ms-1.5 inline-flex items-center gap-1 font-bold ${verdictTone[verdict]}`}
      data-collapsed-verdict={verdict}
    >
      <VerdictIcon verdict={verdict} size={16} desktopSize={20} />
      {interpolate(s.collapsedVerdict, { verdict: s.verdictStateNames[verdict] })}
    </span>
  );
}

export function Signals({
  readings,
  goldSummary,
  copy,
  numberLocale,
  expandToken,
}: {
  readings: readonly IndicatorReading[];
  /** Gold Program S2.1: the served snapshot's compact gold summary —
   * passed down to the merged card's two gold panels (derived
   * client-side when absent). */
  goldSummary?: GoldSummary | undefined;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
}) {
  const gold = useMemo(() => evaluateSignal('gold', readings), [readings]);
  const silver = useMemo(() => evaluateSignal('silver', readings), [readings]);
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

  // Collapsed summary (R7b, now session-only): one line per metal —
  // "Gold: mixed, 2 of 5 conditions met — price in the top 7% of the
  // last 10 years".
  const collapsedLine = (reading: SignalReading): string => {
    const s = copy.signals;
    const leanWord = reading.lean !== null ? s.lean[reading.lean] : s.notEnoughData;
    const base = interpolate(s.metalLean, {
      metal: s.metals[reading.metal],
      lean: leanWord,
      met: formatNumber(reading.metCount, numberLocale, { maximumFractionDigits: 0 }),
      total: formatNumber(reading.conditions.length, numberLocale, { maximumFractionDigits: 0 }),
    });
    const position = reading.position;
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
    <section id="insights-signals" aria-labelledby="insights-signals-title" className="scroll-mt-24">
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
            className="insights-focusable inline-flex min-h-[24px] min-w-[24px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
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
            silver={silver}
            readings={readings}
            goldSummary={goldSummary}
            copy={copy}
            numberLocale={numberLocale}
          />
        ) : (
          /* Collapsed: one line per metal (spec R7b). */
          <ul className="m-0 flex list-none flex-col gap-1 p-0" data-signals-summary>
            {[gold, silver].map((reading) => (
              <li
                key={reading.metal}
                className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
                data-signal-metal={reading.metal}
              >
                {collapsedLine(reading)}
                {/* Round 24 (roast #4): the collapsed line now ends with
                 * its takeaway — the round-23 estimation, in the ink. */}
                <CollapsedVerdict reading={reading} copy={copy} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
