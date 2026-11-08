/**
 * RegionPage — the four region destinations' shell (page-division S8,
 * 2026-11-08 — D-13/D-43/D-44): the S8 index section (the REUSED
 * world-index map in its region-zoom mode) seated above the SAME honest
 * S1 placeholder record the other unbuilt destinations carry.
 *
 * The page is still "building" — the amber chip stays (the region's own
 * indicator cards, verdicts and fills arrive in the page build sessions:
 * S9–S11 USA, S12–S13 Europe, S14–S15 Asia & Pacific, S16 Australia) —
 * but its D-44 index/map section is REAL from today: the zoomed map over
 * the SAME markets board payload the world map reads, with every value
 * through the same pure derivation (D-48).
 *
 * One lazy chunk serves all four routes (the region rides the route —
 * the placeholder-set pattern; the entry graph stays untouched).
 *
 * Platform: browser only.
 */

import { useI18n } from '../../lib/locale';
import { useRoute } from '../../router';
import { destinationFor } from './destinations';
import type { MapRegionId } from '../../components/insights/world-markets/world-map-config';
import { RegionIndexSection } from './RegionIndexSection';
import { DestinationBody } from './DestinationBody';

/** The four region routes → their zoom ids (the D-44 mapping). */
const REGION_OF_ROUTE: Readonly<Record<string, MapRegionId>> = {
  '/usa': 'us',
  '/europe': 'europe',
  '/asia-pacific': 'asia',
  '/australia': 'australia',
};

export function RegionPage(): React.JSX.Element {
  const route = useRoute();
  const { t } = useI18n();
  const spec = destinationFor(route);
  const region = REGION_OF_ROUTE[route];

  // Fail-closed (the PagePlaceholder discipline): the router only mounts
  // this component on the four region routes, but a future refactor must
  // never see a blank page — say so honestly.
  if (spec === undefined || region === undefined) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        <p className="text-sm text-currena-muted">{t('pd.unknownRoute')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* Heading + honest build status (the S1 placeholder's own). */}
      <header className="mb-3 sm:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t(spec.titleKey)}</h1>
          {/* In-build status chip — the page is still assembling (the
           * region's own cards + verdicts are the page build sessions'
           * scope); the zoom section below is real from S8. */}
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900 sm:px-3 sm:py-1 sm:text-xs dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {t('pd.statusBuilding')}
          </span>
        </div>
        <p className="m-0 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:text-base sm:leading-relaxed">{t(spec.purposeKey)}</p>
      </header>

      {/* Spec §7 item 8 / §8 item 3 / §9 item 6 / §10's map leg — the
       * region's own index/map section (the S8 zoom). The 1280px
       * container at lg gives the zoom's callout cards a real stage
       * (the S7 BD-S7b lesson, one container rule for every map
       * surface). */}
      <RegionIndexSection region={region} />

      {/* The honest still-building record (the S1 placeholder's own
       * body — what will live here, when, where it lives today). */}
      <div className="mx-auto w-full max-w-[680px] lg:max-w-[880px]">
        <DestinationBody spec={spec} />
      </div>
    </div>
  );
}
