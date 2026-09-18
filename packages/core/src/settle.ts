/**
 * Greedy debt settlement — Split & Settle parity (MIGRATION_CHECKLIST #11).
 *
 * Ported from the legacy captured JS (split-settle-script.js):
 *   - balances: payer is credited the full amount, every participant is
 *     debited amount / participants.length;
 *   - debts/credits below ±0.01 (SETTLE_EPSILON) are treated as zero
 *     (suppresses float residue like 100/3 × 3);
 *   - both lists sort largest-first (Array.prototype.sort is stable, so
 *     ties keep insertion order — legacy parity);
 *   - repeatedly settle the largest debtor against the largest creditor
 *     for the smaller of the two amounts.
 *
 * This is the legacy algorithm verbatim. Greedy does not always produce the
 * provably minimal number of transfers, but parity with the legacy UX is
 * the requirement — documented, deliberate.
 */

import { CoreError } from './errors';

/** Amounts within ±0.01 of zero are considered settled (legacy constant). */
export const SETTLE_EPSILON = 0.01;

/** An expense paid by one member on behalf of a set of participants. */
export interface SplitExpense {
  /** Member who paid. */
  payer: string;
  /** Positive expense amount (single currency per group — UI concern). */
  amount: number;
  /** Members sharing the cost (may include the payer). Never empty. */
  participants: string[];
}

/** One suggested transfer that reduces total outstanding debt. */
export interface Transfer {
  /** Member who pays (the debtor). */
  from: string;
  /** Member who receives (the creditor). */
  to: string;
  /** Positive transfer amount. */
  amount: number;
}

/**
 * Net balance per member: positive = is owed money (creditor), negative =
 * owes money (debtor). Every participant gets an entry, even with no expenses.
 *
 * Throws typed errors on structurally invalid input (the legacy UI prevented
 * these via alerts; the rebuild fails loudly instead):
 *   - 'duplicate_participant', 'unknown_payer', 'unknown_participant',
 *     'empty_participants', 'invalid_amount'
 *
 * The returned record has a **null prototype**: member names like
 * `'__proto__'` or `'constructor'` become ordinary own keys instead of
 * hitting `Object.prototype` setters (which silently corrupted the ledger
 * before this was fixed — a `__proto__` participant's shares vanished).
 */
export function computeBalances(
  participants: readonly string[],
  expenses: readonly SplitExpense[],
): Record<string, number> {
  const balances = new Map<string, number>();
  for (const participant of participants) {
    if (balances.has(participant)) {
      throw new CoreError('duplicate_participant', `participant listed twice: ${participant}`);
    }
    balances.set(participant, 0);
  }

  for (const expense of expenses) {
    if (typeof expense.amount !== 'number' || !Number.isFinite(expense.amount) || expense.amount <= 0) {
      throw new CoreError('invalid_amount', `expense amount must be a positive finite number, got ${String(expense.amount)}`);
    }
    if (!balances.has(expense.payer)) {
      throw new CoreError('unknown_payer', `expense payer ${JSON.stringify(expense.payer)} is not a participant`);
    }
    if (expense.participants.length === 0) {
      throw new CoreError('empty_participants', `expense paid by ${JSON.stringify(expense.payer)} has no participants`);
    }
    for (const participant of expense.participants) {
      if (!balances.has(participant)) {
        throw new CoreError('unknown_participant', `split participant ${JSON.stringify(participant)} is not a participant`);
      }
    }

    const share = expense.amount / expense.participants.length;
    balances.set(expense.payer, (balances.get(expense.payer) ?? 0) + expense.amount);
    for (const participant of expense.participants) {
      balances.set(participant, (balances.get(participant) ?? 0) - share);
    }
  }

  // Null-prototype container: an own '__proto__' key is a plain data property
  // here (JSON.stringify / Object.entries / indexing all behave normally).
  const result: Record<string, number> = Object.create(null);
  for (const [person, balance] of balances) {
    result[person] = balance;
  }
  return result;
}

