/**
 * signals/Balance — the v3 gold/silver balance visual (UI_SPEC §9,
 * UI-39..UI-45a, task PH6-B, 2026-10-20), one per metal (UI-45).
 *
 * Structure, top to bottom per UI-39 (mobile stacks the beam ABOVE the
 * columns, UI-43 — the order utilities swap at sm):
 *   1. heading with the metal name + "N of M conditions support {metal}"
 *      (M = scored conditions with readable data, N = supporting)
 *   2. two factor columns — supporting (green marker) vs pressuring (red
 *      marker) — each row: short name, current value with unit, one-line
 *      meaning; the columns mirror in RTL (flex/grid order flips)
 *   3. the BEAM: plain SVG — a horizontal beam over a fulcrum, red end on
 *      the pressuring side, green end on the supporting side, one
 *      equal-sized token per SCORED READABLE condition resting on its end;
 *      tilt = (supporting − pressuring) / readable scored conditions,
 *      scaled to a maximum of 12 degrees, as a CSS rotate that eases on
 *      load/change only and never animates under prefers-reduced-motion
 *      (UI-42); the ends' words sit in the legend row so colour is never
 *      alone, and the graphic carries a full text alternative (UI-45a)
 *   4. a neutral group aside — grey tokens, never on the beam — with the
 *      unreadable conditions' dashed tokens next to it
 *   5. the missing-data line: "R of M conditions readable." plus every
 *      unreadable condition named ("…: can't tell right now."), never
 *      silently counted (UI-40)
 *   6. the footnote (≥12px, contrast-safe)
 *
 * Honesty (UI-40): fewer than 3 readable scored conditions keeps the beam
 * LEVEL with the "Not enough readable conditions to weigh" line; the
 * readable count is always stated. Editorial look (UI-41): neutral
 * surface, state colours only on the markers and the beam ends, hairline
 * rules between rows, the spacing scale, tabular figures, small uppercase
 * column headings, no decorative icons, no gradients or shadows.
 */

import type { ReactElement } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import type { SignalReading } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatIndicatorValue } from '../config';
import { balanceOf, type BalanceItem, type BalanceTally } from './balance';
import { isConditionReadable } from './readable';
import { ConditionIcon } from './icons';

/** The values line for one condition row: each driver's current value
 * with unit, LTR-embedded ("0.42 · −0.98"); null when nothing readable. */
