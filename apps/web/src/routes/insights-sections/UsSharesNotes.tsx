/**
 * UsSharesNotes.tsx — Step 3 L2-03 (runbook Phase 4, 2026-10-16):
 *
 *  - UsSharesAudBox — the L2-03 AUD view of the two US indexes, computed
 *    from the SAME-date inputs the page already holds; refused with
 *    "dates differ" when the feeds mismatch (T-20/T-21).
 *
 *  (The §7.1 "Know before you buy US shares" details box was removed at the
 *   owner's direct request, 2026-10-20 — it no longer renders anywhere.)
 */

import { formatNumber } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { FxLoadState } from '../../components/insights/WorldCurrencies';
import type { MarketsLoadState } from '../../components/insights/WorldMarkets';
import { usSharesInAud } from '../../lib/us-shares-aud';

function signed1(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  const num = formatNumber(Math.abs(n), numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const sign = Math.round(Math.abs(n) * 10) === 0 ? '' : n > 0 ? '+' : '−';
  return `${sign}${num}%`;
}

/** The L2-03 AUD view of the two US indexes (same-date arithmetic only). */
export function UsSharesAudBox({
  marketsState,
  fxState,
  copy,
  numberLocale,
}: {
  marketsState: MarketsLoadState;
  fxState: FxLoadState;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const view =
    marketsState.kind === 'ready' && fxState.kind === 'ready'
      ? usSharesInAud(marketsState.snapshot, fxState.snapshot)
      : ({ kind: 'unavailable' } as const);

  // The box renders ONLY with a computable view or the honest dates-differ
  // line — it never teases data it cannot show.
  if (view.kind === 'unavailable') return null;

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 ring-1 ring-[var(--color-border)]">
      <h3 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{copy.ui.usAudTitle}</h3>
      {view.kind === 'dates-differ' ? (
        <p className="m-0 mt-1 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.usAudDatesDiffer}</p>
      ) : (
        <>
          <ul className="m-0 mt-2 list-none space-y-1.5 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
            {view.rows.map((row) => {
              const usd = formatNumber(row.closeUsd, numberLocale, { maximumFractionDigits: 0 });
              const aud = formatNumber(row.closeAud, numberLocale, { maximumFractionDigits: 0 });
              const name = copy.markets.entries[row.id].name;
              const level = `${name}: ${usd} · ${aud}`;
              const change =
                row.chg1mUsd !== null && row.chg1mAud !== null && row.fxEffect !== null
                  ? interpolateChange(copy, {
                      usd: signed1(row.chg1mUsd, numberLocale),
                      aud: signed1(row.chg1mAud, numberLocale),
                      fx: signed1(row.fxEffect, numberLocale),
                    })
                  : null;
              return (
                <li key={row.id} className="flex flex-col gap-0.5">
                  <bdi dir="ltr" className="font-semibold text-[var(--color-text-primary)]">
                    {level}
                  </bdi>
                  {change !== null ? (
                    <bdi dir="ltr" className="text-[length:var(--type-caption)] tabular-nums">
                      {change}
                    </bdi>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mb-0 mt-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.ui.usAudSameDate}</p>
        </>
      )}
    </div>
  );
}

/** The one-month change template ({usd}/{aud}/{fx} placeholders). */
function interpolateChange(
  copy: InsightsCopy,
  vars: { usd: string; aud: string; fx: string },
): string {
  return copy.ui.usAudChange.replace('{usd}', vars.usd).replace('{aud}', vars.aud).replace('{fx}', vars.fx);
}
