/**
 * fx-presentation.test.ts — the §9 wording rules, pinned (currencies spec
 * build step 8's vocabulary test + §10.3's templates):
 *
 *   - the §9.3 status table (engine names → Active/Watching/Quiet + the
 *     page's chips, and NOTHING else on screen);
 *   - the pattern-card ordering + the 3-card cap + R7's 2.5% gate;
 *   - the quiet area's closest-to-warning choice (nodata excluded);
 *   - the §10.3 headline templates, filled from the numbers;
 *   - the two-part sentences (§7) with real numbers, EN + FA;
 *   - the pairs table's group order and the Trend column.
 */

import { describe, expect, it } from 'vitest';
import type { FxRuleState, FxSnapshot } from '@currena/core';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
import {
  fxClosestToWarning,
  fxHeadline,
  fxMeasureKey,
  fxPairRows,
  fxPatternOrder,
  fxQuietRules,
  fxRuleView,
  fxSentence,
  fxTrendOf,
} from './fx-presentation';
import type { InsightsCopy } from '../i18n/insights-copy-en';

const en = insightsCopyEn;
const fa = insightsCopyFa;

/** A rule state with just the fields the presentation reads. */
function ruleOf(partial: Partial<FxRuleState> & Pick<FxRuleState, 'id' | 'outcome' | 'counted'>): FxRuleState {
  return {
    numbers: {},
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
    chart: { expect: 'together', series: [] },
    ...partial,
  } as FxRuleState;
}

describe('fxRuleView — the §9.3 status table (V1: only Active/Watching/Quiet + chips)', () => {
  it('warning → Active + Needs attention; the wobble → Active + Unusual', () => {
    expect(fxRuleView(ruleOf({ id: 'r1_risk_mood', outcome: 'warning', counted: true }))).toMatchObject({
      status: 'active',
      chip: 'attention',
    });
    expect(
      fxRuleView(ruleOf({ id: 'r4_money_hiding', outcome: 'warning', counted: true, variant: 'wobble' })),
    ).toMatchObject({ status: 'active', chip: 'unusual' });
  });

  it('supportive → Active + Normal; watch → Watching, no chip; context → Active, no chip', () => {
    expect(fxRuleView(ruleOf({ id: 'r3_dollar_strength', outcome: 'supportive', counted: false }))).toMatchObject({
      status: 'active',
      chip: 'normal',
    });
    expect(fxRuleView(ruleOf({ id: 'r1_risk_mood', outcome: 'watch', counted: false }))).toMatchObject({
      status: 'watching',
      chip: null,
    });
    expect(fxRuleView(ruleOf({ id: 'r7_dollar_or_euro', outcome: 'context', counted: false }))).toMatchObject({
      status: 'active',
      chip: null,
    });
  });

  it('quiet → Quiet; nodata → stays a row, never a status word', () => {
    expect(fxRuleView(ruleOf({ id: 'r2_carry_trade', outcome: 'quiet', counted: false })).status).toBe('quiet');
    expect(fxRuleView(ruleOf({ id: 'r1_risk_mood', outcome: 'nodata', counted: false })).status).toBe('quiet');
  });
});

describe('fxPatternOrder — §9.3 item 3', () => {
  it('shows at most 3, most serious first (unusual > attention > watching > supportive > context)', () => {
    const rules: FxRuleState[] = [
      ruleOf({ id: 'r7_dollar_or_euro', outcome: 'context', counted: false, variant: 'dollar-led' }),
      ruleOf({ id: 'r2_carry_trade', outcome: 'watch', counted: false }),
      ruleOf({ id: 'r3_dollar_strength', outcome: 'warning', counted: true }),
      ruleOf({ id: 'r5_china_link', outcome: 'warning', counted: true, variant: undefined }),
      ruleOf({ id: 'r6_europe_worry', outcome: 'supportive', counted: false }),
      ruleOf({ id: 'r1_risk_mood', outcome: 'quiet', counted: false }),
      ruleOf({ id: 'r4_money_hiding', outcome: 'warning', counted: true, variant: 'wobble' }),
    ];
    const order = fxPatternOrder(rules);
    expect(order.length).toBe(3);
    expect(order.map((r) => r.id)).toEqual(['r4_money_hiding', 'r3_dollar_strength', 'r5_china_link']);
  });

  it('R7 appears only when it is in context (EUR/USD ≥ 2.5%); below it the card stays away', () => {
    const quietR7 = ruleOf({ id: 'r7_dollar_or_euro', outcome: 'quiet', counted: false });
    expect(fxPatternOrder([quietR7])).toHaveLength(0);
    const contextR7 = ruleOf({ id: 'r7_dollar_or_euro', outcome: 'context', counted: false, variant: 'euro-led' });
    expect(fxPatternOrder([contextR7])).toHaveLength(1);
  });
});

