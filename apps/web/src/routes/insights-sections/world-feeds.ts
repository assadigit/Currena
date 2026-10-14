/**
 * The two world-section feeds of the Insights page — the fetch/state hooks
 * moved verbatim from routes/Insights.tsx in the Phase 3-e route split:
 *
 *  - useWorldMarketsSection — GET /api/insights/markets (lib/markets.ts):
 *    own last-good cache, the §5.3 hero alert, the hero jump and the §6.4
 *    table CSV export.
 *  - useWorldCurrenciesSection — GET /api/insights/fx (lib/fx.ts): own
 *    last-good cache, the §6.5 hero alert WITH ITS PATTERN NAMES, the hero
 *    jump and the §9.3 pairs CSV export.
 *  - useWorldSectionIndicators — §6.11/§9.10: the two world sections as
 *    SEPARATE indicators in the hero's transparent count.
 *
 * The state stays route-owned (the hooks are called from the page shell in
 * the original hook order), so the hero, the Tools menu gating and the
 * section renders all see the same snapshots as before.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMarketsSnapshot, readCachedMarkets } from '../../lib/markets';
import { fetchFxSnapshot, readCachedFx } from '../../lib/fx';
import type { MarketsLoadState } from '../../components/insights/WorldMarkets';
import type { FxLoadState } from '../../components/insights/WorldCurrencies';
import type { FxAlert, MarketsAlert, SectionIndicatorState } from '../../components/insights/VerdictMeter';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

export function useWorldMarketsSection(copy: InsightsCopy) {
  // World stock markets (insights-world-markets-spec.md): an independent
  // feed with its own last-good cache. It NEVER surfaces an error — the
  // designed fallbacks are the loading skeletons and the calm "being
  // prepared" line (§6.6) — so a missing/unready feed cannot break the
  // page, and a page request never reaches a provider (§4 rule 4).
  const [marketsState, setMarketsState] = useState<MarketsLoadState>(() => {
    try {
      const cachedMarkets = readCachedMarkets();
      return cachedMarkets ? { kind: 'ready', snapshot: cachedMarkets } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      setMarketsState(snapshot !== null ? { kind: 'ready', snapshot } : { kind: 'empty' });
    });
    return () => controller.abort();
  }, []);

  // §5.3 (build step 9): the raised section signal joins the GLOBAL hero
  // verdict's attention module; undefined when calm or not yet populated.
  const marketsAlert = useMemo<MarketsAlert | undefined>(() => {
    if (marketsState.kind !== 'ready') return undefined;
    const { summary } = marketsState.snapshot;
    if (summary.signal === 'normal') return undefined;
    return {
      signal: summary.signal,
      n: summary.nAttention + summary.nUnusual,
      count: summary.count,
    };
  }, [marketsState]);

  const jumpToMarkets = useCallback(() => {
    document.getElementById('insights-markets')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  // The world-markets table export (spec §6.4: the table's CSV lives in the
  // existing Tools menu). Only offered while a markets snapshot is in hand.
  const downloadMarketsCsv = useCallback(() => {
    if (marketsState.kind !== 'ready') return;
    void import('../../components/insights/markets-csv').then(({ buildMarketsCsv, marketsCsvFilename }) => {
      const csv = buildMarketsCsv(marketsState.snapshot, copy);
      void import('../../lib/download').then(({ downloadBlob }) => {
        downloadBlob(
          new Blob([csv], { type: 'text/csv;charset=utf-8' }),
          marketsCsvFilename(marketsState.snapshot.generatedAt),
        );
      });
    });
  }, [marketsState, copy]);

  return { marketsState, marketsAlert, jumpToMarkets, downloadMarketsCsv };
}

export function useWorldCurrenciesSection(copy: InsightsCopy) {
  // World currencies (insights-world-currencies-spec.md): the same
  // independent-feed discipline — own last-good cache, never an error
  // surface; loading skeletons and the calm "being prepared" line (§9.5).
  const [fxState, setFxState] = useState<FxLoadState>(() => {
    try {
      const cachedFx = readCachedFx();
      return cachedFx ? { kind: 'ready', snapshot: cachedFx } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchFxSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      setFxState(snapshot !== null ? { kind: 'ready', snapshot } : { kind: 'empty' });
    });
    return () => controller.abort();
  }, []);

  // §6.5 (currencies build step 11): the raised currency signal joins the
  // hero's attention module WITH ITS PATTERN NAMES — the existing mechanism.
  const fxAlert = useMemo<FxAlert | undefined>(() => {
    if (fxState.kind !== 'ready') return undefined;
    const { summary, rules } = fxState.snapshot;
    if (summary.signal === 'normal') return undefined;
    const names = rules
      .filter((r) => r.outcome === 'warning' && r.counted)
      .map((r) => copy.fx.rules[r.id.slice(0, 2) as 'r1'].name);
    return { signal: summary.signal, patterns: names };
  }, [fxState, copy]);

  const jumpToFxCurrencies = useCallback(() => {
    document.getElementById('insights-fx')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  // The world-currencies pairs export (spec §9.3 item 6: the CSV goes in
  // the same Tools menu). Only offered while an fx snapshot is in hand.
  const downloadFxCsv = useCallback(() => {
    if (fxState.kind !== 'ready') return;
    void import('../../components/insights/fx-csv').then(({ buildFxCsv, fxCsvFilename }) => {
      const csv = buildFxCsv(fxState.snapshot, copy);
      void import('../../lib/download').then(({ downloadBlob }) => {
        downloadBlob(
          new Blob([csv], { type: 'text/csv;charset=utf-8' }),
          fxCsvFilename(fxState.snapshot.generatedAt),
        );
      });
    });
  }, [fxState, copy]);

  return { fxState, fxAlert, jumpToFxCurrencies, downloadFxCsv };
}

export function useWorldSectionIndicators(
  marketsState: MarketsLoadState,
  fxState: FxLoadState,
  copy: InsightsCopy,
  jumpToMarkets: () => void,
  jumpToFxCurrencies: () => void,
) {
  // §6.11/§9.10: the two world sections as SEPARATE indicators in the
  // transparent count — each with its own measure label and chip, never
  // merged (they measure different things; both can be true at once).
  const sectionIndicators = useMemo<SectionIndicatorState[] | undefined>(() => {
    const out: SectionIndicatorState[] = [];
    if (marketsState.kind === 'ready') {
      const signal = marketsState.snapshot.summary.signal;
      out.push({
        signal,
        label:
          signal === 'unusual'
            ? copy.markets.measureUnusual
            : signal === 'attention'
              ? copy.markets.measureAttention
              : copy.markets.measureNormal,
        onJump: jumpToMarkets,
      });
    }
    if (fxState.kind === 'ready') {
      const signal = fxState.snapshot.summary.signal;
      out.push({
        signal,
        label:
          signal === 'unusual'
            ? copy.fx.measureUnusual
            : signal === 'attention'
              ? copy.fx.measureAttention
              : copy.fx.measureNormal,
        onJump: jumpToFxCurrencies,
      });
    }
    return out.length > 0 ? out : undefined;
  }, [marketsState, fxState, copy, jumpToMarkets, jumpToFxCurrencies]);

  return sectionIndicators;
}
