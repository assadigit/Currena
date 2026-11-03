/**
 * promo-extract-2.ts — one-off M6.4 evidence extractor (NOT production
 * code): reads the provider's own ie_data.xls (the recorded sourceUrl,
 * fetched fresh) with the repo's own biff reader — sheet 5 ("Data"),
 * header row 8 (Date | P | D | E | CPI …) — and dumps the S&P 500
 * composite monthly REAL price series for the evaluation harness.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { readXlsWorkbook } from '../packages/insights/src/adapters/biff';

const wb = readXlsWorkbook(readFileSync('/tmp/promo/ie_data.xls').buffer.slice(0) as ArrayBuffer);
const sheet = wb.sheets[4];
if (sheet === undefined) throw new Error('the Data sheet is absent');
const header = sheet.rows[7];
if (header === undefined) throw new Error('no header row');
const hcells: string[] = [];
for (const [c, v] of header) hcells[c] = String(v).trim();
console.log('header:', JSON.stringify(hcells.slice(0, 7)));
let dateCol = -1;
let pCol = -1;
for (const [c, v] of header) {
  const s = String(v).trim();
  if (s === 'Date') dateCol = c;
  if (s === 'P') pCol = c;
}
if (dateCol < 0 || pCol < 0) throw new Error(`date/P columns not found (${dateCol}/${pCol})`);

const out: string[] = [];
for (let r = 8; r < sheet.rows.length; r += 1) {
  const row = sheet.rows[r];
  if (row === undefined) continue;
  const serial = row.get(dateCol);
  const price = row.get(pCol);
  if (typeof price !== 'number') continue;
  let year: number;
  let month: number;
  if (typeof serial === 'number') {
    year = Math.floor(serial);
    // Shiller's serial is YYYY.MM (.1 = October — Excel strips the trailing zero)
    month = Math.round((serial - year) * 100);
  } else if (typeof serial === 'string') {
    const m = /^(\d{4})\.(\d{2})$/.exec(serial.trim());
    if (m === null) continue;
    year = Number(m[1]);
    month = Number(m[2]);
  } else {
    continue;
  }
  if (year < 1900 || year > 2027) continue;
  out.push(`${year}-${String(month).padStart(2, '0')}-01,${price}`);
}
writeFileSync('/tmp/promo/sp-monthly.csv', out.join('\n') + '\n');
console.log('sp monthly:', out.length, 'points; first:', out[0], 'last:', out[out.length - 1]);
