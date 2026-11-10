/**
 * Page-division S2 (2026-11-08): generate
 * docs/page-division/PLACEMENT.generated.md — the AUTHORITATIVE per-id
 * placement table (spec §14: "generated programmatically in build
 * Session 2 from data/indicators.json + this spec's rules, then
 * committed").
 *
 * Inputs:
 *   - data/indicators.json            (the live registry — the 184 ids)
 *   - packages/insights/src/page-division (the spec §14 rules encoded +
 *     the engine-derived mirror sets — GAUGES + GOLD_LANE_VOTERS)
 *
 * Discipline:
 *   - Drift is an AUDIT FINDING, never a silent fix (Agent Rule 5): the
 *     spec's own hand-count defects are recorded in the doc (AF-1…AF-7 — AF-6/AF-7 added at the S21 spec audit);
 *     STRUCTURAL drift (unknown/duplicate/unplaced/mirror-overlap) is
 *     printed AND exits non-zero — the table is only committed green.
 *   - The output is DETERMINISTIC (no timestamps/env): the sync test
 *     (packages/insights/src/page-division/doc.test.ts) pins the
 *     committed file byte-for-byte against a regeneration, so an engine
 *     or registry change that moves a home or a mirror surfaces as a
 *     visible diff, never as silent drift.
 *
 * Run: pnpm placement:generate   (repo root)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// @ts-expect-error — outside this script's tsconfig rootDirs; tsx resolves it.
import { buildPlacementMarkdown, reconcilePlacement } from '../packages/insights/src/page-division';
// @ts-expect-error — same.
import type { PlacementRegistry } from '../packages/insights/src/page-division';

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = join(here, '..', 'data', 'indicators.json');
const docPath = join(here, '..', 'docs', 'page-division', 'PLACEMENT.generated.md');

const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as PlacementRegistry;

/* ------------------------- the reconciliation ------------------------- */

const rec = reconcilePlacement(registry.indicators.map((i) => i.id));
console.log(`[placement] registry ids: ${registry.indicators.length}`);
console.log(`[placement] placed: ${rec.placedCount} · unplaced: ${rec.unplaced.length} · duplicates: ${rec.duplicateHomes.length} · unknown: ${rec.unknownIds.length} · mirror overlaps: ${rec.mirrorOverlaps.length}`);
for (const row of rec.perPage) {
  console.log(`[placement]   ${row.page.padEnd(14)} ${String(row.registryCards).padStart(3)} cards + ${String(row.mirrorInputs).padStart(2)} mirrors`);
}
if (rec.unplaced.length > 0) console.error(`[placement] UNPLACED (structural red): ${rec.unplaced.join(', ')}`);
if (rec.duplicateHomes.length > 0) console.error(`[placement] DUPLICATE HOMES (structural red): ${rec.duplicateHomes.join(', ')}`);
if (rec.unknownIds.length > 0) console.error(`[placement] UNKNOWN IDS (structural red): ${rec.unknownIds.join(', ')}`);
if (rec.mirrorOverlaps.length > 0) console.error(`[placement] MIRROR/HOME OVERLAPS (structural red): ${rec.mirrorOverlaps.join(', ')}`);
console.log(`[placement] static audit findings on record: AF-1…AF-7 (see the doc's audit section)`);

/* --------------------------- the document --------------------------- */

const markdown = buildPlacementMarkdown(registry);
writeFileSync(docPath, markdown);
console.log(`[placement] wrote ${docPath} (${markdown.length} chars)`);

if (!rec.ok) {
  console.error('[placement] STRUCTURAL DRIFT — the doc records it as AF-RUNTIME; fix the placement module or the registry, then regenerate. Exiting non-zero (Agent Rule 4: never pass red forward).');
  process.exit(1);
}
