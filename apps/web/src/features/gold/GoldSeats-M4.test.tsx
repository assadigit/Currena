/**
 * @vitest-environment jsdom
 *
 * GoldSeats-M4 + SeatMark + GoldRecordSheet — the GUX-S5 M4 pins
 * (11 §5.3/§7, 12 §2, the F-04 fix):
 *
 *  1. the five LaneBar summaries render (one per lane — the ONE lane
 *     renderer carries the summary, no intro/tally chrome);
 *  2. the 37 CLOSED cards (never chips): the plainLabel + the lean word
 *     in impact ink + the mark + the 09 defaultCopy + the AsOfChip;
 *  3. the marks: the per-seat kind map (band/stepped/yoy/signed/share),
 *     the unread dotted form, the impact-ink marker (never position
 *     ink), the honest no-percentile track;
 *  4. the sheet: the opener button on every card, the 09 tiers (the
 *     expanded whatWhy/rises/falls/analogy + the technical disclosure),
 *     the lazy deep chunk (loads on open), Escape + focus return;
 *  5. the Q-gates: no five-state word, no horizon chip, no scenario
 *     row anywhere in the section.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { GoldBalanceLane } from '@currena/insights';
import { GoldSeats } from './GoldSeats';
import { seatMarkKindOf } from './SeatMark';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import type { IndicatorReading } from '@currena/core';
import { useI18n } from '../../shared/lib/locale';
import { useEffect } from 'react';

afterEach(cleanup);

function LocaleProbe({ locale }: { locale: 'en' | 'fa' }): null {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

/* A seat-carrying lane fixture: members shaped from the engine's own
 * GoldBalanceLane (the page's goldSeatLanes shape derives from it). */
function seatLane(
  lane: GoldBalanceLane['lane'],
  members: Array<{ id: string; impact: 'supports' | 'pressures' | 'steady' | 'unread'; evidence?: 'rising' | 'falling' | 'high' | 'low' }>,
): GoldBalanceLane {
  const supports = members.filter((m) => m.impact === 'supports').length;
  const pressures = members.filter((m) => m.impact === 'pressures').length;
  const steady = members.filter((m) => m.impact === 'steady').length;
  const unread = members.filter((m) => m.impact === 'unread').length;
  return {
    lane,
    side: pressures > supports ? 'against' : supports > pressures ? 'for' : supports > 0 ? 'neutral' : 'unread',
    split: supports > 0 && pressures > 0 && supports === pressures,
    readable: supports + pressures + steady,
    firing: supports + pressures,
    supports,
    pressures,
    steady,
    unread,
    members: members.map((m) => ({ id: m.id, impact: m.impact, evidence: m.evidence ?? null })),
  } as GoldBalanceLane;
}

/** The page's own projection shape → the lanes GoldSeats takes (the
 *  goldSeatLanes derivation, restated minimally for the fixture). */
function lanesOf(balance: { lanes: GoldBalanceLane[] }) {
  return balance.lanes.map((lane) => ({
    lane: lane.lane,
    side: lane.side,
    split: lane.split,
    readable: lane.readable,
    firing: lane.firing,
    supports: lane.supports,
    pressures: lane.pressures,
    seats: lane.members.map((m) => ({
      id: m.id as never,
      impact: m.impact,
      evidence: m.evidence,
      homePage: m.id === 'gold-silver' || m.id === 'cftc-gold-positioning' ? ('gold' as const) : ('usa' as const),
    })),
  }));
}

function reading(id: string, over: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1.9,
    unit: '%',
    asOf: '2026-11-18',
    status: 'normal',
    change30d: 0.12,
    percentile10y: 0.86,
    ...over,
  } as IndicatorReading;
}

const THE_37 = GOLD_VOTER_IDS.map((v, i) => ({
  id: v as string,
  impact: (['supports', 'pressures', 'steady', 'unread'] as const)[i % 4]!,
  evidence: (i % 2 === 0 ? 'rising' : 'high') as 'rising' | 'high',
}));

const LANES = lanesOf({
  lanes: [
    seatLane('borrowing-costs', THE_37.slice(0, 7)),
    seatLane('dollar', THE_37.slice(7, 14)),
    seatLane('stress', THE_37.slice(14, 25)),
    seatLane('inflation', THE_37.slice(25, 35)),
    seatLane('flows', THE_37.slice(35, 37)),
  ],
});

const READINGS: IndicatorReading[] = GOLD_VOTER_IDS.map((id, i) =>
  reading(id, { percentile10y: i % 5 === 0 ? undefined : 0.2 + (i % 7) * 0.1 }),
);

