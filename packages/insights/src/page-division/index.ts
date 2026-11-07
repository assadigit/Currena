/**
 * The page-division data layer (S2, 2026-11-08) — the contract between
 * engine and pages.
 *
 *   placement.ts  — the §14 placement table (typed homes + engine-derived
 *                   mirrors + boards) + the reconciliation.
 *   projection.ts — projectSnapshotToPage (one page's curated payload)
 *                   + buildPageIndex + the page-id guard.
 *   doc.ts        — buildPlacementMarkdown (the PLACEMENT.generated.md
 *                   builder; deterministic, sync-test-pinned).
 *
 * Consumers: apps/api/src/routes/insights-pages.ts (the serve path),
 * apps/web/src/lib/page-division.ts (the SPA client), scripts/
 * generate-placement-table.ts (the generator) and the S3+ page builds.
 */

export {
  BLOCKED_NOTES,
  PAGE_PLACEMENTS,
  PAGE_PLACEMENTS_BY_PAGE,
  PLACEMENT_AUDIT_FINDINGS,
  THEMATIC_GAUGE_MEMBER_IDS,
  GOLD_VOTER_IDS,
  AU_GAUGE_MEMBER_IDS,
  allPlacedHomeIds,
  pageHomeIds,
  pageMirrorIds,
  pageBlockedIds,
  pageReadingIds,
  reconcilePlacement,
} from './placement';
export type { BlockedNote, PagePlacement, PlacementFinding, PlacementGroup, PlacementReconciliation } from './placement';

export { buildPageIndex, isPageDivisionPageId, projectSnapshotToPage } from './projection';

export { buildPlacementMarkdown } from './doc';
export type { PlacementRegistry, PlacementRegistryIndicator } from './doc';
