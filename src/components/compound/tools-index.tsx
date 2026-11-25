"use client";

/**
 * Compound Wealth — the /tools index view (spec §3): a simple list of
 * tool cards (name, one line). Phase 1 lists Compound Wealth and links
 * to the existing converter at its existing URL (currena.ir — the main
 * site's own page, untouched). Same chrome and language handling as the
 * tool page. (The route's metadata lives in src/app/tools/page.tsx.)
 */

import * as React from "react";
import { COPY } from "@/lib/compound/content";
import { ToolsFooter, ToolsHeader, useSiteLocale } from "@/components/compound/chrome";

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
          <h2 className="m-0 text-[1.25rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{line}</p>
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
  const copy = COPY[locale];
  const t = copy.index;

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = copy.dir;
    document.title = locale === "fa" ? `${t.title} · کورنا` : "Tools · Currena";
  }, [locale, copy.dir, t.title]);

  return (
    <div dir={copy.dir} lang={locale} className="flex min-h-screen flex-col bg-[var(--color-currena-bg-light)]">
      <span id="top" />
      <ToolsHeader copy={copy} locale={locale} onToggleLang={toggleLang} />

      <main className="mx-auto w-full max-w-[560px] flex-1 px-3 py-4 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[800px] lg:px-8">
        <header className="mt-2 mb-4">
          <p className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</p>
          <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)]">
            {t.title}
          </h1>
          <p className="mt-1 mb-0 text-[13.5px] text-[var(--color-text-secondary)]">{t.promise}</p>
        </header>

        <div className="space-y-3">
          <ToolCard
            title={copy.tool.title}
            line={copy.tool.promise}
            href="/tools/compound-wealth"
            cta={t.open}
          />
        </div>

        <h2 className="type-kicker mt-8 mb-2 text-[var(--color-text-tertiary)]">{t.alsoConverter}</h2>
        <ToolCard
          title={t.converterName}
          line={t.converterLine}
          href="https://currena.ir/"
          cta={t.converterCta}
          external
        />
      </main>

      <ToolsFooter copy={copy} />
    </div>
  );
}
