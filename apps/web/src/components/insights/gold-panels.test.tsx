/**
 * @vitest-environment jsdom
 *
 * gold-panels.test.tsx — the Gold Program S2 panels (GOLD_SCORE_SPEC.md
 * §4.4): the GoldTailwindPanel renders the served snapshot's compact
 * goldSummary (label + counts + the four lane words + the derived firing
 * voters), the ModelVsRealityPanel renders the chip + the explainer with
 * the reality's own number, both panels fall back to the SAME pure
 * client-side derivation when the snapshot carries no goldSummary
 * (pre-S2 snapshots), and PricesBoard mounts them beside the gold-usd
 * tile on the strip.
 *
 * Conventions follow prices-cards.test.tsx / outlook.test.ts: jsdom +
 * @testing-library, hand-built reading fixtures driving the shared
 * evaluator through decade-extreme positions, a stubbed history fetch
 * for the board integration.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { GoldTailwindPanel } from './GoldTailwindPanel';
import { ModelVsRealityPanel } from './ModelVsRealityPanel';
import { PricesBoard } from './PricesBoard';

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

describe('GoldTailwindPanel — the served goldSummary renders', () => {
  it('the label word, the net score and the lane counts render from the KNOWN summary', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} numberLocale="en-US" />,
    );
    const panel = container.querySelector<HTMLElement>('[data-gold-label]');
    expect(panel).not.toBeNull();
    expect(panel!.dataset.goldLabel).toBe('headwind');
    expect(panel!.dataset.goldNet).toBe('-1');
    // the label word + the counts line, exactly as the copy block writes them
    expect(screen.getByText('Headwind')).toBeTruthy();
    expect(screen.getByText('1 tailwind · 1 headwind · 1 mixed')).toBeTruthy();
    // the firing line speaks the 20-driver table
    expect(screen.getByText(/5 of 20 drivers firing/)).toBeTruthy();
  });

  it('the four sub-gauge readings render with their lane words and firing counts', () => {
    const { container } = render(
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} numberLocale="en-US" />,
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
      <GoldTailwindPanel goldSummary={GOLD_SUMMARY} readings={READINGS} numberLocale="en-US" />,
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
    const { container } = render(<GoldTailwindPanel readings={READINGS} numberLocale="en-US" />);
    const panel = container.querySelector<HTMLElement>('[data-gold-label]')!;
    expect(panel.dataset.goldLabel).toBe('headwind');
    expect(panel.dataset.goldNet).toBe('-1');
    expect(screen.getByText('1 tailwind · 1 headwind · 1 mixed')).toBeTruthy();
  });

  it('nothing firing renders the honest cannot-read state, never a made-up word', () => {
    const { container } = render(<GoldTailwindPanel readings={[]} numberLocale="en-US" />);
    const panel = container.querySelector<HTMLElement>('[data-gold-label]')!;
    expect(panel.dataset.goldLabel).toBe('none');
    expect(screen.getByText('Cannot read yet')).toBeTruthy();
    expect(screen.getByText(/No driver is firing right now/)).toBeTruthy();
    expect(screen.getByText('0 tailwind · 0 headwind · 0 mixed')).toBeTruthy();
  });
});

describe('ModelVsRealityPanel — the chip + the explainer', () => {
  it('the diverging-up chip renders with its word and the reality\'s own number', () => {
    const { container } = render(
      <ModelVsRealityPanel goldSummary={GOLD_SUMMARY} readings={READINGS} numberLocale="en-US" />,
    );
    expect(container.querySelector<HTMLElement>('[data-mvr-chip]')!.dataset.mvrChip).toBe('diverging-up');
    expect(screen.getByText('Diverging — gold rising anyway')).toBeTruthy();
    const explainer = screen.getByText(/\+5\.2%/);
    expect(explainer.textContent).toContain('over the past 30 days');
    expect(explainer.textContent).toContain('fighting the model');
  });

  it('no-read renders the honest data-state explainer with no number', () => {
    render(<ModelVsRealityPanel readings={[]} numberLocale="en-US" />);
    expect(screen.getByText('Not enough data')).toBeTruthy();
    expect(screen.getByText('Not enough fresh data to compare the model with the market.')).toBeTruthy();
  });
});

describe('PricesBoard integration — the panels mount beside the gold-usd tile', () => {
  it('the strip renders the gold tile then the two gold panels (order pinned)', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => null } as unknown as Response)),
    );
    const { container } = render(
      <PricesBoard
        readings={[reading('gold-usd', { value: 4166, change30d: 5.2 })]}
        goldSummary={GOLD_SUMMARY}
        copy={insightsCopyEn}
        locale="en"
        numberLocale="en-US"
        onFocusCard={vi.fn()}
      />,
    );
    const board = container.querySelector<HTMLElement>('#insights-prices')!;
    const goldTile = board.querySelector<HTMLElement>('#insights-card-gold-usd')!;
    const tailwind = board.querySelector<HTMLElement>('#insights-gold-tailwind')!;
    const mvr = board.querySelector<HTMLElement>('#insights-gold-model-vs-reality')!;
    expect(goldTile).toBeTruthy();
    expect(tailwind).toBeTruthy();
    expect(mvr).toBeTruthy();
    // beside the gold tile: the two panels follow it in the grid's DOM order
    expect(goldTile.compareDocumentPosition(tailwind) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(goldTile.compareDocumentPosition(mvr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tailwind.compareDocumentPosition(mvr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // the board without any price rows stays silent (no orphan panels)
    const empty = render(
      <PricesBoard readings={[]} copy={insightsCopyEn} locale="en" numberLocale="en-US" onFocusCard={vi.fn()} />,
    );
    expect(empty.container.querySelector('#insights-gold-tailwind')).toBeNull();
  });
});
