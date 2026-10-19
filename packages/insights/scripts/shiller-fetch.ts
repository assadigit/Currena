/**
 * shiller-fetch.ts — the FS-06 method card (SCRAPING_SPEC §8): the monthly
 * Robert Shiller `ie_data.xls` download, converted to a small JSON the
 * engine reads. RUNS IN A SCHEDULED GITHUB ACTION (the repo's documented
 * runtime for this source), never in the Worker.
 *
 * Method (M2 — a documented bulk file the provider publishes for reuse):
 *  1. ONE honest request to the provider's own home page (shillerdata.com)
 *     to discover the CURRENT `ie_data.xls` link (fixed selector — the CDN
 *     blob URL rotates); the recorded Yale mirror is the fallback (verified
 *     HTTP 200 + ETag on 2026-10-20, but stale — last modified Oct 2023).
 *  2. ONE honest request to the discovered file URL.
 *  3. Parse (SheetJS, scripts-only devDependency — never shipped), with the
 *     F-13 schema assertions over the file's OWN header row.
 *  4. Write data/shiller/shiller-cape.json + the dated archive copy (every
 *     download is archived as its converted JSON + content hash, F-18).
 *
 * The source is L2 and DISABLED until the owner sets owner_accepts to yes
 * in RISK_REGISTER.md (T-30: nothing requests it until then — the workflow
 * still ships so the flip is a one-line change for the owner).
 *
 * Run: pnpm --filter @currena/insights exec tsx scripts/shiller-fetch.ts [--dry-run]
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';
import { insightsFetch, contentHash, FormatChangedError } from '../src/adapters/fetch-policy';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', '..', 'data', 'shiller');
const dryRun = process.argv.includes('--dry-run');

/** The provider's own pages (verified 2026-10-20). The Yale mirror is the stale fallback. */
const SHILLER_HOME = 'https://shillerdata.com/';
const YALE_FALLBACK_XLS = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';

/** The file's own layout, verified from the provider's response (2026-10-20): the 'Data' sheet, header row 6, CAPE column 12, ECY column 16, dates as YYYY.MM from row 7. */
const DATA_SHEET = 'Data';
const HEADER_ROW = 6;
const CAPE_COL = 12;
const ECY_COL = 16;

function fail(message: string): never {
  console.error(`[shiller-fetch] ${message}`);
  process.exit(1);
}

/** F-03: discover the current bulk-file link from the provider's own page (fixed selector). */
function discoverXlsUrl(homeHtml: string): string {
  const match = homeHtml.match(/href="(\/\/[^"]+\/ie_data\.xls[^"]*)"/i);
  if (!match) return YALE_FALLBACK_XLS;
  return match[1]!.startsWith('//') ? `https:${match[1]}` : match[1]!;
}

