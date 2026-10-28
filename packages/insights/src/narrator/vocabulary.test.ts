/**
 * vocabulary.test.ts — P3 gates (docs/insights/layer2/
 * INSIGHTS-L2-PREP-SPEC.md §5): the subset semantics, the en↔fa parity,
 * the connection filtering, the glossary subsetting, and the generated
 * snapshot's integrity.
 */

import { describe, expect, it } from 'vitest';
import {
  getNarratorSectionLabels,
  getNarratorUi,
  getNarratorVocabulary,
  VOCABULARY_IDS,
  VOCABULARY_SOURCE,
} from './vocabulary';
import raw from './vocabulary.generated.json';

const AU_STRESSED_DAY = ['au-10y', 'au-us-10y-gap', 'rba-expectations', 'us10y', 'vix'] as const;

describe('P3 getNarratorVocabulary — the subset contract', () => {
  it('returns ONLY the requested ids that have copy, and reports the rest as missing', () => {
    const vocab = getNarratorVocabulary([...AU_STRESSED_DAY, 'not-an-indicator'], 'en');
    expect(vocab.ids).toEqual([...AU_STRESSED_DAY]);
    expect(vocab.missing).toEqual(['not-an-indicator']);
    expect(Object.keys(vocab.entries)).toHaveLength(5);
  });

  it('carries exactly the compact narrator fields per entry', () => {
    const vocab = getNarratorVocabulary(['vix'], 'en');
    const entry = vocab.entries['vix']!;
    // vix is not one of the 32 australiaAngle entries (D-08) — six fields.
    expect(Object.keys(entry).sort()).toEqual([
      'connections',
      'glossaryTerms',
      'ifFalling',
      'ifRising',
      'oneLine',
      'plainName',
    ]);
    expect(entry.plainName.length).toBeGreaterThan(0);
    expect(entry.oneLine.length).toBeGreaterThan(0);
    expect(typeof entry.ifRising).toBe('string');
    // us10y IS one of the 9 AU-relevant globals — seven fields.
    const us10y = getNarratorVocabulary(['us10y'], 'en').entries['us10y']!;
    expect(Object.keys(us10y).sort()).toEqual([
      'australiaAngle',
      'connections',
      'glossaryTerms',
      'ifFalling',
      'ifRising',
      'oneLine',
      'plainName',
    ]);
    expect(us10y.australiaAngle).toBeDefined();
  });

  it('keeps ONLY the connections between the requested ids — dangling links are dropped', () => {
    // us10y's Layer-1 connections name several other ids; request just
    // us10y + us30y and every surviving link must target one of the two.
    const vocab = getNarratorVocabulary(['us10y', 'us30y'], 'en');
    for (const entry of Object.values(vocab.entries)) {
      for (const connection of entry.connections) {
        expect(['us10y', 'us30y']).toContain(connection.with);
      }
    }
    // and the full-catalogue request keeps every link (none dangle inside itself)
    const full = getNarratorVocabulary(VOCABULARY_IDS, 'en');
    let links = 0;
    for (const entry of Object.values(full.entries)) links += entry.connections.length;
    expect(links).toBeGreaterThan(100);
  });

  it('includes ONLY the glossary terms the included entries use', () => {
    const vocab = getNarratorVocabulary(['vix'], 'en');
    const usedByEntry = new Set(vocab.entries['vix']!.glossaryTerms);
    for (const term of Object.keys(vocab.glossary)) {
      expect(usedByEntry.has(term)).toBe(true);
    }
    expect(Object.keys(vocab.glossary).length).toBeLessThanOrEqual(usedByEntry.size);
  });

  it('the 7 FX pattern cards ride with null directions + skipReason (D-09)', () => {
    const vocab = getNarratorVocabulary(['r6_europe_worry'], 'en');
    const entry = vocab.entries['r6_europe_worry']!;
    expect(entry.ifRising).toBeNull();
    expect(entry.ifFalling).toBeNull();
    expect(entry.skipReason).toBeDefined();
  });

  it('deduplicates the requested ids (request order preserved)', () => {
    const vocab = getNarratorVocabulary(['vix', 'vix', 'us10y', 'vix'], 'en');
    expect(vocab.ids).toEqual(['vix', 'us10y']);
    expect(vocab.missing).toEqual([]);
  });
});

