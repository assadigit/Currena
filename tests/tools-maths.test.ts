/**
 * The tools family's maths tests (bun test) — the compound tool's
 * discipline restated: every engine's arithmetic is checked, including
 * the live-board arithmetic against the actual /api/gold/rates
 * snapshot conventions (the toman-direction of the rates).
 */

import { describe, expect, test } from "bun:test";
import {
  dangEqual,
  dangWeighted,
  jewelleryInvoice,
  karatConvert,
  mesghalToGram,
  gramToMesghal,
  netBalances,
  receiptTotals,
  settleTransfers,
} from "../src/lib/tools/engines";
import { convertAmount, tomanPerUnit } from "../src/lib/tools/rates";

describe("the rates direction (foreign units per toman)", () => {
  // The board's own convention, verified against the live snapshot:
  // USD rate 3.414251084024719e-06 → 1 USD = 292,890.3… toman.
  const usd = { code: "USD", name: "US Dollar", rate: 3.414251084024719e-06 };
  const irr = { code: "IRR", name: "Iranian Rial", rate: 1 };

  test("toman per unit inverts the rate", () => {
    expect(Math.round(tomanPerUnit(usd))).toBe(292890);
  });

  test("IRR is the identity row", () => {
    expect(tomanPerUnit(irr)).toBe(1);
  });

  test("100 USD → toman through the cross", () => {
    const v = convertAmount(100, usd, irr);
    expect(v).toBeCloseTo(29_289_000, -1);
  });

  test("the cross cancels: X → Y → X", () => {
    const eur = { code: "EUR", name: "Euro", rate: 3.1075201988812926e-06 };
    const there = convertAmount(1000, usd, eur);
    const back = convertAmount(there, eur, usd);
    expect(back).toBeCloseTo(1000, 6);
  });
});

describe("محاسبه دنگ — the fair split", () => {
  test("equal: the whole ÷ the number of people", () => {
    const shares = dangEqual(1_000_000, 4);
    expect(shares).toHaveLength(4);
    for (const s of shares) expect(s.exact).toBe(250_000);
    expect(shares[0].rounded).toBe(250_000);
  });

  test("equal: a non-divisible total states exact and rounded apart", () => {
    const shares = dangEqual(1_000_000, 3);
    expect(shares[0].exact).toBeCloseTo(333_333.333, 2);
    expect(shares[0].rounded).toBe(333_000); // about-level (to the thousand), the page's rounding
  });

  test("weighted: weights carry the same whole", () => {
    const shares = dangWeighted(1_000_000, [1, 1, 2]);
    expect(shares[0].exact).toBeCloseTo(250_000, 4);
    expect(shares[2].exact).toBeCloseTo(500_000, 4);
    const sum = shares.reduce((a, s) => a + s.exact, 0);
    expect(sum).toBeCloseTo(1_000_000, 4);
  });

  test("weighted: a zero weight gets nothing", () => {
    const shares = dangWeighted(900, [0, 3]);
    expect(shares[0].exact).toBe(0);
    expect(shares[1].exact).toBe(900);
  });
});

