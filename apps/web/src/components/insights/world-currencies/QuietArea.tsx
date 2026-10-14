/**
 * The quiet area (§9.3 item 4 + CR §4.4): the "Nearest to sounding the
 * alarm" row + the "{n} more quiet patterns" toggle (Phase 3-d split of the
 * former WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx).
 */

import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { formatNumber } from '@currena/core';
import type { FxRuleState } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { interpolate } from '../../../i18n';
import {
  fxClosestToWarning,
  fxQuietRules,
  fxQuietView,
  type FxQuietView,
} from '../../../lib/fx-presentation';

/* ------------------------------------------------------------------ *
 * The quiet area (§9.3 item 4 + CR §4.4): the "Nearest to sounding the
 * alarm" row + the "{n} more quiet patterns" toggle (the closest pattern
 * is never repeated in the list — fix B6).
 * ------------------------------------------------------------------ */

export function QuietArea({
  rules,
  copy,
  locale,
  numberLocale,
}: {
  rules: readonly FxRuleState[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [open, setOpen] = useState(false);
  const closest = useMemo(() => fxClosestToWarning(rules), [rules]);
  // v1.3 fix B6: the list shows the OTHER quiet patterns only.
  const quiet = useMemo(() => fxQuietRules(rules, closest?.id), [rules, closest]);
  const closestView = useMemo(
    () => (closest !== null ? fxQuietView(closest, copy.fx, numberLocale) : null),
    [closest, copy, numberLocale],
  );
  const num = (n: number): string => formatNumber(Math.round(n), numberLocale, { maximumFractionDigits: 0 });
  if (quiet.length === 0 && closestView === null) return null;

  // One quiet row: line 1 (title · quiet headline), line 2 (the numbers in
  // words), and the bar with its label + text value — never bar-only (§9.7).
  const row = (view: FxQuietView, labelId: string): ReactElement => (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
        <bdi>{view.line1}</bdi>
      </p>
      {view.line2 !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{view.line2}</bdi>
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span id={labelId} className="shrink-0 text-[0.66rem] font-semibold text-[var(--color-text-tertiary)]">
          {copy.fx.barLabel}
        </span>
        <span
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuenow={Math.round(view.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-currena-muted/20"
        >
          <span
            className="block h-full rounded-full bg-[var(--color-text-secondary)]"
            style={{ width: `${Math.max(2, Math.min(100, view.progress))}%` }}
          />
        </span>
        <bdi dir="ltr" className="shrink-0 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {num(view.progress)}{locale === 'fa' ? '٪' : '%'}
        </bdi>
      </div>
    </div>
  );

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
      {closestView !== null ? (
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            {copy.fx.quietAreaTitle}
          </p>
          {row(closestView, 'insights-fx-closest-bar-label')}
        </div>
      ) : null}
      {quiet.length > 0 ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls="insights-fx-quiet-list"
          onClick={() => setOpen((v) => !v)}
          className="insights-focusable mt-2 inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {interpolate(copy.fx.quietMore, { n: num(quiet.length) })}
          <span aria-hidden="true" className="ms-1">{open ? '▴' : '▾'}</span>
        </button>
      ) : null}
      {open ? (
        <ul id="insights-fx-quiet-list" className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
          {quiet.map((rule, i) => {
            const view = fxQuietView(rule, copy.fx, numberLocale);
            if (view === null) return null;
            return <li key={rule.id}>{row(view, `insights-fx-quiet-bar-label-${i}`)}</li>;
          })}
        </ul>
      ) : null}
    </div>
  );
}
