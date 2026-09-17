/**
 * ConverterAside — desktop-only companion rail for the converter route.
 *
 * Responsive redesign: below lg the converter stays the focused legacy form
 * (max 500px, touch-first). From lg up the route becomes a two-column
 * dashboard: the form on the start side, this rail on the end side with
 *
 *   1. "Iranian Toman — at a glance": a compact mini board of the five
 *      owner-priority majors (USD AUD EUR TRY AED → IRR, owner request
 *      2026-09-17) computed LOCALLY from the already-booted tgju snapshot
 *      (no extra network — mission §8), with ▲/▼ delta chips vs the
 *      previous snapshot generation, plus a link to the full live-rates
 *      board. Theme-aware: warm paper card in light mode (was dark-only),
 *      legacy navy in dark mode.
 *   2. "Quick tools": a 2×3 grid of one-tap shortcuts into the calculator,
 *      batch converter, receipt generator, splitter, settle and history.
 *
 * The rail renders nothing below lg (CSS `hidden`), so the mobile bundle
 * behavior and the conversion flow are untouched.
 */

import { useMemo } from 'react';
import { convert, formatNumber } from '@currena/core';
import type { CurrencyCode } from '@currena/core';
import { RateDeltaChip } from './RateDeltaChip';
import { Skeleton } from './ui';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';
import { useSnapshotStore } from '../lib/snapshot-store';
import { navigate } from '../router';
import type { RoutePath } from '../router';
import type { TranslationKey } from '../lib/locale';

/** The five owner-priority majors (request 2026-09-17), in order. */
const GLANCE: readonly CurrencyCode[] = ['USD', 'AUD', 'EUR', 'TRY', 'AED'];

const TOOLS: readonly { path: RoutePath; emoji: string; labelKey: TranslationKey }[] = [
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
];

export function ConverterAside({ className = '' }: { className?: string }) {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();
  const store = useSnapshotStore();
  const state = store.tgju;
  const snapshot = state.snapshot;
  const previous = state.previous;

  /** 1 unit in Toman + previous-generation baseline, computed locally. */
  const rows = useMemo(() => {
    if (!snapshot) return null;
    return GLANCE.map((code) => {
      let rate: number | null = null;
      let prevRate: number | undefined;
      try {
        rate = convert(snapshot, code, 'IRR', 1).rate;
      } catch {
        rate = null;
      }
      if (previous && rate !== null) {
        try {
          prevRate = convert(previous, code, 'IRR', 1).rate;
        } catch {
          prevRate = undefined;
        }
      }
      return { code, rate, prevRate };
    });
  }, [snapshot, previous]);

  return (
    <aside className={className} aria-label={t('converter.quickTools')}>
      {/* ---------- Mini board ---------- */}
      <section className="board-page rounded-[25px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-board-gold">{t('converter.boardAtAGlance')}</h2>
          <span className="live-dot !h-2 !w-2 shrink-0" aria-hidden="true" />
        </header>

        {rows ? (
          <ul className="mb-4 list-none space-y-1.5 p-0">
            {rows.map(({ code, rate, prevRate }) => (
              <li
                key={code}
                className="flex items-center gap-3 rounded-xl bg-board-subtle px-3 py-2.5 transition-colors duration-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.09]"
              >
                <img
                  src={`/images/flags/${code.toLowerCase()}.png`}
                  alt={code}
                  className="h-5 w-7 shrink-0 rounded-[3px] object-cover"
                />
                <span className="shrink-0 text-sm font-bold text-board-gold" dir="ltr">
                  {code}
                </span>
                <span className="min-w-0 flex-1 text-xs opacity-60" dir="ltr">
                  → {label('IRR')}
                </span>
                <span className="text-sm font-bold" dir="ltr">
                  {rate !== null
                    ? formatNumber(rate, numberLocale, { maximumFractionDigits: 0 })
                    : '—'}
                </span>
                {rate !== null && prevRate !== undefined ? (
                  <RateDeltaChip delta={{ current: rate, previous: prevRate }} decimals={0} size="sm" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-4 space-y-2" aria-hidden="true">
            {GLANCE.map((code) => (
              <Skeleton key={code} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/live-rates')}
          className="w-full cursor-pointer rounded-full border border-gold-primary/40 bg-gold-primary/10 px-4 py-2.5 text-xs font-bold text-board-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-gold"
        >
          📊 {t('common.viewFullBoard')}
        </button>
      </section>

      {/* ---------- Quick tools ---------- */}
      <section className="mt-6 rounded-[25px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:bg-currena-card-dark dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <h2 className="mb-4 text-base font-bold text-currena-dark dark:text-white">
          ⚡ {t('converter.quickTools')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
          {TOOLS.map(({ path, emoji, labelKey }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-0 bg-currena-soft px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-currena-blue/10 hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:bg-white/5 dark:hover:bg-currena-cyan/10"
            >
              <span className="text-2xl" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-xs font-bold leading-snug text-currena-dark dark:text-white/90">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
