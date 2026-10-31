/**
 * @vitest-environment jsdom
 *
 * signals/gold-panels.test.tsx — the Gold Program S2.1 panels
 * (GOLD_SCORE_SPEC.md §4.4): the GoldTailwindPanel renders the served
 * snapshot's compact goldSummary (label + counts + the four lane words +
 * the derived firing voters), the ModelVsRealityPanel renders the chip +
 * the explainer with the reality's own number, both panels fall back to
 * the SAME pure client-side derivation when the snapshot carries no
 * goldSummary (pre-S2 snapshots), BOTH LOCALES render through the web
 * i18n dictionaries (the S2.1 bilingual round — EN and fa copy asserted
 * here, including the dictionary-coverage checks that moved out of the
 * package with the copy), and MergedSignalsCard mounts them DIRECTLY
 * UNDER the balance visual inside the gold card (the owner's placement
 * directive) while the prices strip stays four tiles.
 *
 * Conventions follow balance.test.tsx / prices-cards.test.tsx: jsdom +
 * @testing-library, hand-built reading fixtures driving the shared
 * evaluator through decade-extreme positions, a stubbed history fetch
 * for the board integration.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { GOLD_LANE_VOTERS, GOLD_LANES } from '@currena/insights';
import type { SignalConditionKey, SignalConditionState, SignalReading } from '@currena/insights';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../../i18n/insights-copy-fa';
import { PricesBoard } from '../PricesBoard';
import { GoldTailwindPanel } from './GoldTailwindPanel';
import { ModelVsRealityPanel } from './ModelVsRealityPanel';

const copy = insightsCopyEn;
const copyFa = insightsCopyFa;

const NOW = '2026-10-30T04:20:00.000Z';
const DAY = '2026-10-29';

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: DAY,
    status: 'normal',
    sourceName: 't',
    updatedAt: NOW,
    ...extra,
  };
}

/**
 * The fixture readings — coherent with the stamped goldSummary below:
 * two decade-high rates voters (headwind, borrowing costs), a decade-low
 * dollar basket (tailwind, the dollar lane reads stress), one high and
 * one low stress index (the stress lane reads mixed), and gold up 5.2%
 * over 30 days.
 */
const READINGS: IndicatorReading[] = [
  reading('real-yield-10y', { percentile10y: 0.95 }),
  reading('us10y', { percentile10y: 0.95 }),
  reading('dollar-basket', { percentile10y: 0.05 }),
  reading('stress-stlfsi', { percentile10y: 0.95 }),
  reading('nfci', { percentile10y: 0.05 }),
  reading('gold-usd', { value: 4166, change30d: 5.2 }),
];

