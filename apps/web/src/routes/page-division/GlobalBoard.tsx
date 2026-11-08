/**
 * GlobalBoard — the D-21 10-tile verdict board + the D-23 region-chips row
 * + the D-24 narrator line (page-division S3, 2026-11-08 — spec §4).
 *
 * STRICTLY ONE SCREEN (D-11): 5×2 tile grid on desktop, a compact 1-col
 * stack on mobile; every tile shows a VERDICT or an explicit unread state
 * (fail-closed, Agent Rule 5); no detail cards, no history charts, no
 * scrolling — everything deep is one click away (each tile links to the
 * page holding its detail cards, spec §4's link column).
 *
 * The visual language is the house one (D-48): colour + label verdicts
 * (the four-step meters wear the shared .verdict-meter styles from
 * index.css; the tone classes mirror config/bands.ts's WORD_TONE_CLASS),
 * honest "Cannot read yet" states, tabular numbers in bdi islands so RTL
 * never scatters them. Copy arrives via the app dictionary's pd.global.*
 * keys; the verdict WORDS are pinned byte-for-byte to the insights copy
 * corpus by global-copy-pin.test.ts.
 */

import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import type { InsightsLoadStateLike } from './global-page-states';
import {
  fxChipDot,
  marketsChipDot,
  type ChipDotState,
  type GlobalDedollarTile,
  type GlobalFxTile,
  type GlobalGaugeTile,
  type GlobalGoldTile,
  type GlobalMarketsTile,
  type GlobalRibbonEntry,
} from './global-tiles';
import { DESTINATIONS } from './destinations';
import type { NarrativeDoc } from '../../lib/narrative';

/* ------------------------------------------------------------------ *
 * Local mirrors of the shared verdict vocabulary (cited, never forked):
 * the four-step meter's CSS classes are index.css's own (round 44), and
 * the tone classes mirror config/bands.ts's WORD_TONE_CLASS — copied
 * rather than imported so the Global chunk stays lean (the config module
 * chain pulls the whole insights corpus). global-copy-pin.test.ts pins
 * the WORDS; these are the inks the words wear.
 * ------------------------------------------------------------------ */

const STEP_TONE: Record<number, string> = {
  0: '',
  1: 'text-[var(--color-status-normal)]',
  2: 'text-[var(--color-status-watch)]',
  3: 'text-[var(--color-status-stressed)]',
  4: 'text-[var(--color-status-alert)]',
};

/** The four-step segmented meter — the shared .verdict-meter anatomy
 *  (index.css round 44: data-step paints the filled segments as ONE hue
 *  graded pale→full toward the current step). */
