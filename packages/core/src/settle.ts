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
 */
export function computeBalances(
  participants: readonly string[],
  expenses: readonly SplitExpense[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const participant of participants) {
    if (Object.prototype.hasOwnProperty.call(balances, participant)) {
      throw new CoreError('duplicate_participant', `participant listed twice: ${participant}`);
    }
    balances[participant] = 0;
  }

  for (const expense of expenses) {
    if (typeof expense.amount !== 'number' || !Number.isFinite(expense.amount) || expense.amount <= 0) {
      throw new CoreError('invalid_amount', `expense amount must be a positive finite number, got ${String(expense.amount)}`);
    }
    if (!(expense.payer in balances)) {
      throw new CoreError('unknown_payer', `expense payer ${JSON.stringify(expense.payer)} is not a participant`);
    }
    if (expense.participants.length === 0) {
      throw new CoreError('empty_participants', `expense paid by ${JSON.stringify(expense.payer)} has no participants`);
    }
    for (const participant of expense.participants) {
      if (!(participant in balances)) {
        throw new CoreError('unknown_participant', `split participant ${JSON.stringify(participant)} is not a participant`);
      }
    }

    const share = expense.amount / expense.participants.length;
    balances[expense.payer] = (balances[expense.payer] ?? 0) + expense.amount;
    for (const participant of expense.participants) {
      balances[participant] = (balances[participant] ?? 0) - share;
    }
  }

  return balances;
}

/**
 * Greedy settlement suggestions from raw balances: a minimal-looking list of
 * transfers { from, to, amount } that zeroes every balance (largest-debtor →
 * largest-creditor, legacy parity). Balances within ±SETTLE_EPSILON produce
 * no transfers.
 */
export function settleDebts(balances: Record<string, number>): Transfer[] {
  const debts: { person: string; amount: number }[] = [];
  const credits: { person: string; amount: number }[] = [];

  for (const [person, balance] of Object.entries(balances)) {
    if (balance < -SETTLE_EPSILON) {
      debts.push({ person, amount: Math.abs(balance) });
    } else if (balance > SETTLE_EPSILON) {
      credits.push({ person, amount: balance });
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
