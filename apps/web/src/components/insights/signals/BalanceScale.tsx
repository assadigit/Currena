/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, the v2 seesaw patch, v3, v4,
 * v5, the v6 PANS directive, the v7 Iteration-5 addendum 2026-10-26, and
 * the R9-03/R9-08 owner round 2026-10-27 — "show ALL with/against
 * reasons on the balance itself" + "the empty state's full sentence
 * INSIDE the balance box").
 *
 * R9-03 (v8) supersedes v6's capacity rule: EVERY supporting and
 * pressuring driver renders ON ITS PAN as a compact chip — there is no
 * "show only 2, hide the rest behind see-more" limitation anymore, no
 * "+{n} more" pill, and no separate full-list section. The pans keep
 * their geometry (a shallow tray hung from the beam ends) but their
 * height is now the LOAD's height: the pan grows with its chip stack
 * and the stage reserves the taller stack plus the swing envelope, so
 * any number of factors renders without overflow or clipping (tested
 * 360px and 1280px). The v6 fixed-stage-height constant (capacity-bound)
 * is retired with it — the drawing's MECHANICS (one rotating beam group,
 * plumb pan translations, per-frame hangers, needle + arc) are kept
 * verbatim from v7.
 *
 * R9-08: an empty side's evidence-based FULL sentence ("None of the
 * factors checked shows a meaningful signal supporting gold's price
 * right now.") renders INSIDE the pan itself, centred and muted —
 * replacing the v6 small pill ("No qualifying signals") and the
 * separate list-area card that carried the same sentence. When nothing
 * could be read at all, BOTH pans carry the shared "nothing could be
 * read" sentence inside the drawing.
 *
 * v7 (kept verbatim) supersedes v6's motion rules (addendum §A): EXACTLY
 * ONE element rotates — the beam group (beam bar + pivot ring + needle),
 * by rotate(θ, pivotX, pivotY) about the pivot. The pans, their rim ends,
 * tiles, text, icons, headings and overflow pills are NEVER rotated,
 * skewed or scaled: a pan moves ONLY by translate(x, y) so it hangs
 * plumb from its beam-end joint, and the hanger lines are redrawn
 * every frame from each joint to the two fixed rim corners of its
 * upright pan — their angle changes slightly as the pans travel,
 * which reads as a real hanging pan. All of it — beam rotation, joint
 * positions, pan translations, hanger endpoints — derives from ONE
 * animated value θ in the SAME frame (one React state → one render;
 * no element carries its own CSS transition, so nothing can desync
 * and detach).
 *
 * v7 also keeps the weight read-outs the addendum §B allows WITHOUT
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
 *     when the state is unavailable. The needle is what makes a 3°
 *     lean legible.
 * Per-side weighted totals and per-factor weights do NOT exist in
 * the model, so the side-load bar and the per-tile weight marker are
 * deliberately NOT implemented (addendum §B: never fabricate).
 *
 * Composition (v8): the heading + subtitle; the two side captions over
 * the pan columns; THE BALANCE — a beam + pivot + needle + hanger + pan
 * assembly per side in one stage whose height RESERVES the taller pan
 * stack + the swing, with ALL the compact factor chips resting INSIDE
 * the pans (the loads), an empty pan carrying its full evidence-based
 * sentence; the aggregate assessment box; the shared detail panel; the
 * Neutral / Couldn't-read trays.
 *
 * Physical coherence (v7's whole point): the beam group rotates by θ
 * about the pivot, so each beam end (joint) lands at
 * (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ). The pan on the lowered end
 * moves DOWN by its joint's vertical displacement, the raised one UP
 * — each by translate(0, dy) only, so it hangs plumb. The hangers are
 * recomputed straight lines joint → rim; because the joint also
 * travels a second-order horizontal amount ((L/2)·(cos θ − 1) ≈ 1.5px
 * at 10°) while the pan stays on its column, the two lines' angles
 * change slightly — the real-hanging-pan cue the addendum asks for.
 *
 * Rules that survive verbatim from v3/v4/v5/v6:
 *   1. Carefully proportioned vector geometry with controlled weights
 *      (beam 12px > pivot ring 16px > beads 13px > hangers/needle 2px)
 *      and a fixed-height stage (272px mobile / 240px ≥ sm) that
 *      reserves exactly the ±(L/2)·sin 10° swing plus the pan stack —
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
 *   4. Direction follows the model (the net sign → the verdict word is
 *      UNTOUCHED; the 2026-10-21c owner round supersedes only its
 *      PRESENTATION scale): the beam tilts ONLY for a valid
 *      aggregate verdict, angle = |net|/(for+against) × 10° clamped to
 *      [3°, 10°] — the share of the DIRECTIONAL load on the heavy side
 *      (a one-sided pan tips the whole way). Balanced and unreadable
 *      verdicts render level. The NUMBER of tiles never sets the
 *      direction — only the model's net does.
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
 *
 * Gold balance consolidation P2 (GB-S3, 2026-11-03 —
 * docs/specs/gold-balance-consolidation/03-UX-AND-COPY.md): ADDITIVE
 * optional fields on BalanceDriver (members/split/tally/note) + three
 * optional slots (subtitle/contextLine/measuredNote) carry the LANE view
 * behind the ?balance=lanes preview flag. The drawing, the animation,
 * the beam formula and every LEGACY branch are untouched — drivers
 * without the new fields render byte-for-byte as before (pinned by the
 * legacy-markup snapshot test, gold-balance-lanes.test.tsx).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatNumber } from '@currena/core';
import type { SignalConditionState } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';
import { ConditionIcon } from './icons';
import { VerdictIcon, verdictTone } from './verdict';
// GB-S4 (05 §11): the lane weight + the balance's own tokens/component
// styles. The CSS file rides the Insights lazy chunk with this module;
// its rules are all scoped under [data-balance-visual], which only the
// lanes visual mounts — the default view's markup is untouched.
import { BalanceWeight, BalanceWeightDisc, BalanceWeightSkeleton } from './BalanceWeight';
import './balance-visual.css';

/** One balance driver — the spec's four states (§4). `neutral` (read,
 * no effect) and `unread` (could not be read) are DIFFERENT states. */
export type BalanceDriverState = 'for' | 'against' | 'neutral' | 'unread';

/** Gold balance consolidation P2 (GB-S3, 03 §3): one member row of a
 * driver's detail-panel list — a lane's voter. The component stays
 * reusable by contract: it renders these lines and knows nothing about
 * gold beyond the copy strings (the caller builds them). */
export interface BalanceMember {
  /** Stable identity (the voter's indicator id — also the deep link). */
  key: string;
  /** The voter's short name. */
  label: string;
  /** The voter's impact: firing members group under Supports/Pressures;
   * `steady` = readable, not firing; `unread` = could not be read. */
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  /** The evidence phrase when firing ("falling", "high in its decade"),
   * else null. The caller composes any per-member suffix (e.g. the B-12
   * card-status word beside the lean phrase). */
  evidenceText: string | null;
  /** The current value, display-formatted, or null when unread. */
  valueText: string | null;
}

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
  /** GB-S3 (03 §3): the driver's member list for the detail panel —
   * grouped Supports/Pressures, steady collapsed by name, unread listed.
   * Absent on the legacy condition chips (their panel stays one line). */
  members?: ReadonlyArray<BalanceMember>;
  /** GB-S3 (03 §2): a contested neutral (supports === pressures > 0) —
   * renders the badge beside the label and appends the badge word to the
   * chip's accessible name. */
  split?: boolean;
  /** GB-S3 (03 §2): the chip's second line, built by the caller from
   * copy ("4 of 8 drivers firing" / "No driver firing" / "2 for, 2
   * against"). Absent on the legacy chips. */
  tally?: string;
  /** GB-S3 (03 §3 item 5): the driver's context line under the intro
   * sentence (the inflation lane's tilt phrase). Absent when null. */
  note?: string;
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

/** The tilt constants. The SCORING (the net sign → the verdict word and
 * the counts) is the owner's model and is byte-identical. The v7
 * Iteration-5 addendum's presentation scale (|net|/total × 8°, floor 2°)
 * is superseded by the 2026-10-21c owner round — the owner's complaint:
 * "the tilt of balance for gold is too slow, currently one side has an
 * item, other doesn't have at all, but they are seemingly aligned."
 * The new presentation scale measures the DIRECTIONAL load only —
 * |net| / (for + against), the share of the pan load sitting on the heavy
 * side (neutral and unread conditions never rest on a pan, so they no
 * longer damp the picture) — on a steeper [3°, 10°] range:
 *   · a one-sided directional load (the owner's case) tips the beam the
 *     whole way to 10° — a lone item visibly weighs its side down;
 *   · a 2:1 directional majority tips ~6.7° — clearly off level;
 *   · an even directional split stays exactly level (net 0).
 * Neutral and unavailable are exactly level. The needle + the reserved
 * envelope are derived from the same constants, so they track. */
