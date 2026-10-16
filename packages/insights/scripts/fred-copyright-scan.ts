/**
 * fred-copyright-scan.ts — T-16 (Step 3 P-5): for every FRED series the
 * Insights page uses, fetch the series' own page and record its copyright
 * status from FRED's machine-readable license tag
 * (https://fred.stlouisfed.org/legal/#copyright-<category>).
 *
 * The result is written to data/fred-copyright.json with the checked date
 * and the evidence quote; the T-16 check consumes it (fail-closed: a series
 * without a record cannot be public). Re-run whenever a series is added:
 *   corepack pnpm --filter @currena/insights exec tsx scripts/fred-copyright-scan.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const OUT = resolve(REPO, 'data', 'fred-copyright.json');

/**
 * The FRED series the registry uses — extracted from
 * data/indicators.json (provider 'fred') by hand at write time because the
 * registry's seriesIdOrTable strings carry descriptive suffixes; the list
 * below is exactly those ids (T10YIE is the validation-only breakeven the
 * ingest fetches for T-01). Adding a FRED series without adding it here
 * fails T-16.
 */
const SERIES = [
  'T10Y2Y',
  'DFII10',
  'DGS10',
  'DFEDTARL',
  'DFEDTARU',
  'DGS30',
  'DGS2',
  'CPIAUCSL',
  'CPIAUCNS',
  'CPILFESL',
  'CPILFENS',
  'T5YIFR',
  'T10YIE',
  'STLFSI4',
  'NFCI',
  'VIXCLS',
  'M2SL',
  'GACDFSA066MSFRBPHI',
  'UNRATE',
  'SAHMREALTIME',
  'DCOILBRENTEU',
  'T10Y3M',
] as const;

interface Record {
  seriesId: string;
  /** FRED's own license category (the #copyright-<category> slug). */
  license: string;
  /** true when the category is anything but public-domain. */
  copyrightNotice: boolean;
  checkedOn: string;
  evidence: string;
  url: string;
}

async function scanOne(seriesId: string): Promise<Record> {
  const url = `https://fred.stlouisfed.org/series/${seriesId}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    return {
      seriesId,
      license: 'unverified',
      copyrightNotice: true, // fail closed
      checkedOn: new Date().toISOString().slice(0, 10),
      evidence: `HTTP ${res.status} fetching the series page — treat as copyrighted until verified`,
      url,
    };
  }
  const html = await res.text();
  const m = html.match(/"license":\s*"(https:\/\/fred\.stlouisfed\.org\/legal\/#copyright-([a-z0-9-]+))"/);
  if (!m || !m[1] || !m[2]) {
    return {
      seriesId,
      license: 'unverified',
      copyrightNotice: true, // fail closed
      checkedOn: new Date().toISOString().slice(0, 10),
      evidence: 'no FRED license tag found on the page — treat as copyrighted until verified',
      url,
    };
  }
  const license = m[2];
  const notice = license !== 'public-domain';
  let evidence = `FRED license tag: #copyright-${license}`;
  if (notice) {
    const c = html.match(/Copyright[^<."]{0,140}/);
    if (c && c[0]) evidence += ` · page text: "${c[0].trim()}"`;
  }
  return { seriesId, license, copyrightNotice: notice, checkedOn: new Date().toISOString().slice(0, 10), evidence, url };
}

const records: Record[] = [];
for (const s of SERIES) {
  const r = await scanOne(s);
  records.push(r);
  console.log(`${s.padEnd(22)} ${r.license.padEnd(26)} ${r.copyrightNotice ? 'NOTICE' : 'public-domain'}`);
}

writeFileSync(OUT, JSON.stringify({ _comment: 'T-16 FRED copyright scan (scripts/fred-copyright-scan.ts). copyrightNotice=true → public_display_ok must be no. Re-run when a series is added.', scannedOn: records[0]?.checkedOn, records }, null, 2) + '\n', 'utf8');
console.log(`wrote ${records.length} records → data/fred-copyright.json`);
