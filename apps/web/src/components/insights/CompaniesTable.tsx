/**
 * CompaniesTable — the global companies table behind a feature flag
 * (R10-3, 2026-10-28).
 *
 * The owner's R9-09 directive was BLOCKED on the EODHD free-plan quota
 * (20 calls/day total — the markets board already consumes ~16–18).
 * This component ships the table PRE-BUILT, with the feature flag OFF:
 *
 *  - When `COMPANIES_TABLE_ENABLED` is `false` (the shipped default):
 *    the empty-state panel renders. The heading + the empty-state
 *    sentence + the planned-data note stay; no live calls fire; the
 *    cron rung is NOT WIRED.
 *  - When the flag flips to `true` (the owner's future paid plan): the
 *    table renders the live rows. The flip procedure lives in
 *    apps/web/src/components/insights/config/companies.ts.
 *
 * Bilingual EN + FA: every user-facing string rides the i18n
 * dictionary's `companies` block (insights-copy-{en,fa}.ts); Latin
 * company names + exchange codes stay Latin in BOTH locales (proper
 * nouns — RULES.md §5). Numbers stay LTR inside the RTL flow.
 *
 * RTL-safe (AGENTS.md rule 5): CSS logical properties only — `text-start`,
 * `ps-`/`pe-`, `ms-`/`me-`; the table's `dir` attribute is inherited
 * from `<html>`; the sparkline skeleton mirrors with the document.
 *
 * Responsive (UI-52): desktop renders the full 5-column table; mobile
 * (≤ 640px) collapses to a card list — one card per company, the same
 * five fields stacked. No horizontal scroll at any breakpoint.
 */

import { COMPANIES, COMPANIES_COUNT, COMPANY_EXCHANGE_LABELS } from '@currena/insights';
import type { CompanyDefinition } from '@currena/insights';
import { formatNumber } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { COMPANIES_TABLE_ENABLED } from './config/companies';

export function CompaniesTable({
  copy,
  locale,
}: {
  copy: InsightsCopy;
  locale: 'en' | 'fa';
}) {
  const c = copy.companies;
  // The shell mirrors the WorldMarkets container (owner round 44):
  // soft tint, hairline ring, quiet shadow — same family.
  const shell =
    'scroll-mt-24 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-currena-soft/60 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.07)] ring-1 ring-[var(--color-border)] sm:gap-5 sm:p-6 dark:shadow-[0_14px_44px_rgba(0,0,0,0.4)]';

  // The empty-state panel — the ONLY thing rendered while the flag is off.
  // The heading + sectionLabel + the empty-state sentence + the
  // planned-data note. The live table (the column headers + the rows)
  // renders when the flag flips on; the empty state then retires.
  if (!COMPANIES_TABLE_ENABLED) {
    return (
      <section
        id="insights-companies"
        aria-labelledby="insights-companies-title"
        className={shell}
      >
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h2 id="insights-companies-title" className="type-section m-0">
            <span className="block">{c.title}</span>
            <span className="mt-0.5 block text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              {c.sectionLabel}
            </span>
          </h2>
        </header>
        <p className="m-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
          {c.emptyState}
        </p>
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {c.plannedNote}
        </p>
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{c.attribution}</bdi>
        </p>
      </section>
    );
  }

  // The live table — rendered when the flag is on. Until the data feed
  // is wired (the future cron rung), the rows are skeletons (the same
  // honesty discipline as the markets board's loading state). The
  // column headers stay verbatim in both locales.
  return (
    <section
      id="insights-companies"
      aria-labelledby="insights-companies-title"
      className={shell}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 id="insights-companies-title" className="type-section m-0">
          <span className="block">{c.title}</span>
          <span className="mt-0.5 block text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {interpolateCount(c.sectionLabel, COMPANIES_COUNT, locale)}
          </span>
        </h2>
      </header>

      {/* Desktop table (≥ 640px) — 5 columns, sticky header. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[length:var(--type-caption)] uppercase tracking-wide text-[var(--color-text-tertiary)]">
              <th scope="col" className="py-2 pe-3 text-start font-bold">{c.colCompany}</th>
              <th scope="col" className="py-2 px-3 text-start font-bold">{c.colExchange}</th>
              <th scope="col" className="py-2 px-3 text-end font-bold">{c.colPrice}</th>
              <th scope="col" className="py-2 px-3 text-end font-bold">{c.colDailyChange}</th>
              <th scope="col" className="py-2 ps-3 text-end font-bold">{c.colSparkline}</th>
            </tr>
          </thead>
          <tbody>
            {COMPANIES.map((company) => (
              <CompanyRowSkeleton
                key={company.ticker}
                company={company}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list (< 640px) — same fields, stacked. No horizontal scroll (UI-52). */}
      <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:hidden">
        {COMPANIES.map((company) => (
          <CompanyCardSkeleton
            key={company.ticker}
            company={company}
            copy={c}
          />
        ))}
      </ul>

      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <bdi>{c.attribution}</bdi>
      </p>
    </section>
  );
}

