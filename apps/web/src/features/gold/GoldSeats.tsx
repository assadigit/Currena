/**
 * GoldSeats — the five-force overview, REBUILT (GUX-S5 M4, 11 §5.3/§7
 * + 12 §2 + the F-04 fix): each lane renders as ONE LaneBar summary
 * (the M2 primitive — the ONE lane renderer, everywhere) above its
 * CLOSED member cards (the 11 §7.3 anatomy: plainLabel · state word in
 * impact ink · the mark · the 09 defaultCopy · the AsOfChip — complete
 * without opening anything), every card opening the GoldRecordSheet
 * (the 09 expanded + technical tiers, the lazy deep content).
 *
 * WHAT THIS REPLACES (the F-04 fix executed): the always-visible
 * 37-chip wall — mostly-steady chips the visitor had to interpret to
 * find the conclusion. The lane SUMMARY now answers "how does this
 * force lean" at a glance (the LaneBar's state word + stacked pill +
 * tally); the member cards carry the honest per-seat detail at the
 * default tier (the mark + the 09 record's own plain words), one tap
 * from the full record.
 *
 * WHAT SURVIVES VERBATIM: the R10 anchor contract (`lane-{lane}` ids +
 * `#gold-seats` + the CompositionStack's ledger link target); the
 * GPE-S2-18 name-match rule on every seat link; the GPE R04 why-lines
 * under dark seats; the R05 adjacent-months method label; the R17 keep
 * (no lane intro/tally chrome — the LaneBar carries the summary now);
 * the corpus-pinned vocabulary (the copy-pin test still pins every
 * word). The seat links keep their card-level cross-page behavior; the
 * CARD (not the link) is the record-sheet opener (11 §7.2).
 */

import { Suspense, lazy, useMemo, useState } from 'react';
import type { GoldLane } from '@currena/insights';
import type { IndicatorReading } from '@currena/core';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { navigate } from '../../router';
import type { TranslationKey } from '../../shared/lib/locale';
import {
  GOLD_SEAT_DEST_NAME_KEY,
  seatAnchorHref,
  seatUnreadWhy,
  type GoldSeat,
  type GoldSeatLane,
  type GoldVoterId,
  type SeatUnreadCause,
} from './gold-tiles';
import { yoyGapBaseLabel } from '../../shared/lib/yoy-gap';
import { stageAnchorScroll } from '../../shared/lib/anchor-scroll';
import { LaneBar, laneBarDataOfSeatLane } from './LaneBar';
import { SeatMark } from './SeatMark';
/* GUX-S5 M4 (the raw-budget split): the sheet's chrome rides its OWN
 * lazy chunk — the opener's first click pays for it together with the
 * deep content (one load, one wait); the 37 closed cards stay eager. */
const GoldRecordSheet = lazy(() => import('./GoldRecordSheet').then((m) => ({ default: m.GoldRecordSheet })));
import type { GoldRecordSheetState } from './GoldRecordSheet';
import { goldBrief } from './content/gold-content';
import { AsOfChip, type AsOfState } from './AsOfChip';

/* The lane copy keys — five lanes, the corpus's own names + intros.
 * S6: exported for the hero's classic balance view (the same lane
 * labels feed the stage's weights — one map, never restated). */
export const LANE_TITLE_KEY: Readonly<Record<GoldLane, TranslationKey>> = {
  'borrowing-costs': 'pd.gold.laneBorrowingCosts',
  dollar: 'pd.gold.laneDollar',
  stress: 'pd.gold.laneStress',
  inflation: 'pd.gold.laneInflation',
  flows: 'pd.gold.laneFlows',
};

const LANE_INTRO_KEY: Readonly<Record<GoldLane, TranslationKey>> = {
  'borrowing-costs': 'pd.gold.laneIntroBorrowingCosts',
  dollar: 'pd.gold.laneIntroDollar',
  stress: 'pd.gold.laneIntroStress',
  inflation: 'pd.gold.laneIntroInflation',
  flows: 'pd.gold.laneIntroFlows',
};

