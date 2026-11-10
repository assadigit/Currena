/**
 * Header — fixed blur navbar, logo start-side.
 *
 * Page-division S1 (D-45, 2026-11-07): GROUPED navigation.
 *   - lg and up: an INLINE horizontal topbar renders the market
 *     destinations — Global · Gold · World Markets · Currencies ·
 *     Commodities · Regions ▾ (USA · Europe · Asia & Pacific · Australia)
 *     — plus the legacy Insights page (subdued, badged "legacy", D-9/D-46)
 *     and a Tools ▾ dropdown (the converter + the seven utility routes;
 *     the Converter itself now lives at /converter, S1). Two disclosure
 *     dropdowns (Regions, Tools) open on click and close on Escape,
 *     outside-click or item selection; items are REAL links.
 *   - below lg (phones + small tablets): the hamburger opens the
 *     slide-in side drawer with the SAME destinations grouped — Markets ·
 *     Legacy · Tools — plus theme & language toggles (legacy parity, §8).
 *
 * Dual theme (owner request 2026-09-17: "I want both light mode and dark
 * mode"): the 🌙/☀️ toggle lives next to the language button in the top bar
 * (all sizes) AND as a labeled row in the side menu. Light is the default;
 * the choice persists under the legacy `theme` key.
 */

import { useEffect, useRef, useState } from 'react';
import { navigate, useRoute } from '../router';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/locale';
import { InstallButton } from './InstallButton';
import { HEADER_ICON_BUTTON_CLASS } from './ui';
import { useDialogFocus } from './useDialogFocus';
import type { TranslationKey } from '../lib/locale';
import type { RoutePath } from '../router';

/** One nav link — REAL anchor semantics (audit WS-3 #6). */
interface NavLink {
  path: RoutePath;
  emoji: string;
  labelKey: TranslationKey;
}

/** The five primary market destinations (D-45 order). */
const MARKET_LINKS: readonly { path: RoutePath; labelKey: TranslationKey }[] = [
  { path: '/', labelKey: 'nav.global' },
  { path: '/gold', labelKey: 'nav.gold' },
  { path: '/world-markets', labelKey: 'nav.worldMarkets' },
  { path: '/currencies', labelKey: 'nav.currencies' },
  { path: '/commodities', labelKey: 'nav.commodities' },
];

/** The Regions ▾ group (D-45): the four region destinations. */
const REGION_LINKS: readonly NavLink[] = [
  { path: '/usa', emoji: '🇺🇸', labelKey: 'nav.usa' },
  { path: '/europe', emoji: '🇪🇺', labelKey: 'nav.europe' },
  { path: '/asia-pacific', emoji: '🌏', labelKey: 'nav.asiaPacific' },
  { path: '/australia', emoji: '🇦🇺', labelKey: 'nav.australia' },
];

/** The Tools ▾ group: the converter (its new home, S1) + the utility routes. */
const TOOL_LINKS: readonly NavLink[] = [
  { path: '/converter', emoji: '💱', labelKey: 'nav.converter' },
  { path: '/live-rates', emoji: '📊', labelKey: 'nav.liveRates' },
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter' },
  { path: '/about', emoji: 'ℹ️', labelKey: 'nav.about' },
];

/** The drawer's flat Markets group: the five primaries + the four regions. */
const DRAWER_MARKET_LINKS: readonly NavLink[] = [
  { path: '/', emoji: '🌐', labelKey: 'nav.global' },
  { path: '/gold', emoji: '🥇', labelKey: 'nav.gold' },
  { path: '/world-markets', emoji: '🗺️', labelKey: 'nav.worldMarkets' },
  { path: '/currencies', emoji: '💱', labelKey: 'nav.currencies' },
  { path: '/commodities', emoji: '🛢️', labelKey: 'nav.commodities' },
  ...REGION_LINKS,
];

/** Route sets for dropdown-trigger active states. */
const REGION_PATHS: ReadonlySet<string> = new Set(REGION_LINKS.map((l) => l.path));
const TOOL_PATHS: ReadonlySet<string> = new Set(TOOL_LINKS.map((l) => l.path));

