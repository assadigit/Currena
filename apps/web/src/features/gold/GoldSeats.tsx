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

import { useMemo } from 'react';
import type { GoldLane } from '@currena/insights';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { navigate } from '../../router';
import type { TranslationKey } from '../../shared/lib/locale';
import { GOLD_SEAT_DEST_NAME_KEY, seatAnchorHref, seatUnreadWhy, type GoldSeat, type GoldSeatLane, type GoldVoterId, type SeatUnreadCause } from './gold-tiles';
import { yoyGapBaseLabel } from '../../shared/lib/yoy-gap';
import { stageAnchorScroll } from '../../shared/lib/anchor-scroll';

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

const LANE_STATE_TONE: Record<string, string> = {
  for: 'text-[var(--color-status-normal)]',
  against: 'text-[var(--color-status-alert)]',
  neutral: 'text-[var(--color-text-secondary)]',
  unread: 'text-[var(--color-text-tertiary)]',
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

/** The seat chip's link: the home page's route, or the in-page context
 *  anchor when the seat's home card lives on THIS page (gold-silver ·
 *  the CFTC pair — the placement's own gold group). Fail-closed: an
 *  unplaced id renders no link. */
/* GPE R10 (INF-3, s7/03 §1.2): the seat link is CARD-LEVEL — the pure
 * builder in gold-tiles.ts composes the destination route + the card's
 * own stable anchor (`/usa#usa-card-real-yield-10y`; the gold page's own
 * context seats link in-page `#gold-card-gold-silver`). GPE-S2-18: the
 * reader lands ON the card, never at the top of a long page. */
function seatHref(seat: GoldSeat): string | null {
  return seatAnchorHref(seat);
}

/* ------------------------------------------------------------------ *
 * One seat chip
 * ------------------------------------------------------------------ */

function SeatChip({
  seat,
  reading,
}: {
  seat: GoldSeat;
  /** The seat's own reading from the page projection — the why-line's
   * status metadata (GPE R04). Undefined when the id is absent. */
  reading: IndicatorReading | undefined;
}): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const name = t(VOTER_NAME_KEY[seat.id]);
  const leanWord = t(SEAT_LEAN_KEY[seat.impact]);
  const evidenceWord = seat.evidence !== null ? t(EVIDENCE_KEY[seat.evidence]) : null;
  const href = seatHref(seat);
  /* GPE R10 (the GPE-S2-18 name-match): the destination card's OWN title
   * (the same key the card renders) rides the tooltip + the accessible
   * name — the reader knows exactly which card the anchor opens. */
  const destName = t(GOLD_SEAT_DEST_NAME_KEY[seat.id]);
  /* GPE R04 (F16a): the dark seat's why-line — one muted status line
   * naming the cause class (upstream-stopped / upstream-gap /
   * pipeline-lag / rule-driven), derived from the projection's own
   * reading metadata where possible. Only a dark seat carries one. */
  const why = seatUnreadWhy(seat, reading);
  const whyWord = why !== null ? seatWhyText(why.cause, why.month, t, numberLocale) : null;
  /* GPE R05 (S4-D1): a LIT CPI seat computed against the
   * adjacent-months-average base carries its method label at point of
   * use — «مبنا: میانگین دو ماه مجاور (شکست انتشار مهر ۱۴۰۴)» — the
   * disclosure that lights the seat honestly (pairs with R04: the
   * upstream-gap why-line spoke while it was dark). */
  const methodWord = reading !== undefined ? yoyGapBaseLabel(reading, t, numberLocale) : null;
  // The chip's accessible name carries the WHOLE reading: the voter, its
  // lean and its evidence — screen readers never meet a bare name.
  const aria =
    evidenceWord !== null
      ? `${name} — ${leanWord} · ${evidenceWord}`
      : whyWord !== null
        ? `${name} — ${leanWord} · ${whyWord}`
        : methodWord !== null
          ? `${name} — ${leanWord} · ${methodWord}`
          : `${name} — ${leanWord}`;
  const inner = (
    <>
      <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{name}</span>
      {/* The lean + evidence words wrap COMPLETE — the S5 VLM pass caught
       * the first build's truncate clipping them mid-word ("Supports go… ·
       * high in it…"); a seat chip states its whole reading, never a
       * clipped fragment (D-26: name · lean · evidence word). */}
      <span className={`flex flex-col gap-0.5 text-[length:var(--type-caption)] font-semibold leading-tight ${SEAT_LEAN_TONE[seat.impact]}`}>
        <span>{leanWord}</span>
        {evidenceWord !== null ? <span className="text-[var(--color-text-tertiary)]">{evidenceWord}</span> : null}
        {/* GPE R04: the why-unread line — the muted cause sentence under
         * the dark seat's lean word (never under a readable seat). */}
        {whyWord !== null ? (
          <span className="font-normal text-[var(--color-text-tertiary)]" data-seat-why={why!.cause}>
            {whyWord}
          </span>
        ) : null}
        {/* GPE R05: the gap-base method label — the lit CPI seat's
         * disclosed method, only when the reading used the
         * adjacent-months-average base. */}
        {methodWord !== null ? (
          <span className="font-normal text-[var(--color-text-tertiary)]" data-seat-method="adjacent-months-average">
            {methodWord}
          </span>
        ) : null}
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
        className="flex min-h-[44px] min-w-[156px] flex-1 flex-col justify-center gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]"
        aria-label={aria}
      >
        {inner}
      </li>
    );
  }
  return (
    <li className="min-w-[156px] flex-1">
      <a
        href={href}
        data-seat={seat.id}
        data-seat-impact={seat.impact}
        data-seat-home={seat.homePage}
        aria-label={`${aria}. ${destName}`}
        title={destName}
        onClick={(e) => {
          if (href.startsWith('#')) return; // the in-page anchor scrolls natively.
          e.preventDefault();
          // GPE R10: the cross-page card anchor — the real href keeps the
          // #hash (AT, new-tab, honest link semantics); the router takes
          // the ROUTE and the staged anchor scrolls to the card once it
          // lays out (the Footer→About pattern, generalized).
          const hashAt = href.indexOf('#');
          if (hashAt !== -1) stageAnchorScroll(href.slice(hashAt + 1));
          navigate(href.slice(0, hashAt === -1 ? undefined : hashAt));
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

function LaneCard({
  lane,
  readingsById,
}: {
  lane: GoldSeatLane;
  /** The projection's readings by id — the why-lines' status metadata
   * (GPE R04), threaded from the page. */
  readingsById: ReadonlyMap<string, IndicatorReading>;
}): React.JSX.Element {
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
      id={`lane-${lane.lane}`}
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
          <SeatChip key={seat.id} seat={seat} reading={readingsById.get(seat.id)} />
        ))}
      </ul>
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
  const { t } = useI18n();
  const readingsById = useMemo(
    () => new Map((readings ?? []).map((r) => [r.id as string, r])),
    [readings],
  );
  return (
    <section aria-label={t('pd.gold.seatsAria')} data-gold-seats className="flex flex-col gap-2.5 sm:gap-3">
      <h2 className="m-0 text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg">{t('pd.gold.lanesTitle')}</h2>
      {/* The five lane cards: 1-col on mobile, 2-col from lg (the stress
       * lane's 11 chips and the inflation lane's 10 wrap inside their own
       * cards — every seat chip always visible, nothing collapsed). */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
        {lanes.map((lane) => (
          <LaneCard key={lane.lane} lane={lane} readingsById={readingsById} />
        ))}
      </div>
    </section>
  );
}
