/**
 * Page-division destination descriptors (S1, 2026-11-07).
 *
 * Source of truth: docs/page-division/02-PAGE-DIVISION-SPEC.md §2/§4–§12
 * + docs/page-division/01-SESSION-ROADMAP.md (per-page build sessions) +
 * the decision record D-1…D-48 (03-STRATEGY-LOG.md §5). Every entry states
 * its purpose, what will live on the page, and the build sessions that
 * fill it — the placeholder renders these honestly (fail-closed display
 * discipline: nothing is faked, nothing is promised beyond the roadmap).
 *
 * Copy lives in the app dictionaries (i18n discipline: en first, then fa);
 * this module holds only the wiring — which keys, which build sessions,
 * which decision ids (decision ids and session codes are references, like
 * tickers, not translated copy).
 */

import type { TranslationKey } from '../../lib/locale';
import type { RoutePath } from '../../router';

export interface DestinationSpec {
  /** The clean top-level slug (D-46). */
  route: Extract<RoutePath, '/gold' | '/world-markets' | '/currencies' | '/commodities' | '/usa' | '/europe' | '/asia-pacific' | '/australia'>;
  /** Page name — nav label + placeholder heading. */
  titleKey: TranslationKey;
  /** One-line purpose (spec §4–§12 "Purpose"). */
  purposeKey: TranslationKey;
  /** "What will live here" summary (spec membership, condensed). */
  summaryKey: TranslationKey;
  /** The roadmap sessions that build this page (S1 placeholder → filled then). */
  buildSessions: string;
  /** The decision record entries this page traces to (03-STRATEGY-LOG.md §5). */
  decisions: string;
}

/**
 * The eight destination pages beyond Global. Order matches the spec §2
 * table (build order D-20 + D-47): Gold → World Markets → USA → Europe →
 * Asia & Pacific → Australia → Commodities → Currency Pairs.
 */
export const DESTINATIONS: readonly DestinationSpec[] = [
  {
    route: '/gold',
    titleKey: 'pd.gold.title',
    purposeKey: 'pd.gold.purpose',
    summaryKey: 'pd.gold.summary',
    buildSessions: 'S5–S6',
    decisions: 'D-5 · D-26 · D-27 · D-28',
  },
  {
    route: '/world-markets',
    titleKey: 'pd.worldMarkets.title',
    purposeKey: 'pd.worldMarkets.purpose',
    summaryKey: 'pd.worldMarkets.summary',
    buildSessions: 'S7–S8',
    decisions: 'D-13 · D-43 · D-47',
  },
  {
    route: '/usa',
    titleKey: 'pd.usa.title',
    purposeKey: 'pd.usa.purpose',
    summaryKey: 'pd.usa.summary',
    buildSessions: 'S9–S11',
    decisions: 'D-14 · D-29 · D-30 · D-31',
  },
  {
    route: '/europe',
    titleKey: 'pd.europe.title',
    purposeKey: 'pd.europe.purpose',
    summaryKey: 'pd.europe.summary',
    buildSessions: 'S12–S13',
    decisions: 'D-15 · D-33 · D-34',
  },
  {
    route: '/asia-pacific',
    titleKey: 'pd.asiaPacific.title',
    purposeKey: 'pd.asiaPacific.purpose',
    summaryKey: 'pd.asiaPacific.summary',
    buildSessions: 'S14–S15',
    decisions: 'D-16 · D-17 · D-35 · D-36',
  },
  {
    route: '/australia',
    titleKey: 'pd.australia.title',
    purposeKey: 'pd.australia.purpose',
    summaryKey: 'pd.australia.summary',
    buildSessions: 'S16',
    decisions: 'D-6 · D-37',
  },
  {
    route: '/commodities',
    titleKey: 'pd.commodities.title',
    purposeKey: 'pd.commodities.purpose',
    summaryKey: 'pd.commodities.summary',
    buildSessions: 'S17',
    decisions: 'D-2 · D-19 · D-38 · D-39 · D-40',
  },
  {
    route: '/currencies',
    titleKey: 'pd.currencies.title',
    purposeKey: 'pd.currencies.purpose',
    summaryKey: 'pd.currencies.summary',
    buildSessions: 'S18',
    decisions: 'D-18 · D-32 · D-41 · D-42',
  },
];

/** Look up a destination by its route (undefined = not a destination page). */
export function destinationFor(route: string): DestinationSpec | undefined {
  return DESTINATIONS.find((d) => d.route === route);
}