/** The KNOWN compact summary the fixture snapshot carries (5 firing: 2 for · 3 against). */
const GOLD_SUMMARY: GoldSummary = {
  netScore: -1,
  label: 'headwind',
  firingVoters: 5,
  tailwindVoters: 2,
  headwindVoters: 3,
  laneCounts: { tailwind: 1, headwind: 1, mixed: 1 },
  subGauges: [
    { lane: 'borrowing-costs', reading: 'tight', tailwindVoters: 0, headwindVoters: 2 },
    { lane: 'dollar', reading: 'stress', tailwindVoters: 1, headwindVoters: 0 },
    { lane: 'stress', reading: 'mixed', tailwindVoters: 1, headwindVoters: 1 },
    { lane: 'inflation', reading: 'unreadable', tailwindVoters: 0, headwindVoters: 0 },
  ],
  modelVsReality: {
    chip: 'diverging-up',
    modelDirection: 'headwind',
    realityDirection: 'rising',
    realityBasis: 'change30d',
    realityValue: 5.2,
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ *
 * Dictionary coverage — the S2.1 move: the copy's completeness is
 * asserted HERE now (it lived in the package's gold-score.test.ts while
 * the copy rode the package; the package exports pure logic only).
 * ------------------------------------------------------------------ */
describe('gold panel copy — both dictionaries cover the whole engine vocabulary', () => {
  const SUB_GAUGE_WORDS = [
    'tight', 'relief', 'strong', 'stress', 'elevated', 'calm', 'hot', 'cool', 'mixed', 'unreadable',
  ] as const;
  const LABELS = ['strong-tailwind', 'tailwind', 'balanced', 'headwind', 'strong-headwind'] as const;
  const CHIPS = ['aligned-tailwind', 'aligned-headwind', 'diverging-up', 'diverging-down', 'neutral', 'no-read'] as const;
  const EXPLAINERS = [
    'aligned-tailwind', 'aligned-headwind', 'diverging-up', 'diverging-down', 'model-neutral', 'reality-flat', 'no-read',
  ] as const;

  for (const [name, c] of [['en', copy], ['fa', copyFa]] as const) {
    it(`${name}: every label/lane/word/voter/evidence/impact key is non-empty`, () => {
      const g = c.signals.goldScore;
      for (const l of LABELS) expect(g.labels[l], `${name} ${l}`).toBeTruthy();
      expect(g.noReadWord).toBeTruthy();
      for (const lane of GOLD_LANES) expect(g.laneNames[lane], `${name} ${lane}`).toBeTruthy();
      for (const w of SUB_GAUGE_WORDS) expect(g.subGaugeWords[w], `${name} ${w}`).toBeTruthy();
      for (const e of ['rising', 'falling', 'high', 'low'] as const) {
        expect(g.evidenceWords[e], `${name} ${e}`).toBeTruthy();
      }
      expect(g.impactWords.tailwind).toBeTruthy();
      expect(g.impactWords.headwind).toBeTruthy();
      // Session 3 (G2): the inflation lane's tilt phrase keys — both locales.
      for (const t of ['building', 'fading', 'steady'] as const) {
        expect(g.tiltWords[t], `${name} tilt ${t}`).toBeTruthy();
      }
      // the voter names cover EXACTLY the 20-voter table
      const tableIds = GOLD_LANE_VOTERS.map((v) => v.id as string);
      expect(Object.keys(g.voterNames).sort()).toEqual([...new Set(tableIds)].sort());
      for (const id of tableIds) expect(g.voterNames[id as keyof typeof g.voterNames], `${name} ${id}`).toBeTruthy();
      expect(g.netFiringLine).toContain('{firing}');
      expect(g.netFiringLine).toContain('{total}');
      expect(g.laneCountsLine).toContain('{tailwind}');
    });

    it(`${name}: every chip + explainer + basis key is non-empty`, () => {
      const m = c.signals.goldModelVsReality;
      for (const chip of CHIPS) expect(m.chips[chip], `${name} ${chip}`).toBeTruthy();
      for (const k of EXPLAINERS) expect(m.explainers[k], `${name} ${k}`).toBeTruthy();
      expect(m.basisPhrases.change30d).toBeTruthy();
      expect(m.basisPhrases.ma200GapPct).toBeTruthy();
      // the two value-bearing explainers keep their placeholders intact
      expect(m.explainers['aligned-tailwind']).toContain('{value}');
      expect(m.explainers['aligned-tailwind']).toContain('{basis}');
    });
  }
});

describe('GoldTailwindPanel — the served goldSummary renders (EN)', () => {
  it('the label word, the net score and the lane counts render from the KNOWN summary', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copy} numberLocale="en-US" />,
    );
    const panel = container.querySelector<HTMLElement>('[data-gold-label]');
    expect(panel).not.toBeNull();
    expect(panel!.dataset.goldLabel).toBe('headwind');
    expect(panel!.dataset.goldNet).toBe('-1');
    // the label word + the counts line, exactly as the dictionary writes them
    expect(screen.getByText('Headwind')).toBeTruthy();
    expect(screen.getByText('1 tailwind · 1 headwind · 1 mixed')).toBeTruthy();
    // the net-firing line speaks the 20-driver table
    expect(screen.getByText(/Net score — 5 of 20 drivers firing/)).toBeTruthy();
  });

  it('the four sub-gauge readings render with their lane words and firing counts', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copy} numberLocale="en-US" />,
    );
    const lanes = [...container.querySelectorAll<HTMLElement>('[data-gold-lane]')];
    expect(lanes.map((l) => l.dataset.goldLane)).toEqual(['borrowing-costs', 'dollar', 'stress', 'inflation']);
    expect(lanes.map((l) => l.dataset.goldLaneReading)).toEqual(['tight', 'stress', 'mixed', 'unreadable']);
    expect(screen.getByText('tight (2)')).toBeTruthy();
    expect(screen.getByText('under stress (1)')).toBeTruthy();
    expect(screen.getByText('mixed (2)')).toBeTruthy();
    expect(screen.getByText('no read')).toBeTruthy();
  });

  it('the firing voters list derives from the page readings through the same pure engine', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copy} numberLocale="en-US" />,
    );
    const voters = [...container.querySelectorAll<HTMLElement>('[data-gold-voter]')];
    expect(voters).toHaveLength(5);
    const byId = new Map(voters.map((v) => [v.dataset.goldVoter!, v]));
    expect(byId.get('real-yield-10y')!.dataset.goldVoterImpact).toBe('headwind');
    expect(byId.get('dollar-basket')!.dataset.goldVoterImpact).toBe('tailwind');
    // the evidence words + names render (several voters share a word —
    // 3 decade-high voters, 2 decade-low)
    expect(screen.getAllByText(/high in its decade/)).toHaveLength(3);
    expect(screen.getAllByText(/low in its decade/)).toHaveLength(2);
    expect(screen.getByText('Real yields')).toBeTruthy();
    expect(screen.getByText('Dollar basket')).toBeTruthy();
  });

  it('without a goldSummary the panel derives the SAME reading client-side (old snapshots)', () => {
    const { container } = render(<GoldTailwindPanel readings={READINGS} copy={copy} numberLocale="en-US" />);
    const panel = container.querySelector<HTMLElement>('[data-gold-label]')!;
    expect(panel.dataset.goldLabel).toBe('headwind');
    expect(panel.dataset.goldNet).toBe('-1');
    expect(screen.getByText('1 tailwind · 1 headwind · 1 mixed')).toBeTruthy();
  });

  it('nothing firing renders the honest cannot-read state, never a made-up word', () => {
    const { container } = render(<GoldTailwindPanel readings={[]} copy={copy} numberLocale="en-US" />);
    const panel = container.querySelector<HTMLElement>('[data-gold-label]')!;
    expect(panel.dataset.goldLabel).toBe('none');
    expect(screen.getByText('Cannot read yet')).toBeTruthy();
    expect(screen.getByText(/Net score — no driver is firing right now/)).toBeTruthy();
    expect(screen.getByText('0 tailwind · 0 headwind · 0 mixed')).toBeTruthy();
  });
});

