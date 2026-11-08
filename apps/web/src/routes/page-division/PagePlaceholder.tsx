/**
 * PagePlaceholder — the shared S1 skeleton for the destination pages
 * that are still waiting for their build session (after S8: the two
 * tool-destinations Commodities & Energy and Currency Pairs — the four
 * REGION pages moved to RegionPage with their S8 zoom sections seated).
 *
 * Roadmap S1 ("the skeleton every later session fills"): each
 * destination states its purpose, what will live on it, and the roadmap
 * sessions that will build it — honestly, per the fail-closed display
 * discipline: a page that doesn't exist yet says so, links to where the
 * content lives today (the legacy /insights page, D-9/D-46), and
 * promises nothing beyond the recorded decisions. The descriptor wiring
 * lives in destinations.ts; the copy lives in the app dictionaries
 * (i18n discipline).
 *
 * Display-layer only: nothing here fetches, computes or mirrors a
 * verdict. S8: the body cards moved to DestinationBody.tsx (shared with
 * RegionPage) — zero copy or behavior change here.
 */

import { useI18n } from '../../lib/locale';
import { useRoute } from '../../router';
import { Card } from '../../components/ui';
import { destinationFor } from './destinations';
import { DestinationBody } from './DestinationBody';

export function PagePlaceholder(): React.JSX.Element {
  const route = useRoute();
  const { t } = useI18n();
  const spec = destinationFor(route);

  // Fail-closed: the router only mounts this component on the
  // destination routes (App.tsx wiring), but if a future refactor mounts
  // it anywhere else, say so honestly instead of rendering a blank page.
  if (spec === undefined) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        <Card>
          <h1 className="mb-2 text-xl font-bold text-currena-dark">Currena</h1>
          <p className="text-sm text-currena-muted">{t('pd.unknownRoute')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 sm:max-w-[680px] lg:max-w-[880px] lg:px-10">
      {/* Heading + honest build status */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-extrabold text-currena-dark">{t(spec.titleKey)}</h1>
          {/* In-build status chip — amber, the app's caution hue; a page
              that is not built yet is an honest "not yet", never a fake. */}
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {t('pd.statusBuilding')}
          </span>
        </div>
        <p className="max-w-prose text-base leading-relaxed text-currena-muted">{t(spec.purposeKey)}</p>
      </div>

      <DestinationBody spec={spec} />
    </div>
  );
}
