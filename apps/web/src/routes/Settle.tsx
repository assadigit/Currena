/**
 * Split & Settle route (`#/settle`) — checklist #11.
 *
 * Port of the legacy split-settle page: groups (name + emoji + members),
 * expenses within a group (payer, amount, currency, split-between, optional
 * receipt photo), live balances per member, greedy settlement suggestions,
 * mark-as-settled, FAB, and Android-back handling (popstate closes the open
 * group view / modal before exiting — Capacitor-ready).
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
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { computeBalances, formatNumber, parseAmount, settleDebts } from '@currena/core';
import type { CurrencyCode, Transfer } from '@currena/core';
import { Button, Card, Toast } from '../components/ui';
import { useCodeLabel } from '../lib/display';
import { deletePhotos, getPhoto, putPhoto } from '../lib/photo-store';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

/* ------------------------------------------------------------------ *
 * Data model (localStorage `splitSettleGroups`, legacy-ish shape)
 * ------------------------------------------------------------------ */

const STORAGE_KEY = 'splitSettleGroups';

interface SettleExpense {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  paidBy: string;
  splitBetween: string[];
  /** ISO datetime. */
  date: string;
  /** Photo blob lives in IndexedDB under this expense's id. */
  hasPhoto: boolean;
  isSettlement: boolean;
}

interface SettleGroup {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  expenses: SettleExpense[];
  settlements: [];
  createdAt: string;
}

/** The 8 expense currencies the legacy offered (captured markup order). */
const EXPENSE_CURRENCIES: readonly CurrencyCode[] = [
  'IRR', 'USD', 'EUR', 'AED', 'TRY', 'GBP', 'AUD', 'CAD',
];

/** Legacy emoji picker options. */
const EMOJIS = ['✈️', '🏠', '👨‍👩‍👧‍👦', '🍕', '🎉', '💼', '🏖️', '🎓'] as const;

function readGroups(): SettleGroup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is SettleGroup => {
      if (!(g instanceof Object)) return false;
      const group = g as Partial<SettleGroup>;
      return (
        typeof group.id === 'string' &&
        typeof group.name === 'string' &&
        typeof group.emoji === 'string' &&
        Array.isArray(group.members) &&
        Array.isArray(group.expenses)
      );
    });
  } catch {
    return [];
  }
}

function persist(groups: SettleGroup[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.warn('[settle] cannot persist groups:', err);
  }
}

/* ------------------------------------------------------------------ *
 * Photo thumbnail (blob → objectURL, from IndexedDB)
 * ------------------------------------------------------------------ */

