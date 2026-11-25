"use client";

/**
 * Compound Wealth — the tools pages' site chrome.
 *
 * The gold page's own header/footer, restated small for the tools
 * namespace so nothing in the gold page itself has to move: same tokens,
 * same mark, same language and theme toggles, a real "Tools" nav chip
 * (this namespace's own page), and the sticky-footer layout contract
 * (min-h-screen flex column, mt-auto footer).
 */

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronRight } from "lucide-react";
import type { CompoundCopy, Locale } from "@/lib/compound/content";

/**
 * The structural subset of the copy the tools chrome reads — every
 * tools-family page passes one of these (the compound tool passes its
 * full CompoundCopy, which satisfies it structurally; the rest of the
 * tools build theirs from src/lib/tools/copy.ts + registry).
 */
export interface ToolsChromeCopy {
  nav: {
    site: string;
    tagline: string;
    tools: string;
    langToggle: string;
    backToTools: string;
  };
  tool: {
    title: string;
    /** The footer's second line. */
    disclaimer: string;
    footer: { rights: string; madeInBrowser?: string };
  };
}

/** The Currena mark (the gold page's own coin, byte-faithful). */
export function CurrenaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cwCrCoin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--bal-brass-hi)" />
          <stop offset="0.55" stopColor="var(--bal-brass-mid)" />
          <stop offset="1" stopColor="var(--bal-brass-lo)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill="url(#cwCrCoin)" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="var(--bal-brass-ink)" strokeWidth="1.2" opacity="0.5" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="var(--bal-brass-ink)" strokeWidth="1" opacity="0.35" />
      <rect x="12" y="17" width="3.2" height="7" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="17.2" y="13" width="3.2" height="11" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="22.4" y="15.4" width="3.2" height="8.6" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="27" y="18.6" width="3" height="5.4" rx="1.2" fill="var(--bal-brass-ink)" opacity="0.75" />
    </svg>
  );
}

export function ToolsHeader({
  copy,
  locale,
  onToggleLang,
}: {
  copy: ToolsChromeCopy;
  locale: Locale;
  onToggleLang: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center gap-3 px-3 sm:px-6 lg:h-20 lg:px-8">
        {/* The link home is the site's own converter (the existing page,
            untouched) — the tools namespace only ever points out. */}
        <a href="https://currena.ir/" className="flex items-center gap-2.5">
          <CurrenaMark className="h-9 w-9 lg:h-10 lg:w-10" />
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)] lg:text-[1.2rem]">
              {copy.nav.site}
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold text-[var(--color-accent-gold-deep)]">{copy.nav.tagline}</span>
          </span>
        </a>
        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Site">
          <span className="rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-sm font-bold text-[var(--color-currena-blue-deep)]">
            {copy.nav.tools}
          </span>
          <a
            href="https://currena.ir/gold"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Gold
          </a>
        </nav>
        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={locale === "en" ? "فارسی" : "English"}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-[var(--color-currena-soft)] px-3 text-sm font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            {copy.nav.langToggle}
          </button>
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Light mode" : "Dark mode"}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            {mounted ? (dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />) : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/** The "← Tools" breadcrumb (spec §3, navigation) — the label is the
 *  page's own title, so every tool page can carry its own name. */
export function ToolsBreadcrumb({ copy, locale }: { copy: ToolsChromeCopy; locale: Locale }) {
  return (
    <nav className="flex items-center gap-1.5 type-caption text-[var(--color-text-tertiary)]" aria-label={locale === "en" ? "Breadcrumb" : "مسیر"}>
      <a
        href="/tools"
        className="font-bold text-[var(--color-currena-blue-deep)] hover:underline"
        data-cw="tools-link"
      >
        {copy.nav.backToTools}
      </a>
      <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
      <span aria-current="page">{copy.tool.title}</span>
    </nav>
  );
}

export function ToolsFooter({ copy }: { copy: ToolsChromeCopy }) {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-[1080px] px-3 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="type-caption text-[var(--color-text-tertiary)]">{copy.tool.footer.rights}</span>
          <span className="type-caption text-[var(--color-text-tertiary)]">{copy.tool.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}

/**
 * The language state the tools pages share: SSR renders English (the
 * hydration-safe default, exactly like the gold page), and after mount
 * the reader's stored site choice is READ — never written (the spec
 * forbids the tool from storing anything; the gold page's own toggle
 * keeps owning the persistence).
 */
export function useSiteLocale(): [Locale, () => void] {
  const [locale, setLocale] = React.useState<Locale>("en");
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("currena-gold-locale");
      if (saved === "fa" || saved === "en") setLocale(saved);
    } catch {
      /* private mode — English stands */
    }
  }, []);
  const toggle = React.useCallback(() => {
    setLocale((l) => (l === "en" ? "fa" : "en"));
  }, []);
  return [locale, toggle];
}
