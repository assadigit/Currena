/**
 * SeatMark — the closed card's mark primitive (GUX-S5 M4, 12 §1.1–1.3
 * + 12 §2's per-seat map): the visual form every voter seat wears in
 * its default (closed) tier.
 *
 * THE CLOSED SET (12 §2, all 37 rows): Band (+ the trail variant +
 * BandStepped for the two policy-rate plateaus + RangeBandYoY's
 * disclosed basis word) · SignedDivergingBar (the two zero-average
 * stress indexes + the CFTC net track) · ShareBar (the CFTC gross
 * pair). The mark's HUE carries the seat's IMPACT through the lane's
 * polarity (11 §4.3's two-channel rule — the geometry answers
 * "where/which side", the word answers "what it means for gold").
 *
 * The honesty rules (12 §1.1/§4.1): the marker hue is NEVER the
 * position (a high reading on an inverted seat renders the position
 * honestly, the ink through polarity); the 20–80 zone is the soft
 * band; the unread seat renders the DOTTED empty track (the
 * data-quality grammar, never a market hue); the YoY basis is named
 * where the band is over the YoY series (08 §3.2's disclosure); the
 * model-estimate tag rides its named seats (11 §6.5).
 *
 * Compact geometry, full honesty: one 6px track with a 16px-equivalent
 * dot scaled to the card's row height, end labels only in the
 * technical tier (the tooltip/sheet carries the decade extremes).
 * dir="ltr" root (charts read left→right in both locales — the house
 * convention); the marker's `insetInlineStart` would mirror in RTL but
 * the LTR chart convention pins the track (the decade axis is a time
 * axis, 11 §8's rule).
 */

import { useId } from 'react';
import { formatNumber } from '@currena/core';
import { useI18n } from '../../shared/lib/locale';
import type { GoldVoterId } from './gold-tiles';

/** The mark kind per seat (12 §2's map, the three named forms + the
 *  specializations the data types demand). */
export type SeatMarkKind = 'band' | 'band-stepped' | 'band-yoy' | 'signed' | 'share';

/** 12 §2's map: every one of the 37 seats, by id. The kinds follow the
 *  data types 09 recorded (level/band → band; the stepped policy rates
 *  → band-stepped; the zero-average stress pair + the CFTC net track →
 *  signed; the CFTC gross share → share; the YoY-basis inflation family
 *  → band-yoy). */
const SEAT_MARK_KIND: Readonly<Record<GoldVoterId, SeatMarkKind>> = {
  // 2.A borrowing costs (7): levels + the two stepped policy rates.
  'real-yield-10y': 'band',
  us10y: 'band',
  us30y: 'band',
  'fed-target': 'band-stepped',
  'fed-expectations': 'band',
  'ecb-dfr': 'band-stepped',
  'real-yield-5y': 'band',
  // 2.B the dollar (7): indexes/levels — all bands.
  'dollar-basket': 'band',
  usdjpy: 'band',
  'us-japan-10y-gap': 'band',
  'usd-reserve-share': 'band',
  'nyfed-custody': 'band',
  'dollar-broad': 'band',
  'dollar-eme': 'band',
  // 2.C stress (11): the zero-average pair diverges; the rest band.
  'stress-stlfsi': 'signed',
  nfci: 'signed',
  vix: 'band',
  'gold-silver': 'band',
  'term-premium-10y': 'band',
  ebp: 'band',
  'michigan-sentiment': 'band',
  'gpr-daily': 'band',
  'epu-us': 'band',
  'sp500-breadth-ratio': 'band',
  'bank-stress': 'band',
  // 2.D inflation (10): the YoY family carries the disclosed basis.
  'us-cpi-yoy': 'band-yoy',
  'us-pce-core-yoy': 'band-yoy',
  'euro-hicp': 'band-yoy',
  'breakeven-5y5y': 'band',
  'breakeven-tilt': 'band',
  t5yie: 'band',
  'michigan-1y-expectations': 'band',
  'm2-us': 'band-yoy',
  'us-deficit-12m': 'band',
  'michigan-5y-expectations': 'band',
  // 2.E flows (2): the two-track discipline.
  'cftc-gold-positioning': 'signed',
  'cftc-gold-gross-long': 'share',
};

