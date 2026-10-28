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
import { fetchNarrativeDoc, readCachedNarrative } from '../../lib/narrative';
import type { NarrativeDoc } from '../../lib/narrative';
import type { MarketsLoadState } from '../../components/insights/WorldMarkets';
import type { FxLoadState } from '../../components/insights/WorldCurrencies';
import type { FxAlert, MarketsAlert, SectionIndicatorState } from '../../components/insights/VerdictMeter';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

export function useWorldMarketsSection(copy: InsightsCopy, enabled = true) {
  // World stock markets (insights-world-markets-spec.md): an independent
  // feed with its own last-good cache. It NEVER surfaces an error — the
  // designed fallbacks are the loading skeletons and the calm "being
  // prepared" line (§6.6) — so a missing/unready feed cannot break the
  // page, and a page request never reaches a provider (§4 rule 4).
  // PUBLIC MODE (2026-10-18b owner directive): `enabled` stays TRUE — the
  // markets board is public on the owner's own EODHD key (the generated
  // overrides file no longer hides it).
  const [marketsState, setMarketsState] = useState<MarketsLoadState>(() => {
    // When a deployment disables the board (no render, no fetch), the
    // state is the calm empty kind the shell never renders.
    if (!enabled) return { kind: 'empty' };
    try {
      const cachedMarkets = readCachedMarkets();
      return cachedMarkets ? { kind: 'ready', snapshot: cachedMarkets } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      // MAP M17 (world-markets-map-spec.md): a failed refresh keeps the
      // LAST GOOD local copy on screen (flagged fromCache — the map shows
      // its "Showing data from {time}" line) instead of collapsing the
      // section to the "being prepared" state while perfectly good data
      // sits in the cache. With no cache at all, the calm empty state is
      // the honest answer, exactly as before.
      setMarketsState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        const cached = prev.kind === 'ready' ? prev.snapshot : null;
        if (cached !== null) return { kind: 'ready', snapshot: cached, fromCache: true };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, [enabled]);

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

export function useWorldCurrenciesSection(copy: InsightsCopy, enabled = true) {
  // World currencies (insights-world-currencies-spec.md): the same
  // independent-feed discipline — own last-good cache, never an error
  // surface; loading skeletons and the calm "being prepared" line (§9.5).
  const [fxState, setFxState] = useState<FxLoadState>(() => {
    // The markets twin: disabled means empty, never fetched, never rendered
    // (the shell hides the section). Public mode keeps the fx board
    // licence-hidden — it carries no owner directive (2026-10-18b lifted
    // only the markets board).
    if (!enabled) return { kind: 'empty' };
    try {
      const cachedFx = readCachedFx();
      return cachedFx ? { kind: 'ready', snapshot: cachedFx } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchFxSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      setFxState(snapshot !== null ? { kind: 'ready', snapshot } : { kind: 'empty' });
    });
    return () => controller.abort();
  }, [enabled]);

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

/**
 * useNarrative — the Layer-2 narrator document feed (M5, spec §9 + §11).
 *
 * Mirrors the markets/fx discipline: own last-good cache (the cached doc
 * may carry a different `visible` flag than the live fetch — the live
 * value wins on every refresh, the cached value paints instantly from
 * localStorage on a slow connection). NEVER surfaces an error — the spec
 * §11 rule is "Missing/failed fetch → render nothing; nothing breaks", so
 * null resolves to "no NarrativeBlock anywhere" and the page keeps working.
 *
 * The hook DOES NOT decide whether to render — that gate lives in the
 * Insights route (the `?narrative=preview` URL marker OR `doc.visible`).
 * The hook only fetches and stores. The route reads `previewMode` (from
 * the URL once at boot) AND `doc?.visible === true` to decide.
 *
 * @param enabled Always TRUE today (the route unconditionally fetches the
 *                doc; the staged rollout is the display gate, not a fetch
 *                gate — the owner wants the texts ready for the flip).
 */
export function useNarrative(enabled = true) {
  const [narrative, setNarrative] = useState<NarrativeDoc | null>(() => {
    if (!enabled) return null;
    try {
      return readCachedNarrative();
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchNarrativeDoc(controller.signal).then((doc) => {
      if (controller.signal.aborted) return;
      // The cached doc's `visible` flag is STALE (it was set when the cache
      // was written). The fresh fetch carries the route's current env
      // value — that wins. A null fetch keeps the cached doc on screen
      // (the spec's "show the last good copy" pattern from the markets feed),
      // but the cached doc's `visible` is treated as false by the route's
      // gate (`doc?.visible === true` — the cached value is whatever it was
      // when cached; the preview marker is the only safe way to read text
      // from a cached doc).
      if (doc !== null) {
        setNarrative(doc);
      }
    });
    return () => controller.abort();
  }, [enabled]);

  return narrative;
}

/**
 * Reads `?narrative=preview` from BOTH `window.location.search` (the
 * canonical URL form `currena.ir/?narrative=preview#/insights`, per D-34)
 * AND the hash-router's query params (the share-link form
 * `currena.ir/#/insights?narrative=preview`). The canonical form lives
 * BEFORE the hash, so the hash router's `routeQuery()` does NOT see it —
 * this hook checks both sources once at mount (the URL marker is a one-shot
 * read; the spec says "read once at app boot, never persisted").
 *
 * Returns `true` when the preview marker is present in either location.
 */
export function useNarrativePreview(): boolean {
  return useMemo(() => {
    try {
      const fromSearch = new URLSearchParams(window.location.search).get('narrative') === 'preview';
      const fromHash = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('narrative') === 'preview';
      return fromSearch || fromHash;
    } catch {
      return false;
    }
  }, []);
}
