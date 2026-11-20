/**
 * gold-tail-content.tsx — the Zone O tail's CONTENT module (GUX-S5 M3b):
 * the three tail sections in their shipped order and DOM shape, imported
 * wholesale by GoldTail's lazy boundary so the bundler moves their bytes
 * into the tail's own chunk (the S4-D10 budget play — see GoldTail.tsx
 * for the contract this keeps). This module exists ONLY as the boundary's
 * import unit: NO re-styling, NO re-ordering, NO copy changes — the
 * sections render exactly as they did inside GoldPage (the rebased
 * characterization tests prove it).
 *
 * absentCount threads through unchanged (the publication-notes
 * disclosure's absent-count line, GoldPage's own projection prop).
 */

import { GoldEpisodes } from './GoldEpisodes';
import { GoldIfBought } from './GoldIfBought';
import { GoldPublicationNotes } from './GoldPublicationNotes';

export function GoldTailContent({ absentCount }: { absentCount: number }): React.JSX.Element {
  return (
    <>
      <GoldEpisodes />
      <GoldIfBought />
      <GoldPublicationNotes absentCount={absentCount} />
    </>
  );
}