export const BALANCE_MAX_ANGLE_DEG = 10;
export const BALANCE_MIN_ANGLE_DEG = 3;

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

/* ------------------------------------------------------------------ *
 * R9-03 (v8) pan sizing — the pan is the LOAD's height. Every chip
 * renders on its pan, so a pan's height grows with its chip stack and
 * the stage reserves the taller stack plus the swing envelope. The
 * chips' compact metrics (mobile / ≥sm) and the pan padding/floor are
 * the arithmetic the stage uses to RESERVE space before the pans are
 * measured; the pans themselves size naturally (min-height floor), and
 * a ResizeObserver keeps the stage's reserve tracking the measured
 * truth — a wrapped label can never clip, because the reserve grows
 * with the real height.
 * ------------------------------------------------------------------ */

/** One compact factor chip's height: 40px mobile / 32px ≥sm. */
export const BALANCE_CHIP_H_MOBILE = 40;
export const BALANCE_CHIP_H_DESKTOP = 32;
/** The vertical gap between a pan's chips. */
export const BALANCE_CHIP_GAP_PX = 6;
/** The pan's own vertical padding (p-2 → 8px top + 8px bottom). */
export const BALANCE_PAN_PAD_Y_PX = 16;
/** An empty pan's minimum height — keeps the drawing's shape when a
 * side carries only its evidence-based sentence (R9-08). */
export const BALANCE_PAN_MIN_H_MOBILE = 118;
export const BALANCE_PAN_MIN_H_DESKTOP = 88;
/** Quiet breathing room under the dropped pan inside the stage. */
export const BALANCE_STAGE_BOTTOM_PAD_PX = 8;

/** The ≥sm breakpoint in stage pixels: the stage's max width IS 640
 * (Tailwind's sm threshold) — a measured stage of 640 means the
 * viewport is at or above sm. */
export const BALANCE_SM_STAGE_W_PX = 640;

/** A pan's reserved height for `chips` resting chips — the arithmetic
 * RESERVE (the real pan sizes naturally and the stage tracks the
 * measurement). Empty pans keep the minimum so the drawing keeps its
 * shape with the full sentence inside (R9-08). Pure. */
export function balancePanHeightPx(chips: number, isSm: boolean): number {
  const minH = isSm ? BALANCE_PAN_MIN_H_DESKTOP : BALANCE_PAN_MIN_H_MOBILE;
  const chipH = isSm ? BALANCE_CHIP_H_DESKTOP : BALANCE_CHIP_H_MOBILE;
  const n = Math.max(0, Math.floor(chips));
  if (n === 0) return minH;
  return Math.max(minH, BALANCE_PAN_PAD_Y_PX + n * chipH + (n - 1) * BALANCE_CHIP_GAP_PX);
}

/** The stage's reserved height: the pan-grid offset + the TALLER pan +
 * the maximum swing + the bottom pad (the envelope computed from the
 * maximum θ at the 640 design width — the stage is never wider).
 * Pure. */
export function balanceStageHeightPx(forChips: number, againstChips: number, isSm: boolean): number {
  const panH = Math.max(balancePanHeightPx(forChips, isSm), balancePanHeightPx(againstChips, isSm));
  return Math.ceil(BALANCE_PAN_TOP_PX + panH + BALANCE_SWING_PX + BALANCE_STAGE_BOTTOM_PAD_PX);
}

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
/** The beam's pin-to-pin length is half the stage, so the vertical
 * travel of one pan is (stageWidth ÷ 4) × sin θ — at the 640 design
 * width and the 10° maximum this is 160 × sin 10° ≈ 27.78px: the fixed
 * reserved envelope every frame must stay inside (tested). R9-03 (v8):
 * the stage's own HEIGHT is no longer a fixed constant — the stage
 * reserves the taller pan stack + this swing via balanceStageHeightPx
 * (the pans grow with their chip stacks now). */
export const BALANCE_SWING_PX = (BALANCE_LH_PX / 2) * Math.sin((BALANCE_MAX_ANGLE_DEG * Math.PI) / 180);

/** The needle + arc (addendum §B): the needle hangs from the pivot,
 * 26px long, and reads against a fixed arc of radius 27 with three
 * ticks (r 27 → 32) at straight-down ± the maximum angle — the tip
 * sweeps exactly to the end ticks at ±10°. */
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
 * The tilt rule (the scoring's net sign drives everything; the 2026-10-21c
 * presentation scale maps it onto the beam): net 0 → level; nothing
 * readable → level; otherwise angle = |net| / (for + against) × MAX
 * clamped to [MIN, MAX] — the share of the DIRECTIONAL load on the heavy
 * side, so a one-sided pan tips the beam the whole way while neutral and
 * unread conditions (never on a pan) cannot damp the picture. `lhPx` is
 * the pin-to-pin distance in the drawing's units (0 → level).
 */