function ExpensePhoto({ expenseId, alt }: { expenseId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      const blob = await getPhoto(expenseId);
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [expenseId]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      className="mt-2.5 max-h-48 w-full rounded-[12px] object-cover"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Modal shell
 * ------------------------------------------------------------------ */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[6px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="popup-slide-up max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-[25px] bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.5)] sm:max-w-[520px] dark:bg-[#1A222E]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="×"
            className="h-8 w-8 cursor-pointer rounded-full border-0 bg-currena-warning/10 text-xl text-currena-warning transition-all duration-300 hover:rotate-90"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-[12px] border-2 border-gray-200 bg-white px-3.5 py-2.5 text-sm text-currena-dark focus:border-currena-blue focus:outline-none dark:border-white/10 dark:bg-[#222C3B]';

/* ------------------------------------------------------------------ *
 * Route
 * ------------------------------------------------------------------ */

export function Settle() {
  const { t, numberLocale } = useI18n();
  const label = useCodeLabel();

  const [groups, setGroups] = useState<SettleGroup[]>([]);
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

  // Hydrate once; persist on change.
  useEffect(() => {
    setGroups(readGroups());
  }, []);
  useEffect(() => {
    persist(groups);
  }, [groups]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;

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
      id: `${Date.now()}`,
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

  const closeExpenseModal = (): void => {
    setExpenseOpen(false);
    setExpPhoto(null);
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
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
      id: `${Date.now()}`,
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
        id: `${Date.now()}`,
        description: t('splitSettle.settlementLabel', { from: transfer.from, to: transfer.to }),
        amount: transfer.amount,
        currency: 'IRR' as CurrencyCode,
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

  const fmt2 = (value: number): string =>
    formatNumber(value, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const TABS: readonly { id: 'expenses' | 'balances' | 'settle'; label: TranslationKey }[] = [
    { id: 'expenses', label: 'splitSettle.expensesTab' },
    { id: 'balances', label: 'splitSettle.balancesTab' },
    { id: 'settle', label: 'splitSettle.settleTab' },
  ];

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
            {groups.map((group) => {
              try {
                const bal = computeBalances(
                  group.members,
                  group.expenses.map((e) => ({ payer: e.paidBy, amount: e.amount, participants: e.splitBetween })),
                )['You'] ?? 0;
                return (
                  <Card key={group.id} className="cursor-pointer p-5 transition-all duration-300 hover:-translate-y-0.5" >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenGroupId(group.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setOpenGroupId(group.id);
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
                          ? t('splitSettle.youAreOwed', { n: fmt2(Math.abs(bal)) })
                          : bal < -0.01
                            ? t('splitSettle.youOwe', { n: fmt2(Math.abs(bal)) })
                            : t('splitSettle.allSettledUp')}
                      </p>
                    </div>
                    <div className="mt-3 border-t border-black/5 pt-3 text-end dark:border-white/10">
                      <Button
                        variant="ghost"
                        className="!text-currena-warning px-3 py-1.5 text-xs"
                        onClick={() => deleteGroup(group.id)}
                      >
                        🗑️ {t('splitSettle.deleteGroup')}
                      </Button>
                    </div>
                  </Card>
                );
              } catch {
                return null;
              }
            })}
          </div>
        )
      ) : (
        /* ---------- Group detail view (constrained column on desktop) ---------- */
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
                  {fmt2(groupTotal)}
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
                ? t('splitSettle.youAreOwed', { n: fmt2(Math.abs(youBalance)) })
                : youBalance < -0.01
                  ? t('splitSettle.youOwe', { n: fmt2(Math.abs(youBalance)) })
                  : t('splitSettle.allSettledUp')}
            </p>
          </div>

          <Card>
            {/* Tabs */}
            <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-[12px] bg-currena-soft p-1.5">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`cursor-pointer rounded-[9px] border-0 px-2 py-2.5 text-xs font-semibold transition-all duration-300 ${
                    tab === id
                      ? 'bg-white text-currena-blue shadow dark:bg-[#2A3648]'
                      : 'text-currena-muted hover:text-currena-dark'
                  }`}
                >
                  {t(label)}
                </button>
              ))}
            </div>

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
                          {fmt2(expense.amount)} <bdi>{label(expense.currency)}</bdi>
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
                          ? `+${fmt2(balance)}`
                          : balance < -0.01
                            ? fmt2(balance)
                            : fmt2(0)}
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
                        {fmt2(transfer.amount)}
                      </span>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => markSettled(transfer)}
                      >
                        {t('splitSettle.settle')}
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </Card>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <Button variant="secondary" className="py-3" onClick={() => setOpenGroupId(null)}>
              {t('splitSettle.backToGroups')}
            </Button>
            <Button
              variant="ghost"
              className="!text-currena-warning py-3"
              onClick={() => deleteGroup(openGroup.id)}
            >
              🗑️ {t('splitSettle.deleteGroup')}
            </Button>
          </div>
        </div>
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
        <Modal title={t('splitSettle.createNewGroup')} onClose={() => setCreateOpen(false)}>
          <label htmlFor="groupName" className="mb-1.5 block text-sm font-bold">
            {t('splitSettle.groupName')}
          </label>
          <input
            id="groupName"
            type="text"
            className={`${inputClass} mb-4`}
            placeholder={t('splitSettle.groupNamePlaceholder')}
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />

          <p className="mb-1.5 text-sm font-bold">{t('splitSettle.chooseEmoji')}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setCreateEmoji(emoji)}
                aria-pressed={createEmoji === emoji}
                className={`h-11 w-11 cursor-pointer rounded-[12px] border-2 text-xl transition-all duration-300 ${
                  createEmoji === emoji
                    ? 'border-currena-blue bg-currena-blue/10 scale-110'
                    : 'border-transparent bg-currena-soft'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <label htmlFor="groupMembers" className="mb-1.5 block text-sm font-bold">
            {t('splitSettle.membersLabel')}
          </label>
          <input
            id="groupMembers"
            type="text"
            className={`${inputClass} mb-1`}
            placeholder={t('splitSettle.membersPlaceholder')}
            value={createMembers}
            onChange={(e) => setCreateMembers(e.target.value)}
          />
          <p className="mb-5 text-xs text-currena-muted">{t('splitSettle.youAddedAutomatically')}</p>

          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" className="py-3" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="cta" className="py-3" onClick={createGroup}>
              {t('splitSettle.createGroup')}
            </Button>
          </div>
        </Modal>
      ) : null}

      {/* Add-expense modal */}
      {expenseOpen && openGroup ? (
        <Modal title={t('splitSettle.addExpense')} onClose={closeExpenseModal}>
          <label htmlFor="expDesc" className="mb-1.5 block text-sm font-bold">
            {t('common.description')}
          </label>
          <input
            id="expDesc"
            type="text"
            className={`${inputClass} mb-4`}
            placeholder={t('splitSettle.descriptionPlaceholder')}
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />

          <label htmlFor="expAmount" className="mb-1.5 block text-sm font-bold">
            {t('common.amount')}
          </label>
          <div className="mb-4 grid grid-cols-[1fr_auto] gap-2.5">
            <input
              id="expAmount"
              type="text"
              inputMode="decimal"
              dir="ltr"
              className={inputClass}
              placeholder={t('splitSettle.amountPlaceholder')}
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
            />
            <select
              aria-label={t('common.currency')}
              value={expCurrency}
              onChange={(e) => setExpCurrency(e.target.value as CurrencyCode)}
              className="cursor-pointer rounded-[12px] border-2 border-gray-200 bg-white px-2.5 text-sm font-semibold text-currena-dark dark:border-white/10 dark:bg-[#222C3B]"
            >
              {EXPENSE_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {label(code)}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="expPaidBy" className="mb-1.5 block text-sm font-bold">
            {t('splitSettle.paidBy')}
          </label>
          <select
            id="expPaidBy"
            className={`${inputClass} mb-4 cursor-pointer`}
            value={expPaidBy}
            onChange={(e) => setExpPaidBy(e.target.value)}
          >
            {openGroup.members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>

          <p className="mb-1.5 text-sm font-bold">{t('splitSettle.splitBetween')}</p>
          <div className="mb-4 space-y-1.5">
            {openGroup.members.map((member) => (
              <label
                key={member}
                className="flex cursor-pointer items-center gap-2.5 rounded-[12px] bg-currena-soft/60 px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={expSplit.has(member)}
                  onChange={(e) =>
                    setExpSplit((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(member);
                      else next.delete(member);
                      return next;
                    })
                  }
                  className="h-5 w-5 cursor-pointer accent-[#4A90E2]"
                />
                {member}
              </label>
            ))}
          </div>

          <p className="mb-1.5 text-sm font-bold">{t('splitSettle.receiptPhotoOptional')}</p>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="mb-2 flex w-full cursor-pointer flex-col items-center gap-1 rounded-[12px] border-2 border-dashed border-gray-300 px-3 py-5 text-xs text-currena-muted transition-all duration-300 hover:border-currena-blue hover:text-currena-blue dark:border-white/15"
          >
            <span className="text-2xl" aria-hidden="true">
              📸
            </span>
            {t('splitSettle.clickToAddPhoto')}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
          />
          {photoUrl ? (
            <div className="relative mb-4">
              <img src={photoUrl} alt={t('splitSettle.expensePhoto')} className="max-h-48 w-full rounded-[12px] object-cover" />
              <button
                type="button"
                onClick={() => {
                  if (photoInputRef.current) photoInputRef.current.value = '';
                  onPhotoSelected(null);
                }}
                className="absolute end-2 top-2 cursor-pointer rounded-full border-0 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
              >
                {t('splitSettle.removePhoto')}
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" className="py-3" onClick={closeExpenseModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="cta" className="py-3" onClick={addExpense}>
              {t('splitSettle.addExpense')}
            </Button>
          </div>
        </Modal>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