/**
 * Greedy settlement suggestions from raw balances: a minimal-looking list of
 * transfers { from, to, amount } that zeroes every balance (largest-debtor →
 * largest-creditor, legacy parity). Balances within ±SETTLE_EPSILON produce
 * no transfers.
 *
 * Throws typed errors instead of silently losing money:
 *   - 'invalid_balance'    — a balance value is not a finite number
 *   - 'unbalanced_balances' — debts and credits do not cancel (the greedy
 *     loop used to silently drop the residue; tolerance is
 *     max(SETTLE_EPSILON, largest amount × 1e-12) so legitimate float
 *     drift from computeBalances can never trip it).
 */
export function settleDebts(balances: Record<string, number>): Transfer[] {
  const debts: { person: string; amount: number }[] = [];
  const credits: { person: string; amount: number }[] = [];
  let maxAmount = 0;

  for (const [person, balance] of Object.entries(balances)) {
    if (typeof balance !== 'number' || !Number.isFinite(balance)) {
      throw new CoreError('invalid_balance', `balance for ${JSON.stringify(person)} must be a finite number, got ${String(balance)}`);
    }
    if (balance < -SETTLE_EPSILON) {
      const amount = Math.abs(balance);
      debts.push({ person, amount });
      if (amount > maxAmount) maxAmount = amount;
    } else if (balance > SETTLE_EPSILON) {
      credits.push({ person, amount: balance });
      if (balance > maxAmount) maxAmount = balance;
    }
  }

  // Largest first; stable sort keeps insertion order for ties (legacy parity).
  debts.sort((a, b) => b.amount - a.amount);
  credits.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debts.length && j < credits.length) {
    const debt = debts[i]!; // narrowed by the loop condition
    const credit = credits[j]!;
    const settleAmount = Math.min(debt.amount, credit.amount);

    transfers.push({ from: debt.person, to: credit.person, amount: settleAmount });

    debt.amount -= settleAmount;
    credit.amount -= settleAmount;
    if (debt.amount < SETTLE_EPSILON) i++;
    if (credit.amount < SETTLE_EPSILON) j++;
  }

  // Conservation invariant: whatever remains in the non-exhausted list is
  // money the loop would silently drop. Fail loudly instead.
  let leftoverDebt = 0;
  for (; i < debts.length; i++) leftoverDebt += debts[i]!.amount;
  let leftoverCredit = 0;
  for (; j < credits.length; j++) leftoverCredit += credits[j]!.amount;
  const tolerance = Math.max(SETTLE_EPSILON, maxAmount * 1e-12);
  if (leftoverDebt > tolerance || leftoverCredit > tolerance) {
    throw new CoreError(
      'unbalanced_balances',
      `balances must net to ~0 (unclaimed debt ${leftoverDebt}, unclaimed credit ${leftoverCredit})`,
    );
  }

  return transfers;
}

/** Convenience: balances + suggestions in one call. */
export function computeSettlements(
  participants: readonly string[],
  expenses: readonly SplitExpense[],
): Transfer[] {
  return settleDebts(computeBalances(participants, expenses));
}

/**
 * The expense to append when a user marks a transfer as settled
 * (legacy `markAsSettled` parity): the payer is the debtor, and the
 * beneficiary is the creditor — the debtor's negative balance and the
 * creditor's positive balance cancel exactly, so the suggestion disappears
 * on re-render.
 *
 * DEVATION FROM LEGACY (bug fix, flagged in the Phase-3 worklog): the
 * captured code inserted `splitBetween: [settlement.from]` — payer AND
 * participant the same person — which nets to zero change and leaves the
 * settlement suggestion visible forever. This port records the payment
 * against the receiving side so balances actually clear, which is what
 * the legacy UI intended ("Payment marked as settled!").
 */
export function buildSettlementExpense(transfer: Transfer): SplitExpense {
  return {
    payer: transfer.from,
    amount: transfer.amount,
    participants: [transfer.to],
  };
}
