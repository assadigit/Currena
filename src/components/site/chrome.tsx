"use client";

/**
 * The Currena site chrome — the header and footer of currena.ir itself,
 * restated for the pages this desk serves (currena.ir/gold and
 * currena.ir/tools), so they read as true sub-pages of the site: the
 * site's own logo image (served by the main site at
 * /images/currena-logo.png, with a local copy for the dev server),
 * the site's own nav (Global · Gold · World Markets · Currencies ·
 * Commodities · Regions ▾ · Tools ▾), the site's own side drawer and
 * the site's own footer — the markup, classes, palette variables
 * (which flip in dark mode exactly like the main site's) and
 * bilingual labels taken from the live site verbatim.
 *
 * The Regions and Tools buttons, and the mobile ☰, open the site's
 * side drawer. Its Tools section points every tool at the consolidated
 * /tools suite on this desk (the owner's consolidation instruction);
 * History and About — tools this desk does not carry — point at the
 * main site's own pages, as every Markets item does.
 */

import * as React from "react";
import { useTheme } from "next-themes";
import type { Locale } from "@/lib/compound/content";

/* ------------------------------------------------------------------ *
 * The copy — every label exactly as the main site says it.            *
 * ------------------------------------------------------------------ */

const HEADER = {
  en: {
    navAria: "Currena",
    home: "Global",
    gold: "Gold",
    worldMarkets: "World Markets",
    currencies: "Currencies",
    commodities: "Commodities",
    regions: "Regions",
    tools: "Tools",
    switchToFarsi: "Switch to Farsi",
    toggleTheme: "Toggle theme",
    menu: "Menu",
    skipToContent: "Skip to main content",
  },
  fa: {
    navAria: "کورنا",
    home: "جهانی",
    gold: "طلا",
    worldMarkets: "بازارهای جهانی",
    currencies: "ارزها",
    commodities: "کالاها",
    regions: "مناطق",
    tools: "ابزارها",
    switchToFarsi: "تغییر به انگلیسی",
    toggleTheme: "تغییر حالت نمایش",
    menu: "منو",
    skipToContent: "پرش به محتوای اصلی",
  },
} as const;

const DRAWER = {
  en: {
    menuAria: "Menu",
    marketsSection: "Markets",
    toolsSection: "Tools",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    languageLine: "Language: English",
  },
  fa: {
    menuAria: "منو",
    marketsSection: "بازارها",
    toolsSection: "ابزارها",
    darkMode: "حالت تیره",
    lightMode: "حالت روشن",
    languageLine: "زبان: فارسی",
  },
} as const;

type DrawerItem = { emoji: string; label: [string, string]; href: string };

/** The Markets section — the main site's own pages, linked as the
 *  main site links them. */
const MARKETS_ITEMS: ReadonlyArray<DrawerItem> = [
  { emoji: "🌐", label: ["Global", "جهانی"], href: "/" },
  { emoji: "🥇", label: ["Gold", "طلا"], href: "/gold" },
  { emoji: "🗺️", label: ["World Markets", "بازارهای جهانی"], href: "/world-markets" },
  { emoji: "💱", label: ["Currencies", "ارزها"], href: "/currencies" },
  { emoji: "🛢️", label: ["Commodities", "کالاها"], href: "/commodities" },
  { emoji: "🇺🇸", label: ["USA", "آمریکا"], href: "/usa" },
  { emoji: "🇪🇺", label: ["Europe", "اروپا"], href: "/europe" },
  { emoji: "🌏", label: ["Asia & Pacific", "آسیا و اقیانوسیه"], href: "/asia-pacific" },
  { emoji: "🇦🇺", label: ["Australia", "استرالیا"], href: "/australia" },
  { emoji: "🔗", label: ["Linkages", "پیوندها"], href: "/economic-linkages" },
];

/** The Tools section — the main site's own tool list, each entry
 *  pointed at the consolidated /tools suite this desk serves (the
 *  owner's consolidation instruction); History and About, which this
 *  desk does not carry, stay on the main site's own pages; the three
 *  suite-only entries (the hub, Compound Wealth, Gold Calculators)
 *  complete the consolidated family. */