describe('GoldTailwindPanel — the fa locale renders the reviewed Persian copy', () => {
  it('the label word, counts, firing line and lane words render in Persian with Persian digits', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copyFa} numberLocale="fa-IR" />,
    );
    const panel = container.querySelector<HTMLElement>('[data-gold-label]')!;
    expect(panel.dataset.goldLabel).toBe('headwind');
    // the Persian label word + the Persian counts line, Persian digits.
    // NB: the same word also names each headwind voter's IMPACT in the
    // firing list, so the label word is one of several honest matches.
    expect(screen.getAllByText('باد مخالف').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('۱ موافق · ۱ مخالف · ۱ مختلط')).toBeTruthy();
    expect(screen.getByText(/نمرهٔ خالص؛ ۵ مورد از ۲۰ عامل فعال است/)).toBeTruthy();
    // the lane names + words render in Persian
    expect(screen.getByText('هزینهٔ استقراض')).toBeTruthy();
    expect(screen.getByText('گران (۲)')).toBeTruthy();
    expect(screen.getByText('تحت فشار (۱)')).toBeTruthy();
    expect(screen.getByText('قابل ارزیابی نیست')).toBeTruthy();
    // the firing voters speak the Persian names + impacts
    expect(screen.getByText('بازده واقعی اوراق قرضه')).toBeTruthy();
    expect(screen.getByText('شاخص دلار')).toBeTruthy();
  });

  it('the honest cannot-read state renders in Persian too', () => {
    render(<GoldTailwindPanel readings={[]} copy={copyFa} numberLocale="fa-IR" />);
    expect(screen.getByText('فعلاً قابل ارزیابی نیست')).toBeTruthy();
    expect(screen.getByText(/نمرهٔ خالص؛ در حال حاضر هیچ عاملی فعال نیست/)).toBeTruthy();
    expect(screen.getByText('۰ موافق · ۰ مخالف · ۰ مختلط')).toBeTruthy();
  });
});

