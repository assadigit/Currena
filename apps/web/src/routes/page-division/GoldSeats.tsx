/**
 * GoldSeats — the 37 voter seats grouped by the five lanes (page-division
 * S5, 2026-11-08 — spec §5 item 2 / D-26: borrowing-costs 7 · dollar 7 ·
 * stress 11 · inflation 10 · flows 2).
 *
 * Every seat chip carries the engine's own line: the voter's name, its
 * lean (supports / pressures / not-leaning / couldn't-be-read — the
 * gold-balance vocabulary, corpus-pinned), and the evaluator's evidence
 * word (rising / falling / high in its decade / low in its decade) when
 * the seat fires. Each chip is a REAL link to the seat's home card
 * (03-STRATEGY-LOG §7 wrap-up note 4) — the home page derived from the
 * placement table (gold-tiles' homePage), never hand-copied; a seat whose
 * home card lives on THIS page (gold-silver · the CFTC pair) links to the
 * context card's in-page anchor.
 *
 * The lane cards state the engine's own lane vote (side word + tally +
 * the one-sentence lane intro), the MIN2 crowd minimum speaking through
 * the tally line ("{firing} of {readable} drivers firing"). Unread seats
 * render with their honest word — never a guess (Agent Rule 5).
 */

import type { PageDivisionPageId } from '@currena/core';
import type { GoldLane } from '@currena/insights';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import type { TranslationKey } from '../../lib/locale';
import type { GoldSeat, GoldSeatLane, GoldVoterId } from './gold-tiles';

