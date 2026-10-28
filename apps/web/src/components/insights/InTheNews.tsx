/**
 * InTheNews — Layer-2 narrator Part 3 (M5, spec §11): the visually separate
 * "In the news" block, rendered ONLY when `unit.news` is present.
 *
 * Render rules:
 *   - `unit.news` is optional on every NarrativeUnit — most units have no
 *     news note. The parent renders this block as a sibling immediately
 *     after the NarrativeBlock when `unit.news` is present.
 *   - The note + the disclaimer render in the active locale. The sources
 *     (title + domain) render as `<a target="_blank" rel="noopener
 *     noreferrer">` — the spec's exact safety requirements.
 *   - Google's required display element (`requiredDisplay`, when grounding
 *     metadata returned one) renders via `dangerouslySetInnerHTML` beside
 *     the note (spec §5: render Google's required elements unescaped).
 *   - Visually separated from the NarrativeBlock: a thin top rule, the
 *     `currena-warning` family tint for the label (the section's "this is
 *     different" signal), and the sources list below the note.
 *
 * Zero KV operations, zero external calls. The parent owns the fetch.
 */

import type { NarrativeUnit } from '../../lib/narrative';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

type Locale = 'en' | 'fa';

type NewsNote = NonNullable<NarrativeUnit['news']>;

/**
 * @param news   The unit's news note (sources + EN/FA text + optional
 *               Google-required display HTML). Already validated W1–W10
 *               by the narrator's offline pipeline before being stored.
 * @param copy   The Insights copy corpus.
 * @param locale The active UI locale.
 */
export function InTheNews({
  news,
  copy,
  locale,
}: {
  news: NewsNote;
  copy: InsightsCopy;
  locale: Locale;
}) {
  const ui = copy.ui;
  const label = ui.inTheNewsLabel;
  const disclaimer = ui.inTheNewsDisclaimer;
  const text = locale === 'fa' ? news.fa : news.en;
  if (text.length === 0) return null;

  return (
    <div
      data-in-the-news-block
      className="mt-2 flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-currena-warning/10 px-3 py-2.5 ring-1 ring-currena-warning/30"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
          {label}
        </h4>
        <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {disclaimer}
        </bdi>
      </div>
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
        <bdi>{text}</bdi>
      </p>
      {/* Google's required display element (the search suggestions HTML),
          rendered unescaped per spec §5 when grounding metadata returned
          one. Never present without a successful grounded call (W1). */}
      {news.requiredDisplay !== undefined && news.requiredDisplay.length > 0 ? (
        <div
          data-in-the-news-required-display
          className="in-the-news-required-display"
          // The HTML came back from Gemini's grounding metadata (a
          // Google-controlled snippet). The narrator's pipeline carries
          // it through verbatim; the spec §5 requires this render.
          dangerouslySetInnerHTML={{ __html: news.requiredDisplay }}
        />
      ) : null}
      {news.sources.length > 0 ? (
        <ul className="m-0 mt-0.5 list-disc ps-5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          {news.sources.map((source, i) => {
            const url = safeUrl(source.url);
            if (url === null) return null;
            const domain = domainOf(url);
            const title = source.title.length > 0 ? source.title : domain;
            return (
              <li key={`${url}-${i}`}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insights-focusable text-[var(--color-status-context)] underline underline-offset-2 hover:text-[var(--color-text-primary)]"
                >
                  <bdi>{title}</bdi>
                </a>
                <bdi className="text-[var(--color-text-tertiary)]"> · {domain}</bdi>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Safe URL guard: the sources came from Gemini's grounding metadata (a
 * Google-controlled list), but the spec §11 still requires that nothing
 * breaks. Only `https:` (and the conservative `http:`) URLs render as
 * anchors; anything else is dropped (the parent W1 check should have
 * already filtered sourceless news out, this is the display-time guard).
 */
function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    return null;
  } catch {
    return null;
  }
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
