/**
 * about-sources.test.ts — v3 UI_SPEC §10 UI-49 (2026-10-20, PH6-C): pins
 * for the About per-source table's pure builder (about-sources.ts) and the
 * provider mirror it renders.
 *
 *   1. The grouping: the REAL audit sidecar (data/indicator-audit.json —
 *      the same file full-export.ts imports) collapses into one row per
 *      provider, with the honest worst level, deduped licence names and
 *      the kill-switch aggregate (all on / all off / n of m off).
 *   2. Unknown providers fail visible, never invented: the raw token shows
 *      with no link and no attribution.
 *   3. THE MIRROR: ABOUT_PROVIDER_META quotes the risk register
 *      (packages/insights/src/sources.ts SOURCE_RISK_REGISTER), which the
 *      web package cannot import (its quoted terms corpus is not for the
 *      bundle). This test re-reads that file as TEXT and fails the moment
 *      the register and the mirror drift — the register stays the source
 *      of truth.
 *   4. Copy parity: every new interpolated string carries the same tokens
 *      in both locales (the fa dictionary satisfies InsightsCopy at
 *      compile time; these guard the runtime token sets the compiler
 *      cannot see).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { IndicatorId } from '@currena/core';
import { ABOUT_PROVIDER_META, aboutEnabledState, aboutSidecarEntriesOf, aboutSourceRows, type AboutSourceSidecarEntry } from './about-sources';
import { definitionFor } from './config';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import auditJson from '../../../../../data/indicator-audit.json';

/** The real sidecar's per-indicator entries (the About table's row source). */
const SIDECAR = (auditJson as unknown as { indicators: AboutSourceSidecarEntry[] }).indicators;

// The SAME join the component runs: the provider token each indicator's
// definition declares (packages/insights DEFINITIONS via definitionFor). A
// sidecar id without a definition throws here — fail loud, never invent.
const rows = aboutSourceRows(SIDECAR, (id) => definitionFor(id as IndicatorId).source);

