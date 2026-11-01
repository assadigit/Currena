/**
 * round2.test.ts — the pure-layer guard tests for the signal-first density
 * pass (docs/insights/06-ux-round-2-spec.md, R1–R28). Every spec block that
 * demands a unit test over pure helpers is covered here:
 *
 *   R2  heroReason — the fixed-table reason line + the contradiction guard
 *   R3  attentionTiles — extremity sort, warning-only, section-scoped
 *   R5  tierOf — the two-tier model: precedence, history floor, stale
 *   R7  groupVisibility — needs-attention never hidden, ≥3 visible
 *   R11 moneyPanel — ≤4 lines, worst-state selection, area map integrity
 *   R12 formatDateWords — month names, no all-numeric day/month pairs
 *   R13 units coverage — every DISPLAY row renders a unit in both locales
 *   R14 code-pattern scan — no source codes/series ids in names or tags
 *   R18 counts consistency — hero-side counts equal the group sums
 *   R26 mergeSignals — no duplicated condition keys, silver-only split
 *   R27 evidence discipline — no visible "to verify" placeholder
 *   R28 sentence-versus-number guard — band words computed from live values
 */

import { describe, expect, it } from 'vitest';
import type { CalendarEvent, IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import type { GaugeReading } from '@currena/insights';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import {
  GROUP_ORDER,
  LANE_GROUP_ORDER,
  DOLLAR_STRENGTH_IDS,
  US_GLOBAL_REACH_IDS,
  HIDDEN_FROM_LANE_IDS,
  SUBHEADING_SECTIONS,
  attentionTiles,
  bandPositionOf,
  bandWordsOf,
  bigMovers,
  consequenceLine,
  definitionFor,
  DISPLAY,
  groupCounts,
  groupVisibility,
  heroReason,
  heroReasonIsConsistent,
  mergeSignals,
  moneyPanel,
  MONEY_AREAS,
  statusCounts,
  tierOf,
  togetherSummary,
  // v3 UI_SPEC §3/§4 (2026-10-20, PH6-A)
  heroSentence,
  heroWhy,
  heroReadingCounts,
  calmGauges,
  heroNextEvent,
  heroStaleInputs,
  dailyPeersOf,
  tradingDaysBehind,
} from './config';
import { evaluateConnections } from '@currena/insights';
import { insightsCopyEn, type InsightsCopy } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import signalsSrc from './Signals.tsx?raw';
import signalsIconsSrc from './signals/icons.tsx?raw';
import signalsVerdictSrc from './signals/verdict.tsx?raw';
import signalsBalanceSrc from './signals/BalanceScale.tsx?raw';
import signalsCardSrc from './signals/MergedCard.tsx?raw';
import connectionCardSrc from './ConnectionCard.tsx?raw';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

function reading(partial: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 1,
    asOf: '2026-10-06',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-07T04:20:00.000Z',
    ...partial,
  } as IndicatorReading;
}

const gauge = (id: string, step: number, section: InsightsSection = 'global'): GaugeReading =>
  ({
    gauge: id as GaugeReading['gauge'],
    section,
    step,
    votingCount: 3,
    warningCount: step >= 3 ? 1 : 0,
  }) as GaugeReading;

const REASON_WORDS: Record<number, string> = { 1: 'Stable', 2: 'Cautious', 3: 'Stressed', 4: 'Critical' };

/* ------------------------------------------------------------------ *
 * R2 — the hero reason fixed table
 * ------------------------------------------------------------------ */