describe('GoldTailwindPanel — Session 3 (G2): the inflation lane tilt phrase', () => {
  // A tilt reading like the live snapshot's (T5YIFR 2.23 − T5YIE 2.47).
  const TILT_READING = reading('breakeven-tilt', { value: -0.24 });

  it('EN: a fading tilt renders beside the lane word', () => {
    render(
      <GoldTailwindPanel
        goldSummary={GOLD_SUMMARY}
        readings={[...READINGS, TILT_READING]}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    expect(screen.getByText('no read · expectations fading')).toBeTruthy();
  });

  it('EN: a steady tilt (inside the deadband) renders its own word', () => {
    render(
      <GoldTailwindPanel
        goldSummary={GOLD_SUMMARY}
        readings={[...READINGS, reading('breakeven-tilt', { value: 0.05 })]}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    expect(screen.getByText('no read · expectations steady')).toBeTruthy();
  });

  it('EN: a building tilt renders beside a firing lane word too', () => {
    const hotSummary: GoldSummary = {
      ...GOLD_SUMMARY,
      subGauges: GOLD_SUMMARY.subGauges.map((g) =>
        g.lane === 'inflation' ? { ...g, reading: 'hot', tailwindVoters: 1, headwindVoters: 0 } : g,
      ),
    };
    render(
      <GoldTailwindPanel
        goldSummary={hotSummary}
        readings={[...READINGS, reading('breakeven-tilt', { value: 0.24 })]}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    expect(screen.getByText('running hot (1) · expectations building')).toBeTruthy();
  });

  it('an S2-era snapshot (no tilt reading) renders the lane EXACTLY as before', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copy} numberLocale="en-US" />,
    );
    const inflation = container.querySelector<HTMLElement>('[data-gold-lane="inflation"]')!;
    expect(inflation.textContent).toContain('no read');
    expect(inflation.textContent).not.toContain('·');
  });

  it('a stale tilt reading renders NO phrase (never a guess)', () => {
    const { container } = render(
      <GoldTailwindPanel
        goldSummary={GOLD_SUMMARY}
        readings={[...READINGS, reading('breakeven-tilt', { value: -0.24, status: 'stale' })]}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    const inflation = container.querySelector<HTMLElement>('[data-gold-lane="inflation"]')!;
    expect(inflation.textContent).toContain('no read');
    expect(inflation.textContent).not.toContain('·');
  });

  it('fa: the Persian tilt phrase renders beside the Persian lane word', () => {
    render(
      <GoldTailwindPanel
        goldSummary={GOLD_SUMMARY}
        readings={[...READINGS, TILT_READING]}
        copy={copyFa}
        numberLocale="fa-IR"
      />,
    );
    const inflation = screen.getByText(/انتظارات در حال فروکش/);
    expect(inflation.textContent).toContain('قابل ارزیابی نیست');
  });

  it('fa: a building tilt renders beside the hot lane word', () => {
    const hotSummary: GoldSummary = {
      ...GOLD_SUMMARY,
      subGauges: GOLD_SUMMARY.subGauges.map((g) =>
        g.lane === 'inflation' ? { ...g, reading: 'hot', tailwindVoters: 1, headwindVoters: 0 } : g,
      ),
    };
    render(
      <GoldTailwindPanel
        goldSummary={hotSummary}
        readings={[...READINGS, reading('breakeven-tilt', { value: 0.24 })]}
        copy={copyFa}
        numberLocale="fa-IR"
      />,
    );
    const inflation = screen.getByText(/انتظارات در حال شدت‌گیری/);
    expect(inflation.textContent).toContain('داغ');
  });
});

describe('ModelVsRealityPanel — the chip + the explainer', () => {
  it('the diverging-up chip renders with its word and the reality\'s own number (EN)', () => {
    const { container } = render(
      <ModelVsRealityPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copy} numberLocale="en-US" />,
    );
    expect(container.querySelector<HTMLElement>('[data-mvr-chip]')!.dataset.mvrChip).toBe('diverging-up');
    expect(screen.getByText('Diverging — gold rising anyway')).toBeTruthy();
    const explainer = screen.getByText(/\+5\.2%/);
    expect(explainer.textContent).toContain('over the past 30 days');
    expect(explainer.textContent).toContain('fighting the model');
  });

  it('no-read renders the honest data-state explainer with no number', () => {
    render(<ModelVsRealityPanel readings={[]} copy={copy} numberLocale="en-US" />);
    expect(screen.getByText('Not enough data')).toBeTruthy();
    expect(screen.getByText('Not enough fresh data to compare the model with the market.')).toBeTruthy();
  });

  it('the fa locale renders the Persian chip + explainer with the Persian percent sign', () => {
    const { container } = render(
      <ModelVsRealityPanel goldSummary={GOLD_SUMMARY} readings={READINGS} copy={copyFa} numberLocale="fa-IR" />,
    );
    expect(container.querySelector<HTMLElement>('[data-mvr-chip]')!.dataset.mvrChip).toBe('diverging-up');
    expect(screen.getByText('واگرا: طلا با وجود این بالا رفته')).toBeTruthy();
    const explainer = screen.getByText(/۵٫۲٪/);
    expect(explainer.textContent).toContain('در ۳۰ روز گذشته');
    expect(explainer.textContent).toContain('بازار خلاف مدل حرکت می‌کند');
  });
});

