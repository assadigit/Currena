/**
 * Header — fixed blur navbar, logo start-side.
 *
 * Responsive navigation (PC/tablet/mobile):
 *   - lg and up: an INLINE horizontal nav renders the 9 routes in the header
 *     itself (text-only pills, active-route highlighted, whitespace-nowrap) —
 *     the hamburger is hidden. This is the desktop "professional" identity.
 *   - below lg (phones + small tablets): the legacy hamburger opens the
 *     slide-in side menu from the inline-end edge (right in LTR, left in RTL)
 *     with the 9 SPA routes + language toggle (legacy parity, §8).
 *
 * Light-only (owner request 2026-09-17): the theme toggle was removed —
 * the app stays light; the pre-paint script clears legacy dark state.
 */

import { useState } from 'react';
import { navigate, useRoute, ROUTES } from '../router';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import type { RoutePath } from '../router';

const MENU_ITEMS: readonly {
  path: RoutePath;
  emoji: string;
  labelKey: TranslationKey;
  /** Compact label for the lg+ inline top-bar nav (falls back to labelKey). */
  shortKey?: TranslationKey;
}[] = [
  { path: '/', emoji: '🏠', labelKey: 'nav.home' },
  { path: '/live-rates', emoji: '📊', labelKey: 'nav.liveRates' },
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator', shortKey: 'nav.receiptShort' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter', shortKey: 'nav.splitterShort' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle', shortKey: 'nav.settleShort' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter', shortKey: 'nav.batchShort' },
  { path: '/about', emoji: 'ℹ️', labelKey: 'nav.about' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const route = useRoute();
  const { t, setLocale, locale } = useI18n();

  const go = (path: RoutePath): void => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between gap-2 px-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[20px] lg:h-20 lg:px-6 xl:px-10 bg-white/95">
        {/* Brand (legacy: logo image, 50px mobile; slimmer on desktop so the
            inline nav fits at exactly lg=1024 without wrapping) */}
        <button
          type="button"
          onClick={() => go('/')}
          aria-label={t('nav.home')}
          className="shrink-0 cursor-pointer bg-transparent border-0 p-0"
        >
          <img src="/images/currena-logo.png" alt="Currena" className="h-[50px] w-auto lg:h-[44px]" />
        </button>

        {/* Inline desktop nav (lg+): the 9 routes, compact text-only pills
            (short labels for the four long tool names keep the bar on one
            unwrapped line at exactly lg=1024), active-route highlighted */}
        <nav aria-label={t('app.name')} className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex list-none items-center justify-center gap-0.5 p-0 xl:gap-1">
            {MENU_ITEMS.map(({ path, labelKey, shortKey }) => {
              const active = route === path;
              return (
                <li key={path}>
                  <button
                    type="button"
                    onClick={() => go(path)}
                    aria-current={active ? 'page' : undefined}
                    className={`cursor-pointer whitespace-nowrap rounded-[10px] border-0 bg-transparent px-2.5 py-2 text-[0.8rem] font-semibold transition-all duration-300 xl:px-3 xl:text-[0.85rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                      active
                        ? 'bg-currena-blue/10 text-currena-blue'
                        : 'text-currena-muted hover:bg-black/5 hover:text-currena-dark'
                    }`}
                  >
                    {t(shortKey ?? labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* Language quick-toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            title={t('nav.toggleLanguage')}
            aria-label={t('nav.toggleLanguage')}
            className="h-10 w-10 cursor-pointer rounded-[10px] border-0 bg-transparent text-sm font-bold text-currena-dark transition-all duration-300 hover:bg-black/5"
          >
            {locale === 'en' ? 'فا' : 'EN'}
          </button>
          {/* Hamburger — mobile/tablet only (the inline nav takes over at lg) */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            className="h-10 w-10 cursor-pointer rounded-[10px] border-0 bg-transparent text-xl text-currena-dark transition-all duration-300 hover:bg-black/5 lg:hidden"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Overlay */}
      {menuOpen ? (
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={() => setMenuOpen(false)}
          className="fade-in fixed inset-x-0 bottom-0 top-16 z-[998] cursor-pointer border-0 bg-black/40 lg:top-20"
        />
      ) : null}

      {/* Side menu — slides from the inline-end edge (fixed to `end-0` so the
          closed state is fully off-screen; the static-position default left
          the translated panel hovering over the page center) */}
      <nav
        aria-label={t('nav.menu')}
        className={`side-menu fixed bottom-0 top-16 end-0 z-[999] w-[280px] overflow-y-auto bg-white p-5 shadow-[-5px_0_20px_rgba(0,0,0,0.1)] lg:top-20 lg:w-[320px] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        <ul className="list-none p-0">
          {MENU_ITEMS.map(({ path, emoji, labelKey }) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => go(path)}
                className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-currena-soft px-3.5 py-3.5 text-[0.95rem] font-medium text-currena-dark transition-all duration-300 hover:bg-currena-blue hover:text-white"
              >
                <span className="text-xl" aria-hidden="true">
                  {emoji}
                </span>
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5"
          >
            <span className="text-lg" aria-hidden="true">
              🌐
            </span>
            {t('nav.language')}: {locale === 'en' ? 'English' : 'فارسی'}
          </button>
        </div>
      </nav>
    </>
  );
}

export { ROUTES };
