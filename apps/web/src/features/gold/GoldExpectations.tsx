/**
 * GoldExpectations — GPE R28 / F24 + R29 / F25 (2026-11-19): the
 * expectations strip, Zone D's fourth element (docs/specs/
 * gold-page-elevation: s8/01 R28+R29 · s6/01 zone D · s6/03 zone D
 * "F24/F25 = ONE row" · the s15 M1 §7 S15-D1..D3 records).
 *
 * THE KALSHI LEG DOES NOT SHIP (S15-D1: the Developer Agreement v1.1
 * §3/§3.1 wording read — the card renders the POLYMARKET leg alone,
 * honestly named as ONE venue: display-only, attributed, linked, the
 * honest trader-expectations disclaimer; no key'd endpoints, no bulk
 * redistribution).
 *
 * THE CALENDAR JOIN (S15-D3): the top line reads the NEXT Fed event
 * from the in-repo calendar feed (the authority for dates — the same
 * insights snapshot the page already fetches; ZERO new fetches) and
 * the probabilities from the Polymarket snapshot; the two pair while
 * the market's event endDate is within ±45 days of the calendar's
 * date. A wider gap renders the two sources SEPARATELY, never a
 * wrong join. The GPE-S3-10 lesson renders as the event's own zone
 * named at point of use plus the reader-locale calendar rendering
 * (Jalali for fa) — the FEED carries dates + zones, never clock
 * times; no time is ever invented.
 *
 * The 390 rule: collapsed to ONE row — «بعدی: فدرال رزرو {date} ·
 * احتمال {move}: {pct}» with the timezone named; one tap expands the
 * probability rows + the calendar strip. Display-only: no meter
 * membership, no voter (s6/01 zone D's Supporting riders).
 */

import { useMemo, useState } from 'react';
import type { CalendarEvent } from '@currena/core';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import type { FedOutcomeMarket } from '@currena/core';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldExpectations } from './gold-expectations';

/** The move words (the dictionary's own keys — the fa side renders
 *  Persian; the wire's move enum maps here, total by construction). */
const MOVE_KEY: Readonly<Record<FedOutcomeMarket['move'], string>> = {
  hike50plus: 'pd.gold.expectMoveHike50plus',
  hike25: 'pd.gold.expectMoveHike25',
  hold: 'pd.gold.expectMoveHold',
  cut25: 'pd.gold.expectMoveCut25',
  cut50plus: 'pd.gold.expectMoveCut50plus',
};

/** The calendar's zone labels — EXACTLY the zones the feed carries
 *  (the NextUpStrip TZ_LABEL grammar; any other zone renders no label,
 *  never a guessed name). */
const TZ_KEY: Readonly<Record<string, string>> = {
  'America/New_York': 'pd.gold.calZoneNY',
  'Europe/Frankfurt': 'pd.gold.calZoneFrankfurt',
  'Australia/Sydney': 'pd.gold.calZoneSydney',
};

/** The strip's kinds (R29's scope: the next Fed/CPI events). */
const STRIP_KINDS: ReadonlySet<CalendarEvent['kind']> = new Set(['fed', 'us-cpi']);

/** The join window: the calendar's fed date and the market's endDate
 *  pair inside ±45 days; wider renders separately (S15-D3). */
const JOIN_WINDOW_DAYS = 45;

/** The calendar join (pure — exported for the test). */
export interface ExpectationsJoin {
  /** The calendar's next fed event (the date authority). */
  fedEvent: CalendarEvent | null;
  /** The leading outcome market (the highest implied probability). */
  leading: FedOutcomeMarket | null;
  /** True when the calendar's fed date and the market's event pair
   *  inside the join window (the top line may join them). */
  paired: boolean;
}

function daysBetween(aIsoDate: string, bIso: string): number {
  const a = Date.parse(`${aIsoDate}T00:00:00Z`);
  const b = Date.parse(bIso);
  return Math.abs(b - a) / 86_400_000;
}

