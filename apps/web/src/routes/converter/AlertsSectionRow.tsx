/**
 * converter/AlertsSectionRow — the I14 rate-alerts section row: the
 * one-tap door to the alerts dialog, the triggered-but-unseen badge, the
 * waiting/triggered summary sub-line and the desktop `A` kbd hint
 * (Phase: WS-4 module split of the former Converter.tsx monolith — zero
 * behavior change, code moved verbatim; the shell owns the alerts
 * derivation, the ackAll-and-open action and the A-key shortcut).
 */

import { formatNumber } from '@currena/core';
import { useI18n } from '../../lib/locale';

export function AlertsSectionRow(props: {
  alertsLength: number;
  waitingCount: number;
  triggeredCount: number;
  unseenTriggered: number;
  onOpen: () => void;
}) {
  const { t, numberLocale } = useI18n();
  const { alertsLength, waitingCount, triggeredCount, unseenTriggered, onOpen } = props;

  return (
    <div className="no-print mt-5">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-currena-cyan/30 bg-currena-cyan/[0.06] px-4 py-3 text-start transition-all duration-300 hover:border-currena-cyan/60 hover:bg-currena-cyan/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue motion-safe:hover:-translate-y-0.5 dark:border-currena-cyan/25 dark:bg-currena-cyan/[0.07]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className={unseenTriggered > 0 ? 'warning-pulse text-lg' : 'text-lg'}
          >
            🔔
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-currena-dark">{t('alerts.sectionTitle')}</span>
            <span className="block truncate text-xs text-currena-muted">
              {alertsLength === 0
                ? t('alerts.sectionHint')
                : waitingCount > 0 && triggeredCount > 0
                  ? `${t('alerts.waitingCount', { count: formatNumber(waitingCount, numberLocale) })} · ${t('alerts.badge', { count: formatNumber(triggeredCount, numberLocale) })}`
                  : waitingCount > 0
                    ? t('alerts.waitingCount', { count: formatNumber(waitingCount, numberLocale) })
                    : t('alerts.badge', { count: formatNumber(triggeredCount, numberLocale) })}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {unseenTriggered > 0 ? (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-currena-warning-deep px-1.5 text-[0.7rem] font-black text-white shadow-[0_2px_8px_rgba(185,46,46,0.35)] dark:text-[#1A222E] dark:shadow-[0_2px_8px_rgba(255,128,128,0.25)]">
              {formatNumber(unseenTriggered, numberLocale)}
            </span>
          ) : null}
          <kbd className="hidden md:inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 font-sans text-[0.65rem] font-bold text-currena-dark ring-1 ring-black/[0.08] dark:bg-[#243040] dark:text-currena-dark dark:ring-white/[0.12]">
            A
          </kbd>
        </span>
      </button>
    </div>
  );
}
