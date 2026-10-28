/**
 * Layer 1 — the generic plain-language block for the NON-indicator
 * surfaces (docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md §6).
 *
 * The indicator cards render their Layer-1 block inside DetailsPanel.tsx
 * (decision D-05). The three OTHER surfaces the M3 batches add copy for —
 * the world-market detail panels (MarketTile.tsx), the FX pair detail
 * panels (world-currencies/PairsTable.tsx) and the FX pattern cards
 * (world-currencies/PatternCard.tsx) — have their own approved panel
 * layouts and cannot reuse the reading-shaped DetailsPanel block, so they
 * share THIS generic block instead (decision D-17):
 *
 *   oneLine (small muted lead) → ifRising / ifFalling (the surface's own
 *   normal-lens change sign emphasises the matching line, D-06/D-17) →
 *   skipReason + "no direction" note when both are null (pattern cards,
 *   D-09) → connections (names resolved across every surface) →
 *   australiaAngle if present (never for markets/pairs/patterns, D-08) →
 *   the glossary-term list.
 *
 * Renders nothing when no Layer-1 copy exists for the id (graceful during
 * the batched roll-out — the same contract as the DetailsPanel block).
 * Zero KV operations, zero external calls (spec §5 + G10).
 */

import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { getIndicatorCopy, getGlossary, getLayer1Ui } from './index';
import type { Layer1Lang } from './index';

/** One labelled paragraph (the DetailsPanel block's Section, same classes). */
function Section({ title, body, emphasis }: { title: string; body: string; emphasis?: boolean }) {
  return (
    <div>
      <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
        {title}
      </h4>
      <p
        className={`mt-1 mb-0 text-[length:var(--type-label)] leading-relaxed ${
          emphasis ? 'font-bold text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]/90'
        }`}
      >
        <bdi>{body}</bdi>
      </p>
    </div>
  );
}

/**
 * A connection target's display name, resolved across every surface the
 * inventory spans: an indicator id (its plain Layer-1 name, else the
 * approved card name), a market id, an FX pair id, an FX pattern id —
 * else the raw id (never a blank line).
 */
function connectionName(id: string, locale: Layer1Lang, copy: InsightsCopy): string {
  const l1 = getIndicatorCopy(id, locale);
  if (l1 !== undefined) return l1.plainName;
  const indicators = copy.indicators as unknown as Record<string, { name?: string }>;
  const markets = copy.markets.entries as unknown as Record<string, { name?: string }>;
  const pairs = copy.fx.entries as unknown as Record<string, { name?: string }>;
  const ruleKey = /^r[1-7]_/.test(id) ? (id.slice(0, 2) as keyof typeof copy.fx.rules) : undefined;
  return (
    indicators[id]?.name ??
    markets[id]?.name ??
    pairs[id]?.name ??
    (ruleKey !== undefined ? copy.fx.rules[ruleKey]?.name : undefined) ??
    id
  );
}

/**
 * The generic Layer-1 block. `changeDir` is the surface's OWN normal-lens
 * change in percent (markets: the 3-month change, the section's normal
 * timeframe; FX pairs: the 1-month change, the rules' alarm lens); its
 * sign emphasises the matching ifRising/ifFalling line — CSS only, no new
 * wording (D-06/D-17). Pattern cards pass no direction (null both sides).
 */
export function Layer1Block({
  id,
  locale,
  copy,
  changeDir,
}: {
  id: string;
  locale: Layer1Lang;
  copy: InsightsCopy;
  changeDir?: number;
}) {
  const l1 = getIndicatorCopy(id, locale);
  const ui = getLayer1Ui(locale);
  const glossary = getGlossary(locale);
  if (!l1) return null;
  const rising = changeDir !== undefined && changeDir > 0;
  const falling = changeDir !== undefined && changeDir < 0;
  const bothNull = l1.ifRising === null && l1.ifFalling === null;
  return (
    <div
      data-layer1-block
      data-layer1-id={id}
      className="mt-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3"
    >
      {/* The always-true lead (spec §6: the collapsed card's line; on
       * these surfaces it rides at the top of the expanded block — D-17). */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{l1.oneLine}</bdi>
      </p>
      {l1.ifRising !== null ? <Section title={ui.ifRising} body={l1.ifRising} emphasis={rising} /> : null}
      {l1.ifFalling !== null ? <Section title={ui.ifFalling} body={l1.ifFalling} emphasis={falling} /> : null}
      {bothNull && l1.skipReason !== undefined ? (
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{l1.skipReason}</bdi>
        </p>
      ) : null}
      {bothNull ? (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{ui.noDirection}</bdi>
        </p>
      ) : null}
      {l1.connections.length > 0 ? (
        <div>
          <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {ui.connections}
          </h4>
          <ul className="m-0 mt-1 list-none p-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {l1.connections.map((c, i) => (
              <li key={i} className="mb-1">
                <span className="font-semibold">{connectionName(c.with, locale, copy)}</span>
                <span aria-hidden="true"> — </span>
                <bdi>{c.text}</bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {l1.australiaAngle !== undefined ? (
        <Section title={ui.australiaAngle} body={l1.australiaAngle} />
      ) : null}
      {l1.glossaryTerms.length > 0 ? (
        <div>
          <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {ui.plainWords}
          </h4>
          <dl className="m-0 mt-1 grid gap-1.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {l1.glossaryTerms.map((termId) => {
              const g = glossary[termId];
              if (!g) return null;
              return (
                <div key={termId}>
                  <dt className="font-semibold">{g.term}</dt>
                  <dd className="m-0 ms-0 text-[var(--color-text-secondary)]">
                    <bdi>{g.plain}</bdi>
                    {g.example !== undefined ? (
                      <span className="mt-0.5 block text-[length:var(--type-caption)] italic text-[var(--color-text-tertiary)]">
                        <bdi>{g.example}</bdi>
                      </span>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
