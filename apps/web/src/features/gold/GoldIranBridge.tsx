/**
 * GoldIranBridge — GPE R13 / F3a (2026-11-18): the Iran bridge, Zone F —
 * the Tehran instrument board + the parity line + the documented حباب
 * (docs/specs/gold-page-elevation: s1/11 the spec prep · s6/01 §2a the
 * locked board · s6/02 C2 the four-part grammar · s6/03 zone F the 390
 * rules · s7/01 §8 the four-move interpretation · s8/01 R13).
 *
 * THE DATA PLANE (s6/03 rule 4, binding): SHARED with LedGoldBoard —
 * this component reads the SAME snapshot store the /live-rates board
 * reads (useSnapshotStore → the tgju snapshot App boot already fetched);
 * never a second fetch, never duplicated board markup. The premium is
 * computed at read time from the SAME snapshot's ounce + free-dollar +
 * instrument quotes (no cross-source skew, s1/11 §5).
 *
 * THE GRAMMAR (C2, all four parts render): (1) the formula + the
 * constants table in the expandable method block (the gerami BAND
 * documented — the M1(c) pin re-attempt stood down on the WAF block);
 * (2) the per-instrument decomposition behind one tap (both legs
 * visible — the reader reproduces the arithmetic); (3) the per-row
 * as-of stamps (TGJU's own marketAt, Jalali in fa) + the snapshot
 * timestamp; (4) the divergence taught (the three-numbers-in-one-hour
 * exhibit, dated + attributed — the wording documents, never mocks).
 *
 * THE BOARD (s6/01 §2a): the coin family + geram18/geram24 + mesghal;
 * the ounce row does NOT join — it stays implied in the parity line
 * (the computed toman-per-ounce intermediate, NAMED). 390: stacked
 * rows, the premium the right-aligned secondary value; the toman
 * values render in millions (the 11-glyph raw prints fit, but the
 * readable unit is the million — the parity line carries the full
 * arithmetic).
 *
 * THE INTERPRETATION (s7/01 §8, binding order): the decomposition
 * taught → the premium as market-structure reading → the divergence
 * lesson → the Chain-2 cross-link (closes at the dollar lane anchor;
 * the Zone-B ounce referenced in prose — anchors are never invented,
 * s7/03 rule 3).
 */

import { useMemo, useState } from 'react';
import type { GoldQuote } from '@currena/core';
import { formatDateWords, formatJalaliDate, formatNumber } from '@currena/core';
import { COIN_SPECS, GERAMI_BAND, coinPremium, type CoinPremiumRow } from '@currena/insights';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { isConfirmedStale, useSnapshotStore } from '../../shared/lib/snapshot-store';
import type { TranslationKey } from '../../shared/lib/locale';
import { LANE_TITLE_KEY } from './GoldSeats';

type Translate = ReturnType<typeof useI18n>['t'];
type NumberLocale = 'en-US' | 'fa-IR';

/** The board's row order = COIN_SPECS' own (the coin family, then the
 * per-gram melt rows — mesghal last, its آبشده convention documented). */

