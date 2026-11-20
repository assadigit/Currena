/**
 * GoldTimeMachine — GPE R31 / F12 (2026-11-19, S17): the gold meter's
 * TIME MACHINE, Zone C's collapsed Advanced control (docs/specs/
 * gold-page-elevation: s8/01 R31 · s6/01 zone 4 "the F12 time-machine
 * control (Advanced, collapsed affordance)" · s6/03 zone C · s7/03 §3.4
 * THE METER-ERA BOUNDARY (binding) · the s17 M1 §6 S17-D6 record).
 *
 * The D7-locked minimal sizing (CP-C D7): a date-parameterized,
 * READINGS-ONLY projection — the picked day's beam, lane counts and
 * lane readings under the THEN-CURRENT versioned voter table, NO
 * historical narrative or outlook re-derivation. THE ONLY
 * historical-meter surface; the 2016+ meter-era boundary NEVER crossed
 * (the picker's own min + the route's own rejection — both honest).
 *
 * The 390 rule (s6/01 §3): collapsed on desktop AND 390 — the daily
 * reader pays nothing; one tap expands the control. The verdict + lane
 * words are the hero's own corpus-pinned vocabulary (heroVerdict* +
 * laneState* + heroCount* — never a parallel dictionary). The
 * provenance line renders the two-row honesty story at point of use
 * ('backfill' — reconstructed from the stored series, the published
 * backtest's own machinery · 'live' — the day's own snapshot, the
 * page's plane).
 *
 * Display-only: no meter membership, no voter, no forecast.
 */

import { useMemo, useState } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import type { GoldMeterResponse, GoldMeterTableRow } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { cachedGoldMeterRow, fetchGoldMeterRow } from './gold-meter';
import { LaneBar, type LaneBarData } from './LaneBar';

/** The whole-balance verdict word keys — the hero's own. */
const VERDICT_KEY: Record<string, TranslationKey> = {
  'tipped-for': 'pd.gold.heroVerdictFor',
  'tipped-against': 'pd.gold.heroVerdictAgainst',
  level: 'pd.gold.heroVerdictBalanced',
  none: 'pd.gold.heroVerdictNone',
};

type QueryState =
  | { kind: 'idle' }
  | { kind: 'loading'; date: string }
  | { kind: 'ready'; response: GoldMeterResponse }
  | { kind: 'unavailable'; date: string };

