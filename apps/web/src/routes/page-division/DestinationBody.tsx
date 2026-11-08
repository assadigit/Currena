/**
 * DestinationBody — the honest "still building" body the destination
 * pages carry (S8, 2026-11-08 — extracted verbatim from PagePlaceholder's
 * JSX so the four region pages can seat their S8 index sections ABOVE
 * the same honest record without duplicating its copy or classes).
 *
 * What it says: what will live on the page (the spec membership), the
 * roadmap sessions + decision ids that build it, where the content
 * lives today (the legacy /insights page), and the way back to the
 * world scan. Nothing is promised beyond the recorded decisions — the
 * fail-closed display discipline.
 */

import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import { Button, Card } from '../../components/ui';
import type { DestinationSpec } from './destinations';

export function DestinationBody({ spec }: { spec: DestinationSpec }): React.JSX.Element {
  const { t } = useI18n();

  return (
    <>
      <Card className="mb-4">
        {/* What will live here (spec membership, condensed) */}
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-currena-muted">{t('pd.whatLivesHere')}</h2>
        <p className="mb-5 text-sm leading-relaxed text-currena-dark">{t(spec.summaryKey)}</p>

        {/* Traceability: the roadmap sessions that fill this page + the
         * decision record it implements. Session/decision codes stay Latin
         * in both locales (references, like tickers). */}
        <p className="mb-1 text-xs text-currena-muted">{t('pd.buildsIn', { sessions: spec.buildSessions })}</p>
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
       * user journey — plain external href). */}
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
    </>
  );
}