describe('P3 getNarratorVocabulary — both languages, one shape', () => {
  it('en and fa answer with identical id sets for the same request', () => {
    const en = getNarratorVocabulary([...AU_STRESSED_DAY, 'nope'], 'en');
    const fa = getNarratorVocabulary([...AU_STRESSED_DAY, 'nope'], 'fa');
    expect(fa.ids).toEqual(en.ids);
    expect(fa.missing).toEqual(en.missing);
    expect(Object.keys(fa.entries)).toEqual(Object.keys(en.entries));
    expect(Object.keys(fa.glossary)).toEqual(Object.keys(en.glossary));
  });

  it('fa text is Persian, en text is Latin — never swapped', () => {
    const en = getNarratorVocabulary(['vix'], 'en');
    const fa = getNarratorVocabulary(['vix'], 'fa');
    expect(fa.entries['vix']!.plainName).toMatch(/[\u0600-\u06FF]/);
    expect(en.entries['vix']!.plainName).not.toMatch(/[\u0600-\u06FF]/);
  });

  it('the full catalogue answers identically in both languages (129 ids)', () => {
    expect(VOCABULARY_IDS).toHaveLength(129);
    const en = getNarratorVocabulary(VOCABULARY_IDS, 'en');
    const fa = getNarratorVocabulary(VOCABULARY_IDS, 'fa');
    expect(en.ids).toEqual(fa.ids);
    expect(en.missing).toEqual([]);
    expect(fa.missing).toEqual([]);
  });

  it('the UI labels come back per language (the block labels incl. noDirection)', () => {
    const en = getNarratorUi('en');
    const fa = getNarratorUi('fa');
    expect(en.noDirection).toBeDefined();
    expect(fa.noDirection).toMatch(/[\u0600-\u06FF]/);
    expect(Object.keys(en).sort()).toEqual(Object.keys(fa).sort());
  });
});

describe('P3 — the generated snapshot integrity', () => {
  const payload = raw as {
    v: number;
    source: { indicatorCount: number; glossaryCount: number; enSha256: string; faSha256: string };
    en: { indicators: Record<string, unknown>; glossary: Record<string, unknown> };
    fa: { indicators: Record<string, unknown>; glossary: Record<string, unknown> };
  };

  it('counts match the Layer-1 record (129 indicators, 23 glossary terms)', () => {
    expect(payload.source.indicatorCount).toBe(129);
    expect(payload.source.glossaryCount).toBe(23);
    expect(Object.keys(payload.en.indicators)).toHaveLength(129);
    expect(Object.keys(payload.fa.indicators)).toHaveLength(129);
    expect(Object.keys(payload.en.glossary)).toHaveLength(23);
    expect(Object.keys(payload.fa.glossary)).toHaveLength(23);
  });

  it("records its source provenance (the dictionaries' sha256)", () => {
    expect(payload.source.enSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.source.faSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(VOCABULARY_SOURCE.indicatorCount).toBe(129);
  });
});

describe('M1 — the section-labels block (the narrator states\u2019 approved words)', () => {
  it('returns the four section labels per language (existing UI strings)', () => {
    const en = getNarratorSectionLabels('en');
    const fa = getNarratorSectionLabels('fa');
    expect(en.label).toEqual({
      global: 'Global',
      australia: 'Australia',
      'world-markets': 'The pulse of world markets',
      'world-currencies': 'World currencies',
    });
    expect(fa.label['world-markets']).toBe('نبض بازارهای جهان');
    expect(fa.label['world-currencies']).toBe('ارزهای مهم جهان');
  });

  it('returns the four verdict words + three signal words, matching the page\u2019s own', () => {
    const en = getNarratorSectionLabels('en');
    const fa = getNarratorSectionLabels('fa');
    expect(en.verdictWord).toEqual({ relaxed: 'Stable', cautious: 'Cautious', stressed: 'Stressed', alarmed: 'Critical' });
    expect(fa.verdictWord.stressed).toBe('پرتنش');
    expect(en.signalWord).toEqual({ normal: 'Normal', attention: 'Needs attention', unusual: 'Unusual' });
    expect(fa.signalWord.attention).toBe('نیازمند توجه');
  });

  it('the FA labels are Persian script with no ASCII digits and no em dash', () => {
    const fa = getNarratorSectionLabels('fa');
    const all = [
      ...Object.values(fa.label),
      ...Object.values(fa.verdictWord),
      ...Object.values(fa.signalWord),
      ...Object.values(fa.marketGroup),
      ...Object.values(fa.marketStatus),
    ];
    for (const s of all) {
      expect(s, s).toMatch(/[\u0600-\u06FF]/);
      expect(s, s).not.toMatch(/[0-9]/);
      expect(s, s).not.toMatch(/\u2014/);
    }
  });

  it('en\u2194fa key parity across every sub-block', () => {
    const en = getNarratorSectionLabels('en');
    const fa = getNarratorSectionLabels('fa');
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(Object.keys(en[key]).sort(), key).toEqual(Object.keys(fa[key]).sort());
    }
  });
});
