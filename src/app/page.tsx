/**
 * / — the Currena world-markets page.
 *
 * Fetches the 16-index snapshot from /api/markets and hands it to the
 * WorldMarkets section (the treemap + the region grids + the summary).
 */

'use client';

import { useEffect, useState } from 'react';
import { WorldMarkets } from '@/components/markets/world-markets';
import type { MarketsSnapshot } from '@/components/markets/types';

export default function Home() {
  const [snapshot, setSnapshot] = useState<MarketsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/markets');
        if (!res.ok) throw new Error(`markets: ${res.status}`);
        const data = (await res.json()) as MarketsSnapshot;
        if (!cancelled) {
          setSnapshot(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <WorldMarkets snapshot={snapshot} loading={loading} />
    </main>
  );
}
