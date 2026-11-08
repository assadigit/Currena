/**
 * WorldMarketsHero — the D-43 hero (page-division S7, 2026-11-08 — spec
 * §6 item 1): the REUSED world-index map beside the section's status
 * summary.
 *
 * REUSE, never a rebuild (D-43 + D-48): the map is the SAME
 * world-markets/WorldMap module the legacy /insights section renders —
 * one dot per index, colour = the period's trend, the callout cards
 * carrying the 1d/1w/1m changes (and the yearly hero row), the period
 * switch, the M17 loading/cached states. The words it speaks arrive
 * through the S7 WorldMapCopy contract: this page feeds it the
 * corpus-pinned `pd.worldMarkets.map.*` keys (pinned byte-for-byte by
 * world-markets-copy-pin.test.ts), so the drawing can never say
 * something different from the legacy card while its chunk stays lean
 * (no corpus import).
 *
 * The status summary (spec §6: "unusual ≥8 stressed · attention ≥4") is
 * the board's OWN §5.3 rollup (the signal + counts straight off
 * snapshot.summary, never re-computed) beside the RAW ≥10%/≥20% counts
 * (worldMarketsStatus — the S1-M1.6 #2 rule) and the STATED rule whose
 * thresholds are the definitions' own constants (ATTENTION_COUNT /
 * UNUSUAL_COUNT, imported). Clicking a map callout scrolls to that
 * market's region-grid row (the on-page answer to the legacy detail
 * panel).
 */

