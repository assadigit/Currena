/**
 * fx-presentation/plain — the v1.3 plain-language layer (change request §4):
 * the "In plain words" block (S1–S4), the card's Level-1 headline verdict,
 * Level-2's "What would change this", the quiet rows' two-line view, and
 * the dollar row's meaning line (Phase: WS-4 module split of the former
 * fx-presentation.ts monolith — zero behavior change, code moved
 * verbatim). Reads the stored `plain` fields when present and derives the
 * same numbers from pre-v1.3 cached snapshots otherwise — the section
 * never shows an error for missing data.
 */

import type { FxPairId, FxRuleState, FxSnapshot } from '@currena/core';
import type { FxCurrency } from '@currena/core';
import { formatNumber } from '@currena/core';
import {
  R1_AUDJPY_M1_WARN,
  R1_SP500_M1_WARN,
  R2_NIKKEI_M1_WARN,
  R2_USDJPY_M1_WARN,
  R3_DOLLAR_M1_STRONG,
  R3_DOLLAR_M3_STRONG,
  R4_DOLLAR_M1_UP,
  R4_SP500_M1_DOWN,
  R5_USDCNY_M3_WEAK,
  R6_EURCHF_M1_WARN,
  R6_EUROSTOXX_M1_WARN,
} from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { abs1, threshold1 } from './format';
import { fxClosestToWarning, fxRuleCopyKey } from './rules';

/** Each big currency's OWN 1-month change against the US dollar, percent,
 * positive = the currency gained on the dollar (CR §4.2 S2). Reads the
 * stored `plain.movers` when present; a pre-v1.3 cached snapshot (no
 * `plain`) derives the same numbers from the stored pair rows — the section
 * never shows an error for missing data. */
export function fxMoversOf(snapshot: FxSnapshot): Partial<Record<FxCurrency, number>> {
  if (snapshot.plain !== undefined) return snapshot.plain.movers;
  const byId = new Map(snapshot.pairs.map((p) => [p.id as string, p]));
  const own = (id: FxPairId): number | undefined => byId.get(id)?.chg.m1;
  const inv = (id: FxPairId): number | undefined => {
    const m1 = byId.get(id)?.chg.m1;
    return m1 === undefined ? undefined : Math.round((1 / (1 + m1 / 100) - 1) * 10000) / 100;
  };
  return {
    EUR: own('eurusd'),
    JPY: inv('usdjpy'),
    GBP: own('gbpusd'),
    CNY: inv('usdcny'),
    CHF: inv('usdchf'),
    AUD: own('audusd'),
  };
}

/** 'high'/'low' when the dollar measure sits at its 52-week extreme (S1's
 * optional clause); derived from the stored weekly closes when a pre-v1.3
 * snapshot has no `plain`. */
function fxDollarYearExtremeOf(snapshot: FxSnapshot): 'high' | 'low' | null {
  if (snapshot.plain !== undefined) return snapshot.plain.dollarYearExtreme;
  const window = snapshot.dollarMeasure.weekly.map(([, v]) => v).slice(-52);
  if (window.length === 0) return null;
  const max = Math.max(...window);
  const min = Math.min(...window);
  const v = snapshot.dollarMeasure.value;
  if (v >= max && v > min) return 'high';
  if (v <= min && v < max) return 'low';
  return null;
}

/** S1's "steady" band: −1.0 < M1 < +1.0 (CR §4.2). */
const S1_STEADY_BAND = 1.0;

/** The "In plain words" block (CR §4.2): three to four short lines built
 * from the numbers — S1 the dollar, S2 the biggest movers, S3 the
 * Australian dollar, S4 the mood. Null lines are skipped, never blank. */
export interface FxPlainWords {
  s1: string;
  s2: string | null;
  s3: string | null;
  s4: string;
}

