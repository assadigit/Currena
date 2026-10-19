/**
 * InsightsHeader — the Insights page header: the title/subtitle/"Data as of"
 * line, the data-health chip (v3 UI-50), the R15 Tools disclosure (search,
 * tier filter, shortcuts, .ics / CSV downloads + the owner-tools unlock)
 * and the owner-only export menu (v3 UI-51 + RULES M-3).
 *
 * v3 UI_SPEC §10 (2026-10-20, PH6-C):
 *   - DATA-HEALTH CHIP beside "Data as of" — computed from the page's own
 *     readings (data-health.ts): "All data current" / "N stale" /
 *     "N unavailable", worst wins, both counts in the title when both
 *     exist; it jumps to the About section. Word + icon, never colour
 *     alone; static per snapshot (no aria-live).
 *   - OWNER-ONLY EXPORT — the DataExportMenu (client builders) renders ONLY
 *     when the visitor is the owner: (a) the page serves a PRIVATE snapshot
 *     (displayMode !== 'public' — the 200/401 gate flip already implies
 *     the owner), or (b) the signed owner-session cookie verifies against
 *     GET /api/insights/export?format=json (probed when the Tools menu
 *     opens; 401/403 keep the menu hidden) or POST /api/insights/owner/
 *     session returned 200 for a pasted Bearer token. The token is never
 *     stored beyond the HttpOnly cookie, never logged, and the input
 *     clears after submit. Sign-out hides the owner surface until the next
 *     sign-in (the cookie itself is HttpOnly — only the server can clear
 *     it; the 12-hour expiry is the fallback, so a local suppression flag
 *     keeps the probe from re-unlocking it).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { Locale } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { ToolsMenu, type OwnerSignInResult } from '../../components/insights/ToolsMenu';
import { DataExportMenu } from '../../components/insights/DataExportMenu';
import type { ExportFormat } from '../../components/insights/full-export';
import type { MarketsLoadState } from '../../components/insights/WorldMarkets';
import type { FxLoadState } from '../../components/insights/WorldCurrencies';
import { statusCounts, type StatusFilter } from '../../components/insights/config';
import type { I18nApi } from '../../lib/locale';
import type { LoadState } from './InsightsStatusBlocks';
import { dataHealthOf, type DataHealth, type DataHealthKind } from './data-health';

/**
 * The owner-session suppression flag: set on sign-out so the export probe
 * does not immediately re-unlock the still-valid HttpOnly cookie (only the
 * server can clear it; there is no sign-out endpoint — the 12h TTL is the
 * backstop). Cleared on the next successful sign-in.
 */
const OWNER_SIGNED_OUT_KEY = 'currena.insights.owner-signed-out.v1';

function ownerSignedOutSuppressed(): boolean {
  try {
    return window.localStorage.getItem(OWNER_SIGNED_OUT_KEY) === '1';
  } catch {
    return false; // storage unavailable — behave like a fresh visit
  }
}

/** The chip's icon shape — the page's own state shapes (StatusChip), 16px. */
function HealthIcon({ kind }: { kind: DataHealthKind }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (kind === 'all-current') {
    // All data current: the check (spec §4 "Normal" shape)
    return (
      <svg {...common}>
        <path d="M2.8 8.4l3.4 3.4L13.2 4.4" />
      </svg>
    );
  }
  if (kind === 'stale') {
    // Stale: the clock (spec §4)
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.2" />
        <path d="M8 4.6V8l2.4 1.6" />
      </svg>
    );
  }
  // Unavailable: the dashed circle (spec §4) — same shape as the cards
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.2" strokeDasharray="2.4 2.2" />
      <path d="M8 7.4v3" />
      <path d="M8 5.2h.01" />
    </svg>
  );
}

/** The chip's tone — the page's own chip classes (UI-15 measured inks). */
const HEALTH_TONE: Record<DataHealthKind, string> = {
  'all-current': 'chip-success',
  stale: 'chip-watch',
  unavailable: 'chip-muted',
};

