/**
 * settle/GroupDetail — the group detail view's frame: the emoji + name
 * header, the three-stat grid (members / expenses / total), the live
 * "You" balance line, the tabs card (GroupTabs owns the tablist itself)
 * and the back/delete row (Phase: WS-4 module split of the former
 * Settle.tsx monolith — zero behavior change, code moved verbatim; the
 * shell owns the group state, the balance/settlement derivations, the
 * tab state and every action).
 */

import { formatNumber } from '@currena/core';
import type { Transfer } from '@currena/core';
import { Button, Card } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import type { SettleGroup } from '../../lib/settle-storage';
import { fmt2 } from './shared';
import { GroupTabs } from './GroupTabs';

export function GroupDetail(props: {
  openGroup: SettleGroup;
  balances: Record<string, number>;
  settlements: Transfer[];
  tab: 'expenses' | 'balances' | 'settle';
  setTab: (tab: 'expenses' | 'balances' | 'settle') => void;
  groupTotal: number;
  youBalance: number;
  onBack: () => void;
  onDeleteGroup: (id: string) => void;
  onMarkSettled: (transfer: Transfer) => void;
}) {
  const { t, numberLocale } = useI18n();
  const {
    openGroup,
    balances,
    settlements,
    tab,
    setTab,
    groupTotal,
    youBalance,
    onBack,
    onDeleteGroup,
    onMarkSettled,
  } = props;

  return (
    <div className="lg:mx-auto lg:max-w-[780px]">
      <div className="mb-5 text-center">
        <div className="text-5xl" aria-hidden="true">
          {openGroup.emoji}
        </div>
        <h2 className="mt-2 text-xl font-bold text-currena-dark">
          {openGroup.name}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <div className="rounded-[12px] bg-currena-soft px-2 py-2.5 text-center">
            <p className="text-[0.65rem] font-semibold uppercase text-currena-muted">
              {t('splitSettle.members')}
            </p>
            <p className="text-lg font-bold text-currena-dark">
              {formatNumber(openGroup.members.length, numberLocale, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-[12px] bg-currena-soft px-2 py-2.5 text-center">
            <p className="text-[0.65rem] font-semibold uppercase text-currena-muted">
              {t('splitSettle.expenses')}
            </p>
            <p className="text-lg font-bold text-currena-dark">
              {formatNumber(openGroup.expenses.length, numberLocale, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-[12px] bg-currena-soft px-2 py-2.5 text-center">
            <p className="text-[0.65rem] font-semibold uppercase text-currena-muted">
              {t('common.total')}
            </p>
            <p className="text-lg font-bold text-currena-dark">
              {fmt2(groupTotal, numberLocale)}
            </p>
          </div>
        </div>
        <p
          className={`mt-3 text-sm font-semibold ${
            youBalance > 0.01
              ? 'text-currena-success'
              : youBalance < -0.01
                ? 'text-currena-warning'
                : 'text-currena-muted'
          }`}
        >
          {youBalance > 0.01
            ? t('splitSettle.youAreOwed', { n: fmt2(Math.abs(youBalance), numberLocale) })
            : youBalance < -0.01
              ? t('splitSettle.youOwe', { n: fmt2(Math.abs(youBalance), numberLocale) })
              : t('splitSettle.allSettledUp')}
        </p>
      </div>

      <Card>
        <GroupTabs
          openGroup={openGroup}
          balances={balances}
          settlements={settlements}
          tab={tab}
          setTab={setTab}
          onMarkSettled={onMarkSettled}
        />
      </Card>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <Button variant="secondary" className="py-3" onClick={onBack}>
          {t('splitSettle.backToGroups')}
        </Button>
        <Button
          variant="ghost"
          className="!text-currena-warning py-3"
          onClick={() => onDeleteGroup(openGroup.id)}
        >
          🗑️ {t('splitSettle.deleteGroup')}
        </Button>
      </div>
    </div>
  );
}
