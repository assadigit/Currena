/**
 * wordlists.test.ts — M1 gates: the canon invariants of the shared word
 * lists (the Layer-1 canon moved from layer1.test.ts + the narrator's own
 * seed lists). The Layer-1 gate itself (7,809 assertions) consumes the
 * canon through @currena/insights/narrator — these tests pin the invariants
 * the narrator additionally relies on.
 */

import { describe, expect, it } from 'vitest';
import {
  ALARM_EN,
  ALARM_FA,
  ALL_CLEAR_EN,
  ALL_CLEAR_FA,
  ATTRIBUTION_EN,
  ATTRIBUTION_FA,
  BANNED_EN,
  BANNED_FA,
  JARGON,
  OUT_OF_DATE_EN,
  OUT_OF_DATE_FA,
  PREDICTION_EN,
  PREDICTION_FA,
  bannedHits,
  normalizeDigits,
  phraseHits,
  residualDigits,
  sentences,
  toPersianDigits,
  wordCount,
} from './wordlists';

describe('M1 wordlists — the Layer-1 canon invariants', () => {
  it('the jargon list carries both languages + a termId per entry', () => {
    expect(JARGON.length).toBeGreaterThanOrEqual(50);
    for (const j of JARGON) {
      expect(j.en.length, JSON.stringify(j)).toBeGreaterThan(0);
      expect(j.fa.length, JSON.stringify(j)).toBeGreaterThan(0);
      expect(j.termId === null || typeof j.termId === 'string').toBe(true);
    }
  });

  it('both banned lists are non-empty and carry no empty phrase', () => {
    expect(BANNED_EN.length).toBeGreaterThanOrEqual(16);
    expect(BANNED_FA.length).toBeGreaterThanOrEqual(9);
    for (const w of [...BANNED_EN, ...BANNED_FA]) expect(w.length).toBeGreaterThan(1);
  });

  it('bannedHits matches the language\u2019s own list (EN word-boundary, FA substring)', () => {
    expect(bannedHits('You should act now.', 'en')).toEqual(['should']);
    expect(bannedHits('این متن بدون مشکل است.', 'en')).toEqual([]);
    expect(bannedHits('حتماً این کار را بکنید.', 'fa')).toEqual(['حتماً']);
    expect(bannedHits('This is fine.', 'fa')).toEqual([]);
  });

  it('residualDigits keeps tenor tokens and flags the rest', () => {
    expect(residualDigits('The 10-year cost rose.')).toEqual([]);
    expect(residualDigits('The cost rose 5 points.')).toEqual(['5']);
    expect(residualDigits('هزینهٔ ۱۰ ساله بالا رفت.')).toEqual([]);
    expect(residualDigits('۵ شاخص هشدار دارد.')).toEqual(['۵']);
  });
});

describe('M1 wordlists — the narrator seed lists', () => {
  it('every seed list is non-empty in both languages', () => {
    for (const list of [PREDICTION_EN, PREDICTION_FA, ALARM_EN, ALARM_FA, ALL_CLEAR_EN, ALL_CLEAR_FA, ATTRIBUTION_EN, ATTRIBUTION_FA, OUT_OF_DATE_EN, OUT_OF_DATE_FA]) {
      expect(list.length, 'a seed list is empty').toBeGreaterThan(0);
      for (const p of list) expect(p.trim().length, 'an empty seed phrase').toBeGreaterThan(0);
    }
  });

  it('phraseHits matches per language (EN word-boundary, FA substring)', () => {
    expect(phraseHits('Everything is completely calm today.', ALL_CLEAR_EN, 'en')).toEqual(['completely calm']);
    expect(phraseHits('بازار در وحشت است.', ALARM_FA, 'fa')).toEqual(['وحشت']);
    expect(phraseHits('Nothing to see here.', ALARM_EN, 'en')).toEqual([]);
  });

  it('the FA seed phrases are Persian script with no ASCII digits, no Arabic ي/ك, no em dash', () => {
    for (const p of [...PREDICTION_FA, ...ALARM_FA, ...ALL_CLEAR_FA, ...ATTRIBUTION_FA, ...OUT_OF_DATE_FA, ...BANNED_FA]) {
      expect(p, p).toMatch(/[\u0600-\u06FF]/);
      expect(p, p).not.toMatch(/[0-9]/);
      expect(p, p).not.toMatch(/\u064A/);
      expect(p, p).not.toMatch(/\u0643/);
      expect(p, p).not.toMatch(/\u2014/);
    }
  });
});

describe('M1 wordlists — digit normalisation', () => {
  it('normalizeDigits maps Persian + Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('۹ شاخص')).toBe('9 شاخص');
    expect(normalizeDigits('٥ و ١٢')).toBe('5 و 12');
    expect(normalizeDigits('abc 123')).toBe('abc 123');
  });

  it('toPersianDigits is the exact inverse for plain integers', () => {
    expect(toPersianDigits('9 of 32')).toBe('۹ of ۳۲');
    expect(normalizeDigits(toPersianDigits('123'))).toBe('123');
  });

  it('sentence + word helpers split on the EN and FA terminators', () => {
    expect(sentences('One. Two! Three?')).toHaveLength(3);
    expect(sentences('یک جمله. جملهٔ دوم؟ سوم ۔')).toHaveLength(3);
    expect(wordCount('  چند   کلمه  ')).toBe(2);
  });
});
