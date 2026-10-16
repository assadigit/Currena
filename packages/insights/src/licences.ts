/**
 * licences.ts — the licence register (Step 3 §2.3 LR-01…LR-04, §8 licence
 * block). One entry per data SOURCE; every indicator inherits from its
 * provider via licenceForProvider(), with FRED series overridden per series
 * by the T-16 copyright scan (data/fred-copyright.json).
 *
 * Fail-closed discipline: publicDisplayOk 'unknown' is treated as 'no' by
 * the T-15 mode gate — an unverified source can never appear in public
 * mode. privateOk stays true (private-first design; the owner's own use).
 *
 * Every entry records HOW the terms were checked (termsEvidence) and WHEN
 * (termsCheckedOn). Anything that could not be quoted from the provider's
 * own material today is marked 'unknown', never guessed.
 */

export type PublicDisplayOk = 'yes' | 'no' | 'unknown';

export interface SourceLicence {
  provider: string;
  /** Display name (used on cards / About this data). */
  label: string;
  licenceName: string;
  /** The EXACT attribution text the source requires ('' when none). */
  attributionText: string;
  attributionRequired: boolean;
  privateOk: boolean;
  publicDisplayOk: PublicDisplayOk;
  termsCheckedOn: string;
  /** How the terms were checked (the evidence trail). */
  termsEvidence: string;
  termsUrl?: string;
}

export const TERMS_CHECKED_ON = '2026-10-16';

const ABS: SourceLicence = {
  provider: 'abs',
  label: 'Australian Bureau of Statistics',
  licenceName: 'CC BY 4.0',
  attributionText: 'Source: Australian Bureau of Statistics',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 spec §2.3 (owner research): CC BY 4.0, attribution kept; abs.gov.au copyright page carries a Creative Commons menu item (JS-heavy page, verbatim quote not captured — recorded, re-check at the quarterly licence review).',
  termsUrl: 'https://www.abs.gov.au/about/copyright-and-disclaimer',
};

const RBA: SourceLicence = {
  provider: 'rba',
  label: 'Reserve Bank of Australia',
  licenceName: 'CC BY 4.0 (RBA terms for statistical tables)',
  attributionText: 'Source: Reserve Bank of Australia',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 spec §2.3 (owner research): CC BY 4.0 for most material; commercial/personal use allowed if RBA endorsement is not implied. Third-party content INSIDE RBA tables needs that third party\u2019s consent — re-check each table\u2019s source notes at the quarterly review.',
  termsUrl: 'https://www.rba.gov.au/copyright/',
};

const FRED_BASE: SourceLicence = {
  provider: 'fred',
  label: 'FRED (Federal Reserve Bank of St. Louis)',
  licenceName: 'Varies by series (FRED license tags)',
  attributionText: 'Source: FRED, Federal Reserve Bank of St. Louis',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown', // decided per series by the T-16 scan
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'FRED carries a machine-readable license tag per series (fred.stlouisfed.org/legal/#copyright-<category>) — scanned 2026-10-16, records in data/fred-copyright.json; public-domain series may be public, citation-required series are private-only.',
  termsUrl: 'https://fred.stlouisfed.org/legal/',
};

const YAHOO: SourceLicence = {
  provider: 'yahoo',
  label: 'Yahoo Finance (unofficial endpoints)',
  licenceName: 'No reuse licence offered (unofficial endpoints)',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Yahoo offers no API terms for these unofficial quote endpoints; Step 3 §2.3 and defect E-01 classify them owner-only personal use. Never shown in public mode (T-15).',
  termsUrl: 'https://finance.yahoo.com/',
};

const GOLD_API: SourceLicence = {
  provider: 'gold-api',
  label: 'gold-api.com',
  licenceName: 'Free API — commercial use permitted (their ToS)',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'gold-api.com/terms read 2026-10-16: "Commercial use of the API is always permitted, including use in web applications…" (§9); no attribution clause found; service "as is", no accuracy warranty (§5–6); terms may change without notice (§11) — re-check at the quarterly review. (Closes defect E-02\u2019s "terms unconfirmed".)',
  termsUrl: 'https://gold-api.com/terms',
};