export function balanceTilt(counts: BalanceCounts, lhPx: number): BalanceTilt {
  if (counts.readable === 0 || counts.net === 0 || lhPx <= 0) {
    return { angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null };
  }
  const directional = counts.for + counts.against;
  const ratio = directional > 0 ? Math.abs(counts.net) / directional : 0;
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

/* ------------------------------------------------------------------ *
 * GB-S4 (05 §4.2 + the reference prototype's mechanics table): the
 * LANES visual's stage geometry — pure, derived from the measured
 * stage width and the size class. The beam ANGLE still comes from
 * the unchanged balanceTilt formula above (05: "the beam formula is
 * unchanged"); only the drawing is new.
 *
 * Size classes follow the CARD's own width (the reference's rule, a
 * container-query pattern): s < 560, m 560–759, l >= 760.
 * ------------------------------------------------------------------ */

/** The lanes visual's stage max width (05 §9: the stage centres inside
 * the wider card; 720 keeps the instrument >= 60% of the ~1100px card
 * at desktop — the reference prototype's measured value, which wins
 * over 05 §9's 640 draft for V-2's own criterion). */
export const BALANCE_VISUAL_STAGE_MAX_W = 720;

/** The tilt animation for the lanes visual (05 §7): 650 ms ease-out
 * quartic on load and on data change, then still. The LEGACY drawing
 * keeps its own 500 ms cubic (its path is untouched). */
export const BALANCE_VISUAL_TILT_MS = 650;

/** The pans' fixed height (the reference's 268, holding the worst
 * case: the caption + FOUR weights in two rows + the rim zone). The
 * stage's height is reserved from the same constant, so no data state
 * can ever resize or clip the drawing (05 §4.2). */
export const BALANCE_VISUAL_PAN_H_PX = 268;

/** The lanes visual's size class (the reference's sizeOfWidth). */
export type BalanceVisualSize = 's' | 'm' | 'l';

export function balanceVisualSizeOfWidth(width: number): BalanceVisualSize {
  return width < 560 ? 's' : width < 760 ? 'm' : 'l';
}

export interface BalanceVisualGeometry {
  stageWidth: number;
  size: BalanceVisualSize;
  /** The pan width: 46% of the stage on mobile, else min(280, 38%). */
  pw: number;
  /** The beam's pin-to-pin length = stageWidth − pw (the pan centres
   * sit on the beam ends; the pan edges touch the stage edges). */
  L: number;
  cx: number;
  /** The pivot's y: 56 mobile, 72 otherwise. */
  pivotY: number;
  /** (L/2)·sin(10°) — the reserved vertical swing envelope. */
  swing: number;
  /** The hangers' rest length: swing + 22. */
  hanger: number;
  /** The pans' rest top = pivotY + hanger. */
  restTop: number;
  panH: number;
  /** The stage's reserved height (never depends on the data). */
  H: number;
  /** A pan weight's label column width. */
  weightW: number;
  /** A pan weight's disc diameter (58 desktop, 52 mobile — 05 §4.3). */
  discD: number;
  /** The dial's radius: 30 mobile, 42 otherwise. */
  dialR: number;
}

/** The lanes visual's stage metrics (pure; the reference's geometry
 * table, with the pan height tuned so the four-weights stack fits at
 * 360px — the reference's own 236 draft overflowed its stack
 * scenario, measured before implementation). */
export function balanceVisualGeometry(stageWidth: number, size: BalanceVisualSize): BalanceVisualGeometry {
  const s = size === 's';
  const W = Math.max(220, Math.round(stageWidth));
  const pw = s ? Math.round(W * 0.46) : Math.round(Math.min(280, W * 0.38));
  const L = W - pw;
  const pivotY = s ? 56 : 72;
  const swing = (L / 2) * Math.sin(radOf(BALANCE_MAX_ANGLE_DEG));
  const hanger = Math.round(swing + 22);
  const panH = BALANCE_VISUAL_PAN_H_PX;
  const H = Math.ceil(pivotY + hanger + panH + swing + 40);
  // Two weights + their column gap must fit a pan's inner width so the
  // worst case wraps to two rows of two, never one-per-row (the
  // reference's own readout caught the 1-per-row overflow at 360).
  const weightW = s ? Math.max(50, Math.min(70, Math.floor((pw - 20) / 2))) : 78;
  return {
    stageWidth: W,
    size,
    pw,
    L,
    cx: W / 2,
    pivotY,
    swing,
    hanger,
    restTop: pivotY + hanger,
    panH,
    H,
    weightW,
    discD: s ? Math.min(52, weightW - 6) : 58,
    dialR: s ? 30 : 42,
  };
}

export interface BalanceVisualFrame {
  /** The VISUAL rotation in degrees: positive dips the RIGHT beam end
   * (SVG rotate is clockwise). rtl flips the sign so the heavy side's
   * end always dips — the same direction-free physical angle drives
   * the drops (the legacy rule, kept). */
  visDeg: number;
  forIsLeft: boolean;
  /** The two beam-end joints at the current angle. */
  jointLeft: BalancePoint;
  jointRight: BalancePoint;
  /** Each pan's plumb translation — ONLY vertical, exactly its joint's
   * displacement (05 §7: "pans translate only"). */
  forDrop: number;
  againstDrop: number;
  /** The needle's dial angle: clamp(vis × 3, ±32) over the ±35°, 11-tick
   * dial (the reference's 3× magnified readout — a 3° lean is legible). */
  needleDeg: number;
}

/** The lanes visual's per-frame derivation (pure): from the ONE
 * animated physical angle θ (the legacy convention: against-heavy
 * positive, 0 = level) and the direction, every mechanical coordinate
 * the frame draws. Unit-tested without a DOM. */
export function balanceVisualFrame(
  geo: Pick<BalanceVisualGeometry, 'L' | 'cx' | 'pivotY'>,
  signedPhysicalDeg: number,
  rtl: boolean,
): BalanceVisualFrame {
  const vis = rtl ? -signedPhysicalDeg : signedPhysicalDeg;
  const rad = radOf(vis);
  const half = geo.L / 2;
  const jointLeft: BalancePoint = { x: geo.cx - half * Math.cos(rad), y: geo.pivotY - half * Math.sin(rad) };
  const jointRight: BalancePoint = { x: geo.cx + half * Math.cos(rad), y: geo.pivotY + half * Math.sin(rad) };
  // Right end's vertical displacement; the pans hang plumb (translate
  // only), each by exactly its joint's displacement.
  const rightDrop = half * Math.sin(rad);
  const leftDrop = -rightDrop;
  const forIsLeft = !rtl;
  return {
    visDeg: vis,
    forIsLeft,
    jointLeft,
    jointRight,
    forDrop: forIsLeft ? leftDrop : rightDrop,
    againstDrop: forIsLeft ? rightDrop : leftDrop,
    needleDeg: Math.max(-32, Math.min(32, vis * 3)),
  };
}

export interface BalanceVisualTick {
  /** True for the centre tick (drawn longer, 05 §4.2). */
  center: boolean;
  from: BalancePoint;
  to: BalancePoint;
}

/** The dial's 11 ticks over ±35°, one every 7° (05 §4.2). Pure. */
export function balanceVisualTicks(cx: number, cy: number, r: number): BalanceVisualTick[] {
  const ticks: BalanceVisualTick[] = [];
  for (let i = -5; i <= 5; i++) {
    const a = radOf(i * 7);
    const inner = i === 0 ? 9 : 5;
    ticks.push({
      center: i === 0,
      from: { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) },
      to: { x: cx + (r - inner) * Math.sin(a), y: cy - (r - inner) * Math.cos(a) },
    });
  }
  return ticks;
}


export interface BalanceScaleProps {
  drivers: readonly BalanceDriver[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The card's existing verdict banner sentence (spec §5.2 — kept
   * unchanged, rendered inside the aggregate assessment box). */
  banner?: ReactNode;
  /** GB-S3: the lane view's reworded subtitle — absent → the dictionary's
   * own `subtitle` (the legacy view renders byte-for-byte today's page). */
  subtitle?: string;
  /** GB-S3 (01 §6): the non-voting context line under the verdict box
   * (gold's own 30-day move, never counted). Absent → nothing renders. */
  contextLine?: ReactNode;
  /** GB-S3 (01 §8.2): the measured note + the backtest link, visible
   * without a tap. Absent → nothing renders (the legacy view carries it
   * on the wind panel instead). */
  measuredNote?: ReactNode;
  /** GB-S4 (05): 'lanes' renders the P2b VISUAL redesign — the brass
   * beam stage, the lane weights with segmented rims, the verdict
   * block, the "Not leaning" tray and the ledger. Absent → the LEGACY
   * mechanical drawing renders byte-for-byte today's page (the two
   * paths share the model: balanceCounts, balanceTilt, the angle
   * constants, the RTL sign logic and the reduced-motion rule). */
  visual?: 'lanes';
}

/**
 * BalanceScale — the public component: one prop-dispatched instrument.
 * `visual === 'lanes'` mounts the P2b visual (GB-S4, behind the
 * ?balance=lanes preview flag only); every other call renders the
 * legacy mechanical drawing UNTOUCHED (the default view's byte-for-byte
 * markup is pinned by the legacy snapshot test).
 */
export function BalanceScale(props: BalanceScaleProps): React.JSX.Element | null {
  if (props.visual === 'lanes') {
    return <BalanceLanesVisual {...props} />;
  }
  return <BalanceScaleMechanical {...props} />;
}

/** interpolate with ReactNode params — the copy templates stay
 * string-shaped for the audit; this renders the steady sentence's name
 * spans without stringifying them. */
function interpolateNodes(template: string, params: Record<string, ReactNode>): React.JSX.Element {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of template.matchAll(/\{(\w+)\}/g)) {
    const at = m.index ?? 0;
    if (at > last) out.push(template.slice(last, at));
    out.push(m[1] !== undefined && m[1] in params ? params[m[1]] : m[0]);
    last = at + m[0].length;
  }
  if (last < template.length) out.push(template.slice(last));
  return <>{out}</>;
}

/* ------------------------------------------------------------------ *
 * GB-S4 — the LANES VISUAL (05-VISUAL-DESIGN-SPEC + the owner's
 * approved reference prototype). Mounted ONLY behind
 * ?balance=lanes (MergedCard passes visual="lanes"); renders the
 * 05 §4.1 anatomy: eyebrow → title → subtitle → the STAGE (a brass
 * beam balance whose pans carry LANE WEIGHTS) → the VERDICT block
 * (the hero) → the "Not leaning" tray → the four-row LEDGER → the
 * footnote. The model is the SAME as the legacy drawing's:
 * balanceCounts, balanceVerdictOf, balanceTilt (the unchanged
 * |net|/(for+against) × 10° clamped to [3°, 10°] formula), the
 * direction-free physical angle, the one animated value, and the
 * prefers-reduced-motion jump (05 §7: 650 ms ease-out quartic).
 *
 * A11y (05 §10): the stage is a labelled group; the MECHANICAL SVG is
 * one role="img" carrying the existing gaugeAria text; every weight
 * and ledger row is a real button with a visible focus ring,
 * aria-expanded and its own accessible name; the rim segments and
 * the lane strip are decorative (aria-hidden) — the counts live in
 * words (the aria labels + the ledger), never colour alone.
 * ------------------------------------------------------------------ */
