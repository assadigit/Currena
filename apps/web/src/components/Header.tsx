/**
 * Header — fixed blur navbar, logo start-side.
 *
 * Responsive navigation (PC/tablet/mobile):
 *   - lg and up: an INLINE horizontal nav renders the 9 routes in the header
 *     itself (text-only pills, active-route highlighted, whitespace-nowrap) —
 *     the hamburger is hidden. This is the desktop "professional" identity.
 *   - below lg (phones + small tablets): the legacy hamburger opens the
 *     slide-in side menu from the inline-end edge (right in LTR, left in RTL)
 *     with the 9 SPA routes + theme & language toggles (legacy parity, §8).
 *
 * Dual theme (owner request 2026-09-17: "I want both light mode and dark
 * mode"): the 🌙/☀️ toggle lives next to the language button in the top bar
 * (all sizes) AND as a labeled row in the side menu. Light is the default;
 * the choice persists under the legacy `theme` key.
 */

import { useRef, useState } from 'react';
import { useRoute } from '../router';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/locale';
import { InstallButton } from './InstallButton';
import { HEADER_ICON_BUTTON_CLASS } from './ui';
import { useDialogFocus } from './useDialogFocus';
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
  { path: '/insights', emoji: '📈', labelKey: 'nav.insights' },
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
  const { theme, toggle } = useTheme();
  const { t, setLocale, locale } = useI18n();
  /** The hamburger — focus returns here when the drawer closes (audit D-6). */
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Drawer focus discipline (QA audit D-6): while the side menu is open, Tab
  // is trapped inside it, Escape closes, focus moves in on open and back to
  // the hamburger on close. The nav stays mounted (it slides), so the
  // `active` flag drives the discipline from menuOpen. No scroll lock — the
  // drawer is a peek-in overlay, not a modal dialog.
  const { containerRef: drawerRef, onKeyDown: drawerKeyDown } = useDialogFocus({
    onClose: () => setMenuOpen(false),
    returnFocusToRef: hamburgerRef,
    active: menuOpen,
    lockScroll: false,
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between gap-2 px-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[20px] lg:h-20 lg:px-6 xl:px-10 bg-white/95 dark:bg-[#161D28]/95">
        {/* Brand (legacy: logo image, 50px mobile; slimmer on desktop so the
            inline nav fits at exactly lg=1024 without wrapping). A REAL
            anchor (audit WS-3 #6): hash navigation is the browser's own —
            the router already listens to hashchange, no double-navigation. */}
        <a
          href="#/"
          aria-label={t('nav.home')}
          className="shrink-0"
        >
          <img src="/images/currena-logo.png" alt="Currena" className="currena-brand-logo h-[50px] w-auto lg:h-[44px]" />
        </a>

        {/* Inline desktop nav (lg+): the 9 routes, compact text-only pills
            (short labels for the four long tool names keep the bar on one
            unwrapped line at exactly lg=1024), active-route highlighted */}
        <nav aria-label={t('app.name')} className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex list-none items-center justify-center gap-0.5 p-0 xl:gap-1">
            {MENU_ITEMS.map(({ path, labelKey, shortKey }) => {
              const active = route === path;
              return (
                <li key={path}>
                  {/* REAL links (audit WS-3 #6): AT users get href semantics
                      (open-in-new-tab, link lists, status bar) and the
                      browser's own Enter/Space activation; the hash router
                      picks the change up natively. */}
                  <a
                    href={`#${path}`}
                    aria-current={active ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[0.8rem] font-semibold no-underline transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue xl:px-3 xl:text-[0.85rem] ${
                      active
                        ? 'bg-currena-blue/10 text-currena-blue'
                        : 'text-currena-muted hover:bg-black/5 hover:text-currena-dark dark:hover:bg-white/5'
                    }`}
                  >
                    {t(shortKey ?? labelKey)}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* Utility group (owner request 2026-09-20): install · language ·
              theme · hamburger — ONE shared bordered icon-button container
              (HEADER_ICON_BUTTON_CLASS) with equal 44px hit areas, so the
              group reads as a single consistent settings row in both themes
              (the former mixed plain-text / plain-emoji / unstyled boxes
              retired). */}
          {/* In-app install CTA (Task 23) — renders ONLY when Chrome has a
              captured beforeinstallprompt and the app isn't already
              standalone; zero footprint otherwise. */}
          <InstallButton variant="icon" />
          {/* Language quick-toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            title={t('nav.toggleLanguage')}
            aria-label={t('nav.toggleLanguage')}
            className={`${HEADER_ICON_BUTTON_CLASS} text-sm font-bold`}
          >
            {locale === 'en' ? 'فا' : 'EN'}
          </button>
          {/* Theme toggle (legacy 🌙/☀️) — light is the default */}
          <button
            type="button"
            onClick={toggle}
            title={t('nav.toggleTheme')}
            aria-label={t('nav.toggleTheme')}
            aria-pressed={theme === 'dark'}
            className={`${HEADER_ICON_BUTTON_CLASS} text-lg`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Hamburger — mobile/tablet only (the inline nav takes over at lg) */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            className={`${HEADER_ICON_BUTTON_CLASS} text-xl lg:hidden`}
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
          the translated panel hovering over the page center). `inert` while
          closed: the off-screen panel is unreachable by Tab AND hidden from
          assistive tech (audit D-6 — off-screen focusables were tabbable). */}
      <nav
        ref={drawerRef}
        aria-label={t('nav.menu')}
        inert={!menuOpen}
        onKeyDown={drawerKeyDown}
        className={`side-menu fixed bottom-0 top-16 end-0 z-[999] w-[280px] overflow-y-auto bg-white p-5 shadow-[-5px_0_20px_rgba(0,0,0,0.1)] dark:bg-[#161D28] lg:top-20 lg:w-[320px] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        <ul className="list-none p-0">
          {MENU_ITEMS.map(({ path, emoji, labelKey }) => (
            <li key={path}>
              {/* REAL links (audit WS-3 #6): href semantics + native
                  activation; the click just closes the drawer — the hash
                  change IS the navigation, exactly once. */}
              <a
                href={`#${path}`}
                onClick={() => setMenuOpen(false)}
                aria-current={route === path ? 'page' : undefined}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-[0.95rem] font-medium no-underline transition-all duration-300 ${
                  route === path
                    ? 'bg-currena-blue text-white'
                    : 'bg-currena-soft text-currena-dark hover:bg-currena-blue hover:text-white'
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {emoji}
                </span>
                {t(labelKey)}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
          {/* Theme row — shows the mode you would switch TO */}
          <button
            type="button"
            onClick={toggle}
            title={t('nav.toggleTheme')}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5"
          >
            <span className="text-lg" aria-hidden="true">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            {theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
          </button>
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
          <InstallButton variant="row" />
        </div>
      </nav>
    </>
  );
}
