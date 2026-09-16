/**
 * Header + slide-in side menu — legacy parity (FEATURE_MAP §8):
 * fixed 65px (80px desktop) blur navbar, logo start-side, theme toggle +
 * hamburger end-side; the menu slides in from the inline-end edge (right in
 * LTR, left in RTL) with the 9 SPA routes + theme/language toggles.
 */

import { useState } from 'react';
import { navigate, ROUTES } from '../router';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import type { RoutePath } from '../router';

const MENU_ITEMS: readonly { path: RoutePath; emoji: string; labelKey: TranslationKey }[] = [
  { path: '/', emoji: '🏠', labelKey: 'nav.home' },
  { path: '/live-rates', emoji: '📊', labelKey: 'nav.liveRates' },
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter' },
  { path: '/about', emoji: 'ℹ️', labelKey: 'nav.about' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const go = (path: RoutePath): void => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between px-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[20px] lg:h-20 lg:px-15 bg-white/95 dark:bg-currena-bg-dark/95">
        {/* Brand (legacy: logo image, 50px mobile / 60px desktop) */}
        <button
          type="button"
          onClick={() => go('/')}
          aria-label={t('nav.home')}
          className="cursor-pointer bg-transparent border-0 p-0"
        >
          <img src="/images/currena-logo.png" alt="Currena" className="h-[50px] w-auto lg:h-[60px]" />
        </button>

        <div className="flex items-center gap-3">
          {/* Language quick-toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            title={t('nav.toggleLanguage')}
            aria-label={t('nav.toggleLanguage')}
            className="h-10 w-10 cursor-pointer rounded-[10px] border-0 bg-transparent text-sm font-bold text-currena-dark transition-all duration-300 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            {locale === 'en' ? 'فا' : 'EN'}
          </button>
          {/* Theme toggle (legacy 🌙/☀️) */}
          <button
            type="button"
            onClick={toggle}
            title={t('nav.toggleTheme')}
            aria-label={t('nav.toggleTheme')}
            className="h-10 w-10 cursor-pointer rounded-[10px] border-0 bg-transparent text-lg text-currena-dark transition-all duration-300 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            className="h-10 w-10 cursor-pointer rounded-[10px] border-0 bg-transparent text-xl text-currena-dark transition-all duration-300 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
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

      {/* Side menu — slides from the inline-end edge */}
      <nav
        aria-label={t('nav.home')}
        className={`side-menu fixed bottom-0 top-16 z-[999] w-[280px] overflow-y-auto bg-white p-5 shadow-[-5px_0_20px_rgba(0,0,0,0.1)] lg:top-20 lg:w-[320px] dark:bg-currena-bg-dark ${
          menuOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        <ul className="list-none p-0">
          {MENU_ITEMS.map(({ path, emoji, labelKey }) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => go(path)}
                className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-currena-soft px-3.5 py-3.5 text-[0.95rem] font-medium text-currena-dark transition-all duration-300 hover:bg-currena-blue hover:text-white dark:bg-white/5 dark:text-white"
              >
                <span className="text-xl" aria-hidden="true">
                  {emoji}
                </span>
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5 dark:text-white/70"
          >
            <span className="text-lg" aria-hidden="true">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            {t('nav.toggleTheme')}
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5 dark:text-white/70"
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