function fmtMillions(v: number, numberLocale: NumberLocale, t: Translate): string {
  const m = formatNumber(v / 1e6, numberLocale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return interpolate(t('pd.gold.bridgeMillionToman'), { v: m });
}

/** The per-row as-of stamp: TGJU's own marketAt (Jalali in fa,
 * Gregorian words in en); the snapshot's fetchedAt when the quote
 * carries no timestamp (never a guessed one). */
function rowAsOfText(marketAt: string | undefined, fetchedAt: string | undefined, locale: 'en' | 'fa'): string | null {
  const stamp = marketAt ?? fetchedAt;
  if (stamp === undefined) return null;
  try {
    return locale === 'fa' ? formatJalaliDate(stamp, 'fa-IR') : formatDateWords(stamp, 'en-US');
  } catch {
    return null;
  }
}

/** One board row: the name + as-of (start side) and the price + premium
 * (end side, the premium the muted secondary) — the parity behind one tap. */
function BridgeRow({
  row,
  quote,
  fetchedAt,
  parity,
}: {
  row: CoinPremiumRow;
  quote: GoldQuote | undefined;
  fetchedAt: string | undefined;
  parity: { ounceUsd: number; dollarToman: number; perOunce: number } | null;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const name = t(`gold.${row.id}` as TranslationKey);
  const asOf = rowAsOfText(quote?.marketAt, fetchedAt, locale);
  const priceText =
    quote !== undefined ? formatNumber(quote.price, numberLocale, { maximumFractionDigits: 0 }) : null;
  const pct = formatNumber(Math.abs(row.premiumPct), numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const premiumText = interpolate(t(row.premiumPct >= 0 ? 'pd.gold.bridgePremiumShort' : 'pd.gold.bridgeDiscountShort'), {
    v: `${row.premiumPct >= 0 ? '+' : '−'}${pct}%`,
  });
  const spec = COIN_SPECS.find((s) => s.id === row.id)!;

  return (
    <li className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60" data-bridge-row={row.id}>
      <div className="flex min-w-0 items-baseline justify-between gap-2.5">
        <span className="flex min-w-0 flex-col gap-0">
          <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</span>
          {asOf !== null ? (
            <span className="text-[length:var(--type-caption)] font-normal leading-tight text-[var(--color-text-tertiary)]">{asOf}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0">
          {priceText !== null ? (
            <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-[length:var(--type-label)] font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]">
              {priceText}
            </bdi>
          ) : (
            <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">—</span>
          )}
          <span className={`text-[length:var(--type-caption)] font-semibold leading-tight tabular-nums ${row.premiumPct >= 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-status-alert)]'}`} data-bridge-premium>
              {premiumText}
            </span>
        </span>
      </div>
      {/* C2 rule 2: the decomposition behind one tap — both legs visible. */}
      <button
        type="button"
        className="insights-focusable min-h-[44px] w-fit cursor-pointer self-start rounded-[var(--radius-sm)] px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-currena-blue underline-offset-2 hover:underline"
        aria-expanded={open}
        aria-controls={`gold-bridge-parity-${row.id}`}
        onClick={() => setOpen((v) => !v)}
      >
        {t(open ? 'pd.gold.bridgeRowCollapse' : 'pd.gold.bridgeRowExpand')}
      </button>
      {open ? (
        <div id={`gold-bridge-parity-${row.id}`} className="flex flex-col gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-bridge-parity>
          {parity !== null ? (
            <p className="m-0">
              <bdi>{interpolate(t('pd.gold.bridgeParityOunce'), {
                ounce: formatNumber(parity.ounceUsd, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                dollar: formatNumber(parity.dollarToman, numberLocale, { maximumFractionDigits: 0 }),
                perOunce: formatNumber(parity.perOunce, numberLocale, { maximumFractionDigits: 0 }),
              })}</bdi>
            </p>
          ) : null}
          <p className="m-0">
            <bdi>{interpolate(t('pd.gold.bridgeDecompLine'), {
              pure: formatNumber(spec.pureGrams, numberLocale, { maximumFractionDigits: 4 }),
              total: formatNumber(spec.totalGrams, numberLocale, { maximumFractionDigits: 4 }),
              fineness: formatNumber(spec.fineness, numberLocale, { maximumFractionDigits: 4 }),
              intrinsic: fmtMillions(row.intrinsicToman, numberLocale, t),
              market: fmtMillions(row.marketToman, numberLocale, t),
              premium: fmtMillions(row.premiumToman, numberLocale, t),
              pct: `${row.premiumPct >= 0 ? '+' : '−'}${pct}%`,
            })}</bdi>
          </p>
        </div>
      ) : null}
    </li>
  );
}

/** The method block (C2 rule 1): the formula + the constants table +
 * the gerami band + the آبشده convention + the CBI variant note. */
function BridgeMethod(): React.JSX.Element {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className="insights-focusable min-h-[44px] w-fit cursor-pointer self-start rounded-[var(--radius-sm)] px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-currena-blue underline-offset-2 hover:underline"
        aria-expanded={open}
        aria-controls="gold-bridge-method"
        onClick={() => setOpen((v) => !v)}
      >
        {t(open ? 'pd.gold.bridgeHideMethod' : 'pd.gold.bridgeShowMethod')}
      </button>
      {open ? (
        <div id="gold-bridge-method" className="flex flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2.5 py-2 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-bridge-method>
          <p className="m-0 font-semibold text-[var(--color-text-primary)]">
            <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'}>{t('pd.gold.bridgeFormula')}</bdi>
          </p>
          <p className="m-0">{t('pd.gold.bridgeConstantsTitle')}</p>
          <div className="overflow-x-auto">
            <table className="m-0 w-full border-collapse text-start text-[length:var(--type-caption)]">
              <thead>
                <tr className="text-[var(--color-text-tertiary)]">
                  <th scope="col" className="px-1.5 py-1 text-start font-semibold">{t('pd.gold.bridgeConstantsHeadInstrument')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.bridgeConstantsHeadTotal')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.bridgeConstantsHeadFineness')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.bridgeConstantsHeadPure')}</th>
                </tr>
              </thead>
              <tbody>
                {COIN_SPECS.map((spec) => (
                  <tr key={spec.id} className="border-t border-[var(--color-border)]/50" data-bridge-constant={spec.id}>
                    <th scope="row" className="px-1.5 py-1 text-start font-semibold text-[var(--color-text-primary)]">{t(`gold.${spec.id}` as TranslationKey)}</th>
                    <td className="px-1.5 py-1 text-end tabular-nums">{interpolate(t('pd.gold.bridgeGrams'), { v: formatNumber(spec.totalGrams, 'en-US', { maximumFractionDigits: 4 }) })}</td>
                    <td className="px-1.5 py-1 text-end tabular-nums">{formatNumber(spec.fineness, 'en-US', { maximumFractionDigits: 4 })}</td>
                    <td className="px-1.5 py-1 text-end tabular-nums font-semibold">
                      {interpolate(t('pd.gold.bridgeGrams'), { v: formatNumber(spec.band ? GERAMI_BAND.low : spec.pureGrams, 'en-US', { maximumFractionDigits: 4 }) })}
                      {spec.band !== undefined ? ` – ${interpolate(t('pd.gold.bridgeGrams'), { v: formatNumber(GERAMI_BAND.high, 'en-US', { maximumFractionDigits: 2 }) })}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t('pd.gold.bridgeGeramiBandNote')}</p>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t('pd.gold.bridgeMesghalNote')}</p>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t('pd.gold.bridgeVariantNote')}</p>
        </div>
      ) : null}
    </div>
  );
}

/** The four-move interpretation paragraph (s7/01 §8, binding order). */
function BridgeInterpretation(): React.JSX.Element {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className="insights-focusable min-h-[44px] w-fit cursor-pointer self-start rounded-[var(--radius-sm)] px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-currena-blue underline-offset-2 hover:underline"
        aria-expanded={open}
        aria-controls="gold-bridge-interpretation"
        onClick={() => setOpen((v) => !v)}
      >
        {t(open ? 'pd.gold.bridgeHideInterpretation' : 'pd.gold.bridgeShowInterpretation')}
      </button>
      {open ? (
        <div id="gold-bridge-interpretation" className="flex flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2.5 py-2 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-bridge-interpretation>
          {/* Move 1 — the decomposition taught (Chain 8). */}
          <p className="m-0">{t('pd.gold.bridgeInterp1')}</p>
          {/* Move 2 — the premium as a market-structure reading. */}
          <p className="m-0">{t('pd.gold.bridgeInterp2')}</p>
          {/* Move 3 — the divergence lesson (C2 rule 4). */}
          <p className="m-0">{t('pd.gold.bridgeInterp3')}</p>
          {/* Move 4 — the Chain-2 cross-link: closes at the dollar lane
           * anchor (name-matched, R10's contract); the Zone-B ounce
           * referenced in prose — anchors are never invented. */}
          <p className="m-0">
            <bdi>
              {t('pd.gold.bridgeInterp4Pre')}
              <a href="#lane-dollar" className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                {t(LANE_TITLE_KEY.dollar)}
              </a>
              {t('pd.gold.bridgeInterp4Post')}
            </bdi>
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function GoldIranBridge(): React.JSX.Element | null {
  const { t } = useI18n();
  const state = useSnapshotStore();
  const snapshot = state.tgju.snapshot;
  const gold = useMemo(() => snapshot?.gold ?? [], [snapshot]);

  /* The free-market dollar leg, off the SAME snapshot's rates (the USD
   * entry's rate is units-per-IRR → toman per USD is its inverse). */
  const dollarToman = useMemo(() => {
    const usd = snapshot?.rates.find((r) => r.code === 'USD');
    return usd !== undefined && usd.rate > 0 ? 1 / usd.rate : null;
  }, [snapshot]);

  const premium = useMemo(() => coinPremium(gold, dollarToman), [gold, dollarToman]);
  const quotesById = useMemo(() => new Map(gold.map((q) => [q.id as string, q])), [gold]);
  const stale = isConfirmedStale(state.tgju);

  const snapshotTime = useMemo(() => {
    if (snapshot === null) return null;
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(snapshot.fetchedAt));
  }, [snapshot]);

  // Fail-closed: no snapshot at all → the honest unavailable line (the
  // section still renders its frame; nothing is faked).
  if (snapshot === null) {
    return (
      <section id="gold-zone-f" aria-labelledby="gold-zone-f-title" data-gold-iran-bridge className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-3.5">
        <h3 id="gold-zone-f-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.bridgeTitle')}</h3>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">{t('pd.gold.bridgeUnavailable')}</p>
      </section>
    );
  }

  const parity =
    premium.tomanPerOunce !== null && premium.ounceUsd !== null && premium.dollarToman !== null
      ? { ounceUsd: premium.ounceUsd, dollarToman: premium.dollarToman, perOunce: premium.tomanPerOunce }
      : null;

  return (
    <section
      id="gold-zone-f"
      aria-labelledby="gold-zone-f-title"
      data-gold-iran-bridge
      className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-3.5"
    >
      <header className="flex min-w-0 flex-col gap-0.5">
        <h3 id="gold-zone-f-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {t('pd.gold.bridgeTitle')}
        </h3>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">{t('pd.gold.bridgeSubtitle')}</p>
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {snapshotTime !== null ? <bdi>{interpolate(t('pd.gold.bridgeSnapshotNote'), { time: snapshotTime })}</bdi> : null}
          {stale ? <span data-bridge-stale>{t('pd.gold.bridgeStaleNote')}</span> : null}
        </p>
      </header>

      {/* The board (C2 rules 2–3): the price + the right-aligned premium
       * secondary per row, the per-row as-of, the parity behind a tap. */}
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {COIN_SPECS.map((spec) => {
          const row = premium.rows.find((r) => r.id === spec.id);
          if (row === undefined) {
            // A missing quote renders its honest dashes (per-item
            // degradation — the board's own discipline).
            return (
              <li key={spec.id} className="flex min-w-0 items-baseline justify-between gap-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60" data-bridge-row={spec.id} data-bridge-row-missing>
                <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{t(`gold.${spec.id}` as TranslationKey)}</span>
                <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">—</span>
              </li>
            );
          }
          return <BridgeRow key={spec.id} row={row} quote={quotesById.get(spec.id)} fetchedAt={snapshot.fetchedAt} parity={parity} />;
        })}
      </ul>

      {/* The no-parity honesty line (one leg missing — the quotes above
       * are still TGJU's own; the premium simply does not compute). */}
      {parity === null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-bridge-no-parity>
          {t('pd.gold.bridgeNoParity')}
        </p>
      ) : null}

      <BridgeMethod />
      <BridgeInterpretation />

      {/* C6's TGJU row: "Source: TGJU" + link + the revision caveat. */}
      <footer className="flex flex-col gap-0.5 border-t border-[var(--color-border)]/50 pt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        <p className="m-0">
          <a
            href="https://www.tgju.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
          >
            {t('pd.gold.bridgeSourceNote')}
          </a>
          <span aria-hidden="true"> · </span>
          <span>{t('pd.gold.bridgeRevisionNote')}</span>
        </p>
      </footer>
    </section>
  );
}