import type { MarketId, MarketsSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { ATTENTION_COUNT, UNUSUAL_COUNT } from '@currena/insights/markets/definitions';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { WorldMap } from '../../components/insights/world-markets/WorldMap';
import { formatRelativeShort } from '../../components/insights/world-markets/shared';
import type { WorldMarketsStatusModel } from './world-markets-tiles';
import { WM_VERDICT_WORD } from './world-markets-tiles';
// S8: the copy adapter + the entry list moved to world-map-copy.ts (the
// shared door for every page-division map surface) — re-exported here so
// the S7 importers (world-markets-copy-pin.test.ts) keep their paths.
import { useWorldMapCopy } from './world-map-copy';
export { useWorldMapCopy, WM_ENTRY_IDS } from './world-map-copy';

/** The §5.3 signal's own measure-label keys (the corpus's own words). */
const MEASURE_KEY: Record<WorldMarketsStatusModel['signal'], TranslationKey> = {
  normal: 'pd.worldMarkets.measureNormal',
  attention: 'pd.worldMarkets.measureAttention',
  unusual: 'pd.worldMarkets.measureUnusual',
};

/** The verdict word's tone — the calm status hues (the verdict
 * vocabulary), matching the MarketsVerdict box's stepToneClass mapping. */
const STEP_TONE: Record<number, string> = {
  1: 'text-[var(--color-status-normal)]',
  2: 'text-[var(--color-text-primary)]',
  3: 'text-[var(--color-status-watch)]',
  4: 'text-[var(--color-status-alert)]',
};

/** The four-segment meter — the GlobalBoard TileMeter pattern (the
 * page-consistent verdict anatomy [word][meter]; decorative segments,
 * the aria carries the sentence). */
function StatusMeter({ step, ariaLabel }: { step: number; ariaLabel: string }): React.JSX.Element {
  return (
    <span className="verdict-meter verdict-meter-sm" data-step={step} role="img" aria-label={ariaLabel} title={ariaLabel}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''} motion-safe:transition-colors motion-safe:duration-300`} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The hero
 * ------------------------------------------------------------------ */

export type WorldMarketsBoardState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | {
      kind: 'ready';
      /** The stored board snapshot (16 rows once every market spoke). */
      snapshot: MarketsSnapshot;
      /** The M-17 flag: the copy on screen is the last-good cached one. */
      fromCache?: boolean;
    };

export function WorldMarketsHero({
  status,
  boardState,
  onOpenMarket,
}: {
  /** The status summary — null while the board is not ready. */
  status: WorldMarketsStatusModel | null;
  boardState: WorldMarketsBoardState;
  /** Opens a market's row in the region grids (the map callout click). */
  onOpenMarket: (id: MarketId) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const mapCopy = useWorldMapCopy(t);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  return (
    <section aria-label={t('pd.worldMarkets.statusAria')} data-wm-hero className="flex flex-col gap-3">
      {/* ---- The status summary (the board's own §5.3 rollup + the RAW
       * counts + the stated rule). Loading keeps a skeleton; empty keeps
       * the calm one-line answer (the section's own §6.6 discipline —
       * never zeros, never a fake calm). ---- */}
      {boardState.kind === 'ready' && status !== null ? (
        <div
          className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
          data-wm-status-box
        >
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={`type-verdict ${STEP_TONE[status.step] ?? ''}`} data-wm-verdict-word>
              {t(`pd.worldMarkets.${WM_VERDICT_WORD[status.step]}`)}
            </span>
            <StatusMeter step={status.step} ariaLabel={interpolate(t('pd.worldMarkets.verdictAria'), { label: t(`pd.worldMarkets.${WM_VERDICT_WORD[status.step]}`), step: num(status.step) })} />
          </p>
          {/* §6.11's measure label — what the signal measures, the
           * corpus's own sentence (the SectionVerdictLine pattern). */}
          <p className="m-0 mt-1.5 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
            <bdi>{t(MEASURE_KEY[status.signal])}</bdi>
          </p>
          {/* The RAW counts: the ≥10% line (the corpus's own) + the bear
           * tier (fresh wording) + the step-3 in-correction count (the
           * E2 discipline: the attention tier names its count). */}
          <p className="m-0 mt-1.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{interpolate(t('pd.worldMarkets.belowHighLine'), { n: num(status.inCorrection), count: num(status.count) })}</bdi>
            {status.inBear > 0 ? (
              <>
                {' '}
                <bdi>{interpolate(t('pd.worldMarkets.bearLine'), { n: num(status.inBear) })}</bdi>
              </>
            ) : null}
          </p>
          {/* The stated rule — the definitions' own thresholds, so the
           * sentence can never disagree with the engine rule (spec §6:
           * "status summary — unusual ≥8 stressed · attention ≥4"). */}
          <p className="m-0 mt-1 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-wm-rule-line>
            <bdi>{interpolate(t('pd.worldMarkets.ruleLine'), { attention: num(ATTENTION_COUNT), unusual: num(UNUSUAL_COUNT), count: num(16) })}</bdi>
          </p>
          {/* The board's own stamp + the M-17 cached caption (the S4
           * tile pattern: the caption speaks only when the copy on screen
           * is the last-good one — a real event, never a routine age). */}
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(t('pd.global.dataAsOf'), { date: formatRelativeShort(boardState.snapshot.generatedAt, locale) })}</bdi>
            {boardState.fromCache === true ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-wm-board-cached>
                {interpolate(t('pd.global.boardCached'), { time: formatRelativeShort(boardState.snapshot.generatedAt, locale) })}
              </bdi>
            ) : null}
          </p>
        </div>
      ) : boardState.kind === 'loading' ? (
        <div className="h-[168px] animate-pulse rounded-[var(--radius-md)] bg-currena-soft/60 ring-1 ring-[var(--color-border)]" data-wm-status-skeleton />
      ) : (
        <p className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]" data-wm-status-empty>
          {t('pd.global.cannotRead')}
        </p>
      )}

      {/* ---- The world map — the REUSED module (D-43), fed the pinned
       * adapter words. Uncontrolled period (the map's own session state,
       * the standalone usage); a callout click opens the region-grid
       * row (the page's answer to the legacy detail panel). ---- */}
      <WorldMap
        snapshot={boardState.kind === 'ready' ? boardState.snapshot : undefined}
        fromCache={boardState.kind === 'ready' && boardState.fromCache === true}
        loading={boardState.kind === 'loading'}
        copy={mapCopy}
        locale={locale}
        numberLocale={numberLocale}
        onOpenMarket={onOpenMarket}
      />
    </section>
  );
}
