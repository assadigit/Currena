/**
 * signals/MergedCard — the ONE merged gold-and-silver card, carrying the
 * GOLD balance visual (v3 UI_SPEC §9/UI-45 × the owner's v7 BalanceScale
 * machinery, 2026-10-19 v3 merge).
 *
 * History: R26 merged the two metals' cards into one (shared conditions
 * listed once + per-metal footing rows); round 23's VerdictStrip (the
 * estimation chips) stayed as the card's answer-first block and the
 * 2026-10-20 owner sketch redrew it as the per-metal analysis cards with
 * prices. The balance visual then lived through the owner's seven
 * wireframe iterations (v1 spec → the v7 "rotate the beam only, visualize
 * weight" addendum — pans hung from the beam, SVG mechanical layer,
 * needle + three-tick arc gauge; all of that machinery is KEPT verbatim).
 * The v3 UI_SPEC §9 owner decision gave gold and silver each their OWN
 * balance (UI-45) — the 2026-10-21c owner round RETIRES THE SILVER
 * BALANCE entirely ("I dont need balance scale of Silver, remove that
 * section entirely"): gold keeps its balance; silver keeps its analysis
 * card (VerdictStrip) and its footing row — the silver-only industrial
 * condition no longer needs a pan, so it does not render here at all.
 * The honesty rules hold on the gold balance (UI-40: readable < 3 →
 * level beam + the not-enough line, implemented inside BalanceScale);
 * the readable-count line always states the evidence (UI-39.5); the
 * price-footing strip stays below as the owner's own v1-spec structure
 * (footing is never a driver).
 *
 * The Step-1 audit item C12 interaction note (gold near its decade high
 * while real yields sit high) stays inside gold's balance as its banner:
 * the one named combination the separate condition lines cannot say by
 * construction.
 */

import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import type { SignalConditionReading, SignalReading } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatChange, formatIndicatorValue, mergeSignals } from '../config';
import { BalanceScale, driverStateOf, type BalanceDriver } from './BalanceScale';
import { GoldTailwindPanel } from './GoldTailwindPanel';
import { ModelVsRealityPanel } from './ModelVsRealityPanel';
import { ConditionIcon, LeanIcon, stateToneClass } from './icons';
import { MetalIcon, VerdictStrip } from './verdict';

