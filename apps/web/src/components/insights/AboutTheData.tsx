/**
 * AboutTheData — round-2 Block R25: quiet and collapsible → v3 UI_SPEC §10
 * UI-49 + RULES M-7 (2026-10-20, PH6-C).
 *
 * A FLAT section (no white card, no inner coloured boxes) with one hairline
 * divider above. Header row: small heading + "Show details"/"Hide details"
 * text button (aria-expanded/aria-controls, ≥24px target). Collapsed by
 * default; the choice is remembered in localStorage (try/catch, fail open
 * to collapsed); it auto-expands when targeted (the About pill, the hero's
 * "About this data" link, the header's data-health chip, "How is this
 * calculated?" links, the #about hash — via the route's expandToken) and
 * for print.
 *
 * ALWAYS VISIBLE, outside the collapsible, in caption size and secondary
 * ink: (a) the FRED notice with its terms link, (b) one line of source
 * credits, (c) one line "General information only — not financial advice."
 *
 * INSIDE the collapsible (UI-49): the run status (snapshot time with its
 * time zone, failed sources, flagged tests, and the stale-or-unavailable
 * card list — every card name is a tappable chip that opens that card),
 * the PER-SOURCE TABLE (one row per provider, built from the generated
 * audit sidecar by about-sources.ts: Source (terms link) | Attribution |
 * Licence | Level badge | Enabled — metadata, so it renders in public mode
 * too), the update schedule, "How the tiers are decided" with the
 * rule-version line (version + the plain repository path — no invented
 * hosted URL), the full disclaimer, and the M-7 CONTACT LINE. The
 * sources prose paragraph + attribution bullet list are retired from the
 * render (their content lives in the table now); the copy keys stay
 * archived per UI_SPEC §1.7.
 *
 * UI-57 (the sidecar rides a LAZY chunk): the About section is collapsed
 * by default, so the audit sidecar (data/indicator-audit.json, the same
 * file full-export.ts imports) loads on the section's FIRST expand —
 * the same moment the run-status fetch fires — instead of riding the
 * Insights page chunk (the initial route load must not get worse than
 * the baseline). Until the (local, precached) chunk resolves the table
 * block renders nothing: metadata, never critical, same lazy pattern as
 * the run status (a print of the never-expanded section prints the
 * synchronous blocks only).
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import type { InsightsSnapshot, InsightsStatus, IndicatorId } from '@currena/core';
import { InsightsStatusSchema, formatNumber } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { definitionFor } from './config';
import {
  aboutEnabledState,
  aboutSidecarEntriesOf,
  aboutSourceRows,
  type AboutSourceRow,
} from './about-sources';

/** The FRED API terms-of-use URL (Block N1: link to the terms). */
const FRED_TERMS_URL = 'https://fred.stlouisfed.org/docs/api/terms_of_use.html';

/**
 * M-7 (RULES §3): the contact surface for data owners asking for removal —
 * the owner's existing public contact method (the Currena repository),
 * mirroring DATA_CONTACT_URL in apps/api/src/contact.ts (the API's export
 * meta floor renders the same value).
 */
const DATA_CONTACT_URL = 'https://github.com/assadigit/Currena';

/**
 * UI-49(d): the rule change log's repository path, rendered as PLAIN TEXT —
 * a real file in the repository this page ships from; no hosted URL is
 * invented for it.
 */
const RULE_CHANGELOG_PATH = 'packages/insights/src/ruleVersion.ts';

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
    // R10-5: the synchronous setState resets the panel to "loading" on
    // every open toggle — the async fetch then replaces it. This is the
    // documented "reset state on prop change" pattern (React docs:
    // "adjust state when a prop changes"). The alternative — a `key`
    // prop remount — would lose the panel's mount-time scroll position.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset-to-loading on open toggle (React docs: adjusting state when a prop changes)
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

