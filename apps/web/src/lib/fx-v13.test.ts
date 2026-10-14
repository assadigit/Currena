/**
 * fx-v13.test.ts — the v1.3 change request's acceptance tests (§5, T1–T11),
 * run against THE SCREENSHOT'S NUMBERS (12 October 2026):
 *
 *   dollar M1 +3.2, M3 +1.5, Y1 +3.1, today +0.2; EUR/USD M1 −3.6;
 *   USD/JPY M1 +3.0; EUR/CHF M1 −1.5; AUD/JPY M1 +0.1; USD/CNY M3 −1.2;
 *   S&P 500 M1 +2.0.
 *
 * The fixture runs the REAL engine (evaluateFxRules + summarizeFxRules +
 * buildFxPlain from @currena/insights/fx) and the real presentation layer,
 * so every row of §5 is an end-to-end check: numbers → engine → snapshot →
 * the exact on-screen strings, in English and Farsi.
 */

import { describe, expect, it } from 'vitest';
import { FxSnapshotSchema } from '@currena/core';
import type { FxPairEntry, FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import {
  buildFxPlain,
  evaluateFxRules,
  summarizeFxRules,
} from '@currena/insights/fx';
import { fxRuleHasPatternCheck } from '@currena/insights/fx/definitions';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
import {
  fxChangeLine,
  fxChartLineLabel,
  fxDollarMeaning,
  fxHeadline,
  fxHeadlineVerdict,
  fxMeasureKey,
  fxMoneyLine,
  fxMoversOf,
  fxPatternOrder,
  fxPlainWords,
  fxQuietRules,
  fxQuietView,
  fxRuleView,
  fxSentence,
  fxBigMoverOf,
  type FxBigMover,
} from './fx-presentation';

const en = insightsCopyEn;
const fa = insightsCopyFa;

/* ------------------------------------------------------------------ *
 * The screenshot fixture (12 October 2026, "as of" dates)
 * ------------------------------------------------------------------ */

function pairEntry(
  id: FxPairId,
  rate: number,
  chg: { d1: number; m1: number; m3: number; y1: number },
): FxPairEntry {
  return {
    id,
    asOf: '2026-10-12',
    rate,
    chg,
    moveRank: 50,
    bigMove: false,
    source: 'frankfurter',
    stale: false,
    weekly: [[1, rate]],
  };
}

/** The screenshot's 10 pairs (rates are the 12 Oct 2026 ballpark). */
function screenshotPairs(): FxPairEntry[] {
  return [
    pairEntry('eurusd', 1.117, { d1: -0.2, m1: -3.6, m3: -4.9, y1: -3.4 }),
    pairEntry('usdjpy', 158.4, { d1: 0.3, m1: 3.0, m3: 4.5, y1: 6.2 }),
    pairEntry('gbpusd', 1.262, { d1: -0.1, m1: -1.8, m3: -2.4, y1: -1.0 }),
    pairEntry('usdchf', 0.795, { d1: 0.1, m1: 0.9, m3: 1.4, y1: 2.1 }),
    pairEntry('usdcny', 7.08, { d1: 0.0, m1: -0.3, m3: -1.2, y1: -1.8 }),
    pairEntry('audusd', 0.685, { d1: -0.3, m1: -2.4, m3: -1.5, y1: -3.6 }),
    pairEntry('audjpy', 108.5, { d1: 0.0, m1: 0.1, m3: 0.8, y1: 1.0 }),
    pairEntry('eurjpy', 177.0, { d1: 0.1, m1: -0.7, m3: -0.5, y1: 2.6 }),
    pairEntry('eurchf', 0.888, { d1: 0.0, m1: -1.5, m3: -3.7, y1: -5.5 }),
    pairEntry('audcny', 4.85, { d1: 0.0, m1: -1.2, m3: -1.6, y1: -2.0 }),
  ];
}

/** One full snapshot around the screenshot's numbers. */
function screenshotSnapshot(overrides?: {
  dollarM1?: number;
  dollarM3?: number;
  eurusdM1?: number;
  sp500M1?: number;
  /** Make R3's 13-week pattern check NOT hold (dollar and gold moving
   * together) so a fired R3 is downgraded to Watch — the calm-verdict-
   * with-a-big-move world of CR §3.2. */
  r3NotHolding?: boolean;
}): FxSnapshot {
  const dollar = {
    asOf: '2026-10-12',
    value: 100,
    chg: {
      d1: 0.2,
      m1: overrides?.dollarM1 ?? 3.2,
      m3: overrides?.dollarM3 ?? 1.5,
      y1: 3.1,
    },
    // The 52-week window follows the month's direction: a rising dollar
    // ends at its 52-week high (B8's real week), a falling one at its low.
    weekly: Array.from({ length: 52 }, (_, i): [number, number] =>
      [i + 1, (overrides?.dollarM1 ?? 3.2) >= 0 ? 95 + (5 * i) / 51 : 105 - (5 * i) / 51],
    ),
  };
  const pairs = screenshotPairs();
  if (overrides?.eurusdM1 !== undefined) {
    const eurusd = pairs.find((p) => p.id === 'eurusd')!;
    eurusd.chg = { ...eurusd.chg, m1: overrides.eurusdM1 };
  }
  // A ~30-week daily series (both rising) for the downgrade case: R3
  // expects dollar and gold to move OPPOSITE, so an identical pair of
  // rising series is "not holding" and a fired R3 becomes a Watch.
  const notHoldingSeries = Array.from({ length: 150 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 2, 20 + i, 0, 0, 0)).toISOString().slice(0, 10),
    value: 100 + i * 0.1,
  }));
  const rules = evaluateFxRules({
    pairs: Object.fromEntries(pairs.map((p) => [p.id, { chg: p.chg, series: [] }])),
    dollar: {
      chg: dollar.chg,
      series: overrides?.r3NotHolding ? notHoldingSeries : [],
    },
    stocks: { sp500_m1: overrides?.sp500M1 ?? 2.0 },
    gold: overrides?.r3NotHolding ? { m1: 2.0, series: notHoldingSeries } : {},
    fear: false,
    fearAvailable: false,
  });
  const snapshot: FxSnapshot = {
    v: 1,
    generatedAt: '2026-10-13T17:01:00Z',
    dollarMeasure: dollar,
    pairs,
    rules,
    summary: summarizeFxRules(rules),
    plain: buildFxPlain(dollar, pairs),
  };
  // The fixture must be a contract-valid stored object.
  FxSnapshotSchema.parse(snapshot);
  return snapshot;
}

