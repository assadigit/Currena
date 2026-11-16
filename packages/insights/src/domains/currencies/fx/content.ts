/**
 * Write-only-if-changed (§5 rule 2) + the fetch job's validation helpers
 * (V2, V3, V5) — Phase 3 split of the former compute.ts monolith. The fx
 * twin of the markets content gate.
 */

import type { FxChg, FxSnapshot } from '@currena/core';
import { FX_MAX_DAY_MOVE_PCT, FX_PROVIDER_AGREEMENT_PCT } from './definitions';

export function fxContentHash(snapshot: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'>): string {
  const text = JSON.stringify({
    dollarMeasure: snapshot.dollarMeasure,
    pairs: snapshot.pairs,
    rules: snapshot.rules,
    summary: snapshot.summary,
  });
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 << 5) + h2 + c) >>> 0;
  }
  return `${h1.toString(16)}-${h2.toString(16)}`;
}

export function fxContentEqual(
  a: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'> | undefined,
  b: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'>,
): boolean {
  if (a === undefined) return false;
  return fxContentHash(a) === fxContentHash(b);
}

/** V3's trigger: a >5% one-day move in a pair's latest change. */
export function suspiciousDayMove(chg: FxChg): boolean {
  return Math.abs(chg.d1) >= FX_MAX_DAY_MOVE_PCT;
}

/** V5/V3's agreement band. */
export function ratesAgree(a: number, b: number): boolean {
  return Math.abs(((a - b) / b) * 100) <= FX_PROVIDER_AGREEMENT_PCT;
}
