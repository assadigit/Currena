/**
 * SectionVerdictLine — the §6.11/§9.10 verdict-line anatomy BOTH world
 * sections wear: the MEASURE LABEL (what the section's verdict measures —
 * "Stock markets: …" / "Currency patterns: …") plus the page's own
 * severity chip (Normal / Needs attention / Unusual).
 *
 * Why it exists: the stock section can say "calm" (markets near their
 * yearly highs) while a currency pattern warns (a falling AUD/JPY). Both
 * are true — they measure different things — so every section verdict
 * names its measure, and a non-expert can never read the pair as one
 * contradiction.
 */

import type { InsightsCopy } from '../../i18n/insights-copy-en';

/** The page's three severity tiers (the chips' own wording lives in copy). */
export type SectionChip = 'normal' | 'attention' | 'unusual' | null;

export function SectionVerdictLine({
  label,
  chip,
  copy,
}: {
  /** The §6.11/§9.10 measure label for the section's current signal. */
  label: string;
  chip: SectionChip;
  copy: InsightsCopy;
}) {
  const chipText =
    chip === 'attention'
      ? copy.fx.chipAttention
      : chip === 'unusual'
        ? copy.fx.chipUnusual
        : chip === 'normal'
          ? copy.fx.chipNormal
          : null;
  const chipTone =
    chip === 'attention'
      ? 'bg-currena-warning/15 text-[var(--color-status-alert)]'
      : chip === 'unusual'
        ? 'bg-currena-warning/10 text-[var(--color-status-watch)]'
        : 'bg-currena-muted/15 text-[var(--color-text-secondary)]';
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        <bdi>{label}</bdi>
      </span>
      {chipText !== null ? (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${chipTone}`}>
          {chipText}
        </span>
      ) : null}
    </p>
  );
}
