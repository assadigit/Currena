/**
 * GlobalPlaceholder — the S1 skeleton for `/`, the future world-scan
 * landing page (D-20: Global becomes the landing page; D-11: one screen,
 * zero scrolling; D-21: the 10-tile verdict board).
 *
 * Until roadmap S3–S4 build the real board, the landing page is an honest
 * migration hub: it says the world scan is being built, points to the
 * legacy /insights page where the complete picture lives today (D-9/D-46
 * — the deprecation banner there links back here), and offers the eight
 * destination placeholders the program will fill. Nothing is faked: no
 * verdicts, no composites (D-48 — no invented composites without
 * calibration), no live prices. The tiles arrive with the engine's own
 * computed values in S3.
 */

import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import { Button, Card } from '../../components/ui';
import { DESTINATIONS } from './destinations';

export function GlobalPlaceholder(): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 sm:max-w-[680px] lg:max-w-[880px] lg:px-10">
      {/* Heading + honest build status */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-extrabold text-currena-dark">{t('pd.global.title')}</h1>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {t('pd.statusBuilding')}
          </span>
        </div>
        <p className="max-w-prose text-base leading-relaxed text-currena-muted">
          {t('pd.global.purpose')}
        </p>
      </div>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-currena-muted">
          {t('pd.whatLivesHere')}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-currena-dark">{t('pd.global.summary')}</p>
        <p className="text-xs text-currena-muted">
          {t('pd.buildsIn', { sessions: 'S3–S4' })}
        </p>
      </Card>

      {/* During the rebuild — the honest bridge to today's complete page.
          The /insights deprecation banner links here; this card links back,
          so the migration never dead-ends in either direction. */}
      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-currena-muted">
          {t('pd.global.todayTitle')}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-currena-dark">{t('pd.global.todayText')}</p>
        <Button variant="cta" className="px-5 py-2.5 text-sm" onClick={() => navigate('/insights')}>
          {t('pd.openInsights')}
        </Button>
      </Card>

      {/* The destinations — the program's own map, one link each. Also the
          S3 region-chips row's first ancestor (D-23): chips that link all
          destinations, status dots arriving with real verdicts. */}
      <Card>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-currena-muted">
          {t('pd.global.destinations')}
        </h2>
        <ul className="grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
          {DESTINATIONS.map((d) => (
            <li key={d.route}>
              {/* REAL links (house pattern, audit WS-3 #6). */}
              <a
                href={d.route}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(d.route);
                }}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl bg-currena-soft px-4 py-2.5 text-sm font-semibold text-currena-dark no-underline transition-all duration-300 hover:bg-currena-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
              >
                {t(d.titleKey)}
                {/* Direction-aware arrow — flips in RTL so it always points
                    "forward" along the reading direction. */}
                <span aria-hidden="true" className="text-currena-blue rtl:-scale-x-100">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
