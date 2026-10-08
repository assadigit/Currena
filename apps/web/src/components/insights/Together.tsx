/**
 * Together — UI spec Part 6, Block T1 (I17): the "Together" section below
 * the prices board. One ConnectionCard per relationship, in spec order, in
 * a responsive auto-fit grid (the L4 pattern — items-start so cards never
 * stretch their neighbours).
 *
 * The whole section computes from the snapshot the page already holds:
 * no new fetches, no ingest dependency, honest unknowns when legs go stale.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evaluateConnections } from '@currena/insights';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ConnectionCard } from './ConnectionCard';

export function Together({
  readings,
  copy,
  numberLocale,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const connections = useMemo(() => evaluateConnections(readings), [readings]);
  if (connections.length === 0) return null;
  return (
    <section id="insights-together" aria-labelledby="insights-together-title" className="scroll-mt-24">
      <h2 id="insights-together-title" className="m-0 mb-1 text-lg font-extrabold">
        {copy.together.title}
      </h2>
      <p className="m-0 mb-2 text-[var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.together.subtitle}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-2.5">
        {connections.map((reading) => (
          <ConnectionCard
            key={reading.connection}
            reading={reading}
            readings={readings}
            copy={copy}
            numberLocale={numberLocale}
            onFocusCard={onFocusCard}
          />
        ))}
      </div>
    </section>
  );
}