/** Convert the provider's YYYY.MM decimal date to ISO YYYY-MM-01 (its own documented convention in the sheet). */
function isoOf(dateCell: number): string | null {
  if (!Number.isFinite(dateCell) || dateCell < 1800 || dateCell > 2200) return null;
  const year = Math.floor(dateCell);
  const month = Math.round((dateCell - year) * 100);
  if (month < 1 || month > 12) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

async function main(): Promise<void> {
  console.log(`[shiller-fetch] ${new Date().toISOString()}${dryRun ? ' (dry-run — no writes)' : ''}`);

  // 1. discover the current link from the provider's own page (one honest request).
  let xlsUrl = YALE_FALLBACK_XLS;
  try {
    const home = await insightsFetch(SHILLER_HOME, {}, { timeoutMs: 20_000 });
    const html = await home.text();
    xlsUrl = discoverXlsUrl(html);
    console.log(`[shiller-fetch] discovered: ${xlsUrl}`);
  } catch (err) {
    console.log(`[shiller-fetch] home page read failed (${err instanceof Error ? err.message : String(err)}) — using the recorded fallback`);
  }

  // 2. ONE honest request for the bulk file.
  const res = await insightsFetch(xlsUrl, {}, { timeoutMs: 60_000 });
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = contentHash(buf.toString('binary').slice(0, 2_000_000));
  console.log(`[shiller-fetch] downloaded ${(buf.length / 1024).toFixed(0)} KiB (hash ${hash})`);

  // 3. Parse + F-13 schema assertions against the file's own header row.
  const wb = XLSX.read(buf, { type: 'buffer' });
  if (!wb.SheetNames.includes(DATA_SHEET)) throw new FormatChangedError(`no '${DATA_SHEET}' sheet — sheets are ${wb.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[DATA_SHEET]!, { header: 1, blankrows: false });
  const header = rows[HEADER_ROW];
  if (!Array.isArray(header) || String(header[0]) !== 'Date' || String(header[CAPE_COL]) !== 'CAPE') {
    throw new FormatChangedError(`header row no longer matches (expected 'Date' at col 0 and 'CAPE' at col ${CAPE_COL}) — re-verify the layout before parsing`);
  }
  // The stacked header carries 'Excess' + 'CAPE' + 'Yield' over rows 4-6; the
  // label row (6) names the CAPE column; the ECY column rides under them.
  const stacked = rows.slice(3, HEADER_ROW + 1).map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '')) : []));
  if (!stacked.some((r) => r.some((c) => c.includes('Excess'))) || !stacked.some((r) => r.some((c) => c.includes('CAPE')))) {
    throw new FormatChangedError("the stacked header no longer carries 'Excess CAPE Yield' — re-verify the column indexes");
  }

  // 4. Extract CAPE (col 12) and ECY (col 16, a decimal like 0.0184 = 1.84%).
  const cape: Array<{ date: string; value: number }> = [];
  const ecy: Array<{ date: string; value: number }> = [];
  for (const row of rows.slice(HEADER_ROW + 1)) {
    if (!Array.isArray(row)) continue;
    const date = isoOf(Number(row[0]));
    if (date === null) continue; // footer prose rows
    const capeCell = Number(row[CAPE_COL]);
    const ecyCell = Number(row[ECY_COL]);
    if (Number.isFinite(capeCell) && capeCell > 0 && capeCell < 200) cape.push({ date, value: Math.round(capeCell * 100) / 100 });
    if (Number.isFinite(ecyCell) && ecyCell > -0.5 && ecyCell < 0.5) ecy.push({ date, value: Math.round(ecyCell * 10000) / 10000 });
  }
  if (cape.length < 100) throw new FormatChangedError(`only ${cape.length} CAPE rows parsed — the layout changed`);
  const latestCape = cape.at(-1)!;
  const latestEcy = ecy.at(-1) ?? { date: latestCape.date, value: Number.NaN };
  console.log(`[shiller-fetch] ${cape.length} monthly rows; latest CAPE ${latestCape.value} (${latestCape.date}), ECY ${(latestEcy.value * 100).toFixed(2)}% (${latestEcy.date})`);

  if (dryRun) {
    console.log('[shiller-fetch] dry-run — nothing written');
    return;
  }

  // 5. Write the small JSON (value, label, source timestamp, fetched time, content hash).
  mkdirSync(dataDir, { recursive: true });
  const doc = {
    $schema: 'FS-06: the monthly Shiller ie_data.xls converted (the engine reads this file; the source is L2 and disabled until the owner accepts)',
    sourceUrl: xlsUrl,
    sourceHome: SHILLER_HOME,
    label: 'Robert Shiller, Irrational Exuberance data (ie_data.xls)',
    contentHash: hash,
    fetchedAt: new Date().toISOString(),
    latestDate: latestCape.date,
    cape: latestCape.value,
    ecy: latestEcy.value,
    rows: cape.map((c, i) => ({ date: c.date, cape: c.value, ecy: ecy[i]?.date === c.date ? ecy[i]!.value : null })),
  };
  const out = join(dataDir, 'shiller-cape.json');
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  const monthKey = latestCape.date.slice(0, 7);
  const archive = join(dataDir, 'archive', `${monthKey}.json`);
  mkdirSync(dirname(archive), { recursive: true });
  const prev = readFileSync(out, 'utf8');
  writeFileSync(archive, prev); // every download archived as its converted JSON (FS-06)
  console.log(`[shiller-fetch] wrote ${out} + ${archive}`);
}

main().catch((err) => fail(err instanceof Error ? err.stack ?? err.message : String(err)));
