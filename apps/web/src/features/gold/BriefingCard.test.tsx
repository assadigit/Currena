/**
 * @vitest-environment jsdom
 *
 * BriefingCard + CompositionStack + the gold-briefing derivations —
 * GUX-S5 M3a (11 §5 / §10, S4-D5/D11, S5-D2).
 *
 * BriefingCard pins:
 *  1. the structure — kicker, type-verdict headline (the PRESENT-TENSE
 *     conditions statement), the Q1 container (the shipped 7-state line
 *     + counts + caveat inside), the ≤3 reason rows, the
 *     what-could-change line, the evidence footer + AsOfChip;
 *  2. the owner gates — NO horizon chip, NO scenario row, NO
 *     five-state word (Q1/Q2 render NOTHING);
 *  3. the reasons — the S5-D2 rule (firing voters, one per lane,
 *     firing-count order, capped 3) with each row's state word in its
 *     impact ink + the 09 defaultCopy from the content module;
 *  4. the what-could-change line — the narrowest firing lane, or the
 *     honest fallback when nothing fires;
 *  5. the evidence word — aligned / mixed / limited per the rule;
 *  6. the focal recipe — the gold field + ring-2 + --shadow-focal (the
 *     page's single focal element);
 *  7. fa rendering.
 *
 * CompositionStack pins: the five layers ①–⑤ (verdict once, the
 * instrument, the five LaneBars, the ledger anchor, the caveat); the
 * verdict word renders EXACTLY once; the ledger affordance anchors to
 * #gold-seats.
 *
 * The derivations: the S5-D2 selection rule, the narrow-lane rule, the
 * evidence rule — each pinned against hand-built lanes.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import type { GoldBalanceLane, GoldLane, GoldBalanceReading } from '@currena/insights';
import { BriefingCard } from './BriefingCard';
import { CompositionStack } from './CompositionStack';
import { briefingEvidenceOf, briefingNarrowLaneOf, briefingReasonsOf } from './gold-briefing';
import type { GoldHeroModel } from './gold-tiles';
import { useI18n } from '../../shared/lib/locale';

afterEach(cleanup);

function LocaleProbe({ locale }: { locale: 'en' | 'fa' }): null {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

function renderAt(locale: 'en' | 'fa', ui: React.ReactElement) {
  return render(
    <>
      <LocaleProbe locale={locale} />
      {ui}
    </>,
  );
}

/* ------------------------------------------------------------------ *
 * Lane/balance fixtures (hand-built — the derivations are pure)
 * ------------------------------------------------------------------ */

function lane(
  id: GoldLane,
  side: 'for' | 'against' | 'neutral' | 'unread',
  members: Array<{ id: string; impact: 'supports' | 'pressures' | 'steady' | 'unread' }>,
): GoldBalanceLane {
  const supports = members.filter((m) => m.impact === 'supports').length;
  const pressures = members.filter((m) => m.impact === 'pressures').length;
  const steady = members.filter((m) => m.impact === 'steady').length;

  return {
    lane: id,
    side,
    split: side === 'neutral' && supports > 0 && pressures > 0,
    readable: supports + pressures + steady,
    firing: supports + pressures,
    supports,
    pressures,
    members: members.map((m) => ({ ...m, evidence: m.impact === 'supports' || m.impact === 'pressures' ? 'rising' : null })),
  } as unknown as GoldBalanceLane;
}

function balanceOf(lanes: GoldBalanceLane[]): GoldBalanceReading {
  return {
    lanes,
    counts: { for: 1, against: 0, neutral: 3, unread: 1, total: 5, net: 1, readable: 4 },
    net: 1,
    readable: 4,
  } as unknown as GoldBalanceReading;
}

function heroOf(lanes: GoldBalanceLane[], outlook: 'bearish' | null = 'bearish'): GoldHeroModel {
  return { balance: balanceOf(lanes), outlook, price: undefined, speed: undefined, position: undefined } as unknown as GoldHeroModel;
}

/** The S1-capture-like shape: borrowing FOR (2 firing), dollar AGAINST
 * (3 firing), stress quiet, inflation split, flows unread. */
function mixedLanes(): GoldBalanceLane[] {
  return [
    lane('borrowing-costs', 'for', [
      { id: 'real-yield-10y', impact: 'supports' },
      { id: 'us10y', impact: 'supports' },
      { id: 'us30y', impact: 'steady' },
      { id: 'fed-target', impact: 'steady' },
    ]),
    lane('dollar', 'against', [
      { id: 'dollar-basket', impact: 'pressures' },
      { id: 'usdjpy', impact: 'pressures' },
      { id: 'us-japan-10y-gap', impact: 'pressures' },
      { id: 'usd-reserve-share', impact: 'steady' },
    ]),
    lane('stress', 'neutral', [
      { id: 'vix', impact: 'steady' },
      { id: 'stress-stlfsi', impact: 'steady' },
    ]),
    lane('inflation', 'neutral', [
      { id: 'us-cpi-yoy', impact: 'supports' },
      { id: 'us-pce-core-yoy', impact: 'pressures' },
      { id: 'breakeven-5y5y', impact: 'steady' },
    ]),
    lane('flows', 'unread', [
      { id: 'cftc-gold-positioning', impact: 'unread' },
      { id: 'cftc-gold-gross-long', impact: 'unread' },
    ]),
  ];
}