const byId = (rules: readonly FxRuleState[], id: FxRuleState['id']): FxRuleState =>
  rules.find((r) => r.id === id)!;

/* ------------------------------------------------------------------ *
 * T1 — R3 fires on the one-month leg; the section reads "worry signs"
 * ------------------------------------------------------------------ */

describe('T1 — the R3 fast-move trigger (CR §3.1)', () => {
  const snap = screenshotSnapshot();
  const r3 = byId(snap.rules, 'r3_dollar_strength');

  it('R3 is Active · Needs attention via the M1 leg (dollar +3.2, M3 only +1.5)', () => {
    expect(r3.outcome).toBe('warning');
    expect(r3.counted).toBe(true);
    expect(r3.variant).toBe('m1');
    const view = fxRuleView(r3);
    expect(view.status).toBe('active');
    expect(view.chip).toBe('attention');
    expect(en.fx.statusActive).toBe('Active');
    expect(en.fx.chipAttention).toBe('Needs attention');
  });

  it('the card headline is "The dollar is getting much stronger" and the section reads "worry signs"', () => {
    expect(fxHeadlineVerdict(r3, en.fx)).toBe('The dollar is getting much stronger');
    expect(fxMeasureKey(snap.summary.signal)).toBe('measureAttention');
    expect(en.fx.measureAttention).toBe('Currency patterns: worry signs');
    expect(fa.fx.measureAttention).toBe('الگوهای ارزی: نشانه‌هایی از نگرانی');
    expect(snap.summary.countedWarnings).toBe(1);
    expect(fxHeadline(snap, en.fx)).toBe('“Strong or weak dollar” is active.');
  });

  it('the warning sentence names the month (not the quarter)', () => {
    expect(fxSentence(r3, en.fx, 'en-US')?.see).toBe(
      'The US dollar is up 3.2% against the big currencies over the past month.',
    );
  });
});