describe("تسویه گروهی — balances and transfers", () => {
  test("the sample settles with the minimal transfers", () => {
    // Arash 1.2M, Sara 0.8+0.4M, Nima 1.6M, Zhaleh 0 — total 4.0M, per head 1.0M.
    const balances = netBalances(4, [
      { payer: 0, amount: 1_200_000 },
      { payer: 1, amount: 800_000 },
      { payer: 1, amount: 400_000 },
      { payer: 2, amount: 1_600_000 },
    ]);
    expect(balances[0]).toBe(200_000);
    expect(balances[1]).toBe(200_000);
    expect(balances[2]).toBe(600_000);
    expect(balances[3]).toBe(-1_000_000);

    const transfers = settleTransfers(balances);
    // Zhaleh owes 1.0M; Arash and Sara are owed 0.2M each, Nima 0.6M.
    // Minimal: Zhaleh → Nima 0.6M, Zhaleh → Arash 0.2M, Zhaleh → Sara 0.2M.
    expect(transfers).toHaveLength(3);
    expect(transfers.every((t) => t.from === 3)).toBe(true);
    const toNima = transfers.find((t) => t.to === 2);
    const toArash = transfers.find((t) => t.to === 0);
    const toSara = transfers.find((t) => t.to === 1);
    expect(toNima?.amount).toBe(600_000);
    expect(toArash?.amount).toBe(200_000);
    expect(toSara?.amount).toBe(200_000);
  });

  test("an even split needs no transfers", () => {
    const balances = netBalances(3, [
      { payer: 0, amount: 300 },
      { payer: 1, amount: 300 },
      { payer: 2, amount: 300 },
    ]);
    expect(settleTransfers(balances)).toHaveLength(0);
  });

  test("a single payer settles in people − 1 transfers", () => {
    const balances = netBalances(3, [{ payer: 0, amount: 900 }]);
    const transfers = settleTransfers(balances);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.to === 0)).toBe(true); // the payer is the creditor
    const sum = transfers.reduce((a, t) => a + t.amount, 0);
    expect(sum).toBeCloseTo(600, 6);
  });

  test("the greedy pairs never exceed people − 1 transfers", () => {
    const balances = netBalances(
      5,
      [
        { payer: 0, amount: 1_000 },
        { payer: 1, amount: 2_000 },
        { payer: 2, amount: 150 },
        { payer: 3, amount: 850 },
      ],
    );
    expect(settleTransfers(balances).length).toBeLessThanOrEqual(4);
  });
});

describe("gold — the bazaar's constants", () => {
  test("a mesghal on the 17k basis", () => {
    expect(mesghalToGram(1, 17)).toBeCloseTo(4.6083, 4);
  });

  test("the same mesghal on the 18k basis (705 ÷ 750)", () => {
    expect(mesghalToGram(1, 18)).toBeCloseTo(4.331802, 6);
  });

  test("grams → mesghal round-trips", () => {
    const g = mesghalToGram(2.5, 18);
    expect(gramToMesghal(g, 18)).toBeCloseTo(2.5, 10);
  });

  test("the live board's own cross-check: مظنه ÷ 4.3318 ≈ گرم ۱۸", () => {
    // From the live snapshot: mesghal 110,345,000; gram-18k 25,475,500.
    const derived = 110_345_000 / 4.331802;
    expect(Math.abs(derived - 25_475_500) / 25_475_500).toBeLessThan(0.001);
  });

  test("karat conversion: weight × this karat ÷ that karat", () => {
    expect(karatConvert(10, 18, 24)).toBeCloseTo(7.5, 10);
    expect(karatConvert(7.5, 24, 18)).toBeCloseTo(10, 10);
  });

  test("the jewellery invoice: VAT on the wage + profit, never the metal", () => {
    const inv = jewelleryInvoice({
      grams: 5,
      perGram: 25_000_000,
      wagePct: 7,
      profitPct: 7,
      vatPct: 9,
    });
    expect(inv.metal).toBe(125_000_000);
    expect(inv.wage).toBe(8_750_000);
    expect(inv.profit).toBe(8_750_000);
    expect(inv.vat).toBeCloseTo(1_575_000, 4); // 9% of 17.5M, not of 142.5M
    expect(inv.total).toBeCloseTo(144_075_000, 2);
  });
});

describe("رسیدساز — the receipt totals", () => {
  test("sell: the customer pays gross + fee", () => {
    const t = receiptTotals("sell", 100, 292_890, 50_000);
    expect(t.gross).toBe(29_289_000);
    expect(t.payable).toBe(29_339_000);
  });

  test("buy: the customer receives gross − fee", () => {
    const t = receiptTotals("buy", 100, 292_890, 50_000);
    expect(t.payable).toBe(29_239_000);
  });
});
