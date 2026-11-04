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

import { useMemo } from 'react';
import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import type { SignalConditionReading, SignalReading } from '@currena/insights';
import { breakevenTiltLean, goldBalance, type GoldBalanceLane, type GoldBalanceMember } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatChange, formatIndicatorValue, mergeSignals } from '../config';
import { chipWordKeyOf } from '../StatusChip';
import { BalanceScale, driverStateOf, type BalanceDriver } from './BalanceScale';
import { GoldTailwindPanel } from './GoldTailwindPanel';
import { ModelVsRealityPanel } from './ModelVsRealityPanel';
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
 * GB-S3 (04 §3 P2): reads `?balance=lanes` from window.location.search
 * once at mount — the ?narrative=preview pattern (a query parameter read
 * on the Insights route, NO persistence; without it every visitor sees
 * today's page byte-for-byte, pinned by the legacy-markup snapshot
 * test). The route calls this and threads the boolean down through
 * Signals to this card.
 */
export function useBalanceLanesPreview(): boolean {
  return useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('balance') === 'lanes';
    } catch {
      return false;
    }
  }, []);
}

export function MergedSignalsCard({
  gold,
  silver,
  readings,
  goldSummary,
  copy,
  numberLocale,
  balanceLanes,
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
  /** GB-S3 (04 §3 P2): the ?balance=lanes preview flag — true renders the
   * consolidated LANE balance (the engine's four lanes as the drivers,
   * the context line, the measured note) and RETIRES the two gold panels
   * from the preview; absent/undefined renders today's card
   * byte-for-byte. */
  balanceLanes?: boolean | undefined;
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

  /* ---------------------------------------------------------------- *
   * Gold balance consolidation P2 (GB-S3, behind ?balance=lanes —
   * docs/specs/gold-balance-consolidation/03-UX-AND-COPY.md): the
   * consolidated balance. The four LANES drive the SAME BalanceScale
   * through the P1 engine (goldBalance, PR #15) — one chip per lane, its
   * members one tap away in the shared detail panel. The DEFAULT view
   * (flag off) keeps the legacy condition chips and the two gold panels
   * below, byte-for-byte as today (the panels retire from the DEFAULT
   * view only at P5/GB-S6 — never this session).
   * ---------------------------------------------------------------- */
  const gs = s.goldScore;
  const balance = useMemo(() => (balanceLanes ? goldBalance(readings) : null), [balanceLanes, readings]);
  /* GB-S5 (P3, 01 §5.2 + AC-3): the gold Outlook derived from the SAME
   * goldBalance() result that drives the lane drivers and the verdict
   * word above — the strip can no longer contradict the balance
   * (D-GB-6). The range evidence is UNCHANGED: the gold reading's own
   * speed/position, the exact inputs outlookOf reads today. Flag off →
   * undefined → the strip keeps the legacy derivation byte-for-byte
   * (the default view's pin). */
  const goldOutlook =
    balance !== null ? goldOutlookOf(balance, gold.speed, gold.position) : undefined;
  /* Session 3 (G2) reuse: the inflation lane's context phrase — the
   * breakeven tilt reading's own lean (pure selection in the insights
   * package; the card never chooses copy). Absent/stale → no phrase. */
  const tiltLean = useMemo(
    () => (balanceLanes ? breakevenTiltLean(readings.find((r) => r.id === 'breakeven-tilt')) : null),
    [balanceLanes, readings],
  );
  const laneCount = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });

  /** The chip's second line (03 §2): the split contest, the honest "No
   * driver firing" (only when the lane is readable — an absent read is
   * never worded as an absent signal), else the firing count. An
   * unread lane carries no tally; the tray's own word speaks. */
  const laneTallyOf = (lane: GoldBalanceLane): string | undefined => {
    if (lane.split) {
      return interpolate(s.balance.laneSplit, {
        supports: laneCount(lane.supports),
        pressures: laneCount(lane.pressures),
      });
    }
    if (lane.side === 'unread') return undefined;
    if (lane.firing === 0) return s.balance.laneTallyNone;
    return interpolate(s.balance.laneTally, { firing: laneCount(lane.firing), readable: laneCount(lane.readable) });
  };

  /** The member row's evidence phrase (03 §3 item 2): the evaluator's
   * own word for WHY it leaned. B-12 (02 §4.2): the breakeven-5y5y line
   * carries the indicator card's own status word beside the lean
   * phrase, so the member list can never say "elevated" beside a card
   * reading Normal (the evidence vocabulary has no such word — pinned
   * by test). */
  const memberEvidenceOf = (m: GoldBalanceMember): string | null => {
    if (m.evidence === null) return null;
    const word = gs.evidenceWords[m.evidence];
    if (m.id !== 'breakeven-5y5y') return word;
    const reading = byId.get('breakeven-5y5y');
    const statusWord = reading === undefined ? null : copy.status[chipWordKeyOf(reading.status)];
    return statusWord === null ? word : `${word} · ${statusWord}`;
  };

  /** The member's current value, display-formatted (the same helper as
   * today's chips) — null when unread or missing. */
  const memberValueOf = (m: GoldBalanceMember): string | null => {
    const r = byId.get(m.id);
    return r !== undefined && r.value !== null ? formatIndicatorValue(m.id, r.value, numberLocale, copy.units) : null;
  };

  /** The four lane drivers (03 §2–§3): key/label/intro from the copy, the
   * side from the engine, every voter of the lane in table order. */
  const laneDrivers: BalanceDriver[] | null =
    balance === null
      ? null
      : balance.lanes.map((lane) => ({
          key: lane.lane,
          label: gs.laneNames[lane.lane],
          detail: s.balance.laneIntro[lane.lane],
          note: lane.lane === 'inflation' && tiltLean !== null ? gs.tiltWords[tiltLean] : undefined,
          valueText: null,
          state: lane.side,
          split: lane.split,
          tally: laneTallyOf(lane),
          members: lane.members.map((m) => ({
            key: m.id as string,
            label: gs.voterNames[m.id as keyof typeof gs.voterNames],
            impact: m.impact,
            evidenceText: memberEvidenceOf(m),
            valueText: memberValueOf(m),
          })),
        }));

  /* 01 §6: the context line — gold's own 30-day move, shown for context,
   * never counted in the balance or the Outlook (it replaces the
   * model-vs-reality chip under the flag). Hidden when missing. GB-S4:
   * the visual lane view renders it as the VERDICT BLOCK's recessed pill
   * (05 §4.4 — never green or red); the node is only ever built for the
   * lane view, so restyling it here cannot touch the default view. */
  const goldChange30d = byId.get('gold-usd')?.change30d;
  const contextLine =
    balanceLanes && goldChange30d !== undefined && Number.isFinite(goldChange30d) ? (
      <p data-balance-context-line className="bal-context">
        {interpolate(s.balance.contextLine, {
          change: formatChange(goldChange30d, 'pct', numberLocale, copy.units),
        })}
      </p>
    ) : null;

  /* 01 §8.2: the measured note + the backtest link, moved here from the
   * wind panel — visible without a tap, no edge claimed. GB-S4: the
   * visual lane view renders it as the balance's FOOTNOTE (05 §4.1
   * item 8); the node is only ever built for the lane view. */
  const measuredNote = balanceLanes ? (
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
  ) : null;

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
       * trend chart, one anatomy for mobile and desktop.
       * GB-S5 (P3, 01 §5.2): under ?balance=lanes the GOLD leg derives
       * from the consolidated balance (goldOutlookOf — AC-3); silver
       * keeps its own conditions (OI-4). */}
      <VerdictStrip
        gold={gold}
        silver={silver}
        goldOutlook={goldOutlook}
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
       * banner.
       *
       * GB-S3 (?balance=lanes): the LANE drivers replace the condition
       * chips. GB-S4 (P2b, 05-VISUAL-DESIGN-SPEC.md): the lane view now
       * renders the VISUAL REDESIGN (the brass stage, the lane weights,
       * the verdict hero, the tray, the inline ledger) via the `visual`
       * prop — the legacy path passes none of the new props and renders
       * byte-for-byte as before (the snapshot pin). */}
      <BalanceScale
        drivers={laneDrivers ?? balanceDrivers}
        copy={copy}
        numberLocale={numberLocale}
        banner={c12Banner}
        subtitle={laneDrivers !== null ? s.balance.subtitleLanes : undefined}
        contextLine={contextLine}
        measuredNote={measuredNote}
        visual={balanceLanes === true}
      />
      {/* 2026-10-21c owner round: <BalanceScale metal="silver" …> is RETIRED
       * here (the owner: "I dont need balance scale of Silver, remove that
       * section entirely"). Silver keeps its analysis card (VerdictStrip,
       * above) and its footing row (below); only gold carries a balance. */}

      {/* Gold Program S2.1 (owner round 2026-10-31 — "it's placed on the
       * wrong section … it must place here"): the two gold panels mount
       * DIRECTLY UNDER the balance visual («برآیند عوامل مؤثر بر قیمت
       * طلا»), inside this card — the 21-voter tailwind score (the D-5 promotion, Session 6) + the
       * model-vs-reality comparison, the finer cut of the same question
       * the balance answers with its four broad conditions. Two columns
       * beside the balance's max-width column, stacked on mobile.
       *
       * GB-S3 (?balance=lanes): the consolidated balance RETIRES both
       * panels from the PREVIEW (03 §1 — nothing about gold outside the
       * balance); the DEFAULT view keeps them byte-for-byte until the
       * owner-gated flip (P5/GB-S6). */}
      {balanceLanes ? null : (
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
      )}

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
