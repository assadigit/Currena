/**
 * DeprecationBanner — the page-division S1 notice atop the legacy
 * /insights page (D-46, 2026-11-07).
 *
 * What it says, honestly: the all-in-one page is being reorganised into
 * the ten dedicated destinations; it stays here, COMPLETE and unchanged,
 * until every indicator is verified in its new home (D-9 — retirement
 * only then; roadmap S24 + reserve). The CTA links to `/` — the new
 * Global landing page (D-20) — whose placeholder links back here, so the
 * migration never dead-ends in either direction.
 *
 * Zero content loss: this banner adds a notice; it changes, hides or
 * removes nothing. It renders in every load state (loading · error ·
 * private · ready) because it is about the page, not the data.
 */

import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';

export function DeprecationBanner(): React.JSX.Element {
  const { t } = useI18n();
  return (
    // Amber notice — the app's caution hue (the verdict language reserves
    // red for alarms; this is a "heads-up", not a failure). Logical
    // properties only (house rule) so RTL flips correctly.
    <aside
      role="note"
      aria-label={t('deprecation.title')}
      className="mb-5 rounded-[15px] border border-amber-300 bg-amber-100/90 px-4 py-4 sm:px-5 dark:border-amber-500/40 dark:bg-amber-500/15"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg" aria-hidden="true">
          🧭
        </span>
        <div className="min-w-0">
          <h2 className="mb-1 text-sm font-bold text-amber-900 dark:text-amber-200">
            {t('deprecation.title')}
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            {t('deprecation.text')}
          </p>
          {/* REAL link (house pattern, audit WS-3 #6): href semantics for
              AT; onClick preventDefault routes through the path router. */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-bold text-amber-50 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100 dark:focus-visible:outline-amber-300"
          >
            {t('deprecation.cta')}
          </a>
        </div>
      </div>
    </aside>
  );
}