const TOOLS_ITEMS: ReadonlyArray<DrawerItem> = [
  { emoji: "💱", label: ["Converter", "مبدل ارز"], href: "/tools/currency-converter" },
  { emoji: "📊", label: ["Live Rates", "نرخ‌های لحظه‌ای"], href: "/tools/live-rates" },
  { emoji: "🧮", label: ["Calculator", "ماشین‌حساب"], href: "/tools/currency-calculator" },
  { emoji: "📜", label: ["History", "تاریخچه"], href: "/history" },
  { emoji: "📄", label: ["Receipt Generator", "ساخت رسید"], href: "/tools/exchange-receipt" },
  { emoji: "💰", label: ["Expense Splitter", "تقسیم هزینه‌ها"], href: "/tools/dang" },
  { emoji: "👥", label: ["Split & Settle", "تسویهٔ گروهی"], href: "/tools/group-settlement" },
  { emoji: "🛒", label: ["Batch Converter", "تبدیل گروهی ارزها"], href: "/tools/batch-converter" },
  { emoji: "🧰", label: ["All Tools", "همهٔ ابزارها"], href: "/tools" },
  { emoji: "📈", label: ["Compound Wealth", "ثروت مرکب"], href: "/tools/compound-wealth" },
  { emoji: "🏅", label: ["Gold Calculators", "محاسبه‌گرهای طلا"], href: "/tools/gold-calculators" },
  { emoji: "ℹ️", label: ["About", "دربارهٔ ما"], href: "/about" },
];

const FOOTER = {
  en: {
    made: "Made with ❤️ by Ali Assadi",
    aboutAria: "About",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    about: "About",
  },
  fa: {
    made: "ساخته‌شده با ❤️ به دست علی اسعدی",
    aboutAria: "دربارهٔ ما",
    privacy: "حریم خصوصی",
    terms: "شرایط استفاده",
    contact: "تماس با ما",
    about: "دربارهٔ ما",
  },
} as const;

/* ------------------------------------------------------------------ *
 * The shared class strings — taken from the live site's own markup.   *
 * ------------------------------------------------------------------ */

const NAV_LINK =
  "whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[0.8rem] font-semibold no-underline transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-currena-blue)] xl:px-3 xl:text-[0.85rem]";
const NAV_IDLE =
  "text-[var(--color-currena-muted)] hover:bg-black/5 hover:text-[var(--color-currena-dark)] dark:hover:bg-white/5";
const NAV_ACTIVE = "bg-[var(--currena-blue-a10)] text-[var(--color-currena-blue)]";
const NAV_DROPDOWN = "cursor-pointer border-0 bg-transparent " + NAV_LINK + " " + NAV_IDLE;
const HEADER_BUTTON =
  "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-black/10 bg-black/[0.03] text-[var(--color-currena-dark)] transition-all duration-300 hover:border-black/25 hover:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-currena-blue)] dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-white/30 dark:hover:bg-white/[0.12]";
const DRAWER_ITEM =
  "mb-2 flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-medium no-underline transition-all duration-300";
const DRAWER_IDLE =
  "bg-[var(--color-currena-soft)] text-[var(--color-currena-dark)] hover:bg-[var(--color-currena-blue)] hover:text-white";
const DRAWER_ACTIVE = "bg-[var(--color-currena-blue)] text-white";
const DRAWER_SECTION =
  "mb-2 px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--color-currena-muted)]";
const DRAWER_TOGGLE =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-[var(--color-currena-muted)] transition-all duration-300 hover:bg-[var(--currena-blue-a5)]";
const FOOTER_LINK =
  "inline-flex cursor-pointer items-center border-0 bg-transparent py-2 font-semibold text-[var(--color-currena-blue)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-currena-blue)]";

/* ------------------------------------------------------------------ *
 * The header.                                                          *
 * ------------------------------------------------------------------ */