/* ------------------------------------------------------------------ *
 * T2 — the corrected R7: "Mostly a dollar story"
 * ------------------------------------------------------------------ */

describe('T2 — the corrected R7 (CR §3.3, fix B1)', () => {
  const snap = screenshotSnapshot();
  const r7 = byId(snap.rules, 'r7_dollar_or_euro');

  it('EUR/USD −3.6 with the dollar +3.2 is DOLLAR-led ("Mostly a dollar story")', () => {
    expect(r7.outcome).toBe('context');
    expect(r7.variant).toBe('dollar-led');
    expect(fxHeadlineVerdict(r7, en.fx)).toBe('Mostly a dollar story');
    expect(fxHeadlineVerdict(r7, fa.fx)).toBe('بیشتر ماجرای دلار است');
    expect(fxSentence(r7, en.fx, 'en-US')?.see).toBe(
      'The euro lost 3.6% against the US dollar over the past month, and the US dollar gained 3.2% against the other big currencies.',
    );
  });

  it('the words "barely moved" never appear for a move above 1.0%', () => {
    // In this fixture the dollar moved 3.2% — no string may say "barely".
    const strings = [
      fxHeadline(snap, en.fx),
      ...Object.values(fxPlainWords(snap, en.fx, 'en-US')),
      ...(fxSentence(r7, en.fx, 'en-US') ? [fxSentence(r7, en.fx, 'en-US')!.see] : []),
    ];
    for (const s of strings) expect(s).not.toContain('barely moved');
    // The phrase exists ONLY inside the euro-led template, whose engine
    // gate is |d| < 1.0 (verified in the insights engine tests): render a
    // euro-led rule with |d| = 0.5 and confirm the phrase lands there.
    const euroLed = { ...r7, variant: 'euro-led', numbers: { eurusd_m1: -3.6, dollar_m1: 0.5 } } as FxRuleState;
    expect(fxSentence(euroLed, en.fx, 'en-US')?.see).toContain('barely moved (0.5%)');
  });
});

/* ------------------------------------------------------------------ *
 * T3 — R7: no dots, no "Held in", no alarm line, never the headline
 * ------------------------------------------------------------------ */

describe('T3 — the context card never pretends to be a checked pattern (fix B2/B3/B5)', () => {
  const snap = screenshotSnapshot();
  const r7 = byId(snap.rules, 'r7_dollar_or_euro');

  it('R7 has no pattern check (no dots, no "Held in", no end labels) and no alarm line', () => {
    expect(fxRuleHasPatternCheck('r7_dollar_or_euro')).toBe(false);
    expect(r7.pattern.weeks).toHaveLength(0); // the dots gate stays closed
    expect(fxChangeLine(r7, en.fx, 'en-US')).toBeNull();
    // R4 is the other rule without a check (fix B3's pair).
    expect(fxRuleHasPatternCheck('r4_money_hiding')).toBe(false);
    expect(fxRuleHasPatternCheck('r1_risk_mood')).toBe(true);
  });

  it('R7 never leads the headline', () => {
    expect(snap.summary.headlineRule).not.toBe('r7_dollar_or_euro');
    expect(fxHeadline(snap, en.fx)).not.toContain('Dollar or euro');
    // Even in a world where R7 is the ONLY showing card, the headline
    // stays calm (a context card never counts as an active pattern).
    const onlyR7 = {
      ...snap,
      rules: snap.rules.map((r) =>
        r.id === 'r3_dollar_strength' ? { ...r, outcome: 'quiet' as const, counted: false, variant: undefined } : r,
      ),
      summary: { signal: 'normal' as const, countedWarnings: 0, headlineRule: null },
    };
    expect(fxHeadline(onlyR7, en.fx)).not.toContain('Dollar or euro');
  });
});

