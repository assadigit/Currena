/**
 * gold-content.test.ts — the content module's own pins (S5 M1).
 *
 * The module is a byte-faithful transcription of 09 (Session 3's authored
 * records); these tests pin the STRUCTURE that transcription must keep:
 *
 *   1. the brief maps carry exactly the 37 voter ids, en ↔ fa identical
 *      key sets (the audit's parity check re-enforces it on the
 *      flattened dictionaries).
 *   2. the deep maps carry exactly the 52 record ids, en ↔ fa identical
 *      key sets — and the per-kind field shapes (voters fire; context
 *      never votes; blocked carries the disclosure quartet).
 *   3. the analogy rides EXACTLY the nine records 09 authored one for
 *      (owner decision 19 — selective, never forced), in both locales.
 *   4. no empty strings anywhere (every field of every record, every
 *      relations id).
 *   5. every voter id in the module IS an engine voter — the module may
 *      not invent or rename a seat (financial-model protection §9.3).
 *   6. the four blocked records are present with their blocked fields.
 *   7. the accessor: goldBrief selects the locale; loadGoldDeep loads
 *      the selected map through the dynamic-import branches.
 *   8. the duplicated surfaces stay in sync: the brief's plainLabel +
 *      defaultCopy equal the deep tier's (the eager/lazy split must
 *      never fork the copy), and the locale-neutral measurement values
 *      (unit · referencePeriod · firingRule · source · relations, plus
 *      the blocked quartet's EN-sourced passages) are identical between
 *      the en and fa deep files.
 */

import { describe, expect, it } from 'vitest';
import { briefEn } from './gold-content-brief-en';
import { briefFa } from './gold-content-brief-fa';
import { deepEn } from './gold-content-deep-en';
import { deepFa } from './gold-content-deep-fa';
import {
  GOLD_BLOCKED_RECORD_IDS,
  GOLD_CONTEXT_RECORD_IDS,
  GOLD_RECORD_IDS,
  GOLD_VOTER_IDS,
  goldBrief,
  loadGoldDeep,
} from './gold-content';
import type { GoldDeepRecord } from './gold-content-core';
import { GOLD_LANE_VOTERS } from '@currena/insights';

const ANALOGY_IDS = [
  'real-yield-10y',
  'usdjpy',
  'stress-stlfsi',
  'vix',
  'gold-silver',
  'sp500-breadth-ratio',
  'breakeven-5y5y',
  'm2-us',
  'cftc-gold-positioning',
] as const;

const sorted = (xs: readonly string[]) => [...xs].sort().join(',');

/** Walk every string field of one record (relations ids included). */
function collectStrings(record: GoldDeepRecord): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(record)) {
    if (k === 'relations') {
      for (const r of v as string[]) out.push(r);
    } else if (typeof v === 'string') {
      out.push(v);
    }
  }
  return out;
}