function TileMeter({ step, ariaLabel }: { step: number; ariaLabel: string }): React.JSX.Element {
  return (
    <span className="verdict-meter verdict-meter-sm" data-step={step} role="img" aria-label={ariaLabel} title={ariaLabel}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''} motion-safe:transition-colors motion-safe:duration-300`} />
      ))}
    </span>
  );
}

/** The shared tile face: a real link (house pattern — REAL hrefs, the
 *  path-router's navigate() takes over in-app), the tile title, and the
 *  verdict block. min-h-[44px] keeps every tile a touch target. */
function TileLink({
  href,
  title,
  children,
  'data-tile': dataTile,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
  'data-tile': string;
}): React.JSX.Element {
  return (
    <a
      href={href}
      data-tile={dataTile}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className="insights-focusable flex min-h-[44px] cursor-pointer flex-col justify-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 no-underline ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)] sm:p-3.5"
    >
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {title}
      </h3>
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ *
 * Tile ① — Gold Balance (D-21): compact 7-state outlook + the
 * 37-voter meter's for/against counts. Links to /gold.
 * ------------------------------------------------------------------ */

const OUTLOOK_WORD_KEY = {
  'strong-bullish': 'pd.global.outlookStrongBullish',
  bullish: 'pd.global.outlookBullish',
  neutral: 'pd.global.outlookNeutral',
  'range-bound': 'pd.global.outlookRangeBound',
  bearish: 'pd.global.outlookBearish',
  'strong-bearish': 'pd.global.outlookStrongBearish',
  mixed: 'pd.global.outlookMixed',
} as const;

/** The outlook word's ink: the bullish family wears the normal (green)
 *  ink, the bearish family the alert red, the calm states the neutral —
 *  verdict.tsx's own verdictTone mapping, restated for the lean chunk. */
const OUTLOOK_TONE: Record<string, string> = {
  'strong-bullish': 'text-[var(--color-status-normal)]',
  bullish: 'text-[var(--color-status-normal)]',
  'strong-bearish': 'text-[var(--color-status-alert)]',
  bearish: 'text-[var(--color-status-alert)]',
};

export function GoldBalanceTile({ tile }: { tile: GlobalGoldTile }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const counts = tile.balance.counts;
  return (
    <TileLink href="/gold" title={t('pd.global.tileGoldBalance')} data-tile="gold-balance">
      <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="sr-only">{t('pd.global.goldOutlookLabel')}: </span>
        {tile.outlook !== null ? (
          <span className={`type-verdict text-[1.15rem] font-bold leading-tight ${OUTLOOK_TONE[tile.outlook] ?? ''}`}>
            {t(OUTLOOK_WORD_KEY[tile.outlook])}
          </span>
        ) : (
          <span className="type-verdict text-[1.15rem] font-bold leading-tight text-[var(--color-text-tertiary)]">
            {t('pd.global.cannotRead')}
          </span>
        )}
      </p>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        <bdi>
          {interpolate(t('pd.global.goldCounts'), { for: num(counts.for), against: num(counts.against) })}
          {counts.unread > 0 ? interpolate(t('pd.global.goldUnread'), { n: num(counts.unread) }) : ''}
        </bdi>
      </p>
    </TileLink>
  );
}

/* ------------------------------------------------------------------ *
 * Tiles ②–⑥ — the five thematic gauge verdicts (D-21). Each links to
 * the page holding its detail cards (BD-S3b: the US-framed gauges →
 * /usa where D-30's verdict strip tops the page; Dollar Strength →
 * /currencies, its detail cards' home by D-32).
 * ------------------------------------------------------------------ */

const GAUGE_TITLE_KEY = {
  'borrowing-costs': 'pd.global.tileBorrowingCosts',
  'prices-heat': 'pd.global.tileInflationHeat',
  'market-stress': 'pd.global.tileMarketStress',
  'dollar-strength': 'pd.global.tileDollarStrength',
  'growth-health': 'pd.global.tileGrowthHealth',
} as const;

const GAUGE_HREF = {
  'borrowing-costs': '/usa',
  'prices-heat': '/usa',
  'market-stress': '/usa',
  'dollar-strength': '/currencies',
  'growth-health': '/usa',
} as const;

const GAUGE_WORD_KEY = {
  relaxed: 'pd.global.labelRelaxed',
  cautious: 'pd.global.labelCautious',
  stressed: 'pd.global.labelStressed',
  alarmed: 'pd.global.labelAlarmed',
} as const;

export function GaugeTile({ tile }: { tile: GlobalGaugeTile }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const { reading, word } = tile;
  return (
    <TileLink href={GAUGE_HREF[tile.gauge]} title={t(GAUGE_TITLE_KEY[tile.gauge])} data-tile={`gauge-${tile.gauge}`}>
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {word !== null ? (
          <>
            <span className={`type-verdict text-[1.15rem] font-bold leading-tight ${STEP_TONE[reading.step] ?? ''}`}>
              {t(GAUGE_WORD_KEY[word])}
            </span>
            <TileMeter step={reading.step} ariaLabel={`${t(GAUGE_TITLE_KEY[tile.gauge])}: ${t(GAUGE_WORD_KEY[word])}`} />
          </>
        ) : (
          <span className="type-verdict text-[1.15rem] font-bold leading-tight text-[var(--color-text-tertiary)]">
            {t('pd.global.cannotRead')}
          </span>
        )}
      </p>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        <bdi>
          {reading.step === 0
            ? t('pd.global.gaugeWhyUnread')
            : reading.warningCount > 0
              ? interpolate(t('pd.global.gaugeWhySome'), { warnings: num(reading.warningCount), voters: num(reading.votingCount) })
              : interpolate(t('pd.global.gaugeWhyNone'), { voters: num(reading.votingCount) })}
        </bdi>
      </p>
    </TileLink>
  );
}

/* ------------------------------------------------------------------ *
 * Tile ⑦ — the FX Lights (D-21): unusual/attention status + count of
 * active rules (R1–R7). Links to /currencies (D-41's rule-lights hero).
 * ------------------------------------------------------------------ */

const FX_SIGNAL_KEY = {
  normal: 'pd.global.fxSignalNormal',
  attention: 'pd.global.fxSignalAttention',
  unusual: 'pd.global.fxSignalUnusual',
} as const;

const FX_SIGNAL_TONE = {
  normal: 'text-[var(--color-status-normal)]',
  attention: 'text-[var(--color-status-watch)]',
  unusual: 'text-[var(--color-status-alert)]',
} as const;

export function FxLightsTile({ tile }: { tile: GlobalFxTile }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  return (
    <TileLink href="/currencies" title={t('pd.global.tileFxLights')} data-tile="fx-lights">
      <p className="m-0">
        <span className={`type-verdict text-[1.15rem] font-bold leading-tight ${FX_SIGNAL_TONE[tile.signal]}`}>
          {t(FX_SIGNAL_KEY[tile.signal])}
        </span>
      </p>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        <bdi>
          {tile.activeRules > 0
            ? interpolate(t('pd.global.fxActive'), { n: num(tile.activeRules), total: num(tile.totalRules) })
            : t('pd.global.fxNoneActive')}
        </bdi>
      </p>
    </TileLink>
  );
}

/* ------------------------------------------------------------------ *
 * Tile ⑧ — the World Markets status (D-21): the section verdict word +
 * the stressed/correction/bear counts over the 16 indexes. Links to
 * /world-markets.
 * ------------------------------------------------------------------ */

const MARKETS_WORD_KEY = { 1: 'pd.global.marketsBullish', 2: 'pd.global.marketsMixed', 3: 'pd.global.marketsMixed', 4: 'pd.global.marketsBearish' } as const;

const MARKETS_TONE: Record<number, string> = {
  1: 'text-[var(--color-return-up)]',
  2: 'text-[var(--color-text-primary)]',
  3: 'text-[var(--color-status-watch)]',
  4: 'text-[var(--color-status-alert)]',
};

export function WorldMarketsTile({ tile }: { tile: GlobalMarketsTile }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  return (
    <TileLink href="/world-markets" title={t('pd.global.tileWorldMarkets')} data-tile="world-markets">
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={`type-verdict text-[1.15rem] font-bold leading-tight ${MARKETS_TONE[tile.step] ?? ''}`}>
          {t(MARKETS_WORD_KEY[tile.step])}
        </span>
        <TileMeter step={tile.step === 1 ? 1 : tile.step === 4 ? 4 : 2} ariaLabel={t(MARKETS_WORD_KEY[tile.step])} />
      </p>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        <bdi>
          {tile.total > 0
            ? interpolate(t('pd.global.marketsInCorrection'), { n: num(tile.inCorrection), total: num(tile.total) })
            : t('pd.global.cannotRead')}
          {tile.inBear > 0 ? interpolate(t('pd.global.marketsInBear'), { n: num(tile.inBear) }) : ''}
        </bdi>
      </p>
    </TileLink>
  );
}

/* ------------------------------------------------------------------ *
 * Tile ⑨ — the prices ribbon (D-22): gold · brent · BTC, live hourly
 * (the serve-time merge's values + the 7-day change the merged reading
 * carries — a day change is not part of the projection contract; the
 * honest label rides with the number). Each asset links to its own page
 * (/gold for gold; /commodities for brent and BTC — spec §4).
 * ------------------------------------------------------------------ */

const RIBBON_LABEL_KEY = {
  'gold-usd': 'pd.global.ribbonGold',
  brent: 'pd.global.ribbonBrent',
  'btc-usd': 'pd.global.ribbonBtc',
} as const;

const RIBBON_HREF = {
  'gold-usd': '/gold',
  brent: '/commodities',
  'btc-usd': '/commodities',
} as const;

/** The ribbon asset's decimals — the DISPLAY config's own per-id values
 *  (gold 0 · brent 2 · btc 0), restated here so the lean chunk does not
 *  pull the config module chain. */
const RIBBON_DECIMALS: Record<string, number> = { 'gold-usd': 0, brent: 2, 'btc-usd': 0 };

/** A signed percent, the formatChangeParts sign convention (config/display:
 * '+' / '−' (U+2212) prefixes over the abs value, rendered inside a
 * dir="ltr" island so RTL never scatters it). */
function signedPct(change: number, numberLocale: 'en-US' | 'fa-IR', decimals = 1): string {
  const num = formatNumber(Math.abs(change), numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${num}%`;
}