/* ------------------------------------------------------------------ *
 * T4 — the quiet patterns and the closest-to-alarm row
 * ------------------------------------------------------------------ */

describe('T4 — quiet rules + "Nearest to sounding the alarm" (fix B6)', () => {
  const snap = screenshotSnapshot();

  it('R1, R2, R4, R5 and R6 are Quiet', () => {
    for (const id of ['r1_risk_mood', 'r2_carry_trade', 'r4_money_hiding', 'r5_china_link', 'r6_europe_worry'] as const) {
      expect(byId(snap.rules, id).outcome).toBe('quiet');
    }
  });

  it('the closest to the alarm is Europe worry at 75% (1.5 of 2.0), in the CR §4.4 format', () => {
    const r6 = byId(snap.rules, 'r6_europe_worry');
    expect(r6.progress).toBe(75);
    const view = fxQuietView(r6, en.fx, 'en-US')!;
    expect(view).not.toBeNull();
    expect(view.line1).toBe('Europe worry · No sign of Europe worry');
    expect(view.line2).toBe(
      'The euro is down 1.5% against the Swiss franc this month. The alarm sounds at 2.0%.',
    );
    expect(view.progress).toBe(75);
    expect(en.fx.quietAreaTitle).toBe('Nearest to sounding the alarm');
    expect(fa.fx.quietAreaTitle).toBe('نزدیک‌ترین به فعال شدن هشدار');
    expect(en.fx.barLabel).toBe('How close to the alarm');
    expect(fa.fx.barLabel).toBe('چقدر تا هشدار مانده');
  });

  it('the closest pattern is NOT repeated in the quiet list (fix B6)', () => {
    const others = fxQuietRules(snap.rules, 'r6_europe_worry');
    expect(others.map((r) => r.id)).not.toContain('r6_europe_worry');
    expect(others).toHaveLength(4); // R1, R2, R4, R5
    expect(en.fx.quietMore).toBe('{n} more quiet patterns');
    expect(fa.fx.quietMore).toBe('{n} الگوی آرام دیگر');
  });
});

/* ------------------------------------------------------------------ *
 * T5 — no raw code anywhere on screen, in English or Persian
 * ------------------------------------------------------------------ */

