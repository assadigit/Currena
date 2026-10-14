/**
 * AboutTheData — round-2 Block R25: quiet and collapsible.
 *
 * A FLAT section (no white card, no inner coloured boxes) with one hairline
 * divider above. Header row: small heading + "Show details"/"Hide details"
 * text button (aria-expanded/aria-controls, ≥24px target). Collapsed by
 * default; the choice is remembered in localStorage (try/catch, fail open
 * to collapsed); it auto-expands when targeted (the About pill, the hero's
 * "About this data" link, "How is this calculated?" links, the #about hash —
 * via the route's expandToken) and for print.
 *
 * ALWAYS VISIBLE, outside the collapsible, in caption size and secondary
 * ink: (a) the FRED notice with its terms link, (b) one line of source
 * credits (RBA, ABS CC BY 4.0, ECB via Frankfurter, others by name), (c)
 * one line "General information only — not financial advice."
 *
 * INSIDE the collapsible: the full sources paragraph, the update schedule,
 * "How the tiers are decided" (rewritten for Needs attention / Unusual),
 * the full disclaimer, and the backtest note. The CSV button is gone (it
 * lives in the Tools menu, R15). Exactly ONE Sources block (R17b).
 */

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { InsightsSnapshot, InsightsStatus } from '@currena/core';
import { InsightsStatusSchema } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';

/** The FRED API terms-of-use URL (Block N1: link to the terms). */
const FRED_TERMS_URL = 'https://fred.stlouisfed.org/docs/api/terms_of_use.html';

const STORAGE_KEY = 'currena.insights.about-open.v1';

type RunStatusState =
  | { kind: 'loading' }
  | { kind: 'ready'; status: InsightsStatus }
  | { kind: 'absent' }
  | { kind: 'error' };

/**
 * Fix spec A-08 (2026-10-14): the run status — the snapshot time with its
 * time zone, any source that failed, and any validation test that flagged a
 * reading. Fetched once when the section first expands (one KV read behind
 * the edge cache); failures degrade calmly to the honest absent state.
 */
function useRunStatus(open: boolean): RunStatusState {
  const [state, setState] = useState<RunStatusState>({ kind: 'loading' });
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ kind: 'loading' });
    fetch('/api/insights/status')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body: unknown = await res.json();
        const parsed = InsightsStatusSchema.safeParse(body);
        if (!parsed.success) throw new Error('invalid status payload');
        if (!cancelled) setState({ kind: 'ready', status: parsed.data });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'absent' });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);
  return state;
}

/** The local time zone's short label (e.g. "UTC+11" or the IANA name). */
function utcOffsetLabel(now: Date): string {
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '−';
  const hours = Math.abs(offsetMinutes / 60);
  const whole = Math.floor(hours);
  const half = Math.round((hours - whole) * 60);
  return `UTC${sign}${whole}${half ? `:${String(half).padStart(2, '0')}` : ''}`;
}

