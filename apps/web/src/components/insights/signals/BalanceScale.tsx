/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, the v2 seesaw patch, v3, v4,
 * v5 and now the v6 PANS directive, 2026-10-26 — Iteration 4: the
 * factors must VISIBLY REST ON real weighing pans hung from the beam,
 * so the items read as the loads that tilt the scale).
 *
 * v6 composition (one coherent drawing, four connected parts):
 *
 *   1. the heading «برآیند عوامل مؤثر بر قیمت طلا» + its subtitle;
 *   2. the two SIDE CAPTIONS over the pan columns — each names its
 *      side («عوامل حمایتی/فشارآور بر قیمت طلا») with its icon and
 *      side colour, aligned exactly over the pan it labels;
 *   3. THE BALANCE ITSELF — a beam + pivot + bead + hanger + PAN
 *      assembly per side, all in one fixed-height stage:
 *        · a tapered beam (9px mid → ~6px ends) rotating on a compact
 *          hub-and-keystone pivot (v4's mark, kept);
 *        · an accent bead terminating each beam end — green for /
 *          red against (the side marker where the hangers meet the
 *          beam);
 *        · TWO THIN SUSPENSION LINES per side, splayed from the beam
 *          end down to the pan's top edge — the clear, restrained
 *          mechanical connection;
 *        · a SHALLOW PAN (a rimmed tray with a heavier floor edge)
 *          hanging at a fixed distance below its beam end;
 *        · the COMPACT FACTOR TILES resting INSIDE the pan — bottom-
 *          aligned on the floor, gapped, contact-shadowed: they are
 *          the loads the scale is weighing. Each tile is a real
 *          button opening the shared detail panel.
 *   4. the aggregate assessment (the soft centred box, v5) directly
 *      beneath the drawing;
 *   5. the full per-side factor lists (rows with full labels + the
 *      evidence-based empty lines) as controlled expansions below the
 *      assessment, opened by the pan's "+{n} more" pill;
 *   6. the shared detail panel and the Neutral / Couldn't read trays.
 *
 * Physical coherence (the whole point of v6): the beam rotates by the
 * model's angle θ about the pivot, so each bead (beam end) drops by
 * (Lh ÷ 2) × sin θ. Every pan assembly translates by EXACTLY the same
 * drop (CSS: 25cqw × sin θ — 25cqw IS Lh ÷ 2 because the beam spans
 * half the stage) and tilts by a restrained 0.2 × θ (≤ 2.4° at the
 * 12° maximum, so factor text never needs head-tilting). The hangers
 * are rigid parts of the translating assembly, so the connection
 * bead → lines → pan stays coherent at every angle, and the geometry
 * is pure CSS calc — no runtime measurement, no ResizeObserver.
 *
 * Rules that survive verbatim from v3/v4/v5:
 *   1. Carefully proportioned vector geometry with controlled weights
 *      (beam 9px > hub 15px > beads 12px > hangers 2px > reference
 *      dots ~1px) and deliberate reserved whitespace — the stage
 *      reserves exactly the ±(Lh ÷ 2) × sin 12° swing plus the pan
 *      stack, at a FIXED height (272px mobile / 240px ≥sm).
 *   2. No dashed placeholder rectangles: a side with no qualifying
 *      factors keeps its COMPLETE pan (hangers, rim, floor) with a
 *      minimal muted marker inside, and its full evidence-based line
 *      in the list area below; when NOTHING could be read, both pans
 *      carry the distinct "nothing to weigh yet" marker instead.
 *   3. Capacity, not overflow: each pan shows the first
 *      BALANCE_PAN_CAPACITY tiles; the rest are counted by the
 *      "+{n} more" pill hanging under the pan (styled like the site's
 *      attention-tile pill — deliberately NOT a tile, so it can never
 *      read as another load), which expands the side's full list.
 *      Nothing is silently omitted; the model still sees every
 *      driver; the stage's geometry never depends on any count.
 *   4. Direction follows the model (v1 §6 steps 3–4, byte-identical):
 *      the beam tilts ONLY for a valid aggregate verdict, angle =
 *      |net|/total × 12° floored at 4°; balanced and unreadable
 *      verdicts render level. The NUMBER of tiles never sets the
 *      tilt — only the documented net/total ratio does.
 *   5. Fixed stage geometry: the stage's height is constant per
 *      breakpoint; any number of factors on either side can never
 *      resize, clip or collide with the drawing.
 *
 * RTL: the pan columns, captions and list sections are CSS-grid
 * children, so they mirror with the document direction automatically.
 * The beam's rotation sign flips for RTL in JS (--s; the physical
 * signed angle --t that drives the pan drops is direction-free), and
 * the beads are placed with inset-inline utilities so the `for` bead
 * always terminates the beam end above the `for` pan. Nothing mirrors
 * text.
 *
 * Reusable by contract (spec §2.6): the component takes a list of
 * drivers and knows nothing about gold beyond the copy strings; the
 * merged card applies it to the gold driver list only.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { formatNumber } from '@currena/core';