export function fxPlainWords(
  snapshot: FxSnapshot,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
): FxPlainWords {
  // S1 — the dollar (1 month; the ±3.0 bands share R3's fast-leg line).
  const m1 = snapshot.dollarMeasure.chg.m1;
  const x = abs1(m1, numberLocale);
  const extreme =
    m1 >= R3_DOLLAR_M1_STRONG && fxDollarYearExtremeOf(snapshot) === 'high'
      ? copy.s1ExtremeHigh
      : m1 <= -R3_DOLLAR_M1_STRONG && fxDollarYearExtremeOf(snapshot) === 'low'
        ? copy.s1ExtremeLow
        : '';
  let s1: string;
  if (m1 >= R3_DOLLAR_M1_STRONG) s1 = interpolate(copy.s1MuchStronger, { x, extreme });
  else if (m1 >= S1_STEADY_BAND) s1 = interpolate(copy.s1Stronger, { x });
  else if (m1 > -S1_STEADY_BAND) s1 = interpolate(copy.s1Steady, { x });
  else if (m1 > -R3_DOLLAR_M1_STRONG) s1 = interpolate(copy.s1Weaker, { x });
  else s1 = interpolate(copy.s1MuchWeaker, { x, extreme });

  // S2 — the two biggest changes against the dollar (each currency's OWN move).
  let s2: string | null = null;
  const movers = (Object.entries(fxMoversOf(snapshot)) as Array<[FxCurrency, number | undefined]>).filter(
    (entry): entry is [FxCurrency, number] => entry[1] !== undefined,
  );
  if (movers.length >= 2) {
    movers.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const [A, B] = [movers[0]!, movers[1]!];
    s2 = interpolate(copy.s2Line, {
      A: copy.currencyNames[A[0]],
      a: abs1(A[1], numberLocale),
      dirA: A[1] < 0 ? copy.wordLost : copy.wordGained,
      B: copy.currencyNames[B[0]],
      b: abs1(B[1], numberLocale),
      dirB: B[1] < 0 ? copy.wordLost : copy.wordGained,
    });
  }

  // S3 — the Australian dollar (always shown when the pair exists).
  let s3: string | null = null;
  const aud = snapshot.pairs.find((p) => p.id === 'audusd');
  if (aud !== undefined) {
    const a = aud.chg.m1;
    if (a <= -S1_STEADY_BAND) s3 = interpolate(copy.s3Weaker, { x: abs1(a, numberLocale) });
    else if (a >= S1_STEADY_BAND) s3 = interpolate(copy.s3Stronger, { x: abs1(a, numberLocale) });
    else s3 = interpolate(copy.s3Steady, { x: abs1(a, numberLocale) });
  }

  // S4 — the mood, from the counted warnings.
  const counted = snapshot.rules.filter((r) => r.outcome === 'warning' && r.counted);
  let s4: string;
  if (counted.length === 0) {
    const closest = fxClosestToWarning(snapshot.rules);
    s4 = interpolate(copy.s4None, {
      name: closest !== null ? copy.rules[fxRuleCopyKey(closest.id)].name : '—',
    });
  } else {
    const names = counted.map((r) => copy.rules[fxRuleCopyKey(r.id)].name).join(' · ');
    s4 =
      counted.length === 1
        ? interpolate(copy.s4One, { names })
        : interpolate(copy.s4Many, {
            n: formatNumber(counted.length, numberLocale, { maximumFractionDigits: 0 }),
            names,
          });
  }

  return { s1, s2, s3, s4 };
}

/** The card's Level-1 HEADLINE VERDICT (CR §4.3): one short line per
 * outcome — "Investors look nervous". Null for nodata rows (they show the
 * no-data line instead). A DOWNGRADED warning (§6.4: fired but the pattern
 * is not holding lately) keeps its WARNING headline — the move did happen;
 * the caution line below carries the honesty. */
export function fxHeadlineVerdict(rule: FxRuleState, copy: InsightsCopy['fx']): string | null {
  if (rule.outcome === 'nodata') return null;
  const downgradedWarning = rule.outcome === 'watch' && rule.downgraded === true;
  const asWarning: FxRuleState = downgradedWarning ? { ...rule, outcome: 'warning' } : rule;
  switch (rule.id) {
    case 'r1_risk_mood': {
      const c = copy.rules.r1;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : asWarning.outcome === 'watch'
            ? c.headlineWatch
            : c.headlineQuiet;
    }
    case 'r2_carry_trade': {
      const c = copy.rules.r2;
      return asWarning.outcome === 'warning' ? c.headlineWarning : asWarning.outcome === 'watch' ? c.headlineWatch : c.headlineQuiet;
    }
    case 'r3_dollar_strength': {
      const c = copy.rules.r3;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : c.headlineQuiet;
    }
    case 'r4_money_hiding': {
      const c = copy.rules.r4;
      if (asWarning.outcome === 'warning') return asWarning.variant === 'wobble' ? c.headlineWobble : c.headlineFlight;
      return c.headlineQuiet;
    }
    case 'r5_china_link': {
      const c = copy.rules.r5;
      return asWarning.outcome === 'warning'
        ? c.headlineWarning
        : asWarning.outcome === 'supportive'
          ? c.headlineSupportive
          : asWarning.outcome === 'watch'
            ? c.headlineWatch
            : c.headlineQuiet;
    }
    case 'r6_europe_worry': {
      const c = copy.rules.r6;
      return asWarning.outcome === 'warning' ? c.headlineWarning : asWarning.outcome === 'watch' ? c.headlineWatch : c.headlineQuiet;
    }
    case 'r7_dollar_or_euro': {
      const c = copy.rules.r7;
      return rule.variant === 'dollar-led' ? c.headlineDollarLed : rule.variant === 'euro-led' ? c.headlineEuroLed : null;
    }
  }
}

/** Level 2's "What would change this" (CR §4.3): the alarm level in words,
 * {line}/{line1}/{line2} filled from the config thresholds (no sign, one
 * decimal). Null for R7 — a context card has no alarm line (fix B5). */