/* The lane copy keys — five lanes, the corpus's own names + intros. */
const LANE_TITLE_KEY: Readonly<Record<GoldLane, TranslationKey>> = {
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

/** The route path of a page id — the destinations' own slugs (D-46). */
const PAGE_ROUTE: Record<PageDivisionPageId, string> = {
  global: '/',
  gold: '/gold',
  'world-markets': '/world-markets',
  usa: '/usa',
  europe: '/europe',
  'asia-pacific': '/asia-pacific',
  australia: '/australia',
  commodities: '/commodities',
  currencies: '/currencies',
};

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

const EVIDENCE_KEY: Readonly<Record<'rising' | 'falling' | 'high' | 'low', TranslationKey>> = {
  rising: 'pd.gold.evidenceRising',
  falling: 'pd.gold.evidenceFalling',
  high: 'pd.gold.evidenceHigh',
  low: 'pd.gold.evidenceLow',
};

const LANE_STATE_KEY: Readonly<Record<GoldSeatLane['side'], TranslationKey>> = {
  for: 'pd.gold.laneStateFor',
  against: 'pd.gold.laneStateAgainst',
  neutral: 'pd.gold.laneStateNeutral',
  unread: 'pd.gold.laneStateUnread',
};

const LANE_STATE_TONE: Record<string, string> = {
  for: 'text-[var(--color-status-normal)]',
  against: 'text-[var(--color-status-alert)]',
  neutral: 'text-[var(--color-text-secondary)]',
  unread: 'text-[var(--color-text-tertiary)]',
};

/** The voter-name dictionary key for a seat id (37 literal keys — the
 *  copy-pin test iterates GOLD_VOTER_IDS and proves every key exists and
 *  matches the corpus). */
const VOTER_NAME_KEY: Readonly<Record<GoldVoterId, TranslationKey>> = {
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

/** The seat chip's link: the home page's route, or the in-page context
 *  anchor when the seat's home card lives on THIS page (gold-silver ·
 *  the CFTC pair — the placement's own gold group). Fail-closed: an
 *  unplaced id renders no link. */
function seatHref(seat: GoldSeat): string | null {
  if (seat.homePage === null) return null;
  if (seat.homePage === 'gold') return '#gold-context';
  return PAGE_ROUTE[seat.homePage];
}

/* ------------------------------------------------------------------ *
 * One seat chip
 * ------------------------------------------------------------------ */

function SeatChip({ seat }: { seat: GoldSeat }): React.JSX.Element {
  const { t } = useI18n();
  const name = t(VOTER_NAME_KEY[seat.id]);
  const leanWord = t(SEAT_LEAN_KEY[seat.impact]);
  const evidenceWord = seat.evidence !== null ? t(EVIDENCE_KEY[seat.evidence]) : null;
  const href = seatHref(seat);
  // The chip's accessible name carries the WHOLE reading: the voter, its
  // lean and its evidence — screen readers never meet a bare name.
  const aria = evidenceWord !== null ? `${name} — ${leanWord} · ${evidenceWord}` : `${name} — ${leanWord}`;
  const inner = (
    <>
      <span className="min-w-0 truncate text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</span>
      <span className={`flex min-w-0 items-baseline gap-1 text-[length:var(--type-caption)] font-semibold leading-tight ${SEAT_LEAN_TONE[seat.impact]}`}>
        <span className="truncate">{leanWord}</span>
        {evidenceWord !== null ? <span className="truncate text-[var(--color-text-tertiary)]">· {evidenceWord}</span> : null}
      </span>
    </>
  );
  // A real link (the house pattern — REAL hrefs, the path-router's
  // navigate() takes over in-app); a seat with no home renders the same
  // chip without a link (fail-closed, never a dead anchor).
  if (href === null) {
    return (
      <li
        data-seat={seat.id}
        data-seat-impact={seat.impact}
        className="flex min-h-[44px] min-w-[150px] flex-1 flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]"
        aria-label={aria}
      >
        {inner}
      </li>
    );
  }
  return (
    <li className="min-w-[150px] flex-1">
      <a
        href={href}
        data-seat={seat.id}
        data-seat-impact={seat.impact}
        data-seat-home={seat.homePage}
        aria-label={`${aria}. ${t('pd.gold.seatLink')}`}
        title={t('pd.gold.seatLink')}
        onClick={(e) => {
          if (href.startsWith('#')) return; // the in-page anchor scrolls natively.
          e.preventDefault();
          navigate(href);
        }}
        className="insights-focusable flex min-h-[44px] cursor-pointer flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 no-underline ring-1 ring-[var(--color-border)] motion-safe:transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
      >
        {inner}
      </a>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * One lane card
 * ------------------------------------------------------------------ */

function LaneCard({ lane }: { lane: GoldSeatLane }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const title = t(LANE_TITLE_KEY[lane.lane]);
  const intro = t(LANE_INTRO_KEY[lane.lane]);

  // The lane's tally line (03 §2): the split contest when contested, else
  // the firing count over readable — "No driver firing" when readable but
  // quiet; an unread lane carries no tally at all.
  const tally =
    lane.split === true
      ? interpolate(t('pd.gold.laneSplit'), { supports: num(lane.supports), pressures: num(lane.pressures) })
      : lane.side === 'unread'
        ? null
        : lane.firing === 0
          ? t('pd.gold.laneTallyNone')
          : interpolate(t('pd.gold.laneTally'), { firing: num(lane.firing), readable: num(lane.readable) });

  // The lane's state word: for/against/neutral/unread — split reads its
  // own word with the contest counts (the OI-2 disclosure).
  const stateWord =
    lane.split === true
      ? interpolate(t('pd.gold.laneStateSplit'), { supports: num(lane.supports), pressures: num(lane.pressures) })
      : t(LANE_STATE_KEY[lane.side]);
  const stateTone = lane.split === true ? 'text-[var(--color-status-watch)]' : LANE_STATE_TONE[lane.side] ?? '';

  return (
    <section
      aria-labelledby={`gold-lane-${lane.lane}-title`}
      data-lane={lane.lane}
      data-lane-side={lane.split === true ? 'split' : lane.side}
      className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      <header className="flex min-w-0 flex-col gap-0.5">
        <h3 id={`gold-lane-${lane.lane}-title`} className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {title}
          <span className="ms-1.5 font-semibold text-[var(--color-text-tertiary)]">· {num(lane.seats.length)}</span>
        </h3>
        <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className={`text-[length:var(--type-caption)] font-bold ${stateTone}`} data-lane-state>
            {stateWord}
          </span>
          {tally !== null ? (
            <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{tally}</bdi>
          ) : null}
        </p>
        {intro !== null ? <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">{intro}</p> : null}
      </header>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {lane.seats.map((seat) => (
          <SeatChip key={seat.id} seat={seat} />
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The five lanes
 * ------------------------------------------------------------------ */

export function GoldSeats({ lanes }: { lanes: readonly GoldSeatLane[] }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section aria-label={t('pd.gold.seatsAria')} data-gold-seats className="flex flex-col gap-2.5 sm:gap-3">
      <h2 className="m-0 text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg">{t('pd.gold.lanesTitle')}</h2>
      {/* The five lane cards: 1-col on mobile, 2-col from lg (the stress
       * lane's 11 chips and the inflation lane's 10 wrap inside their own
       * cards — every seat chip always visible, nothing collapsed). */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
        {lanes.map((lane) => (
          <LaneCard key={lane.lane} lane={lane} />
        ))}
      </div>
    </section>
  );
}
