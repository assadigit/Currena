"use client";

/**
 * The /tools index — the consolidation the owner asked for: every tool
 * on currena.ir/tools, read from the one registry (src/lib/tools/
 * registry.ts), grouped by family, each card carrying its bilingual
 * name and one line. The main site's own converter stays linked under
 * "From the main site" (its page is untouched, per the original spec).
 */

import * as React from "react";
import {
  ToolsFooter,
  ToolsHeader,
  useSiteLocale,
} from "@/components/compound/chrome";
import { TOOLS_COPY } from "@/lib/tools/copy";
import {
  TOOLS,
  TOOL_GROUPS,
  type ToolEntry,
} from "@/lib/tools/registry";
import type { Locale } from "@/lib/compound/content";

function ToolCard({
  title,
  line,
  href,
  cta,
  external,
}: {
  title: string;
  line: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cr-shadow-card)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
      data-cw="tool-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[1.25rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
            {line}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full bg-[var(--color-currena-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-currena-blue-deep)]">
          {cta} ↗
        </span>
      </div>
    </a>
  );
}

export default function ToolsIndex() {
  const [locale, toggleLang] = useSiteLocale();
  const copy = TOOLS_COPY[locale];
  const t = copy.index;

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = copy.dir;
    document.title = locale === "fa" ? `${t.title} · کورنا` : "Tools · Currena";
  }, [locale, copy.dir, t.title]);

  const entryTitle = (e: ToolEntry) => (locale === "fa" ? e.fa.title : e.en.title);
  const entryLine = (e: ToolEntry) => (locale === "fa" ? e.fa.line : e.en.line);

  return (
    <div
      dir={copy.dir}
      lang={locale}
      className="flex min-h-screen flex-col bg-[var(--color-currena-bg-light)]"
    >
      <span id="top" />
      <ToolsHeader
        copy={{ nav: copy.nav, tool: { title: t.title, disclaimer: copy.footer.disclaimer, footer: { rights: copy.footer.rights } } }}
        locale={locale}
        onToggleLang={toggleLang}
      />

      <main id="main-content" className="mx-auto w-full max-w-[560px] flex-1 px-3 py-4 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[800px] lg:px-8">
        <header className="mt-2 mb-4">
          <p className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</p>
          <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)]">
            {t.title}
          </h1>
          <p className="mt-1 mb-0 text-[13.5px] text-[var(--color-text-secondary)]">{t.promise}</p>
        </header>

        {TOOL_GROUPS.map((g) => {
          const tools = TOOLS.filter((e) => e.group === g.id);
          if (tools.length === 0) return null;
          return (
            <section key={g.id} className="mb-7">
              <h2 className="type-kicker mb-2 text-[var(--color-text-tertiary)]">
                {locale === "fa" ? g.fa : g.en}
              </h2>
              <div className="space-y-3">
                {tools.map((e) => (
                  <ToolCard
                    key={e.slug}
                    title={entryTitle(e)}
                    line={entryLine(e)}
                    href={`/tools/${e.slug}`}
                    cta={t.open}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <h2 className="type-kicker mt-2 mb-2 text-[var(--color-text-tertiary)]">
          {t.externalKicker}
        </h2>
        <ToolCard
          title={t.externalName}
          line={t.externalLine}
          href="https://currena.ir/"
          cta={t.externalCta}
          external
        />
      </main>

      <ToolsFooter copy={{ nav: copy.nav, tool: { title: t.title, disclaimer: copy.footer.disclaimer, footer: { rights: copy.footer.rights } } }} locale={locale} />
    </div>
  );
}