function conditionValues(
  inputs: readonly IndicatorId[],
  byId: ReadonlyMap<string, IndicatorReading>,
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string | null {
  const parts: string[] = [];
  for (const id of inputs) {
    const r = byId.get(id);
    if (r === undefined || r.value === null) continue;
    parts.push(formatIndicatorValue(id, r.value, numberLocale, copy.units));
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** One factor row (UI-39.2): marker icon (shape + column position carry
 * the state, the word rides along for screen readers), short name, current
 * value with unit, one-line meaning. Hairline rule between rows (UI-41). */
function FactorRow({
  item,
  tone,
  readings,
  copy,
  numberLocale,
}: {
  item: BalanceItem;
  tone: 'supportive' | 'against' | 'neutral';
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const entry = s.conditions[item.key];
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const values = conditionValues(item.inputs, byId, copy, numberLocale);
  const toneClass =
    tone === 'supportive'
      ? 'text-[var(--color-status-normal)]'
      : tone === 'against'
        ? 'text-[var(--color-status-alert)]'
        : 'text-[var(--color-status-stale)]';
  return (
    <li className="flex flex-col gap-0.5 py-2" data-balance-row={item.key}>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className={`inline-flex shrink-0 items-center ${toneClass}`}>
          <ConditionIcon state={tone} />
        </span>
        <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {entry.name}
        </span>
        <span className="sr-only">{s.conditionStateShort[tone]}</span>
        {values !== null ? (
          <bdi dir="ltr" className="ms-auto text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            {values}
          </bdi>
        ) : null}
      </span>
      <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {entry.how}
      </span>
    </li>
  );
}

/**
 * The beam (UI-39.3). Plain SVG, drawn for the active direction — LTR
 * puts the supporting (green) end on the left, RTL on the right, so the
 * tilt direction reads correctly in both. All tokens are equal-sized; a
 * positive tilt (supporting side heavier) dips that side. The group's
 * data-tilt carries the degrees for the acceptance tests (U-09/U-09a).
 */
function BalanceBeam({
  tally,
  metal,
  rtl,
  copy,
  numberLocale,
}: {
  tally: BalanceTally;
  metal: 'gold' | 'silver';
  rtl: boolean;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const fmt = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const aria = interpolate(s.beamAria, {
    metal: s.metals[metal],
    supporting: fmt(tally.supportingCount),
    pressuring: fmt(tally.pressuringCount),
    neutral: fmt(tally.neutralCount),
    unreadable: fmt(tally.unreadableCount),
    total: fmt(tally.totalCount),
  });
  // LTR: supporting end left, so supporting-heavier dips the LEFT end —
  // CSS rotate(−tilt). RTL mirrors the drawing and the rotation sign.
  const angle = rtl ? tally.tilt : -tally.tilt;
  // One equal-sized token per scored readable condition, resting near its
  // end of the beam (never the neutral or unreadable ones — UI-39.3/4).
  const tokenRow = (count: number, side: 'supporting' | 'pressuring'): ReactElement[] => {
    const center = side === 'supporting' ? (rtl ? 360 : 120) : rtl ? 120 : 360;
    const pitch = 16;
    const fill = side === 'supporting' ? 'fill-[var(--color-status-normal)]' : 'fill-[var(--color-status-alert)]';
    return Array.from({ length: count }, (_, i) => (
      <circle
        key={`${side}-${i}`}
        cx={center - ((count - 1) * pitch) / 2 + i * pitch}
        cy={38.5}
        r={7}
        className={fill}
        data-token={side}
      />
    ));
  };
  return (
    <svg
      viewBox="0 0 480 108"
      role="img"
      aria-label={aria}
      className="mx-auto h-auto w-full max-w-[480px]"
      data-balance-svg
    >
      {/* Fulcrum + ground (neutral, ≥3:1 non-text contrast in both themes). */}
      <path d="M240 49 L226 94 L254 94 Z" className="fill-[var(--color-text-tertiary)]" />
      <rect x={196} y={94} width={88} height={3} rx={1.5} className="fill-[var(--color-text-tertiary)]" />
      {/* The rotating beam + its tokens: a short ease on load/change only,
       * none under prefers-reduced-motion (UI-42). */}
      <g
        data-balance-beam
        data-tilt={String(Math.round(tally.tilt * 10) / 10)}
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: '240px 49.5px' }}
        className="transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:duration-0"
      >
        <rect x={60} y={46} width={360} height={7} rx={3.5} className="fill-[var(--color-text-tertiary)]" />
        {/* Beam ends: green on the supporting side, red on the pressuring
         * side (mirrored in RTL — the words ride in the legend row below). */}
        <rect
          x={rtl ? 372 : 60}
          y={46}
          width={48}
          height={7}
          rx={3.5}
          className="fill-[var(--color-status-normal)]"
        />
        <rect
          x={rtl ? 60 : 372}
          y={46}
          width={48}
          height={7}
          rx={3.5}
          className="fill-[var(--color-status-alert)]"
        />
        {tokenRow(tally.supportingCount, 'supporting')}
        {tokenRow(tally.pressuringCount, 'pressuring')}
      </g>
    </svg>
  );
}

export function Balance({
  metal,
  signal,
  readings,
  copy,
  numberLocale,
}: {
  metal: 'gold' | 'silver';
  signal: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const rtl = numberLocale === 'fa-IR';
  const fmt = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const tally = balanceOf(signal, (key) => isConditionReadable(key, byId, signal.priceId));

  // UI-39.5: "R of M conditions readable." + every unreadable condition
  // named with the honest can't-tell phrase (UI-40: never silent).
  const missingLine =
    interpolate(s.readableLine, { r: fmt(tally.readableCount), total: fmt(tally.totalCount) }) +
    (tally.unreadable.length > 0
      ? ` ${tally.unreadable.map((u) => interpolate(s.unreadableName, { name: s.conditions[u.key].name })).join(' ')}`
      : '');

  const column = (items: readonly BalanceItem[], tone: 'supportive' | 'against', heading: string) => (
    <div data-balance-col={tone === 'supportive' ? 'supporting' : 'pressuring'} className="flex min-w-0 flex-col gap-2">
      <h5 className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {heading}
      </h5>
      {items.length > 0 ? (
        <ul className="m-0 flex list-none flex-col divide-y divide-[var(--color-border)] p-0">
          {items.map((item) => (
            <FactorRow key={item.key} item={item} tone={tone} readings={readings} copy={copy} numberLocale={numberLocale} />
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{s.colEmpty}</p>
      )}
    </div>
  );

  return (
    <section
      id={`insights-conditions-${metal}`}
      data-balance={metal}
      aria-labelledby={`insights-conditions-${metal}-title`}
      className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4"
    >
      {/* UI-39.1: the heading with the metal name + the one plain line. */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 id={`insights-conditions-${metal}-title`} className="type-question m-0 text-[var(--color-text-primary)]">
          {s.metals[metal]}
        </h4>
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]" data-balance-summary-line>
          {interpolate(s.balanceSummary, {
            n: fmt(tally.supportingCount),
            m: fmt(tally.readableCount),
            metal: s.metals[metal],
          })}
        </p>
      </header>

      {/* UI-39.3: the beam. UI-43: on mobile it sits ABOVE the stacked
       * columns (the order utilities swap at sm); the legend row words the
       * two ends so the green/red is never alone. */}
      <div className="order-2 flex flex-col gap-2 sm:order-3" data-balance-beam-block>
        <BalanceBeam tally={tally} metal={metal} rtl={rtl} copy={copy} numberLocale={numberLocale} />
        <div className="flex items-baseline justify-between gap-2 px-1" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            <span className="inline-block size-2.5 rounded-full bg-[var(--color-status-normal)]" />
            {s.colSupporting}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            <span className="inline-block size-2.5 rounded-full bg-[var(--color-status-alert)]" />
            {s.colPressuring}
          </span>
        </div>
        {tally.level ? (
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]" data-balance-level>
            {s.notEnoughReadable}
          </p>
        ) : null}
      </div>

      {/* UI-39.2: the two factor columns (mirrored in RTL by flex order).
       * UI-39's desktop order puts the columns ABOVE the beam (structure
       * item 2 before item 3); UI-43's mobile rule flips the pair — the
       * beam above the stacked columns — hence the order swap at sm. */}
      <div className="order-3 grid grid-cols-1 gap-3 sm:order-2 sm:grid-cols-2 sm:gap-4" data-balance-columns>
        {column(tally.supporting, 'supportive', s.colSupporting)}
        {column(tally.pressuring, 'against', s.colPressuring)}
      </div>

      {/* UI-39.4: the neutral group aside — grey tokens, never on the beam —
       * with the unreadable conditions' dashed tokens next to it (UI-39.5). */}
      {tally.neutralCount > 0 || tally.unreadableCount > 0 ? (
        <div className="order-4 flex flex-col gap-2" data-balance-aside>
          <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: tally.neutralCount }, (_, i) => (
              <span
                key={`neutral-${i}`}
                className="inline-block size-3 rounded-full bg-[var(--color-status-stale)]"
                data-token-neutral
              />
            ))}
            {Array.from({ length: tally.unreadableCount }, (_, i) => (
              <span
                key={`unreadable-${i}`}
                className="inline-block size-3 rounded-full border border-dashed border-[var(--color-status-stale)] bg-transparent"
                data-token-unreadable
              />
            ))}
          </div>
          {tally.neutral.length > 0 ? (
            <>
              <h5 className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {s.colNeutral}
              </h5>
              <ul className="m-0 flex list-none flex-col divide-y divide-[var(--color-border)] p-0">
                {tally.neutral.map((item) => (
                  <FactorRow key={item.key} item={item} tone="neutral" readings={readings} copy={copy} numberLocale={numberLocale} />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {/* UI-39.5: the missing-data line — the readable count is always
       * stated; each unreadable condition is named. */}
      <p className="order-5 m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]" data-balance-missing>
        {missingLine}
      </p>

      {/* UI-39.6: the footnote — 12.5px, ≥4.5:1 on the card surface. */}
      <p className="order-6 m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]" data-balance-footnote>
        {s.balanceFootnote}
      </p>
    </section>
  );
}