export { LANE_INTRO_KEY };

/* The seat lean words + tones — the balance's own vocabulary. */
const SEAT_LEAN_KEY: Record<GoldSeat['impact'], TranslationKey> = {
  supports: 'pd.gold.seatSupports',
  pressures: 'pd.gold.seatPressures',
  steady: 'pd.gold.seatSteady',
  unread: 'pd.gold.seatUnread',
};

const SEAT_LEAN_TONE: Record<GoldSeat['impact'], string> = {
  supports: 'text-[var(--color-status-normal)]',
  pressures: 'text-[var(--color-status-alert)]',
  steady: 'text-[var(--color-text-secondary)]',
  unread: 'text-[var(--color-text-tertiary)]',
};

/* GPE R04 (F16a): the why-unread lines' copy keys — one per cause class
 * (the S2 §3 decomposition). The upstream-stopped line's {month} is the
 * reading's own asOf, formatted in the page's calendar (Jalali in fa). */
const SEAT_WHY_KEY: Readonly<Record<SeatUnreadCause, TranslationKey>> = {
  'upstream-stopped': 'pd.gold.seatWhyUpstreamStopped',
  'upstream-gap': 'pd.gold.seatWhyUpstreamGap',
  'pipeline-lag': 'pd.gold.seatWhyPipelineLag',
  'rule-driven': 'pd.gold.seatWhyRuleDriven',
};

/** The dark seat's why-line text — the cause class's sentence, the
 * upstream-stopped month formatted in the page's own calendar. */