/* ------------------------------------------------------------------ *
 * The derivations (S5-D2)
 * ------------------------------------------------------------------ */

describe('gold-briefing derivations', () => {
  it('briefingReasonsOf: firing voters, one per lane, firing-count order, capped 3', () => {
    const reasons = briefingReasonsOf(heroOf(mixedLanes()));
    // dollar fires 3, borrowing fires 2, inflation fires 2 (split) —
    // one member each, ordered by firing count then engine order.
    expect(reasons).toEqual([
      { id: 'dollar-basket', lane: 'dollar', impact: 'pressures' },
      { id: 'real-yield-10y', lane: 'borrowing-costs', impact: 'supports' },
      { id: 'us-cpi-yoy', lane: 'inflation', impact: 'supports' },
    ]);
  });

  it('briefingReasonsOf: never forces a quiet lane (stress/flows contribute nothing)', () => {
    const reasons = briefingReasonsOf(heroOf(mixedLanes()));
    expect(reasons.some((r) => r.lane === 'stress' || r.lane === 'flows')).toBe(false);
  });

  it('briefingNarrowLaneOf: the smallest contest among firing lanes', () => {
    // inflation is 1v1 (margin 0); dollar 0v3 (margin 3); borrowing 2v0 (margin 2).
    expect(briefingNarrowLaneOf(heroOf(mixedLanes()))).toBe('inflation');
  });

  it('briefingNarrowLaneOf: null when nothing fires', () => {
    const quiet = [
      lane('borrowing-costs', 'neutral', [{ id: 'us10y', impact: 'steady' }]),
    ];
    expect(briefingNarrowLaneOf(heroOf(quiet, null))).toBeNull();
  });

  it('briefingEvidenceOf: aligned / mixed / limited per the rule', () => {
    // mixedLanes: firing lanes disagree (for vs against) → mixed.
    expect(briefingEvidenceOf(heroOf(mixedLanes()))).toBe('mixed');
    const aligned = [
      lane('borrowing-costs', 'for', [{ id: 'real-yield-10y', impact: 'supports' }, { id: 'us10y', impact: 'supports' }]),
      lane('dollar', 'for', [{ id: 'dollar-basket', impact: 'supports' }, { id: 'usdjpy', impact: 'supports' }]),
    ];
    expect(briefingEvidenceOf(heroOf(aligned))).toBe('aligned');
    const sparse = [lane('stress', 'neutral', [{ id: 'vix', impact: 'steady' }])];
    expect(briefingEvidenceOf(heroOf(sparse, null))).toBe('limited');
  });
});

/* ------------------------------------------------------------------ *
 * BriefingCard
 * ------------------------------------------------------------------ */