describe('T5 — plain names everywhere (fix B4)', () => {
  const snap = screenshotSnapshot();

  /** Every on-screen string the section can render for this snapshot. */
  function allSurfaceStrings(locale: 'en' | 'fa'): string[] {
    const copy = locale === 'en' ? en : fa;
    const numberLocale = locale === 'en' ? 'en-US' : 'fa-IR';
    const out: string[] = [
      copy.fx.title,
      copy.fx.dollarRowTitle,
      copy.fx.subtitle,
      fxHeadline(snap, copy.fx, numberLocale),
      ...Object.values(fxPlainWords(snap, copy.fx, numberLocale)),
      fxDollarMeaning(snap.dollarMeasure.chg.m1, copy.fx),
    ];
    for (const rule of snap.rules) {
      const sentence = fxSentence(rule, copy.fx, numberLocale);
      if (sentence !== null) out.push(sentence.see, sentence.means);
      const verdict = fxHeadlineVerdict(rule, copy.fx);
      if (verdict !== null) out.push(verdict);
      const change = fxChangeLine(rule, copy.fx, numberLocale);
      if (change !== null) out.push(change);
      const quiet = fxQuietView(rule, copy.fx, numberLocale);
      if (quiet !== null) out.push(quiet.line1, quiet.line2 ?? '');
    }
    for (const entry of Object.values(copy.fx.entries)) out.push(entry.name);
    for (const name of Object.values(copy.fx.seriesNames)) out.push(name);
    for (const id of ['eurusd', 'usdjpy', 'dollar', 'gold', 'sp500', 'n225', 'stoxx50']) {
      out.push(fxChartLineLabel(id, [100, 103.2], copy.fx, numberLocale, locale));
    }
    for (const pair of snap.pairs) {
      const money = fxMoneyLine(pair, copy.fx, numberLocale);
      if (money !== null) out.push(money);
    }
    return out;
  }

  it('no raw code appears on the English or Persian surface', () => {
    const rawCodes = [
      'EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCNY', 'AUDUSD',
      'AUDJPY', 'EURJPY', 'EURCHF', 'AUDCNY', 'DOLLAR', 'SP500',
      'NIKKEI', 'EUROSTOXX', 'GOLD', 'AUD/USD', 'USD/JPY', 'EUR/USD',
      'EUR/CHF', 'USD/CNY', 'AUD/JPY',
    ];
    for (const surface of [...allSurfaceStrings('en'), ...allSurfaceStrings('fa')]) {
      for (const code of rawCodes) {
        expect(surface.includes(code), `"${code}" leaked on screen: "${surface}"`).toBe(false);
      }
    }
  });

  it('the chart labels carry plain names + the window change; R2 has its plain title', () => {
    expect(fxChartLineLabel('eurusd', [100, 96.4], en.fx, 'en-US', 'en')).toBe('Euro vs US dollar −3.6%');
    expect(fxChartLineLabel('dollar', [100, 103.2], en.fx, 'en-US', 'en')).toBe('US dollar strength +3.2%');
    expect(fxChartLineLabel('sp500', [100, 97.9], en.fx, 'en-US', 'en')).toBe('US stocks (S&P 500) −2.1%');
    expect(fxChartLineLabel('eurusd', [100, 96.4], fa.fx, 'fa-IR', 'fa')).toContain('یورو در برابر دلار آمریکا');
    expect(en.fx.rules.r2.name).toBe('Sudden yen jump');
    expect(fa.fx.rules.r2.name).toBe('جهش ناگهانی ین');
    expect(en.fx.dollarRowTitle).toBe('US dollar strength');
    expect(fa.fx.dollarRowTitle).toBe('قدرت دلار آمریکا');
  });
});

/* ------------------------------------------------------------------ *
 * T6 — the "In plain words" block (S1–S4)
 * ------------------------------------------------------------------ */

describe('T6 — "In plain words" (CR §4.2)', () => {
  const snap = screenshotSnapshot();
  const words = fxPlainWords(snap, en.fx, 'en-US');

  it('S1: the dollar got much stronger, 3.2%, strongest in a year', () => {
    expect(words.s1).toBe(
      'The US dollar got much stronger this month: up 3.2% against six major currencies, its strongest in a year.',
    );
  });

  it('S2: the euro and the yen lost the most', () => {
    // EUR own move −3.6; JPY own move = 1/(1+0.03)−1 = −2.9.
    expect(words.s2).toBe(
      'Against the dollar, the biggest changes this month: the euro lost 3.6% and the yen lost 2.9%.',
    );
  });

  it('S3: the Australian dollar line (always shown)', () => {
    expect(words.s3).toBe(
      'The Australian dollar got weaker against the US dollar: down 2.4% this month. Things priced in US dollars (many imports, overseas trips, online shopping) cost more.',
    );
  });

  it('S4: one warning pattern active', () => {
    expect(words.s4).toBe('1 warning pattern active: Strong or weak dollar.');
  });

  it('the stored movers match the S2 maths; a pre-v1.3 snapshot (no plain) derives the same', () => {
    expect(snap.plain!.movers.EUR).toBe(-3.6);
    expect(snap.plain!.movers.JPY).toBeCloseTo(-2.91, 1);
    const legacy = { ...snap, plain: undefined } as FxSnapshot;
    expect(fxMoversOf(legacy).EUR).toBe(-3.6);
    expect(fxMoversOf(legacy).JPY).toBeCloseTo(-2.91, 1);
  });
});

/* ------------------------------------------------------------------ *
 * T7 — the dollar row's meaning line follows the direction (fix B7)
 * ------------------------------------------------------------------ */

