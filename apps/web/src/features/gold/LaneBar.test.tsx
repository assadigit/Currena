/**
 * @vitest-environment jsdom
 *
 * LaneBar + AsOfChip tests — GUX-S5 M2 (11 §5.3 / §6.4): the ONE
 * lane-summary renderer and the ONE freshness grammar.
 *
 * LaneBar pins:
 *  1. the anatomy slot order — the audience label, the condition word
 *     in the lane's impact ink, the proportional stacked pill
 *     (aria-hidden), the tally in words;
 *  2. the two-channel rule at lane level — the WORD is the lane's own
 *     condition (relief/tight, strong, elevated, hot/cool…), the INK
 *     is the gold relationship (for → status-normal, against →
 *     status-alert);
 *  3. the split lane — both hued segments + the amber compact word
 *     "Split (2·1)";
 *  4. the unread lane — the whole pill dotted (never all-steady) + the
 *     why-line;
 *  5. the accessible name — "«label»: «state word». «tally».";
 *  6. fa rendering — the lane label + condition word in Persian, the
 *     pill mirroring with the page direction (no direction override);
 *  7. the pill geometry — segment widths proportional to the counts.
 *
 * AsOfChip pins: the time + state-word + cache parts joined with " · ",
 * the tertiary ink (no market hues), null when nothing to say, and the
 * data attribute carrying the state.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { LaneBar, laneBarDataOf, type LaneBarData } from './LaneBar';
import { AsOfChip, type AsOfState } from './AsOfChip';
import { useI18n } from '../../shared/lib/locale';

afterEach(cleanup);

/** The locale store is module-global — every test renders its own
 * probe so the file's tests are order-independent (the GoldPage house
 * pattern, made explicit per-test here). */
function renderAt(locale: 'en' | 'fa', ui: React.ReactElement) {
  return render(
    <>
      <LocaleProbe locale={locale} />
      {ui}
    </>,
  );
}

/** The GoldPage house pattern — flip the locale store through the
 * public API so the component under test re-renders in fa. */
