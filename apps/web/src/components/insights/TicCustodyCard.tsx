/**
 * TicCustodyCard — the WEEKLY foreign-official custody card (S2-M2.4's
 * spec item 6 — FRED WSEFINTL1), extracted from TicSection.tsx in
 * page-division S10 so the REUSED section module no longer pulls the
 * CompactRow/config chain (the /usa tier-6 board needs only the section
 * drawing; nyfed-custody renders there as a tier-2 card through the lean
 * UsaTierCards pattern — one reading, one surface, HIDDEN_FROM_LANE_IDS
 * unchanged).
 *
 * The card: the standard indicator card (the CompactRow anatomy, with its
 * 10-year position bar via ALWAYS_POSITION_IDS) that closes the TIC
 * section — weekly and current beside the ~6–7-week-lag country table, no
 * country split (the card's own copy says so). Renders inside the
 * SectionLane's ticSlot right below the TicSection (Insights.tsx); the
 * reading rides the main insights snapshot.
 *
 * null reading → nothing (the snapshot is loading or the series is held;
 * the TIC section's own states are independent and never wait on this).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { CompactRow } from './CompactRow';
import type { DailyPeers } from './config';

/** The locale pair the card renders with (the section module's own shape). */
type NumberLocale = 'en-US' | 'fa-IR';

/* ------------------------------------------------------------------ *
 * The weekly custody card (S2-M2.4's spec item 6 — FRED WSEFINTL1)
 * ------------------------------------------------------------------ */

/**
 * TicCustodyCard — the standard indicator card (the CompactRow anatomy,
 * with its 10-year position bar via ALWAYS_POSITION_IDS) that closes the
 * TIC section: the WEEKLY foreign-official custody level beside the
 * monthly country table that lags ~6–7 weeks. Renders inside the
 * SectionLane's ticSlot right below the TicSection (Insights.tsx); the
 * reading rides the main insights snapshot (HIDDEN_FROM_LANE_IDS keeps it
 * out of the borrowing-costs lane — one reading, one surface).
 *
 * null reading → nothing (the snapshot is loading or the series is held;
 * the TIC section's own states are independent and never wait on this).
 */
export function TicCustodyCard({
  reading,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  peers,
}: {
  reading: IndicatorReading | null;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: boolean;
  peers?: DailyPeers;
}) {
  if (reading === null) return null;
  return (
    <div className="lane-fill lane-fill-rows gap-1.5" data-tic-custody>
      <CompactRow
        reading={reading}
        copy={copy}
        numberLocale={numberLocale}
        onOpenDetails={onOpenDetails}
        pinned={pinned}
        peers={peers}
      />
    </div>
  );
}