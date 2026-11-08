/**
 * UsaTicSection — the USA page's tier-6 board, "Who finances America"
 * (page-division S10, 2026-11-09 — spec §7 item 7, D-31).
 *
 * THE BOARD: the REUSED legacy TicSection module — the SAME drawing the
 * /insights page renders (the S8 one-drawing rule, D-48): 21 foreign
 * holders of Treasuries + the aggregates (the foreign total, the
 * official/private split), 24 months of history per holder (the Japan +
 * China chart + the per-row sparklines), the custody-hub caveat (the ◆
 * row markers + the footnote, Treasury's own warning), and the net
 * TRANSACTIONS shown SEPARATELY from the price (valuation) effect — the
 * 12-month net-buying/selling columns + the honest-difference note.
 *
 * The words ride the lean pd.usa.tic adapter (usa-tic-copy.ts — every key
 * pinned byte-for-byte to the corpus by usa-copy-pin.test.ts), so the
 * USA chunk never loads the insights copy corpus.
 *
 * Data: the EXISTING route GET /api/insights/tic through lib/tic.ts
 * (zod-validated, own last-good localStorage cache) — one KV read on the
 * server, zero new fetches, zero new KV. The feed NEVER surfaces an
 * error state (the markets/fx §6.6 family): loading skeletons and the
 * calm "being prepared" line are the designed fallbacks, and a failed
 * refresh keeps the last good copy on screen (the M-17 pattern).
 *
 * The section is INDEPENDENT of the page projection: a slow or dead
 * projection never takes the TIC board away (each feed governs its own
 * surface — the BD-S9c discipline).
 *
 * Platform: browser only — this module lives in the lazy USA route
 * chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import type { TicSnapshot } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { fetchTicSnapshot, readCachedTic } from '../../lib/tic';
import { TicSection, type TicLoadState } from '../../components/insights/TicSection';
import { useUsaTicCopy } from './usa-tic-copy';

/** The board's load state — the markets/fx discipline (the useTicSection
 *  shape, re-stated lean so the USA chunk does not pull the legacy
 *  insights-sections chain; the S8 RegionIndexSection pattern). */
function useTicBoard(): TicLoadState {
  const [ticState, setTicState] = useState<TicLoadState>(() => {
    try {
      const cached = readCachedTic();
      return cached ? { kind: 'ready', snapshot: cached } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchTicSnapshot(controller.signal).then((snapshot: TicSnapshot | null) => {
      if (controller.signal.aborted) return;
      // M-17: a failed refresh keeps the LAST GOOD copy on screen, flagged
      // fromCache; no cache at all → the calm "being prepared" line.
      setTicState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        const cached = prev.kind === 'ready' ? prev.snapshot : null;
        if (cached !== null) return { kind: 'ready', snapshot: cached, fromCache: true };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  return ticState;
}

export function UsaTicSection(): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const copy = useUsaTicCopy(t);
  const state = useTicBoard();

  return (
    <section aria-label={t('pd.usa.tier6.title')} data-usa-tier="tier-6" className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.usa.tier6.title')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.usa.tier6.intro')}</p>
      </div>
      {/* The REUSED drawing — the SAME TicSection the legacy /insights
       *  page renders, fed the corpus-pinned words through the lean
       *  adapter. Its own h3 sub-heading + provenance line + stale badge
       *  ride inside (one drawing, one vocabulary — D-48). */}
      <TicSection state={state} copy={copy} locale={locale} numberLocale={numberLocale} />
    </section>
  );
}