export function seatMarkKindOf(id: GoldVoterId): SeatMarkKind {
  return SEAT_MARK_KIND[id];
}

/** The seats 09/11 §6.5 tag as MODEL ESTIMATES (the tag rides the mark;
 *  never a footnote-only disclosure). */
const MODEL_ESTIMATE_IDS = new Set<GoldVoterId>(['term-premium-10y', 'ebp']);

/** The impact ink class (11 §4.3: hue = relationship to gold through
 *  the polarity; steady = neutral stone; unread = tertiary, dotted). */
const IMPACT_INK: Readonly<Record<string, string>> = {
  supports: 'bg-[var(--color-status-normal)]',
  pressures: 'bg-[var(--color-status-alert)]',
  steady: 'bg-[var(--bal-stone-lo)]',
};

/** The band's percentile → marker position (0–100, unclamped by design
 *  — an anomalous reading renders past the end, the number beside it
 *  always tells the truth; GoldPositions' own rule). */
function pctOf(percentile: number): number {
  return Math.round(percentile * 100 * 100) / 100;
}

export interface SeatMarkModel {
  /** The engine's own member impact (the ink). */
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  /** percentile10y (0–1) — the band's marker. Absent on unread seats. */
  percentile: number | undefined;
  /** The signed reading's own value (the diverging/share forms). */
  value: number | null;
  /** change30d — the trail renders only when the seat FIRES on the
   *  30-day move (the trail is the fired move's evidence, 12 §2 3.1). */
  change30d: number | undefined;
  /** The record's own plain label (the aria's subject). */
  label: string;
}

