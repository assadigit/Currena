/**
 * The pure engines behind the tools — no React, no network; every one
 * is unit-tested in tests/tools-maths.test.ts (the compound tool's
 * maths-test discipline, restated for this family).
 */

/* =================================================================== *
 * محاسبه دنگ — the fair split («دنگ کردن»)                            *
 *                                                                     *
 * The common convention (the capora formulation):                      *
 *   equal split — سهم هر نفر = کل ÷ تعداد نفرها                        *
 * The weighted mode is the same sum carried by per-person weights.     *
 * =================================================================== */

export interface DangShare {
  /** The exact share (unrounded). */
  exact: number;
  /** The display share (about-level, the page's rounding). */
  rounded: number;
}

/** Equal split of a total among n people. */
export function dangEqual(total: number, people: number): DangShare[] {
  const exact = people > 0 ? total / people : 0;
  return Array.from({ length: people }, () => ({
    exact,
    rounded: roundShare(exact),
  }));
}

/** Weighted split: each person's weight (default 1). */
export function dangWeighted(total: number, weights: number[]): DangShare[] {
  const sum = weights.reduce((a, w) => a + (Number.isFinite(w) && w > 0 ? w : 0), 0);
  if (sum <= 0) return weights.map(() => ({ exact: 0, rounded: 0 }));
  return weights.map((w) => {
    const eff = Number.isFinite(w) && w > 0 ? w : 0;
    const exact = (total * eff) / sum;
    return { exact, rounded: roundShare(exact) };
  });
}

/** The about-level rounding for a share (keeps toman-speaking numbers
 *  readable; smaller currencies keep two decimals). */
export function roundShare(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const a = Math.abs(v);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  if (a >= 1_000) return Math.round(v / 10) * 10;
  if (a >= 1) return Math.round(v * 100) / 100;
  return Math.round(v * 1000) / 1000;
}

/* =================================================================== *
 * تسویه گروهی — balances and the minimal transfers                     *
 * =================================================================== */

export interface Expense {
  payer: number;
  amount: number;
}

export interface Transfer {
  from: number;
  to: number;
  amount: number;
}

/** Net balance per person: paid − fair share (equal split of every
 *  expense among all the people). Positive → is owed; negative → owes. */
export function netBalances(people: number, expenses: Expense[]): number[] {
  const total = expenses.reduce((a, e) => a + (Number.isFinite(e.amount) ? e.amount : 0), 0);
  const per = people > 0 ? total / people : 0;
  const paid = new Array(people).fill(0);
  for (const e of expenses) {
    if (e.payer >= 0 && e.payer < people && Number.isFinite(e.amount)) {
      paid[e.payer] += e.amount;
    }
  }
  return paid.map((p) => round2(p - per));
}

/** The minimal-transfer settlement: pair the largest creditor with the
 *  largest debtor until everyone is square (greedy — the classic
 *  splitwise reduction; never more transfers than people − 1). */
export function settleTransfers(balances: number[]): Transfer[] {
  const cents = balances.map((b) => Math.round(b * 100));
  const debtors: Array<{ i: number; v: number }> = [];
  const creditors: Array<{ i: number; v: number }> = [];
  cents.forEach((c, i) => {
    if (c < -0.5) debtors.push({ i, v: c });
    if (c > 0.5) creditors.push({ i, v: c });
  });
  debtors.sort((a, b) => a.v - b.v); // most negative first
  creditors.sort((a, b) => b.v - a.v); // most positive first
  const out: Transfer[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(-debtor.v, creditor.v);
    if (amount > 0) {
      out.push({ from: debtor.i, to: creditor.i, amount: amount / 100 });
    }
    debtor.v += amount;
    creditor.v -= amount;
    if (debtor.v >= -0.5) d++;
    if (creditor.v <= 0.5) c++;
  }
  return out;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/* =================================================================== *
 * Gold — the market's constants and conversions                        *
 *                                                                     *
 * هر مثقال (مظنه، ۱۷ عیار) = ۴٫۶۰۸۳ گرم؛ همین وزن در مبنای ۱۸ عیار   *
 * (۷۰۵ ÷ ۷۵۰) = ۴٫۳۳۱۸۰۲ گرم — the bazaar's own numbers (the           *
 * kimiadevelop/saatchi formulation, verified against the live board:   *
 * مظنه ÷ ۴٫۳۳۱۸ ≈ گرم ۱۸ عیار).                                       *
 * =================================================================== */

export const MESGHAL_G17 = 4.6083; // grams of 17k gold per مثقال (مظنه basis)
export const MESGHAL_G18 = 4.331802; // the same مثقال carried to the 18k basis

/** مثقال (decimal, any basis) → grams on that basis. */
export function mesghalToGram(mesghal: number, basis: 17 | 18): number {
  const factor = basis === 17 ? MESGHAL_G17 : MESGHAL_G18;
  return mesghal * factor;
}

/** Grams → مثقال on that basis. */
export function gramToMesghal(grams: number, basis: 17 | 18): number {
  const factor = basis === 17 ? MESGHAL_G17 : MESGHAL_G18;
  return factor > 0 ? grams / factor : 0;
}

/** Karat conversion — وزن × عیار مبدأ ÷ عیار مقصد (the market rule). */
export function karatConvert(weight: number, fromKarat: number, toKarat: number): number {
  if (!fromKarat || !toKarat) return 0;
  return (weight * fromKarat) / toKarat;
}

/** The metal value of a weight of some karat at a per-gram price. */
export function goldValue(grams: number, perGram: number): number {
  return grams * perGram;
}

/** A jewellery invoice: metal + making charge (اجرت) + seller profit,
 *  both as percent of the metal; VAT (۹٪) applies to the wage + profit
 *  side only — the market's own rule, never to the metal. */
export interface InvoiceInput {
  grams: number;
  perGram: number;
  wagePct: number;
  profitPct: number;
  vatPct: number;
}

export interface InvoiceTotals {
  metal: number;
  wage: number;
  profit: number;
  vat: number;
  total: number;
}

export function jewelleryInvoice({
  grams,
  perGram,
  wagePct,
  profitPct,
  vatPct,
}: InvoiceInput): InvoiceTotals {
  const metal = grams * perGram;
  const wage = (metal * wagePct) / 100;
  const profit = (metal * profitPct) / 100;
  const vat = ((wage + profit) * vatPct) / 100;
  return {
    metal: round2(metal),
    wage: round2(wage),
    profit: round2(profit),
    vat: round2(vat),
    total: round2(metal + wage + profit + vat),
  };
}

/* =================================================================== *
 * رسیدساز ارزی — the receipt totals                                    *
 *                                                                     *
 * فروش به مشتری (the customer buys): payable = amount × rate + fee.   *
 * خرید از مشتری (the customer sells): payable = amount × rate − fee.  *
 * =================================================================== */

export type DealSide = "sell" | "buy";

export interface ReceiptTotals {
  gross: number;
  fee: number;
  payable: number;
}

export function receiptTotals(
  side: DealSide,
  amount: number,
  rate: number,
  fee: number,
): ReceiptTotals {
  const gross = amount * rate;
  const payable = side === "sell" ? gross + fee : gross - fee;
  return { gross: round2(gross), fee, payable: round2(payable) };
}
