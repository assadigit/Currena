/**
 * public-mode.ts — the Worker's serve-time public-display gate (2026-10-19
 * owner decree; Step 3 §2.2 AC-08 + T-15 + LR-02).
 *
 * The hidden set is the GENERATED data/site-mode-overrides.json (bundled at
 * build time — the same file the T-15 build gate verifies: every indicator
 * whose licence verdict is other than 'yes', fail-closed 'unknown'
 * included, plus the two EODHD/Yahoo-backed world boards). Serving is
 * fail-closed twice: this module THROWS at startup when the bundled file is
 * malformed (a broken repo must never silently open), and the routes refuse
 * (404, zero data) anything on the list when SITE_MODE=public.
 */

import siteModeOverridesJson from '../../../data/site-mode-overrides.json';
import { z } from 'zod';

const SiteModeOverridesSchema = z.object({
  $schema: z.string().optional(),
  version: z.number(),
  hiddenIndicatorIds: z.array(z.string()),
  hiddenBoards: z.array(z.string()),
});

const parsed = SiteModeOverridesSchema.parse(siteModeOverridesJson);

/** Indicator ids a SITE_MODE=public deployment must never display. */
export const HIDDEN_INDICATOR_IDS: ReadonlySet<string> = new Set(parsed.hiddenIndicatorIds);

/** Whole sections a SITE_MODE=public deployment must never serve. */
export const HIDDEN_BOARDS: ReadonlySet<string> = new Set(parsed.hiddenBoards);

/** The resolved SITE_MODE ('private' by default — AC-08's fail-closed default). */
export function siteModeOf(env: { SITE_MODE?: string }): 'private' | 'public' {
  return env.SITE_MODE?.toLowerCase() === 'public' ? 'public' : 'private';
}

/** Which document family a serve-path reader reads ('private' = full, 'public' = projection). */
export type InsightsServeMode = 'private' | 'public';