export function SeatMark({ id, model }: { id: GoldVoterId; model: SeatMarkModel }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const kind = SEAT_MARK_KIND[id];
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 1 });

  /* The UNREAD seat: the dotted empty track (12 §2 3.5's honest
   * absence — never a market hue, never all-steady). */
  if (model.impact === 'unread') {
    return (
      <div
        dir="ltr"
        role="img"
        aria-label={`${model.label}: ${t('pd.gold.seatUnread')}`}
        data-seat-mark="unread"
        className="h-1.5 w-full rounded-full border border-dashed border-[var(--color-text-tertiary)]/60"
      />
    );
  }

  const ink = IMPACT_INK[model.impact] ?? IMPACT_INK.steady;
  const pct = model.percentile !== undefined ? pctOf(model.percentile) : null;

  /* The two SIGNED forms: the zero-centre diverging bar (the stress
   * pair reads its own decade range −100..+100 style domain; the CFTC
   * net track is −100..+100 by definition) + the SHARE form (0..100,
   * the complement stays track-colored — 12 §1.3's rule). */
  if (kind === 'signed' || kind === 'share') {
    const isShare = kind === 'share';
    const domain = isShare ? { min: 0, max: 100 } : { min: -100, max: 100 };
    const v = model.value;
    const pos = v !== null ? Math.round((((v - domain.min) / (domain.max - domain.min)) * 100) * 100) / 100 : null;
    const zeroPct = 50;
    const fillStart = isShare ? 0 : Math.min(zeroPct, pos ?? zeroPct);
    const fillWidth = isShare
      ? Math.max(pos ?? 0, 0)
      : Math.abs((pos ?? zeroPct) - zeroPct);
    return (
      <div
        dir="ltr"
        role="img"
        aria-label={`${model.label}: ${isShare ? t('pd.gold.markShareAria', { v: num(v ?? 0) }) : t('pd.gold.markSignedAria', { v: num(v ?? 0) })}`}
        data-seat-mark={kind}
        className="relative h-1.5 w-full rounded-full bg-[var(--color-border)]/60"
      >
        {!isShare ? (
          <span className="absolute inset-y-0 start-1/2 w-px bg-[var(--color-text-tertiary)]/70" aria-hidden="true" data-mark-zero />
        ) : null}
        {pos !== null ? (
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 rounded-full ${ink}`}
            style={isShare ? { insetInlineStart: 0, width: `${Math.min(fillWidth, 100)}%` } : { insetInlineStart: `${Math.min(fillStart, fillStart + fillWidth)}%`, width: `${Math.min(fillWidth, 100 - Math.min(fillStart, fillStart + fillWidth))}%` }}
            data-mark-fill
          />
        ) : null}
      </div>
    );
  }

  /* The BAND family: the 10-year track with the 20–80 soft zone + the
   * marker (hue = impact, NEVER the position). The stepped + YoY
   * variants render the same geometry with their own annotations: the
   * stepped form carries the plateau word (technical tier prints the
   * thresholds), the YoY form names its basis (08 §3.2's mandatory
   * disclosure at point of use). */
  if (pct === null) {
    // A readable seat without percentile10y — the honest plain track
    // (fail-closed: no percentile, no marker, never a guessed position).
    return (
      <div
        dir="ltr"
        role="img"
        aria-label={`${model.label}: ${t('pd.gold.markNoBand')}`}
        data-seat-mark={kind}
        data-mark-marker="absent"
        className="h-1.5 w-full rounded-full bg-[var(--color-border)]/60"
      />
    );
  }
  return (
    <div
      dir="ltr"
      role="img"
      aria-label={`${model.label}: ${t('pd.gold.markBandAria', { p: num(pct) })}`}
      data-seat-mark={kind}
      className="relative h-1.5 w-full rounded-full bg-[var(--color-border)]/60"
    >
      {/* The 20–80 soft zone (the typical band, 12 §1.1). */}
      <span aria-hidden="true" className="absolute inset-y-0 rounded-full bg-[var(--color-border)]" style={{ insetInlineStart: '20%', width: '60%' }} data-mark-zone />
      {/* The 30-day trail: a thin tail on the reading's origin side,
       * rendered ONLY when the seat fires on the move (the fired move's
       * evidence — the honest absence on level-only seats). */}
      {model.change30d !== undefined && (model.impact === 'supports' || model.impact === 'pressures') ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-[1px] rounded-full opacity-50 ${ink}`}
          style={
            model.change30d > 0
              ? { insetInlineStart: `${Math.max(pct - 10, 0)}%`, width: `${Math.min(10, pct)}%` }
              : { insetInlineStart: `${pct}%`, width: `${Math.min(10, 100 - pct)}%` }
          }
          data-mark-trail={model.change30d > 0 ? 'up' : 'down'}
        />
      ) : null}
      {/* The marker — the impact ink, at the percentile position. */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--color-surface)] ${ink}`}
        style={{ insetInlineStart: `${Math.min(Math.max(pct, 0), 100)}%` }}
        data-mark-marker={pct}
      />
      {/* The model-estimate tag (11 §6.5) — the tag rides the mark. */}
      {MODEL_ESTIMATE_IDS.has(id) ? (
        <span className="sr-only">{t('pd.gold.markModelEstimate')}</span>
      ) : null}
      {/* The YoY basis disclosure (08 §3.2 — named at point of use). */}
      {kind === 'band-yoy' ? (
        <span className="sr-only">{t('pd.gold.markYoyBasis')}</span>
      ) : null}
      {/* The stepped plateau word (the form's own annotation). */}
      {kind === 'band-stepped' ? (
        <span className="sr-only">{t('pd.gold.markStepped')}</span>
      ) : null}
      <span className="sr-only">{t('pd.gold.markZoneAria')}</span>
      <span hidden>{uid}</span>
    </div>
  );
}
