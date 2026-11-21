/**
 * signals/MergedCard — the ONE gold conditions card, carrying the
 * measured note + the interactive chart + the price footing (v3
 * UI_SPEC §9/UI-45 × the owner's v7 BalanceScale machinery, 2026-10-19
 * v3 merge; the history rides the file’s own block comments below).
 *
 * GUX-S10 (Q3-A, the owner's 2026-11-2x answer — the ratio-only home):
 * the card is GOLD-ONLY. The R26 merged gold-and-silver structure
 * (mergeSignals: the shared four global conditions listed once + the
 * per-metal footing rows + the silver-only industrial condition)
 * RETIRED from /gold — silver lives in the seats it already owns
 * honestly (the gold-silver ratio seat, the if-you'd-bought row, the
 * London vault's silver row), and the OI-4-protected silver sentence
 * is consciously ended on this page (the owner's recorded call). The
 * surviving anatomy is the option's own enumeration — the chart (the
 * interactive GoldPriceChart over the OHLC leg) + the measured note +
 * the price footing (gold's row) — plus the card’s own gold furniture:
 * the lane-model lean line, the C12 interaction banner and the five
 * lane drill links. The honesty rules hold on the gold surfaces
 * (UI-40/UI-39.5 ride the hero's instrument now — the second
 * BalanceScale retired at S5-M5; the measured note and the no-forecast
 * caveat stay visible without a tap).
 *
 * The Step-1 audit item C12 interaction note (gold near its decade high
 * while real yields sit high) stays inside the card as its banner:
 * the one named combination the separate condition lines cannot say by
 * construction.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionReading, SignalReading } from '@currena/insights';
import { goldBalance } from '@currena/insights';
import { interpolate } from '../../../shared/i18n';
import type { InsightsCopy } from '../../../shared/i18n/insights-copy-en';
import { formatChange, formatIndicatorValue } from '../../../shared/config';
import { balanceVerdictCountsParts, balanceVerdictWordOf, type BalanceCounts } from './BalanceScale';
import { ConditionIcon, LeanIcon, stateToneClass } from './icons';
import { MetalIcon, VerdictStrip, goldOutlookOf } from './verdict';

/**
 * Gold balance consolidation P2 (GB-S3): the lane model's own measured
 * record — docs/insights/BACKTEST-GOLD-LANES.md in THIS repository. The
 * balance's measured note (03 §6.2) describes the LANE balance's
 * association (the report's realised-move tables: sign-agreements
 * 51.9/46.6/41.1% at 5/20/60td, against-readings before larger rises),
 * so the link points there — the document the reader can verify the
 * note against (GoldTailwindPanel's GOLD_BACKTEST_URL stays aimed at the
 * frozen table's report it quotes).
 */
const GOLD_BALANCE_BACKTEST_URL =
  'https://github.com/assadigit/Currena/blob/main/docs/insights/BACKTEST-GOLD-LANES.md';

/**
 * GB-S6 (P5, 2026-11-04 — the owner's recorded "go"): the consolidated
 * lane balance is THE gold card for every visitor. The ?balance=lanes
 * preview flag, the balanceLanes threading and the two gold panels
 * (GoldTailwindPanel + ModelVsRealityPanel) RETIRED with this flip.
 * OI-3/GB-S7 (2026-11-04, the owner's recorded approval): the
 * `goldSummary` wire field retired too — the snapshot no longer carries
 * it at all (the UI never read it since the flip — AC-9 held; the
 * recheck lineage reads the historical stamps from the raw archive
 * JSON, per GOLD_RECHECK_SPEC §3). The two panels' own tests went with
 * them (the surviving assertions moved to gold-balance-lanes.test.tsx).
 */

