/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, the v2 seesaw patch, v3, v4,
 * v5, the v6 PANS directive, and now the v7 Iteration-5 addendum,
 * 2026-10-26 — "Rotate the beam only, and visualize weight").
 *
 * v7 supersedes v6's motion rules (addendum §A): EXACTLY ONE element
 * rotates — the beam group (beam bar + pivot ring + needle), by
 * rotate(θ, pivotX, pivotY) about the pivot. The pans, their rim ends,
 * tiles, text, icons, headings and overflow pills are NEVER rotated,
 * skewed or scaled: a pan moves ONLY by translate(x, y) so it hangs
 * plumb from its beam-end joint, and the hanger lines are redrawn
 * every frame from each joint to the two fixed rim corners of its
 * upright pan — their angle changes slightly as the pans travel,
 * which reads as a real hanging pan. All of it — beam rotation, joint
 * positions, pan translations, hanger endpoints — derives from ONE
 * animated value θ in the SAME frame (one React state → one render;
 * no element carries its own CSS transition, so nothing can desync
 * and detach). The vertical travel stays inside the fixed reserved
 * envelope computed from the maximum θ, so no layout shift occurs.
 *
 * v7 also adds the weight read-outs the addendum §B allows WITHOUT
 * inventing data (the scoring model is untouched — counts only):
 *   · the beam angle itself: θ ∝ the signed net score on a clamped
 *     linear presentation scale — max 8° at the model's full range
 *     (|net| = total), floored at 2° for any valid directional
 *     result, exactly 0° for neutral, 0° + the explicit state label
 *     for unavailable (the item count never sets θ);
 *   · a POINTER NEEDLE fixed to the beam's pivot, pointing downward
 *     and rotating with the beam, read against a small FIXED arc
 *     scale with three ticks only (adverse end · centre · supportive
 *     end — no numeric labels, no fabricated thresholds), hidden
 *     when the state is unavailable. The needle is what makes a 2°
 *     lean legible.
 * Per-side weighted totals and per-factor weights do NOT exist in
 * the model, so the side-load bar and the per-tile weight marker are
 * deliberately NOT implemented (addendum §B: never fabricate).
 *
 * Composition (v6, kept): the heading + subtitle; the two side
 * captions over the pan columns; THE BALANCE — a beam + pivot + bead
 * + hanger + pan assembly per side in one fixed-height stage, with
 * the compact factor tiles resting INSIDE the pans (the loads); the
 * aggregate assessment box; the full per-side factor lists opened by
 * each pan's "+{n} more" pill; the shared detail panel; the Neutral /
 * Couldn't-read trays.
 *
 * Physical coherence (v7's whole point): the beam group rotates by θ
 * about the pivot, so each beam end (joint) lands at
 * (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ). The pan on the lowered end
 * moves DOWN by its joint's vertical displacement, the raised one UP
 * — each by translate(0, dy) only, so it hangs plumb. The hangers are
 * recomputed straight lines joint → rim; because the joint also
 * travels a second-order horizontal amount ((L/2)·(cos θ − 1) ≈ 1.5px
 * at 8°) while the pan stays on its column, the two lines' angles
 * change slightly — the real-hanging-pan cue the addendum asks for.
 *
 * Rules that survive verbatim from v3/v4/v5/v6:
 *   1. Carefully proportioned vector geometry with controlled weights
 *      (beam 12px > pivot ring 16px > beads 13px > hangers/needle 2px)
 *      and a fixed-height stage (272px mobile / 240px ≥ sm) that
 *      reserves exactly the ±(L/2)·sin 8° swing plus the pan stack —
 *      the envelope is computed from the maximum θ (addendum §A).
 *   2. No dashed placeholder rectangles: a side with no qualifying
 *      factors keeps its COMPLETE pan (hangers, rim, floor) with a
 *      minimal muted marker inside, and its full evidence-based line
 *      in the list area below; when NOTHING could be read, both pans
 *      carry the distinct "nothing to weigh yet" marker instead.
 *   3. Capacity, not overflow: each pan shows the first
 *      BALANCE_PAN_CAPACITY tiles; the rest are counted by the
 *      "+{n} more" pill hanging under the pan (deliberately NOT a
 *      tile, so it can never read as another load), which expands
 *      the side's full list. Nothing is silently omitted; the model
 *      still sees every driver; the stage's geometry never depends
 *      on any count.
 *   4. Direction follows the model (v1 §6 steps 3–4 — the ratio law
 *      itself is UNTOUCHED; the v7 addendum supersedes only its
 *      presentation scale): the beam tilts ONLY for a valid
 *      aggregate verdict, angle = |net|/total × 8° clamped to
 *      [2°, 8°]; balanced and unreadable verdicts render level. The
 *      NUMBER of tiles never sets the tilt — only the documented
 *      net/total ratio does.
 *   5. Fixed stage geometry: the stage's height is constant per
 *      breakpoint; any number of factors on either side can never
 *      resize, clip or collide with the drawing.
 *
 * RTL: the pan columns, captions and list sections are CSS-grid
 * children, so they mirror with the document direction automatically.
 * The beam's rotation sign flips for RTL in the geometry (the heavy
 * side's end always dips; the physical signed angle that drives the
 * pan drops is direction-free), and the joint/pan/rim coordinates are
 * computed per side so the `for` hangers always meet the beam end
 * above the `for` pan. Nothing mirrors text.
 *
 * Reusable by contract (spec §2.6): the component takes a list of
 * drivers and knows nothing about gold beyond the copy strings; the
 * merged card applies it to the gold driver list only.
 */

