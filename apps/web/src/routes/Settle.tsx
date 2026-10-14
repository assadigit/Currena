/**
 * Split & Settle route (`#/settle`) — checklist #11.
 *
 * Port of the legacy split-settle page: groups (name + emoji + members),
 * expenses within a group (payer, amount, currency, split-between, optional
 * receipt photo), live balances per member, greedy settlement suggestions,
 * mark-as-settled, FAB, and Android-back handling (popstate closes the open
 * group view / modal before exiting — Capacitor-ready).
 *
 * Since the WS-4 module split this file is the SHELL ONLY (the Phase-3
 * recipe, zero behavior change — the code moved verbatim):
 *
 *   settle/shared.ts            — pure constants/helpers (groupCurrency,
 *                                 EXPENSE_CURRENCIES, EMOJIS, fmt2)
 *   settle/Modal.tsx            — the generic focus-trapped modal shell
 *   settle/ExpensePhoto.tsx     — IndexedDB blob → objectURL thumbnail
 *   settle/GroupCard.tsx        — the groups-list card (per-card try/catch)
 *   settle/GroupDetail.tsx      — the detail view's frame (stats + actions)
 *   settle/GroupTabs.tsx        — the REAL tablist + the three panels
 *   settle/CreateGroupModal.tsx — the create-group form
 *   settle/AddExpenseModal.tsx  — the add-expense form
 *
 * The shell keeps: the groups state + hydration/persist/cross-tab sync,
 * the Android-back popstate layer, the tab STATE (deliberately survives
 * switching groups — route-level state in the monolith), every create/
 * add/settle action, and the FAB.
 *
 * Rebuild deltas:
 *   - receipt PHOTOS live in IndexedDB (lib/photo-store) — the legacy stored
 *     base64 dataURLs inside localStorage and bloated the quota; only the
 *     `hasPhoto` flag + legacy-shaped group metadata stay in localStorage;
 *   - balances/settlements come from @currena/core settle.ts (the legacy
 *     algorithm verbatim, incl. the ±0.01 epsilon);
 *   - mark-settled uses core buildSettlementExpense — the captured code
 *     recorded the payment against the payer (a bug that left the suggestion
 *     visible forever); the core port clears the balances as intended.
 *   - group deletion (not in legacy) with confirm + photo cleanup.
 *   - multi-tab sync (BACKLOG #38): a `storage` event from another tab
 *     writing `splitSettleGroups` re-hydrates this tab's groups — same
 *     semantics as History. The persistence layer (read/persist/subscribe)
 *     lives in lib/settle-storage.ts.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { computeBalances, parseAmount, settleDebts } from '@currena/core';
import { uniqueId } from '../lib/id';
import type { CurrencyCode, Transfer } from '@currena/core';
import { Button, Card, Toast } from '../components/ui';
import {
  persistSettleGroups,
  readSettleGroups,
  subscribeSettleGroups,
} from '../lib/settle-storage';
import type { SettleGroup, SettleExpense } from '../lib/settle-storage';
import { deletePhotos, putPhoto } from '../lib/photo-store';
import { useI18n } from '../lib/locale';
import { AddExpenseModal } from './settle/AddExpenseModal';
import { CreateGroupModal } from './settle/CreateGroupModal';
import { GroupCard } from './settle/GroupCard';
import { GroupDetail } from './settle/GroupDetail';
import { groupCurrency } from './settle/shared';

export function Settle() {
  const { t, numberLocale } = useI18n();

  // Hydrate ONCE via the lazy initializer (WS-5: the mount effect's
  // set-state was the D-17-accepted shape; the lazy read is the lint-clean
  // equivalent — same first paint, one fewer render pass). The old
  // `hydrated` guard existed because the mount-run persist could write
  // '[]' before the hydrated state landed — with the lazy initializer
  // there IS no pre-hydration state, so the guard is structurally gone.
  const [groups, setGroups] = useState<SettleGroup[]>(() => readSettleGroups());
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [tab, setTab] = useState<'expenses' | 'balances' | 'settle'>('expenses');
  const [toast, setToast] = useState<string | null>(null);

  // Create-group modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createMembers, setCreateMembers] = useState('');
  const [createEmoji, setCreateEmoji] = useState<string>('✈️');

  // Add-expense modal
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState<CurrencyCode>('IRR');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplit, setExpSplit] = useState<Set<string>>(new Set());
  const [expPhoto, setExpPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Cross-tab sync ONLY (BACKLOG #38, History semantics): another tab
  // writing the settle key (or clearing storage) re-hydrates this tab.
  // The equality guard returns `prev` for value-identical writes — no
  // re-render, so the persist effect below never echoes a no-op write
  // back. (WS-5: setState rides the subscription callback, the
  // compiler-blessed shape.)
  useEffect(
    () =>
      subscribeSettleGroups(() => {
        setGroups((prev) => {
          const next = readSettleGroups();
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });
      }),
    [],
  );
  useEffect(() => {
    persistSettleGroups(groups);
  }, [groups]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;

  const closeExpenseModal = (): void => {
    setExpenseOpen(false);
    setExpPhoto(null);
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
  };


  // Android back (legacy parity): popstate closes the topmost layer —
  // expense modal → create modal → group detail — before the app exits.
  useEffect(() => {
    if (!expenseOpen && !createOpen && !openGroupId) return;
    window.history.pushState(null, '', window.location.href);
    const onPop = (): void => {
      if (expenseOpen) {
        closeExpenseModal();
      } else if (createOpen) {
        setCreateOpen(false);
      } else if (openGroupId) {
        setOpenGroupId(null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseOpen, createOpen, openGroupId]);

  /* ---------------- Group actions ---------------- */

  const createGroup = (): void => {
    const name = createName.trim();
    if (!name) {
      setToast(t('splitSettle.enterGroupName'));
      return;
    }
    const members = createMembers
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m !== '' && m !== 'You');
    const group: SettleGroup = {
      id: String(uniqueId()),
      name,
      emoji: createEmoji,
      members: ['You', ...members],
      expenses: [],
      settlements: [],
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, group]);
    setCreateOpen(false);
    setCreateName('');
    setCreateMembers('');
    setCreateEmoji('✈️');
  };

  const deleteGroup = (id: string): void => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    if (window.confirm(t('splitSettle.deleteGroupConfirm'))) {
      void deletePhotos(group.expenses.filter((e) => e.hasPhoto).map((e) => e.id));
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (openGroupId === id) setOpenGroupId(null);
      setToast(t('splitSettle.groupDeleted'));
    }
  };

  /* ---------------- Expense actions ---------------- */

  const openAddExpense = (): void => {
    if (!openGroup) return;
    setExpDesc('');
    setExpAmount('');
    setExpCurrency('IRR');
    setExpPaidBy(openGroup.members[0] ?? 'You');
    setExpSplit(new Set(openGroup.members));
    setExpPhoto(null);
    setPhotoUrl(null);
    setExpenseOpen(true);
  };


  const onPhotoSelected = (file: File | null): void => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setExpPhoto(file);
    setPhotoUrl(file ? URL.createObjectURL(file) : null);
  };

  const addExpense = (): void => {
    if (!openGroup) return;
    const description = expDesc.trim();
    const amount = parseAmount(expAmount);
    if (!description) {
      setToast(t('splitSettle.enterDescription'));
      return;
    }
    if (amount === null || amount <= 0) {
      setToast(t('splitSettle.enterValidAmount'));
      return;
    }
    if (expSplit.size === 0) {
      setToast(t('splitSettle.selectOnePerson'));
      return;
    }

    const expense: SettleExpense = {
      id: String(uniqueId()),
      description,
      amount,
      currency: expCurrency,
      paidBy: expPaidBy,
      splitBetween: openGroup.members.filter((m) => expSplit.has(m)),
      date: new Date().toISOString(),
      hasPhoto: expPhoto !== null,
      isSettlement: false,
    };

    if (expPhoto) void putPhoto(expense.id, expPhoto);

    setGroups((prev) =>
      prev.map((g) => (g.id === openGroup.id ? { ...g, expenses: [...g.expenses, expense] } : g)),
    );
    closeExpenseModal();
  };

  const markSettled = (transfer: Transfer): void => {
    if (!openGroup) return;
    if (window.confirm(t('splitSettle.markSettledConfirm'))) {
      // Core buildSettlementExpense: payer = debtor, participant = creditor —
      // the balances cancel exactly and the suggestion disappears.
      const settlement = {
        id: String(uniqueId()),
        description: t('splitSettle.settlementLabel', { from: transfer.from, to: transfer.to }),
        amount: transfer.amount,
        currency: groupCurrency(openGroup),
        paidBy: transfer.from,
        splitBetween: [transfer.to],
        date: new Date().toISOString(),
        hasPhoto: false,
        isSettlement: true,
      };
      setGroups((prev) =>
        prev.map((g) => (g.id === openGroup.id ? { ...g, expenses: [...g.expenses, settlement] } : g)),
      );
      setToast(t('splitSettle.paymentMarkedSettled'));
    }
  };

  /* ---------------- Derived (live) ---------------- */

  const balances = useMemo(() => {
    if (!openGroup) return {};
    try {
      return computeBalances(
        openGroup.members,
        openGroup.expenses.map((e) => ({ payer: e.paidBy, amount: e.amount, participants: e.splitBetween })),
      );
    } catch (err) {
      console.warn('[settle] balance computation failed:', err);
      return {};
    }
  }, [openGroup]);

  const settlements = useMemo(
    () => (openGroup ? settleDebts(balances) : []),
    [openGroup, balances],
  );

  const youBalance = openGroup ? (balances['You'] ?? 0) : 0;
  const groupTotal = openGroup ? openGroup.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;

  /* ---------------- Render ---------------- */

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 pb-24 pt-6 sm:max-w-[620px] lg:max-w-[960px] lg:px-10">
      <h1 className="mb-1 text-xl font-bold text-currena-dark lg:text-2xl">
        👥 {t('splitSettle.title')}
      </h1>
      <p className="mb-5 text-sm text-currena-muted">{t('splitSettle.subtitle')}</p>

      {/* ---------- Groups list view ---------- */}
      {!openGroup ? (
        groups.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="mb-3 text-5xl opacity-40" aria-hidden="true">
              👥
            </div>
            <h2 className="mb-1.5 text-lg font-bold text-currena-dark">
              {t('splitSettle.noGroupsYet')}
            </h2>
            <p className="mx-auto mb-6 max-w-xs text-sm text-currena-muted">
              {t('splitSettle.noGroupsText')}
            </p>
            <Button variant="cta" className="px-6 py-3" onClick={() => setCreateOpen(true)}>
              {t('splitSettle.createFirstGroup')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                numberLocale={numberLocale}
                onOpen={setOpenGroupId}
                onDelete={deleteGroup}
              />
            ))}
          </div>
        )
      ) : (
        /* ---------- Group detail view (constrained column on desktop) ---------- */
        <GroupDetail
          openGroup={openGroup}
          balances={balances}
          settlements={settlements}
          tab={tab}
          setTab={setTab}
          groupTotal={groupTotal}
          youBalance={youBalance}
          onBack={() => setOpenGroupId(null)}
          onDeleteGroup={deleteGroup}
          onMarkSettled={markSettled}
        />
      )}

      {/* FAB (legacy: + opens create-group / add-expense) */}
      <button
        type="button"
        onClick={() => (openGroup ? openAddExpense() : setCreateOpen(true))}
        aria-label={openGroup ? t('splitSettle.addExpense') : t('splitSettle.createNewGroup')}
        className="fixed bottom-5 end-5 z-[999] flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-0 cta-gradient text-3xl font-light text-white shadow-[0_6px_20px_rgba(102,126,234,0.5)] transition-all duration-300 hover:-translate-y-1 hover:scale-105"
      >
        +
      </button>

      {/* Create-group modal */}
      {createOpen ? (
        <CreateGroupModal
          createName={createName}
          setCreateName={setCreateName}
          createMembers={createMembers}
          setCreateMembers={setCreateMembers}
          createEmoji={createEmoji}
          setCreateEmoji={setCreateEmoji}
          onClose={() => setCreateOpen(false)}
          onCreate={createGroup}
        />
      ) : null}

      {/* Add-expense modal */}
      {expenseOpen && openGroup ? (
        <AddExpenseModal
          openGroup={openGroup}
          expDesc={expDesc}
          setExpDesc={setExpDesc}
          expAmount={expAmount}
          setExpAmount={setExpAmount}
          expCurrency={expCurrency}
          setExpCurrency={setExpCurrency}
          expPaidBy={expPaidBy}
          setExpPaidBy={setExpPaidBy}
          expSplit={expSplit}
          setExpSplit={setExpSplit}
          photoUrl={photoUrl}
          onPhotoSelected={onPhotoSelected}
          photoInputRef={photoInputRef}
          onClose={closeExpenseModal}
          onAdd={addExpense}
        />
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