function LocaleProbe({ locale }: { locale: 'en' | 'fa' }): null {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

const FOR_LANE: LaneBarData = {
  lane: 'borrowing-costs',
  side: 'for',
  split: false,
  supports: 3,
  pressures: 0,
  steady: 4,
  unread: 0,
};

const AGAINST_LANE: LaneBarData = {
  lane: 'dollar',
  side: 'against',
  split: false,
  supports: 0,
  pressures: 2,
  steady: 5,
  unread: 0,
};

const SPLIT_LANE: LaneBarData = {
  lane: 'stress',
  side: 'neutral',
  split: true,
  supports: 2,
  pressures: 1,
  steady: 7,
  unread: 1,
};

const UNREAD_LANE: LaneBarData = {
  lane: 'inflation',
  side: 'unread',
  split: false,
  supports: 0,
  pressures: 0,
  steady: 0,
  unread: 10,
  whyLine: 'Two readings are not published yet.',
};

describe('LaneBar — the one lane-summary renderer', () => {
  it('renders the anatomy: label, condition word in impact ink, aria-hidden pill, tally words', () => {
    const { container } = renderAt('en', <LaneBar data={FOR_LANE} />);
    const root = container.querySelector('[data-lanebar="borrowing-costs"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-label')).toBe(
      'Interest rates & borrowing costs: Relief. 3 for · 4 not leaning.',
    );
    // The condition word — the lane's OWN state, not the relational word.
    const state = root?.querySelector('[data-lanebar-state]');
    expect(state?.textContent).toBe('Relief');
    // For-side ink: status-normal (the impact channel).
    expect(state?.className).toContain('text-[var(--color-status-normal)]');
    // The pill is aria-hidden; segments proportional (3/7 for, 4/7 steady).
    const pill = root?.querySelector('[data-lanebar-pill]');
    expect(pill?.getAttribute('aria-hidden')).toBe('true');
    const segs = pill?.querySelectorAll('.lanebar-seg') ?? [];
    expect(segs).toHaveLength(2);
    expect(segs[0]?.className).toContain('lanebar-seg-for');
    expect(segs[0]?.getAttribute('style')).toContain('width: 42.857%');
    expect(segs[1]?.className).toContain('lanebar-seg-steady');
    // The tally in words.
    expect(root?.textContent).toContain('3 for · 4 not leaning');
  });

  it('the against side renders the lane’s against-word in the alert ink (two-channel)', () => {
    const { container } = renderAt('en', <LaneBar data={AGAINST_LANE} />);
    const state = container.querySelector('[data-lanebar="dollar"] [data-lanebar-state]');
    expect(state?.textContent).toBe('Strong');
    expect(state?.className).toContain('text-[var(--color-status-alert)]');
    expect(container.querySelector('[data-lanebar="dollar"]')?.getAttribute('data-lanebar-side')).toBe('against');
  });

  it('the split lane: both hued segments + the amber compact word with the counts', () => {
    const { container } = renderAt('en', <LaneBar data={SPLIT_LANE} />);
    const root = container.querySelector('[data-lanebar="stress"]');
    expect(root?.getAttribute('data-lanebar-side')).toBe('split');
    const state = root?.querySelector('[data-lanebar-state]');
    expect(state?.textContent).toBe('Split (2·1)');
    expect(state?.className).toContain('text-[var(--color-status-watch)]');
    const segs = root?.querySelectorAll('.lanebar-seg') ?? [];
    expect(segs.length).toBe(4); // for + against + steady + unread — both hued segments present
    expect(root?.textContent).toContain('2 for · 1 against · 7 not leaning · 1 unread');
  });

  it('the unread lane: the whole pill dotted (never all-steady) + the why-line', () => {
    const { container } = renderAt('en', <LaneBar data={UNREAD_LANE} />);
    const root = container.querySelector('[data-lanebar="inflation"]');
    expect(root?.getAttribute('data-lanebar-side')).toBe('unread');
    const pill = root?.querySelector('[data-lanebar-pill]');
    expect(pill?.getAttribute('data-lanebar-pill')).toBe('dotted');
    expect(pill?.querySelector('.lanebar-seg-dotted')).not.toBeNull();
    // The why-line rides the tally row.
    expect(root?.textContent).toContain('Two readings are not published yet.');
  });

  it('fa renders the Persian label + condition word; the pill has no direction override', () => {
    const { container } = renderAt('fa', <LaneBar data={FOR_LANE} />);
    const root = container.querySelector('[data-lanebar="borrowing-costs"]');
    expect(root?.querySelector('[data-lanebar-state]')?.textContent).toBe('آرامش');
    expect(root?.textContent).toContain('نرخ بهره و هزینهٔ استقراض');
    // 11 §5.3: the stacking order follows the reading direction — the
    // pill must NOT pin direction (it inherits and mirrors in RTL).
    const pill = root?.querySelector('.lanebar-pill');
    expect(pill).not.toBeNull();
  });

  it('laneBarDataOf normalizes the engine lane (member impacts → steady/unread counts)', () => {
    const engineLane = {
      lane: 'flows',
      side: 'for',
      split: false,
      readable: 2,
      firing: 1,
      supports: 1,
      pressures: 0,
      members: [
        { id: 'cftc-gold-positioning', impact: 'supports', evidence: 'falling' },
        { id: 'cftc-gold-gross-long', impact: 'steady', evidence: null },
      ],
    } as unknown as import('@currena/insights').GoldBalanceLane;
    expect(laneBarDataOf(engineLane)).toEqual({
      lane: 'flows',
      side: 'for',
      split: false,
      supports: 1,
      pressures: 0,
      steady: 1,
      unread: 0,
    });
  });
});

describe('AsOfChip — the one freshness grammar', () => {
  it('joins the time, state word, and cache qualifier with " · " in tertiary ink', () => {
    const { container } = renderAt('en', <AsOfChip asOf="12:30 UTC" state="fresh" cached />);
    const chip = container.querySelector('[data-asof-chip]');
    expect(chip?.textContent).toBe('as of 12:30 UTC · fresh · (last successful)');
    expect(chip?.className).toContain('text-[var(--color-text-tertiary)]');
    expect(chip?.getAttribute('data-asof-chip')).toBe('fresh');
  });

  it.each<[string, AsOfState, string]>([
    ['fresh', 'fresh', 'as of 09:00 · fresh'],
    ['delayed', 'delayed', 'as of 09:00 · delayed'],
    ['stale', 'stale', 'as of 09:00 · stale'],
    ['waiting', 'waiting', 'as of 09:00 · waiting'],
  ])('the %s state word renders as a plain suffix (no icons, no colors)', (_label, state, expected) => {
    const { container } = renderAt('en', <AsOfChip asOf="09:00" state={state} />);
    expect(container.querySelector('[data-asof-chip]')?.textContent).toBe(expected);
  });

  it('renders null when there is nothing to say', () => {
    const { container } = renderAt('en', <AsOfChip />);
    expect(container.querySelector('[data-asof-chip]')).toBeNull();
  });

  it('fa renders the Persian freshness vocabulary', () => {
    const { container } = renderAt('fa', <AsOfChip asOf="۱۲:۳۰" state="delayed" cached />);
    expect(container.querySelector('[data-asof-chip]')?.textContent).toBe(
      'تا ۱۲:۳۰ · با تأخیر · (آخرین تازه‌سازی موفق)',
    );
  });
});