/** One skeleton row of the desktop table (the live data feed is the future flip). */
function CompanyRowSkeleton({
  company,
}: {
  company: CompanyDefinition;
}) {
  return (
    <tr className="border-b border-[var(--color-border)]/50 text-[length:var(--type-label)]">
      <td className="py-2 pe-3 text-start">
        <span className="font-semibold">{company.name}</span>
      </td>
      <td className="py-2 px-3 text-start text-[var(--color-text-tertiary)]">
        <bdi>{COMPANY_EXCHANGE_LABELS[company.exchange]}</bdi>
      </td>
      <td className="py-2 px-3 text-end text-[var(--color-text-tertiary)]">—</td>
      <td className="py-2 px-3 text-end text-[var(--color-text-tertiary)]">—</td>
      <td className="py-2 ps-3 text-end">
        <SparklineSkeleton />
      </td>
    </tr>
  );
}

/** One skeleton card of the mobile list (the live data feed is the future flip). */
function CompanyCardSkeleton({
  company,
  copy,
}: {
  company: CompanyDefinition;
  copy: InsightsCopy['companies'];
}) {
  return (
    <li className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-currena-soft/40 p-3 ring-1 ring-[var(--color-border)]/50">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{company.name}</span>
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{COMPANY_EXCHANGE_LABELS[company.exchange]}</bdi>
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <span>{copy.colPrice}: —</span>
        <span>{copy.colDailyChange}: —</span>
      </div>
      <SparklineSkeleton />
    </li>
  );
}

/** The 7-day sparkline skeleton — a quiet inline SVG, no data yet. */
function SparklineSkeleton() {
  // A muted 60×16 polyline placeholder. When the live data lands, this
  // is replaced by the real Sparkline component (apps/web/src/components/Sparkline.tsx).
  return (
    <svg
      width="60"
      height="16"
      viewBox="0 0 60 16"
      aria-hidden="true"
      className="inline-block align-middle text-[var(--color-text-tertiary)]/40"
    >
      <polyline
        points="0,8 10,8 20,8 30,8 40,8 50,8 60,8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2,2"
      />
    </svg>
  );
}

/** Interpolate the count into the sectionLabel when the live table renders.
 * The shipped empty-state path bypasses this; the live path uses it. */
function interpolateCount(template: string, count: number, locale: 'en' | 'fa'): string {
  // The live table's sectionLabel carries the count ({count} companies).
  // The fa locale renders Persian digits via the repo's formatNumber
  // helper (RULES.md §5 — never a hardcoded digit table).
  if (!template.includes('{count}')) return template;
  const numberLocale = locale === 'fa' ? 'fa-IR' : 'en-US';
  const digits = formatNumber(count, numberLocale, { maximumFractionDigits: 0 });
  return template.replace('{count}', digits);
}
