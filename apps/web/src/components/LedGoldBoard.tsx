/**
 * LedGoldBoard — the GOLD & COINS shopfront panel (owner request
 * 2026-09-27): a second physical LED box under the currency board showing
 * TGJU's own طلا و سکه market data, exactly as the owner pasted it from
 * tgju.org:
 *
 *   انس طلا (global troy ounce, USD)  — the row the owner linked
 *   (tgju.org/profile/ons): current / day high / day low + change %.
 *   طلای 18/24 عیار، طلای دست دوم، سکه امامی، سکه بهار آزادی،
 *   نیم سکه، ربع سکه، سکه گرمی — the Tehran market, in TOMAN: TGJU
 *   prints these in Rial, the scraper converts ÷10 (owner request
 *   2026-09-19: 1000 Rial = 100 Toman) — the app's canonical unit.
 *   Values stay VERBATIM otherwise (core GoldQuoteSchema).
 *
 * Same hardware language as LedRateBoard (shared LedParts: recessed
 * dot-matrix modules, ghost/glow/lit layers, hot CURRENT column, 260ms
 * flash-on-change, live clock + status LED, silkscreen labels) and the
 * same ONE-SHARED-COLUMN-GRID machinery (index.css .led-table subgrid).
 *
 * Layout differences forced by the DATA (11-glyph coin values like
 * 231 985 000 Toman — the currency board's modules are 7-glyph):
 *   - below md: the table carries ONE price column (CURRENT) — the day
 *     range cannot fit a phone; it joins from md (768px) up where the
 *     track budget allows it;
 *   - the ounce row rides its own list, then a labeled silkscreen divider
 *     marks the Tehran market section (and its Toman unit);
 *   - per-row caption = the real TGJU change % (ajax `dp`), the slot the
 *     currency board uses for the ISO code.
 *
 * Data rides snapshot.gold (core schemas) end-to-end and degrades to
 * dashes — never guesses — when a symbol is unpublished or the snapshot
 * predates the gold field (legacy KV entries, profile fallback path).
 *
 * A11y (WCAG 2.3.1): identical flash policy to the currency board — one
 * 260ms module surge per value change, rows staggered 0–240ms.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import type { GoldId, GoldQuote, Snapshot } from '@currena/core';
import { LedClock, LedDigits, LedStatus, LedValueCell, formatLedDate } from './led/LedParts';
import { useI18n } from '../lib/locale';
import { useSnapshotStore } from '../lib/snapshot-store';
import type { TranslationKey } from '../lib/locale';

/** Board items in DISPLAY order — the global ounce first, then the Tehran
 *  market in the owner's pasted order. Mirrors TGJU's own طلا و سکه table. */
export const GOLD_BOARD: readonly GoldId[] = [
  'gold-ounce',
  'gold-18k',
  'gold-24k',
  'gold-used',
  'coin-emami',
  'coin-bahar',
  'coin-half',
  'coin-quarter',
  'coin-gram',
];

/** Per-row flash stagger step — 9 rows × 30ms = 0–240ms (WCAG 2.3.1). */
const FLASH_STAGGER_MS = 30;

/** One gold row view model: the item id + its quote (null → dashes). */
export interface GoldBoardItem {
  id: GoldId;
  quote: GoldQuote | null;
}

/** Items for the gold board off one snapshot (pure lookup — no math). */
export function goldBoardItems(snapshot: Snapshot | null): GoldBoardItem[] | null {
  if (!snapshot) return null;
  return GOLD_BOARD.map((id) => ({
    id,
    quote: snapshot.gold?.find((g) => g.id === id) ?? null,
  }));
}

/**
 * Change % caption — the real TGJU `dp`: "+0.05%" / "−0.12%" / "0.00%".
 * Undefined (not published) → an em dash, never a guess.
 */
function formatChangePct(pct: number | undefined): string {
  if (pct === undefined || !Number.isFinite(pct)) return '—';
  if (pct > 0) return `+${pct.toFixed(2)}%`;
  if (pct < 0) return `${pct.toFixed(2)}%`;
  return '0.00%';
}

/* ------------------------------- row -------------------------------- */

interface LedGoldRowProps {
  item: GoldBoardItem;
  index: number;
  currentLabel: string;
  highLabel: string;
  lowLabel: string;
  name: string;
  /** Locale unit word for the aria label (dollar/Toman), already translated. */
  unitLabel: string;
  /** 'USD' caption tag on the ounce row (null on domestic rows). */
  unitTag: string | null;
}