export function AboutTheData({
  copy,
  expandToken,
  snapshot,
}: {
  copy: InsightsCopy;
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
  /** The page's own snapshot — the stale / check-pending cards render from
   * the readings the page already holds (fix A-08). */
  snapshot?: InsightsSnapshot;
}) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'open';
    } catch {
      return false; // fail open to collapsed (spec R25)
    }
  });

  useEffect(() => {
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  const runStatus = useRunStatus(open);
  const staleCards = (snapshot?.readings ?? []).filter(
    (r) => r.status === 'stale' || r.status === 'check-pending',
  );
  const failedSources = runStatus.kind === 'ready' ? runStatus.status.sources.filter((x) => !x.ok) : [];
  const failedTests = runStatus.kind === 'ready' ? (runStatus.status.validation ?? []).filter((x) => !x.ok) : [];

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed');
    } catch {
      /* privacy mode — session-only */
    }
  }, [open]);

  return (
    <section id="insights-about" aria-labelledby="insights-about-title" className="scroll-mt-24 border-t border-[var(--color-border)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="insights-about-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {copy.ui.aboutTitle}
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="insights-about-body"
          onClick={() => setOpen(!open)}
          className="insights-focusable inline-flex min-h-[24px] min-w-[24px] cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          <span aria-hidden="true">
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
            />
          </span>
          {open ? copy.ui.aboutHideDetails : copy.ui.aboutShowDetails}
        </button>
      </div>

      {/* Always visible (caption size, secondary ink, no boxes): FRED notice,
       * one credits line, one general-information line.
       * Round 24 (roast): the official ENGLISH notice sits on its OWN
       * dir="ltr" line — embedding it inside a Persian sentence scrambled
       * the punctuation (stray colon, ".(" at a line start). The optional
       * local-language note renders on the NEXT line, in the page's own
       * direction. */}
      <div className="mt-2 flex flex-col gap-1 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-about-always>
        <p className="m-0" dir="ltr">
          <span>{copy.ui.fredNotice}</span>{' '}
          <a
            href={FRED_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="insights-focusable font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
          >
            {copy.ui.fredTerms} ↗
          </a>
        </p>
        {copy.ui.fredLocalNote ? <p className="m-0"><bdi>{copy.ui.fredLocalNote}</bdi></p> : null}
        <p className="m-0">{copy.ui.aboutCreditsLine}</p>
        <p className="m-0 font-semibold" data-general-info>
          {copy.ui.aboutGeneralInfo}
        </p>
      </div>

      {/* The collapsible details — always printed (paper can't click). */}
      <div
        id="insights-about-body"
        className={`${open ? '' : 'hidden'} print:block`}
      >
        <div className="mt-3 flex flex-col gap-3 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
          {/* Fix spec A-08 (2026-10-14): the run status — snapshot time with
           * its time zone, failed sources, stale cards, flagged readings. */}
          <div data-about-status>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.statusTitle}
            </h3>
            {snapshot ? (
              <p className="m-0">
                {interpolate(copy.ui.statusGeneratedAt, {
                  time: new Intl.DateTimeFormat(copy.ui.statusTimeLocale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(snapshot.generatedAt)),
                  tz: utcOffsetLabel(new Date()),
                })}
              </p>
            ) : null}
            {failedSources.length > 0 ? (
              <p className="m-0 font-semibold text-[var(--color-status-alert)]">
                {copy.ui.statusFailedSources} {failedSources.map((x) => x.source).join(', ')}
              </p>
            ) : runStatus.kind === 'ready' ? (
              <p className="m-0">{copy.ui.statusAllSourcesOk}</p>
            ) : null}
            {failedTests.length > 0 ? (
              <p className="m-0 font-semibold text-[var(--color-status-watch)]">
                {copy.ui.statusFlaggedTests} {failedTests.map((x) => x.test).join(', ')}
              </p>
            ) : null}
            {staleCards.length > 0 ? (
              <p className="m-0">
                {copy.ui.statusStaleCards}{' '}
                {staleCards.map((r) => copy.indicators[r.id]?.name ?? r.id).join(', ')}
              </p>
            ) : (
              <p className="m-0">{copy.ui.statusNoStaleCards}</p>
            )}
          </div>
          <div>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.aboutSourcesTitle}
            </h3>
            <p className="m-0">{copy.ui.aboutSourcesBody}</p>
            {/* N1: the publisher attribution lines — inside the ONE Sources
             * block (R17b: the separate Attribution box is gone). */}
            <ul className="mt-1 mb-0 list-none p-0">
              <li>{copy.ui.attributionRba}</li>
              <li>{copy.ui.attributionAbs}</li>
              <li>{copy.ui.attributionEcb}</li>
              <li>{copy.ui.attributionBasket}</li>
              {/* Round 44 (owner): the world-markets source line lives HERE
               * now — with every other attribution — not under the section. */}
              <li>{copy.ui.attributionEodhd}</li>
            </ul>
          </div>
          <div>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.aboutScheduleTitle}
            </h3>
            <p className="m-0">{copy.ui.aboutScheduleBody}</p>
          </div>
          <div>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.aboutRulesTitle}
            </h3>
            <p className="m-0">{copy.ui.aboutRulesBody}</p>
            <p className="m-0">{copy.ui.explainerBacktest}</p>
          </div>
          <div>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.disclaimerTitle}
            </h3>
            <p className="m-0">{copy.ui.disclaimerBody1}</p>
            <p className="m-0">{copy.ui.disclaimerBody2}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