function RibbonAsset({ entry }: { entry: GlobalRibbonEntry }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const reading: IndicatorReading | undefined = entry.reading;
  const unavailable = reading === undefined || reading.value === null;
  const decimals = RIBBON_DECIMALS[entry.id] ?? 2;
  const value =
    reading !== null && reading !== undefined && reading.value !== null
      ? formatNumber(reading.value, numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : null;
  const change = reading?.change7d;
  const changeTone =
    change === undefined ? '' : change > 0 ? 'text-[var(--color-return-up)]' : change < 0 ? 'text-[var(--color-return-down)]' : 'text-[var(--color-text-secondary)]';
  const unit = t('pd.global.unitUsd');
  return (
    <a
      href={RIBBON_HREF[entry.id]}
      data-ribbon-asset={entry.id}
      onClick={(e) => {
        e.preventDefault();
        navigate(RIBBON_HREF[entry.id]);
      }}
      className="insights-focusable flex min-h-[44px] flex-1 cursor-pointer flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] bg-currena-soft/50 px-2.5 py-1.5 no-underline ring-1 ring-[var(--color-border)]/60 transition-colors hover:bg-currena-soft"
    >
      <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {t(RIBBON_LABEL_KEY[entry.id])}
      </span>
      {unavailable ? (
        <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.global.ribbonUnavailable')}</span>
      ) : (
        <span className="flex flex-wrap items-baseline gap-x-1">
          <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="type-number text-[1.05rem] font-bold leading-none tabular-nums text-[var(--color-text-primary)]">
            {locale === 'fa' ? `${value} ${unit}` : `${unit}${value}`}
          </bdi>
          {change !== undefined ? (
            <bdi dir="ltr" className={`text-[length:var(--type-caption)] font-bold leading-none tabular-nums ${changeTone}`}>
              {signedPct(change, numberLocale)}
              <span className="sr-only"> {interpolate(t('pd.global.changeOver'), { days: 7 })}</span>
            </bdi>
          ) : null}
        </span>
      )}
    </a>
  );
}

export function PricesRibbonTile({ ribbon }: { ribbon: readonly GlobalRibbonEntry[] }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div
      data-tile="prices-ribbon"
      className="flex min-h-[44px] flex-col justify-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {t('pd.global.tilePricesRibbon')}
      </h3>
      <div className="flex flex-row gap-2">
        {ribbon.map((entry) => (
          <RibbonAsset key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tile ⑩ — the dedollarization context tile (D-25): display-only —
 * the reserve-share LEVEL + the custody 30-day direction. No verdict,
 * no meter, the honest note says so. Links to /currencies.
 * ------------------------------------------------------------------ */

export function DedollarTile({ tile }: { tile: GlobalDedollarTile }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const share = tile.reserveShare;
  const custody = tile.custody;
  const shareValue =
    share !== undefined && share.value !== null
      ? formatNumber(share.value, numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : null;
  const custodyChange = custody?.change30d;
  const custodyTone =
    custodyChange === undefined
      ? ''
      : custodyChange > 0
        ? 'text-[var(--color-return-up)]'
        : custodyChange < 0
          ? 'text-[var(--color-return-down)]'
          : 'text-[var(--color-text-secondary)]';
  return (
    <TileLink href="/currencies" title={t('pd.global.tileDedollar')} data-tile="dedollar">
      <p className="m-0 text-[length:var(--type-label)] leading-snug text-[var(--color-text-primary)]">
        {shareValue !== null ? (
          <bdi>
            {shareValue}% <span className="font-semibold text-[var(--color-text-secondary)]">{t('pd.global.dedollarShareLabel')}</span>
          </bdi>
        ) : (
          <span className="font-semibold text-[var(--color-text-tertiary)]">{t('pd.global.cannotRead')}</span>
        )}
      </p>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        {custody !== undefined && custody.value !== null && custodyChange !== undefined ? (
          <bdi>
            {t('pd.global.dedollarCustodyLabel')}{' '}
            <span
              dir="ltr"
              className={`tabular-nums ${custodyTone}`}
              title={interpolate(t('pd.global.dedollarDirection'), {
                change: signedPct(custodyChange, numberLocale),
              })}
            >
              {signedPct(custodyChange, numberLocale)}
            </span>
            <span className="sr-only"> {interpolate(t('pd.global.changeOver'), { days: 30 })}</span>
          </bdi>
        ) : (
          <span>
            {t('pd.global.dedollarCustodyLabel')}: {t('pd.global.cannotRead')}
          </span>
        )}
        <span className="text-[var(--color-text-tertiary)]"> · {t('pd.global.dedollarNote')}</span>
      </p>
    </TileLink>
  );
}

/* ------------------------------------------------------------------ *
 * The board itself — 10 tiles in D-21's order, 5×2 desktop / 1-col
 * mobile (spec §4's layout), the boards' tiles honest while loading.
 * ------------------------------------------------------------------ */

export function GlobalBoard({
  gaugeTiles,
  goldTile,
  ribbon,
  dedollar,
  marketsState,
  fxState,
}: {
  gaugeTiles: readonly GlobalGaugeTile[];
  goldTile: GlobalGoldTile;
  ribbon: readonly GlobalRibbonEntry[];
  dedollar: GlobalDedollarTile;
  marketsState: InsightsLoadStateLike<GlobalMarketsTile>;
  fxState: InsightsLoadStateLike<GlobalFxTile>;
}): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section aria-label={t('pd.global.boardAria')} data-global-board>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-5 lg:gap-3">
        <GoldBalanceTile tile={goldTile} />
        {gaugeTiles.map((tile) => (
          <GaugeTile key={tile.gauge} tile={tile} />
        ))}
        {fxState.kind === 'ready' ? (
          <FxLightsTile tile={fxState.value} />
        ) : fxState.kind === 'loading' ? (
          <BoardLoadingTile title={t('pd.global.tileFxLights')} />
        ) : (
          <BoardUnreadTile title={t('pd.global.tileFxLights')} />
        )}
        {marketsState.kind === 'ready' ? (
          <WorldMarketsTile tile={marketsState.value} />
        ) : marketsState.kind === 'loading' ? (
          <BoardLoadingTile title={t('pd.global.tileWorldMarkets')} />
        ) : (
          <BoardUnreadTile title={t('pd.global.tileWorldMarkets')} />
        )}
        <PricesRibbonTile ribbon={ribbon} />
        <DedollarTile tile={dedollar} />
      </div>
    </section>
  );
}

/** A board tile whose feed has not answered yet — the honest loading
 *  state (never a verdict, never blank). */
function BoardLoadingTile({ title }: { title: string }): React.JSX.Element {
  return (
    <div
      data-tile="loading"
      className="flex min-h-[44px] flex-col justify-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{title}</h3>
      <p className="m-0 flex items-center gap-1.5" role="status">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-text-tertiary)]/60" />
        <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">…</span>
      </p>
    </div>
  );
}

/** A board tile whose feed failed with no cached copy — the honest
 *  unread state (fail-closed: "Cannot read yet", never a guess). */
function BoardUnreadTile({ title }: { title: string }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div
      data-tile="unread"
      className="flex min-h-[44px] flex-col justify-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      <h3 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{title}</h3>
      <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.global.cannotRead')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The region-chips row (D-23): every destination except Gold (its tile
 * ① IS the chip), each chip a real link with a status dot. Dots mirror
 * REAL engine verdicts where the Global payload carries one (Markets ←
 * the markets verdict; Currencies ← the fx signal); the regions and
 * commodities show the honest "no verdict at this layer yet" neutral
 * dot (BD-S3a — never an invented composite, D-48).
 * ------------------------------------------------------------------ */

function ChipDot({ state }: { state: ChipDotState }): React.JSX.Element {
  // Never colour alone: the dot's meaning rides the chip's aria-label.
  const cls =
    state.kind === 'attention'
      ? 'bg-[var(--color-status-alert)]'
      : state.kind === 'verdict' && state.step === 1
        ? 'bg-[var(--color-status-normal)]'
        : state.kind === 'verdict' && state.step >= 3
          ? 'bg-[var(--color-status-alert)]'
          : state.kind === 'verdict'
            ? 'bg-[var(--color-status-watch)]'
            : 'bg-[var(--color-text-tertiary)]/40';
  return <span aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

function chipAria(dot: ChipDotState, t: ReturnType<typeof useI18n>['t']): string {
  if (dot.kind === 'attention') return dot.signal === 'unusual' ? t('pd.global.fxSignalUnusual') : t('pd.global.fxSignalAttention');
  if (dot.kind === 'verdict') return dot.step === 1 ? t('pd.global.dotCalm') : t('pd.global.dotWatch');
  return t('pd.global.dotNoVerdict');
}

export function RegionChips({
  marketsState,
  fxState,
}: {
  marketsState: InsightsLoadStateLike<GlobalMarketsTile>;
  fxState: InsightsLoadStateLike<GlobalFxTile>;
}): React.JSX.Element {
  const { t } = useI18n();
  // The 7 chip destinations in the spec §4 row order (Gold excepted — it
  // is tile ①). DESTINATIONS carries the routes + title keys.
  const chips = DESTINATIONS.filter((d) => d.route !== '/gold').sort((a, b) => {
    const order = ['/usa', '/europe', '/asia-pacific', '/australia', '/world-markets', '/commodities', '/currencies'];
    return order.indexOf(a.route) - order.indexOf(b.route);
  });
  const dotFor = (route: string): ChipDotState => {
    if (route === '/world-markets') {
      return marketsState.kind === 'ready' ? marketsChipDot(marketsState.value) : { kind: 'none' };
    }
    if (route === '/currencies') {
      return fxState.kind === 'ready' ? fxChipDot(fxState.value) : { kind: 'none' };
    }
    return { kind: 'none' };
  };
  return (
    <nav aria-label={t('pd.global.chipsAria')} data-region-chips>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {chips.map((d) => {
          const dot = dotFor(d.route);
          return (
            <li key={d.route}>
              <a
                href={d.route}
                data-chip={d.route}
                aria-label={`${t(d.titleKey)} — ${chipAria(dot, t)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(d.route);
                }}
                className="insights-focusable inline-flex min-h-[36px] items-center gap-2 rounded-full bg-currena-soft px-3.5 py-1.5 text-[length:var(--type-label)] font-bold text-currena-dark no-underline transition-all duration-300 hover:bg-currena-blue hover:text-white"
              >
                <ChipDot state={dot} />
                {t(d.titleKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * The narrator line (D-24): the existing /api/insights/narrative
 * client's OVERALL unit, one clamped line under the board. Rendered
 * only when the doc is present AND (visible || the ?narrative=preview
 * marker) — the Insights route's own staged-rollout gate; a missing or
 * failed feed renders nothing (spec §11: nothing breaks).
 * ------------------------------------------------------------------ */

export function NarratorLine({
  doc,
  preview,
}: {
  doc: NarrativeDoc | null;
  preview: boolean;
}): React.JSX.Element | null {
  const { t, locale } = useI18n();
  if (doc === null || !(doc.visible || preview)) return null;
  const text = locale === 'fa' ? doc.overall.fa : doc.overall.en;
  if (text.trim() === '') return null;
  return (
    <p
      data-narrator-line
      className="m-0 rounded-[var(--radius-md)] bg-currena-soft/60 px-4 py-2.5 text-[length:var(--type-label)] leading-relaxed text-currena-dark ring-1 ring-[var(--color-border)]/60 line-clamp-2 sm:line-clamp-3"
    >
      <span className="me-1.5 font-bold text-currena-blue">{t('pd.global.narratorTitle')}:</span>
      <bdi>{text}</bdi>
    </p>
  );
}