export function SiteHeader({
  locale,
  onToggleLang,
  active,
}: {
  locale: Locale;
  onToggleLang: () => void;
  /** The nav item the current page lights up: the gold page says
   *  "gold", every /tools page says "tools". */
  active?: "home" | "gold" | "tools";
}) {
  const t = HEADER[locale];
  const d = DRAWER[locale];
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [pathname, setPathname] = React.useState("");
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setPathname(window.location.pathname), []);

  const dark = mounted && resolvedTheme === "dark";
  const toggleMenu = React.useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const itemLabel = (item: DrawerItem) => item.label[locale === "fa" ? 1 : 0];
  const itemActive = (item: DrawerItem) =>
    pathname !== "" && (item.href === "/" ? pathname === "/" : pathname === item.href);
  const drawerItemClass = (item: DrawerItem) =>
    DRAWER_ITEM + " " + (itemActive(item) ? DRAWER_ACTIVE : DRAWER_IDLE);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[1002] focus:rounded-lg focus:bg-[var(--color-currena-blue)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:no-underline"
      >
        {t.skipToContent}
      </a>

      <header className="sticky top-0 z-[1000] flex h-16 items-center justify-between gap-2 px-5 shadow-[0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[20px] lg:h-20 lg:px-6 xl:px-10 bg-white/95 dark:bg-[#161D28]/95">
        {/* The site's own logo — the main site's image, linked home
            exactly as the main site links it. */}
        <a href="/" aria-label="Home" className="shrink-0">
          <img
            alt="Currena"
            className="currena-brand-logo h-[50px] w-auto lg:h-[44px]"
            src="/images/currena-logo.png"
          />
        </a>

        <nav aria-label={t.navAria} className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex list-none items-center justify-center gap-0.5 p-0 xl:gap-1">
            <li>
              <a
                href="/"
                className={NAV_LINK + " " + (active === "home" ? NAV_ACTIVE : NAV_IDLE)}
              >
                {t.home}
              </a>
            </li>
            <li>
              <a
                href="/gold"
                className={NAV_LINK + " " + (active === "gold" ? NAV_ACTIVE : NAV_IDLE)}
              >
                {t.gold}
              </a>
            </li>
            <li>
              <a href="/world-markets" className={NAV_LINK + " " + NAV_IDLE}>
                {t.worldMarkets}
              </a>
            </li>
            <li>
              <a href="/currencies" className={NAV_LINK + " " + NAV_IDLE}>
                {t.currencies}
              </a>
            </li>
            <li>
              <a href="/commodities" className={NAV_LINK + " " + NAV_IDLE}>
                {t.commodities}
              </a>
            </li>
            <li className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={toggleMenu}
                className={NAV_DROPDOWN}
              >
                {t.regions}
                <span
                  aria-hidden="true"
                  className={
                    "ms-0.5 inline-block text-[0.6rem] transition-transform duration-200 " +
                    (menuOpen ? "rotate-180" : "")
                  }
                >
                  ▾
                </span>
              </button>
            </li>
            <li className="relative">
              {/* W6 (spec §3): the header "Tools" item is a real link to
                  /tools. The ▾ caret stays its own button so the site's
                  side drawer keeps working from the header exactly as
                  before. The link shares the pill's own styling. */}
              <span
                className={
                  "inline-flex items-center gap-0.5 " + NAV_LINK + " " +
                  (active === "tools" ? NAV_ACTIVE : NAV_IDLE)
                }
              >
                <a
                  href="/tools"
                  className={
                    "border-0 bg-transparent " +
                    (active === "tools" ? "text-[var(--color-currena-blue)]" : "text-inherit")
                  }
                >
                  {t.tools}
                </a>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  aria-label={`${t.tools} ${locale === "en" ? "menu" : "منو"}`}
                  onClick={toggleMenu}
                  className="inline-block border-0 bg-transparent text-[0.6rem] text-[var(--color-currena-muted)] transition-transform duration-200"
                >
                  <span
                    aria-hidden="true"
                    className={"inline-block " + (menuOpen ? "rotate-180" : "")}
                  >
                    ▾
                  </span>
                </button>
              </span>
            </li>
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <button
            type="button"
            title={t.switchToFarsi}
            /* Label-in-name (v8, carried from the compound test report's
               owner decisions): the visible "فا"/"EN" text opens the
               accessible name, so speech-input users can say what they
               see. No visual change. */
            aria-label={`${locale === "en" ? "فا" : "EN"} — ${t.switchToFarsi}`}
            onClick={onToggleLang}
            className={HEADER_BUTTON + " text-sm font-bold"}
          >
            {locale === "en" ? "فا" : "EN"}
          </button>
          <button
            type="button"
            title={t.toggleTheme}
            aria-label={t.toggleTheme}
            aria-pressed={dark}
            onClick={() => setTheme(dark ? "light" : "dark")}
            className={HEADER_BUTTON + " text-lg"}
          >
            {mounted ? (dark ? "☀️" : "🌙") : "🌙"}
          </button>
          <button
            type="button"
            aria-label={t.menu}
            aria-expanded={menuOpen}
            onClick={toggleMenu}
            className={HEADER_BUTTON + " text-xl lg:hidden"}
          >
            ☰
          </button>
        </div>
      </header>

      {/* The click-catcher — a tap outside the drawer closes it. */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[998]" onClick={closeMenu} aria-hidden="true" />
      ) : null}

      {/* The site's side drawer — the same panel the main site's
          Regions, Tools and ☰ buttons open, classes verbatim. */}
      <nav
        aria-label={d.menuAria}
        inert={!menuOpen}
        className={
          "side-menu fixed bottom-0 top-16 end-0 z-[999] w-[280px] overflow-y-auto bg-white p-5 shadow-[-5px_0_20px_rgba(0,0,0,0.1)] dark:bg-[#161D28] lg:top-20 lg:w-[320px] transition-transform duration-300 " +
          (menuOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full")
        }
      >
        <p className={DRAWER_SECTION}>{d.marketsSection}</p>
        <ul className="list-none p-0">
          {MARKETS_ITEMS.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={drawerItemClass(item)}>
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                {itemLabel(item)}
              </a>
            </li>
          ))}
        </ul>
        <p className={DRAWER_SECTION + " mt-4"}>{d.toolsSection}</p>
        <ul className="list-none p-0">
          {TOOLS_ITEMS.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={drawerItemClass(item)}>
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                {itemLabel(item)}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
          <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className={DRAWER_TOGGLE}>
            <span className="text-lg" aria-hidden="true">
              {mounted ? (dark ? "☀️" : "🌙") : "🌙"}
            </span>
            {dark ? d.lightMode : d.darkMode}
          </button>
          <button type="button" onClick={onToggleLang} className={DRAWER_TOGGLE}>
            <span className="text-lg" aria-hidden="true">
              🌐
            </span>
            {d.languageLine}
          </button>
        </div>
      </nav>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The footer — the site's own footer, verbatim.                        *
 * ------------------------------------------------------------------ */

export function SiteFooter({
  locale,
  stickToBottom,
}: {
  locale: Locale;
  /** Keep the footer at the viewport bottom on short pages (the
   *  sticky-footer contract the tools shell and the gold page use). */
  stickToBottom?: boolean;
}) {
  const t = FOOTER[locale];
  return (
    <footer
      className={
        "app-footer px-5 py-5 text-center text-xs text-[var(--color-currena-muted)] opacity-80" +
        (stickToBottom ? " mt-auto" : "")
      }
    >
      <p className="mb-1.5">{t.made}</p>
      <nav
        aria-label={t.aboutAria}
        className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1"
      >
        <a href="/about#privacy" className={FOOTER_LINK}>
          {t.privacy}
        </a>
        <span aria-hidden="true">·</span>
        <a href="/about#terms" className={FOOTER_LINK}>
          {t.terms}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/assadigit"
          target="_blank"
          rel="noopener noreferrer"
          className={FOOTER_LINK}
        >
          {t.contact}
        </a>
        <span aria-hidden="true">·</span>
        <a href="/about" className={FOOTER_LINK}>
          {t.about}
        </a>
      </nav>
    </footer>
  );
}
