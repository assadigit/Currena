"use client";

/**
 * Compound Wealth — the tools pages' site chrome.
 *
 * The header and footer ARE the site's own chrome now
 * (src/components/site/chrome.tsx): the real logo, the real nav,
 * the real side drawer and the real footer of currena.ir, so every
 * /tools page reads as a true sub-page of the site. The old
 * self-made replica header (the coin mark + pill nav) is retired.
 * The breadcrumb stays — it is page content, not site chrome — and
 * the language state (read-only, the spec's no-storage rule) is
 * still owned here.
 */

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
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
  /* The site's own header — every tools page is a sub-page of
     currena.ir, so it wears the site's header with the Tools nav
     item lit. (The copy's old nav strings are no longer drawn; the
     prop stays so every existing call site keeps typing.) */
  void copy;
  return <SiteHeader locale={locale} onToggleLang={onToggleLang} active="tools" />;
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

export function ToolsFooter({ copy, locale }: { copy: ToolsChromeCopy; locale: Locale }) {
  /* The site's own footer, held to the viewport bottom by the
     shell's flex column (the old rights/disclaimer lines live on in
     each tool page's own body where they belong). */
  void copy;
  return <SiteFooter locale={locale} stickToBottom />;
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
