/**
 * Manual-series loader — hand-maintained data files (`data/manual/*.json`,
 * roadmap package layout). Phase I2 ships the loader + contract; the actual
 * China-PMI observations are Phase I5/I6 content work (never invented by
 * the agent — the owner or a documented official release feeds the file).
 *
 * Contract: one JSON object per indicator with provenance fields and a
 * dated observation list. zod-validated; anything unexpected throws loudly.
 */

import { z } from 'zod';
import type { IndicatorId } from '@currena/core';
import type { SeriesPoint } from '../series';
import { AdapterError } from './types';

/** The manual file contract (data/manual/<id>.json). */
export const ManualSeriesFileSchema = z.object({
  /** Must match the file's indicator id (guards copy-paste mistakes). */
  id: z.string().min(1),
  /** Human-readable provenance shown on the card ("China NBS official PMI"). */
  sourceName: z.string().min(1),
  /** Link to the publishing body (optional but recommended). */
  sourceUrl: z.url().optional(),
  observations: z
    .array(
      z.object({
        date: z.iso.date(),
        value: z.number().finite(),
      }),
    )
    .min(1),
});

export type ManualSeriesFile = z.infer<typeof ManualSeriesFileSchema>;

/**
 * Parse one manual series file. `expectedId` enforces file/indicator
 * agreement; observations are sorted by date and duplicates rejected.
 */
export function parseManualSeries(json: unknown, expectedId: IndicatorId | string): SeriesPoint[] {
  const parsed = ManualSeriesFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new AdapterError(
      'manual',
      `series file for "${expectedId}" failed schema validation: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  if (parsed.data.id !== expectedId) {
    throw new AdapterError('manual', `file declares id "${parsed.data.id}", expected "${expectedId}"`);
  }
  const out: SeriesPoint[] = parsed.data.observations.map((o) => ({ date: o.date, value: o.value }));
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (let i = 1; i < out.length; i++) {
    if (out[i - 1]!.date === out[i]!.date) {
      throw new AdapterError('manual', `duplicate observation for ${out[i]!.date}`);
    }
  }
  return out;
}