import type { SignalConditionState } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';
import { ConditionIcon } from './icons';
import { VerdictIcon, verdictTone } from './verdict';

/** One balance driver — the spec's four states (§4). `neutral` (read,
 * no effect) and `unread` (could not be read) are DIFFERENT states. */
export type BalanceDriverState = 'for' | 'against' | 'neutral' | 'unread';

export interface BalanceDriver {
  /** Stable identity (the condition key) — drives the detail panel. */
  key: string;
  /** Short driver name ("Real yields"). */
  label: string;
  /** The driver's existing explanation sentence (opens in the detail
   * panel under the lists — v2 §5.5.6, every width). */
  detail: string;
  /** The current value(s), display-formatted, or null when unread. */
  valueText: string | null;
  state: BalanceDriverState;
}

/** The card's condition state → the balance's four states (§4). The
 * signal model already separates neutral from unknown — a 1:1 map. */
export function driverStateOf(state: SignalConditionState): BalanceDriverState {
  switch (state) {
    case 'supportive':
      return 'for';
    case 'against':
      return 'against';
    case 'neutral':
      return 'neutral';
    case 'unknown':
      return 'unread';
  }
}

export interface BalanceCounts {
  for: number;
  against: number;
  neutral: number;
  unread: number;
  /** total = every driver in the list (§4). */
  total: number;
  /** net = for − against (§4). */
  net: number;
  /** readable = for + against + neutral (§4). */
  readable: number;
}

export function balanceCounts(drivers: readonly BalanceDriver[]): BalanceCounts {
  const count = (state: BalanceDriverState): number => drivers.filter((d) => d.state === state).length;
  const f = count('for');
  const a = count('against');
  const n = count('neutral');
  const u = count('unread');
  return { for: f, against: a, neutral: n, unread: u, total: drivers.length, net: f - a, readable: f + a + n };
}

/** The tilt constants (v2 patch §5.1.5, kept by v3–v6 — the angle
 * formula is the owner's model and must not change: ratio × 12°, 4° floor). */
export const BALANCE_MAX_ANGLE_DEG = 12;
export const BALANCE_MIN_ANGLE_DEG = 4;

/* ------------------------------------------------------------------ *
 * v6 stage metrics — ONE fixed-height stage drawn with CSS geometry.
 * The logical design width is 640px (the stage's max width); every
 * horizontal anchor is a percentage so the drawing scales with the
 * stage: the beam spans 25%–75% (its ends = the two pan columns'
 * centres), the pans fill 92% of their 50% columns, and the pan drop
 * is 25cqw × sin θ (25cqw = Lh ÷ 2 by construction, so the pans track
 * their beads EXACTLY at every width).
 * ------------------------------------------------------------------ */

/** The physical signed angle of the balance, in degrees: positive
 * when the AGAINST side is heavy, negative when FOR is heavy, 0 when
 * level. This sign is PHYSICAL (direction-free) — it drives the pan
 * drops; the visual beam rotation additionally flips for RTL. */
export function signedTiltDeg(tilt: Pick<BalanceTilt, 'angleDeg' | 'heavy'>): number {
  if (tilt.heavy === null) return 0;
  return tilt.heavy === 'against' ? tilt.angleDeg : -tilt.angleDeg;
}

/** The drawn arm at the 640px design width (the 25%–75% beam): the
 * reference Lh for the pure tilt math. The RENDERED drops use
 * 25cqw × sin θ, so they scale with the stage width exactly as the
 * arm does — the model's angle is untouched. */
export const BALANCE_LH_PX = 320;

/** v6 capacity: the compact tiles a pan shows before its "+{n} more"
 * pill — 2 (two full-width rows, legible full labels at every
 * viewport; the rest stay one tap away in the side's full list). */
