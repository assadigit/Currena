/**
 * The PLACEMENT.generated.md sync pin (page-division S2, 2026-11-08) —
 * the registry-sync discipline applied to the placement table: the
 * committed doc must equal the deterministic regeneration from the live
 * registry + the placement module, so an engine or registry change that
 * moves a home or a mirror surfaces as a visible CI diff, never as
 * silent drift (Agent Rule 5).
 *
 * If this test fails after an intentional change: run
 * `pnpm placement:generate`, review the diff like any other reviewed
 * change, and commit the regenerated doc WITH it.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPlacementMarkdown } from './doc';
import type { PlacementRegistry } from './doc';

const registry = JSON.parse(
  readFileSync(new URL('../../../../data/indicators.json', import.meta.url), 'utf8'),
) as PlacementRegistry;

describe('docs/page-division/PLACEMENT.generated.md (the sync pin)', () => {
  const committed = readFileSync(
    new URL('../../../../docs/page-division/PLACEMENT.generated.md', import.meta.url),
    'utf8',
  );

  it('is byte-identical to the regeneration from the live registry + placement module', () => {
    expect(buildPlacementMarkdown(registry)).toBe(committed);
  });

  it('is deterministic — two builds are byte-identical (no timestamps, no env)', () => {
    expect(buildPlacementMarkdown(registry)).toBe(buildPlacementMarkdown(registry));
  });

  it('carries the reconciliation verdict and the audit findings', () => {
    expect(committed).toContain('## Reconciliation — 184 ids + 6 boards');
    expect(committed).toContain('**Verdict: reconciles**');
    expect(committed).toContain('**184 registry ids placed** (+ 0 unplaced)');
    expect(committed).toContain('## Audit findings (drift — recorded, never silently fixed)');
    expect(committed).toContain('**AF-3 (amber)**');
    expect(committed).toContain('OWNER RATIFICATION PENDING');
    expect(committed).toContain('## Boards (spec §14’s boards line)');
  });
});
