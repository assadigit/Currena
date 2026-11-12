/**
 * / — the Currena world-markets page.
 *
 * Reads the 16-index snapshot from the shared demo-snapshot builder (pure,
 * synchronous — no fetch) and hands it to the WorldMarkets section (the
 * treemap + the region grids + the summary + the detail modal). The app is a
 * static export: no server dependency, deployable to any static host.
 */

'use client';

import { WorldMarkets } from '@/components/markets/world-markets';
import { buildDemoSnapshot } from '@/lib/demo-snapshot';

export default function Home() {
  const snapshot = buildDemoSnapshot();
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <WorldMarkets snapshot={snapshot} loading={false} />
    </main>
  );
}