export const BALANCE_PAN_CAPACITY = 2;

/** The restrained pan tilt as a fraction of the beam's angle: 0.2 →
 * at most 2.4° at the 12° maximum — the pans follow the beam enough
 * to feel connected while factor text stays comfortably upright. */
export const BALANCE_PAN_TILT_FRACTION = 0.2;

/** The pivot's y in stage pixels (the beam's rotation centre; the
 * dotted level reference runs through it). */
export const BALANCE_PIVOT_Y_PX = 44;
/** The vertical hang from a beam end at rest to its pan's top edge —
 * the suspension length the hangers draw. */
export const BALANCE_HANG_PX = 36;
/** How far each hanger's bottom anchor sits from its column centre —
 * the two lines splay from the bead (a point) to the pan's top edge. */
export const BALANCE_HANG_SPREAD_PX = 24;
/** The hanger lines' drawn length (√(spread² + hang²) — the hypotenuse
 * from bead to pan edge) and their splay off vertical. */
export const BALANCE_HANG_LEN_PX = Math.hypot(BALANCE_HANG_SPREAD_PX, BALANCE_HANG_PX);
export const BALANCE_HANG_ANGLE_DEG = (Math.atan2(BALANCE_HANG_SPREAD_PX, BALANCE_HANG_PX) * 180) / Math.PI;
/** The pan tops' y = pivot + hang: the stage's fixed pan-grid offset. */
export const BALANCE_PAN_TOP_PX = BALANCE_PIVOT_Y_PX + BALANCE_HANG_PX;
/** The fixed stage heights (mobile / ≥sm) and pan heights: the stage
 * reserves the pan stack, the overflow pill, and exactly the
 * ±(Lh ÷ 2) × sin 12° swing of the 640px design width (≥sm). */
export const BALANCE_STAGE_H_MOBILE = 260;
export const BALANCE_STAGE_H_DESKTOP = 240;
export const BALANCE_PAN_H_MOBILE = 118;
export const BALANCE_PAN_H_DESKTOP = 88;

const radOf = (deg: number): number => (deg * Math.PI) / 180;

