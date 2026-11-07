/**
 * PagePlaceholder — the shared S1 skeleton for the eight destination pages
 * (Gold, World Markets, USA, Europe, Asia & Pacific, Australia,
 * Commodities & Energy, Currency Pairs).
 *
 * Roadmap S1 ("the skeleton every later session fills"): each destination
 * states its purpose, what will live on it, and the roadmap sessions that
 * will build it — honestly, per the fail-closed display discipline: a page
 * that doesn't exist yet says so, links to where the content lives today
 * (the legacy /insights page, D-9/D-46), and promises nothing beyond the
 * recorded decisions. The descriptor wiring lives in destinations.ts; the
 * copy lives in the app dictionaries (i18n discipline).
 *
 * Display-layer only: nothing here fetches, computes or mirrors a verdict.
 */

import { useI18n } from '../../lib/locale';
import { navigate, useRoute } from '../../router';
import { Button, Card } from '../../components/ui';
import { destinationFor } from './destinations';

export function PagePlaceholder(): React.JSX.Element {
  const route = useRoute();
  const { t } = useI18n();
  const spec = destinationFor(route);

  // Fail-closed: the router only mounts this component on the eight
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
        <p className="max-w-prose text-base leading-relaxed text-currena-muted">
          {t(spec.purposeKey)}
        </p>
      </div>

      <Card className="mb-4">
        {/* What will live here (spec membership, condensed) */}
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-currena-muted">
          {t('pd.whatLivesHere')}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-currena-dark">{t(spec.summaryKey)}</p>

        {/* Traceability: the roadmap sessions that fill this page + the
            decision record it implements. Session/decision codes stay Latin
            in both locales (references, like tickers). */}
        <p className="mb-1 text-xs text-currena-muted">
          {t('pd.buildsIn', { sessions: spec.buildSessions })}
        </p>
        <p className="text-xs text-currena-muted">
          <span className="sr-only">{t('pd.decisionsLabel')}: </span>
          {spec.decisions}
        </p>
      </Card>

      {/* Where the content lives today + the way back to the world scan */}
      <Card className="mb-4">
        <p className="mb-4 text-sm leading-relaxed text-currena-dark">{t('pd.todayOnInsights')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="cta" className="px-5 py-2.5 text-sm" onClick={() => navigate('/insights')}>
            {t('pd.openInsights')}
          </Button>
          <Button variant="secondary" className="px-5 py-2.5 text-sm" onClick={() => navigate('/')}>
            {t('pd.backToGlobal')}
          </Button>
        </div>
      </Card>

      {/* Quiet cross-reference to the program docs (repo-internal, not a
          user journey — plain external href). */}
      <p className="text-center text-xs text-currena-muted opacity-80">
        <a
          href="https://github.com/assadigit/Currena/blob/main/docs/page-division/02-PAGE-DIVISION-SPEC.md"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-currena-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
        >
          docs/page-division
        </a>
      </p>
    </div>
  );
}
