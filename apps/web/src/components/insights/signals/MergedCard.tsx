/**
 * signals/MergedCard — the ONE merged gold-and-silver card, carrying the
 * two per-metal BALANCE visuals (v3 UI_SPEC §9, task PH6-B, 2026-10-20).
 *
 * History: R26 merged the two metals' cards into one (shared conditions
 * listed once + per-metal footing rows); round 23's VerdictStrip (the
 * estimation chips with the per-metal price charts) stayed as the card's
 * answer-first block. The v3 owner decision (UI_SPEC §9) replaces the
 * grouped lists (Supports / Works against / Sitting neutral + the Price
 * footing rows + the silver-only short list) with the balance beam
 * metaphor, honestly about missing data — so this card now renders, per
 * metal (UI-45): heading + factor columns + beam + neutral aside +
 * missing-data line + footnote (signals/Balance.tsx). The silver-only
 * industrial condition lives in silver's balance only (UI-45).
 *
 * The Step-1 audit item C12 interaction note (gold near its decade high
 * while real yields sit high) stays above the balances: the one named
 * combination the separate condition lines cannot say by construction.
 */

import type { IndicatorReading } from '@currena/core';
import type { SignalReading } from '@currena/insights';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { Balance } from './Balance';
import { VerdictStrip } from './verdict';

export function MergedSignalsCard({
  gold,
  silver,
  readings,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;

  return (
    <article
      data-signal-card="merged"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">{s.mergedTitle}</h3>
      </header>

      {/* Round 23 (owner): the stated estimation — one direction chip per
       * metal, derived from the conditions below. Answer first. */}
      <VerdictStrip gold={gold} silver={silver} copy={copy} numberLocale={numberLocale} />

      {/* Step-1 audit item C12: gold near its DECADE high while real yields
       * are also high — the one combination the checklist's separate lines
       * cannot say by construction. Computed from the same readings (no
       * new claim, a named interaction the backtested relationships
       * support: high real yields raise the opportunity cost of holding
       * gold, and buying the decade's peak price while they do has
       * historically been difficult). */}
      {(() => {
        const byId = new Map(readings.map((r) => [r.id as string, r]));
        const goldReading = byId.get('gold-usd');
        const realYield = byId.get('real-yield-10y');
        const goldHigh = goldReading !== undefined && (goldReading.percentile10y ?? 0) >= 0.9;
        const yieldsHigh = realYield !== undefined && (realYield.percentile10y ?? 0) >= 0.8 && realYield.value !== null && realYield.value > 0;
        if (!goldHigh || !yieldsHigh) return null;
        return (
          <p className="m-0 rounded-[var(--radius-sm)] bg-currena-warning/[0.08] px-2.5 py-2 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-gold-yields-warning>
            <bdi>{copy.signals.goldHighYieldsWarning}</bdi>
          </p>
        );
      })()}

      {/* UI-45: gold and silver each get their own balance — the grouped
       * lists and per-metal footing rows are gone; the silver-only
       * industrial condition rides silver's balance alone. */}
      <Balance metal="gold" signal={gold} readings={readings} copy={copy} numberLocale={numberLocale} />
      <Balance metal="silver" signal={silver} readings={readings} copy={copy} numberLocale={numberLocale} />
    </article>
  );
}