export function fxChangeLine(rule: FxRuleState, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): string | null {
  switch (rule.id) {
    case 'r1_risk_mood':
      return interpolate(copy.rules.r1.changeLine, {
        line: threshold1(R1_AUDJPY_M1_WARN, numberLocale),
        line2: threshold1(R1_SP500_M1_WARN, numberLocale),
      });
    case 'r2_carry_trade':
      return interpolate(copy.rules.r2.changeLine, {
        line: threshold1(R2_USDJPY_M1_WARN, numberLocale),
        line2: threshold1(R2_NIKKEI_M1_WARN, numberLocale),
      });
    case 'r3_dollar_strength':
      return interpolate(copy.rules.r3.changeLine, {
        line1: threshold1(R3_DOLLAR_M1_STRONG, numberLocale),
        line2: threshold1(R3_DOLLAR_M3_STRONG, numberLocale),
      });
    case 'r4_money_hiding':
      return interpolate(copy.rules.r4.changeLine, {
        line1: threshold1(R4_SP500_M1_DOWN, numberLocale),
        line2: threshold1(R4_DOLLAR_M1_UP, numberLocale),
      });
    case 'r5_china_link':
      return interpolate(copy.rules.r5.changeLine, { line: threshold1(R5_USDCNY_M3_WEAK, numberLocale) });
    case 'r6_europe_worry':
      return interpolate(copy.rules.r6.changeLine, {
        line1: threshold1(R6_EURCHF_M1_WARN, numberLocale),
        line2: threshold1(R6_EUROSTOXX_M1_WARN, numberLocale),
      });
    case 'r7_dollar_or_euro':
      return null;
  }
}

/** One quiet row's display shape (CR §4.4): line 1 the plain title and its
 * quiet headline; line 2 the numbers in words; the progress bar's value. */
export interface FxQuietView {
  rule: FxRuleState;
  /** "Europe worry · No sign of Europe worry". */
  line1: string;
  /** "The euro is down 1.5% against the Swiss franc this month. The alarm
   * sounds at 2.0%." — null only when the leg's number is absent. */
  line2: string | null;
  progress: number;
}

export function fxQuietView(rule: FxRuleState, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): FxQuietView | null {
  if (rule.outcome !== 'quiet') return null;
  const c = copy.rules[fxRuleCopyKey(rule.id)];
  const headline = fxHeadlineVerdict(rule, copy);
  const line1 = headline === null ? c.name : `${c.name} · ${headline}`;
  const n = rule.numbers;
  const currencyDir = (v: number): string => (v < 0 ? copy.dirDownCurrency : copy.dirUpCurrency);
  const stockDir = (v: number): string => (v < 0 ? copy.dirDownStock : copy.dirUpStock);
  let line2: string | null = null;
  switch (rule.id) {
    case 'r1_risk_mood': {
      const v = n.audjpy_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r1, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R1_AUDJPY_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r2_carry_trade': {
      const v = n.usdjpy_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r2, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R2_USDJPY_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r3_dollar_strength': {
      // The NEARER of the two legs carries the wording (CR §3.1).
      const m1 = n.dollar_m1;
      const m3 = n.dollar_m3;
      if (m1 !== undefined && m3 !== undefined) {
        const m1Nearer = Math.abs(m1) / R3_DOLLAR_M1_STRONG >= Math.abs(m3) / R3_DOLLAR_M3_STRONG;
        const v = m1Nearer ? m1 : m3;
        line2 = interpolate(m1Nearer ? copy.quietNumbers.r3M1 : copy.quietNumbers.r3M3, {
          dir: currencyDir(v),
          x: abs1(v, numberLocale),
          line: threshold1(m1Nearer ? R3_DOLLAR_M1_STRONG : R3_DOLLAR_M3_STRONG, numberLocale),
        });
      }
      break;
    }
    case 'r4_money_hiding': {
      const v = n.sp500_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r4, { dir: stockDir(v), x: abs1(v, numberLocale), line: threshold1(R4_SP500_M1_DOWN, numberLocale) });
      }
      break;
    }
    case 'r5_china_link': {
      const v = n.usdcny_m3;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r5, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R5_USDCNY_M3_WEAK, numberLocale) });
      }
      break;
    }
    case 'r6_europe_worry': {
      const v = n.eurchf_m1;
      if (v !== undefined) {
        line2 = interpolate(copy.quietNumbers.r6, { dir: currencyDir(v), x: abs1(v, numberLocale), line: threshold1(R6_EURCHF_M1_WARN, numberLocale) });
      }
      break;
    }
    case 'r7_dollar_or_euro':
      return null; // a quiet R7 shows no card at all (§9.3)
  }
  return { rule, line1, line2, progress: rule.progress };
}

/** The dollar row's meaning line (CR §4.9, fix B7): follows the dollar's
 * 1-month direction — the old fixed sentence was wrong on weak or steady
 * days. */
export function fxDollarMeaning(dollarM1: number, copy: InsightsCopy['fx']): string {
  if (dollarM1 >= 1.0) return copy.dollarMeaningStrong;
  if (dollarM1 <= -1.0) return copy.dollarMeaningWeak;
  return copy.dollarMeaningSteady;
}
