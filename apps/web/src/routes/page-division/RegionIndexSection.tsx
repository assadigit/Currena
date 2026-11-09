/**
 * RegionIndexSection — the four region pages' index/map section
 * (page-division S8, 2026-11-08 — D-13/D-43/D-44; spec §7 item 8,
 * §8 item 3, §9 item 6, §10 item 1's map leg).
 *
 * THE ZOOM: the REUSED WorldMap module in its region mode — the SAME
 * drawing, the SAME board payload (the cached /api/insights/markets
 * route the legacy section, the Global tile and the /world-markets hero
 * read — zero new fetches, zero new KV), the SAME corpus-pinned words
 * through the ONE shared adapter (useWorldMapCopy — D-48: a zoomed
 * market's card is the world map's own card, never a restatement). Only
 * the window and the seated pins/cards change (REGION_ZOOMS).
 *
 * The honest scope note: this is the region page's INDEX section only.
 * The region's own indicator cards, verdicts and fills are the page
 * build sessions' scope (S9–S11 USA, S12–S13 Europe, S14–S15 Asia,
 * S16 Australia — every region page now carries its own layers above
 * this section). A zoomed card click (and a mobile dot tap) opens the
 * market's full home today — /world-markets, where the region grids
 * carry every row.
 *
 * Platform: browser only — this module lives in the lazy region-page
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useState } from 'react';
import type { MarketId, MarketsSnapshot } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { navigate } from '../../router';
import { fetchMarketsSnapshot, readCachedMarkets } from '../../lib/markets';
import { WorldMap } from '../../components/insights/world-markets/WorldMap';
import type { MapRegionId } from '../../components/insights/world-markets/world-map-config';
import { formatRelativeShort } from '../../components/insights/world-markets/shared';
import type { TranslationKey } from '../../lib/locale';
import { useWorldMapCopy } from './world-map-copy';

/** The section heading per region (fresh words, queued unreviewed in the
 * Persian manifest — every word INSIDE the map is corpus-pinned). */
const TITLE_KEY: Readonly<Record<MapRegionId, TranslationKey>> = {
  us: 'pd.regionZoom.titles.us',
  europe: 'pd.regionZoom.titles.europe',
  asia: 'pd.regionZoom.titles.asia',
  australia: 'pd.regionZoom.titles.australia',
};

/** The board's load state — the M-17 keep-flagged discipline (the S7
 * WorldMarketsPage pattern): a failed refresh keeps the last good copy
 * on screen, flagged with its stored generation; only with no cache at
 * all is the honest empty state the answer (fail-closed, Agent Rule 5). */
export type RegionBoardState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; snapshot: MarketsSnapshot; fromCache?: boolean };

export function RegionIndexSection({ region }: { region: MapRegionId }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const mapCopy = useWorldMapCopy(t);

  const [boardState, setBoardState] = useState<RegionBoardState>(() => {
    try {
      const cached = readCachedMarkets();
      return cached ? { kind: 'ready', snapshot: cached, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      // M-17: a failed refresh keeps the LAST GOOD copy on screen,
      // flagged with its stored generation; no cache at all → empty.
      setBoardState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        const cached = prev.kind === 'ready' ? prev.snapshot : null;
        if (cached !== null) return { kind: 'ready', snapshot: cached, fromCache: true };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  // The zoomed card click (and the mobile dot tap — the map's own
  // list-layout fallback): open the market's full home today, the
  // /world-markets grids. When the region pages grow their own rows
  // (S9+), this handler retargets to them — the S7 hero pattern.
  const onOpenMarket = useCallback((id: MarketId) => {
    void id;
    navigate('/world-markets');
  }, []);

  return (
    <section aria-label={t(TITLE_KEY[region])} data-region-zoom={region} className="mb-5 sm:mb-7">
      {/* The heading row: the section title + the board's own stamp
       * (the M-17 cached caption speaks only when the copy on screen is
       * the last-good one — a real event, never a routine age). */}
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t(TITLE_KEY[region])}</h2>
        {boardState.kind === 'ready' ? (
          <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:text-[length:var(--type-caption)]">
            <bdi>{interpolate(t('pd.global.dataAsOf'), { date: formatRelativeShort(boardState.snapshot.generatedAt, locale) })}</bdi>
            {boardState.fromCache === true ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-region-board-cached>
                {interpolate(t('pd.global.boardCached'), { time: formatRelativeShort(boardState.snapshot.generatedAt, locale) })}
              </bdi>
            ) : null}
          </p>
        ) : null}
      </div>
      <p className="m-0 mb-2.5 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mb-3 sm:text-[length:var(--type-label)]">
        {t('pd.regionZoom.introLine')}
      </p>

      {/* The zoom itself — the REUSED drawing in region mode. Loading
       * keeps the map's own M17 state (grey land, reserved height); an
       * empty board with no cache keeps the honest one-line answer (the
       * section's own §6.6 discipline — never zeros, never a fake calm). */}
      {boardState.kind === 'empty' ? (
        <p
          className="m-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
          data-region-zoom-empty
        >
          {t('pd.global.cannotRead')}
        </p>
      ) : (
        <WorldMap
          region={region}
          snapshot={boardState.kind === 'ready' ? boardState.snapshot : undefined}
          fromCache={boardState.kind === 'ready' && boardState.fromCache === true}
          loading={boardState.kind === 'loading'}
          copy={mapCopy}
          locale={locale}
          numberLocale={numberLocale}
          onOpenMarket={onOpenMarket}
        />
      )}
    </section>
  );
}