/* ------------------------------------------------------------------ *
 * Integration — the owner's 2026-10-31 placement directive: the panels
 * live UNDER the balance visual inside the merged gold card, and the
 * prices strip is the four price tiles again.
 * ------------------------------------------------------------------ */
function signalOf(
  metal: 'gold' | 'silver',
  shared: Array<{ key: SignalConditionKey; state: SignalConditionState }>,
): SignalReading {
  const priceId: IndicatorId = metal === 'gold' ? 'gold-usd' : 'silver-usd';
  return {
    metal,
    priceId,
    conditions: shared.map((c) => ({
      ...c,
      inputs: [c.key === 'real-yield' ? 'real-yield-10y' : c.key === 'expectations' ? 'breakeven-5y5y' : 'dollar-basket'] as IndicatorId[],
    })),
    metCount: shared.filter((c) => c.state === 'supportive').length,
    lean: 'mixed' as const,
    position: { band: 'high' as const, percentile: 0.93 },
    speed: 1.2,
  } as SignalReading;
}

const SHARED: Array<{ key: SignalConditionKey; state: SignalConditionState }> = [
  { key: 'real-yield', state: 'against' },
  { key: 'expectations', state: 'unknown' },
  { key: 'dollar', state: 'unknown' },
  { key: 'footing', state: 'supportive' },
];

