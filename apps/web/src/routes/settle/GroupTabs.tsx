/**
 * settle/GroupTabs — the detail card's REAL tablist (audit WS-3 #1:
 * role=tablist/tab, aria-selected, a roving tabindex and RTL-aware
 * arrow-key walking — Tab leaves the group, arrows walk it, direction
 * mirrors the writing direction; keyboard activation is automatic) plus
 * the three panels it controls: the expenses list (with receipt photos),
 * the balances list and the settle suggestions (Phase: WS-4 module split
 * of the former Settle.tsx monolith — zero behavior change, code moved
 * verbatim; the shell owns the tab STATE — it deliberately survives
 * switching groups, exactly as the monolith's route-level state did).
 */

import type { Transfer } from '@currena/core';
import { Button } from '../../components/ui';
import { useCodeLabel } from '../../lib/display';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { useRovingKeys } from '../../components/use-roving-keys';
import type { SettleGroup } from '../../lib/settle-storage';
import { ExpensePhoto } from './ExpensePhoto';
import { fmt2 } from './shared';

const TABS: readonly { id: 'expenses' | 'balances' | 'settle'; label: TranslationKey }[] = [
  { id: 'expenses', label: 'splitSettle.expensesTab' },
  { id: 'balances', label: 'splitSettle.balancesTab' },
  { id: 'settle', label: 'splitSettle.settleTab' },
];

export function GroupTabs(props: {
  openGroup: SettleGroup;
  balances: Record<string, number>;
  settlements: Transfer[];
  tab: 'expenses' | 'balances' | 'settle';
  setTab: (tab: 'expenses' | 'balances' | 'settle') => void;
  onMarkSettled: (transfer: Transfer) => void;
}) {
  const { t, numberLocale, locale } = useI18n();
  const label = useCodeLabel();
  const { openGroup, balances, settlements, tab, setTab, onMarkSettled } = props;

  // Tabs as REAL tabs (audit WS-3 #1): role=tablist/tab, aria-selected, a
  // roving tabindex (Tab leaves the group; arrows walk it — direction
  // mirrors the writing direction) and the panel container the tabs
  // control. Keyboard activation is automatic (arrow = select), the APG
  // reading these compact segmented bars expect.
  const { containerRef: tabsRef, onKeyDown: tabsKeyDown } = useRovingKeys({
    selector: '[role="tab"]',
    activeIndex: TABS.findIndex((x) => x.id === tab),
    onMove: (index) => setTab(TABS[index]!.id),
    rtl: locale === 'fa',
  });

  return (
    <>
      <div
        role="tablist"
        aria-label={t('splitSettle.title')}
        ref={tabsRef}
        onKeyDown={tabsKeyDown}
        className="mb-4 grid grid-cols-3 gap-1.5 rounded-[12px] bg-currena-soft p-1.5"
      >
        {TABS.map(({ id, label: tabLabel }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`settle-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="settle-tab-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`cursor-pointer rounded-[9px] border-0 px-2 py-2.5 text-xs font-semibold transition-all duration-300 ${
              tab === id
                ? 'bg-white text-currena-blue shadow dark:bg-[#2A3648]'
                : 'text-currena-muted hover:text-currena-dark'
            }`}
          >
            {t(tabLabel)}
          </button>
        ))}
      </div>

      {/* The tab PANEL — one region the three tabs control (content
          swaps per aria-selected; the container itself is stable). */}
      <div id="settle-tab-panel" role="tabpanel" aria-labelledby={`settle-tab-${tab}`}>
      {/* Expenses tab */}
      {tab === 'expenses' ? (
        openGroup.expenses.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl opacity-30" aria-hidden="true">
              💸
            </div>
            <p className="mt-2.5 text-sm text-currena-muted">{t('splitSettle.noExpensesYet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openGroup.expenses.map((expense) => (
              <div
                key={expense.id}
                className={`rounded-[15px] px-3.5 py-3 ${
                  expense.isSettlement
                    ? 'bg-currena-success/10'
                    : 'bg-currena-soft/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-currena-dark">
                    {expense.description}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-currena-blue">
                    {fmt2(expense.amount, numberLocale)} <bdi>{label(expense.currency)}</bdi>
                  </p>
                </div>
                <p className="mt-1 text-xs text-currena-muted">
                  {t('splitSettle.paidBy')} <strong>{expense.paidBy}</strong> ·{' '}
                  {new Intl.DateTimeFormat(numberLocale, { dateStyle: 'medium' }).format(
                    new Date(expense.date),
                  )}
                </p>
                <p className="mt-0.5 text-xs text-currena-muted">
                  {t('splitSettle.splitBetween')}: {expense.splitBetween.join(', ')}
                </p>
                {expense.hasPhoto ? (
                  <ExpensePhoto expenseId={expense.id} alt={t('splitSettle.expensePhoto')} />
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Balances tab */}
      {tab === 'balances' ? (
        <div className="space-y-2">
          {openGroup.members.map((member) => {
            const balance = balances[member] ?? 0;
            return (
              <div
                key={member}
                className="flex items-center gap-3 rounded-[12px] bg-currena-soft/60 px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-currena-blue/15 text-sm font-bold text-currena-blue"
                >
                  {member.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-currena-dark">
                  {member}
                </span>
                <span
                  className={`ms-auto text-sm font-bold ${
                    balance > 0.01
                      ? 'text-currena-success'
                      : balance < -0.01
                        ? 'text-currena-warning'
                        : 'text-currena-muted'
                  }`}
                >
                  {balance > 0.01
                    ? `+${fmt2(balance, numberLocale)}`
                    : balance < -0.01
                      ? fmt2(balance, numberLocale)
                      : fmt2(0, numberLocale)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Settle tab */}
      {tab === 'settle' ? (
        settlements.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl" aria-hidden="true">
              🎉
            </div>
            <p className="mt-2.5 font-semibold text-currena-success">
              {t('splitSettle.allSettledCelebration')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {settlements.map((transfer, index) => (
              <div
                key={`${transfer.from}-${transfer.to}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-[12px] bg-currena-soft/60 px-3 py-2.5 text-sm"
              >
                <strong className="text-currena-dark">{transfer.from}</strong>
                <span className="text-currena-muted" aria-hidden="true">
                  →
                </span>
                <strong className="text-currena-dark">{transfer.to}</strong>
                <span className="ms-auto font-bold text-currena-blue">
                  {fmt2(transfer.amount, numberLocale)}
                </span>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => onMarkSettled(transfer)}
                >
                  {t('splitSettle.settle')}
                </Button>
              </div>
            ))}
          </div>
        )
      ) : null}
      </div>
    </>
  );
}