describe('aboutSourceRows — one row per provider from the real sidecar', () => {
  it('every sidecar entry lands in exactly one provider row', () => {
    const total = rows.reduce((sum, r) => sum + r.seriesCount, 0);
    expect(total).toBe(SIDECAR.length);
  });

  it('groups one row per provider, name-sorted', () => {
    const providers = rows.map((r) => r.provider).sort();
    expect(new Set(providers).size).toBe(providers.length);
    const names = rows.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('fred: 40 series, worst level L2 across its L0/L2 mix, deduped licences (2026-10-25 M6: +8 Wave-3 series, -boe-rate to the BoE row; the 2026-10-26 gap-audit build adds T10Y3M, A-1)', () => {
    const fred = rows.find((r) => r.provider === 'fred');
    expect(fred).toBeDefined();
    expect(fred!.seriesCount).toBe(39); // A-2 moves jgb-10y to the mof row
    expect(fred!.levels).toEqual(['L0', 'L2']);
    expect(fred!.worstLevel).toBe('L2');
    // 3 distinct licence names across the 16 series (public-domain,
    // citation-required, varies-by-series) — deduped, order of appearance.
    // 2026-10-21c: the citation-required class is display-permitted with
    // "publisher via FRED" attribution (FRED legal read 2026-10-21).
    expect(fred!.licences.length).toBe(3);
    expect(fred!.licences).toContain('FRED license #copyright-public-domain (public domain)');
    expect(fred!.licences).toContain(
      'FRED license #copyright-citation-required (citation required — display permitted with "Source: publisher via FRED" attribution)',
    );
    expect(aboutEnabledState(fred!)).toBe('on');
  });

  it('rba: the whole provider sits at L0 and is on', () => {
    const rba = rows.find((r) => r.provider === 'rba');
    expect(rba!.levels).toEqual(['L0']);
    expect(rba!.worstLevel).toBe('L0');
    expect(aboutEnabledState(rba!)).toBe('on');
  });

  it('shiller: enabled since the owner\u2019s D-42/OD-1 flip (2026-10-23) — both series on', () => {
    const shiller = rows.find((r) => r.provider === 'shiller');
    expect(shiller!.seriesCount).toBe(2);
    expect(shiller!.enabledCount).toBe(2);
    expect(aboutEnabledState(shiller!)).toBe('on');
  });

  it('derived: fully enabled since the 2026-10-21 round un-disabled the crosses (silver-btc retired 2026-10-23, OD-7)', () => {
    const derived = rows.find((r) => r.provider === 'derived');
    expect(derived!.seriesCount).toBe(16); // A-5 adds rba-fed-gap (A-4's gold-oil-ratio is derived too → 14) + the Session-3 breakeven-tilt (G2, 2026-10-31) → 16
    expect(derived!.enabledCount).toBe(16); // the Session-3 tilt card is enabled (both legs' T-16 records + the recorded acceptance)
    expect(aboutEnabledState(derived!)).toBe('on');
    // Own-computation series inherit the upstream terms — the blanket
    // sidecar string (audjpy's) is one of the row's licences (sources.ts
    // riskRowForLeg mirrors the same inheritance).
    const blanket = SIDECAR.find((e) => e.id === 'audjpy')!.licenceName;
    expect(derived!.licences).toContain(blanket);
  });
});

describe('aboutSourceRows — fail-visible fallbacks', () => {
  it('a provider without a mirror row renders the raw token, no link, no invented attribution', () => {
    const [row] = aboutSourceRows(
      [{ id: 'x', licenceName: 'Some licence', level: 'L1', enabled: true }],
      () => 'mystery-provider',
    );
    expect(row!.name).toBe('mystery-provider');
    expect(row!.url).toBeNull();
    expect(row!.attribution).toBe('');
    expect(row!.worstLevel).toBe('L1');
  });

  it('an empty sidecar renders no rows', () => {
    expect(aboutSourceRows([], () => 'fred')).toEqual([]);
  });
});

describe('aboutSidecarEntriesOf — the lazy sidecar parse, fail-visible', () => {
  it('parses every real sidecar entry (54 facts, none skipped)', () => {
    expect(aboutSidecarEntriesOf(auditJson)).toHaveLength(SIDECAR.length);
  });

  it('skips malformed entries and non-array payloads, never guesses', () => {
    const keep = { id: 'us10y', licenceName: 'FRED license', level: 'L2', enabled: true };
    const parsed = aboutSidecarEntriesOf({
      indicators: [
        keep,
        { id: 'x', licenceName: 'no level', enabled: true }, // missing level
        { id: 'y', licenceName: 'L', level: 'L9', enabled: true }, // unknown level
        { id: 'z', licenceName: 'L', level: 'L1', enabled: 'yes' }, // non-boolean enabled
        { licenceName: 'L', level: 'L1', enabled: true }, // missing id
        'not-an-object',
      ],
    });
    expect(parsed).toEqual([keep]);
    expect(aboutSidecarEntriesOf(null)).toEqual([]);
    expect(aboutSidecarEntriesOf({ indicators: 'nope' })).toEqual([]);
  });
});

describe('ABOUT_PROVIDER_META — the risk-register mirror', () => {
  // sources.ts is not exported to the web package (its quoted terms corpus
  // stays out of the bundle); the mirror must track it. Read the file as
  // TEXT from the repo and assert every mirrored string still appears.
  const registerSrc = readFileSync(
    new URL('../../../../../packages/insights/src/sources.ts', import.meta.url),
    'utf8',
  );

  it("mirrors every register row's attribution and terms URL verbatim", () => {
    const pinned: readonly [provider: string][] = [
      ['rba'],
      ['abs'],
      ['ecb'],
      ['frankfurter'],
      ['world-bank'],
      ['gold-api'],
      ['alternative-me'],
      ['nbs'],
      ['shiller'],
    ];
    for (const [provider] of pinned) {
      const meta = ABOUT_PROVIDER_META[provider]!;
      expect(registerSrc, `${provider} attribution drifted from the register`).toContain(
        `attribution: '${meta.attribution}'`,
      );
      expect(registerSrc, `${provider} terms URL drifted from the register`).toContain(
        `termsUrl: '${meta.url}'`,
      );
    }
  });

  it("fred joins its two register rows' attribution fragments and shared terms URL", () => {
    const meta = ABOUT_PROVIDER_META.fred!;
    expect(meta.attribution).toContain('Source: FRED, Federal Reserve Bank of St. Louis');
    expect(meta.attribution).toContain('© Cboe, via FRED (for VIX)');
    expect(registerSrc).toContain(`attribution: 'Source: FRED, Federal Reserve Bank of St. Louis'`);
    expect(registerSrc).toContain('© Cboe, via FRED (for VIX)');
    expect(registerSrc).toContain(`termsUrl: '${meta.url}'`);
  });

  it('derived has no register row and invents no terms URL', () => {
    const meta = ABOUT_PROVIDER_META.derived!;
    expect(meta.url).toBeNull();
    expect(registerSrc).not.toContain("provider: 'derived'");
  });
});

describe('About rework copy parity (en/fa)', () => {
  const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]! as string).sort();

  it('the interpolated About strings carry the same tokens in both locales', () => {
    for (const key of [
      'aboutLevelMixed',
      'aboutSourcePartly',
      'aboutSeriesCount',
      'aboutRuleVersionLine',
      'aboutContactLine',
    ] as const) {
      expect(tokens(insightsCopyFa.ui[key]), `ui.${key}`).toEqual(tokens(insightsCopyEn.ui[key]));
    }
  });

  it('the rule-version line points at the repository file, never an invented hosted URL', () => {
    expect(insightsCopyEn.ui.aboutRuleVersionLine).toContain('{path}');
    expect(insightsCopyEn.ui.aboutRuleVersionLine).toContain('Rule version {v}');
    expect(insightsCopyFa.ui.aboutRuleVersionLine).toContain('{path}');
    expect(insightsCopyFa.ui.aboutRuleVersionLine).not.toMatch(/https?:\/\//);
  });

  it('the contact line carries exactly one URL placeholder in both locales', () => {
    expect(tokens(insightsCopyEn.ui.aboutContactLine)).toEqual(['url']);
    expect(tokens(insightsCopyFa.ui.aboutContactLine)).toEqual(['url']);
    expect(insightsCopyFa.ui.aboutContactLine).not.toMatch(/https?:\/\//); // the URL stays Latin, injected at render
  });

  it('the table column words and the level ladder exist in both locales', () => {
    for (const key of [
      'aboutColSource',
      'aboutColAttribution',
      'aboutColLicence',
      'aboutColLevel',
      'aboutColEnabled',
      'aboutLevelL0',
      'aboutLevelL1',
      'aboutLevelL2',
      'aboutLevelL3',
      'aboutSourceOn',
      'aboutSourceOff',
      'aboutKillSwitchNote',
      'statusUnavailableCards',
    ] as const) {
      expect(insightsCopyEn.ui[key].length, `ui.${key} (en)`).toBeGreaterThan(0);
      expect(insightsCopyFa.ui[key].length, `ui.${key} (fa)`).toBeGreaterThan(0);
    }
  });

  it('the fa level ladder uses no em dashes (localization convention)', () => {
    for (const key of ['aboutLevelL0', 'aboutLevelL1', 'aboutLevelL2', 'aboutLevelL3'] as const) {
      expect(insightsCopyFa.ui[key]).not.toContain('—');
    }
  });
});