import { useEffect, useRef, useState } from 'react';
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

/** The tilt constants. The RATIO LAW (v1 §6 steps 3–4: net/total) is
 * the owner's scoring model and is byte-identical; the v7 Iteration-5
 * addendum supersedes only its PRESENTATION scale: a clamped linear
 * mapping with a 8° maximum at the model's full range (|net|/total =
 * 1) and a 2° floor so any valid directional result is visibly
 * unlevel (the needle makes even 2° readable). Neutral and
 * unavailable are exactly level. */
export const BALANCE_MAX_ANGLE_DEG = 8;
export const BALANCE_MIN_ANGLE_DEG = 2;

/* ------------------------------------------------------------------ *
 * v7 stage metrics — ONE fixed-height stage. The logical design width
 * is 640px (the stage's max width); the beam spans 25%–75% of the
 * stage (its ends = the two pan columns' centres), the pans fill 92%
 * of their 50% columns, and every mechanical coordinate is computed
 * from the MEASURED stage width so the drawing scales as one piece.
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
 * reference Lh for the pure tilt math. The RENDERED joints scale with
 * the measured stage width exactly as the arm does — the model's
 * angle is untouched. */
export const BALANCE_LH_PX = 320;

/** v6 capacity: the compact tiles a pan shows before its "+{n} more"
 * pill — 2 (two full-width rows, legible full labels at every
 * viewport; the rest stay one tap away in the side's full list). */
export const BALANCE_PAN_CAPACITY = 2;

/** The pivot's y in stage pixels (the beam's rotation centre; the
 * dotted level reference runs through it). */
export const BALANCE_PIVOT_Y_PX = 44;
/** The vertical hang from a beam end at rest to its pan's top edge —
 * the rest length the hangers draw. */
export const BALANCE_HANG_PX = 36;
/** How far each hanger's bottom anchor sits from its column centre —
 * the two lines run from the joint (a point) to the pan's top rim. */
export const BALANCE_HANG_SPREAD_PX = 24;
/** The pan tops' y = pivot + hang: the stage's fixed pan-grid offset. */
export const BALANCE_PAN_TOP_PX = BALANCE_PIVOT_Y_PX + BALANCE_HANG_PX;
/** The fixed stage heights (mobile / ≥sm) and pan heights: the stage
 * reserves the pan stack, the overflow pill, and the ±(Lh ÷ 2) × sin
 * of the 8° maximum at the 640 design width (the envelope is
 * computed from the maximum θ — addendum §A). */
export const BALANCE_STAGE_H_MOBILE = 260;
export const BALANCE_STAGE_H_DESKTOP = 240;
export const BALANCE_PAN_H_MOBILE = 118;
export const BALANCE_PAN_H_DESKTOP = 88;
/** The beam's pin-to-pin length is half the stage, so the vertical
 * travel of one pan is (stageWidth ÷ 4) × sin θ — at the 640 design
 * width and the 8° maximum this is 160 × sin 8° ≈ 22.27px: the fixed
 * reserved envelope every frame must stay inside (tested). */