const WORLD_BANK: SourceLicence = {
  provider: 'world-bank',
  label: 'World Bank (Commodity Markets "Pink Sheet")',
  licenceName: 'Unknown (CC BY 4.0 expected, not quoted)',
  attributionText: 'Source: World Bank',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'World Bank Open Data terms are commonly CC BY 4.0, but the licence page could not be quoted verbatim on 2026-10-16 (JS-rendered) — marked unknown, fail closed in public mode until read in a browser.',
  termsUrl: 'https://www.worldbank.org/en/about/legal/terms-of-use',
};

const FRANKFURTER: SourceLicence = {
  provider: 'frankfurter',
  label: 'Frankfurter (ECB reference rates)',
  licenceName: 'ECB terms via the Frankfurter project (MIT code)',
  attributionText: 'Source: European Central Bank (reference rates via Frankfurter)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'frankfurter.dev/license links the ECB disclaimer for the DATA; the ECB\u2019s display terms could not be quoted verbatim on 2026-10-16 (JS-rendered pages) — unknown, fail closed in public mode until read in a browser. Attribution shown regardless.',
  termsUrl: 'https://frankfurter.dev/license/',
};

const ECB: SourceLicence = {
  provider: 'ecb',
  label: 'ECB Data Portal',
  licenceName: 'ECB Data Portal terms (not verbatim-verified)',
  attributionText: 'Source: European Central Bank',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'The ECB Data Portal terms page is JS-rendered; the reuse clause could not be quoted on 2026-10-16 — unknown, fail closed in public mode until read in a browser.',
  termsUrl: 'https://data.ecb.europa.eu/',
};

const MANUAL: SourceLicence = {
  provider: 'manual',
  label: 'Manual entries (China NBS and others)',
  licenceName: 'Publisher terms vary; entered by hand',
  attributionText: 'Source: National Bureau of Statistics of China',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Manual entries carry no provider feed; defect E-08 requires entered_on/expiry bookkeeping. Public display blocked until each publisher\u2019s reuse terms are read and recorded.',
};

const EODHD: SourceLicence = {
  provider: 'eodhd',
  label: 'EODHD (world stock markets)',
  licenceName: 'Personal plan — owner only',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 §2.3: personal plan covers owner-only dashboards; serving to others is redistribution. Never shown in public mode unless a display licence is bought.',
  termsUrl: 'https://eodhd.com/',
};

const BITSTAMP: SourceLicence = {
  provider: 'bitstamp',
  label: 'Bitstamp (BTC history gap-fill)',
  licenceName: 'Public API; display terms not verbatim-verified',
  attributionText: 'Source: Bitstamp',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Public BTC/USD history endpoint; the site terms could not be quoted verbatim on 2026-10-16 — unknown, fail closed in public mode.',
  termsUrl: 'https://www.bitstamp.net/',
};

const ALTERNATIVE_ME: SourceLicence = {
  provider: 'alternative-me',
  label: 'Alternative.me (Crypto Fear and Greed)',
  licenceName: 'Free API — attribution next to the data',
  attributionText: 'Source: Alternative.me Crypto Fear and Greed Index',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'alternative.me states the index may be displayed freely when "attribution is given right next to the display of the data" (read 2026-10-16). Attribution renders beside the card.',
  termsUrl: 'https://alternative.me/crypto/fear-and-greed-index/',
};

const SHILLER: SourceLicence = {
  provider: 'shiller',
  label: 'Robert Shiller (Yale) dataset',
  licenceName: 'Open academic data — attribution; no formal reuse terms',
  attributionText: 'Source: Robert Shiller, Irrational Exuberance data (econ.yale.edu/~shiller)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 §2.3: open academic data, no formal commercial terms found — private mode only, archive every download (L1-14).',
  termsUrl: 'http://www.econ.yale.edu/~shiller/data.htm',
};

