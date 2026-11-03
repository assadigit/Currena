/**
 * promo-extract.ts — one-off M6.4 evidence extractor (NOT production code):
 * reads the committed provider fixtures with the repo's OWN parsers and
 * dumps the GSCPI + GPR-index monthly series to CSV for the promotion
 * evaluation harness. Provider-exact by construction (the fixtures are the
 * providers' own files; the parsers are the production ones).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseGprExportAll, parseGscpiWorkbook } from '../packages/insights/src/adapters/monthly-indexes';

const gscpi = parseGscpiWorkbook(readFileSync('packages/insights/fixtures/s4/gscpi-2026-11-01.xls').buffer.slice(0) as ArrayBuffer);
writeFileSync(
  '/tmp/promo/gscpi.csv',
  gscpi.map((p) => `${p.date},${p.value}`).join('\n') + '\n',
);
console.log('gscpi:', gscpi.length, 'points', gscpi[0], '->', gscpi[gscpi.length - 1]);

const gpr = parseGprExportAll(readFileSync('packages/insights/fixtures/gpr-export.xls').buffer.slice(0) as ArrayBuffer);
const idx = gpr.gpr;
writeFileSync('/tmp/promo/gpr.csv', idx.map((p) => `${p.date},${p.value}`).join('\n') + '\n');
console.log('gprIndex:', idx.length, 'points', idx[0], '->', idx[idx.length - 1]);