export function MergedSignalsCard({
  gold,
  readings,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  /** The metal's current price, display-formatted — the VerdictStrip's
   * header carries it in the lighter ink (2026-10-20 owner sketch: the
   * price already leads the prices board; the strip emphasises the
   * TREND). Honest absence → null, no placeholder. */
  const priceTextOf = (priceId: IndicatorId): string | null => {
    const reading = byId.get(priceId);
    return reading !== undefined && reading.value !== null
      ? formatIndicatorValue(priceId, reading.value, numberLocale, copy.units)
      : null;
  };

  /* ---------------------------------------------------------------- *
   * Gold balance consolidation P2 (GB-S3, 2026-11-03; LIVE for every
   * visitor since the GB-S6 flip — 03-UX-AND-COPY.md): the consolidated
   * balance. The four LANES drive the BalanceScale through the P1
   * engine (goldBalance, PR #15) — one chip per lane, its members one
   * tap away in the ledger row.
   * ---------------------------------------------------------------- */
  const gs = s.goldScore;
  const balance = useMemo(() => goldBalance(readings), [readings]);
  /* GB-S5 (P3, 01 §5.2 + AC-3): the gold Outlook derived from the SAME
   * goldBalance() result that drives the lane drivers and the verdict
   * word above — the strip can no longer contradict the balance
   * (D-GB-6). The range evidence is UNCHANGED: the gold reading's own
   * speed/position, the exact inputs outlookOf reads today. Since the
   * GB-S6 flip this is THE derivation (the flag-off legacy path
   * retired). GUX-S10 (Q3-A): /gold renders no outlook for silver at
   * all — outlookOf stays exported for the engine-parity pins only. */
  const goldOutlook = goldOutlookOf(balance, gold.speed, gold.position);

  /** The gold prose helper (GB-S6, the collapsed-corner decision): the
   * balance counts as a BalanceCounts shape for the shared rule helpers
   * — the verdict word + the counts parts the card itself renders, so
   * the summary prose can never drift from the card (one engine). */
  const laneCounts: BalanceCounts = {
    ...balance.counts,
    total: balance.lanes.length,
    net: balance.net,
    readable: balance.readable,
  };

  /** The gold header prose (GB-S6, the collapsed-corner decision): the
   * balance counts as a BalanceCounts shape for the shared rule helpers
   * — the verdict word + the counts parts the card itself renders, so
   * the summary prose can never drift from the card (one engine).
   * GUX-S10 (Q3-A): the card's ONLY lean line — the silver legacy
   * per-condition sentence retired with the silver sub-analysis
   * (the OI-4-protected sentence is consciously ended on this page). */
  const goldLeanLine = interpolate(s.metalLeanLanes, {
    metal: s.metals.gold,
    lean: balanceVerdictWordOf(laneCounts, copy),
    counts: balanceVerdictCountsParts(laneCounts, copy, numberLocale).join(' · '),
  });

  /** Gold's header lean icon rides the balance verdict (net for → up,
   * against → down, level/unreadable → flat) so the icon can never
   * contradict the prose beside it. GUX-S10 (Q3-A): the header's ONLY
   * icon — silver's own-lean icon retired with its line. */
  const goldHeaderLean: 'mostly-supportive' | 'mostly-unsupportive' | 'mixed' =
    balance.net > 0 ? 'mostly-supportive' : balance.net < 0 ? 'mostly-unsupportive' : 'mixed';

  /* 01 §8.2: the measured note + the backtest link — visible without a
   * tap, no edge claimed. GB-S4: the balance's FOOTNOTE (05 §4.1 item 8). */
  const measuredNote = (
    <p data-balance-measured-note className="bal-foot">
      {s.balance.measuredNote}{' '}
      <a
        href={GOLD_BALANCE_BACKTEST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="insights-focusable"
      >
        {gs.measuredNoteLink}
      </a>
    </p>
  );

  const positionWordOf = (percentile: number | null): string | null => {
    if (percentile === null) return null;
    return percentile > 0.8 ? copy.ui.positionHigh : percentile < 0.2 ? copy.ui.positionLow : copy.ui.positionTypical;
  };

  /** The gold footing row (owner spec §9): the price's own position in
   * its 10-year range + its 30-day speed — context ONLY, never a driver
   * (never counted in the balance's total/net/readable). GUX-S10
   * (Q3-A): the strip's ONLY row — silver's footing row retired with
   * the rest of its sub-analysis; silver's price surfaces live in the
   * if-you'd-bought row and the London vault's silver row. */
  const goldFootingState =
    gold.conditions.find((c) => c.key === 'footing')?.state ?? 'unknown';

  const footingRow = (state: string) => {
    const priceId: IndicatorId = 'gold-usd';
    const metal = 'gold';
    const reading = byId.get(priceId);
    const speed =
      reading !== undefined && reading.change30d !== undefined && Number.isFinite(reading.change30d)
        ? formatChange(reading.change30d, 'pct', numberLocale, copy.units)
        : null;
    const positionPercentile =
      reading !== undefined && reading.percentile10y !== undefined ? reading.percentile10y : null;
    const positionWord = positionWordOf(positionPercentile);
    const valueText =
      reading !== undefined && reading.value !== null
        ? formatIndicatorValue(priceId, reading.value, numberLocale, copy.units)
        : null;
    return (
      <li
        key={metal}
        className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
        data-footing-metal={metal}
        data-footing-state={state}
      >
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <MetalIcon size={24} desktopSize={30} />
            <span className={`inline-flex shrink-0 items-center gap-1 ${stateToneClass(state as SignalConditionReading['state'])}`}>
              <ConditionIcon state={state as SignalConditionReading['state']} />
              <span className="text-[length:var(--type-label)] font-bold">
                {s.conditionStateShort[state as SignalConditionReading['state']] ?? s.notEnoughData}
              </span>
            </span>
          </span>
          <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {s.metals.gold}
          </span>
          {valueText !== null ? (
            <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {valueText}
            </bdi>
          ) : null}
          {positionWord !== null && positionPercentile !== null ? (
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
              {interpolate(s.footingPosition, { band: positionWord })}
            </span>
          ) : null}
          {speed !== null ? (
            <span className="ms-auto flex items-baseline gap-1 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
              {s.speedLabel}:
              <bdi dir="ltr" className="font-semibold tabular-nums">
                {speed}
              </bdi>
            </span>
          ) : null}
        </span>
        <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          {s.conditions.footing.how}
        </span>
      </li>
    );
  };

  /* Step-1 audit item C12: gold near its DECADE high while real yields
   * are also high — the one combination the balance's separate blocks
   * cannot say by construction. Computed from the same readings (no new
   * claim, a named interaction the backtested relationships support).
   * Kept in BOTH views (GB-S3: the prompt keeps the C12 banner). */
  const c12Banner = (() => {
    const goldReading = byId.get('gold-usd');
    const realYield = byId.get('real-yield-10y');
    const goldHigh = goldReading !== undefined && (goldReading.percentile10y ?? 0) >= 0.9;
    const yieldsHigh =
      realYield !== undefined && (realYield.percentile10y ?? 0) >= 0.8 && realYield.value !== null && realYield.value > 0;
    if (!goldHigh || !yieldsHigh) return null;
    return (
      <p
        className="m-0 rounded-[var(--radius-sm)] bg-currena-warning/[0.08] px-2.5 py-2 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]"
        data-gold-yields-warning
      >
        <bdi>{copy.signals.goldHighYieldsWarning}</bdi>
      </p>
    );
  })();

  return (
    <article
      data-signal-card="merged"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">
          {s.mergedTitle}
        </h3>
        <span
          className="ms-auto inline-flex items-center gap-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
          data-signal-metal="gold"
        >
          <MetalIcon size={18} desktopSize={22} />
          {/* GB-S6: the header icon rides the balance verdict (the prose
           * joined the lane model — the collapsed-corner decision).
           * GUX-S10 (Q3-A): the header's ONLY line. */}
          <LeanIcon lean={goldHeaderLean} />
          {goldLeanLine}
        </span>
      </header>

      {/* Round 23 (owner): the stated estimation — the card's answer-first
       * block. 2026-10-20 (owner sketch): the chips redraw as analysis
       * cards — header (artwork box · name + verdict · lighter price)
       * over a BIG trend chart, one anatomy for mobile and desktop.
       * GB-S5 (P3, 01 §5.2): the GOLD leg derives from the consolidated
       * balance (goldOutlookOf — AC-3) — since the GB-S6 flip THE
       * derivation for every visitor. GUX-S10 (Q3-A): the strip's ONLY
       * leg — silver's own conditions (OI-4) retired from /gold. */}
      <VerdictStrip
        goldOutlook={goldOutlook}
        price={priceTextOf('gold-usd')}
        copy={copy}
        numberLocale={numberLocale}
      />

      {/* GUX-S5 M5 (11 §5.4 — the DUP-2 dedup ledger, executed): the
       * SECOND full BalanceScale RETIRES as a balance — the hero's
       * CompositionStack is the page's ONE instrument (②; the
       * one-full-instrument-per-page rule). What survives here: the
       * C12 interaction banner (this card's own finding) + the measured
       * note + the LANE drill-in — five plain links to the lanes'
       * #lane-{lane} cards (the reader who wants the balance follows
       * the anchor; the balance itself never renders twice). */}
      {c12Banner}
      {measuredNote}
      <nav aria-label={gs.laneDrillLabel} data-lane-drill className="flex flex-wrap gap-x-3 gap-y-1">
        {balance.lanes.map((lane) => (
          <a
            key={lane.lane}
            href={`#lane-${lane.lane}`}
            className="insights-focusable rounded py-1 text-[length:var(--type-caption)] font-semibold text-currena-blue underline-offset-2 hover:underline"
            data-lane-drill-link={lane.lane}
          >
            {gs.laneNames[lane.lane]} ↗
          </a>
        ))}
      </nav>
      {/* 2026-10-21c owner round: <BalanceScale metal="silver" …> retired
       * earlier; GUX-S5 M5 retires the GOLD instance the same way — one
       * instrument per page, the CompositionStack's. */}

      {/* Price footing strip (owner spec §9): the gold price's own
       * position + speed, below the chart, separated by a clear gap and
       * a divider line. Footing is NOT a driver — it is never counted
       * in the balance's total/net/readable. GUX-S10 (Q3-A): gold's row
       * only (silver's seats live elsewhere — the if-you'd-bought row
       * + the London vault's silver row). */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
          {s.footingTitle}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {footingRow(goldFootingState)}
        </ul>
      </div>

    </article>
  );
}
