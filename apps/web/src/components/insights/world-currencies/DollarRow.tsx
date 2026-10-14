/**
 * Dollar at a glance (§9.3 item 5) — one slim row (Phase 3-d split of the
 * former WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx).
 */

import type { FxSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { fxDollarMeaning } from '../../../lib/fx-presentation';
import { GlossaryTip } from './GlossaryTip';
import { signedPct } from './display';

/* ------------------------------------------------------------------ *
 * Dollar at a glance (§9.3 item 5) — one slim row
 * ------------------------------------------------------------------ */

export function DollarRow({
  snapshot,
  copy,
  locale,
  numberLocale,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const d = snapshot.dollarMeasure;
  // v1.3 (CR §4.9, fix B7): the meaning line FOLLOWS the direction — the
  // old fixed sentence was wrong whenever the dollar was weak or steady.
  const meaning = fxDollarMeaning(d.chg.m1, copy.fx);
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
      <p className="m-0 inline-flex flex-wrap items-baseline text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {copy.fx.dollarRowTitle}
        {/* v1.3 (CR §4.9): the row title carries its glossary tip. */}
        <GlossaryTip def={copy.fx.glossary.dollarStrength.def} srLabel={copy.fx.glossary.dollarStrength.term} />
      </p>
      <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
        <span className="inline-flex gap-1">
          <span>{copy.fx.thToday}</span>
          <bdi dir="ltr">{signedPct(d.chg.d1, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thM1}</span>
          <bdi dir="ltr">{signedPct(d.chg.m1, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thM3}</span>
          <bdi dir="ltr">{signedPct(d.chg.m3, numberLocale, locale)}</bdi>
        </span>
        <span className="inline-flex gap-1">
          <span>{copy.fx.thY1}</span>
          <bdi dir="ltr">{signedPct(d.chg.y1, numberLocale, locale)}</bdi>
        </span>
      </span>
      <span className="w-full text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{meaning}</bdi>
      </span>
    </div>
  );
}