/** One tappable card name — UI-49(c): every listed card links to its card. */
function CardLink({
  id,
  copy,
  onFocusCard,
}: {
  id: IndicatorId;
  copy: InsightsCopy;
  onFocusCard: (id: IndicatorId) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onFocusCard(id)}
        className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-currena-blue/50 hover:bg-currena-blue/10"
      >
        {copy.indicators[id]?.name ?? id}
        <span className="sr-only">, {copy.ui.viewCard}</span>
      </button>
    </li>
  );
}

export function AboutTheData({
  copy,
  expandToken,
  snapshot,
  numberLocale,
  onFocusCard,
}: {
  copy: InsightsCopy;
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
  /** The page's own snapshot — the stale / unavailable cards render from
   * the readings the page already holds (fix A-08 + UI-49(c)). */
  snapshot?: InsightsSnapshot;
  /** Persian digits for the count words (AGENTS.md rule 5). */
  numberLocale: 'en-US' | 'fa-IR';
  /** UI-49(c): opens the listed card's panel (the route's focusCard). */
  onFocusCard: (id: IndicatorId) => void;
}) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'open';
    } catch {
      return false; // fail open to collapsed (spec R25)
    }
  });

  useEffect(() => {
    // R10-5: the expandToken is a parent-controlled counter — a non-zero
    // value signals "expand now". setOpen(true) is the documented
    // response (the token is the external trigger; the open state is
    // the component's own). The dep array is intentional: only the
    // token's value matters, not setOpen's identity (stable from
    // useState).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expand-on-token: external trigger → local open state
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  const runStatus = useRunStatus(open);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  // UI-49(c): the card list extends to the UNAVAILABLE cards, and the two
  // groups follow the page's own six-word vocabulary: cards past their
  // maximum age (Stale) and cards whose value cannot be read right now
  // (check-pending + unavailable both display "Can't tell right now", so
  // they share the second lead line — the header's data-health chip counts
  // the same two groups).
  const staleCards = useMemo(
    () => (snapshot?.readings ?? []).filter((r) => r.status === 'stale'),
    [snapshot],
  );
  const cantTellCards = useMemo(
    () => (snapshot?.readings ?? []).filter((r) => r.status === 'check-pending' || r.status === 'unavailable'),
    [snapshot],
  );
  const failedSources = runStatus.kind === 'ready' ? runStatus.status.sources.filter((x) => !x.ok) : [];
  const failedTests = runStatus.kind === 'ready' ? (runStatus.status.validation ?? []).filter((x) => !x.ok) : [];

  // M-7: the contact template splits on its single {url} placeholder so the
  // URL renders as a real link inside the localized sentence.
  const [contactBefore, contactAfter] = copy.ui.aboutContactLine.split('{url}');

  // UI-49(a) + UI-57: the per-source table's rows — one row per provider,
  // derived from the audit sidecar. The sidecar is loaded LAZILY on the
  // section's FIRST expand (it rides the lazy chunk family of
  // full-export.ts, which imports the same file — the Insights page chunk
  // carries only the collapsed shell, so the initial route load does not
  // grow with the sidecar). Metadata, not data: it renders in public mode
  // too. A malformed/absent sidecar renders no table — fail-visible, never
  // an invented row.
  const [sourceRows, setSourceRows] = useState<readonly AboutSourceRow[] | null>(null);
  useEffect(() => {
    if (!open || sourceRows !== null) return;
    let cancelled = false;
    void import('../../../../../data/indicator-audit.json')
      .then((mod: { default: unknown }) => {
        const rows = aboutSourceRows(aboutSidecarEntriesOf(mod.default), (id) => {
          try {
            return definitionFor(id as IndicatorId).source;
          } catch {
            return id; // unknown to the definitions — render no provider guess
          }
        });
        if (!cancelled && rows.length > 0) setSourceRows(rows);
      })
      .catch(() => {
        /* the sidecar chunk failed to load — the table stays absent */
      });
    return () => {
      cancelled = true;
    };
  }, [open, sourceRows]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed');
    } catch {
      /* privacy mode — session-only */
    }
  }, [open]);

  /** The level badge's tooltip: the ladder explanation (+ the mixed note). */
  const levelTitle = (row: AboutSourceRow): string => {
    const word =
      row.worstLevel === 'L0'
        ? copy.ui.aboutLevelL0
        : row.worstLevel === 'L1'
          ? copy.ui.aboutLevelL1
          : row.worstLevel === 'L2'
            ? copy.ui.aboutLevelL2
            : copy.ui.aboutLevelL3;
    if (row.levels.length > 1) {
      return `${word} ${interpolate(copy.ui.aboutLevelMixed, { levels: row.levels.join(', ') })}`;
    }
    return word;
  };

  const enabledWord = (row: AboutSourceRow): string => {
    const state = aboutEnabledState(row);
    if (state === 'on') return copy.ui.aboutSourceOn;
    if (state === 'off') return copy.ui.aboutSourceOff;
    return interpolate(copy.ui.aboutSourcePartly, { n: num(row.seriesCount - row.enabledCount), m: num(row.seriesCount) });
  };

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
          className="insights-focusable inline-flex min-h-[44px] min-w-[44px] -my-2.5 cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
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
          {/* Fix spec A-08 + UI-49(b)/(c): the run status — snapshot time
           * with its time zone, failed sources, flagged tests, and the
           * stale-or-unavailable card list, every card tappable. */}
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
            {staleCards.length > 0 || cantTellCards.length > 0 ? (
              <div className="mt-1 flex flex-col gap-1.5">
                {staleCards.length > 0 ? (
                  <div>
                    <p className="m-0">{copy.ui.statusStaleCards}</p>
                    <ul className="mt-1 mb-0 flex list-none flex-wrap gap-1.5 p-0" data-about-stale-cards>
                      {staleCards.map((r) => (
                        <CardLink key={r.id} id={r.id} copy={copy} onFocusCard={onFocusCard} />
                      ))}
                    </ul>
                  </div>
                ) : null}
                {cantTellCards.length > 0 ? (
                  <div>
                    <p className="m-0">{copy.ui.statusUnavailableCards}</p>
                    <ul className="mt-1 mb-0 flex list-none flex-wrap gap-1.5 p-0" data-about-unavailable-cards>
                      {cantTellCards.map((r) => (
                        <CardLink key={r.id} id={r.id} copy={copy} onFocusCard={onFocusCard} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="m-0">{copy.ui.statusNoStaleCards}</p>
            )}
          </div>

          {/* UI-49(a): the per-source table. Real <table> with <th scope> at
           * ≥900px; below that each source stacks as a labelled block — the
           * same fields, no horizontal scroll (UI-52). The round-2 sources
           * prose + attribution bullets are retired from the render: the
           * table carries every source's name, attribution and licence now
           * (the archived copy keys stay per UI_SPEC §1.7). Renders once
           * the lazy sidecar chunk resolves (UI-57 — see the row loader). */}
          {sourceRows !== null ? (
          <div data-about-sources>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.aboutSourcesTitle}
            </h3>
            {/* Desktop (≥900px): the real table. */}
            <table className="m-0 hidden w-full border-collapse text-[length:var(--type-caption)] min-[900px]:table">
              <caption className="sr-only">{copy.ui.aboutSourcesTitle}</caption>
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.ui.aboutColSource}</th>
                  <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.ui.aboutColAttribution}</th>
                  <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.ui.aboutColLicence}</th>
                  <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.ui.aboutColLevel}</th>
                  <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.ui.aboutColEnabled}</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={row.provider} className="border-b border-[var(--color-border)]/60 last:border-b-0">
                    <th scope="row" className="px-2 py-1.5 text-start align-top font-semibold text-[var(--color-text-primary)]">
                      {row.url !== null ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="insights-focusable inline-flex items-baseline gap-0.5 font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
                        >
                          {row.name}
                          <ExternalLink aria-hidden size={11} strokeWidth={2} className="shrink-0 self-center" />
                        </a>
                      ) : (
                        row.name
                      )}
                      <span className="ms-1.5 whitespace-nowrap font-normal text-[var(--color-text-tertiary)]">
                        {interpolate(copy.ui.aboutSeriesCount, { n: num(row.seriesCount) })}
                      </span>
                      <span className="sr-only">, {levelTitle(row)}</span>
                    </th>
                    <td className="px-2 py-1.5 text-start align-top text-[var(--color-text-secondary)]">{row.attribution}</td>
                    <td className="px-2 py-1.5 text-start align-top text-[var(--color-text-secondary)]">
                      <ul className="m-0 list-none p-0">
                        {row.licences.map((licence) => (
                          <li key={licence}>{licence}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-2 py-1.5 text-start align-top">
                      <span
                        title={levelTitle(row)}
                        className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 font-bold text-[var(--color-text-secondary)]"
                      >
                        <bdi dir="ltr">{row.worstLevel}</bdi>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-start align-top text-[var(--color-text-secondary)]">{enabledWord(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile (<900px): the same fields, stacked — no horizontal
             * scroll (UI-52). */}
            <ul className="m-0 mt-1 grid list-none gap-1.5 p-0 min-[900px]:hidden">
              {sourceRows.map((row) => (
                <li key={row.provider} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 ring-1 ring-[var(--color-border)]">
                  <p className="m-0 font-semibold text-[var(--color-text-primary)]">
                    {row.url !== null ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insights-focusable inline-flex items-baseline gap-0.5 font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
                      >
                        {row.name}
                        <ExternalLink aria-hidden size={11} strokeWidth={2} className="shrink-0 self-center" />
                      </a>
                    ) : (
                      row.name
                    )}
                    <span className="ms-1.5 font-normal text-[var(--color-text-tertiary)]">
                      {interpolate(copy.ui.aboutSeriesCount, { n: num(row.seriesCount) })}
                    </span>
                  </p>
                  <p className="m-0 mt-0.5 text-[var(--color-text-secondary)]">{row.attribution}</p>
                  <p className="m-0 mt-0.5 text-[var(--color-text-secondary)]">
                    <span className="font-semibold">{copy.ui.aboutColLicence}: </span>
                    {row.licences.join(' · ')}
                  </p>
                  <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      title={levelTitle(row)}
                      className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 font-bold text-[var(--color-text-secondary)]"
                    >
                      <bdi dir="ltr">{row.worstLevel}</bdi>
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      <span className="font-semibold">{copy.ui.aboutColEnabled}: </span>
                      {enabledWord(row)}
                    </span>
                    <span className="sr-only">, {levelTitle(row)}</span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-1.5 text-[var(--color-text-tertiary)]">{copy.ui.aboutKillSwitchNote}</p>
          </div>
          ) : null}
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
            {/* UI-49(d): the rule version with the change log's PLAIN
             * repository path as text — the honest link to a file in the
             * repository this page ships from (no hosted URL invented). */}
            {snapshot?.ruleVersion !== undefined ? (
              <p className="m-0 mt-0.5" data-about-rule-version>
                <bdi>
                  {interpolate(copy.ui.aboutRuleVersionLine, {
                    v: num(snapshot.ruleVersion),
                    path: RULE_CHANGELOG_PATH,
                  })}
                </bdi>
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="m-0 mb-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
              {copy.ui.disclaimerTitle}
            </h3>
            <p className="m-0">{copy.ui.disclaimerBody1}</p>
            <p className="m-0">{copy.ui.disclaimerBody2}</p>
          </div>
          {/* M-7 (RULES §3) + UI-49(f): the contact line for data owners —
           * the owner's existing public contact surface; the URL stays
           * Latin inside the localized sentence. The template splits on its
           * single {url} placeholder so the URL itself renders as a real
           * link (both locales keep the placeholder). */}
          <p className="m-0 font-semibold text-[var(--color-text-secondary)]" data-about-contact>
            <bdi>
              {contactBefore}
              <a
                href={DATA_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="insights-focusable text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
              >
                {DATA_CONTACT_URL}
              </a>
              <span aria-hidden="true"> ↗</span>
              {contactAfter}
            </bdi>
          </p>
        </div>
      </div>
    </section>
  );
}