export interface BalanceTilt {
  /** The beam's rotation in degrees (positive = the against side
   * heavy in the LTR reading; the RTL render flips the visual sign
   * via --s). 0 = level. */
  angleDeg: number;
  /** The vertical move of ONE beam end off rest: (Lh ÷ 2) × sin(angle) —
   * the heavy end drops by this, the light one climbs by it. The two
   * endpoint beads therefore sit 2 × risePx apart = Lh × sin(angle). */
  risePx: number;
  /** The beam-end height difference: Lh × sin(angle) — the ONLY height
   * difference the picture may show. */
  endDropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (v1 §6 steps 3–4, kept verbatim by v2 §4, v3–v6 rule
 * 4): net 0 → level; nothing readable → level; otherwise angle =
 * |net|/total × MAX, floored at MIN so one driver still leans. `lhPx`
 * is the pin-to-pin distance in the drawing's units (0 → level).
 */
export function balanceTilt(counts: BalanceCounts, lhPx: number): BalanceTilt {
  if (counts.readable === 0 || counts.net === 0 || lhPx <= 0) {
    return { angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null };
  }
  const ratio = Math.abs(counts.net) / counts.total;
  const angleDeg = Math.min(BALANCE_MAX_ANGLE_DEG, Math.max(BALANCE_MIN_ANGLE_DEG, ratio * BALANCE_MAX_ANGLE_DEG));
  const endDropPx = Math.sin(radOf(angleDeg)) * lhPx;
  return { angleDeg, risePx: endDropPx / 2, endDropPx, heavy: counts.net > 0 ? 'for' : 'against' };
}

export type BalanceVerdict = 'for' | 'balanced' | 'against' | 'none';

/** The verdict word (spec §5.1 + §13): nothing readable → "Can't read…";
 * otherwise the net's sign, "Balanced" at exactly zero. The beam tilts
 * ONLY when this verdict is directional (v3–v6 rule 4). */
export function balanceVerdictOf(counts: BalanceCounts): BalanceVerdict {
  if (counts.readable === 0) return 'none';
  if (counts.net > 0) return 'for';
  if (counts.net < 0) return 'against';
  return 'balanced';
}

/** The count line's non-zero parts (spec §13): "{n} for · {n} against ·
 * {n} neutral · {n} couldn't be read", zero parts omitted. */
export function countLineParts(counts: BalanceCounts, copy: InsightsCopy, numberLocale: 'en-US' | 'fa-IR'): string[] {
  const n = (value: number): string => formatNumber(value, numberLocale, { maximumFractionDigits: 0 });
  const b = copy.signals.balance;
  const parts: Array<[number, string]> = [
    [counts.for, interpolate(b.countFor, { n: n(counts.for) })],
    [counts.against, interpolate(b.countAgainst, { n: n(counts.against) })],
    [counts.neutral, interpolate(b.countNeutral, { n: n(counts.neutral) })],
    [counts.unread, interpolate(b.countUnread, { n: n(counts.unread) })],
  ];
  return parts.filter(([count]) => count > 0).map(([, text]) => text);
}

/** The tilt animation (v1 §6.7, kept by v2 §5.9, v3–v6): ~500 ms ease
 * on the beam rotation AND on the pan assemblies' drop+tilt — one
 * motion, disabled for prefers-reduced-motion users. */
const TILT_TRANSITION_CLASS = 'transition-transform duration-500 ease-out motion-reduce:transition-none';

export function BalanceScale({
  drivers,
  copy,
  numberLocale,
  banner,
}: {
  drivers: readonly BalanceDriver[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The card's existing verdict banner sentence (spec §5.2 — kept
   * unchanged, rendered inside the aggregate assessment box). */
  banner?: ReactNode;
}): React.JSX.Element | null {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const [openKey, setOpenKey] = useState<string | null>(null);
  /** Which side's full factor list is expanded (v6: opened by the
   * pan's "+{n} more" pill — one independent toggle per side). */
  const [openLists, setOpenLists] = useState<{ for: boolean; against: boolean }>({ for: false, against: false });

  if (drivers.length === 0) return null;

  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  /* The tilt from the fixed design-width arm (rule 5: the geometry
   * never depends on anything measured at runtime — the rendered drops
   * scale with the stage via 25cqw × sin θ). */
  const tilt = balanceTilt(counts, BALANCE_LH_PX);
  /* The PHYSICAL signed angle (against-heavy positive) drives the pan
   * drops (--t); the VISUAL beam rotation (--s) flips for RTL so the
   * heavy side's end always dips. The drops themselves stay signed by
   * --t in BOTH directions. */
  const tDeg = signedTiltDeg(tilt);
  const sDeg = rtl ? -tDeg : tDeg;

  const verdictWord =
    verdict === 'for'
      ? b.verdictFor
      : verdict === 'against'
        ? b.verdictAgainst
        : verdict === 'balanced'
          ? b.verdictBalanced
          : b.verdictNone;
  const verdictToneClass =
    verdict === 'for'
      ? verdictTone.bullish
      : verdict === 'against'
        ? verdictTone.bearish
        : 'text-[var(--color-status-stale)]';
  const verdictIcon = verdict === 'for' ? 'bullish' : verdict === 'against' ? 'bearish' : null;

  const parts = countLineParts(counts, copy, numberLocale);
  const ariaLabel = interpolate(b.aria, { summary: parts.join(' · '), verdict: verdictWord });

  const toggle = (key: string): void => setOpenKey((prev) => (prev === key ? null : key));
  const openDriver = drivers.find((d) => d.key === openKey) ?? null;

  /** The stage's geometry custom properties: --t (physical signed
   * angle) and --s (visual, RTL-flipped) in degrees; --lh-half is
   * 25cqw = Lh ÷ 2 BY CONSTRUCTION (the beam spans half the stage),
   * so each pan drops exactly as far as its bead does; --pan-tilt is
   * the restrained 0.2 × --s lean that keeps the pans feeling hung
   * while tiles stay upright enough to read. Pure CSS calc + sin() —
   * no runtime measurement (a browser without trig simply renders the
   * level state, never a wrong direction). */
  const stageVars = {
    '--t': `${tDeg}deg`,
    '--s': `${sDeg}deg`,
    '--lh-half': '25cqw',
    '--drop-against': 'calc(var(--lh-half) * sin(var(--t)))',
    '--drop-for': 'calc(var(--lh-half) * sin(var(--t)) * -1)',
    '--pan-tilt': `calc(var(--s) * ${BALANCE_PAN_TILT_FRACTION})`,
  } as React.CSSProperties;

  /** One compact factor tile RESTING ON THE PAN (v6's load): icon +
   * full short name (never truncated) + the value where space permits
   * (hidden below `sm` so mobile rows stay single-line legible). A
   * real button — its tap opens the shared detail panel with the
   * factor's full explanation. Bottom of the pan = the floor, so the
   * loads sit ON the surface (contact shadow included). */
  const tile = (d: BalanceDriver, side: 'for' | 'against'): React.JSX.Element => (
    <button
      key={d.key}
      type="button"
      aria-expanded={openKey === d.key}
      aria-controls="gold-balance-detail"
      onClick={() => toggle(d.key)}
      data-balance-tile={d.key}
      className="insights-focusable flex min-h-[40px] w-full cursor-pointer flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2 py-1 text-start shadow-[0_1px_2px_rgb(15_23_42/0.14)] ring-1 ring-[var(--color-border)] sm:min-h-[32px]"
    >
      <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 text-[length:var(--type-caption)] font-bold leading-tight text-[var(--color-text-primary)]">
        {d.label}
      </span>
      {d.valueText !== null ? (
        <bdi
          dir="ltr"
          className="hidden shrink-0 text-[length:var(--type-caption)] font-semibold leading-tight tabular-nums text-[var(--color-text-secondary)] sm:inline"
        >
          {d.valueText}
        </bdi>
      ) : null}
    </button>
  );

  /** One full factor row (v2 §5.5, the list item under the expansion):
   * icon ~20px + the short name + the current value, 56px tall — a
   * real button whose tap opens the shared detail panel. */
  const block = (d: BalanceDriver, side: 'for' | 'against'): React.JSX.Element => (
    <button
      key={d.key}
      type="button"
      aria-expanded={openKey === d.key}
      aria-controls="gold-balance-detail"
      onClick={() => toggle(d.key)}
      data-balance-block={d.key}
      className="insights-focusable flex h-[56px] w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1 text-start ring-1 ring-[var(--color-border)]"
    >
      <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={20} className="shrink-0" />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          {d.label}
        </span>
        {d.valueText !== null ? (
          <bdi
            dir="ltr"
            className="text-[length:var(--type-label)] font-semibold leading-tight tabular-nums text-[var(--color-text-secondary)]"
          >
            {d.valueText}
          </bdi>
        ) : null}
      </span>
    </button>
  );

  /** The empty-side line (v4 semantics, kept verbatim): when the
   * evaluation ran, the side with no qualifying factors carries the
   * evidence-based line; when NOTHING could be read (readable 0),
   * both sides carry the unavailable line instead — an absence of
   * readings is never worded as an absence of pressure. */
  const emptyLineOf = (side: 'for' | 'against'): string =>
    counts.readable === 0 ? b.listEmptyNone : side === 'for' ? b.listEmptyFor : b.listEmptyAgainst;

  /** The side's full-list section (below the assessment): all rows
   * when the pan's "+{n} more" pill expanded it; the full empty line
   * whenever the side has no qualifying factors (visible WITHOUT any
   * disclosure — the explanatory message is never hidden behind a
   * click). Always in the DOM so the pill's aria-controls is valid. */
  const listSection = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
    const expanded = openLists[side];
    const show = blocks.length === 0 || expanded;
    return (
      <div className="flex min-w-0 flex-col gap-1.5" data-balance-list={side} id={`gold-balance-list-${side}`} hidden={!show}>
        <h5
          className={`m-0 inline-flex items-center gap-1.5 text-[length:var(--type-label)] font-bold ${
            side === 'for' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
          }`}
        >
          <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={16} className="shrink-0" />
          {side === 'for' ? b.sideFor : b.sideAgainst}
        </h5>
        {blocks.length > 0 ? (
          <span className="flex min-w-0 flex-col gap-1.5">
            {blocks.map((d) => block(d, side))}
            {expanded && blocks.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpenLists((prev) => ({ ...prev, [side]: false }))}
                aria-expanded="true"
                aria-controls={`gold-balance-list-${side}`}
                data-balance-fewer={side}
                className="insights-focusable mt-1 inline-flex min-h-[24px] cursor-pointer items-center self-start rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
              >
                {copy.ui.showFewer}
              </button>
            ) : null}
          </span>
        ) : (
          <p
            data-balance-empty-line={side}
            className="m-0 rounded-[var(--radius-sm)] bg-currena-soft/60 px-2.5 py-2.5 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]"
          >
            {emptyLineOf(side)}
          </p>
        )}
      </div>
    );
  };

  /** One side's PAN ASSEMBLY — the rigid hanging group: two thin
   * suspension lines from the beam-end bead down to the pan's top
   * edge, the shallow rimmed pan (a heavier floor edge), the factor
   * tiles resting on that floor, and the "+{n} more" pill hanging
   * just under the pan. The whole assembly translates by its side's
   * drop (var(--drop-…) — exactly its bead's drop) and tilts by the
   * restrained 0.2 × --s, pivoting at the hang point (its top centre),
   * so bead → lines → pan read as one connected machine at every
   * angle. Geometry is FIXED: capacity-bound tiles, fixed pan height,
   * nothing about the count can resize the drawing. */
  const panAssembly = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
    const visible = blocks.slice(0, BALANCE_PAN_CAPACITY);
    const hiddenCount = blocks.length - visible.length;
    const expanded = openLists[side];
    return (
      <div
        data-balance-assembly={side}
        className={`relative ${TILT_TRANSITION_CLASS}`}
        style={{
          transform: `translateY(var(--drop-${side})) rotate(var(--pan-tilt))`,
          transformOrigin: '50% 0',
        }}
      >
        {/* The two suspension lines: splayed from the bead (a point at
         * the column centre, at the beam's end) down to the pan's top
         * edge ± BALANCE_HANG_SPREAD_PX — thin (2px), rounded, drawn
         * in the tertiary ink (quiet in light, still visible in dark)
         * — plus a tiny junction dot where each line meets the pan rim
         * (the "ring" that makes the connection read as mechanical,
         * not sketched). */}
        <span
          aria-hidden="true"
          data-balance-hanger={`${side}-start`}
          className="absolute bottom-full w-[2px] rounded-full bg-[var(--color-text-tertiary)]"
          style={{
            left: `calc(50% - ${BALANCE_HANG_SPREAD_PX + 1}px)`,
            height: BALANCE_HANG_LEN_PX,
            transform: `rotate(${BALANCE_HANG_ANGLE_DEG}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
        <span
          aria-hidden="true"
          data-balance-hanger={`${side}-end`}
          className="absolute bottom-full w-[2px] rounded-full bg-[var(--color-text-tertiary)]"
          style={{
            left: `calc(50% + ${BALANCE_HANG_SPREAD_PX - 1}px)`,
            height: BALANCE_HANG_LEN_PX,
            transform: `rotate(${-BALANCE_HANG_ANGLE_DEG}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
        <span
          aria-hidden="true"
          data-balance-hanger={`${side}-start-ring`}
          className="absolute top-[-2px] size-[4px] rounded-full bg-[var(--color-text-tertiary)]"
          style={{ left: `calc(50% - ${BALANCE_HANG_SPREAD_PX + 2}px)` }}
        />
        <span
          aria-hidden="true"
          data-balance-hanger={`${side}-end-ring`}
          className="absolute top-[-2px] size-[4px] rounded-full bg-[var(--color-text-tertiary)]"
          style={{ left: `calc(50% + ${BALANCE_HANG_SPREAD_PX - 2}px)` }}
        />
        {/* The pan: a shallow tray — a 1.5px rim, a heavier 3px floor
         * edge in the darker ink (the "supporting edge" that carries
         * the loads), a light inner wall line just above it (tray
         * thickness), a solid surface tint and a subtle drop shadow
         * underneath. Fixed height per breakpoint; the tiles rest on
         * the floor (justify-end, gapped, contact-shadowed). An empty
         * side keeps the COMPLETE pan with a minimal muted marker. */}
        <div
          data-balance-pan={side}
          className="relative mx-auto flex h-[118px] w-[92%] flex-col justify-end gap-1.5 rounded-[10px] border-[1.5px] border-b-[3px] border-[var(--color-border)] border-b-[var(--color-text-secondary)] bg-currena-soft/70 p-2 shadow-[0_12px_16px_-14px_rgb(15_23_42/0.5)] dark:bg-currena-soft/90 sm:h-[88px]"
        >
          <span
            aria-hidden="true"
            data-balance-pan-floor={side}
            className="pointer-events-none absolute inset-x-[6px] bottom-[5px] h-[1.5px] rounded-full bg-[var(--color-surface)]/60"
          />
          {visible.length > 0 ? (
            visible.map((d) => tile(d, side))
          ) : (
            <p
              data-balance-empty={side}
              className="m-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]"
            >
              {counts.readable === 0 ? b.panUnreadable : b.panEmpty}
            </p>
          )}
        </div>
        {/* The capacity overflow pill: "+{n} more" collapsed, "Show
         * fewer" expanded — the site's attention-tile convention. It
         * hangs just BELOW the pan (inside the translating assembly,
         * clearly attached to its side, deliberately NOT on the pan
         * surface so it can never read as another load or a fabricated
         * weight). It expands the side's full list below. */}
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setOpenLists((prev) => ({ ...prev, [side]: !expanded }))}
            aria-expanded={expanded ? 'true' : 'false'}
            aria-controls={`gold-balance-list-${side}`}
            data-balance-more={expanded ? undefined : side}
            data-balance-fewer={expanded ? side : undefined}
            className="insights-focusable mx-auto mt-1 flex min-h-[26px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
          >
            {expanded
              ? copy.ui.showFewer
              : interpolate(copy.ui.attentionTileMore, {
                  n: formatNumber(hiddenCount, numberLocale, { maximumFractionDigits: 0 }),
                })}
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3" data-balance>
      {/* 1. THE HEADING + SUBTITLE: the concept's own name — «برآیند
       * عوامل مؤثر بر قیمت طلا» — clearly more prominent than its
       * explanatory subtitle. */}
      <div className="flex flex-col gap-1" data-balance-heading>
        <h4 data-balance-title className="type-question m-0 text-[var(--color-text-primary)]">
          {b.heading}
        </h4>
        <p
          data-balance-subtitle
          className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
        >
          {b.subtitle}
        </p>
      </div>

      {/* 2. THE SIDE CAPTIONS: one per pan column, aligned by the same
       * two-column grid as the pans — icon + the side's label in its
       * side colour (colour never rides alone: the arrow icon and the
       * word carry the meaning). DOM order (for → against) is the tab
       * order; the grid mirrors with the document direction. */}
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-2" data-balance-captions>
        {(['for', 'against'] as const).map((side) => (
          <h4
            key={side}
            data-balance-caption={side}
            className={`m-0 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-[length:var(--type-label)] font-bold ${
              side === 'for' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
            }`}
          >
            <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={16} className="shrink-0" />
            {side === 'for' ? b.sideFor : b.sideAgainst}
          </h4>
        ))}
      </div>

      {/* 3. THE BALANCE STAGE: one fixed-height relative box (a size
       * container — cqw units resolve against it). Inside, in paint
       * order: the dotted level reference (behind everything), the
       * two pan assemblies (the interactive layer — the tiles are real
       * buttons), and the beam zone (beam + beads + hub + keystone,
       * pointer-transparent, painted OVER the hanger tops so each bead
       * caps its suspension lines). role="group" carries the result as
       * its label (§12.1); the tiles inside stay real buttons (§7.4). */}
      <div
        data-balance-stage
        role="group"
        aria-label={ariaLabel}
        className="relative mx-auto h-[260px] w-full max-w-[640px] text-[var(--color-text-secondary)] [container-type:inline-size] sm:h-[240px]"
        style={stageVars}
      >
        {/* The dotted level reference through the pivot (v2 §5.3,
         * kept): behind everything, spanning WIDER than the beam —
         * the eye compares the tilted beam with level, so a small
         * lean stays honest. */}
        <div
          aria-hidden="true"
          data-balance-reference
          className="absolute inset-x-[6%] top-[43px] h-[2px]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-text-tertiary) 1.1px, transparent 1.3px)',
            backgroundSize: '7px 2px',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 0',
          }}
        />
        {/* The pan grid at the fixed pan-top offset: one assembly per
         * column, no gap (the pans centre themselves in their
         * columns, so the beam ends land exactly over the column
         * centres). */}
        <div className="absolute inset-x-0 top-[80px] z-[1] grid grid-cols-2">
          {panAssembly('for', forBlocks)}
          {panAssembly('against', againstBlocks)}
        </div>
        {/* The beam zone (painted over the hangers' tops): the tapered
         * beam rotating about the pivot with its two accent beads,
         * then the fixed hub + keystone pivot above it. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[2]">
          <div
            data-balance-beam
            className={`absolute left-1/4 top-[38px] h-[12px] w-1/2 bg-current [clip-path:polygon(0%_17%,50%_0%,100%_17%,100%_83%,50%_100%,0%_83%)] ${TILT_TRANSITION_CLASS}`}
            style={{ transform: 'rotate(var(--s))' }}
          >
            <span
              data-balance-bead="for"
              className="absolute top-1/2 size-[13px] -translate-y-1/2 start-[-6.5px] rounded-full bg-[var(--color-status-normal)]"
            />
            <span
              data-balance-bead="against"
              className="absolute top-1/2 size-[13px] -translate-y-1/2 end-[-6.5px] rounded-full bg-[var(--color-status-alert)]"
            />
          </div>
          {/* The hub caps the beam's centre — the machined pivot with
           * a pin dot in the card's surface colour (fixed: never
           * rotates, the beam turns under it). */}
          <span
            data-balance-pivot
            className="absolute left-1/2 top-[44px] flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-current"
          >
            <span className="size-[6.5px] rounded-full bg-[var(--color-surface)]" />
          </span>
          {/* The keystone: a 30×13 triangle whose apex meets the hub's
           * underside (v4 rule: NOT a support column, NO base bar —
           * the flat base is the ground). */}
          <span
            data-balance-fulcrum
            className="absolute top-[52px] h-0 w-0"
            style={{
              left: 'calc(50% - 15px)',
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderBottom: '13px solid currentColor',
            }}
          />
        </div>
      </div>

      {/* 4. THE AGGREGATE ASSESSMENT: the verdict word with its icon
       * in the question voice, the count line under it (colour never
       * rides alone) and the card's banner sentence where needed —
       * ONE compact, centred, soft box directly beneath the drawing. */}
      <div
        className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-1 rounded-[var(--radius-lg)] bg-currena-soft/60 px-4 py-3 text-center"
        data-balance-verdict={verdict}
      >
        <span className={`inline-flex items-center gap-1.5 ${verdictToneClass}`}>
          <VerdictIcon verdict={verdictIcon} size={20} desktopSize={24} />
          <span className="type-question font-bold leading-tight">{verdictWord}</span>
        </span>
        {parts.length > 0 ? (
          <span
            className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
            data-balance-count
          >
            {parts.join(' · ')}
          </span>
        ) : null}
        {banner}
      </div>

      {/* 5. THE FULL FACTOR LISTS: the side's complete rows (full
       * labels + values, every one a button into the shared detail
       * panel) as controlled expansions — the pan's "+{n} more" pill
       * opens them; an empty side's evidence-based line renders
       * WITHOUT any disclosure. Side by side from `sm:`, stacked on
       * the narrowest screens. */}
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3" data-balance-lists>
        {listSection('for', forBlocks)}
        {listSection('against', againstBlocks)}
      </div>

      {/* The shared detail panel (v2 §5.5.6 — every width): one open
       * panel at a time, tap again to close. It always exists in the DOM
       * (so every aria-controls is valid) and stays hidden until a tile,
       * a row or a tray chip opens it. */}
      <div
        id="gold-balance-detail"
        data-balance-detail={openDriver !== null ? openDriver.key : undefined}
        hidden={openDriver === null}
        className="rounded-[var(--radius-sm)] bg-currena-soft/60 px-3 py-2 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]"
      >
        {openDriver !== null ? (
          <>
            <span className="font-bold text-[var(--color-text-primary)]">{openDriver.label}: </span>
            {openDriver.detail}
          </>
        ) : null}
      </div>

      {/* 6. THE TRAYS (§5.4 + §8) — neutral (quiet) and unread (dashed +
       * the existing clock icon) are DIFFERENT states and were never on
       * the pans. Empty trays hide (§8.5). */}
      {neutralChips.length > 0 ? (
        <div className="flex flex-col gap-1.5" data-balance-tray="neutral">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {b.trayNeutral}
          </h4>
          <span className="flex flex-wrap gap-1.5">
            {neutralChips.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-expanded={openKey === d.key}
                aria-controls="gold-balance-detail"
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)] ring-1 ring-[var(--color-border)]"
              >
                <ConditionIcon state="neutral" />
                {d.label}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      {unreadChips.length > 0 ? (
        <div className="flex flex-col gap-1.5" data-balance-tray="unread">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {b.trayUnread}
          </h4>
          <span className="flex flex-wrap gap-1.5">
            {unreadChips.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-expanded={openKey === d.key}
                aria-controls="gold-balance-detail"
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)]"
              >
                <ConditionIcon state="unknown" />
                {d.label}
              </button>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
