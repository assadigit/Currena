/**
 * gold-anchors.test.ts — GPE R10 (INF-3): the anchor-id contract of
 * record (s7/03 §1.2), pinned. Every voter seat's href is CARD-LEVEL
 * (the destination card's own stable anchor, never a bare page —
 * GPE-S2-18); every seat's destination-name key resolves in BOTH
 * dictionaries (the name-match rule); the builder is pure over the
 * placement table's own homepages.
 */

import { describe, expect, it } from 'vitest';
import { GOLD_SEAT_DEST_NAME_KEY, PAGE_ROUTE, seatAnchorHref, type GoldVoterId } from './gold-tiles';
import { homePageOfIndicator, GOLD_VOTER_IDS } from '@currena/insights/page-division';
import { en } from '../../shared/i18n/en';
import { fa } from '../../shared/i18n/fa';

/** The destination pages' card-anchor prefixes, as their components render
 * them (verified in UsaTierCards/CurrenciesTierCards/EuropeTierCards/
 * WorldRiskCards/GoldContext — the pages' own `id={...}` patterns). */
const PREFIX: Record<string, string> = {
  gold: 'gold-card',
  'world-markets': 'wm-risk',
  usa: 'usa-card',
  europe: 'europe-card',
  'asia-pacific': 'asia-card',
  australia: 'australia-card',
  commodities: 'commodities-card',
  currencies: 'currencies-card',
};

/** Resolve a dotted dictionary key at runtime (the type layer guarantees
 * existence; this pins that the guarantee holds for every mapped key). */
function resolveKey(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], dict);
}

describe('GPE R10 — the anchor-id contract (s7/03 §1.2)', () => {
  it('every one of the 37 voters links a CARD-LEVEL anchor (never a bare page)', () => {
    expect(GOLD_VOTER_IDS.length).toBe(37);
    for (const id of GOLD_VOTER_IDS) {
      const home = homePageOfIndicator(id);
      expect(home, `${id} has a home page`).not.toBeNull();
      const href = seatAnchorHref({ id: id as GoldVoterId, homePage: home });
      expect(href, `${id} links`).toBeTruthy();
      if (home === 'gold') {
        // The in-page form: the native browser hash scroll.
        expect(href).toBe(`#gold-card-${id}`);
      } else {
        const prefix = PREFIX[home as string];
        expect(prefix, `${home} has a verified card-anchor prefix`).toBeTruthy();
        expect(href).toBe(`${PAGE_ROUTE[home as string]}#${prefix}-${id}`);
      }
    }
  });

  it('an unplaced seat links nothing (fail-closed, never a dead anchor)', () => {
    expect(seatAnchorHref({ id: 'us10y' as GoldVoterId, homePage: null })).toBeNull();
  });

  it('the name-match rule: every destination-name key resolves in BOTH dictionaries', () => {
    const voters = [...GOLD_VOTER_IDS] as GoldVoterId[];
    expect(Object.keys(GOLD_SEAT_DEST_NAME_KEY).length).toBe(voters.length);
    for (const id of voters) {
      const key = GOLD_SEAT_DEST_NAME_KEY[id] as unknown as string;
      expect(key, `${id} carries a destination-name key`).toBeTruthy();
      const enValue = resolveKey(en, key);
      const faValue = resolveKey(fa, key);
      expect(typeof enValue, `${key} resolves in en`).toBe('string');
      expect(typeof faValue, `${key} resolves in fa`).toBe('string');
      expect((enValue as string).length).toBeGreaterThan(2);
      expect((faValue as string).length).toBeGreaterThan(2);
    }
  });

  it('the destination-name key matches the seat\'s home page (a usa seat names a usa card)', () => {
    for (const id of GOLD_VOTER_IDS) {
      const home = homePageOfIndicator(id);
      const key = GOLD_SEAT_DEST_NAME_KEY[id as GoldVoterId] as unknown as string;
      if (home === 'usa') expect(key).toContain('pd.usa.cardNames.');
      if (home === 'currencies') expect(key).toContain('pd.currencies.');
      if (home === 'europe') expect(key).toContain('pd.europe.cardNames.');
      if (home === 'world-markets') expect(key).toContain('pd.worldMarkets.cardNames.');
      if (home === 'gold') expect(key).toContain('pd.gold.cardNames.');
    }
  });
});