/**
 * One gold row — indicator bulb · name · (current) · day high · day low,
 * logical flow so RTL mirrors the reading order. The NAME gets the same
 * big-bold identity treatment as the currency board (+40–50%, weight 700)
 * with the change % as the small secondary caption. The row SUBGRIDS the
 * shared .led-table tracks (index.css .led-table-gold): below md only the
 * CURRENT column exists (day high/low cells hidden); from md up all three
 * columns align under their header labels exactly like the currency board.
 * Memoized: the clock ticks every second and must not re-render the modules.
 */
const LedGoldRow = memo(function LedGoldRow({
  item,
  index,
  currentLabel,
  highLabel,
  lowLabel,
  name,
  unitLabel,
  unitTag,
}: LedGoldRowProps) {
  const stagger = index * FLASH_STAGGER_MS;
  const quote = item.quote;
  const ok = quote !== null;
  const decimals = quote?.unit === 'USD' ? 2 : 0;
  const caption = quote
    ? formatChangePct(quote.changePct)
    : '—';

  return (
    <li className="led-row border-b border-white/[0.04] py-3 last:border-b-0 sm:py-4">
      {/* Leading cell — amber indicator bulb · name · change% caption, at the
          row's leading edge via padding-inline-start (Persian names, RTL-safe).
          The name is the same big bold identity label as the currency board;
          the caption carries the REAL TGJU change % (and the USD tag on the
          global ounce row). */}
      <div className="flex min-w-0 items-center gap-1.5 ps-1 md:gap-2.5 md:ps-2.5">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[#ffb020]/80 shadow-[0_0_7px_rgba(255,176,32,0.5)] md:h-3 md:w-3"
          aria-hidden="true"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[1.05rem] font-bold text-white/90 sm:text-[1.3rem] lg:text-[1.35rem]">
            {name}
          </p>
          {/* Change % — a dot-matrix LED label (tight pitch); on the ounce row
              the USD unit rides along (its values are dollars, not Toman). */}
          <p className="flex items-center gap-1.5">
            <span
              className="led-label led-label-red-dim text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#ff1e1e]/60 sm:text-[0.58rem]"
              dir="ltr"
            >
              {unitTag ? `${unitTag} ${caption}` : caption}
            </span>
          </p>
        </div>
      </div>

      {/* Current — the PRIMARY module (hot bulbs, full power); 2 decimals on
          the USD ounce, integers on the Toman items. Owner request
          2026-09-19: phones show ONLY this column, so it is the board's
          hero module there too (1.05rem — the 11-glyph Toman runs keep the
          same physical module width the 13-glyph Rial values had). */}
      <LedValueCell
        keyId={item.id}
        stat="cur"
        value={ok ? (quote as GoldQuote).price : Number.NaN}
        ok={ok}
        staggerMs={stagger}
        label={currentLabel}
        unitLabel={unitLabel}
        size="text-[1.05rem] sm:text-[1.2rem] lg:text-[1.3rem]"
        emphasis="primary"
        decimals={decimals}
      />

      {/* Day high / day low — TGJU stats, secondary modules at 75% power;
          hidden below md (the 11-glyph coin values leave no room for three
          columns on phones — the divider/footnote keeps the unit honest). */}
      <LedValueCell
        keyId={item.id}
        stat="high"
        value={ok ? (quote as GoldQuote).dayHigh ?? Number.NaN : Number.NaN}
        ok={ok}
        staggerMs={stagger}
        label={highLabel}
        unitLabel={unitLabel}
        size="md:text-[0.8rem] lg:text-[1.05rem]"
        emphasis="secondary"
        decimals={decimals}
        wrapperClass="hidden text-right md:block"
      />
      <LedValueCell
        keyId={item.id}
        stat="low"
        value={ok ? (quote as GoldQuote).dayLow ?? Number.NaN : Number.NaN}
        ok={ok}
        staggerMs={stagger}
        label={lowLabel}
        unitLabel={unitLabel}
        size="md:text-[0.8rem] lg:text-[1.05rem]"
        emphasis="secondary"
        decimals={decimals}
        wrapperClass="hidden text-right md:block"
      />
    </li>
  );
});

/* ------------------------------- board ------------------------------ */

export function LedGoldBoard() {
  const { t, locale } = useI18n();
  const store = useSnapshotStore();
  const state = store.tgju;
  const snapshot = state.snapshot;

  // Live clock — ticks every second; the board feels alive between updates.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(() => goldBoardItems(snapshot), [snapshot]);

  const status: 'live' | 'cached' | 'offline' = !store.online
    ? 'offline'
    : state.stale || state.degraded
      ? 'cached'
      : 'live';

  const currentLabel = t('liveRates.boardCurrent');
  const highLabel = t('liveRates.boardHigh');
  const lowLabel = t('liveRates.boardLow');
  const usdUnit = t('liveRates.goldUnitUsd');
  const tomanUnit = t('liveRates.goldUnitToman');

  const renderItem = (item: GoldBoardItem, index: number): React.JSX.Element => (
    <LedGoldRow
      key={item.id}
      item={item}
      index={index}
      currentLabel={currentLabel}
      highLabel={highLabel}
      lowLabel={lowLabel}
      name={t(`gold.${item.id}` as TranslationKey)}
      unitLabel={item.quote?.unit === 'USD' ? usdUnit : tomanUnit}
      unitTag={item.id === 'gold-ounce' ? t('liveRates.goldUnitUsd') : null}
    />
  );

  // The global ounce rides its own list (international market, USD); the
  // Tehran market rows follow behind a labeled silkscreen divider.
  const ounceItem = items?.[0] ?? null;
  const domesticItems = items ? items.slice(1) : GOLD_BOARD.slice(1).map((id) => ({ id, quote: null }));

  return (
    <section
      className="led-board overflow-hidden px-3 py-3.5 sm:px-6 sm:py-5"
      role="region"
      aria-label={t('liveRates.goldAriaLabel')}
    >
      {/* Header strip — live clock + date module, the panel title (a
          dot-matrix wordmark slot) and the status LED. Persian titles drop
          the Latin uppercase/letter-spacing (it breaks Arabic-script
          joining); the label fill itself is script-agnostic. */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#ff1e1e]/15 pb-3">
        <LedClock now={now} />
        <LedDigits value={formatLedDate(now, locale)} className="text-[0.8rem] sm:text-[0.95rem]" />
        <div className="flex items-center gap-3">
          <span
            className={`led-label led-label-white-dim text-[0.6rem] font-extrabold text-[#ff1e1e]/55 ${
              locale === 'en' ? 'uppercase tracking-[0.3em]' : ''
            }`}
          >
            {t('liveRates.goldBoardTitle')}
          </span>
          <LedStatus
            state={status}
            label={
              status === 'live'
                ? t('liveRates.boardLive')
                : status === 'cached'
                  ? t('liveRates.boardCached')
                  : t('liveRates.boardOffline')
            }
          />
        </div>
      </header>

      {/* THE shared column grid — .led-table-gold owns the tracks (ONE price
          column below md, three from md up); the header row, both lists and
          every value row subgrid it, so each label sits directly above its
          own column of numbers at any digit size. Column headers are the
          same silkscreen labels as the currency board (CURRENT / DAY HIGH /
          DAY LOW — hidden below md together with their columns). */}
      <div className="led-table led-table-gold">
        <div className="led-row pb-2.5">
          <p className="led-label led-label-white-dim ps-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35 md:ps-2.5">
            {t('liveRates.goldItem')}
          </p>
          <p className="led-label led-label-red whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/80 md:pr-[9px]">
            {currentLabel}
          </p>
          <p className="led-label led-label-red-dim hidden whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55 md:block md:pr-[9px]">
            {highLabel}
          </p>
          <p className="led-label led-label-red-dim hidden whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55 md:block md:pr-[9px]">
            {lowLabel}
          </p>
        </div>

        {/* Global market — the ounce row (USD), alone in its list. */}
        <ul className="led-table-body">{ounceItem ? renderItem(ounceItem, 0) : null}</ul>

        {/* Silkscreen section divider — the Tehran market + its Toman unit
            (spans all tracks; intrinsic width stays far below the module
            columns, so it can never bloat the auto tracks). */}
        <div className="led-gold-divider ps-1 md:ps-2.5">
          <span
            className={`led-label led-label-white-dim text-[0.6rem] font-bold text-white/35 ${
              locale === 'en' ? 'uppercase tracking-[0.16em]' : ''
            }`}
          >
            {t('liveRates.goldDomestic')}
          </span>
        </div>

        {/* Tehran market — gold grams and coins, Toman quotes. */}
        <ul className="led-table-body">{domesticItems.map((item, i) => renderItem(item, i + 1))}</ul>
      </div>

      {/* Footnote — the honesty line: units and REAL TGJU stats. */}
      <footer className="mt-3 border-t border-white/[0.06] pt-2.5">
        <p className="text-[0.62rem] font-medium text-white/35">{t('liveRates.goldFootnote')}</p>
      </footer>
    </section>
  );
}