function seatWhyText(
  cause: SeatUnreadCause,
  month: string | undefined,
  t: ReturnType<typeof useI18n>['t'],
  numberLocale: 'en-US' | 'fa-IR',
): string {
  if (month === undefined) return t(SEAT_WHY_KEY[cause]);
  const monthText = new Intl.DateTimeFormat(numberLocale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}T00:00:00Z`));
  return interpolate(t(SEAT_WHY_KEY[cause]), { month: monthText });
}

const EVIDENCE_KEY: Readonly<Record<'rising' | 'falling' | 'high' | 'low', TranslationKey>> = {
  rising: 'pd.gold.evidenceRising',
  falling: 'pd.gold.evidenceFalling',
  high: 'pd.gold.evidenceHigh',
  low: 'pd.gold.evidenceLow',
};

export { EVIDENCE_KEY };

/* GPE R11: exported for the daily narrative (Zone D) — the family lines
 * render the seats section's OWN state words, byte-identical (the
 * one-projection consistency rule, s7/03 §2.4). */
export const LANE_STATE_KEY: Readonly<Record<GoldSeatLane['side'], TranslationKey>> = {
  for: 'pd.gold.laneStateFor',
  against: 'pd.gold.laneStateAgainst',
  neutral: 'pd.gold.laneStateNeutral',
  unread: 'pd.gold.laneStateUnread',
};

/** The voter-name dictionary key for a seat id (37 literal keys — the
 *  copy-pin test iterates GOLD_VOTER_IDS and proves every key exists and
 *  matches the corpus). S6: exported for the hero's classic balance view
 *  (the stage's member rows carry the same names). */
export const VOTER_NAME_KEY: Readonly<Record<GoldVoterId, TranslationKey>> = {
  'real-yield-10y': 'pd.gold.voterNames.real-yield-10y',
  us10y: 'pd.gold.voterNames.us10y',
  us30y: 'pd.gold.voterNames.us30y',
  'fed-target': 'pd.gold.voterNames.fed-target',
  'fed-expectations': 'pd.gold.voterNames.fed-expectations',
  'ecb-dfr': 'pd.gold.voterNames.ecb-dfr',
  'real-yield-5y': 'pd.gold.voterNames.real-yield-5y',
  'dollar-basket': 'pd.gold.voterNames.dollar-basket',
  usdjpy: 'pd.gold.voterNames.usdjpy',
  'us-japan-10y-gap': 'pd.gold.voterNames.us-japan-10y-gap',
  'usd-reserve-share': 'pd.gold.voterNames.usd-reserve-share',
  'nyfed-custody': 'pd.gold.voterNames.nyfed-custody',
  'dollar-broad': 'pd.gold.voterNames.dollar-broad',
  'dollar-eme': 'pd.gold.voterNames.dollar-eme',
  'stress-stlfsi': 'pd.gold.voterNames.stress-stlfsi',
  nfci: 'pd.gold.voterNames.nfci',
  vix: 'pd.gold.voterNames.vix',
  'gold-silver': 'pd.gold.voterNames.gold-silver',
  'term-premium-10y': 'pd.gold.voterNames.term-premium-10y',
  ebp: 'pd.gold.voterNames.ebp',
  'michigan-sentiment': 'pd.gold.voterNames.michigan-sentiment',
  'gpr-daily': 'pd.gold.voterNames.gpr-daily',
  'epu-us': 'pd.gold.voterNames.epu-us',
  'sp500-breadth-ratio': 'pd.gold.voterNames.sp500-breadth-ratio',
  'bank-stress': 'pd.gold.voterNames.bank-stress',
  'us-cpi-yoy': 'pd.gold.voterNames.us-cpi-yoy',
  'us-pce-core-yoy': 'pd.gold.voterNames.us-pce-core-yoy',
  'euro-hicp': 'pd.gold.voterNames.euro-hicp',
  'breakeven-5y5y': 'pd.gold.voterNames.breakeven-5y5y',
  'breakeven-tilt': 'pd.gold.voterNames.breakeven-tilt',
  t5yie: 'pd.gold.voterNames.t5yie',
  'michigan-1y-expectations': 'pd.gold.voterNames.michigan-1y-expectations',
  'm2-us': 'pd.gold.voterNames.m2-us',
  'us-deficit-12m': 'pd.gold.voterNames.us-deficit-12m',
  'michigan-5y-expectations': 'pd.gold.voterNames.michigan-5y-expectations',
  'cftc-gold-positioning': 'pd.gold.voterNames.cftc-gold-positioning',
  'cftc-gold-gross-long': 'pd.gold.voterNames.cftc-gold-gross-long',
};

/** The reading's freshness state for the AsOfChip (11 §6.4's four-state
 *  word, derived from the reading's own status + asOf — a word, never
 *  an icon or a new color). */
function asOfStateOf(reading: IndicatorReading | undefined): AsOfState | undefined {
  if (reading === undefined || reading.asOf === null) return 'waiting';
  if (reading.status === 'stale' || reading.status === 'unavailable') return 'stale';
  if (reading.status === 'warning' || reading.status === 'check-pending') return 'delayed';
  return 'fresh';
}

/* ------------------------------------------------------------------ *
 * One closed member card (11 §7.3) — the default tier, complete
 * without opening anything; the whole card opens the record sheet.
 * ------------------------------------------------------------------ */

function SeatCard({
  seat,
  reading,
  onOpenRecord,
}: {
  seat: GoldSeat;
  reading: IndicatorReading | undefined;
  /** Opens the GoldRecordSheet (the 09 expanded + technical tiers). */
  onOpenRecord: (id: GoldVoterId, opener: HTMLElement) => void;
}): React.JSX.Element {
  const { t, locale } = useI18n();
  const name = t(VOTER_NAME_KEY[seat.id]);
  const leanWord = t(SEAT_LEAN_KEY[seat.impact]);
  const evidenceWord = seat.evidence !== null ? t(EVIDENCE_KEY[seat.evidence]) : null;
  const brief = goldBrief(locale)[seat.id];
  const href = seatAnchorHref(seat);
  const destName = t(GOLD_SEAT_DEST_NAME_KEY[seat.id]);
  const why = seatUnreadWhy(seat, reading);
  const monthLocale = numberLocaleOf();
  const whyWord = why !== null ? seatWhyText(why.cause, why.month, t, monthLocale) : null;
  const methodWord = reading !== undefined ? yoyGapBaseLabel(reading, t, monthLocale) : null;

  // The AsOfChip's time — the reading's own asOf, the page's calendar.
  const asOfText =
    reading?.asOf != null
      ? locale === 'fa'
        ? formatJalaliDate(reading.asOf, 'fa-IR')
        : formatDateWords(reading.asOf, 'en-US')
      : undefined;

  // The mark model (12 §2's kind map reads the seat id inside SeatMark).
  const mark = {
    impact: seat.impact,
    percentile: reading?.percentile10y,
    value: reading?.value ?? null,
    change30d: reading?.change30d,
    label: name,
  };

  return (
    <article
      data-seat={seat.id}
      data-seat-impact={seat.impact}
      className="relative flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)]"
    >
      {/* The label row: the plainLabel + the state word in its impact ink
       * (the two-channel rule — the word names the lean, the ink the
       * relationship to gold; geometry never carries meaning alone). */}
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</h4>
        <span className={`text-[length:var(--type-caption)] font-bold ${SEAT_LEAN_TONE[seat.impact]}`} data-seat-lean>
          {leanWord}
          {evidenceWord !== null ? <span className="ms-1 font-semibold text-[var(--color-text-tertiary)]">· {evidenceWord}</span> : null}
        </span>
      </div>

      {/* The mark (12 §2's per-seat form). */}
      <SeatMark id={seat.id} model={mark} />

      {/* The evidence word line + the 09 defaultCopy — the closed card's
       * complete explanation, never a teaser. */}
      {evidenceWord !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-snug text-[var(--color-text-secondary)]" data-seat-evidence>
          {evidenceWord}
        </p>
      ) : null}
      {whyWord !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-seat-why={why!.cause}>
          {whyWord}
        </p>
      ) : null}
      {methodWord !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-seat-method="adjacent-months-average">
          {methodWord}
        </p>
      ) : null}
      {brief !== undefined ? (
        <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]" data-seat-copy>
          {brief.defaultCopy}
        </p>
      ) : null}

      {/* The freshness grammar (ONE chip per card — 11 §6.4). */}
      <AsOfChip asOf={asOfText} state={asOfStateOf(reading)} data-asof-chip={`seat-${seat.id}`} />

      {/* The R10 seat link — its own footnote row, ABOVE the sheet
       * opener in z-order (both affordances stay reachable; the link
       * keeps the cross-page card-anchor behavior, 11 §7.2). */}
      {href !== null ? (
        <a
          href={href}
          data-seat-home={seat.homePage}
          aria-label={`${t('pd.gold.seatLink')}: ${destName}`}
          title={destName}
          onClick={(e) => {
            if (href.startsWith('#')) return;
            e.preventDefault();
            const hashAt = href.indexOf('#');
            if (hashAt !== -1) stageAnchorScroll(href.slice(hashAt + 1));
            navigate(href.slice(0, hashAt === -1 ? undefined : hashAt));
          }}
          className="insights-focusable relative z-10 self-start rounded py-1 text-[length:var(--type-caption)] font-semibold text-currena-blue underline-offset-2 hover:underline"
        >
          {t('pd.gold.seatLink')} ↗
        </a>
      ) : null}

      {/* The sheet opener — the whole card (the shipped stretched-button
       * pattern, 11 §7.2). */}
      <button
        type="button"
        onClick={(e) => onOpenRecord(seat.id, e.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`${t('pd.gold.sheetOpenLabel')}: ${name}`}
        className="insights-focusable absolute inset-0 z-0 cursor-pointer rounded-[var(--radius-md)] bg-transparent transition-shadow hover:ring-1 hover:ring-currena-blue/40"
        data-seat-open
      />
    </article>
  );
}

/** The why-line's month format follows the APP locale (Jalali months in
 *  fa) — read from the document's own lang attribute (the app store sets
 *  it; jsdom-safe, no matchMedia). */
function numberLocaleOf(): 'en-US' | 'fa-IR' {
  return document.documentElement.getAttribute('lang') === 'fa' ? 'fa-IR' : 'en-US';
}

/* ------------------------------------------------------------------ *
 * One lane: the LaneBar summary + the member cards
 * ------------------------------------------------------------------ */

function LaneBlock({
  lane,
  readingsById,
  onOpenRecord,
}: {
  lane: GoldSeatLane;
  readingsById: ReadonlyMap<string, IndicatorReading>;
  onOpenRecord: (id: GoldVoterId, opener: HTMLElement) => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const title = t(LANE_TITLE_KEY[lane.lane]);
  const summary = laneBarDataOfSeatLane(lane);
  return (
    <section
      id={`lane-${lane.lane}`}
      aria-labelledby={`gold-lane-${lane.lane}-title`}
      data-lane={lane.lane}
      data-lane-side={lane.split === true ? 'split' : lane.side}
      className="flex min-w-0 flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)]/60 p-3 ring-1 ring-[var(--color-border)] sm:p-3.5"
    >
      <header className="flex min-w-0 flex-col gap-1.5">
        <h3 id={`gold-lane-${lane.lane}-title`} className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {title}
        </h3>
        {/* The ONE lane renderer (11 §5.3): the LaneBar carries the
         * summary — the lane's own condition word, the stacked pill,
         * the tally. The R17 keep holds: no intro, no tally chrome —
         * the LaneBar IS the summary now. */}
        <LaneBar data={summary} />
      </header>
      {/* The member cards: 1-col mobile, 2-col ≥ sm inside the lane. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {lane.seats.map((seat) => (
          <SeatCard key={seat.id} seat={seat} reading={readingsById.get(seat.id)} onOpenRecord={onOpenRecord} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The five lanes
 * ------------------------------------------------------------------ */

export function GoldSeats({
  lanes,
  readings,
}: {
  lanes: readonly GoldSeatLane[];
  /** The page projection's readings — the dark seats' why-lines read
   * each seat's own status metadata (GPE R04/F16a: the cause class is
   * derived from the reading where possible, else the curated map). */
  readings?: readonly IndicatorReading[];
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const [sheet, setSheet] = useState<GoldRecordSheetState | null>(null);
  const readingsById = useMemo(
    () => new Map((readings ?? []).map((r) => [r.id as string, r])),
    [readings],
  );

  const openRecord = (id: GoldVoterId, opener: HTMLElement): void => {
    const seat = lanes.flatMap((l) => [...l.seats]).find((s) => s.id === id);
    if (seat === undefined) return; // fail-closed — only seated voters open
    const reading = readingsById.get(id);
    setSheet({
      id,
      opener,
      reading,
      mark: {
        impact: seat.impact,
        percentile: reading?.percentile10y,
        value: reading?.value ?? null,
        change30d: reading?.change30d,
        label: t(VOTER_NAME_KEY[seat.id]),
      },
    });
  };

  return (
    <section id="gold-seats" aria-label={t('pd.gold.seatsAria')} data-gold-seats className="flex flex-col gap-2.5 gold-anchor-mt sm:gap-3">
      <h2 className="m-0 text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg">{t('pd.gold.lanesTitle')}</h2>
      {/* The five lane blocks: 1-col mobile, 2-col ≥ lg (the stress and
       * inflation lanes' cards wrap inside their own blocks — the
       * LaneBar summaries first, the F-04 fix's glance-then-detail). */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
        {lanes.map((lane) => (
          <LaneBlock key={lane.lane} lane={lane} readingsById={readingsById} onOpenRecord={openRecord} />
        ))}
      </div>
      {sheet !== null ? (
        <Suspense fallback={null}>
          <GoldRecordSheet state={sheet} onClose={() => setSheet(null)} />
        </Suspense>
      ) : null}
      {/* The locale pin for the why-line month format (the helper reads
       * documentElement.lang — keep it honest with the store). */}
      <span hidden data-gold-seats-locale={locale} data-gold-seats-number-locale={numberLocale} />
    </section>
  );
}
