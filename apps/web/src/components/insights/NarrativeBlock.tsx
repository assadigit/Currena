/**
 * NarrativeBlock — Layer-2 narrator (M5, spec §11): the muted plain-language
 * block. ONE muted block per section header + ONE under the top verdict(s).
 *
 * Render rules (the staged rollout, D-34 + D-39):
 *   - The parent (the Insights route) renders this block ONLY when the
 *     `?narrative=preview` URL marker is present OR `doc.visible === true`.
 *     This component never reads the URL itself — it is the parent's gate.
 *   - If `unit` is undefined, the text is empty, or the unit's source is
 *     neither `'ai'` nor `'template'`, this component returns null (spec
 *     §11: "Missing/failed fetch → render nothing; nothing breaks").
 *   - If `source === 'ai'`, the small disclaimer «نوشته‌شده با هوش مصنوعی،
 *     نه توصیهٔ مالی» / "AI-written, not financial advice" sits beside the
 *     label. If `source === 'template'`, NO disclaimer (the spec's
 *     "template → no AI label" rule — the template is hand-written, not AI).
 *   - The "Updated {time}" line is muted (the spec's small label + the
 *     "updated <time>" line) — never a live clock; it carries the unit's
 *     own `generatedAt` timestamp through the house formatter.
 *
 * Styling mirrors the Layer1Block idiom (the same global CSS tokens + the
 * same `<bdi>` wrapping for RTL safety). The block lives INSIDE the
 * section's existing mother container — no new shell, no new ring — so it
 * reads as "the next line under the heading" rather than a new card.
 *
 * Zero KV operations, zero external calls. The parent fetches the document
 * once via lib/narrative.ts and passes the relevant unit down.
 */

import type { NarrativeUnit } from '../../lib/narrative';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { formatRelativeShort } from './world-markets/shared';

type Locale = 'en' | 'fa';

/**
 * @param unit   The section's or the overall's narrative unit. `undefined`
 *               renders nothing (graceful — the parent still owns the fetch).
 * @param copy   The Insights copy corpus (the page's already-loaded copy).
 * @param locale The active UI locale (`'en'` or `'fa'`).
 * @param now    The "now" the parent renders against (for relative time
 *                  phrasing; defaults to `new Date()`).
 */
export function NarrativeBlock({
  unit,
  copy,
  locale,
  now = new Date(),
}: {
  unit: NarrativeUnit | undefined;
  copy: InsightsCopy;
  locale: Locale;
  now?: Date;
}) {
  if (unit === undefined) return null;
  const text = locale === 'fa' ? unit.fa : unit.en;
  if (text.length === 0) return null;
  if (unit.source !== 'ai' && unit.source !== 'template') return null;

  const ui = copy.ui;
  const label = ui.narrativeLabel;
  const updated = interpolate(ui.narrativeUpdated, {
    time: formatUpdated(unit.generatedAt, locale, now, ui),
  });
  const disclaimer = unit.source === 'ai' ? ui.narrativeAiDisclaimer : null;

  return (
    <div
      data-narrative-block
      data-narrative-source={unit.source}
      className="mt-3 flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
          {label}
        </h4>
        <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {updated}
        </bdi>
        {disclaimer !== null ? (
          <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            · {disclaimer}
          </bdi>
        ) : null}
      </div>
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
        <bdi>{text}</bdi>
      </p>
    </div>
  );
}

/**
 * Format the unit's `generatedAt` (ISO 8601) as the small "Updated <time>"
 * line — Jalali in Farsi via the house formatter, the same words in EN.
 * Same-day generations collapse to the localized "today" word (the spec's
 * "Updated <time>" line never claims a live clock; same-day generations
 * are recent).
 */
function formatUpdated(
  iso: string,
  locale: Locale,
  now: Date,
  ui: { narrativeUpdatedToday: string },
): string {
  const generated = new Date(iso);
  if (Number.isNaN(generated.getTime())) return '';
  const sameDay = generated.getUTCFullYear() === now.getUTCFullYear()
    && generated.getUTCMonth() === now.getUTCMonth()
    && generated.getUTCDate() === now.getUTCDate();
  if (sameDay) {
    return ui.narrativeUpdatedToday;
  }
  // The relative-short formatter reads a full ISO datetime; pass it through.
  return formatRelativeShort(iso, locale);
}