describe('T7 — the dynamic dollar line (CR §4.9)', () => {
  it('says the strong-dollar line at +3.2 and flips with the data', () => {
    expect(fxDollarMeaning(3.2, en.fx)).toBe(
      'A stronger dollar usually pushes gold down and makes imports and overseas trips dearer for people in other countries.',
    );
    expect(fxDollarMeaning(-2.0, en.fx)).toBe(
      'A weaker dollar usually helps gold and makes imports and overseas trips cheaper for people in other countries.',
    );
    expect(fxDollarMeaning(0.4, en.fx)).toBe('The dollar is steady, so no big effect is expected from it.');
    expect(fxDollarMeaning(-3.2, fa.fx)).toBe(
      'دلار ضعیف‌تر معمولاً به طلا کمک می‌کند و واردات و سفر خارجی را برای مردم کشورهای دیگر ارزان‌تر می‌کند.',
    );
  });

  it('the big mover: a calm section with a big move names it (CR §3.2)', () => {
    // No counted warnings; EUR/USD still fell 3.6% — the headline says so.
    const calm = screenshotSnapshot({ dollarM1: 0.4, dollarM3: 0.5 });
    expect(calm.summary.signal).toBe('normal');
    const mover = fxBigMoverOf(calm)!;
    expect(mover.kind).toBe('pair');
    expect(mover.pairId).toBe('eurusd');
    expect(fxHeadline(calm, en.fx)).toBe(
      'No warning pattern is active, but the euro lost 3.6% against the US dollar this month.',
    );
    // The dollar itself can be the mover when its move is the biggest —
    // here R3 fired but its pattern was downgraded (§6.4), so the section
    // is calm while the move stays visible (CR §3.2's exact scenario).
    const dollarLed = screenshotSnapshot({ dollarM1: 3.9, r3NotHolding: true });
    expect(dollarLed.summary.signal).toBe('normal');
    const r3down = byId(dollarLed.rules, 'r3_dollar_strength');
    expect(r3down.outcome).toBe('watch');
    expect(r3down.downgraded).toBe(true);
    expect(fxBigMoverOf(dollarLed)?.kind).toBe('dollar');
    expect(fxHeadline(dollarLed, en.fx)).toBe(
      'No warning pattern is active, but the US dollar is up 3.9% this month.',
    );
  });
});

/* ------------------------------------------------------------------ *
 * T8 — the opposite case (supportive + steady)
 * ------------------------------------------------------------------ */

describe('T8 — the mirror cases (CR §3.1)', () => {
  it('dollar M1 −3.2 → R3 Supportive with the weaker-dollar sentences', () => {
    const snap = screenshotSnapshot({ dollarM1: -3.2, dollarM3: 0.5 });
    const r3 = byId(snap.rules, 'r3_dollar_strength');
    expect(r3.outcome).toBe('supportive');
    expect(r3.variant).toBe('m1');
    expect(r3.counted).toBe(false);
    const view = fxRuleView(r3);
    expect(view.status).toBe('active');
    expect(view.chip).toBe('normal');
    expect(fxHeadlineVerdict(r3, en.fx)).toBe('The dollar is getting much weaker');
    expect(fxSentence(r3, en.fx, 'en-US')?.see).toBe(
      'The US dollar is down 3.2% against the big currencies over the past month.',
    );
    const words = fxPlainWords(snap, en.fx, 'en-US');
    expect(words.s1).toBe(
      'The US dollar got much weaker this month: down 3.2% against six major currencies, its weakest in a year.',
    );
  });

  it('dollar M1 +0.4 → "steady"', () => {
    const snap = screenshotSnapshot({ dollarM1: 0.4, dollarM3: 0.5 });
    const r3 = byId(snap.rules, 'r3_dollar_strength');
    expect(r3.outcome).toBe('quiet');
    expect(fxHeadlineVerdict(r3, en.fx)).toBe('The dollar is moving normally');
    const words = fxPlainWords(snap, en.fx, 'en-US');
    expect(words.s1).toBe('The US dollar was steady this month (0.4%).');
    expect(fxDollarMeaning(0.4, en.fx)).toBe('The dollar is steady, so no big effect is expected from it.');
  });
});

