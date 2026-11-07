/**
 * Page-level data projections (S2, 2026-11-08 — the roadmap's S2:
 * "the contract between engine and pages").
 *
 * `projectSnapshotToPage` curates one destination page's payload out of
 * the SAME precomputed snapshot `GET /api/insights` serves: the page's
 * home readings (placement order) + its mirror-input readings (shared
 * verdict displays) + the boards manifest. Nothing is computed here —
 * verdicts stay the pure engine's, re-derived client-side exactly as the
 * legacy page does today (spec §3.3: engine and display are separate
 * layers; §3.2: nothing is computed twice).
 *
 * The caller (apps/api) owns WHICH snapshot it projects: the
 * mode-appropriate reader (public projection vs private full document)
 * and the live-prices overlay merge — the projection inherits both
 * disciplines untouched, so the ribbon/hero live values and the licence
 * hides behave exactly like the legacy route's.
 *
 * Fail-closed (Agent Rule 5): a placement id the served snapshot does not
 * carry is REPORTED (`absentIds`), never guessed and never silently
 * dropped — in public mode that is the licence-hidden quartet (the Gold
 * page's blocked notes); in private mode an empty absentIds is the
 * completeness invariant the S2 gate tests pin.
 */

import type { PageDivisionPageId, PageIndex, PageProjection } from '@currena/core';
import type { InsightsSnapshot } from '@currena/core';
import { PageProjectionSchema } from '@currena/core';
import { PAGE_PLACEMENTS, PAGE_PLACEMENTS_BY_PAGE, pageHomeIds, pageReadingIds } from './placement';

/** Unknown page ids are the caller's 404 (`unknown_page`), not a projection. */
export function isPageDivisionPageId(page: string): page is PageDivisionPageId {
  return PAGE_PLACEMENTS_BY_PAGE.has(page as PageDivisionPageId);
}

/**
 * GET /api/insights/pages — the projection surface's index: one entry per
 * destination (page, home count, mirror count, boards, decisions). Static
 * per deploy (derived from the placement module alone — no snapshot read);
 * the route caches it hard and stamps a content-addressed ETag.
 */
export function buildPageIndex(): PageIndex {
  return {
    pages: PAGE_PLACEMENTS.map((p) => ({
      page: p.page,
      registryCards: pageHomeIds(p.page).length,
      mirrorInputs: p.mirrors.length,
      boards: [...p.boards],
      decisions: p.decisions,
    })),
  };
}

/**
 * Project one page's payload from a (mode-appropriate, live-merged)
 * snapshot. Deterministic: readings in placement order (homes by group,
 * then mirrors); every id at most once; absentIds in the same order.
 */
export function projectSnapshotToPage(snapshot: InsightsSnapshot, page: PageDivisionPageId): PageProjection {
  const placement = PAGE_PLACEMENTS_BY_PAGE.get(page);
  if (placement === undefined) {
    // Unreachable through isPageDivisionPageId-guarded routes; kept loud
    // rather than returning a fabricated payload.
    throw new Error(`projectSnapshotToPage: unknown page ${page}`);
  }
  const byId = new Map(snapshot.readings.map((r) => [r.id as string, r]));
  const expected = pageReadingIds(page);
  const readings = expected.flatMap((id) => {
    const reading = byId.get(id);
    return reading === undefined ? [] : [reading];
  });
  const absentIds = expected.filter((id) => !byId.has(id));

  const projection: PageProjection = {
    page,
    generatedAt: snapshot.generatedAt,
    pricesAsOf: snapshot.pricesAsOf,
    displayMode: snapshot.displayMode,
    readings,
    absentIds,
    boards: [...placement.boards],
  };
  // The wire contract is validated on construction (the same discipline
  // as the runner's stored documents): a projection that cannot cross the
  // boundary throws here, never on the wire.
  return PageProjectionSchema.parse(projection);
}