function BalanceLanesVisual({
  drivers,
  copy,
  numberLocale,
  banner,
  subtitle,
  contextLine,
  measuredNote,
}: Omit<BalanceScaleProps, 'visual'>): React.JSX.Element {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const metal = 'gold' as const;
  const n = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });

  /* The model reads (the legacy path's own pure helpers). */
  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);
  const tilt = balanceTilt(counts, BALANCE_LH_PX);
  const sparse = counts.readable < 3;
  const targetDeg = sparse ? 0 : signedTiltDeg(tilt);

  /* THE ONE ANIMATED VALUE (05 §7): 650 ms ease-out quartic, landing
   * immediately under prefers-reduced-motion. The FIRST paint carries
   * the verdict angle (progressive, like the legacy path). */
  const [theta, setTheta] = useState(targetDeg);
  const thetaRef = useRef(targetDeg);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = thetaRef.current;
    if (from === targetDeg) return undefined;
    const land = (v: number): void => {
      thetaRef.current = v;
      setTheta(v);
    };
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof requestAnimationFrame !== 'function') {
      land(targetDeg);
      return undefined;
    }
    const start = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / BALANCE_VISUAL_TILT_MS);
      const eased = 1 - (1 - progress) ** 4; // ease-out quartic
      land(from + (targetDeg - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else land(targetDeg);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetDeg]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* The CARD's own measured width drives the size class; the stage's
   * width is min(720, card width) (05 §9 + the reference). jsdom has
   * no layout, so the pre-measurement default is the l geometry —
   * deterministic in tests, swapped pre-paint in browsers. */
  const [rootW, setRootW] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null) return undefined;
    const apply = (w: number): void => {
      if (w > 0 && Math.abs(w - rootW) > 0.5) setRootW(w);
    };
    apply(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const size = balanceVisualSizeOfWidth(rootW > 0 ? rootW : BALANCE_VISUAL_STAGE_MAX_W);
  const stageW = rootW > 0 ? Math.min(BALANCE_VISUAL_STAGE_MAX_W, rootW) : BALANCE_VISUAL_STAGE_MAX_W;
  const geo = balanceVisualGeometry(stageW, size);
  const frame = balanceVisualFrame(geo, theta, rtl);
  const s = size === 's';
  const bh = s ? 0.8 : 1;

  /* The ledger: one row open at a time (05 §4.6); opening from a weight
   * scrolls the row to the centre and focuses it (03 §5: focus moves
   * into the opened detail and the buttons stay keyboard-reachable). */
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openRowBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (openKey === null) return;
    const btn = openRowBtnRef.current;
    if (btn === null) return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof btn.scrollIntoView === 'function') {
      btn.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
    btn.focus({ preventScroll: true });
  }, [openKey]);

  /* The side loads (the lane weights on the pans — max 4 by
   * construction) and the tray's stones. */
  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const trayStones = drivers.filter((d) => d.state === 'neutral' || d.state === 'unread');
  const none = counts.readable === 0;

  /* The verdict word (the legacy rule kept: sparse is not a reading). */
  const verdictWord = !sparse
    ? verdict === 'for'
      ? b.verdictFor
      : verdict === 'against'
        ? b.verdictAgainst
        : verdict === 'balanced'
          ? b.verdictBalanced
          : b.verdictNone
    : counts.readable === 0
      ? b.verdictNone
      : copy.signals.notEnoughReadable;

  /* The lane's state words (05 §4.6: state in words — "Leans for gold"
   * … — colour never rides alone). */
  const laneStateTextOf = (d: BalanceDriver): string => {
    if (d.split === true && d.members !== undefined) {
      const supports = d.members.filter((m) => m.impact === 'supports').length;
      const pressures = d.members.filter((m) => m.impact === 'pressures').length;
      return interpolate(b.laneStateSplit, { supports: n(supports), pressures: n(pressures) });
    }
    return d.state === 'for'
      ? b.laneStateFor
      : d.state === 'against'
        ? b.laneStateAgainst
        : d.state === 'neutral'
          ? b.laneStateNeutral
          : b.laneStateUnread;
  };
  /** The weight's accessible name (03 §5's "{lane}: {side}. {tally}."):
   * a split lane appends the badge word before its counts so the
   * badge's meaning never rides on colour alone. */
  const laneAriaOf = (d: BalanceDriver): string => {
    const side = d.split === true ? b.laneStateNeutral : laneStateTextOf(d);
    const tally = d.split === true && d.tally !== undefined ? `${b.splitBadge}, ${d.tally}` : d.tally;
    return tally !== undefined ? interpolate(b.laneChipAria, { lane: d.label, side, tally }) : `${d.label}: ${side}.`;
  };
  const impactsOf = (d: BalanceDriver): ReadonlyArray<BalanceMember['impact']> =>
    d.members !== undefined ? d.members.map((m) => m.impact) : [];

  /** The open row's member list — the detail-panel CONTENT contract
   * (AC-2: every voter reachable), inline (05 §4.6): firing rows as
   * dot + name + "Supports/Pressures, evidence" on the end side, the
   * steady voters as ONE muted sentence, unread rows with a hollow
   * dot. The lane's intro sentence and the inflation tilt phrase
   * (03 §3 items 1+5) ride above the rows. */
  const ledgerMembersOf = (d: BalanceDriver): React.JSX.Element | null => {
    if (d.members === undefined || d.members.length === 0) return null;
    const firingGroup = (impact: 'supports' | 'pressures'): React.JSX.Element | null => {
      const rows = d.members!.filter((m) => m.impact === impact);
      if (rows.length === 0) return null;
      return (
        <div key={impact} data-balance-member-group={impact}>
          {rows.map((m) => (
            <div
              key={m.key}
              className="m"
              data-impact={m.impact}
              data-balance-member={m.key}
              data-balance-member-impact={m.impact}
            >
              <i aria-hidden="true" />
              <span>{m.label}</span>
              <span className="m-ev">
                {impact === 'supports' ? b.memberWordSupports : b.memberWordPressures}
                {m.evidenceText !== null ? ` · ${m.evidenceText}` : ''}
                {m.valueText !== null ? (
                  <>
                    {' · '}
                    <bdi dir="ltr">{m.valueText}</bdi>
                  </>
                ) : null}
                {' '}
                <a href={`/insights?card=${m.key}`} className="insights-focusable">
                  {b.memberOpenIndicator}
                </a>
              </span>
            </div>
          ))}
        </div>
      );
    };
    const unread = d.members.filter((m) => m.impact === 'unread');
    const steady = d.members.filter((m) => m.impact === 'steady');
    return (
      <>
        <p className="lane-intro" data-balance-lane-intro={d.key}>
          {d.detail}
        </p>
        {d.note !== undefined ? (
          <p className="lane-note" data-balance-lane-note>
            {d.note}
          </p>
        ) : null}
        {firingGroup('supports')}
        {firingGroup('pressures')}
        {steady.length > 0 ? (
          <div className="steady" data-balance-member-group="steady">
            {interpolateNodes(b.laneSteadySentence, {
              n: n(steady.length),
              names: steady.map((m, i) => (
                <span key={m.key}>
                  {i > 0 ? (rtl ? '، ' : ', ') : ''}
                  <span data-balance-member={m.key} data-balance-member-impact="steady">
                    {m.label}
                  </span>
                </span>
              )),
            })}
          </div>
        ) : null}
        {unread.length > 0 ? (
          <div data-balance-member-group="unread">
            {unread.map((m) => (
              <div
                key={m.key}
                className="m"
                data-impact="unread"
                data-balance-member={m.key}
                data-balance-member-impact="unread"
              >
                <i aria-hidden="true" />
                <span>{m.label}</span>
                <span className="m-ev">{b.memberWordUnread}</span>
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  };

  /* The counts line (05 §4.4): for/against/not-leaning always, unread
   * when any — tabular numbers via the locale formatter. */
  const countParts = [
    interpolate(b.laneCountFor, { n: n(counts.for) }),
    interpolate(b.laneCountAgainst, { n: n(counts.against) }),
    interpolate(b.laneCountNeutral, { n: n(counts.neutral) }),
  ];
  if (counts.unread > 0) countParts.push(interpolate(b.laneCountUnread, { n: n(counts.unread) }));

  /* The stage's accessible labels: the drawing is one role="img" with
   * the existing gaugeAria text (05 §10); the stage group carries the
   * summary aria (the legacy pattern, kept for the none case). */
  const summaryParts = countLineParts(counts, copy, numberLocale);
  const stageAria = interpolate(b.aria, { summary: summaryParts.join(' · '), verdict: verdictWord });
  const gaugeAriaText = interpolate(b.gaugeAria, {
    n: formatNumber(tilt.angleDeg, numberLocale, { maximumFractionDigits: 0 }),
    verdict: verdictWord,
  });

  const loading = drivers.length === 0;
  const emptyLineOf = (side: 'for' | 'against'): string =>
    none ? b.listEmptyNone : side === 'for' ? b.listEmptyFor : b.listEmptyAgainst;

  /* One side's pan (05 §4.2): a shallow bowl with the side's tint, the
   * caption inside its top, the brass rim along its bottom, the lane
   * weights (or the evidence sentence when empty). It moves by
   * translateY ONLY — the plumb rule (05 §7). */
  const panOf = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
    const drop = side === 'for' ? frame.forDrop : frame.againstDrop;
    const centreX = frame.forIsLeft === (side === 'for') ? geo.cx - geo.L / 2 : geo.cx + geo.L / 2;
    return (
      <div
        key={side}
        data-balance-assembly={side}
        data-balance-pan={side}
        className={`pan ${side === 'for' ? 'pan-for' : 'pan-against'}`}
        style={{
          left: r2(centreX - geo.pw / 2),
          top: r2(geo.restTop),
          width: geo.pw,
          height: geo.panH,
          transform: `translate(0px, ${r2(drop)}px)`,
        }}
      >
        <div className="pan-cap">
          <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={14} className="shrink-0" />
          <span>{side === 'for' ? b.panCapFor : b.panCapAgainst}</span>
        </div>
        {loading ? (
          <div className="weights">
            <BalanceWeightSkeleton />
            <BalanceWeightSkeleton />
          </div>
        ) : blocks.length > 0 ? (
          <div className="weights">
            {blocks.map((d) => (
              <BalanceWeight
                key={d.key}
                laneKey={d.key}
                impacts={impactsOf(d)}
                state={d.state}
                label={d.label}
                ariaLabel={laneAriaOf(d)}
                splitBadge={d.split === true ? b.splitBadge : null}
                ariaExpanded={openKey === d.key}
                onOpen={() => setOpenKey(d.key)}
              />
            ))}
          </div>
        ) : (
          <p className="pan-empty" data-balance-empty={side}>
            {emptyLineOf(side)}
          </p>
        )}
      </div>
    );
  };

  /* The hanger lines (redrawn every frame from the joint to the pan's
   * two top corners at ±42% of its width — 05 §4.2). */
  const hangersOf = (side: 'for' | 'against'): React.JSX.Element[] => {
    const joint = side === 'for' ? (frame.forIsLeft ? frame.jointLeft : frame.jointRight) : frame.forIsLeft ? frame.jointRight : frame.jointLeft;
    const drop = side === 'for' ? frame.forDrop : frame.againstDrop;
    const centreX = frame.forIsLeft === (side === 'for') ? geo.cx - geo.L / 2 : geo.cx + geo.L / 2;
    return (['start', 'end'] as const).map((name) => (
      <line
        key={`${side}-${name}`}
        aria-hidden="true"
        data-balance-hanger={`${side}-${name}`}
        x1={r2(joint.x)}
        y1={r2(joint.y)}
        x2={r2(centreX + (name === 'start' ? -1 : 1) * geo.pw * 0.42)}
        y2={r2(geo.restTop + drop)}
        strokeWidth={1.25}
        strokeLinecap="round"
        className="stroke-[var(--bal-brass-lo)] opacity-75"
      />
    ));
  };

  /* The beam's tapered outline (05 §4.2: ~20px at the centre tapering
   * to 6px at the ends; the reference's path, in the beam group's
   * local coordinates). */
  const half = geo.L / 2;
  const beamPath = `M ${r2(-half)} ${r2(-3.2 * bh)} L -20 ${r2(-7.5 * bh)} Q 0 ${r2(-10 * bh)} 20 ${r2(-7.5 * bh)} L ${r2(half)} ${r2(-3.2 * bh)} L ${r2(half)} ${r2(3.2 * bh)} L 20 ${r2(7.5 * bh)} Q 0 ${r2(10 * bh)} -20 ${r2(7.5 * bh)} L ${r2(-half)} ${r2(3.2 * bh)} Z`;
  const forEndX = frame.forIsLeft ? geo.cx - half : geo.cx + half;
  const againstEndX = frame.forIsLeft ? geo.cx + half : geo.cx - half;
  const colTop = geo.pivotY + 10;
  const colBot = geo.H - 26;
  const needleRad = radOf(frame.needleDeg);

  return (
    <div
      ref={rootRef}
      className="flex flex-col"
      data-balance={metal}
      data-balance-visual=""
      data-balance-size={size}
      data-balance-tilt-target={String(targetDeg)}
      style={{
        ['--w' as string]: `${geo.weightW}px`,
        ['--d' as string]: `${geo.discD}px`,
      } as React.CSSProperties}
    >
      {/* The gradients' ONE defs block (the reference's pattern):
       * document-scoped url(#) references from every disc + the beam. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <radialGradient id="gb-faceBrass" cx="35%" cy="28%" r="85%">
            <stop offset="0%" stopColor="var(--bal-brass-hi)" />
            <stop offset="55%" stopColor="var(--bal-brass-mid)" />
            <stop offset="100%" stopColor="var(--bal-brass-lo)" />
          </radialGradient>
          <radialGradient id="gb-faceStone" cx="35%" cy="28%" r="85%">
            <stop offset="0%" stopColor="var(--bal-stone-hi)" />
            <stop offset="100%" stopColor="var(--bal-stone-lo)" />
          </radialGradient>
          <linearGradient id="gb-beamBrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bal-brass-hi)" />
            <stop offset="50%" stopColor="var(--bal-brass-mid)" />
            <stop offset="100%" stopColor="var(--bal-brass-lo)" />
          </linearGradient>
        </defs>
      </svg>

      {/* 4.1 the head: eyebrow → title → subtitle */}
      <header className="gb-head" data-balance-heading>
        <p className="gb-eyebrow" data-balance-eyebrow>
          {b.eyebrow}
        </p>
        <h4 className="gb-title" data-balance-title>
          {b.heading}
        </h4>
        <p className="gb-sub" data-balance-subtitle>
          {subtitle ?? b.subtitle}
        </p>
      </header>

      {/* 4.2 the stage: the drawing layer behind the pans. The stage
       * height is RESERVED from the worst case (never data-sized). */}
      <div
        className="stage"
        data-balance-stage
        role="group"
        aria-label={stageAria}
        style={{ height: `${geo.H}px` }}
      >
        <svg
          className="mech"
          data-balance-mech
          viewBox={`0 0 ${geo.stageWidth} ${geo.H}`}
          role="img"
          aria-label={gaugeAriaText}
        >
          {/* The base's soft contact shadow. */}
          <ellipse
            cx={geo.cx}
            cy={colBot + 10}
            rx={s ? 50 : 68}
            ry={7}
            fill="rgba(91,61,8,.18)"
            className="dark:opacity-70"
          />
          {/* The tapered brass column + the rounded foot. */}
          <path
            d={`M ${r2(geo.cx - 5)} ${colTop} L ${r2(geo.cx + 5)} ${colTop} L ${r2(geo.cx + 9)} ${colBot} L ${r2(geo.cx - 9)} ${colBot} Z`}
            fill="url(#gb-beamBrass)"
            opacity={0.95}
          />
          <rect x={geo.cx - (s ? 44 : 58)} y={colBot} width={s ? 88 : 116} height={12} rx={6} fill="url(#gb-beamBrass)" />
          {/* The dial: 11 ticks over ±35°, the centre tick longer. */}
          {balanceVisualTicks(geo.cx, geo.pivotY, geo.dialR).map((t, i) => (
            <line
              key={i}
              data-balance-dial-tick={t.center ? 'center' : 'tick'}
              x1={r2(t.from.x)}
              y1={r2(t.from.y)}
              x2={r2(t.to.x)}
              y2={r2(t.to.y)}
              strokeWidth={t.center ? 1.6 : 1}
              strokeLinecap="round"
              opacity={t.center ? 0.9 : 0.55}
              className="stroke-[var(--color-text-tertiary)]"
            />
          ))}
          <path
            d={`M ${r2(geo.cx + geo.dialR * Math.sin(radOf(-35)))} ${r2(geo.pivotY - geo.dialR * Math.cos(radOf(35)))} A ${geo.dialR} ${geo.dialR} 0 0 1 ${r2(geo.cx + geo.dialR * Math.sin(radOf(35)))} ${r2(geo.pivotY - geo.dialR * Math.cos(radOf(35)))}`}
            fill="none"
            strokeWidth={1}
            className="stroke-[var(--color-border)]"
          />
          {/* The hangers (redrawn per frame). */}
          {hangersOf('for')}
          {hangersOf('against')}
          {/* THE BEAM GROUP — the one rotated element (rotate about the
           * pivot); the pans only translate. */}
          <g data-balance-beam data-tilt={String(targetDeg)} transform={`rotate(${r2(frame.visDeg)} ${r2(geo.cx)} ${r2(geo.pivotY)})`}>
            <g transform={`translate(${r2(geo.cx)} ${r2(geo.pivotY)})`}>
              <path data-balance-beam-bar d={beamPath} fill="url(#gb-beamBrass)" stroke="var(--bal-brass-lo)" strokeWidth={0.6} />
              <path
                d={`M ${r2(-half + 6)} ${r2(-1.6 * bh)} L ${r2(half - 6)} ${r2(-1.6 * bh)}`}
                stroke="rgba(255,255,255,.55)"
                strokeWidth={1}
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* The beam-end rings: white with a 3px side stroke (05 §4.2). */}
            <circle cx={r2(forEndX)} cy={geo.pivotY} r={7} fill="var(--color-surface)" strokeWidth={3} className="stroke-[var(--color-status-normal)]" data-balance-bead="for" />
            <circle cx={r2(againstEndX)} cy={geo.pivotY} r={7} fill="var(--color-surface)" strokeWidth={3} className="stroke-[var(--color-status-alert)]" data-balance-bead="against" />
          </g>
          {/* The needle: the 3× magnified readout over the dial, hidden
           * when nothing could be read (05 §8). */}
          {!none && !loading ? (
            <line
              data-balance-needle
              x1={r2(geo.cx)}
              y1={r2(geo.pivotY)}
              x2={r2(geo.cx + (geo.dialR - 3) * Math.sin(needleRad))}
              y2={r2(geo.pivotY - (geo.dialR - 3) * Math.cos(needleRad))}
              strokeWidth={2}
              strokeLinecap="round"
              className="stroke-[var(--color-text-primary)]"
            />
          ) : null}
          {/* The hub: brass with a dark centre + the highlight dot. */}
          <circle data-balance-pivot cx={r2(geo.cx)} cy={r2(geo.pivotY)} r={s ? 10 : 12} fill="url(#gb-faceBrass)" stroke="var(--bal-brass-lo)" strokeWidth={1} />
          <circle cx={r2(geo.cx)} cy={r2(geo.pivotY)} r={s ? 3.6 : 4.4} className="fill-[var(--color-text-primary)]" />
          <circle cx={r2(geo.cx - 1.2)} cy={r2(geo.pivotY - 1.4)} r={1.2} fill="rgba(255,255,255,.7)" />
        </svg>
        {panOf('for', loading ? [] : forBlocks)}
        {panOf('against', loading ? [] : againstBlocks)}
      </div>

      {/* 4.4 the verdict block — the hero: the verdict word is the
       * largest text in the balance (V-1). */}
      <div className="verdict" data-balance-verdict={verdict} data-balance-verdict-sparse={sparse ? 'true' : undefined}>
        {loading ? (
          <>
            <span className="sk" style={{ height: 10, width: 90, margin: '0 auto' }} />
            <span className="sk" style={{ height: 34, width: 'min(260px,70%)', margin: '12px auto 0' }} />
            <span className="sk" style={{ height: 6, width: 200, margin: '18px auto 0' }} />
          </>
        ) : (
          <>
            <div className="verdict-eyebrow" data-balance-verdict-eyebrow>
              {b.verdictEyebrow}
            </div>
            <h4
              className="verdict-word"
              data-balance-verdict-word
              data-side={verdict === 'for' ? 'for' : verdict === 'against' ? 'against' : undefined}
            >
              {verdictWord}
            </h4>
            {/* The lane strip: four bars, one per lane (decorative —
             * the counts line carries the text). */}
            <div className="lanes-bar" data-balance-lane-strip aria-hidden="true">
              {drivers.map((d) => (
                <i key={d.key} data-side={d.state} />
              ))}
            </div>
            <p className="verdict-counts" data-balance-count>
              {countParts.join(' · ')}
            </p>
            {!none && sparse ? <p className="verdict-note" data-balance-not-enough>{copy.signals.notEnoughReadable}</p> : null}
            {contextLine}
          </>
        )}
      </div>
      {banner}

      {/* 4.5 the tray: "Not leaning" — neutral and unread stones in a
       * recessed well (the split badge on a contested neutral). */}
      {!loading ? (
        <div className="tray" data-balance-tray="not-leaning">
          <div className="tray-head">
            <span className="tray-title" data-balance-tray-title>
              {b.trayTitleLanes}
            </span>
            <span className="tray-note">{b.trayNote}</span>
          </div>
          {trayStones.length > 0 ? (
            <div className="weights">
              {trayStones.map((d) => (
                <BalanceWeight
                  key={d.key}
                  laneKey={d.key}
                  impacts={impactsOf(d)}
                  state={d.state}
                  label={d.label}
                  ariaLabel={laneAriaOf(d)}
                  splitBadge={d.split === true ? b.splitBadge : null}
                  ariaExpanded={openKey === d.key}
                  onOpen={() => setOpenKey(d.key)}
                />
              ))}
            </div>
          ) : (
            <p className="tray-empty" data-balance-tray-empty>
              {b.trayEmpty}
            </p>
          )}
        </div>
      ) : null}

      {/* 4.6 the ledger: one row per lane, inline expansion, one open
       * at a time (the detail-panel CONTENT contract rides here). */}
      {!loading ? (
        <ul className="ledger" data-balance-ledger>
          {drivers.map((d) => {
            const open = openKey === d.key;
            return (
              <li key={d.key} className="row" data-balance-row={d.key} data-open={open ? 'true' : 'false'}>
                <button
                  ref={open ? openRowBtnRef : undefined}
                  type="button"
                  className="row-btn insights-focusable"
                  aria-expanded={open}
                  aria-controls={`gold-balance-members-${d.key}`}
                  onClick={() => setOpenKey((prev) => (prev === d.key ? null : d.key))}
                  data-balance-row-btn={d.key}
                >
                  <BalanceWeightDisc
                    laneKey={d.key}
                    impacts={impactsOf(d)}
                    state={d.state}
                    splitBadge={d.split === true ? b.splitBadge : null}
                  />
                  <span>
                    <span className="row-name">{d.label}</span>
                    <span className="row-state" data-side={d.state}>
                      {laneStateTextOf(d)}
                    </span>
                  </span>
                  {d.tally !== undefined ? <span className="row-tally" data-balance-tally>{d.tally}</span> : <span aria-hidden="true" />}
                  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div className="members" id={`gold-balance-members-${d.key}`} hidden={!open} data-balance-row-members={d.key}>
                  {open ? ledgerMembersOf(d) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* 4.1 item 8: the footnote — the measured note + the backtest
       * link (01 §8.2), visible without a tap. */}
      {measuredNote}
    </div>
  );
}


function BalanceScaleMechanical({
  drivers,
  copy,
  numberLocale,
  banner,
  subtitle,
  contextLine,
  measuredNote,
}: Omit<BalanceScaleProps, 'visual'>): React.JSX.Element | null {
  // 2026-10-21c owner round: silver's balance (and with it the `metal`
  // prop + the balanceSilver copy variants) is RETIRED — the merged card
  // renders GOLD's balance only; the drawing, counts and honesty rules
  // are unchanged.
  const b = copy.signals.balance;
  const metal = 'gold' as const;
  const rtl = numberLocale === 'fa-IR';
  const [openKey, setOpenKey] = useState<string | null>(null);
  /* R9-03 (v8): the v6 "+{n} more" list-expansion state is RETIRED —
   * every factor chip renders on its pan; there is nothing to expand. */

  /* Model-level reads (pure — an empty driver list yields the level
   * balance, so every hook below keeps its call order unconditional). */
  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);
  /* The side loads (R9-03: EVERY chip renders on its pan — no capacity
   * slice, no overflow pill). Computed before the hooks so the pan-height
   * measurement can depend on the counts. */
  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');
  /* The tilt from the fixed design-width arm (rule 5: the model math
   * never depends on anything measured at runtime; the rendered
   * geometry scales with the measured stage width below). */
  const tilt = balanceTilt(counts, BALANCE_LH_PX);
  /* The PHYSICAL signed angle (against-heavy positive) is the ANGLE
   * TARGET; the VISUAL beam rotation flips for RTL inside the
   * geometry so the heavy side's end always dips. */
  /* v3 UI-40 (2026-10-20, kept through the v3 merge): fewer than 3
   * readable conditions is NOT a reading — the beam stays level, the
   * verdict word becomes the honest "not enough readable conditions"
   * line and the gauge hides. The 2026-10-21c 3° floor still governs every
   * non-sparse directional result (readable ≥ 3). */
  const sparse = counts.readable < 3;
  const targetDeg = sparse ? 0 : signedTiltDeg(tilt);

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

  /* R9-03 (v8): the pans' MEASURED heights. The chips' compact metrics
   * give the arithmetic RESERVE (balancePanHeightPx — chip rows are
   * fixed-height), but a wrapped label or the full empty-state sentence
   * can render taller than the arithmetic, so the stage tracks the REAL
   * measured pan heights (one ResizeObserver per pan) and reserves the
   * taller of the two plus the swing — nothing can ever clip, whatever
   * the load. The reserve is the FLOOR: it renders even before the
   * measurement lands (and in ResizeObserver-less environments). */
  const isSm = stageWidth >= BALANCE_SM_STAGE_W_PX;
  const reserveStageH = balanceStageHeightPx(forBlocks.length, againstBlocks.length, isSm);
  const [measuredPanH, setMeasuredPanH] = useState<{ for: number; against: number }>({ for: 0, against: 0 });
  const panForEl = useRef<HTMLDivElement | null>(null);
  const panAgainstEl = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const measure = (): void => {
      const hFor = panForEl.current?.offsetHeight ?? 0;
      const hAgainst = panAgainstEl.current?.offsetHeight ?? 0;
      setMeasuredPanH((prev) => (prev.for === hFor && prev.against === hAgainst ? prev : { for: hFor, against: hAgainst }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    if (panForEl.current) ro.observe(panForEl.current);
    if (panAgainstEl.current) ro.observe(panAgainstEl.current);
    return () => ro.disconnect();
  }, [forBlocks.length, againstBlocks.length]);
  const measuredMaxPanH = Math.max(measuredPanH.for, measuredPanH.against);
  const stageHeightPx = Math.max(
    reserveStageH,
    Math.ceil(BALANCE_PAN_TOP_PX + measuredMaxPanH + BALANCE_SWING_PX + BALANCE_STAGE_BOTTOM_PAD_PX),
  );

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

  /* THE FRAME: every mechanical coordinate derives from the one θ in
   * this single render — beam rotation, joints, plumb pan drops,
   * hanger endpoints (joint → the pan's two fixed rim corners). */
  const geo = balanceStageGeometry(stageWidth, theta, rtl);
  const gauge = balanceGaugeGeometry(geo.cx, geo.cy, rtl);

  const verdictWord =
    !sparse
      ? verdict === 'for'
        ? b.verdictFor
        : verdict === 'against'
          ? b.verdictAgainst
          : verdict === 'balanced'
            ? b.verdictBalanced
            : b.verdictNone
      : /* v3 UI-40: sparse is not a reading. readable 0 keeps the
         * component's own stronger "can't read" word (the none
         * markers + both unavailable lines); 1–2 readable shows the
         * spec's explicit not-enough line. Either way: level beam,
         * no gauge, no direction. */
        counts.readable === 0
        ? b.verdictNone
        : copy.signals.notEnoughReadable;
  const verdictToneClass =
    verdict === 'for'
      ? verdictTone.bullish
      : verdict === 'against'
        ? verdictTone.bearish
        : 'text-[var(--color-status-stale)]';
  const verdictIcon = !sparse && verdict === 'for' ? 'bullish' : !sparse && verdict === 'against' ? 'bearish' : null;

  const parts = countLineParts(counts, copy, numberLocale);
  const ariaLabel = interpolate(b.aria, { summary: parts.join(' · '), verdict: verdictWord });
  /* v3 UI-39.5: the missing-data line — R readable of M scored
   * conditions, always stated, never silently counted. */
  const readableLine = interpolate(copy.signals.readableLine, {
    r: formatNumber(counts.readable, numberLocale, { maximumFractionDigits: 0 }),
    total: formatNumber(counts.total, numberLocale, { maximumFractionDigits: 0 }),
  });

  /* The gauge's text equivalent (addendum §B: never colour alone) —
   * the whole mechanical drawing is one role="img" whose label states
   * the beam tilt and the verdict. Hidden entirely when the state is
   * unavailable (no needle, no verdict — the state label in the
   * assessment box carries it). */
  const gaugeAvailable = !sparse && verdict !== 'none';
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

  /** GB-S3 (03 §5): the lane chip's accessible name — "{lane}: {side}.
   * {tally}." (laneChipAria); a split lane appends the badge word before
   * its counts so the badge's meaning is never colour-only. The side
   * word reuses the card's own condition-state vocabulary
   * (conditionStateShort) — no new words, both locales already carry it. */
  const laneChipAriaOf = (d: BalanceDriver): string => {
    const sideKey =
      d.state === 'for' ? 'supportive' : d.state === 'against' ? 'against' : d.state === 'neutral' ? 'neutral' : 'unknown';
    const side = copy.signals.conditionStateShort[sideKey];
    const tally = d.split === true && d.tally !== undefined ? `${b.splitBadge}, ${d.tally}` : d.tally;
    return tally !== undefined ? interpolate(b.laneChipAria, { lane: d.label, side, tally }) : `${d.label}: ${side}.`;
  };

  /** GB-S3 (03 §3): the detail panel's member list — firing members
   * grouped "Supports gold" / "Pressures gold" (each row: name, evidence
   * phrase, value, and the deep link to the indicator card), the steady
   * voters collapsed by name, the unread voters listed when any. A group
   * with no members never renders. */
  const memberList = (members: ReadonlyArray<BalanceMember>): React.JSX.Element => {
    const n = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });
    const firing = (impact: 'supports' | 'pressures'): React.JSX.Element | null => {
      const rows = members.filter((m) => m.impact === impact);
      if (rows.length === 0) return null;
      return (
        <div key={impact} data-balance-member-group={impact}>
          <span className="block font-bold text-[var(--color-text-primary)]">
            {impact === 'supports' ? b.memberSupports : b.memberPressures}
          </span>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
            {rows.map((m) => (
              <li
                key={m.key}
                data-balance-member={m.key}
                data-balance-member-impact={m.impact}
                className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"
              >
                <span className="font-semibold text-[var(--color-text-primary)]">{m.label}</span>
                {m.evidenceText !== null ? (
                  <span className="text-[var(--color-text-secondary)]">· {m.evidenceText}</span>
                ) : null}
                {m.valueText !== null ? (
                  <bdi
                    dir="ltr"
                    className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]"
                  >
                    {m.valueText}
                  </bdi>
                ) : null}
                <a
                  href={`/insights?card=${m.key}`}
                  className="insights-focusable text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
                >
                  {b.memberOpenIndicator}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    };
    const steady = members.filter((m) => m.impact === 'steady');
    const unread = members.filter((m) => m.impact === 'unread');
    return (
      <>
        {firing('supports')}
        {firing('pressures')}
        {steady.length > 0 ? (
          <details data-balance-member-group="steady">
            <summary className="insights-focusable cursor-pointer font-bold text-[var(--color-text-primary)]">
              {interpolate(b.membersSteadyTitle, { n: n(steady.length) })}
            </summary>
            <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
              {steady.map((m) => (
                <li key={m.key} data-balance-member={m.key} data-balance-member-impact="steady">
                  {m.label}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {unread.length > 0 ? (
          <div data-balance-member-group="unread">
            <span className="block font-bold text-[var(--color-text-secondary)]">
              {interpolate(b.membersUnreadTitle, { n: n(unread.length) })}
            </span>
            <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
              {unread.map((m) => (
                <li key={m.key} data-balance-member={m.key} data-balance-member-impact="unread">
                  {m.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </>
    );
  };

  /** One compact factor chip RESTING ON THE PAN (v6's load, kept;
   * v8/R9-03: EVERY chip renders — there is no capacity anymore): icon
   * + full short name (never truncated) + the value where space permits
   * (hidden below `sm` so mobile rows stay single-line legible). A
   * real button — its tap opens the shared detail panel with the
   * factor's full explanation. Bottom of the pan = the floor, so the
   * loads sit ON the surface (contact shadow included). v7: the chip
   * is NEVER rotated, skewed or scaled — it only rides its pan's
   * plumb translation, so its text stays horizontal at every angle
   * (the 12.48px caption floor holds at every viewport). Its height
   * follows the compact metrics (min 40px mobile / 32px ≥sm) so the
   * arithmetic reserve and the measured truth stay in lockstep. */
  const tile = (d: BalanceDriver, side: 'for' | 'against'): React.JSX.Element => (
    <button
      key={d.key}
      type="button"
      aria-expanded={openKey === d.key}
      aria-controls={`${metal}-balance-detail`}
      aria-label={d.members !== undefined ? laneChipAriaOf(d) : undefined}
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
      {/* GB-S3 (03 §2): the lane chip's second line — the tally wraps to
       * its own row (the button already flex-wraps; w-full claims the
       * line). Legacy condition chips carry no tally and render exactly
       * as before. */}
      {d.tally !== undefined ? (
        <span
          data-balance-tally
          className="w-full ps-[20px] text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]"
        >
          {d.tally}
        </span>
      ) : null}
    </button>
  );

  /** The empty-side line (v4 semantics, kept verbatim): when the
   * evaluation ran, the side with no qualifying factors carries the
   * evidence-based line; when NOTHING could be read (readable 0),
   * both sides carry the unavailable line instead — an absence of
   * readings is never worded as an absence of pressure. */
  const emptyLineOf = (side: 'for' | 'against'): string =>
    counts.readable === 0 ? b.listEmptyNone : side === 'for' ? b.listEmptyFor : b.listEmptyAgainst;

  /** One side's PAN ASSEMBLY (v7: translate ONLY; v8/R9-03: the LOAD
   * IS THE LIST): the junction ring dots on the pan's top rim, the
   * shallow rimmed pan (a heavier floor edge), and EVERY factor chip of
   * that side resting on the floor — there is no capacity slice and no
   * "+{n} more" pill anymore; the pan simply grows with its stack (the
   * stage reserves the taller stack plus the swing). The assembly moves
   * by translate(0, dy) — EXACTLY its joint's vertical displacement —
   * so it hangs plumb; it NEVER rotates, skews or scales. The hangers
   * themselves live in the SVG layer below and are redrawn every frame
   * from the joint to these rim points. R9-08: an EMPTY pan carries its
   * side's full evidence-based sentence INSIDE the tray (centred,
   * muted) instead of the v6 small pill. */
  const panAssembly = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
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
         * underneath. v8: the height is the LOAD's height (the min-height
         * keeps the empty drawing's shape); the chips rest on the floor
         * (justify-end, gapped, contact-shadowed). The measured-height
         * observer (above) keeps the stage's reserve tracking this pan. */}
        <div
          ref={side === 'for' ? panForEl : panAgainstEl}
          data-balance-pan={side}
          className="relative mx-auto flex min-h-[118px] w-[92%] flex-col justify-end gap-1.5 rounded-[10px] border-[1.5px] border-b-[3px] border-[var(--color-border)] border-b-[var(--color-text-secondary)] bg-currena-soft/70 p-2 shadow-[0_12px_16px_-14px_rgb(15_23_42/0.5)] dark:bg-currena-soft/90 sm:min-h-[88px]"
        >
          <span
            aria-hidden="true"
            data-balance-pan-floor={side}
            className="pointer-events-none absolute inset-x-[6px] bottom-[5px] h-[1.5px] rounded-full bg-[var(--color-surface)]/60"
          />
          {blocks.length > 0 ? (
            blocks.map((d) => tile(d, side))
          ) : (
            /* R9-08: the FULL evidence-based sentence rides inside the
             * pan — the v6 small pill («نشانهٔ معتبری نیست») and the
             * separate list-area card are retired with it. */
            <p
              data-balance-empty={side}
              className="m-auto my-auto max-w-full rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 text-center text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]"
            >
              {emptyLineOf(side)}
            </p>
          )}
        </div>
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
    <div className="flex flex-col gap-3" data-balance={metal}>
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
          {/* GB-S3: the lane view passes its reworded subtitle; the legacy
           * view keeps the dictionary's own (byte-identical default). */}
          {subtitle ?? b.subtitle}
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

      {/* 3. THE BALANCE STAGE: one relative box whose height reserves the
       * taller pan stack plus the swing (v8). Inside,
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
        /* R9-03 (v8): the stage's height RESERVES the taller pan stack
         * plus the swing envelope (arithmetic floor via
         * balanceStageHeightPx; the measured pan heights can only raise
         * it — a wrapped label or the long empty sentence never clips). */
        style={{ height: `${stageHeightPx}px` }}
        className="relative mx-auto w-full max-w-[640px] text-[var(--color-text-secondary)]"
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
          <g data-balance-beam data-tilt={String(targetDeg)} transform={geo.beamTransform}>
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
        {/* v3 UI-39.5: the readable-count line under the count parts —
         * how many of the scored conditions actually carried readable
         * data (UI-40: readable < 3 shows the level beam + the honest
         * not-enough line instead of a directional verdict). */}
        <span
          data-balance-readable-line
          className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]"
        >
          {readableLine}
        </span>
        {banner}
      </div>

      {/* GB-S3 (01 §6 + 01 §8.2): the non-voting context line (gold's own
       * 30-day move, never counted in the balance or the Outlook) and the
       * measured note + backtest link, both caller-built and visible
       * without a tap. Absent on the legacy view — nothing renders and
       * the default markup stays byte-for-byte today's. */}
      {contextLine}
      {measuredNote}

      {/* The shared detail panel (v2 §5.5.6 — every width): one open
       * panel at a time, tap again to close. It always exists in the DOM
       * (so every aria-controls is valid) and stays hidden until a tile,
       * a row or a tray chip opens it. */}
      <div
        id={`${metal}-balance-detail`}
        data-balance-detail={openDriver !== null ? openDriver.key : undefined}
        hidden={openDriver === null}
        className="rounded-[var(--radius-sm)] bg-currena-soft/60 px-3 py-2 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]"
      >
        {openDriver !== null ? (
          <>
            <span className="font-bold text-[var(--color-text-primary)]">{openDriver.label}: </span>
            {openDriver.detail}
            {/* GB-S3 (03 §3 item 5): the driver's context line under the
             * intro sentence — the inflation lane's tilt phrase. */}
            {openDriver.note !== undefined ? (
              <p
                data-balance-lane-note
                className="m-0 mt-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
              >
                {openDriver.note}
              </p>
            ) : null}
            {/* GB-S3 (03 §3): the member list — firing members grouped by
             * impact, steady collapsed, unread listed. The legacy chips
             * carry no members and render exactly as before. */}
            {openDriver.members !== undefined && openDriver.members.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2" data-balance-members>
                {memberList(openDriver.members)}
              </div>
            ) : null}
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
                aria-controls={`${metal}-balance-detail`}
                aria-label={d.members !== undefined ? laneChipAriaOf(d) : undefined}
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                /* GB-S3 (03 §2): a lane chip with a tally wraps to two
                 * lines — the class is computed so the LEGACY chips keep
                 * the exact class string they render today. */
                className={`insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)] ring-1 ring-[var(--color-border)]${d.tally !== undefined ? ' flex-wrap' : ''}`}
              >
                <ConditionIcon state="neutral" />
                {d.label}
                {d.split === true ? (
                  /* OI-2's default: the contested-neutral badge — a neutral
                   * lane that is split, not empty (03 §2). */
                  <span
                    data-balance-split-badge
                    className="rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
                  >
                    {b.splitBadge}
                  </span>
                ) : null}
                {d.tally !== undefined ? (
                  <span
                    data-balance-tally
                    className="w-full ps-[22px] text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-tertiary)]"
                  >
                    {d.tally}
                  </span>
                ) : null}
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
                aria-controls={`${metal}-balance-detail`}
                aria-label={d.members !== undefined ? laneChipAriaOf(d) : undefined}
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                className={`insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)]${d.tally !== undefined ? ' flex-wrap' : ''}`}
              >
                <ConditionIcon state="unknown" />
                {d.label}
                {d.tally !== undefined ? (
                  <span
                    data-balance-tally
                    className="w-full ps-[22px] text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-tertiary)]"
                  >
                    {d.tally}
                  </span>
                ) : null}
              </button>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