const DERIVED: SourceLicence = {
  provider: 'derived',
  label: 'Currena engine (plain arithmetic from the sources above)',
  licenceName: 'Own computation — inherits the upstream sources\u2019 terms',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'unknown', // decided by the worst upstream leg
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Derived indicators (ratios, gaps, baskets, conversions) compute from the registered sources; their public-mode eligibility is the WORST of the legs (T-15 walks the inputs).',
};

/** The register. Unknown providers resolve to the fail-closed entry. */
export const SOURCE_LICENCES: Record<string, SourceLicence> = {
  fred: FRED_BASE,
  abs: ABS,
  rba: RBA,
  yahoo: YAHOO,
  'gold-api': GOLD_API,
  'world-bank': WORLD_BANK,
  frankfurter: FRANKFURTER,
  ecb: ECB,
  manual: MANUAL,
  eodhd: EODHD,
  bitstamp: BITSTAMP,
  'alternative-me': ALTERNATIVE_ME,
  shiller: SHILLER,
  derived: DERIVED,
};

export function licenceForProvider(provider: string): SourceLicence {
  const found = SOURCE_LICENCES[provider];
  if (found) return found;
  return {
    provider,
    label: provider,
    licenceName: 'Unverified',
    attributionText: '',
    attributionRequired: false,
    privateOk: true,
    publicDisplayOk: 'no', // fail closed
    termsCheckedOn: TERMS_CHECKED_ON,
    termsEvidence: 'No register entry — fail closed (T-15 blocks public display) until the terms are read and recorded.',
  };
}

/* ------------------------------------------------------------------ */
/* FRED per-series resolution (T-16)                                   */
/* ------------------------------------------------------------------ */

export interface FredCopyrightRecord {
  seriesId: string;
  license: string;
  copyrightNotice: boolean;
  checkedOn: string;
  evidence: string;
  url: string;
}

/**
 * The FRED licence for ONE series, per the copyright scan. Citation-
 * required series carry the FRED citation line; public-domain series are
 * public-eligible. Unscanned series fail closed (public 'no').
 */
export function fredLicenceForSeries(
  seriesId: string,
  records: readonly FredCopyrightRecord[],
): { licence: SourceLicence; seriesId: string } {
  const rec = records.find((r) => r.seriesId === seriesId);
  if (!rec) {
    return {
      seriesId,
      licence: {
        ...FRED_BASE,
        licenceName: 'FRED series — copyright not scanned (fail closed)',
        publicDisplayOk: 'no',
        termsEvidence: `No T-16 scan record for ${seriesId} — fail closed. Run scripts/fred-copyright-scan.ts.`,
      },
    };
  }
  return {
    seriesId,
    licence: {
      ...FRED_BASE,
      licenceName: rec.copyrightNotice
        ? `FRED license #copyright-${rec.license} (citation required)`
        : `FRED license #copyright-${rec.license} (public domain)`,
      publicDisplayOk: rec.copyrightNotice ? 'no' : 'yes',
      termsEvidence: `${rec.evidence} (checked ${rec.checkedOn})`,
    },
  };
}

/** Attribution lines for "About this data" (LR-04) — one per source used. */
export function attributionsForProviders(providers: readonly string[]): { provider: string; text: string; licenceName: string; publicDisplayOk: PublicDisplayOk; termsCheckedOn: string; evidence: string }[] {
  return providers.map((p) => {
    const l = licenceForProvider(p);
    return {
      provider: p,
      text: l.attributionText || l.label,
      licenceName: l.licenceName,
      publicDisplayOk: l.publicDisplayOk,
      termsCheckedOn: l.termsCheckedOn,
      evidence: l.termsEvidence,
    };
  });
}