/* ------------------------------------------------------------------ *
 * T9 — R7 with d moving the opposite way to e: NO card
 * ------------------------------------------------------------------ */

describe('T9 — R7 never guesses (CR §3.3 item 5)', () => {
  it('the dollar moving against the euro shows no R7 card', () => {
    // EUR/USD fell 3.6 (e = +3.6) but the DOLLAR measure fell 1.8 → no card.
    const snap = screenshotSnapshot({ dollarM1: -1.8 });
    const r7 = byId(snap.rules, 'r7_dollar_or_euro');
    expect(r7.outcome).toBe('quiet');
    expect(fxPatternOrder(snap.rules).some((r) => r.id === 'r7_dollar_or_euro')).toBe(false);
    expect(fxSentence(r7, en.fx, 'en-US')).toBeNull();
    // And the in-between case (|d| between 1.0 and 1.5) also shows no card.
    const mid = screenshotSnapshot({ dollarM1: 1.2 });
    expect(byId(mid.rules, 'r7_dollar_or_euro').outcome).toBe('quiet');
  });
});

/* ------------------------------------------------------------------ *
 * T10 — every English string has its Persian twin
 * ------------------------------------------------------------------ */

describe('T10 — the Persian twin (CR §4.1 rule 6)', () => {
  /** Recursive key-structure comparison: fa must mirror en exactly. */
  function keyShape(a: unknown, b: unknown, path = ''): string[] {
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return [];
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    const diffs: string[] = [];
    for (const k of ka) {
      if (!kb.includes(k)) diffs.push(`missing in FA: ${path}${k}`);
      else diffs.push(...keyShape((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}${k}.`));
    }
    for (const k of kb) if (!ka.includes(k)) diffs.push(`extra in FA: ${path}${k}`);
    return diffs;
  }

  it('the fa dictionary mirrors every en key (and every value is non-empty)', () => {
    expect(keyShape(en.fx, fa.fx)).toEqual([]);
    const flat = (obj: unknown): string[] =>
      typeof obj === 'object' && obj !== null
        ? Object.values(obj as object).flatMap(flat)
        : [String(obj)];
    for (const value of flat(fa.fx)) expect(value.length).toBeGreaterThan(0);
  });

  it('the Farsi plain layer carries Persian digits and تقویت/تضعیف for currencies', () => {
    const snap = screenshotSnapshot();
    const words = fxPlainWords(snap, fa.fx, 'fa-IR');
    const faStrings = [words.s1, words.s2, words.s3, words.s4];
    for (const s of faStrings) {
      expect(s).not.toMatch(/[0-9]/); // Persian digits only
    }
    // The lines that carry numbers use Persian digits.
    expect(words.s1).toMatch(/[۰-۹]/);
    expect(words.s2).toMatch(/[۰-۹]/);
    expect(words.s3).toMatch(/[۰-۹]/);
    expect(words.s1).toBe(
      'دلار آمریکا این ماه خیلی قوی‌تر شد: ۳٫۲ درصد در برابر شش ارز مهم تقویت شده است و این قوی‌ترین حالتش در یک سال اخیر است.',
    );
    expect(words.s2).toContain('یورو');
    expect(words.s2).toContain('تضعیف');
    expect(words.s2).toContain('ین');
    expect(words.s4).toBe('یک الگوی هشداردهنده فعال است: دلار قوی یا ضعیف.');
    const r3 = byId(snap.rules, 'r3_dollar_strength');
    const faSentence = fxSentence(r3, fa.fx, 'fa-IR')!;
    expect(faSentence.see).toContain('تقویت شده است');
    expect(faSentence.see).not.toMatch(/[0-9]/);
    // The quiet line carries Persian digits too.
    const r6 = byId(snap.rules, 'r6_europe_worry');
    expect(fxQuietView(r6, fa.fx, 'fa-IR')!.line2).toBe(
      'یورو این ماه ۱٫۵ درصد در برابر فرانک سوئیس تضعیف شده است. هشدار در ۲٫۰ درصد فعال می‌شود.',
    );
  });
});

/* ------------------------------------------------------------------ *
 * T11 — reading level: no sentence over 20 words in the plain layer;
 * no acronym without its full name at first use
 * ------------------------------------------------------------------ */

describe('T11 — the reading-level check (CR §4.1 rules 1–2)', () => {
  const snap = screenshotSnapshot();

  /** The plain layer's rendered strings: S1–S4, the headline verdicts, the
   * quiet lines 2, and the five how-to-read items. */
  function plainLayerStrings(copy: typeof en.fx): string[] {
    const words = fxPlainWords(snap, copy, 'en-US');
    const out: string[] = [words.s1, words.s2 ?? '', words.s3 ?? '', words.s4];
    for (const item of copy.howToReadItems) out.push(item);
    for (const rule of snap.rules) {
      const verdict = fxHeadlineVerdict(rule, copy);
      if (verdict !== null) out.push(verdict);
      const quiet = fxQuietView(rule, copy, 'en-US');
      if (quiet?.line2 != null) out.push(quiet.line2);
    }
    return out;
  }

  it('no sentence over 20 words (EN plain layer)', () => {
    for (const text of plainLayerStrings(en.fx)) {
      for (const sentence of text.split(/(?<=[.!?])\s+/)) {
        const words = sentence.trim().split(/\s+/).filter((w) => w.length > 0);
        expect(
          words.length,
          `sentence over 20 words (${words.length}): "${sentence}"`,
        ).toBeLessThanOrEqual(20);
      }
    }
  });

  it('no acronym without its full name at first use (ECB, VIX)', () => {
    // Every plain-layer string that mentions ECB also spells out "European
    // Central Bank"; every string that mentions the VIX also names it.
    const strings = [
      ...plainLayerStrings(en.fx),
      en.fx.footerLine,
      en.fx.glossary.centralBank.def,
      en.fx.glossary.referenceRate.def,
      en.fx.glossary.vix.def,
      en.fx.rules.r1.changeLine.replace('{line}', '3.0').replace('{line2}', '2.0'),
    ];
    for (const s of strings) {
      if (s.includes('ECB')) expect(s).toContain('European Central Bank');
      if (s.includes('VIX')) expect(s).toMatch(/market fear|Market fear gauge/);
    }
    expect(en.fx.footerLine).toContain('European Central Bank (ECB)');
  });
});

/* ------------------------------------------------------------------ *
 * Extra — the S5 money line (CR §4.2), the section's third plain answer
 * ------------------------------------------------------------------ */

describe('S5 — what it means in money (CR §4.2)', () => {
  it('the euro panel: 1,000 euros a month ago vs today (rate 1.117, M1 −3.6)', () => {
    const eurusd = screenshotPairs().find((p) => p.id === 'eurusd')!;
    // old = 1117 ÷ 0.964 ≈ 1159; new = 1117; diff ≈ 42 (whole numbers,
    // locale grouping: "1,159").
    expect(fxMoneyLine(eurusd, en.fx, 'en-US')).toBe(
      'If you had changed 1,000 euros into US dollars a month ago, you would have got about 1,159 US dollars. Today you get about 1,117, which is 42 fewer.',
    );
  });

  it('the better direction and the "about the same" band (|M1| < 0.5)', () => {
    const rising = pairEntry('audusd', 0.69, { d1: 0, m1: 2.5, m3: 0, y1: 0 });
    expect(fxMoneyLine(rising, en.fx, 'en-US')).toContain('which is 17 more.');
    const flat = pairEntry('audusd', 0.69, { d1: 0, m1: 0.2, m3: 0, y1: 0 });
    expect(fxMoneyLine(flat, en.fx, 'en-US')).toContain('Today you get about the same.');
    const faFlat = pairEntry('audusd', 0.69, { d1: 0, m1: 0.2, m3: 0, y1: 0 });
    expect(fxMoneyLine(faFlat, fa.fx, 'fa-IR')).toContain('امروز تقریباً همان مقدار می‌گیرید.');
  });
});