export const BALANCE_SWING_PX = (BALANCE_LH_PX / 2) * Math.sin((BALANCE_MAX_ANGLE_DEG * Math.PI) / 180);

/** The needle + arc (addendum §B): the needle hangs from the pivot,
 * 26px long, and reads against a fixed arc of radius 27 with three
 * ticks (r 27 → 32) at straight-down ± the maximum angle — the tip
 * sweeps exactly to the end ticks at ±8°. */
export const BALANCE_NEEDLE_LEN_PX = 26;
export const BALANCE_ARC_R_PX = 27;
export const BALANCE_ARC_TICK_OUT_PX = 32;

/** The stage's logical design width — the pre-measurement default
 * (the SSR render draws the level balance at this width; the layout
 * effect swaps in the measured width before the first paint). */
export const BALANCE_STAGE_W_DESIGN = 640;

/** The tilt animation (the Odometer's rAF pattern, per addendum §A):
 * ~500 ms ease-out cubic on the ONE animated value θ — every derived
 * coordinate re-renders in the same frame. prefers-reduced-motion
 * users land on the verdict angle immediately. */
const TILT_ANIMATION_MS = 500;

const radOf = (deg: number): number => (deg * Math.PI) / 180;
/** Rendered SVG coordinates are rounded to 2 decimals — deterministic
 * strings, no float noise, sub-0.01px error. */
const r2 = (v: number): number => Math.round(v * 100) / 100;