describe('MergedSignalsCard integration — the panels mount under the balance', () => {
  it('the card renders the balance, then the two gold panels, then the footing strip (order pinned)', async () => {
    // A stray fetch must fail loudly (AGENTS.md rule 7) — the card and
    // the panels make NO network request of their own.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
    const { MergedSignalsCard } = await import('./MergedCard');
    const gold = signalOf('gold', SHARED);
    const silver = signalOf('silver', SHARED);
    const readings: IndicatorReading[] = [
      reading('gold-usd', { value: 4180, percentile10y: 0.93, change30d: 5.2 }),
      reading('silver-usd', { value: 53.2, percentile10y: 0.88, change30d: -0.4 }),
      reading('real-yield-10y', { percentile10y: 0.95 }),
      reading('us10y', { percentile10y: 0.95 }),
      reading('dollar-basket', { percentile10y: 0.05 }),
      reading('breakeven-5y5y', { status: 'stale', value: null }),
    ];
    const { container } = render(
      <MergedSignalsCard
        gold={gold}
        silver={silver}
        readings={readings}
        goldSummary={GOLD_SUMMARY}
        copy={copy}
        numberLocale="en-US"
      />,
    );
    const card = container.querySelector<HTMLElement>('[data-signal-card="merged"]')!;
    const balance = card.querySelector<HTMLElement>('[data-balance="gold"]')!;
    const panels = card.querySelector<HTMLElement>('[data-gold-panels]')!;
    const tailwind = card.querySelector<HTMLElement>('#insights-gold-tailwind')!;
    const mvr = card.querySelector<HTMLElement>('#insights-gold-model-vs-reality')!;
    expect(balance).toBeTruthy();
    expect(panels).toBeTruthy();
    expect(tailwind).toBeTruthy();
    expect(mvr).toBeTruthy();
    // under the balance, before the footing strip — the owner's placement
    expect(balance.compareDocumentPosition(panels) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tailwind.compareDocumentPosition(mvr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // the stamped goldSummary drives the panel's headline numbers
    expect(tailwind.dataset.goldLabel).toBe('headwind');
    expect(mvr.dataset.mvrChip).toBe('diverging-up');
    // the Persian copy renders when the fa dictionary rides the card
    const { container: faCard } = render(
      <MergedSignalsCard
        gold={gold}
        silver={silver}
        readings={readings}
        goldSummary={GOLD_SUMMARY}
        copy={copyFa}
        numberLocale="fa-IR"
      />,
    );
    expect(faCard.querySelector<HTMLElement>('#insights-gold-tailwind')!.dataset.goldLabel).toBe('headwind');
    // the label word renders (see the NB above — it also names the
    // headwind impacts, so several honest matches)
    expect(faCard.querySelectorAll('[data-gold-voter]').length).toBeGreaterThan(0);
    expect(screen.getAllByText('باد مخالف').length).toBeGreaterThanOrEqual(1);
  });
});

describe('PricesBoard — the strip is the four price tiles again (the S2.1 move-back)', () => {
  it('the board renders NO gold panels, with or without price rows', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => null } as unknown as Response)),
    );
    const { container } = render(
      <PricesBoard
        readings={[reading('gold-usd', { value: 4166, change30d: 5.2 })]}
        copy={copy}
        locale="en"
        numberLocale="en-US"
        onFocusCard={vi.fn()}
      />,
    );
    const board = container.querySelector<HTMLElement>('#insights-prices')!;
    expect(board.querySelector('#insights-card-gold-usd')).toBeTruthy();
    expect(board.querySelector('#insights-gold-tailwind')).toBeNull();
    expect(board.querySelector('#insights-gold-model-vs-reality')).toBeNull();
    // and with no price rows at all, still nothing
    const empty = render(
      <PricesBoard readings={[]} copy={copy} locale="en" numberLocale="en-US" onFocusCard={vi.fn()} />,
    );
    expect(empty.container.querySelector('#insights-gold-tailwind')).toBeNull();
  });
});
