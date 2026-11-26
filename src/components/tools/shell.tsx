"use client";

/**
 * The tools family's page shell — one frame for every tool page: the
 * compound tool's chrome (header, footer, language and theme handling)
 * with the registry's own name in the breadcrumb and the tab. A tool
 * page becomes: `export default () => <ToolPage tool="dang">…</ToolPage>`.
 */

import * as React from "react";
import {
  ToolsBreadcrumb,
  ToolsFooter,
  ToolsHeader,
  useSiteLocale,
} from "@/components/compound/chrome";
import { TOOLS_COPY } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { findTool } from "@/lib/tools/registry";
import type { ToolsChromeCopy } from "@/components/compound/chrome";

export function ToolPage({
  tool,
  children,
  wide,
}: {
  tool: string;
  /** Static children, or a render prop that receives the page's locale —
   *  so a tool's body reads the same language the chrome speaks. */
  children: React.ReactNode | ((locale: Locale) => React.ReactNode);
  /** The default column is the compound tool's; the gold hub asks for
   *  a little more room (its four sections breathe at 860px). */
  wide?: boolean;
}) {
  const [locale, toggleLang] = useSiteLocale();
  const copy = TOOLS_COPY[locale];
  const entry = findTool(tool);
  const title = entry ? (locale === "fa" ? entry.fa.title : entry.en.title) : tool;

  const chromeCopy: ToolsChromeCopy = {
    nav: copy.nav,
    tool: {
      title,
      disclaimer: copy.footer.disclaimer,
      footer: { rights: copy.footer.rights },
    },
  };

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = copy.dir;
    document.title = locale === "fa" ? `${title} · کورنا` : `${title} · Currena`;
  }, [locale, copy.dir, title]);

  return (
    <div
      dir={copy.dir}
      lang={locale}
      className="tools-root flex min-h-screen flex-col bg-[var(--color-currena-bg-light)]"
    >
      <span id="top" />
      <ToolsHeader copy={chromeCopy} locale={locale} onToggleLang={toggleLang} />

      <main
        id="main-content"
        className={`mx-auto w-full flex-1 px-3 py-4 sm:px-6 sm:py-5 ${
          wide ? "max-w-[560px] sm:max-w-[680px] lg:max-w-[860px]" : "max-w-[560px] sm:max-w-[680px] lg:max-w-[800px]"
        }`}
      >
        <ToolsBreadcrumb copy={chromeCopy} locale={locale} />
        {typeof children === "function" ? children(locale) : children}
      </main>

      <ToolsFooter copy={chromeCopy} locale={locale} />
    </div>
  );
}

/** A tool page's own header block (title + one-line promise), so every
 *  page opens the way the compound tool does. */
export function ToolIntro({
  title,
  promise,
  eyebrow,
}: {
  title: string;
  promise: string;
  eyebrow?: string;
}) {
  return (
    <header className="mt-2 mb-4">
      {eyebrow ? (
        <p className="type-kicker m-0 text-[var(--color-text-tertiary)]">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h1>
      <p className="mt-1 mb-0 text-[13.5px] text-[var(--color-text-secondary)]">{promise}</p>
    </header>
  );
}