describe('BriefingCard — the single focal element', () => {
  it('renders the structure: kicker, headline, the Q1 container (7-state + counts + caveat), reasons, what-could-change, evidence footer', () => {
    const { container } = renderAt(
      'en',
      <BriefingCard hero={heroOf(mixedLanes())} verdictState="against" asOf="Nov 19" />,
    );
    const card = container.querySelector('[data-briefing-card]');
    expect(card).not.toBeNull();
    // The focal recipe (11 §3.1): gold gradient + ring-2 + the focal shadow token.
    expect(card?.className).toContain('ring-2 ring-[var(--color-accent-gold)]/40');
    expect(card?.className).toContain('shadow-[var(--shadow-focal)]');
    // Kicker + headline (present tense, type-verdict).
    expect(card?.querySelector('[data-briefing-headline]')?.textContent).toBe('Gold: conditions lean against it');
    expect(card?.querySelector('[data-briefing-headline]')?.className).toContain('type-verdict');
    // The Q1 container: the shipped 7-state line + counts + caveat inside.
    const summary = card?.querySelector('[data-briefing-summary]');
    expect(summary).not.toBeNull();
    expect(card?.querySelector('[data-briefing-outlook="bearish"]')?.textContent).toBe('Bearish');
    expect(summary?.textContent).toContain('this describes current conditions, not a forecast');
    // The reasons (S5-D2): 3 rows, state words in impact inks, the 09 defaultCopy.
    const rows = card?.querySelectorAll('[data-brief-reason]') ?? [];
    expect(rows).toHaveLength(3);
    expect(card?.querySelector('[data-brief-reason="dollar-basket"] [data-brief-reason-state]')?.textContent).toBe('Pressures gold');
    expect(card?.querySelector('[data-brief-reason="real-yield-10y"]')?.textContent).toContain('Real yields');
    // What-could-change: the narrowest lane.
    expect(card?.textContent).toContain('A small shift in Inflation & inflation expectations could move this balance');
    // Evidence + the AsOfChip.
    expect(card?.querySelector('[data-briefing-evidence="mixed"]')?.textContent).toBe('Evidence: mixed');
    expect(card?.querySelector('[data-asof-chip]')?.textContent).toBe('as of Nov 19');
  });

  it('the owner gates: NO horizon chip, NO scenario row, NO five-state word (Q1/Q2 render nothing)', () => {
    const { container } = renderAt('en', <BriefingCard hero={heroOf(mixedLanes())} verdictState="against" />);
    const html = container.innerHTML;
    expect(html).not.toContain('horizon');
    expect(html).not.toContain('scenario');
    // The five-state drafts never render (the 7-state word does).
    expect(html).not.toContain('moderately pressure');
    expect(html).not.toContain('strongly support');
  });

  it('the honest fallback line when nothing fires; the sparse headline', () => {
    const quiet = heroOf([lane('stress', 'neutral', [{ id: 'vix', impact: 'steady' }])], null);
    const { container } = renderAt('en', <BriefingCard hero={quiet} verdictState="not-enough" />);
    expect(container.querySelector('[data-briefing-headline]')?.textContent).toBe('Gold: not enough readings to say');
    expect(container.textContent).toContain('The picture will move as fresh readings arrive');
    expect(container.querySelectorAll('[data-brief-reason]')).toHaveLength(0);
    // No outlook line renders when the engine has none.
    expect(container.querySelector('[data-briefing-summary]')).toBeNull();
  });

  it('the reason rows open the record panel when the M4 wiring passes the opener', () => {
    const onOpenRecord = vi.fn();
    const { container } = renderAt(
      'en',
      <BriefingCard hero={heroOf(mixedLanes())} verdictState="against" onOpenRecord={onOpenRecord} />,
    );
    const btn = container.querySelector('button[data-brief-reason="dollar-basket"]');
    expect(btn?.getAttribute('aria-haspopup')).toBe('dialog');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onOpenRecord).toHaveBeenCalledWith('dollar-basket');
  });

  it('fa renders the Persian briefing vocabulary', () => {
    const { container } = renderAt('fa', <BriefingCard hero={heroOf(mixedLanes())} verdictState="against" asOf="۱۹ نوامبر" />);
    const card = container.querySelector('[data-briefing-card]');
    expect(card?.querySelector('[data-briefing-headline]')?.textContent).toBe('طلا: شرایط علیه آن می‌چربد');
    expect(card?.querySelector('[data-briefing-outlook="bearish"]')?.textContent).toBe('نزولی');
    expect(card?.textContent).toContain('شواهد: مختلط');
    expect(card?.querySelector('[data-asof-chip]')?.textContent).toBe('تا ۱۹ نوامبر');
  });
});

/* ------------------------------------------------------------------ *
 * CompositionStack
 * ------------------------------------------------------------------ */

describe('CompositionStack — the five-layer conditions block', () => {
  it('renders ①–⑤: the verdict once, the instrument, the five LaneBars, the ledger anchor, the caveat', () => {
    const { container } = renderAt(
      'en',
      <CompositionStack hero={heroOf(mixedLanes())} verdictState="against" verdictWord="Leaning against gold" />,
    );
    const stack = container.querySelector('[data-composition-stack]');
    expect(stack).not.toBeNull();
    // ① the verdict, said once.
    expect(stack?.querySelector('[data-stack-verdict="against"]')?.textContent).toBe('Leaning against gold');
    expect(stack?.textContent).toContain('Conditions');
    // ③ the five LaneBars (the ONE lane renderer).
    expect(stack?.querySelectorAll('[data-lanebar]')).toHaveLength(5);
    // ④ the ledger affordance — the anchor to the five-force overview.
    const ledger = stack?.querySelector('[data-stack-ledger-link]');
    expect(ledger?.getAttribute('href')).toBe('#gold-seats');
    expect(ledger?.textContent).toBe('Inspect all 37 voters');
    // ⑤ the honesty line.
    expect(stack?.textContent).toContain('this describes current conditions, not a forecast');
  });

  it('below lg: the BeamGlyph + the inspect affordance (the brass mounts on tap only)', () => {
    // jsdom has no real viewport — stub matchMedia as a narrow screen so
    // the stack's session-only read takes the mobile branch.
    const mm = vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    vi.stubGlobal('matchMedia', mm);
    try {
      const { container } = renderAt(
        'en',
        <CompositionStack hero={heroOf(mixedLanes())} verdictState="against" verdictWord="Leaning against gold" />,
      );
      const stack = container.querySelector('[data-composition-stack]');
      // The mobile instrument: the BeamGlyph + the inspect button.
      expect(stack?.querySelector('[data-hero-beam]')).not.toBeNull();
      const inspect = stack?.querySelector('[data-stack-inspect-instrument]');
      expect(inspect?.getAttribute('aria-expanded')).toBe('false');
      // The brass is NOT mounted by default below lg.
      expect(stack?.querySelector('[data-balance-visual]')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