export function expectationsJoin(
  markets: readonly FedOutcomeMarket[],
  endDate: string,
  calendar: readonly CalendarEvent[] | undefined,
  todayIso: string,
): ExpectationsJoin {
  const upcoming = (calendar ?? [])
    .filter((e) => e.kind === 'fed' && e.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));
  const fedEvent = upcoming[0] ?? null;
  const leading =
    markets.length > 0
      ? markets.reduce((best, m) => (m.yesPrice > best.yesPrice ? m : best), markets[0]!)
      : null;
  const paired = fedEvent !== null && daysBetween(fedEvent.date, endDate) <= JOIN_WINDOW_DAYS;
  return { fedEvent, leading, paired };
}

/** The days-from-today word (the NextUpStrip's when() grammar, the
 *  pd.gold dictionary's own words). */
function daysUntil(dateIso: string, todayIso: string): number {
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  const target = Date.parse(`${dateIso}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

export function GoldExpectations({ calendar }: { calendar?: readonly CalendarEvent[] }): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const state = useGoldExpectations();
  const [open, setOpen] = useState(false);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const join = useMemo(
    () =>
      state.kind === 'ready'
        ? expectationsJoin(state.snapshot.markets, state.snapshot.event.endDate, calendar, todayIso)
        : null,
    [state, calendar, todayIso],
  );
  /** The strip's next events (the fed + us-cpi kinds, the next two). */
  const strip = useMemo(
    () =>
      (calendar ?? [])
        .filter((e) => STRIP_KINDS.has(e.kind) && e.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 2),
    [calendar, todayIso],
  );

  const num = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 1 });
  const dateText = (dateIso: string): string =>
    locale === 'fa' ? formatJalaliDate(dateIso, 'fa-IR') : formatDateWords(dateIso, 'en-US');
  const whenText = (days: number): string => {
    if (days === 0) return t('pd.gold.calToday');
    if (days === 1) return t('pd.gold.calTomorrow');
    return interpolate(t('pd.gold.calDaysAway'), { n: formatNumber(days, numberLocale, { maximumFractionDigits: 0 }) });
  };

  /* ---------------- render ---------------- */

  if (state.kind === 'loading') {
    return (
      <section aria-label={t('pd.gold.expectTitle')} data-gold-expectations="loading" role="status" className="flex flex-col gap-1.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.expectTitle')}</h4>
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }

  if (state.kind === 'none') {
    return (
      <section aria-label={t('pd.gold.expectTitle')} data-gold-expectations="none" className="flex flex-col gap-1.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.expectTitle')}</h4>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-expect-unavailable>
          {t('pd.gold.expectUnavailable')}
        </p>
      </section>
    );
  }

  const snapshot = state.snapshot;
  const leading = join?.leading ?? null;
  const fedEvent = join?.fedEvent ?? null;
  const paired = join?.paired ?? false;

  const asOfDate = dateText(snapshot.fetchedAt.slice(0, 10));
  const asOfTime = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(snapshot.fetchedAt));

  return (
    <section aria-label={t('pd.gold.expectTitle')} data-gold-expectations className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60">
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.expectTitle')}</h4>
      {/* The 390 top line — ONE row, the timezone named at point of use
          (GPE-S3-10). Paired: the calendar's fed date + the leading
          probability. Unpaired: the calendar's fed date alone (the
          probability stays inside, named for its own event). */}
      {fedEvent !== null ? (
        <p className="m-0 text-[length:var(--type-label)] leading-snug text-[var(--color-text-secondary)]" data-expect-topline>
          <bdi>
            {leading !== null && paired
              ? interpolate(t('pd.gold.expectTopLine'), {
                  date: dateText(fedEvent.date),
                  move: t(MOVE_KEY[leading.move] as never),
                  pct: `${num(leading.yesPrice * 100)}%`,
                })
              : interpolate(t('pd.gold.expectTopLineNoMarket'), { date: dateText(fedEvent.date) })}
          </bdi>{' '}
          <span className="text-[var(--color-text-tertiary)]">
            <bdi>{t('pd.gold.calZoneNY')}</bdi>
          </span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-caption)] font-semibold text-currena-blue"
      >
        <span>{open ? t('pd.gold.expectHide') : t('pd.gold.expectShow')}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? (
        <div className="flex min-w-0 flex-col gap-2" data-expect-detail>
          {/* The five outcome rows — the venue's own implied probabilities,
              the move word bilingual, the leading row emphasized. */}
          <ul className="m-0 flex list-none flex-col gap-1 p-0" data-expect-markets>
            {snapshot.markets.map((m) => {
              const isLeading = leading !== null && m.move === leading.move;
              return (
                <li
                  key={m.slug}
                  data-expect-row={m.slug}
                  data-expect-leading={isLeading ? 'true' : undefined}
                  className={`flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] px-1.5 py-1 ${isLeading ? 'bg-currena-blue/10' : ''}`}
                >
                  <span className="flex min-w-0 items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                      <bdi>{t(MOVE_KEY[m.move] as never)}</bdi>
                    </span>
                    <span className="shrink-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
                      <bdi dir="ltr">{num(m.yesPrice * 100)}%</bdi>
                    </span>
                  </span>
                  {/* GUX-S7 M4 (12 §3.3 row 4): the ProbabilityRow — the
                   * venue's own implied probability as a thin 0-100 bar,
                   * neutral analytical ink (a probability is not a
                   * support/pressure — never a market hue). The text
                   * beside it stays the statement; the bar is the
                   * at-a-glance reading. Fail-closed: no clamping tricks
                   * — an out-of-domain reading renders past the end,
                   * the % text always tells the truth. */}
                  <span
                    dir="ltr"
                    role="img"
                    aria-label={`${t(MOVE_KEY[m.move] as never)}: ${num(m.yesPrice * 100)}%`}
                    data-expect-prob-row
                    data-expect-prob-pct={m.yesPrice * 100}
                    className="relative block h-1 w-full rounded-full bg-[var(--color-border)]/60"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 start-0 rounded-full bg-[var(--color-text-secondary)]"
                      style={{ width: `${Math.min(Math.max(m.yesPrice * 100, 0), 100)}%` }}
                      data-expect-prob-fill
                    />
                  </span>
                </li>
              );
            })}
          </ul>
          {/* The event line + the honest disclaimers + the as-of stamp. */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-expect-event>
            <bdi>{interpolate(t('pd.gold.expectEventLine'), { title: snapshot.event.title, date: dateText(snapshot.event.endDate.slice(0, 10)) })}</bdi>
          </p>
          {paired ? null : (
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-expect-mismatch>
              <bdi>{t('pd.gold.expectMismatchNote')}</bdi>
            </p>
          )}
          <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-expect-disclaimer>
            <bdi>{t('pd.gold.expectDisclaimer')}</bdi>
          </p>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-expect-source>
            <bdi>{t('pd.gold.expectVenue')}</bdi>{' '}
            <a href={snapshot.event.url} target="_blank" rel="noopener noreferrer" className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
              {t('pd.gold.expectLink')}
            </a>
          </p>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-expect-asof>
            <bdi>{interpolate(t('pd.gold.expectAsOf'), { date: asOfDate, time: asOfTime })}</bdi>
          </p>
          {/* R29 — the calendar strip: the next Fed/CPI events, the
              zone named at point of use, the reader-locale calendar
              rendering (Jalali for fa — the GPE-S3-10 application), the
              days-away word. Zero new fetches (the same snapshot's
              calendar field). */}
          {strip.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-1 border-t border-[var(--color-border)]/60 pt-1.5" data-expect-calendar>
              <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.calNextTitle')}</h5>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {strip.map((e) => {
                  const zoneKey = e.tz !== undefined ? TZ_KEY[e.tz] : undefined;
                  const zone = zoneKey !== undefined ? t(zoneKey as never) : null;
                  const days = daysUntil(e.date, todayIso);
                  return (
                    <li key={`${e.id}-${e.date}`} className="m-0 flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                      <span className="min-w-0 font-semibold">
                        <bdi>{locale === 'fa' ? e.titleFa : e.titleEn}</bdi>
                      </span>
                      <span className="shrink-0 text-[var(--color-text-tertiary)]">
                        <bdi>{dateText(e.date)}</bdi>
                        {zone !== null ? (
                          <>
                            {' · '}
                            <bdi>{zone}</bdi>
                          </>
                        ) : null}
                        {' · '}
                        <bdi>{whenText(days)}</bdi>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