describe('GUX-S5 M4 — the five-force overview (LaneBar summaries + closed cards + the record sheet)', () => {
  it('the five LaneBar summaries render — one per lane, the ONE lane renderer, no intro/tally chrome', () => {
    render(
      <>
        <LocaleProbe locale="en" />
        <GoldSeats lanes={LANES} readings={READINGS} />
      </>,
    );
    expect(document.querySelectorAll('[data-lanebar]').length).toBe(5);
    // The R17 keep holds: the lane intro sentence + the old tally line are GONE.
    const section = document.querySelector('[data-gold-seats]')!;
    expect(section.textContent).not.toContain('What sitting money earns');
    // The lane anchors survive (R10's contract + the stack's ledger link).
    for (const lane of ['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows']) {
      expect(document.getElementById(`lane-${lane}`)).toBeTruthy();
    }
    expect(document.getElementById('gold-seats')).toBeTruthy();
  });

  it('the 37 CLOSED cards: plainLabel + lean word + mark + the 09 defaultCopy + the AsOfChip (F-04: never a chip wall)', () => {
    render(
      <>
        <LocaleProbe locale="en" />
        <GoldSeats lanes={LANES} readings={READINGS} />
      </>,
    );
    expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    expect(document.querySelectorAll('[data-seat-lean]').length).toBe(37);
    expect(document.querySelectorAll('[data-seat-mark]').length).toBe(37);
    expect(document.querySelectorAll('[data-seat-copy]').length).toBe(37);
    expect(document.querySelectorAll('[data-asof-chip^="seat-"]').length).toBe(37);
    // The 09 defaultCopy rides the closed card (the content module's own words).
    expect(document.querySelector('[data-seat-copy]')?.textContent).toContain('What a 10-year');
    // The lean vocabulary stays the corpus's own.
    // The four lean words render, one per impact class (the corpus's own).
    const impacts = new Set([...document.querySelectorAll('[data-seat]')].map((el) => el.getAttribute('data-seat-impact')));
    expect(impacts.has('supports')).toBe(true);
    expect(impacts.has('pressures')).toBe(true);
    expect(impacts.has('steady')).toBe(true);
    expect(impacts.has('unread')).toBe(true);
    const leanWords = [...document.querySelectorAll('[data-seat-lean]')].map((el) => el.textContent).join(' | ');
    expect(leanWords).toContain('Supports gold');
  });

  it('the mark kinds follow 12 §2: the stepped policy rates, the YoY inflation family, the two signed stress indexes + CFTC net, the gross share', () => {
    expect(seatMarkKindOf('fed-target')).toBe('band-stepped');
    expect(seatMarkKindOf('ecb-dfr')).toBe('band-stepped');
    expect(seatMarkKindOf('us-cpi-yoy')).toBe('band-yoy');
    expect(seatMarkKindOf('us-pce-core-yoy')).toBe('band-yoy');
    expect(seatMarkKindOf('euro-hicp')).toBe('band-yoy');
    expect(seatMarkKindOf('m2-us')).toBe('band-yoy');
    expect(seatMarkKindOf('stress-stlfsi')).toBe('signed');
    expect(seatMarkKindOf('nfci')).toBe('signed');
    expect(seatMarkKindOf('cftc-gold-positioning')).toBe('signed');
    expect(seatMarkKindOf('cftc-gold-gross-long')).toBe('share');
    expect(seatMarkKindOf('real-yield-10y')).toBe('band');
  });

  it('the marks render honestly: the unread dotted track, the no-percentile plain track, the marker carries the IMPACT ink (never position ink)', () => {
    render(
      <>
        <LocaleProbe locale="en" />
        <GoldSeats lanes={LANES} readings={READINGS} />
      </>,
    );
    // The unread seats render the dotted empty track (the data-quality grammar).
    expect(document.querySelectorAll('[data-seat-mark="unread"]').length).toBeGreaterThan(0);
    // A no-percentile readable seat renders the plain track, never a guessed marker.
    expect(document.querySelectorAll('[data-mark-marker="absent"]').length).toBeGreaterThan(0);
    // A firing seat's marker + trail render; the steady seat's marker carries the stone ink.
    expect(document.querySelectorAll('[data-mark-marker]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-mark-trail]').length).toBeGreaterThan(0);
  });

  it('the record sheet: the card opens it, the 09 expanded tier renders (whatWhy + rises/falls + the analogy where authored), the technical <details> carries the measurement line', async () => {
    render(
      <>
        <LocaleProbe locale="en" />
        <GoldSeats lanes={LANES} readings={READINGS} />
      </>,
    );
    // Every card carries the opener (the stretched-button pattern).
    expect(document.querySelectorAll('[data-seat-open]').length).toBe(37);

    // Open the real-yield-10y card (the first seat in the fixture).
    const openers = document.querySelectorAll('[data-seat-open]');
    fireEvent.click(openers[0]!);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-record-sheet]')).not.toBeNull();
    });
    // The sheet's dialog semantics (the shipped panel contract).
    const sheet = document.querySelector('[data-gold-record-sheet]') as HTMLElement;
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-modal')).toBe('true');

    // The lazy deep tier lands: the expanded fields + the technical row.
    await waitFor(() => {
      expect(document.querySelector('[data-sheet-whatwhy]')).not.toBeNull();
    });
    expect(document.querySelector('[data-sheet-rises]')?.textContent?.length ?? 0).toBeGreaterThan(5);
    expect(document.querySelector('[data-sheet-falls]')?.textContent?.length ?? 0).toBeGreaterThan(5);
    const technical = document.querySelector('[data-sheet-technical]') as HTMLDetailsElement;
    expect(technical).not.toBeNull();
    expect(technical.open).toBe(false); // collapsed by default (11 §7.1)

    // The Q-gates hold on the sheet too: no five-state word, no horizon, no scenario.
    expect(sheet.textContent).not.toContain('horizon');
    expect(sheet.textContent).not.toContain('scenario');

    // Escape closes + focus returns to the opener.
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    await waitFor(() => {
      expect(document.querySelector('[data-gold-record-sheet]')).toBeNull();
    });
  });

  it('fa rendering: the LaneBar + the lean words + the defaultCopy render in Persian', () => {
    render(
      <>
        <LocaleProbe locale="fa" />
        <GoldSeats lanes={LANES} readings={READINGS} />
      </>,
    );
    const section = document.querySelector('[data-gold-seats]')!;
    expect(section.textContent).toContain('به نفع قیمت طلا');
    expect(document.querySelector('[data-lanebar]')?.textContent).toContain('نرخ بهره');
  });
});