describe('the quiet area (§9.3 item 4 / §6.7)', () => {
  it('closest-to-warning = the quiet rule with the highest progress; nodata never rides', () => {
    const rules: FxRuleState[] = [
      ruleOf({ id: 'r1_risk_mood', outcome: 'quiet', counted: false, progress: 12 }),
      ruleOf({ id: 'r2_carry_trade', outcome: 'quiet', counted: false, progress: 41 }),
      ruleOf({ id: 'r6_europe_worry', outcome: 'quiet', counted: false, progress: 7 }),
      ruleOf({ id: 'r1_risk_mood', outcome: 'nodata', counted: false, progress: 99 } as never),
    ];
    const closest = fxClosestToWarning(rules as FxRuleState[]);
    expect(closest?.id).toBe('r2_carry_trade');
    expect(fxQuietRules(rules as FxRuleState[]).map((r) => r.id)).toEqual([
      'r1_risk_mood',
      'r2_carry_trade',
      'r6_europe_worry',
    ]);
  });
});

describe('the §9.10 measure labels + §10.3 headlines', () => {
  it('the measure label follows the signal, EN + FA verbatim', () => {
    expect(fxMeasureKey('normal')).toBe('measureNormal');
    expect(fxMeasureKey('attention')).toBe('measureAttention');
    expect(fxMeasureKey('unusual')).toBe('measureUnusual');
    expect(en.fx.measureNormal).toBe('Currency patterns: calm');
    expect(fa.fx.measureNormal).toBe('الگوهای ارزی: آرام');
    expect(en.fx.measureAttention).toBe('Currency patterns: worry signs');
    expect(fa.fx.measureAttention).toBe('الگوهای ارزی: نشانه‌هایی از نگرانی');
  });

  it('calm headline names the closest-to-warning pattern', () => {
    const rules = [
      ruleOf({ id: 'r1_risk_mood', outcome: 'quiet', counted: false, progress: 30 }),
    ];
    const snap = { rules, summary: { signal: 'normal', countedWarnings: 0, headlineRule: null } } as never as Pick<
      FxSnapshot,
      'rules' | 'summary'
    >;
    expect(fxHeadline(snap, en.fx)).toBe('No pattern is active. Closest to a warning: “Nervous or relaxed?”.');
    expect(fxHeadline(snap, fa.fx)).toContain('بازار نگران است یا آرام؟');
  });

  it('one active pattern: the active headline; plus-n-more rides the second template', () => {
    const rules = [
      ruleOf({ id: 'r3_dollar_strength', outcome: 'warning', counted: true }),
      ruleOf({ id: 'r5_china_link', outcome: 'watch', counted: false }),
    ];
    const one = { rules: [rules[0]!], summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r3_dollar_strength' } } as never;
    expect(fxHeadline(one as never, en.fx)).toBe('“Strong or weak dollar” is active.');
    const two = {
      rules: [rules[0]!, ruleOf({ id: 'r6_europe_worry', outcome: 'warning', counted: true })],
      summary: { signal: 'attention', countedWarnings: 2, headlineRule: 'r3_dollar_strength' },
    } as never;
    expect(fxHeadline(two as never, en.fx)).toBe('“Strong or weak dollar” is active, plus 1 more.');
  });

  it('unusual + the wobble get their own headlines (§10.3 rows 3–4)', () => {
    const unusual = {
      rules: [
        ruleOf({ id: 'r1_risk_mood', outcome: 'warning', counted: true }),
        ruleOf({ id: 'r2_carry_trade', outcome: 'warning', counted: true }),
        ruleOf({ id: 'r3_dollar_strength', outcome: 'warning', counted: true }),
      ],
      summary: { signal: 'unusual', countedWarnings: 3, headlineRule: 'r1_risk_mood' },
    } as never;
    expect(fxHeadline(unusual as never, en.fx)).toBe('Several patterns are active at once, led by “Nervous or relaxed?”.');
    const wobble = {
      rules: [ruleOf({ id: 'r4_money_hiding', outcome: 'warning', counted: true, variant: 'wobble' })],
      summary: { signal: 'unusual', countedWarnings: 1, headlineRule: 'r4_money_hiding' },
    } as never;
    expect(fxHeadline(wobble as never, en.fx)).toBe(
      'Money is leaving stocks and the dollar together, which is unusual.',
    );
  });
});

describe('fxSentence — the two-part sentences (§7), EN + FA', () => {
  it('R1 warning with the S&P variant fills {x} and {stocks}', () => {
    const rule = ruleOf({
      id: 'r1_risk_mood',
      outcome: 'warning',
      counted: true,
      numbers: { audjpy_m1: -3.4, sp500_m1: -2.6, eurjpy_m1: -3.1 },
    });
    const sentence = fxSentence(rule, en.fx, 'en-US');
    expect(sentence?.see).toBe(
      'The Australian dollar is down 3.4% against the yen over the past month, while the S&P 500 is down 2.6%.',
    );
    expect(sentence?.means).toBe('This usually goes with nervous investors.');
  });

  it('R1 warning with the fear leg (D-05) uses the VIX variant', () => {
    const rule = ruleOf({
      id: 'r1_risk_mood',
      outcome: 'warning',
      counted: true,
      numbers: { audjpy_m1: -3.4, market_fear: 1 },
    });
    const sentence = fxSentence(rule, en.fx, 'en-US');
    expect(sentence?.see).toContain('market fear (the VIX) is elevated');
  });

  it('R4 wobble fills {x}, {y} and {g}', () => {
    const rule = ruleOf({
      id: 'r4_money_hiding',
      outcome: 'warning',
      counted: true,
      variant: 'wobble',
      numbers: { sp500_m1: -3.5, dollar_m1: -2.2, gold_m1: 3.3 },
    });
    expect(fxSentence(rule, en.fx, 'en-US')?.see).toBe(
      'Over the past month the S&P 500 is down 3.5%, the US dollar is down 2.2% and gold is up 3.3%.',
    );
  });

  it('the Farsi sentences carry Persian digits (the fa-IR number locale)', () => {
    const rule = ruleOf({
      id: 'r3_dollar_strength',
      outcome: 'warning',
      counted: true,
      numbers: { dollar_m3: 4.25 },
    });
    const sentence = fxSentence(rule, fa.fx, 'fa-IR');
    expect(sentence?.see).toBe('دلار آمریکا در سه ماه گذشته ۴٫۳ درصد در برابر ارزهای بزرگ جهان تقویت شده است.');
    // No Latin digit may leak into the Farsi sentence.
    expect(sentence?.see).not.toMatch(/[0-9]/);
  });

  it('R5 watch names whichever leg moved ({leg})', () => {
    const cnyOnly = ruleOf({ id: 'r5_china_link', outcome: 'watch', counted: false, numbers: { usdcny_m3: 2.3 } });
    expect(fxSentence(cnyOnly, en.fx, 'en-US')?.see).toBe(
      'Only one of the two has moved so far: the yuan is down 2.3% against the US dollar.',
    );
  });

  it('a rule without a sentence shape (quiet) returns null — the row shows the quiet word only', () => {
    expect(fxSentence(ruleOf({ id: 'r2_carry_trade', outcome: 'quiet', counted: false }), en.fx, 'en-US')).toBeNull();
  });
});

describe('the pairs table (§9.3 item 6)', () => {
  it('rows keep the three group blocks in spec order; absent pairs stay absent', () => {
    const pairs = [
      { id: 'audjpy', chg: { d1: 0, m1: -1, m3: -2, y1: -3 } },
      { id: 'eurusd', chg: { d1: 0, m1: 1, m3: 2, y1: 3 } },
    ] as never;
    const rows = fxPairRows(pairs);
    expect(rows.map((r) => r.entry.id)).toEqual(['eurusd', 'audjpy']); // group order, not input order
    expect(rows.map((r) => r.group)).toEqual(['dollarWorld', 'warningLights']);
  });

  it('the m1 sort orders by the size of the 1-month move (§9.3: one sort only)', () => {
    const pairs = [
      { id: 'eurusd', chg: { d1: 0, m1: 0.5, m3: 0, y1: 0 } },
      { id: 'usdjpy', chg: { d1: 0, m1: -3, m3: 0, y1: 0 } },
      { id: 'gbpusd', chg: { d1: 0, m1: 2, m3: 0, y1: 0 } },
    ] as never;
    expect(fxPairRows(pairs, 'm1').map((r) => r.entry.id)).toEqual(['usdjpy', 'gbpusd', 'eurusd']);
  });

  it('the Trend column: last weekly close vs ~4 weeks back', () => {
    const rising = { id: 'eurusd', weekly: [[1, 100], [2, 101], [3, 102], [4, 103], [5, 104]] } as never;
    expect(fxTrendOf(rising)).toBe('up');
    const falling = { id: 'eurusd', weekly: [[1, 104], [2, 103], [3, 102], [4, 101], [5, 100]] } as never;
    expect(fxTrendOf(falling)).toBe('down');
    const flat = { id: 'eurusd', weekly: [[1, 100], [2, 100.1], [3, 100], [4, 100.1], [5, 100]] } as never;
    expect(fxTrendOf(flat)).toBe('flat');
  });
});

describe('the copy corpus (both locales, spec-verbatim anchors)', () => {
  const check = (copy: InsightsCopy): void => {
    // §10.2 anchors
    expect(copy.fx.title).toBeTruthy();
    expect(copy.fx.statusActive).toBeTruthy();
    expect(copy.fx.reliabilityDetail).toContain('{k}');
    expect(copy.fx.morePatterns).toContain('{n}');
    expect(copy.fx.level3Toggle).toBeTruthy();
    expect(copy.fx.empty).toBeTruthy();
    expect(copy.fx.footerLine).toBeTruthy();
    // §8 + §7 coverage: 10 pairs + the dollar row + 7 rules
    expect(Object.keys(copy.fx.entries)).toHaveLength(10);
    expect(Object.keys(copy.fx.rules)).toHaveLength(7);
    expect(copy.fx.rules.r1.warning.see).toContain('{x}');
    expect(copy.fx.rules.r7.dollarLed.see).toContain('{d}');
  };
  it('EN carries every anchor', () => check(en));
  it('FA carries every anchor', () => check(fa));
});
