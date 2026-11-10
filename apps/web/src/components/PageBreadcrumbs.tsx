/**
 * PageBreadcrumbs — the page-division destinations' wayfinding row
 * (page-division S19, 2026-11-12 — Phase J "Navigation, mobile & SEO
 * polish"; the roadmap's S19 scope: "breadcrumbs").
 *
 * One shared component renders the honest two-level hierarchy the D-46
 * routes actually have — every destination is a TOP-LEVEL sibling of
 * Home, so the crumb trail is exactly `Home › <Page>`:
 *
 *   - Home is a REAL anchor (audit WS-3 #6: href semantics for AT +
 *     the browser's own Enter/Space activation) routed through the path
 *     router's navigate() — exactly once, no reload (the house pattern).
 *   - The current page is a plain span carrying aria-current="page"
 *     (WAI-ARIA breadcrumb pattern: the current crumb is not a link).
 *   - The separator is aria-hidden and mirrors in RTL
 *     (rtl:-scale-x-100 — '›' must point along the reading direction).
 *   - The Home link follows the Footer's 2026-10-16 quirk-pass precedent
 *     (inline-flex + py-2 ≈ a 32px hit area on a text row — the WCAG
 *     2.5.8 AA floor with room to spare; full 44px buttons would bloat
 *     a caption-size wayfinding row).
 *
 * Scope (BD-S19b): the eight destinations beyond Global render it;
 * Global IS Home (a "Home › Global" trail on the landing page is noise)
 * and the legacy /insights keeps its deprecation banner as the
 * wayfinding bridge (retirement ahead, D-9/D-46). The row rides each
 * page's own heading block, so it renders in the ready + cached states.
 */

import { useI18n } from '../lib/locale';
import { navigate } from '../router';
import type { TranslationKey } from '../lib/locale';

export function PageBreadcrumbs({ pageKey }: { pageKey: TranslationKey }): React.JSX.Element {
  const { t } = useI18n();

  return (
    <nav aria-label={t('nav.breadcrumb')} data-page-breadcrumbs className="mb-1">
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-0.5 p-0 text-[10.5px] font-semibold text-currena-muted sm:text-[length:var(--type-caption)]">
        <li>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex cursor-pointer items-center rounded border-0 bg-transparent py-2 font-semibold text-currena-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
          >
            {t('nav.home')}
          </a>
        </li>
        <li aria-hidden="true" className="flex select-none items-center self-center pt-2 pb-2 rtl:-scale-x-100">
          ›
        </li>
        <li>
          <span aria-current="page" className="inline-flex items-center py-2 text-[var(--color-text-secondary)]">
            {t(pageKey)}
          </span>
        </li>
      </ol>
    </nav>
  );
}