describe('the gold content module (S5 M1 — 09’s transcription)', () => {
  it('the brief maps carry exactly the 37 voter ids, en ↔ fa identical key sets', () => {
    expect(Object.keys(briefEn)).toHaveLength(37);
    expect(Object.keys(briefFa)).toHaveLength(37);
    expect(sorted(Object.keys(briefEn))).toBe(sorted(GOLD_VOTER_IDS));
    expect(sorted(Object.keys(briefFa))).toBe(sorted(Object.keys(briefEn)));
  });

  it('the deep maps carry exactly the 52 record ids, en ↔ fa identical key sets', () => {
    expect(Object.keys(deepEn)).toHaveLength(52);
    expect(Object.keys(deepFa)).toHaveLength(52);
    expect(sorted(Object.keys(deepEn))).toBe(sorted(GOLD_RECORD_IDS));
    expect(sorted(Object.keys(deepFa))).toBe(sorted(Object.keys(deepEn)));
  });

  it('the per-kind shapes hold: voters fire, context never votes, blocked carries the disclosure quartet', () => {
    for (const id of GOLD_VOTER_IDS) {
      const r = deepEn[id] as Extract<GoldDeepRecord, { firingRule: string }>;
      expect(r.firingRule, `${id} firingRule`).toBeTruthy();
      expect((r as { blockedReason?: string }).blockedReason).toBeUndefined();
    }
    for (const id of GOLD_CONTEXT_RECORD_IDS) {
      const r = deepEn[id] as unknown as Record<string, unknown>;
      expect(r.firingRule, `${id} must not carry a firing rule`).toBeUndefined();
      expect(r.blockedReason).toBeUndefined();
    }
    for (const id of GOLD_BLOCKED_RECORD_IDS) {
      const r = deepEn[id] as unknown as Record<string, string>;
      expect(r.whatItWouldShow, `${id} whatItWouldShow`).toBeTruthy();
      expect(r.whyItMatters, `${id} whyItMatters`).toBeTruthy();
      expect(r.blockedReason, `${id} blockedReason`).toBeTruthy();
      expect(r.ownerLever, `${id} ownerLever`).toBeTruthy();
      expect(r.firingRule).toBeUndefined();
    }
  });

  it('the analogy rides exactly the nine records 09 authored one for, both locales', () => {
    for (const map of [deepEn, deepFa]) {
      const withAnalogy = Object.entries(map).filter(([, r]) => 'analogy' in r && r.analogy).map(([id]) => id);
      expect(sorted(withAnalogy)).toBe(sorted(ANALOGY_IDS));
    }
  });

  it('no empty strings anywhere (every field of every record, both locales, both tiers)', () => {
    for (const [id, r] of Object.entries(deepEn)) {
      for (const s of collectStrings(r)) expect(s, `deepEn ${id} empty field`).not.toBe('');
      const b = briefEn[id as keyof typeof briefEn];
      if (b) {
        expect(b.plainLabel, `briefEn ${id} plainLabel`).not.toBe('');
        expect(b.defaultCopy, `briefEn ${id} defaultCopy`).not.toBe('');
      }
    }
    for (const [id, r] of Object.entries(deepFa)) {
      for (const s of collectStrings(r)) expect(s, `deepFa ${id} empty field`).not.toBe('');
      const b = briefFa[id as keyof typeof briefFa];
      if (b) {
        expect(b.plainLabel, `briefFa ${id} plainLabel`).not.toBe('');
        expect(b.defaultCopy, `briefFa ${id} defaultCopy`).not.toBe('');
      }
    }
  });

  it('every voter id in the module is an engine voter (GOLD_LANE_VOTERS — never invented, never renamed)', () => {
    const engineIds = GOLD_LANE_VOTERS.map((v) => v.id as string);
    expect(engineIds).toHaveLength(37);
    expect(sorted(GOLD_VOTER_IDS)).toBe(sorted(engineIds));
  });

  it('the four blocked ids are present in the module', () => {
    for (const id of GOLD_BLOCKED_RECORD_IDS) {
      expect(deepEn[id]).toBeTruthy();
      expect(deepFa[id]).toBeTruthy();
    }
  });

  it('the accessor: goldBrief selects the locale; loadGoldDeep loads the selected map', async () => {
    expect(goldBrief('en')).toBe(briefEn);
    expect(goldBrief('fa')).toBe(briefFa);
    expect(await loadGoldDeep('en')).toBe(deepEn);
    expect(await loadGoldDeep('fa')).toBe(deepFa);
  });

  it('the eager/lazy duplication never forks: brief equals deep on plainLabel + defaultCopy; the locale-neutral measurement values are identical en ↔ fa', () => {
    for (const id of GOLD_VOTER_IDS) {
      expect(briefEn[id].plainLabel, `${id} plainLabel en brief↔deep`).toBe(
        (deepEn[id] as { plainLabel: string }).plainLabel,
      );
      expect(briefEn[id].defaultCopy, `${id} defaultCopy en brief↔deep`).toBe(
        (deepEn[id] as { defaultCopy: string }).defaultCopy,
      );
      expect(briefFa[id].plainLabel, `${id} plainLabel fa brief↔deep`).toBe(
        (deepFa[id] as { plainLabel: string }).plainLabel,
      );
      expect(briefFa[id].defaultCopy, `${id} defaultCopy fa brief↔deep`).toBe(
        (deepFa[id] as { defaultCopy: string }).defaultCopy,
      );
    }
    for (const id of GOLD_RECORD_IDS) {
      const en = deepEn[id] as unknown as Record<string, unknown>;
      const fa = deepFa[id] as unknown as Record<string, unknown>;
      for (const field of ['unit', 'referencePeriod', 'source', 'firingRule', 'whatItWouldShow', 'blockedReason', 'ownerLever']) {
        expect(fa[field], `${id}.${field} locale-neutral sync`).toBe(en[field]);
      }
      expect(fa.relations, `${id} relations sync`).toEqual(en.relations);
    }
  });
});
