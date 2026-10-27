/**
 * R10-4 helper — enumerate every definition id missing from the visual
 * fixture builder's ROWS table. Run once to know the full set of row
 * specs to add; not committed (a /tmp script).
 */
import { DEFINITIONS } from '@currena/insights';
import * as fs from 'node:fs';
import * as path from 'node:path';

const buildFixturesPath = path.resolve('apps/web/visual/build-fixtures.ts');
const src = fs.readFileSync(buildFixturesPath, 'utf-8');

// Find every id that already has a row spec — match the quoted id followed by a colon
// at the start of a ROWS entry (e.g. 'au-10y': { ... },).
const present = new Set();
for (const m of src.matchAll(/^[ \t]*'([a-z0-9-]+)':\s*\{/gmu)) {
  present.add(m[1]);
}

const missing = DEFINITIONS.filter((d) => !present.has(d.id)).map((d) => ({
  id: d.id,
  section: d.section,
  group: d.group,
  cadence: d.cadence,
  rule: d.rule.kind,
  source: d.source,
}));

console.log(`Total definitions: ${DEFINITIONS.length}`);
console.log(`Row specs already present: ${present.size}`);
console.log(`Missing row specs: ${missing.length}`);
console.log('');
console.log('Missing ids (sorted by section, then group, then id):');
const sorted = [...missing].sort((a, b) => {
  if (a.section !== b.section) return a.section < b.section ? -1 : 1;
  if (a.group !== b.group) return a.group < b.group ? -1 : 1;
  return a.id < b.id ? -1 : 1;
});
for (const m of sorted) {
  const idPadded = m.id.padEnd(32);
  const sectionPadded = m.section.padEnd(9);
  const groupPadded = m.group.padEnd(24);
  const cadencePadded = m.cadence.padEnd(10);
  const rulePadded = m.rule.padEnd(12);
  console.log(`  ${idPadded} section=${sectionPadded} group=${groupPadded} cadence=${cadencePadded} rule=${rulePadded} source=${m.source}`);
}