export function InsightsHeader({
  t,
  copy,
  locale,
  numberLocale,
  state,
  toolsOpen,
  setToolsOpen,
  statusFilter,
  setStatusFilter,
  query,
  setQuery,
  searchInputRef,
  toolsButtonRef,
  marketsState,
  downloadMarketsCsv,
  fxState,
  downloadFxCsv,
  onJumpAbout,
}: {
  t: I18nApi['t'];
  copy: InsightsCopy;
  locale: Locale;
  numberLocale: 'en-US' | 'fa-IR';
  state: LoadState;
  toolsOpen: boolean;
  setToolsOpen: (open: boolean) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  query: string;
  setQuery: (query: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  toolsButtonRef: RefObject<HTMLButtonElement | null>;
  marketsState: MarketsLoadState;
  downloadMarketsCsv: () => void;
  fxState: FxLoadState;
  downloadFxCsv: () => void;
  /** UI-50: the health chip jumps to the About section (route's jumpAbout). */
  onJumpAbout: () => void;
}) {
  // R15 → round 33: BOTH dedicated sections render on the page now, so the
  // Tools counts describe everything on screen (the whole snapshot again —
  // the old lane-scoped counts belonged to the removed switcher).
  const laneCounts = useMemo(() => {
    if (state.kind !== 'ready') return { all: 0, warning: 0, unusual: 0, normal: 0, context: 0 };
    return statusCounts(state.snapshot.readings);
  }, [state]);

  // H4/R12: "Data as of {date}" — the unambiguous word-date (no seconds:
  // a daily snapshot) with the relative age beside it. Step-1 G7: the live
  // prices' own clock rides beside it when the serve-time overlay stamped
  // one ("prices updated HH:MM") — the honest "daily snapshot + hourly
  // prices" story in one line.
  const dataAsOfLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText = locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDateWords(iso, 'en-US');
    const pricesIso = state.snapshot.pricesAsOf;
    // Fix spec B-08 (2026-10-14): the time carries its time ZONE — the
    // quotes are stamped in UTC (shown in the details), never a naked clock.
    // 2026-10-16 quirk pass: fa now uses the MINUTE-precision clock
    // (withClock) instead of the second-stamped withTime — the en line
    // renders hour:minute, and fa showing ۱۰:۱۳:۱۷ against en "10:13 am"
    // read as two different precisions of the same number. LiveRates and
    // the convert result popup keep the second-stamped withTime (both
    // locales show seconds there — consistency is per-surface).
    const pricesText =
      pricesIso !== undefined
        ? locale === 'fa'
          ? `${formatJalaliDate(pricesIso, 'fa-IR', { withClock: true })} (UTC)`
          : `${new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesIso))} UTC`
        : null;
    return {
      date: dateText,
      prices: pricesText,
      tooltip: copy.ui.dataAsOfTooltip,
    };
  }, [state, locale, copy.ui.dataAsOfTooltip]);

  // v3 UI-50: the data-health chip — from the page's OWN readings.
  const health = useMemo<DataHealth | null>(() => {
    if (state.kind !== 'ready') return null;
    return dataHealthOf(state.snapshot.readings);
  }, [state]);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  /* ------------------ v3 UI-51: the owner gating ------------------ */

  // The export menu's own disclosure state (declared here so sign-out can
  // close it — see ownerSignOut below).
  const [exportOpen, setExportOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);

  // (a) A PRIVATE snapshot implies the owner: the 200/401 gate flip already
  // told us this visitor holds a session in private mode.
  const ownerImplied = state.kind === 'ready' && state.snapshot.displayMode !== 'public';
  // (b) The signed owner-session cookie, verified by the probe or the
  // sign-in POST.
  const [ownerCookie, setOwnerCookie] = useState(false);
  const ownerVisible = ownerImplied || ownerCookie;
  // One probe per mount (re-arms after sign-out clears its suppression? no:
  // while the sign-out flag is set the cookie is deliberately ignored).
  const probeDone = useRef(false);
  const suppressProbe = useRef(false);
  useEffect(() => {
    suppressProbe.current = ownerSignedOutSuppressed();
  }, []);

  // The lightweight gating probe (the brief's page-load decision): when the
  // Tools menu first opens and the visitor is not already an implied owner,
  // GET /api/insights/export?format=json with the cookie rides along
  // (same-origin fetch sends it); 200 → the export menu appears, 401/403
  // (or any non-200, e.g. Phase 9's not-yet-wired route) → stays hidden.
  // The probe only needs the STATUS — the response body (a full export
  // JSON) is cancelled unread, so the probe stays lightweight.
  useEffect(() => {
    if (!toolsOpen || ownerImplied || ownerCookie || probeDone.current || suppressProbe.current) return;
    probeDone.current = true;
    let cancelled = false;
    fetch('/api/insights/export?format=json')
      .then((res) => {
        res.body?.cancel().catch(() => {
          /* the body may already be fully received — nothing to do */
        });
        if (!cancelled && res.ok) setOwnerCookie(true);
      })
      .catch(() => {
        /* offline/probe failure — the menu simply stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [toolsOpen, ownerImplied, ownerCookie]);

  // The owner sign-in: POST /api/insights/owner/session with the pasted
  // Bearer token (the ToolsMenu owns the input + clears it after submit;
  // the token never reaches storage, a log, or state beyond this request).
  const ownerSignIn = useCallback(async (token: string): Promise<OwnerSignInResult> => {
    if (token.trim() === '') return 'wrong';
    try {
      const res = await fetch('/api/insights/owner/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        try {
          window.localStorage.removeItem(OWNER_SIGNED_OUT_KEY);
        } catch {
          /* privacy mode — session-only is fine */
        }
        suppressProbe.current = false;
        setOwnerCookie(true);
        return 'ok';
      }
      if (res.status === 403) return 'disabled'; // owner_disabled: the secret is unset
      if (res.status === 401) return 'wrong'; // wrong token
      return 'failed';
    } catch {
      return 'failed';
    }
  }, []);

  // Sign-out hides the owner surface until the next explicit sign-in. The
  // HttpOnly session cookie itself can only be cleared by the server (there
  // is no sign-out endpoint; it expires by itself within 12h), so the local
  // suppression flag keeps the probe from re-unlocking it — documented, not
  // secret: the export stays reachable again after the next sign-in.
  const ownerSignOut = useCallback(() => {
    setOwnerCookie(false);
    setExportOpen(false);
    try {
      window.localStorage.setItem(OWNER_SIGNED_OUT_KEY, '1');
    } catch {
      /* privacy mode — session-only suppression */
    }
    suppressProbe.current = true;
  }, []);

  // Downloads (R15: they live in Tools now).
  const downloadCsv = useCallback(() => {
    if (state.kind !== 'ready') return;
    void import('../../components/insights/insights-csv').then(({ buildInsightsCsv, insightsCsvFilename }) => {
      const csv = buildInsightsCsv(state.snapshot, copy);
      void import('../../lib/download').then(({ downloadBlob }) => {
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), insightsCsvFilename(state.snapshot.generatedAt));
      });
    });
  }, [state, copy]);

  const downloadIcs = useCallback(() => {
    if (state.kind !== 'ready') return;
    void Promise.all([import('../../components/insights/ics'), import('../../lib/download')]).then(
      ([{ buildInsightsIcs }, { downloadBlob }]) => {
        const ics = buildInsightsIcs(state.snapshot.calendar, locale);
        downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'currena-insights-calendar.ics');
      },
    );
  }, [state, locale]);

  // The one-file "download all data" export (owner request 2026-10-16):
  // every section of the page in one MD / TXT / CSV / XLSX file. The whole
  // builder module is dynamically imported, so the Insights page chunk
  // never carries it; the export uses the same in-memory snapshots the
  // page renders (snapshot + the two world feeds when they are ready).
  const downloadAll = useCallback(
    (format: ExportFormat) => {
      if (state.kind !== 'ready') return;
      void import('../../components/insights/full-export').then(async ({ buildInsightsExportFile, insightsExportFilename }) => {
        const file = await buildInsightsExportFile(
          {
            snapshot: state.snapshot,
            copy,
            locale,
            title: t('insights.title'),
            markets: marketsState.kind === 'ready' ? marketsState.snapshot : null,
            fx: fxState.kind === 'ready' ? fxState.snapshot : null,
          },
          format,
        );
        const { downloadBlob } = await import('../../lib/download');
        downloadBlob(file.blob, insightsExportFilename(state.snapshot.generatedAt, file.ext));
      })
        .catch((err: unknown) => {
          // Never a silent nothing-downloaded again (the 2026-10-18 export
          // finding): the failure is at least loud in the console.
          console.error('insights full export failed', err);
        });
    },
    [state, copy, locale, t, marketsState, fxState],
  );

  /** The chip's visible word + count. */
  const healthWord = (): { key: 'healthAllCurrent' | 'healthStaleChip' | 'healthUnavailableChip'; n: number } => {
    if (health === null) return { key: 'healthAllCurrent', n: 0 };
    if (health.kind === 'unavailable') return { key: 'healthUnavailableChip', n: health.unavailable };
    if (health.kind === 'stale') return { key: 'healthStaleChip', n: health.stale };
    return { key: 'healthAllCurrent', n: 0 };
  };

  return (
    <header className="mb-7">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          {/* Real spec §5 (2026-10-17): the page title targets 24–28px mobile
           * / 32–36px desktop, weight 700 — and the header separates from the
           * cards by ~28–36px (mb-7 = 28px; the mb-3 was 12px). Editorial
           * handoff (§5): the title speaks the navy print ink (--ei-navy),
           * the same ink as the region card headings — weight and spacing
           * carry the hierarchy, not many colors. UI-fidelity round
           * (2026-10-19): the owner's correction brief asks the header to
           * read like the reference's dominant editorial title — 34px
           * desktop (still inside the spec's 32–36px band). */}
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[var(--ei-navy)] sm:text-[2.125rem] sm:leading-[2.55rem]">{t('insights.title')}</h1>
          <p className="mt-1 mb-0 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.subtitle}</p>
          {dataAsOfLine ? (
            <p
              className="mt-1 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]"
              title={dataAsOfLine.tooltip}
            >
              <bdi>
                {interpolate(copy.ui.dataAsOf, { date: dataAsOfLine.date })}
                {dataAsOfLine.prices !== null ? (
                  <span className="opacity-80"> · {interpolate(copy.ui.pricesUpdated, { time: dataAsOfLine.prices })}</span>
                ) : null}
                <span aria-hidden="true"> ⓘ</span>
              </bdi>
              <span className="sr-only">, {dataAsOfLine.tooltip}</span>
              {/* v3 UI-50: the data-health chip — worst wins; the title
               * carries the stale count when both groups exist. Static per
               * snapshot: no aria-live (it never updates on the page). */}
              {health !== null ? (
                <button
                  type="button"
                  onClick={onJumpAbout}
                  data-health-kind={health.kind}
                  title={
                    health.kind === 'unavailable' && health.stale > 0
                      ? interpolate(copy.ui.healthTitleBoth, { stale: num(health.stale), unavailable: num(health.unavailable) })
                      : undefined
                  }
                  className={`insights-focusable -my-1.5 inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-full border-0 px-2 py-1 text-[0.72rem] font-bold ${HEALTH_TONE[health.kind]}`}
                >
                  <HealthIcon kind={health.kind} />
                  {interpolate(copy.ui[healthWord().key], { n: num(healthWord().n) })}
                  <span className="sr-only"> · {copy.ui.healthChipHint}</span>
                </button>
              ) : null}
            </p>
          ) : null}
        </div>
        {/* R15: ONE Tools disclosure — search, filter, shortcuts, .ics, CSV,
            the owner-tools unlock. Beside it, the owner-only one-file
            "download all data" export (2026-10-16 owner request; v3 UI-51:
            rendered ONLY when the owner surface is unlocked — M-3). */}
        {state.kind === 'ready' ? (
          <div className="flex flex-wrap items-start gap-2">
            {ownerVisible ? (
              <DataExportMenu copy={copy} open={exportOpen} onOpenChange={setExportOpen} buttonRef={exportButtonRef} onPick={downloadAll} />
            ) : null}
            <ToolsMenu
              copy={copy}
              numberLocale={numberLocale}
              open={toolsOpen}
              onOpenChange={setToolsOpen}
              counts={laneCounts}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              query={query}
              onQueryChange={setQuery}
              searchInputRef={searchInputRef}
              buttonRef={toolsButtonRef}
              onDownloadCsv={downloadCsv}
              onDownloadIcs={downloadIcs}
              onDownloadMarketsCsv={marketsState.kind === 'ready' ? downloadMarketsCsv : undefined}
              onDownloadFxCsv={fxState.kind === 'ready' ? downloadFxCsv : undefined}
              ownerSignedIn={ownerCookie}
              onOwnerSignIn={ownerSignIn}
              onOwnerSignOut={ownerSignOut}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