describe('R2 heroReason (fixed table, never contradicts the gauges)', () => {
  const nameOf = (g: string): string => ({ 'borrowing-costs': 'Borrowing costs', 'prices-heat': 'Price heat' })[g] ?? g;
  const build = (gauges: GaugeReading[]): string =>
    heroReason({
      gauges,
      words: REASON_WORDS,
      calm: 'The main areas are sitting in their calm middle.',
      top: '{k} of {n} areas {isAre} {word}: {names}.',
      others: 'The rest are {word}.',
      othersOne: 'The other one is {word}.',
      is: 'is',
      are: 'are',
      notEnough: 'Not enough fresh data to read the areas yet.',
      nameOf,
    });

  it('every gauge at step 1 → the one calm sentence (no numbers)', () => {
    expect(build([gauge('borrowing-costs', 1), gauge('prices-heat', 1)])).toBe(
      'The main areas are sitting in their calm middle.',
    );
  });

  it('no readable gauge → the not-enough line', () => {
    expect(build([gauge('borrowing-costs', 0)])).toBe('Not enough fresh data to read the areas yet.');
  });

  it('a step-3 gauge is NAMED; the tail gets the calmer word', () => {
    const line = build([gauge('borrowing-costs', 3), gauge('prices-heat', 1)]);
    expect(line).toContain('Borrowing costs');
    expect(line).toContain('Stressed');
    expect(line).toContain('Stable');
    expect(heroReasonIsConsistent(line, [gauge('borrowing-costs', 3), gauge('prices-heat', 1)], nameOf)).toBe(true);
  });

  it('FULL STEP MATRIX: label, reason and meter step agree for every combination', () => {
    const steps = [1, 2, 3, 4] as const;
    for (const a of steps) {
      for (const b of steps) {
        const gauges = [gauge('borrowing-costs', a), gauge('prices-heat', b)];
        const line = build(gauges);
        const max = Math.max(a, b);
        if (a === 1 && b === 1) {
          expect(line).toBe('The main areas are sitting in their calm middle.');
        } else {
          // the top step's word always appears, its gauges always named
          expect(line).toContain(REASON_WORDS[max]!);
          for (const g of gauges) {
            if (g.step === max) expect(line).toContain(nameOf(g.gauge));
          }
          // a reassurance never coexists with a step-3+ gauge
          if (max >= 3) expect(/not worth worrying|no need to worry/i.test(line)).toBe(false);
          expect(heroReasonIsConsistent(line, gauges, nameOf)).toBe(true);
        }
      }
    }
  });

  it('the guard FAILS the known bad shape: reassurance while a gauge is stressed', () => {
    expect(
      heroReasonIsConsistent(
        'Borrowing costs are Stressed, but it is not worth worrying about.',
        [gauge('borrowing-costs', 3)],
        nameOf,
      ),
    ).toBe(false);
    expect(heroReasonIsConsistent('All calm.', [gauge('borrowing-costs', 3)], nameOf)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * R3 — attention tiles
 * ------------------------------------------------------------------ */

describe('R3 attentionTiles (extremity sort, warning-only, section-scoped)', () => {
  it('sorts the section’s warning rows by extremity, deepest first', () => {
    const rows = attentionTiles(
      [
        reading({ id: 'us10y', status: 'warning', percentile10y: 0.9 }),
        reading({ id: 'us-cpi-yoy', status: 'warning', percentile10y: 0.97 }),
        reading({ id: 'au-cpi', status: 'warning', percentile10y: 0.95 }),
        reading({ id: 'dollar-basket', status: 'normal', percentile10y: 0.99 }),
      ],
      'global',
    );
    expect(rows[0]!.id).toBe('us-cpi-yoy'); // 1-0.97 deepest high tail
    expect(rows.every((r) => ['us10y', 'us-cpi-yoy'].includes(r.id))).toBe(true);
  });

  it('low-tail rules flip the extremity (1 - percentile)', () => {
    // audusd's rule is a low-tail percentile (definitions.ts) — the deeper
    // into the LOW tail, the bigger 1 - percentile.
    const rows = attentionTiles(
      [reading({ id: 'audusd', status: 'warning', percentile10y: 0.02 })],
      'australia',
    );
    expect(rows[0]!.extremity).toBeCloseTo(0.98, 5);
  });
});

/* ------------------------------------------------------------------ *
 * R5 — the two-tier model
 * ------------------------------------------------------------------ */

describe('R5 tierOf (precedence, history floor, stale handling)', () => {
  it('needs-attention wins over unusual (one tier per card)', () => {
    expect(tierOf(reading({ id: 'us10y', status: 'warning', percentile10y: 0.97 }))).toBe('needs-attention');
  });

  it('unusual = normal status + percentile in the top/bottom 10%', () => {
    expect(tierOf(reading({ id: 'us10y', status: 'normal', percentile10y: 0.93 }))).toBe('unusual');
    expect(tierOf(reading({ id: 'us10y', status: 'normal', percentile10y: 0.07 }))).toBe('unusual');
    // The band is INCLUSIVE of the cutoffs (≤ 0.10 and ≥ 0.90).
    expect(tierOf(reading({ id: 'us10y', status: 'normal', percentile10y: 0.9 }))).toBe('unusual');
    expect(tierOf(reading({ id: 'us10y', status: 'normal', percentile10y: 0.899 }))).toBe('normal');
    expect(tierOf(reading({ id: 'us10y', status: 'normal', percentile10y: 0.5 }))).toBe('normal');
  });

  it('the 30-observation floor: no percentile → never unusual', () => {
    expect(tierOf(reading({ id: 'us10y', status: 'normal' }))).toBe('normal');
  });

  it('context / stale / unavailable pass through unchanged', () => {
    expect(tierOf(reading({ id: 'rba-cash-rate', status: 'context' }))).toBe('context');
    expect(tierOf(reading({ id: 'dollar-basket', status: 'stale' }))).toBe('stale');
    expect(tierOf(reading({ id: 'china-pmi', status: 'unavailable' }))).toBe('unavailable');
  });
});

/* ------------------------------------------------------------------ *
 * R7 — signals-first default view
 * ------------------------------------------------------------------ */

describe('R7 groupVisibility (needs-attention never hidden)', () => {
  const many: IndicatorReading[] = Array.from({ length: 8 }, () =>
    reading({ id: 'us10y', status: 'normal', percentile10y: 0.5 }),
  ).map((r, i) => ({ ...r, id: (i === 0 ? 'us10y' : 'real-yield-10y') as IndicatorId }));

  it('needs-attention + unusual are visible; the rest top up to the minimum', () => {
    const readings = [
      reading({ id: 'us10y', status: 'warning' }),
      reading({ id: 'real-yield-10y', status: 'normal', percentile10y: 0.95 }),
      reading({ id: 'breakeven-5y5y', status: 'normal', percentile10y: 0.5 }),
      reading({ id: 'stress-stlfsi', status: 'normal', percentile10y: 0.5 }),
      reading({ id: 'nfci', status: 'normal', percentile10y: 0.5 }),
    ];
    const { visible, collapsed } = groupVisibility(readings);
    expect(visible.map((r) => r.id)).toContain('us10y'); // needs-attention
    expect(visible.map((r) => r.id)).toContain('real-yield-10y'); // unusual
    expect(visible.length).toBe(3);
    expect(collapsed.map((r) => r.id)).toEqual(['stress-stlfsi', 'nfci']);
  });

  it('fewer than the minimum → everything visible, nothing collapsed', () => {
    const { visible, collapsed } = groupVisibility(many.slice(0, 2));
    expect(visible.length).toBe(2);
    expect(collapsed).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * R11 — the money panel
 * ------------------------------------------------------------------ */

describe('R11 moneyPanel (≤4 lines, worst-state selection)', () => {
  it('never returns more than 4 lines and lists attention areas first', () => {
    const rows = moneyPanel([
      reading({ id: 'us10y', status: 'normal' }), // filler
      reading({ id: 'brent', status: 'warning', percentile10y: 0.9 }),
      reading({ id: 'au-cpi', status: 'warning', percentile10y: 0.9 }), // savings + shop
      reading({ id: 'au-unemployment', status: 'normal', percentile10y: 0.95 }), // jobs unusual
    ]);
    expect(rows.length).toBeLessThanOrEqual(4);
    expect(rows[0]!.state).toBe('attention');
    expect(rows.every((r) => r.state === 'attention' || r.state === 'unusual')).toBe(true);
  });

  it('an area with no signal is calm and carries no chips', () => {
    const rows = moneyPanel([reading({ id: 'brent', status: 'warning', percentile10y: 0.9 })]);
    const jobs = rows.find((r) => r.area === 'jobs');
    expect(jobs).toBeUndefined(); // calm areas are dropped (component shows the calm line)
  });

  it('every area id maps to a real definition', () => {
    const ids = Object.values(MONEY_AREAS).flat() as IndicatorId[];
    for (const id of ids) expect(() => definitionFor(id)).not.toThrow();
  });

  it('the money corpus carries no advice wording in either locale', () => {
    // Round 26 (owner wording): the estimation words describe the cost —
    // "Becoming more expensive / Getting cheaper" (cost areas) and
    // "Earning more interest / Earning less" (savings) — so the round-25
    // "will" exemption is GONE: the whole money corpus is will-free and
    // buy/sell-free again, in both locales.
    const banned = /\b(buy|sell|will)\b/i;
    const corpus = (obj: unknown): string[] => {
      if (typeof obj === 'string') return [obj];
      if (Array.isArray(obj)) return obj.flatMap((v) => corpus(v));
      if (obj !== null && typeof obj === 'object')
        return Object.values(obj as Record<string, unknown>).flatMap((v) => corpus(v));
      return [];
    };
    const en = corpus((insightsCopyEn as InsightsCopy).money);
    const fa = corpus((insightsCopyFa as InsightsCopy).money);
    for (const { text } of en.map((text) => ({ text })))
      expect(banned.test(text)).toBe(false);
    for (const { text } of fa.map((text) => ({ text })))
      expect(/\bخرید|فروش\b/.test(text)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * R12 — dates
 * ------------------------------------------------------------------ */

describe('R12 dates (month names, no numeric day/month pairs)', () => {
  const ALL_NUMERIC = /\b\d{1,2}[/.]\d{1,2}([/.]\d{2,4})?\b/;

  it('en renders a month NAME — the known trap date stays unambiguous', () => {
    const text = formatDateWords('2026-11-03', 'en-US');
    expect(text).toMatch(/Nov/); // abbreviated month name present
    expect(ALL_NUMERIC.test(text)).toBe(false);
  });

  it('fa keeps Persian digits (Gregorian words and Jalali)', () => {
    expect(formatDateWords('2026-11-03', 'fa-IR')).toMatch(/نوامبر/);
    // Jalali keeps its established numeric rendering — Persian digits only.
    const jalali = formatJalaliDate('2026-11-03', 'fa-IR');
    expect(jalali).not.toMatch(/\d/); // no ASCII digits
    expect(jalali).toMatch(/[۰-۹]/); // Persian digits present
  });

  it('a sweep of dates never produces an all-numeric en pair', () => {
    for (const iso of ['2026-01-05', '2026-03-11', '2026-12-01', '2026-11-03']) {
      expect(ALL_NUMERIC.test(formatDateWords(iso, 'en-US'))).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ *
 * R13 — units on every number
 * ------------------------------------------------------------------ */

describe('R13 units coverage (every DISPLAY row renders a unit)', () => {
  it('every display row resolves a non-empty unit label in both locales', () => {
    for (const id of Object.keys(DISPLAY) as IndicatorId[]) {
      const cfg = DISPLAY[id]!;
      for (const [locale, copy] of [
        ['en-US', insightsCopyEn],
        ['fa-IR', insightsCopyFa],
      ] as const) {
        const label = copy.units[cfg.unit];
        expect(label, `${id} unit '${cfg.unit}' in ${locale}`).not.toBe('');
        expect(label, `${id} unit '${cfg.unit}' in ${locale}`).toBeDefined();
      }
    }
  });

  it('the known unitless offenders now carry units', () => {
    // VERIFIED against the source metadata: the ABS series IS a dwelling
    // PRICE INDEX — the spec's "A$1.10 million" example only applied if the
    // series were a dollar amount. 'index' is the honest unit.
    expect(DISPLAY['au-home-values']!.unit).toBe('index');
    expect(DISPLAY['audusd']!.unit).toBe('usd');
    expect(DISPLAY['terms-of-trade']!.unit).toBe('index');
  });
});

/* ------------------------------------------------------------------ *
 * R14 — plain names, no codes
 * ------------------------------------------------------------------ */

describe('R14 code-pattern scan (names + tags, both locales)', () => {
  // Source-code shapes: letter+digit codes (M13), 4+-cap codes
  // (DCOILBRENTEU, WPI). Helpful tags stay: CPI, BTC, 'M2 money',
  // 'USD/JPY' (the slash keeps FX pairs out of the code shape).
  // M4 Wave 1 (2026-10-24): SOFR joins the exemption list — it is the
  // rate's universal name (like CPI), not a source code.
  // M6 Wave 3 (2026-10-25): +HICP — the euro area's CPI is a universal
  // acronym in the CPI/BTC/SOFR class (the ECB's own headline word), not a
  // source code.
  // 2026-10-26 gap-audit build, A-8: +OECD — the institution's universal
  // name (the CLI trio's ticker), the same household-acronym class.
  const CODE_LIKE = /^(?!CPI$|BTC$|SOFR$|HICP$|OECD$)([A-Z]\d{1,3}|[A-Z][A-Z0-9&.-]{3,})$/;

  const entries = (copy: InsightsCopy): { id: string; name: string; ticker?: string }[] =>
    (Object.entries(copy.indicators) as [string, { name: string; ticker?: string }][]).map(
      ([id, e]) => ({ id, name: e.name, ticker: e.ticker }),
    );

  it('no indicator name is a bare source code', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const { id, name, ticker } of entries(copy)) {
        expect(CODE_LIKE.test(name.trim()), `${id} name '${name}'`).toBe(false);
        if (ticker !== undefined) expect(CODE_LIKE.test(ticker.trim()), `${id} ticker '${ticker}'`).toBe(false);
      }
    }
  });

  it('the renamed opaque title is gone; plain names ship', () => {
    expect(insightsCopyEn.indicators['au-trimmed-mean']!.name).toBe('Underlying inflation');
  });

  it('no source codes leak into any name or tag (the known offenders)', () => {
    const banned = /DCOILBRENTEU|W006RC1|CPI_Q|\bM13\b|\bWPI\b|T10Y2Y|CPIAUCSL/;
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const { id, name, ticker } of entries(copy)) {
        expect(banned.test(name), `${id}`).toBe(false);
        expect(banned.test(ticker ?? ''), `${id} ticker`).toBe(false);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * R18 — counts consistency
 * ------------------------------------------------------------------ */

describe('R18 counts (hero-side totals equal the group sums)', () => {
  const readings: IndicatorReading[] = [
    reading({ id: 'us10y', status: 'warning' }),
    reading({ id: 'us-cpi-yoy', status: 'warning' }),
    reading({ id: 'yield-curve-10y2y', status: 'normal' }),
    reading({ id: 'dollar-basket', status: 'stale' }),
    reading({ id: 'au-cpi', status: 'warning' }),
    reading({ id: 'rba-cash-rate', status: 'context' }),
  ];

  it('the sum of group alert counts equals the section’s warning rows', () => {
    for (const section of ['global', 'australia'] as InsightsSection[]) {
      const groupSum = GROUP_ORDER[section].reduce(
        (acc, g) => acc + groupCounts(readings, section, g).alertCount,
        0,
      );
      const sectionWarnings = readings.filter((r) => {
        try {
          return definitionFor(r.id).section === section && r.status === 'warning';
        } catch {
          return false;
        }
      }).length;
      expect(groupSum).toBe(sectionWarnings);
    }
  });

  it('statusCounts and the group sums agree overall', () => {
    const counts = statusCounts(readings);
    const bothSections = (['global', 'australia'] as InsightsSection[]).reduce(
      (acc, section) =>
        acc +
        GROUP_ORDER[section].reduce((a, g) => a + groupCounts(readings, section, g).alertCount, 0),
      0,
    );
    expect(counts.warning).toBe(bothSections);
  });
});

/* ------------------------------------------------------------------ *
 * R26 — the merged signals card
 * ------------------------------------------------------------------ */

describe('R26 mergeSignals (shared listed once, silver-only split)', () => {
  const conditionsOf = (metal: 'gold' | 'silver') =>
    ['real-yield', 'expectations', 'stress', 'dollar', 'footing', ...(metal === 'silver' ? ['industrial'] : [])].map(
      (key) => ({ key, state: 'supportive' }),
    );

  it('shared conditions appear once; footing is per-metal; industrial is silver-only', () => {
    const merged = mergeSignals(
      { conditions: conditionsOf('gold'), priceId: 'gold-usd' },
      { conditions: conditionsOf('silver'), priceId: 'silver-usd' },
    );
    const keys = merged.shared.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length); // no duplicates
    expect(keys).not.toContain('footing');
    expect(keys).not.toContain('industrial');
    expect(merged.footing.map((f) => f.metal)).toEqual(['gold', 'silver']);
    expect(merged.silverOnly.map((c) => c.key)).toEqual(['industrial']);
  });

  it('no check or cross glyph anywhere in the Signals markup source', () => {
    // The WS-4 split moved the markup into the signals/ module tree —
    // the guard now covers the whole tree (same intent, wider surface).
    expect(signalsSrc).not.toMatch(/[✓✔✗✘]/);
    expect(signalsIconsSrc).not.toMatch(/[✓✔✗✘]/);
    expect(signalsVerdictSrc).not.toMatch(/[✓✔✗✘]/);
    expect(signalsCardSrc).not.toMatch(/[✓✔✗✘]/);
    expect(signalsBalanceSrc).not.toMatch(/[✓✔✗✘]/);
  });
});

/* ------------------------------------------------------------------ *
 * R27 — evidence discipline + chip units
 * ------------------------------------------------------------------ */

describe('R27 evidence discipline (no visible placeholder)', () => {
  it('no "to verify" text in either locale’s Together corpus', () => {
    const corpus = (obj: unknown): string[] => {
      if (typeof obj === 'string') return [obj];
      if (Array.isArray(obj)) return obj.flatMap(corpus);
      if (obj !== null && typeof obj === 'object') return Object.values(obj as Record<string, unknown>).flatMap(corpus);
      return [];
    };
    for (const text of corpus(insightsCopyEn.together)) expect(text).not.toMatch(/to verify/i);
    for (const text of corpus(insightsCopyFa.together)) expect(text).not.toMatch(/برای\s*راستی‌آزمایی|تأیید نشده/);
  });

  it('no arrow glyph connects chips (stat chips, not a flowchart)', () => {
    expect(connectionCardSrc).not.toMatch(/→|←|↔|⇒/);
  });

  it('every connection chip renders through formatIndicatorValue (units by construction)', () => {
    // The Together legs all live in DISPLAY (R13 coverage), so chips carry units.
    const readings = evaluateConnections([
      reading({ id: 'gold-usd', value: 4000, status: 'context' }),
      reading({ id: 'real-yield-10y', value: 0.02, status: 'normal', percentile10y: 0.5 }),
    ]);
    for (const c of readings) expect(c.legs.length).toBeGreaterThan(0);
    const summary = togetherSummary(readings, (c) => c, {
      active: '{n} active',
      partly: '{n} partly',
      pending: '{n} pending',
      inactive: '{n} not active',
      disagree: '{n} disagree',
      unknown: '{n} unreadable',
    });
    expect(summary.chips).toHaveLength(readings.length);
  });
});

/* ------------------------------------------------------------------ *
 * R28 — sentence-versus-number guard
 * ------------------------------------------------------------------ */

describe('R28 sentence-versus-number (band words computed from live values)', () => {
  it('the KNOWN BAD PAIRS now compute honestly', () => {
    // 3.4% US CPI against the Fed's 2% goal → ABOVE, never "near or below".
    expect(bandPositionOf(3.4, { min: 2 })).toBe('above');
    // 3.9% Australian CPI against the 2–3% band → ABOVE, never "inside or near".
    expect(bandPositionOf(3.9, { min: 2, max: 3 })).toBe('above');
    // And the honest insides: 2.5 sits INSIDE the 2–3 band (the two-sided
    // fallthrough bug rendered it 'below'); at exactly 2.0 the value is at
    // the goal; 1.7 honestly reads BELOW the goal (a true statement — the
    // bug was only ever "near or below" on a HIGH value).
    expect(bandPositionOf(2.5, { min: 2, max: 3 })).toBe('inside');
    expect(bandPositionOf(2.0, { min: 2 })).toBe('inside');
    expect(bandPositionOf(1.7, { min: 2 })).toBe('below');
  });

  it('the rebuilt au-cpi line at 3.9% says "above the RBA’s 2–3% band" in en', () => {
    const line = consequenceLine(
      reading({ id: 'au-cpi', value: 3.9, status: 'warning', percentile10y: 0.9, change30d: -0.1 }),
      insightsCopyEn.indicators['au-cpi']!,
      false,
    );
    expect(line).toContain('above');
    expect(line).toContain("the RBA’s 2–3% band");
    expect(line).not.toMatch(/inside or near|usual range|near or below/i);
  });

  it('the rebuilt fa line at 3.9% renders the Persian position word', () => {
    const line = consequenceLine(
      reading({ id: 'au-cpi', value: 3.9, status: 'warning', percentile10y: 0.9, change30d: -0.1 }),
      insightsCopyFa.indicators['au-cpi']!,
      false,
      bandWordsOf(insightsCopyFa),
    );
    expect(line).toContain('بالاتر از');
    expect(line).toContain('بازهٔ هدف تورمی ۲ تا ۳ درصدی بانک مرکزی استرالیا');
  });

  it('needs-attention lines never say "usual range" or "inside the band" (static scan, both locales)', () => {
    // The needs-attention states are highRising/highEasing (a warning value
    // sits in the high band by construction); 'typical'/'low' lines render
    // on normal cards, where range language is honest.
    const banned = /usual range|near or below|inside the band|inside or near/i;
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const entry of Object.values(copy.indicators)) {
        for (const state of ['highRising', 'highEasing'] as const) {
          const line = entry.lines?.[state];
          if (line !== undefined) expect(banned.test(line), `'${line}'`).toBe(false);
        }
      }
    }
  });

  it('no unverifiable market claim: "calm is returning" stays banned (R10 example)', () => {
    const banned = /calm is returning|بازگشت آرامش/;
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const entry of Object.values(copy.indicators)) {
        for (const line of Object.values(entry.lines ?? {})) {
          expect(banned.test(line), `'${line}'`).toBe(false);
        }
      }
    }
  });

  it('stale movers never headline the big-move line (R4 re-check)', () => {
    const rows = bigMovers([
      reading({ id: 'brent', status: 'normal', change30d: 0.3, moveScore: 5, percentile10y: 0.9 }),
      reading({ id: 'dollar-basket', status: 'stale', change30d: 0.3, moveScore: 5, percentile10y: 0.9 }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['brent']);
  });
});

/* ------------------------------------------------------------------ *
 * v3 UI_SPEC §3/§4 (2026-10-20, task PH6-A) — the rebuilt hero's pure
 * layer + the Delayed tier. Pinned here in the same file as the R2/R3
 * machinery they extend (the R2 heroReason table + the R3 extremity
 * fallback stay — heroWhy reuses the extremity as its ranking fallback).
 * ------------------------------------------------------------------ */

describe('v3 heroSentence (UI-01: fixed table over the gauge steps, ≤90 chars)', () => {
  const build = (gauges: GaugeReading[]): string =>
    heroSentence({
      gauges,
      nameOf: (g) =>
        ({ 'borrowing-costs': 'Borrowing costs', 'prices-heat': 'Prices', 'market-stress': 'Market stress', 'dollar-strength': 'The US dollar', 'growth-health': 'Growth' })[g] ?? g,
      fmt: (n) => String(n),
      calm: 'All {n} gauges are calm right now.',
      attention: '{areas} {isAre} attention: {k} of {n} gauges.',
      andWord: 'and',
      listSep: ', ',
      moreWord: '+{n} more',
      isWord: 'needs',
      areWord: 'need',
      notEnough: 'Not enough voting data to read the gauges yet.',
    });

  it('every readable gauge calm → the one calm sentence, no numbers', () => {
    expect(build([gauge('borrowing-costs', 1), gauge('dollar-strength', 1)])).toBe(
      'All 2 gauges are calm right now.',
    );
  });

  it('no readable gauge → the not-enough line', () => {
    expect(build([gauge('borrowing-costs', 0)])).toBe('Not enough voting data to read the gauges yet.');
  });

  it('one raised area → the singular is/are', () => {
    const line = build([gauge('borrowing-costs', 3), gauge('dollar-strength', 1)]);
    expect(line).toBe('Borrowing costs needs attention: 1 of 2 gauges.');
  });

  it('two raised areas → "A and B … need attention"; unreadable gauges stay out of n', () => {
    const line = build([gauge('prices-heat', 2), gauge('growth-health', 2), gauge('dollar-strength', 0)]);
    expect(line).toBe('Prices and Growth need attention: 2 of 2 gauges.');
  });

  it('more than two raised areas → two names + "+{n} more", still ≤90 chars', () => {
    const line = build([
      gauge('borrowing-costs', 2),
      gauge('prices-heat', 2),
      gauge('market-stress', 2),
      gauge('dollar-strength', 2),
      gauge('growth-health', 2),
    ]);
    // The list separator joins the "+{n} more" tail in BOTH locales: EN
    // "A, B, +3 more"; fa "الف، ب، و ۳ مورد دیگر" (the fa tail carries its
    // own "و") — one shared shape, no double conjunction.
    expect(line).toBe('Borrowing costs, Prices, +3 more need attention: 5 of 5 gauges.');
    expect(line.length).toBeLessThanOrEqual(90);
  });
});

describe('v3 heroWhy (UI-03: the why rows — |moveScore| rank, extremity fallback)', () => {
  it('ranks the section’s warning readings by |moveScore|, top three', () => {
    const ids = heroWhy(
      [
        reading({ id: 'us10y', status: 'warning', moveScore: 1.0, percentile10y: 0.9 }),
        reading({ id: 'brent', status: 'warning', moveScore: -3.0, percentile10y: 0.2 }),
        reading({ id: 'us-cpi-yoy', status: 'warning', moveScore: 2.0, percentile10y: 0.8 }),
        reading({ id: 'sahm-rule', status: 'warning', moveScore: 0.5, percentile10y: 0.7 }),
        reading({ id: 'au-cpi', status: 'warning', moveScore: 9, percentile10y: 0.9 }), // other section
        reading({ id: 'vix', status: 'normal', moveScore: 9, percentile10y: 0.9 }), // not a warning
      ],
      'global',
      3,
    );
    expect(ids).toEqual(['brent', 'us-cpi-yoy', 'us10y']);
  });

  it('no moveScore anywhere → the R3 percentile extremity carries the order', () => {
    const ids = heroWhy(
      [
        reading({ id: 'au-unemployment', status: 'warning', percentile10y: 0.5 }),
        reading({ id: 'audusd', status: 'warning', percentile10y: 0.02 }), // low-tail rule → extremity 0.98
        reading({ id: 'au-cpi', status: 'warning', percentile10y: 0.8 }),
      ],
      'australia',
      2,
    );
    expect(ids).toEqual(['audusd', 'au-cpi']);
  });
});

describe('v3 heroReadingCounts (UI-02: the reading bar over the gauge members)', () => {
  it('attention / normal / can’t-tell — non-voting members count as can’t-tell, non-members never count', () => {
    const counts = heroReadingCounts(
      [
        reading({ id: 'us10y', status: 'warning' }),
        reading({ id: 'yield-curve-10y2y', status: 'normal' }),
        reading({ id: 'dollar-basket', status: 'stale' }),
        reading({ id: 'china-pmi', status: 'unavailable' }),
        reading({ id: 'stress-stlfsi', status: 'check-pending' }),
        reading({ id: 'gold-usd', status: 'normal' }), // prices-board: not a gauge member
      ],
      'global',
    );
    expect(counts).toEqual({ attention: 1, normal: 1, cantTell: 3 });
  });
});

describe('v3 calmGauges / heroNextEvent / heroStaleInputs (UI-04/UI-05/UI-06+08)', () => {
  it('calmGauges: step-1 gauges only, GAUGES order, capped at three', () => {
    expect(calmGauges([gauge('growth-health', 1), gauge('prices-heat', 2), gauge('dollar-strength', 1), gauge('market-stress', 1)])).toEqual([
      'growth-health',
      'dollar-strength',
      'market-stress',
    ]);
  });

  const events: CalendarEvent[] = [
    { id: 'rba-1', date: '2026-10-21', titleEn: 'RBA decision', titleFa: 'RBA', kind: 'rba', tz: 'Australia/Sydney' },
    { id: 'us-cpi-1', date: '2026-10-22', titleEn: 'US CPI', titleFa: 'US CPI', kind: 'us-cpi', tz: 'America/New_York' },
    { id: 'fed-0', date: '2026-10-19', titleEn: 'Fed (past)', titleFa: 'Fed', kind: 'fed', tz: 'America/New_York' },
  ];

  it('heroNextEvent: Australia reads its own kinds, Global the rest; past events never surface', () => {
    expect(heroNextEvent(events, 'australia', '2026-10-20')?.id).toBe('rba-1');
    expect(heroNextEvent(events, 'global', '2026-10-20')?.id).toBe('us-cpi-1');
  });

  it('heroNextEvent: falls back to the plain next event when the region has none of its own', () => {
    expect(heroNextEvent([events[0]!], 'global', '2026-10-20')?.id).toBe('rba-1');
    expect(heroNextEvent(events, 'global', '2026-11-01')).toBeNull(); // nothing ahead
  });

  it('heroStaleInputs: stale members count; the alert fires only inside a gauge whose members voted', () => {
    const voted = heroStaleInputs(
      [
        reading({ id: 'dollar-basket', status: 'stale' }),
        reading({ id: 'usdjpy', status: 'normal' }), // dollar-strength voted
      ],
      'global',
    );
    expect(voted).toEqual({ staleCount: 1, affectsVotingGauge: true });
    const nobodyVoted = heroStaleInputs(
      [
        reading({ id: 'dollar-basket', status: 'stale' }),
        reading({ id: 'china-pmi', status: 'unavailable' }),
      ],
      'global',
    );
    expect(nobodyVoted).toEqual({ staleCount: 1, affectsVotingGauge: false });
  });
});

describe('v3 Delayed tier (§4: ≥1 trading day behind the snapshot’s daily peers)', () => {
  it('tradingDaysBehind: same day 0 · Fri→Mon 1 · Thu→Mon 2 · over a weekend never counts Sat/Sun', () => {
    expect(tradingDaysBehind('2024-03-11', '2024-03-11')).toBe(0);
    expect(tradingDaysBehind('2024-03-08', '2024-03-09')).toBe(0); // Sat never counts
    expect(tradingDaysBehind('2024-03-08', '2024-03-11')).toBe(1); // Fri → Mon
    expect(tradingDaysBehind('2024-03-07', '2024-03-11')).toBe(2); // Thu → Fri + Mon
  });

  it('dailyPeersOf: the newest daily asOf wins; non-daily cadences never set the benchmark', () => {
    const peers = dailyPeersOf([
      reading({ id: 'us10y', asOf: '2026-10-16' }),
      reading({ id: 'brent', asOf: '2026-10-17' }),
      reading({ id: 'gold-usd', asOf: '2026-10-18' }),
      reading({ id: 'au-cpi', asOf: '2026-10-20' }), // monthly — excluded
      reading({ id: 'china-pmi', status: 'unavailable' }), // asOf null — excluded
    ]);
    expect(peers.newestDailyAsOf).toBe('2026-10-18');
  });

  it('tierOf: a daily reading ≥1 trading day behind its peers is Delayed; status rules + the unusual tier still win', () => {
    const peers = { newestDailyAsOf: '2026-10-15' }; // a Tuesday
    // usdjpy is daily-cadence: Fri 2026-10-09 → Tue 2026-10-15 = 2 trading days behind.
    expect(tierOf(reading({ id: 'usdjpy', asOf: '2026-10-09' }), peers)).toBe('delayed');
    expect(tierOf(reading({ id: 'usdjpy', asOf: '2026-10-15' }), peers)).toBe('normal'); // the peer itself
    expect(tierOf(reading({ id: 'dollar-basket', status: 'stale', asOf: '2026-10-09' }), peers)).toBe('stale'); // stale wins
    expect(tierOf(reading({ id: 'us10y', status: 'warning', asOf: '2026-10-09' }), peers)).toBe('needs-attention');
    expect(tierOf(reading({ id: 'us30y', status: 'normal', percentile10y: 0.95, asOf: '2026-10-09' }), peers)).toBe('unusual'); // the position tier outranks the lag
    expect(tierOf(reading({ id: 'au-cpi', asOf: '2026-10-01' }), peers)).toBe('normal'); // monthly: never delayed
    expect(tierOf(reading({ id: 'usdjpy', asOf: '2026-10-09' }))).toBe('normal'); // no peers → unchanged
  });

  it('statusCounts: a delayed-tier row counts under Normal; a no-history row under Context', () => {
    const counts = statusCounts([
      reading({ id: 'usdjpy', asOf: '2026-10-09' }), // normal status
      reading({ id: 'philly-fed', status: 'no-history' }),
    ]);
    expect(counts.normal).toBe(1);
    expect(counts.context).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * R9 (2026-10-27 owner round) — the lane presentation surface:
 * the dollar-strength group merged into the currencies section, the
 * US-global-reach container, the Australia sub-heading consolidation.
 * The COUNTING surface (GROUP_ORDER) is unchanged — the hero's gauge
 * names and the R18 counting invariant still ride the FULL order.
 * ------------------------------------------------------------------ */

describe('R9 lane presentation (special containers, unchanged gauges)', () => {
  it('GROUP_ORDER stays the FULL gauge order — the counting surface is unchanged by the merge (gap-closure S4-M4.3: the geo-fragmentation shadow gauge joins global, last)', () => {
    expect(GROUP_ORDER.global).toEqual(['borrowing-costs', 'prices-heat', 'market-stress', 'dollar-strength', 'growth-health', 'geo-fragmentation']);
    expect(GROUP_ORDER.australia).toEqual(['au-inflation-rates', 'au-households', 'au-trade-currency']);
  });

  it('R9-04: the LANE drops the dollar-strength group — its cards render in the currencies section (S4-M4.3: the geo-fragmentation lane renders last)', () => {
    expect(LANE_GROUP_ORDER.global).toEqual(['borrowing-costs', 'prices-heat', 'market-stress', 'growth-health', 'geo-fragmentation']);
    expect(LANE_GROUP_ORDER.global).not.toContain('dollar-strength');
    // The Australia lane keeps all three groups (R9-05 renders them as
    // sub-headed card groups INSIDE the one container — no group is lost).
    expect(LANE_GROUP_ORDER.australia).toEqual(GROUP_ORDER.australia);
  });

  it('R9-04: the dollar-strength ids are exactly the cards that moved (2026-10-29 owner round: +usdaed — the UAE dirham context row)', () => {
    expect([...DOLLAR_STRENGTH_IDS].sort()).toEqual(
      ['dollar-basket', 'usdjpy', 'us-japan-10y-gap', 'eur-usd', 'usdtry', 'usdaed', 'usdcny'].sort(),
    );
  });

  it('R9-07: the US-global-reach ids are exactly the nine the owner listed', () => {
    expect([...US_GLOBAL_REACH_IDS].sort()).toEqual(
      ['real-yield-10y', 'us10y', 'us30y', 'euro-hicp', 'us-cpi-yoy', 'us-pce-core-yoy', 'walcl', 'stress-stlfsi', 'nfci'].sort(),
    );
  });

  it('the hidden-from-lane set is exactly the two special containers\' members + the TIC custody card — one reading, one surface', () => {
    // gap-closure S2-M2.4: nyfed-custody is the third one-surface case — a
    // context reading owned by the "Who holds US government debt" section's
    // slot (rendered below the TicSection), never by its lane group.
    expect(HIDDEN_FROM_LANE_IDS.size).toBe(DOLLAR_STRENGTH_IDS.length + US_GLOBAL_REACH_IDS.length + 1);
    for (const id of [...DOLLAR_STRENGTH_IDS, ...US_GLOBAL_REACH_IDS, 'nyfed-custody' as const]) {
      expect(HIDDEN_FROM_LANE_IDS.has(id)).toBe(true);
    }
    // No lane-only reading accidentally joined the hidden set.
    expect(HIDDEN_FROM_LANE_IDS.has('vix')).toBe(false);
    expect(HIDDEN_FROM_LANE_IDS.has('gold-silver')).toBe(false);
    expect(HIDDEN_FROM_LANE_IDS.has('au-cpi')).toBe(false);
  });

  it('R9-04 + R9-07: every hidden id is a REAL definition whose section is global (no phantom ids)', () => {
    for (const id of [...DOLLAR_STRENGTH_IDS, ...US_GLOBAL_REACH_IDS]) {
      const def = definitionFor(id);
      expect(def.section).toBe('global');
    }
  });

  it('R9-05: the Australia section is the sub-heading section (the Global groups keep question headings)', () => {
    expect(SUBHEADING_SECTIONS.has('australia')).toBe(true);
    expect(SUBHEADING_SECTIONS.has('global')).toBe(false);
  });

  it('R9-04/R9-07: the full GROUP_ORDER counting invariant still covers every gauge group (R18 stays honest)', () => {
    // The union of the lane groups and the special containers covers every
    // global GAUGE group exactly once (dollar-strength's six ids live in
    // the currencies section; the nine US ids still count in their gauges).
    const laneGroups = new Set(LANE_GROUP_ORDER.global);
    const allGroups = new Set(GROUP_ORDER.global);
    expect(allGroups.size).toBe(laneGroups.size + 1); // + dollar-strength
  });
});
