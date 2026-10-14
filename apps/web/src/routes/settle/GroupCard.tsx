/**
 * settle/GroupCard — one group's card in the groups-list view: name +
 * emoji, members/expenses counts, the live "You" balance line, and the
 * delete action under a divider (Phase: WS-4 module split of the former
 * Settle.tsx monolith — zero behavior change, code moved verbatim; the
 * shell owns the groups state and the open/delete actions). The per-card
 * try/catch wraps the balance computation exactly as the monolith's map
 * did — a group whose balance computation throws is skipped, never
 * half-rendered (JSX construction stays outside the try: a render error
 * is not catchable there and must reach the error boundary — the
 * monolith's JSX-in-try shape was accidental, flagged by lint).
 */

import { computeBalances } from '@currena/core';
import { formatNumber } from '@currena/core';
import { Card, Button } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import type { SettleGroup } from '../../lib/settle-storage';
import { fmt2 } from './shared';

export function GroupCard({
  group,
  numberLocale,
  onOpen,
  onDelete,
}: {
  group: SettleGroup;
  numberLocale: 'en-US' | 'fa-IR';
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();

  let bal: number;
  try {
    bal = computeBalances(
      group.members,
      group.expenses.map((e) => ({ payer: e.paidBy, amount: e.amount, participants: e.splitBetween })),
    )['You'] ?? 0;
  } catch {
    return null;
  }

  return (
    <Card className="cursor-pointer p-5 transition-all duration-300 hover:-translate-y-0.5" >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(group.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpen(group.id);
        }}
      >
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-currena-dark">
            {group.name}
          </h2>
          <span className="text-2xl" aria-hidden="true">
            {group.emoji}
          </span>
        </div>
        <div className="mb-2.5 flex flex-wrap gap-3 text-xs text-currena-muted">
          <span>👥 {t('splitSettle.membersCount', { n: formatNumber(group.members.length, numberLocale, { maximumFractionDigits: 0 }) })}</span>
          <span>💰 {t('splitSettle.expensesCount', { n: formatNumber(group.expenses.length, numberLocale, { maximumFractionDigits: 0 }) })}</span>
        </div>
        <p
          className={`text-sm font-semibold ${
            bal > 0.01
              ? 'text-currena-success'
              : bal < -0.01
                ? 'text-currena-warning'
                : 'text-currena-muted'
          }`}
        >
          {bal > 0.01
            ? t('splitSettle.youAreOwed', { n: fmt2(Math.abs(bal), numberLocale) })
            : bal < -0.01
              ? t('splitSettle.youOwe', { n: fmt2(Math.abs(bal), numberLocale) })
              : t('splitSettle.allSettledUp')}
        </p>
      </div>
      <div className="mt-3 border-t border-black/5 pt-3 text-end dark:border-white/10">
        <Button
          variant="ghost"
          className="!text-currena-warning px-3 py-1.5 text-xs"
          onClick={() => onDelete(group.id)}
        >
          🗑️ {t('splitSettle.deleteGroup')}
        </Button>
      </div>
    </Card>
  );
}
