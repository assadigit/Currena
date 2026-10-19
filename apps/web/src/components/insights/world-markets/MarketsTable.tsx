/**
 * world-markets/MarketsTable — the full table (§6.4 → v3 UI_SPEC §7a):
 * a real <table> with <th scope> at ≥900px, a vertical row list below —
 * the same three numbers either way.
 *
 * v3 UI-27 (2026-10-20, PH6-C): the columns are EXACTLY Market | Today |
 * 3 months | From 52-week high | State | Last close (+date). The Trend
 * column is GONE: defect E-18's basis question is closed by removing the
 * unverifiable label per UI-27/UI-29 — the 3-month NUMBER stays and says
 * what it says, with no second, threshold-less word beside it. The
 * L2-01 state words stay (UI-28, no "Normal" — U-11), the mobile card
 * list has no horizontal scroll (UI-31) and the delayed/stale row tags
 * stay (UI-32).
 *
 * UI-27's ONE header note — "Returns in each market's local currency." —
 * renders HERE, with the table (it moved from the ViewSwitch row, where
 * it sat beside a control the table does not answer).
 */

import type { MarketId, MarketsSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatAsOf } from '../HistoryChart';
import {
  fmtClose,
  signedPct,
  statusToneOf,
  statusWordKeyOf,
  tradingDaysBehind,
} from './shared';

/* ------------------------------------------------------------------ *
 * The full table (§6.4 → §7a): real <table> with <th scope> at ≥900px;
 * a vertical row list below — the same three numbers either way.
 * ------------------------------------------------------------------ */

export function MarketsTable({
  snapshot,
  copy,
  locale,
  numberLocale,
  onOpenRow,
}: {
  snapshot: MarketsSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onOpenRow: (id: MarketId) => void;
}) {
  // One sort only (§6.4): from the 52-week high, worst first — a stable
  // sort keeps the trading-day order inside equal distances.
  const rows = [...snapshot.markets].sort((a, b) => a.fromHigh - b.fromHigh);
  // Step-1 A7: the delayed tag's baseline — the freshest close in the payload.
  const freshestIso = snapshot.markets.reduce((max, m) => (m.asOf > max ? m.asOf : max), snapshot.markets[0]?.asOf ?? '');

  return (
    <>
      {/* UI-27: the table's ONE header note — returns are in each market's
       * own currency, so the three percentages beside each other are not
       * directly comparable (Ibovespa in BRL ≠ the others in USD terms).
       * Visible whenever the table is (both its desktop and mobile forms). */}
      <p className="m-0 mb-2 px-2.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-local-currency-note>
        {copy.markets.localCurrencyNote}
      </p>
      {/* Desktop (≥900px): the real table. */}
      <div className="hidden min-[900px]:block">
        <table className="w-full border-collapse text-[length:var(--type-caption)]">
          <caption className="sr-only">{copy.markets.tableLabel}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.markets.thMarket}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thToday}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.th3m}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thFromHigh}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.markets.thState}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.markets.thClose}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                onClick={() => onOpenRow(m.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  // Keyboard activation mirrors the mobile list's real-button
                  // semantics: Enter/Space open the same detail panel as the
                  // click (Space also stops the page scroll default).
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenRow(m.id);
                  }
                }}
                className="cursor-pointer border-b border-[var(--color-border)]/60 transition-colors last:border-b-0 hover:bg-currena-soft/50"
              >
                <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                  {copy.markets.entries[m.id].name}
                  {/* §6.7: the English index name in small Latin text beside
                   * the Persian name — same rule as the detail panel. */}
                  {locale === 'fa' ? (
                    <span lang="en" dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                      {copy.markets.entries[m.id].latin}
                    </span>
                  ) : null}
                </th>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg1d, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.chg3m, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{signedPct(m.fromHigh, numberLocale, locale)}</bdi>
                </td>
                <td className="px-2 py-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${statusToneOf(m.fromHigh)}`}>
                    {copy.markets[statusWordKeyOf(m.fromHigh)]}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-end tabular-nums">
                  <bdi dir="ltr" className="font-semibold">{fmtClose(m.close, numberLocale)}</bdi>
                  <span className="ms-1 text-[var(--color-text-tertiary)]">({formatAsOf(m.asOf, locale)})</span>
                  {tradingDaysBehind(m.asOf, freshestIso) > 1 ? (
                    <span className="ms-1.5 rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
                      {copy.markets.delayedTag}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile (<900px): the same three numbers as vertical rows. Step-1
       * F1: a one-time label header states which number is which (the
       * desktop table has <th>; the list never did). */}
      <p className="m-0 mb-1 flex items-baseline justify-between px-2.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)] min-[900px]:hidden">
        <span>{copy.markets.thMarket}</span>
        <span dir="ltr" className="inline-flex gap-3">
          <span>{copy.markets.thToday}</span>
          <span>{copy.markets.th3m}</span>
          <span>{copy.markets.thFromHigh}</span>
        </span>
      </p>
      <ul className="m-0 grid list-none gap-1 p-0 min-[900px]:hidden">
        {rows.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onOpenRow(m.id)}
              className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-soft/50"
            >
              <span className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text-primary)]">
                {copy.markets.entries[m.id].name}
                {/* §6.7: the small Latin name rides the mobile row list too
                 * (the table's mobile form — same three numbers, same names). */}
                {locale === 'fa' ? (
                  <span lang="en" dir="ltr" className="ms-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                    {copy.markets.entries[m.id].latin}
                  </span>
                ) : null}
              </span>
              <span className="inline-flex items-baseline gap-3 text-[length:var(--type-caption)] font-semibold tabular-nums">
                <bdi dir="ltr">
                  {signedPct(m.chg1d, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.thToday}</span>
                </bdi>
                <bdi dir="ltr">
                  {signedPct(m.chg3m, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.th3m}</span>
                </bdi>
                <bdi dir="ltr">
                  {signedPct(m.fromHigh, numberLocale, locale)}
                  <span className="sr-only"> {copy.markets.thFromHigh}</span>
                </bdi>
              </span>
              <span className="sr-only">{copy.markets[statusWordKeyOf(m.fromHigh)]}</span>
              {tradingDaysBehind(m.asOf, freshestIso) > 1 ? (
                <span className="rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
                  {copy.markets.delayedTag}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The section
 * ------------------------------------------------------------------ */

