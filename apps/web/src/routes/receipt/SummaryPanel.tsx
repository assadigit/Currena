/**
 * receipt/SummaryPanel — the right-side sticky summary: live total +
 * converted figure (LOCAL math over the snapshots, mission §8), budget
 * tracking block (budget / remaining / the progressbar) and the
 * split-expenses per-person line, plus the action row (generate, copy,
 * share, clear) (Phase: WS-4 module split of the former Receipt.tsx
 * monolith — zero behavior change, code moved verbatim; the shell owns
 * the numbers and the action implementations).
 */

import { formatNumber } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { Button } from '../../components/ui';
import { useCodeLabel } from '../../lib/display';
import { useI18n } from '../../lib/locale';
import type { ReceiptTotals } from './shared';

export function SummaryPanel(props: {
  from: CurrencyCode;
  to: CurrencyCode;
  totals: ReceiptTotals;
  budgetOn: boolean;
  budgetValue: number | null;
  remaining: number | null;
  perPerson: number | null;
  progress: number | null;
  copied: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onShare: () => void;
  onClearAll: () => void;
}) {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const { from, to, totals, budgetOn, budgetValue, remaining, perPerson, progress, copied, onGenerate, onCopy, onShare, onClearAll } = props;

  const fmt = (value: number, code: string): string =>
    formatNumber(value, numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: code === 'IRR' ? 0 : 2,
    });

  return (
    <div className="mt-5 lg:mt-0 lg:sticky lg:top-24">
      <div className="rounded-[20px] cta-gradient p-5 text-white shadow-[0_12px_35px_rgba(102,126,234,0.4)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm opacity-90">{t('common.total')}</span>
          <span className="text-xl font-extrabold" dir="ltr">
            {fmt(totals.total, from)} <bdi>{label(from)}</bdi>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-90">{t('common.converted')}</span>
          <span className="text-lg font-bold" dir="ltr">
            {totals.converted !== null ? (
              <>
                {fmt(totals.converted, to)} <bdi>{label(to)}</bdi>
              </>
            ) : (
              '—'
            )}
          </span>
        </div>

        {budgetOn && budgetValue !== null ? (
          <div className="mt-3 border-t border-white/30 pt-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="opacity-90">{t('receipt.budget')}</span>
              <span dir="ltr">{fmt(budgetValue, from)} <bdi>{label(from)}</bdi></span>
            </div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="opacity-90">{t('receipt.remaining')}</span>
              <span className={`font-bold ${remaining !== null && remaining < 0 ? 'text-[#ffb4b4]' : ''}`} dir="ltr">
                {remaining !== null ? (
                  <>
                    {fmt(remaining, from)} <bdi>{label(from)}</bdi>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>
            {progress !== null ? (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                className="h-2 overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-[#FF6B6B]' : 'bg-white'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {perPerson !== null ? (
          <div className="mt-3 flex items-center justify-between border-t border-white/30 pt-3 text-sm">
            <span className="opacity-90">👥 {t('receipt.perPerson')}</span>
            <span dir="ltr">{fmt(perPerson, from)} <bdi>{label(from)}</bdi></span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="cta" className="col-span-full py-3.5" onClick={onGenerate}>
          {t('receipt.generate')}
        </Button>
        <Button variant="secondary" className="py-3" onClick={onCopy}>
          {copied ? `✅ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
        </Button>
        <Button variant="secondary" className="py-3" onClick={onShare}>
          📤 {t('common.share')}
        </Button>
        <Button variant="secondary" className="col-span-full py-3 !text-currena-warning-deep" onClick={onClearAll}>
          🗑️ {t('common.clear')}
        </Button>
      </div>
    </div>
  );
}
