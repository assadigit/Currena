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
 *
 * 2026-10-29 owner round ("when a currency pattern is active, make it more
 * prominent and have visual weight, easy to be seen"): the `size` prop —
 * 'lg' grows the measure label to a verdict-scale heading (the currencies
 * section's verdict box wears it when a pattern is live).
 */

import type { InsightsCopy } from '../../i18n/insights-copy-en';

/** The page's three severity tiers (the chips' own wording lives in copy). */
type SectionChip = 'normal' | 'attention' | 'unusual' | null;

export function SectionVerdictLine({
  label,
  chip,
  copy,
  size = 'md',
}: {
  /** The §6.11/§9.10 measure label for the section's current signal. */
  label: string;
  chip: SectionChip;
  copy: InsightsCopy;
  /** 2026-10-29: 'lg' renders the measure label at the verdict-heading
   * scale (the currencies section's prominent verdict box); 'md' keeps
   * the original inline size (the markets verdict box). */
  size?: 'md' | 'lg';
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
    <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span
        className={`font-bold text-[var(--color-text-primary)] ${
          size === 'lg' ? 'text-[length:calc(var(--type-label)*1.3)] leading-snug' : 'text-[length:var(--type-label)]'
        }`}
      >
        <bdi>{label}</bdi>
      </span>
      {chipText !== null ? (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold ${
            size === 'lg' ? 'text-[0.78rem]' : 'text-[0.68rem]'
          } ${chipTone}`}
        >
          {chipText}
        </span>
      ) : null}
    </p>
  );
}