export interface BalanceTilt {
  /** The beam's rotation in degrees (positive = the against side
   * heavy in the LTR reading; the RTL render flips the visual sign). */
  angleDeg: number;
  /** The vertical move of ONE beam end off rest: (Lh ÷ 2) × sin(angle). */
  risePx: number;
  /** The beam-end height difference: Lh × sin(angle) — the ONLY height
   * difference the picture may show. */
  endDropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (v1 §6 steps 3–4 — the net/total ratio law, kept
 * verbatim; the v7 addendum supersedes the presentation scale): net 0
 * → level; nothing readable → level; otherwise angle =
 * |net|/total × MAX clamped to [MIN, MAX]. `lhPx` is the
 * pin-to-pin distance in the drawing's units (0 → level).
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
 * ONLY when this verdict is directional (v3–v7 rule 4). */
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

/* ------------------------------------------------------------------ *
 * v7 stage geometry — the pure per-frame derivation (addendum §A).
 * Given the measured stage width, the CURRENT signed physical angle
 * and the direction, this computes EVERYTHING the frame draws: the
 * beam group's rotate(θ, pivotX, pivotY), each side's beam-end joint,
 * each pan's pure-vertical translation, and the hanger endpoints
 * (joint → the pan's two fixed rim corners). Pure — unit-tested
 * without a DOM; the component renders from it every frame.
 * ------------------------------------------------------------------ */

export interface BalancePoint {
  x: number;
  y: number;
}

export interface BalanceSideGeometry {
  /** The beam-end joint this side hangs from, at the current θ:
   * (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ) — the hangers' top end. */
  joint: BalancePoint;
  /** The pan's translation — ONLY vertical (the pan hangs plumb from
   * its joint): the joint's y displacement off rest. */
  panDrop: number;
  /** The pan's top-rim suspension point at −SPREAD from its column
   * centre, translated by the drop — a FIXED point of the pan. */
  rimStart: BalancePoint;
  /** The pan's top-rim suspension point at +SPREAD (idem). */
  rimEnd: BalancePoint;
}

export interface BalanceStageGeometry {
  stageWidth: number;
  /** The pivot: the beam's rotation centre (cx, cy = pivotY). */
  cx: number;
  cy: number;
  /** The beam's half-length — a quarter of the stage width (the beam
   * spans 25%–75%, its ends over the two pan columns' centres). */
  halfArm: number;
  /** The VISUAL beam rotation in degrees (RTL flips the sign so the
   * heavy side's end always dips; the physical angle drives drops). */
  beamAngleDeg: number;
  /** The beam group's transform — rotate(θ, pivotX, pivotY). This is
   * the ONLY transform in the whole drawing (tested). */
  beamTransform: string;
  for: BalanceSideGeometry;
  against: BalanceSideGeometry;
}

export function balanceStageGeometry(
  stageWidth: number,
  signedPhysicalDeg: number,
  rtl: boolean,
): BalanceStageGeometry {
  const w = Math.max(1, stageWidth);
  const cx = w / 2;
  const cy = BALANCE_PIVOT_Y_PX;
  const halfArm = w / 4;
  const visualDeg = rtl ? -signedPhysicalDeg : signedPhysicalDeg;
  const rad = radOf(visualDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // The beam ends under rotation: the joints the pans hang from.
  const left: BalancePoint = { x: cx - halfArm * cos, y: cy - halfArm * sin };
  const right: BalancePoint = { x: cx + halfArm * cos, y: cy + halfArm * sin };
  // LTR: the for pan is the LEFT column; RTL mirrors the grid, so for
  // is the right one. The pan centres are the joints' REST positions.
  const forIsLeft = !rtl;
  const forJoint = forIsLeft ? left : right;
  const againstJoint = forIsLeft ? right : left;
  const forCentreX = forIsLeft ? cx - halfArm : cx + halfArm;
  const againstCentreX = forIsLeft ? cx + halfArm : cx - halfArm;
  // Each pan translates by EXACTLY its joint's vertical displacement —
  // plumb. (The joint's second-order horizontal travel (L/2)(cosθ−1)
  // is deliberately NOT followed: the hangers' angles change slightly
  // instead, which reads as a real hanging pan.)
  const side = (joint: BalancePoint, centreX: number): BalanceSideGeometry => {
    const drop = joint.y - cy;
    return {
      joint,
      panDrop: drop,
      rimStart: { x: centreX - BALANCE_HANG_SPREAD_PX, y: BALANCE_PAN_TOP_PX + drop },
      rimEnd: { x: centreX + BALANCE_HANG_SPREAD_PX, y: BALANCE_PAN_TOP_PX + drop },
    };
  };
  return {
    stageWidth: w,
    cx,
    cy,
    halfArm,
    beamAngleDeg: visualDeg,
    beamTransform: `rotate(${r2(visualDeg)} ${r2(cx)} ${r2(cy)})`,
    for: side(forJoint, forCentreX),
    against: side(againstJoint, againstCentreX),
  };
}

/** The fixed gauge (addendum §B): a small arc behind the needle with
 * THREE ticks only — adverse end, centre, supportive end. The needle
 * is rigid with the beam and points DOWN, so its tip swings to the
 * side OPPOSITE the heavy pan (rigid-body rotation); the ticks are
 * therefore labelled by VERDICT: the tick the needle reaches when a
 * side is heavy names that side, so "needle at the adverse mark"
 * reads as the adverse verdict (a dial, not a pointer-at-the-pan —
 * the way a real instrument's scale compensates its mechanism). No
 * numeric labels, no fabricated thresholds; the text equivalent is
 * the whole drawing's aria (colour never rides alone). */
export interface BalanceGaugeTick {
  kind: 'adverse' | 'center' | 'supportive';
  from: BalancePoint;
  to: BalancePoint;
}

export interface BalanceGaugeGeometry {
  /** The arc path (r = 27, spanning straight-down ± the max angle). */
  arcPath: string;
  ticks: BalanceGaugeTick[];
}

export function balanceGaugeGeometry(cx: number, cy: number, rtl: boolean): BalanceGaugeGeometry {
  const max = BALANCE_MAX_ANGLE_DEG;
  // SVG angles measured from +x, straight-down = 90°; the arc spans
  // 90° ± max. adverse tick: 90° + max in LTR (the left end — the
  // needle swings there when the right/against pan is heavy), mirrored
  // for RTL (the against pan is the left column there).
  const adverseDeg = 90 + (rtl ? -max : max);
  const supportiveDeg = 90 - (rtl ? -max : max);
  const point = (deg: number, r: number): BalancePoint => ({
    x: r2(cx + r * Math.cos(radOf(deg))),
    y: r2(cy + r * Math.sin(radOf(deg))),
  });
  const start = point(90 - max, BALANCE_ARC_R_PX);
  const end = point(90 + max, BALANCE_ARC_R_PX);
  const tick = (deg: number, kind: BalanceGaugeTick['kind']): BalanceGaugeTick => ({
    kind,
    from: point(deg, BALANCE_ARC_R_PX),
    to: point(deg, BALANCE_ARC_TICK_OUT_PX),
  });
  return {
    arcPath: `M ${start.x} ${start.y} A ${BALANCE_ARC_R_PX} ${BALANCE_ARC_R_PX} 0 0 1 ${end.x} ${end.y}`,
    ticks: [
      tick(adverseDeg, 'adverse'),
      tick(90, 'center'),
      tick(supportiveDeg, 'supportive'),
    ],
  };
}

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

  /* Model-level reads (pure — an empty driver list yields the level
   * balance, so every hook below keeps its call order unconditional). */
  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);
  /* The tilt from the fixed design-width arm (rule 5: the model math
   * never depends on anything measured at runtime; the rendered
   * geometry scales with the measured stage width below). */
  const tilt = balanceTilt(counts, BALANCE_LH_PX);
  /* The PHYSICAL signed angle (against-heavy positive) is the ANGLE
   * TARGET; the VISUAL beam rotation flips for RTL inside the
   * geometry so the heavy side's end always dips. */
  const targetDeg = signedTiltDeg(tilt);