export function GoldTimeMachine(): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<QueryState>({ kind: 'idle' });

  // The era boundary + today — the picker's own honest bounds. The era
  // start is the wire contract's own constant (the card teaches itself
  // from the first response; before that, the compiled-in bound keeps
  // the picker honest — the route re-asserts it server-side anyway).
  const eraStart = query.kind === 'ready' ? query.response.meta.eraStart : '2016-11-01';
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  const dayText = (day: string): string =>
    locale === 'fa' ? formatJalaliDate(`${day}T00:00:00Z`, 'fa-IR') : formatDateWords(`${day}T00:00:00Z`, 'en-US');

  const ask = (date: string): void => {
    if (date === '') return;
    setQuery({ kind: 'loading', date });
    const cached = cachedGoldMeterRow(date);
    if (cached !== null) {
      setQuery({ kind: 'ready', response: cached });
      return;
    }
    void fetchGoldMeterRow(date).then((response) => {
      if (response === null) {
        setQuery({ kind: 'unavailable', date });
        return;
      }
      setQuery({ kind: 'ready', response });
    });
  };

  const row: GoldMeterTableRow | null = query.kind === 'ready' ? query.response.row : null;

  return (
    <div
      data-gold-time-machine
      className="mt-2.5 flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/50"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-start"
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <CalendarClock className="size-4 shrink-0 self-center text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <bdi className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.tmTitle')}</bdi>
        </span>
        <bdi className="min-w-0 flex-1 text-end text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">
          {t('pd.gold.tmSubtitle')}
        </bdi>
        <ChevronDown className={`size-4 shrink-0 self-center text-currena-blue transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-2" data-tm-body>
          {/* THE METER-ERA BOUNDARY (s7/03 §3.4, binding — taught, not hidden). */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-tm-era-note>
            <bdi>{t('pd.gold.tmEraNote')}</bdi>
          </p>

          {/* The date picker — the D7 minimal control (min = the era
              boundary, max = today; the route re-asserts both). */}
          <label className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{t('pd.gold.tmPickLabel')}</span>
            <input
              type="date"
              min={eraStart}
              max={today}
              onChange={(event) => ask(event.currentTarget.value)}
              className="insights-focusable min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-[length:var(--type-label)] tabular-nums text-[var(--color-text-primary)]"
              data-tm-date-input
            />
          </label>

          {query.kind === 'loading' ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]" role="status" data-tm-loading>
              {t('pd.gold.tmLoading')}
            </p>
          ) : null}

          {query.kind === 'unavailable' ? (
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-tm-unavailable>
              <bdi>{interpolate(t('pd.gold.tmUnavailable'), { date: dayText(query.date) })}</bdi>
            </p>
          ) : null}

          {query.kind === 'ready' && row === null ? (
            /* The honest gap — a day with no stored reading (the archive
             * has not reached it or the rung has not landed it). */
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-tm-no-row>
              <bdi>{interpolate(t('pd.gold.tmNoRow'), { date: dayText(query.response.requestedDate) })}</bdi>
            </p>
          ) : null}

          {query.kind === 'ready' && row !== null ? (
            <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2" data-tm-row>
              {/* The as-of line: the row's OWN date (honestly named when
                  the picked day maps back to the last reading day). */}
              <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-snug text-[var(--color-text-secondary)]" data-tm-as-of>
                <bdi>
                  {interpolate(
                    t(row.date === query.response.requestedDate ? 'pd.gold.tmAsOfExact' : 'pd.gold.tmAsOfBefore'),
                    row.date === query.response.requestedDate
                      ? { date: dayText(row.date) }
                      : { row: dayText(row.date), picked: dayText(query.response.requestedDate) },
                  )}
                </bdi>
              </p>

              {/* The verdict word + the counts line — the hero's own
                  vocabulary, the s7/03 §2.4 one-truth rule. */}
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5" data-tm-verdict>
                <bdi className={`text-[length:var(--type-label)] font-bold ${row.state === 'tipped-for' ? 'text-[var(--color-status-normal)]' : row.state === 'tipped-against' ? 'text-[var(--color-status-alert)]' : 'text-[var(--color-text-primary)]'}`}>
                  {t(VERDICT_KEY[row.state]!)}
                </bdi>
                <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                  {[
                    interpolate(t('pd.gold.heroCountFor'), { n: num(row.counts.for) }),
                    interpolate(t('pd.gold.heroCountAgainst'), { n: num(row.counts.against) }),
                    ...(row.counts.neutral > 0 ? [interpolate(t('pd.gold.heroCountNotLeaning'), { n: num(row.counts.neutral) })] : []),
                    ...(row.counts.unread > 0 ? [interpolate(t('pd.gold.heroCountUnread'), { n: num(row.counts.unread) })] : []),
                  ].join(' · ')}
                </bdi>
              </p>

              {/* GUX-S7 M3 (12 §3.3 row 8): the five lanes render as
               * compact LaneBar rows — the SAME lane grammar the live
               * page wears (one system across time; the picked day and
               * today can be read with the same eye). The wire's own
               * counts feed the bars; steady = readable − firing (the
               * wire's own complement, never re-derived). */}
              <ul className="m-0 flex list-none flex-col gap-1 p-0" data-tm-lanes>
                {row.lanes.map((lane) => {
                  const bar: LaneBarData = {
                    lane: lane.lane,
                    side: lane.side,
                    split: lane.split,
                    supports: lane.supports,
                    pressures: lane.pressures,
                    steady: Math.max(lane.readable - lane.firing, 0),
                    unread: 0,
                  };
                  return (
                    <li key={lane.lane} data-tm-lane={lane.lane} data-tm-lane-side={lane.side}>
                      <LaneBar data={bar} />
                    </li>
                  );
                })}
              </ul>

              {/* The versioned table + the provenance — the honesty lines
                  rendered at point of use (S17-D2/D1). */}
              <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-tm-version>
                <bdi>
                  {interpolate(t('pd.gold.tmVersionLine'), {
                    version: row.tableVersion,
                    seats: num(query.response.meta.tableVersions.find((v) => v.id === row.tableVersion)?.seats ?? 0),
                  })}
                </bdi>
              </p>
              <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-tm-provenance={row.source}>
                <bdi>{t(row.source === 'backfill' ? 'pd.gold.tmProvenanceBackfill' : 'pd.gold.tmProvenanceLive')}</bdi>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
