/**
 * fx-presentation/sentences — the two-part §7 sentences: "what we see"
 * (the real numbers) and "what it usually means", filled from the rule
 * state, never free text (Phase: WS-4 module split of the former
 * fx-presentation.ts monolith — zero behavior change, code moved
 * verbatim). A DOWNGRADED warning (§6.4: fired but not holding lately)
 * keeps its WARNING sentence — the numbers are facts; the Watching status
 * word and the caution line carry the reliability caveat.
 */

import type { FxRuleState } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { abs1 } from './format';

export interface FxSentence {
  see: string;
  means: string;
}

/** The §7 sentence pair for a rule state, numbers formatted per locale.
 * A DOWNGRADED warning (§6.4: fired but not holding lately) keeps its
 * WARNING sentence — the numbers are facts; the Watching status word and
 * the caution line carry the reliability caveat. */
export function fxSentence(
  rule: FxRuleState,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR',
): FxSentence | null {
  const state: FxRuleState =
    rule.outcome === 'watch' && rule.downgraded === true ? { ...rule, outcome: 'warning' } : rule;
  const n = (key: string): number | undefined => {
    const v = rule.numbers[key];
    return v === undefined ? undefined : v;
  };
  const fmt = (key: string): string | undefined => {
    const v = n(key);
    return v === undefined ? undefined : abs1(v, numberLocale);
  };
  const fill = (template: string, params: Record<string, string>): string =>
    interpolate(template, params);
  const c = copy.rules;

  switch (state.id) {
    case 'r1_risk_mood': {
      const audjpy = fmt('audjpy_m1');
      if (audjpy === undefined) return null;
      // {stocks}: the S&P variant when its number exists, the fear variant
      // when it was the fear leg that confirmed (§7's {stocks} rule).
      const sp = n('sp500_m1');
      const fear = rule.numbers.market_fear !== undefined;
      const stocks =
        sp !== undefined
          ? fill(c.r1.stocksSp500, { y: abs1(sp, numberLocale) })
          : fear
            ? c.r1.stocksFear
            : c.r1.stocksSp500; // nodata guard — the row never renders as a sentence
      if (state.outcome === 'warning') {
        return {
          see: fill(c.r1.warning.see, { x: audjpy, stocks }),
          means: c.r1.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        return {
          see: fill(c.r1.supportive.see, {
            x: audjpy,
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
          }),
          means: c.r1.supportive.means,
        };
      }
      if (state.outcome === 'watch') {
        return { see: fill(c.r1.watch.see, { x: audjpy }), means: c.r1.watch.means };
      }
      return null;
    }
    case 'r2_carry_trade': {
      const usdjpy = rule.numbers.usdjpy_m1;
      if (usdjpy === undefined) return null;
      if (state.outcome === 'warning') {
        const nikkei = rule.numbers.nikkei_m1;
        return {
          see: fill(c.r2.warning.see, {
            x: abs1(usdjpy, numberLocale),
            y: nikkei !== undefined ? abs1(nikkei, numberLocale) : '—',
          }),
          means: c.r2.warning.means,
        };
      }
      if (state.outcome === 'watch') {
        const m3 = rule.numbers.usdjpy_m3;
        return {
          see: fill(c.r2.watch.see, { x: m3 !== undefined ? abs1(m3, numberLocale) : '—' }),
          means: c.r2.watch.means,
        };
      }
      return null;
    }
    case 'r3_dollar_strength': {
      const m1 = rule.numbers.dollar_m1;
      const m3 = rule.numbers.dollar_m3;
      if (state.outcome === 'warning') {
        // v1.3 (CR §3.1): the variant names the leg that fired, so the
        // sentence says "over the past month" or "over the past three
        // months" honestly.
        const useM1 = rule.variant === 'm1';
        const v = useM1 ? m1 : m3;
        if (v === undefined) return null;
        return {
          see: fill(useM1 ? c.r3.warningM1See : c.r3.warning.see, { x: abs1(v, numberLocale) }),
          means: c.r3.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        const useM1 = rule.variant === 'm1';
        const v = useM1 ? m1 : m3;
        if (v === undefined) return null;
        return {
          see: fill(useM1 ? c.r3.supportiveM1See : c.r3.supportive.see, { x: abs1(v, numberLocale) }),
          means: c.r3.supportive.means,
        };
      }
      return null;
    }
    case 'r4_money_hiding': {
      const sp = rule.numbers.sp500_m1;
      const d = rule.numbers.dollar_m1;
      const g = rule.numbers.gold_m1;
      if (rule.variant === 'wobble') {
        return {
          see: fill(c.r4.wobble.see, {
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
            x: d !== undefined ? abs1(d, numberLocale) : '—',
            g: g !== undefined ? abs1(g, numberLocale) : '—',
          }),
          means: c.r4.wobble.means,
        };
      }
      if (state.outcome === 'warning') {
        return {
          see: fill(c.r4.flight.see, {
            y: sp !== undefined ? abs1(sp, numberLocale) : '—',
            x: d !== undefined ? abs1(d, numberLocale) : '—',
          }),
          means: c.r4.flight.means,
        };
      }
      return null;
    }
    case 'r5_china_link': {
      const cny = rule.numbers.usdcny_m3;
      const aud = rule.numbers.audusd_m3;
      if (state.outcome === 'warning') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.warning.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.warning.means,
        };
      }
      if (state.outcome === 'supportive') {
        if (cny === undefined || aud === undefined) return null;
        return {
          see: fill(c.r5.supportive.see, { x: abs1(cny, numberLocale), y: abs1(aud, numberLocale) }),
          means: c.r5.supportive.means,
        };
      }
      if (state.outcome === 'watch') {
        // {leg}: whichever of the two moved (§7's {leg} rule).
        const leg =
          cny !== undefined
            ? fill(c.r5.legCny, { x: abs1(cny, numberLocale) })
            : aud !== undefined
              ? fill(c.r5.legAud, { y: abs1(aud, numberLocale) })
              : '—';
        return { see: fill(c.r5.watch.see, { leg }), means: c.r5.watch.means };
      }
      return null;
    }
    case 'r6_europe_worry': {
      const eurchf = rule.numbers.eurchf_m1;
      if (eurchf === undefined) return null;
      if (state.outcome === 'warning') {
        const stoxx = rule.numbers.stoxx50_m1;
        return {
          see: fill(c.r6.warning.see, {
            x: abs1(eurchf, numberLocale),
            y: stoxx !== undefined ? abs1(stoxx, numberLocale) : '—',
          }),
          means: c.r6.warning.means,
        };
      }
      if (state.outcome === 'watch') {
        return { see: fill(c.r6.watch.see, { x: abs1(eurchf, numberLocale) }), means: c.r6.watch.means };
      }
      return null;
    }
    case 'r7_dollar_or_euro': {
      const eurusd = rule.numbers.eurusd_m1;
      const d = rule.numbers.dollar_m1;
      if (eurusd === undefined || d === undefined) return null;
      // v1.3 (CR §3.3): the euro's own move carries the verb (lost/gained),
      // and the euro-up/euro-down halves pick their own template.
      if (rule.variant === 'dollar-led') {
        const t = eurusd < 0 ? c.r7.dollarLedEuroDown : c.r7.dollarLedEuroUp;
        return { see: fill(t.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }), means: t.means };
      }
      if (rule.variant === 'euro-led') {
        const t = eurusd < 0 ? c.r7.euroLedEuroDown : c.r7.euroLedEuroUp;
        return { see: fill(t.see, { x: abs1(eurusd, numberLocale), d: abs1(d, numberLocale) }), means: t.means };
      }
      return null;
    }
  }
}