  /* THE ONE ANIMATED VALUE (addendum §A): θ. The SSR/first render
   * paints the final angle (progressive: the static picture is the
   * verdict, matching v5/v6 behaviour — no settle-in on load), and
   * the rAF timeline below animates it whenever the model's target
   * changes (a data refresh), re-deriving the beam rotation, joints,
   * pan translations and hanger endpoints in the SAME frame. */
  const [theta, setTheta] = useState(targetDeg);
  const thetaRef = useRef(targetDeg);
  const frame = useRef(0);

  /** The measured stage width (the pre-paint default is the 640
   * design width; a layout effect swaps in the real measurement
   * before the first paint, and a ResizeObserver keeps it current). */
  const [stageWidth, setStageWidth] = useState(BALANCE_STAGE_W_DESIGN);
  const stageEl = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef(BALANCE_STAGE_W_DESIGN);

  useEffect(() => {
    const el = stageEl.current;
    if (!el) return undefined;
    const apply = (w: number): void => {
      if (w > 0 && Math.abs(w - widthRef.current) > 0.5) {
        widthRef.current = w;
        setStageWidth(w);
      }
    };
    // Pre-paint sync measurement — the first client paint is already
    // at the true width (no flash of the 640-default geometry).
    apply(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const from = thetaRef.current;
    if (from === targetDeg) return undefined;
    const land = (v: number): void => {
      thetaRef.current = v;
      setTheta(v);
    };
    // Reduced motion (the Odometer rule): land on the verdict angle
    // immediately; the same media query silences the app's other
    // motion. Environments without rAF land the same way.
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof requestAnimationFrame !== 'function') {
      land(targetDeg);
      return undefined;
    }
    const start = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / TILT_ANIMATION_MS);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      land(from + (targetDeg - from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        land(targetDeg);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [targetDeg]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (drivers.length === 0) return null;

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  /* THE FRAME: every mechanical coordinate derives from the one θ in
   * this single render — beam rotation, joints, plumb pan drops,
   * hanger endpoints (joint → the pan's two fixed rim corners). */
  const geo = balanceStageGeometry(stageWidth, theta, rtl);
  const gauge = balanceGaugeGeometry(geo.cx, geo.cy, rtl);

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

  /* The gauge's text equivalent (addendum §B: never colour alone) —
   * the whole mechanical drawing is one role="img" whose label states
   * the beam tilt and the verdict. Hidden entirely when the state is
   * unavailable (no needle, no verdict — the state label in the
   * assessment box carries it). */
  const gaugeAvailable = verdict !== 'none';
  const gaugeAria = interpolate(b.gaugeAria, {
    n: formatNumber(tilt.angleDeg, numberLocale, { maximumFractionDigits: 0 }),
    verdict: verdictWord,
  });

  /* The frame's fixed anchors: the beam-group LOCAL coordinates of
   * the two beads — the for bead terminates the beam end above the
   * for pan (left in LTR, right in RTL), the against bead the other. */
  const forEndX = geo.for.joint.x < geo.cx ? geo.cx - geo.halfArm : geo.cx + geo.halfArm;
  const againstEndX = geo.for.joint.x < geo.cx ? geo.cx + geo.halfArm : geo.cx - geo.halfArm;

  const toggle = (key: string): void => setOpenKey((prev) => (prev === key ? null : key));
  const openDriver = drivers.find((d) => d.key === openKey) ?? null;

  /** One compact factor tile RESTING ON THE PAN (v6's load): icon +
   * full short name (never truncated) + the value where space permits
   * (hidden below `sm` so mobile rows stay single-line legible). A
   * real button — its tap opens the shared detail panel with the
   * factor's full explanation. Bottom of the pan = the floor, so the
   * loads sit ON the surface (contact shadow included). v7: the tile
   * is NEVER rotated, skewed or scaled — it only rides its pan's
   * plumb translation, so its text stays horizontal at every angle
   * (the 12.48px caption floor holds at every viewport). */
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

  /** One side's PAN ASSEMBLY (v7: translate ONLY): the junction ring
   * dots on the pan's top rim, the shallow rimmed pan (a heavier
   * floor edge), the factor tiles resting on that floor, and the
   * "+{n} more" pill hanging just under the pan. The assembly moves
   * by translate(0, dy) — EXACTLY its joint's vertical displacement —
   * so it hangs plumb; it NEVER rotates, skews or scales. The
   * hangers themselves live in the SVG layer below and are redrawn
   * every frame from the joint to these rim points. Geometry is
   * FIXED: capacity-bound tiles, fixed pan height, nothing about the
   * count can resize the drawing. */
  const panAssembly = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
    const visible = blocks.slice(0, BALANCE_PAN_CAPACITY);
    const hiddenCount = blocks.length - visible.length;
    const expanded = openLists[side];
    const drop = side === 'for' ? geo.for.panDrop : geo.against.panDrop;
    return (
      <div
        data-balance-assembly={side}
        className="relative"
        style={{ transform: `translate(0px, ${r2(drop)}px)` }}
      >
        {/* The two rim junction rings — the hangers' bottom anchors:
         * fixed points of the pan (its top edge, ±SPREAD from the
         * column centre), carried by the translating assembly. */}
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

  /** The hanger lines of one side (v7: SVG lines, redrawn every
   * frame): straight lines from the side's beam-end JOINT to the
   * pan's two fixed rim corners — they meet the joint exactly, and
   * their angles change slightly as the pans travel (the pan stays
   * on its column while the joint arcs). No transform anywhere —
   * the endpoints themselves are the geometry. */
  const hangersOf = (side: 'for' | 'against'): React.JSX.Element[] => {
    const g = side === 'for' ? geo.for : geo.against;
    const ends: Array<{ name: 'start' | 'end'; to: BalancePoint }> = [
      { name: 'start', to: g.rimStart },
      { name: 'end', to: g.rimEnd },
    ];
    return ends.map(({ name, to }) => (
      <line
        key={`${side}-${name}`}
        aria-hidden="true"
        data-balance-hanger={`${side}-${name}`}
        x1={r2(g.joint.x)}
        y1={r2(g.joint.y)}
        x2={r2(to.x)}
        y2={r2(to.y)}
        strokeWidth={2}
        strokeLinecap="round"
        className="stroke-[var(--color-text-tertiary)]"
      />
    ));
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

      {/* 3. THE BALANCE STAGE: one fixed-height relative box. Inside,
       * in paint order: the dotted level reference (behind
       * everything), the MECHANICAL LAYER — one SVG holding the
       * hanger lines, the fixed gauge (arc + three ticks), and THE
       * BEAM GROUP (beam bar + beads + pivot ring + needle), the
       * only element that rotates — then the pan grid (the
       * interactive layer — the tiles are real buttons, translated
       * plumb). role="group" carries the result as its label
       * (§12.1); the SVG is one role="img" whose label is the
       * needle's text equivalent (hidden when unavailable). */}
      <div
        ref={stageEl}
        data-balance-stage
        role="group"
        aria-label={ariaLabel}
        className="relative mx-auto h-[260px] w-full max-w-[640px] text-[var(--color-text-secondary)] sm:h-[240px]"
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
        {/* THE MECHANICAL LAYER (v7): hangers (redrawn per frame,
         * joint → rim) → the fixed gauge arc + its three ticks → the
         * BEAM GROUP, rotated by rotate(θ, pivotX, pivotY) — the one
         * and only transform in the drawing. The beam group carries
         * the tapered bar, the two accent beads (green for / red
         * against — the side markers where the hangers meet the
         * beam), the pivot ring with its pin, and the needle (hidden
         * when the state is unavailable). */}
        <svg
          data-balance-mech
          role={gaugeAvailable ? 'img' : undefined}
          aria-label={gaugeAvailable ? gaugeAria : undefined}
          aria-hidden={gaugeAvailable ? undefined : true}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        >
          {hangersOf('for')}
          {hangersOf('against')}
          {/* The fixed gauge scale: a quiet arc behind the needle with
           * three ticks only — adverse end, centre, supportive end
           * (labelled by verdict; see balanceGaugeGeometry). */}
          <g data-balance-arc>
            <path
              d={gauge.arcPath}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              className="stroke-[var(--color-text-tertiary)]"
            />
            {gauge.ticks.map((t) => (
              <line
                key={t.kind}
                data-balance-tick={t.kind}
                x1={t.from.x}
                y1={t.from.y}
                x2={t.to.x}
                y2={t.to.y}
                strokeWidth={2}
                strokeLinecap="round"
                className="stroke-[var(--color-text-tertiary)]"
              />
            ))}
          </g>
          {/* THE BEAM GROUP — rotate(θ, pivotX, pivotY): the beam bar
           * (tapered 12px mid → 8px ends), the accent beads at the
           * joints, the needle below the pivot, the pivot ring + pin
           * capping it all (the ring turns with the beam — the
           * addendum's rotating pivot ring). */}
          <g data-balance-beam transform={geo.beamTransform}>
            <path
              data-balance-beam-bar
              fill="currentColor"
              d={`M ${r2(geo.cx - geo.halfArm)} ${r2(geo.cy - 4)} L ${r2(geo.cx)} ${r2(geo.cy - 6)} L ${r2(geo.cx + geo.halfArm)} ${r2(geo.cy - 4)} L ${r2(geo.cx + geo.halfArm)} ${r2(geo.cy + 4)} L ${r2(geo.cx)} ${r2(geo.cy + 6)} L ${r2(geo.cx - geo.halfArm)} ${r2(geo.cy + 4)} Z`}
            />
            <circle
              data-balance-bead="for"
              r={6.5}
              cx={r2(forEndX)}
              cy={geo.cy}
              className="fill-[var(--color-status-normal)]"
            />
            <circle
              data-balance-bead="against"
              r={6.5}
              cx={r2(againstEndX)}
              cy={geo.cy}
              className="fill-[var(--color-status-alert)]"
            />
            {/* The pointer needle (addendum §B): fixed to the pivot,
             * pointing downward, rotating with the beam — a rigid
             * down-needle swings to the side OPPOSITE the heavy pan,
             * so the arc's end ticks are labelled by verdict. Hidden
             * when the state is unavailable. */}
            {gaugeAvailable ? (
              <line
                data-balance-needle
                x1={r2(geo.cx)}
                y1={r2(geo.cy)}
                x2={r2(geo.cx)}
                y2={r2(geo.cy + BALANCE_NEEDLE_LEN_PX)}
                strokeWidth={2}
                strokeLinecap="round"
                className="stroke-current"
              />
            ) : null}
            {/* The pivot ring (rotates with the beam) + its pin dot in
             * the card's surface colour. */}
            <circle data-balance-pivot r={8} cx={r2(geo.cx)} cy={geo.cy} className="fill-current" />
            <circle r={3.25} cx={r2(geo.cx)} cy={geo.cy} className="fill-[var(--color-surface)]" />
          </g>
        </svg>
        {/* The pan grid at the fixed pan-top offset: one assembly per
         * column, no gap (the pans centre themselves in their
         * columns, so the beam joints land exactly over the column
         * centres at rest). Each assembly TRANSLATES ONLY — never
         * rotates, skews or scales. */}
        <div className="absolute inset-x-0 top-[80px] z-[2] grid grid-cols-2">
          {panAssembly('for', forBlocks)}
          {panAssembly('against', againstBlocks)}
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