export function MergedSignalsCard({
  gold,
  silver,
  readings,
  goldSummary,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  readings: readonly IndicatorReading[];
  /** Gold Program S2.1: the served snapshot's compact gold summary
   * (absent on pre-S2 snapshots — the panels then derive it client-side
   * through the same pure engine). */
  goldSummary?: GoldSummary | undefined;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const merged = mergeSignals(gold, silver);
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

  const metalLeanLine = (reading: SignalReading): string => {
    const leanWord = reading.lean !== null ? s.lean[reading.lean] : s.notEnoughData;
    return interpolate(s.metalLean, {
      metal: s.metals[reading.metal],
      lean: leanWord,
      met: formatNumber(reading.metCount, numberLocale, { maximumFractionDigits: 0 }),
      total: formatNumber(reading.conditions.length, numberLocale, { maximumFractionDigits: 0 }),
    });
  };

  /* ---------------------------------------------------------------- *
   * The gold card's balance visual (owner spec
   * docs/insights/gold-balance-card-spec.md): the grouped driver list
   * becomes a beam balance. The driver list is READ from the signal
   * data (gold's conditions minus its own footing — footing is the
   * price strip below the trays, never a driver, §9); the length is
   * whatever the evaluator produces, never hard-coded. The explanation
   * sentences, the values and the banner below are the card's existing
   * copy, unchanged.
   * ---------------------------------------------------------------- */
  const balanceValueText = (inputs: readonly IndicatorId[]): string | null => {
    const parts: string[] = [];
    for (const id of inputs) {
      const r = byId.get(id);
      if (r === undefined || r.value === null) continue;
      parts.push(formatIndicatorValue(id, r.value, numberLocale, copy.units));
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  };
  const driversOf = (signal: SignalReading): BalanceDriver[] =>
    signal.conditions
      .filter((c) => c.key !== 'footing')
      .map((c) => ({
        key: c.key,
        label: s.conditions[c.key].name,
        detail: s.conditions[c.key].how,
        valueText: balanceValueText(c.inputs),
        state: driverStateOf(c.state),
      }));
  const balanceDrivers: BalanceDriver[] = driversOf(gold);
  /* 2026-10-21c owner round: silver's balance is RETIRED entirely — only
   * gold's balance renders below. silverDrivers is gone with it. */

  const positionWordOf = (percentile: number | null): string | null => {
    if (percentile === null) return null;
    return percentile > 0.8 ? copy.ui.positionHigh : percentile < 0.2 ? copy.ui.positionLow : copy.ui.positionTypical;
  };

  const footingRow = (metal: 'gold' | 'silver', state: string, priceId: IndicatorId) => {
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
            <MetalIcon metal={metal} size={24} desktopSize={30} />
            <span className={`inline-flex shrink-0 items-center gap-1 ${stateToneClass(state as SignalConditionReading['state'])}`}>
              <ConditionIcon state={state as SignalConditionReading['state']} />
              <span className="text-[length:var(--type-label)] font-bold">
                {s.conditionStateShort[state as SignalConditionReading['state']] ?? s.notEnoughData}
              </span>
            </span>
          </span>
          <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {s.metals[metal]}
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

  return (
    <article
      data-signal-card="merged"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">
          {s.mergedTitle}
        </h3>
        <span className="ms-auto flex flex-col items-end gap-0.5">
          {[gold, silver].map((reading) => (
            <span
              key={reading.metal}
              className="inline-flex items-center gap-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
              data-signal-metal={reading.metal}
            >
              <MetalIcon metal={reading.metal} size={18} desktopSize={22} />
              {reading.lean !== null ? <LeanIcon lean={reading.lean} /> : null}
              {metalLeanLine(reading)}
            </span>
          ))}
        </span>
      </header>

      {/* Round 23 (owner): the stated estimation — one direction chip per
       * metal, derived from the conditions below. Answer first.
       * 2026-10-20 (owner sketch): the chips redraw as analysis cards —
       * header (artwork box · name + verdict · lighter price) over a BIG
       * trend chart, one anatomy for mobile and desktop. */}
      <VerdictStrip
        gold={gold}
        silver={silver}
        prices={{ gold: priceTextOf('gold-usd'), silver: priceTextOf('silver-usd') }}
        copy={copy}
        numberLocale={numberLocale}
      />

      {/* UI-45 (2026-10-19 v3 merge; 2026-10-21c owner round): GOLD's
       * balance — the owner's v7 BalanceScale machinery (heading + side
       * captions over the pan columns → the balance with factor tiles
       * resting on real pans hung from the beam → the aggregate
       * assessment box with the verdict word + count line + the v3
       * readable-count line). Silver's own balance is RETIRED (the
       * owner's directive): silver keeps its analysis card above and its
       * footing row below. Gold's assessment also carries the C12
       * banner. */}
      <BalanceScale
        drivers={balanceDrivers}
        copy={copy}
        numberLocale={numberLocale}
        banner={
          /* Step-1 audit item C12: gold near its DECADE high while real
           * yields are also high — the one combination the balance's
           * separate blocks cannot say by construction. Computed from
           * the same readings (no new claim, a named interaction the
           * backtested relationships support). */
          (() => {
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
          })()
        }
      />
      {/* 2026-10-21c owner round: <BalanceScale metal="silver" …> is RETIRED
       * here (the owner: "I dont need balance scale of Silver, remove that
       * section entirely"). Silver keeps its analysis card (VerdictStrip,
       * above) and its footing row (below); only gold carries a balance. */}

      {/* Gold Program S2.1 (owner round 2026-10-31 — "it's placed on the
       * wrong section … it must place here"): the two gold panels mount
       * DIRECTLY UNDER the balance visual («برآیند عوامل مؤثر بر قیمت
       * طلا»), inside this card — the 20-voter tailwind score + the
       * model-vs-reality comparison, the finer cut of the same question
       * the balance answers with its four broad conditions. Two columns
       * beside the balance's max-width column, stacked on mobile. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" data-gold-panels>
        <GoldTailwindPanel
          goldSummary={goldSummary}
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
        />
        <ModelVsRealityPanel
          goldSummary={goldSummary}
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
        />
      </div>

      {/* Price footing strip (owner spec §9): the SAME content that used
       * to sit beside the driver groups, now below the trays, separated
       * by a clear gap and a divider line. Footing is NOT a driver — it
       * is never counted in the balance's total/net/readable. */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
          {s.footingTitle}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {merged.footing.map((f) => footingRow(f.metal, f.state, f.priceId))}
        </ul>
      </div>

    </article>
  );
}