/** Shared pill styling for the lg+ inline topbar (compact — the bar must
 *  stay on one unwrapped line at exactly lg=1024, house precedent). */
const PILL_BASE =
  'whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[0.8rem] font-semibold no-underline transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue xl:px-3 xl:text-[0.85rem]';
const PILL_ACTIVE = 'bg-currena-blue/10 text-currena-blue';
const PILL_IDLE = 'text-currena-muted hover:bg-black/5 hover:text-currena-dark dark:hover:bg-white/5';

/**
 * A topbar disclosure dropdown (Regions ▾ / Tools ▾). Opens on click;
 * closes on Escape (focus returns to the trigger), on an outside click,
 * and on item selection. Items are REAL links — AT users get href
 * semantics and the browser's own Enter/Space activation (audit WS-3 #6).
 * While open the items sit in the normal tab order (disclosure pattern).
 */
function NavDropdown({
  label,
  items,
  active,
}: {
  label: string;
  items: readonly NavLink[];
  /** The current route lives inside this group → highlight the trigger. */
  active: boolean;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();
  const route = useRoute();

  // Outside-click closes (document-level; the li contains both trigger and
  // menu, so clicks inside never reach here as "outside").
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (itemRef.current !== null && !itemRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <li ref={itemRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            setOpen(false);
            buttonRef.current?.focus();
          }
        }}
        className={`cursor-pointer border-0 bg-transparent ${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE} ${
          open ? 'bg-black/5 dark:bg-white/5' : ''
        }`}
      >
        {label}
        {/* Direction-neutral caret; rotates when open (a live affordance). */}
        <span
          aria-hidden="true"
          className={`ms-0.5 inline-block text-[0.6rem] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul className="absolute top-full start-0 z-[1001] mt-1.5 min-w-[200px] list-none rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.15)] dark:border-white/15 dark:bg-[#1A222E]">
          {items.map(({ path, emoji, labelKey }) => {
            const itemActive = route === path;
            return (
              <li key={path}>
                <a
                  href={path}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    navigate(path);
                  }}
                  aria-current={itemActive ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-[0.85rem] font-semibold no-underline transition-all duration-200 ${
                    itemActive
                      ? 'bg-currena-blue/10 text-currena-blue'
                      : 'text-currena-dark hover:bg-currena-soft'
                  }`}
                >
                  <span className="text-base" aria-hidden="true">
                    {emoji}
                  </span>
                  {t(labelKey)}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

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

  /** One drawer row — REAL link, closes the drawer, routes the path router
 *  exactly once, no reload (house pattern, audit WS-3 #6). */
  const drawerRow = ({ path, emoji, labelKey }: NavLink): React.JSX.Element => (
    <a
      href={path}
      onClick={(e) => {
        e.preventDefault();
        setMenuOpen(false);
        navigate(path);
      }}
      aria-current={route === path ? 'page' : undefined}
      className={`mb-2 flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-medium no-underline transition-all duration-300 ${
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
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between gap-2 px-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[20px] lg:h-20 lg:px-6 xl:px-10 bg-white/95 dark:bg-[#161D28]/95">
        {/* Brand (legacy: logo image, 50px mobile; slimmer on desktop so the
            inline nav fits at exactly lg=1024 without wrapping). A REAL
            anchor (audit WS-3 #6): href semantics for AT + the browser's
            own Enter/Space activation; onClick preventDefault routes
            through the path router's navigate() (no full reload). The
            brand goes HOME — since S1 that is the Global scan (D-20). */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          aria-label={t('nav.home')}
          className="shrink-0"
        >
          <img src="/images/currena-logo.png" alt="Currena" className="currena-brand-logo h-[50px] w-auto lg:h-[44px]" />
        </a>

        {/* Inline desktop topbar (lg+): the grouped market destinations
            (D-45) + the legacy Insights pill + the Tools disclosure. */}
        <nav aria-label={t('app.name')} className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex list-none items-center justify-center gap-0.5 p-0 xl:gap-1">
            {MARKET_LINKS.map(({ path, labelKey }) => {
              const active = route === path;
              return (
                <li key={path}>
                  <a
                    href={path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(path);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                  >
                    {t(labelKey)}
                  </a>
                </li>
              );
            })}
            <NavDropdown label={t('nav.regions')} items={REGION_LINKS} active={REGION_PATHS.has(route)} />
            {/* The legacy all-in-one page — subdued, badged, still first
                class: every destination's content lives here until its
                build session (D-9/D-46). */}
            <li>
              <a
                href="/insights"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/insights');
                }}
                aria-current={route === '/insights' ? 'page' : undefined}
                title={t('nav.legacyBadge')}
                className={`${PILL_BASE} ${
                  route === '/insights' ? PILL_ACTIVE : 'text-currena-muted/80 hover:bg-black/5 hover:text-currena-dark dark:hover:bg-white/5'
                }`}
              >
                {t('nav.insights')}
                <span className="ms-1 hidden rounded-full bg-currena-soft px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-currena-muted xl:inline">
                  {t('nav.legacyBadge')}
                </span>
              </a>
            </li>
            <NavDropdown label={t('nav.tools')} items={TOOL_LINKS} active={TOOL_PATHS.has(route)} />
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
          {/* Language quick-toggle — S19 (HANDOFF item 6's polish): the
              visible label stays the TARGET language's own word ('فا' in
              en · 'EN' in fa) and the accessible name + tooltip now NAME
              THE TARGET in the current locale's language (nav.switchToFa /
              nav.switchToEn — clearer for assistive tech than the old
              generic "Toggle language"). */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            title={t(locale === 'en' ? 'nav.switchToFa' : 'nav.switchToEn')}
            aria-label={t(locale === 'en' ? 'nav.switchToFa' : 'nav.switchToEn')}
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
          {/* Hamburger — mobile/tablet only (the inline topbar takes over at lg) */}
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
          assistive tech (audit D-6 — off-screen focusables were tabbable).
          S1: the rows are GROUPED — Markets (the nine destinations) ·
          Legacy (Insights) · Tools (the converter utilities). */}
      <nav
        ref={drawerRef}
        aria-label={t('nav.menu')}
        inert={!menuOpen}
        onKeyDown={drawerKeyDown}
        className={`side-menu fixed bottom-0 top-16 end-0 z-[999] w-[280px] overflow-y-auto bg-white p-5 shadow-[-5px_0_20px_rgba(0,0,0,0.1)] dark:bg-[#161D28] lg:top-20 lg:w-[320px] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        {/* Markets group — the page-division destinations (D-45). */}
        <p className="mb-2 px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-currena-muted">
          {t('nav.marketsGroup')}
        </p>
        <ul className="list-none p-0">{DRAWER_MARKET_LINKS.map((l) => (
          <li key={l.path}>{drawerRow(l)}</li>
        ))}</ul>

        {/* Legacy group — the all-in-one page, complete until retirement
            (D-9/D-46). */}
        <p className="mb-2 mt-4 px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-currena-muted">
          {t('nav.legacyBadge')}
        </p>
        <ul className="list-none p-0">
          <li>
            <a
              href="/insights"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                navigate('/insights');
              }}
              aria-current={route === '/insights' ? 'page' : undefined}
              className="mb-2 flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-medium no-underline transition-all duration-300 ${
                route === '/insights'
                  ? 'bg-currena-blue text-white'
                  : 'bg-currena-soft text-currena-dark hover:bg-currena-blue hover:text-white'
              }"
            >
              <span className="text-xl" aria-hidden="true">
                📈
              </span>
              {t('nav.insights')}
            </a>
          </li>
        </ul>

        {/* Tools group — the converter + the utility routes. */}
        <p className="mb-2 mt-4 px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-currena-muted">
          {t('nav.tools')}
        </p>
        <ul className="list-none p-0">{TOOL_LINKS.map((l) => (
          <li key={l.path}>{drawerRow(l)}</li>
        ))}</ul>

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
