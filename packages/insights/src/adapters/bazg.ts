/**
 * bazg.ts — GF-S11 (P4, 2026-11-07 — audit report §4 rank 39 / F16): the
 * Swiss federal customs office's (BAZG/FOCBS) foreign-trade OPEN DATA —
 * the "Goods: Foreign trade - Gold imports by country" CSV, the Swiss
 * gold flow's raw-material side (what the world's refinery hub takes in
 * each month — the evidence family behind the Shanghai premium F6 and
 * the India parity F7).
 *
 * The venue (verified live 2026-11-07, the honest CurrenaDashboard UA):
 * ocean.bazg.admin.ch serves the catalogue's CSV keyless — a ~2.4 MB
 * semicolon file, one row per month × tariff number × control code ×
 * country (2021-01 → 2026-09 at the read; the def/prov statuses revise
 * — the fetched-wins merge refines). The swissimpex.admin.ch app itself
 * TLS-blocks this venue (handshake failure — the export side rides only
 * that app or a 692 MB all-tariff zip, both honestly out; recorded in
 * the definition's comments as the follow-up).
 *
 * Licence (the register's bazg row, L1): the opendata.swiss
 * terms_by_ask class — non-commercial use permitted with the source
 * recommended; Currena's display rides the owner's recorded
 * non-commercial statement (the UoM precedent). The monthly TOTAL is a
 * stated derivation (the 7108 gold rows' Quantity_kg summed by month —
 * the "How is this calculated?" says so).
 *
 * The parse takes ONLY the tariff-7108 (gold) rows' quantities; a row
 * without a parseable quantity is skipped, never guessed.
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const BAZG_GOLD_IMPORTS_URL =
  'https://ocean.bazg.admin.ch/open-data-reports/TN8_controlCode_Gold_IMP_en_v1/TN8_controlCode_Gold_IMP_en_v1.csv';

/** The CSV header the parse pins (F-16: a shape change fails loudly). */
const EXPECTED_HEADER_PREFIX = 'Traffic_direction;year;quarter;Quarter_txt;month;Month_txt;Tariffnumber8';

/** The HS8 tariff chapter for gold (unwrought, semi-manufactured, powder). */
export const GOLD_TARIFF_PREFIX = '7108';

/**
 * Parse the BAZG gold-imports CSV into the monthly tonnage series
 * (pure, testable): the 7108 rows' Quantity_kg summed per year-month,
 * kilograms → tonnes (1dp, the trade's own unit), dated month-start.
 */
export function parseBazgGoldImports(csv: string): SeriesPoint[] {
  const lines = csv.split(/\r?\n/);
  const header = lines[0] ?? '';
  if (!header.startsWith(EXPECTED_HEADER_PREFIX)) {
    throw new FormatChangedError(`BAZG: the gold-imports header changed — "${header.slice(0, 60)}…"`);
  }
  const columns = header.split(';');
  const idx = {
    direction: columns.indexOf('Traffic_direction'),
    year: columns.indexOf('year'),
    month: columns.indexOf('month'),
    tariff: columns.indexOf('Tariffnumber8'),
    kg: columns.indexOf('Quantity_kg'),
  };
  for (const [name, i] of Object.entries(idx)) {
    if (i < 0) throw new FormatChangedError(`BAZG: no ${name} column in the gold-imports header`);
  }
  const totals = new Map<string, number>();
  let goldRows = 0;
  for (const line of lines.slice(1)) {
    if (line.trim() === '') continue;
    const cells = line.split(';');
    const direction = cells[idx.direction]!;
    const tariff = cells[idx.tariff]!;
    if (!tariff.startsWith(GOLD_TARIFF_PREFIX)) continue; // only the gold chapter
    if (direction !== 'I') continue; // the imports file — anything else is a shape change worth skipping
    const year = Number(cells[idx.year]);
    const month = Number(cells[idx.month]);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12) continue;
    const kg = Number(cells[idx.kg]);
    if (!Number.isFinite(kg) || kg < 0) continue; // an empty/odd quantity — skipped, never guessed
    const key = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) ?? 0) + kg);
    goldRows += 1;
  }
  if (goldRows === 0) {
    throw new FormatChangedError('BAZG: no gold (7108) rows parsed — the file shape changed');
  }
  const points: SeriesPoint[] = [...totals.entries()]
    .map(([month, kg]) => ({ date: `${month}-01`, value: Math.round((kg / 1000) * 10) / 10 }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points;
}

/**
 * Fetch the gold-imports CSV and derive the monthly tonnage (one keyless
 * request, the honest UA). Throws loudly on a block, a non-2xx or a shape
 * change — the source report row carries the failure honestly.
 */
export async function fetchBazgGoldImports(deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(BAZG_GOLD_IMPORTS_URL, {}, { timeoutMs: 30_000, ...deps });
  const text = await res.text();
  return parseBazgGoldImports(text);
}
