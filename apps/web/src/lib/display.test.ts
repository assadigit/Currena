/**
 * display unit tests + the currencies meta-schema parity test
 * (BACKLOG #29 remainder). House pattern: pure module imports, no React
 * rendering (useCodeLabel is a thin hook wrapper over codeLabel).
 *
 * Parity: the web-side display metadata (the i18n `currencies` blocks in
 * en + fa) must cover EXACTLY the currencies @currena/core knows — no
 * missing code (a select option rendering an i18n miss), no orphan (dead
 * dictionary key). Display NAMES are intentionally not compared: the
 * dictionaries carry legacy-UI names (en IRR: "Iranian Toman") while core
 * keeps the international common name ("Iranian Rial") — that split is
 * the documented Gate 1 decision.
 */

import { describe, expect, it } from 'vitest';
import { CURRENCIES } from '@currena/core';
import { codeLabel } from './display';
import { en } from '../i18n/en';
import { fa } from '../i18n/fa';

describe('codeLabel — the IRR (Toman) owner rule', () => {
  it('renders every non-IRR code as-is', () => {
    expect(codeLabel('USD', 'IRR (Toman)')).toBe('USD');
    expect(codeLabel('EUR', 'IRR (تومان)')).toBe('EUR');
    expect(codeLabel('AED', 'x')).toBe('AED');
  });

  it('renders IRR through the localized label (machine data stays raw)', () => {
    expect(codeLabel('IRR', 'IRR (Toman)')).toBe('IRR (Toman)');
    expect(codeLabel('IRR', 'IRR (تومان)')).toBe('IRR (تومان)');
  });
});

describe('currencies metadata parity — web display ↔ @currena/core', () => {
  /** Dictionary currency keys minus the irrLabel display helper. */
  const displayCodes = (dict: typeof en | typeof fa): string[] =>
    Object.keys(dict.currencies)
      .filter((key) => key !== 'irrLabel')
      .sort();

  const coreCodes = (): string[] => CURRENCIES.map((c) => c.code).sort();

  it('the en dictionary covers exactly the currencies core knows (no orphans)', () => {
    expect(displayCodes(en)).toEqual(coreCodes());
  });

  it('the fa dictionary covers exactly the currencies core knows (no orphans)', () => {
    expect(displayCodes(fa)).toEqual(coreCodes());
  });

  it('every display name is a non-empty string in both locales', () => {
    for (const { code } of CURRENCIES) {
      expect((en.currencies as Record<string, string>)[code]?.length ?? 0).toBeGreaterThan(0);
      expect((fa.currencies as Record<string, string>)[code]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('the IRR label in both locales (fa order polished in round 2)', () => {
    expect(en.currencies.irrLabel).toBe('IRR (Toman)');
    expect(fa.currencies.irrLabel).toBe('تومان (IRR)');
  });
});
