/**
 * converter/QuickTools — the owner-wireframe quick-tools section: the six
 * one-tap shortcuts as REAL anchor links (audit WS-3 #6: href semantics
 * for AT — link lists, open-in-tab, status bar — plus the browser's own
 * activation; onClick preventDefault routes the click through the path
 * router's navigate() so the SPA doesn't reload) (Phase: WS-4 module
 * split of the former Converter.tsx monolith — zero behavior change,
 * code moved verbatim).
 */

import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import { TOOLS } from './shared';

export function QuickTools() {
  const { t } = useI18n();

  return (
    <section className="no-print mt-8 lg:mt-12" aria-label={t('converter.quickTools')}>
      <h2 className="mb-4 text-base font-bold text-currena-dark">
        ⚡ {t('converter.quickTools')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {TOOLS.map(({ path, emoji, labelKey }) => (
          /* REAL links (audit WS-3 #6): href semantics for AT (link
             lists, open-in-tab, status bar) + the browser's own
             activation; onClick preventDefault routes through the path
             router's navigate() so the SPA doesn't reload. */
          <a
            key={path}
            href={path}
            onClick={(e) => {
              e.preventDefault();
              navigate(path);
            }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center no-underline shadow-[0_4px_16px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/10 hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:bg-[#1A222E] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:ring-white/[0.06] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
          >
            <span className="text-2xl" aria-hidden="true">
              {emoji}
            </span>
            <span className="text-xs font-bold leading-snug text-currena-dark">
              {t(labelKey)}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
