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
 *
 * Gold balance consolidation P2b (GB-S4, 2026-11-03 — 05-VISUAL-DESIGN-SPEC.md,
 * implemented from the owner-approved prototype
 * docs/specs/gold-balance-consolidation/reference/balance-reference.html):
 * the `visual` prop renders the REDESIGNED balance — the assay-office
 * stage (brass tapered beam, pivot + 11-tick dial, column + base, bowl
 * pans with side tint + brass rim), lane WEIGHTS with segmented rims
 * (signals/BalanceWeight.tsx), the verdict block as the hero, the
 * "Not leaning" tray and the four-row inline LEDGER (the detail panel,
 * inline — the same member-list content contract). The MECHANICS are
 * unchanged: ONE animated angle drives everything (the beam rotates, the
 * pans translate only, the hangers redraw per frame), the beam formula
 * is the owner's (|net|/(for+against)×10° clamped to [3°,10°], level at
 * net 0 / sparse / nothing readable), and prefers-reduced-motion jumps.
 * The visual branch animates 650ms ease-out QUARTIC on load and on data
 * change (05 §7); the legacy branch keeps its verbatim 500ms cubic. The
 * LEGACY branch (no `visual` prop) renders byte-for-byte today's markup
 * — the default view's snapshot stays the pin.
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatNumber } from '@currena/core';
import type { SignalConditionState } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';
import { ConditionIcon } from './icons';
import { BalanceGradients, BalanceWeight, BalanceWeightDisc } from './BalanceWeight';
import { VerdictIcon, verdictTone } from './verdict';

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

/* ------------------------------------------------------------------ *
 * GB-S4 (05 §4.2 + the reference prototype's layoutStage): the VISUAL
 * stage's own metrics. The size steps read the CARD's (the balance
 * root's) measured width — s < 560, m 560–759, l ≥ 760 — and the stage
 * itself caps at 720px inside a wider card. The pan width, the beam's
 * pin-to-pin length, the swing envelope and the height reserve all
 * derive from the stage width, so the drawing scales as one piece; the
 * height reserves the WORST case (four weights in two rows) and never
 * depends on the data. Pure — unit-testable without a DOM.
 * ------------------------------------------------------------------ */

/** The visual redesign's size steps, from the balance root's width. */
export type BalanceVisualSize = 's' | 'm' | 'l';

export function balanceVisualSizeOf(cardWidth: number): BalanceVisualSize {
  if (cardWidth < 560) return 's';
  if (cardWidth < 760) return 'm';
  return 'l';
}

/** The visual stage's cap — the reference prototype's own number (the
 * wider card's side margins are intentional air, 05 §9). */
export const BALANCE_VISUAL_STAGE_MAX_W = 720;

/** The pre-measurement default for the visual root — the smallest l
 * width, so the pre-measurement geometry is the desktop one (the
 * measurement swaps in the real width before the first paint). */
export const BALANCE_VISUAL_ROOT_DESIGN = 760;

export interface BalanceVisualMetrics {
  /** The stage's drawing width: min(rootWidth, 720). */
  stageWidth: number;
  size: BalanceVisualSize;
  /** The pan width: s 46% of the stage; m/l min(280, 38%). */
  pw: number;
  /** The beam's pin-to-pin length: the stage minus the pans (the pan
   * centres sit on the beam ends at rest; the pan edges reach the stage
   * edges). */
  L: number;
  /** The reserved vertical swing: (L/2)·sin(10°). */
  swing: number;
  /** The vertical hang from a beam end at rest to its pan's top. */
  hanger: number;
  /** The pivot's y (the beam's rotation centre). */
  pivotY: number;
  /** The pans' FIXED height — the worst case (four weights in two rows)
   * fits inside (the stack scenario); never data-dependent. */
  panH: number;
  /** The stage's reserved height: pivotY + hanger + panH + swing + 40. */
  stageH: number;
  /** A pan weight's column width (mobile: half the pan's inner width). */
  weightW: number;
  /** A pan weight's disc diameter. */
  discPx: number;
  /** The dial's radius (11 ticks spanning ±35°). */
  dialR: number;
  /** The brass hub's radius. */
  hubR: number;
  /** The beam's thickness scale (bh): 0.8 mobile, 1 otherwise. */
  beamScale: number;
}

export function balanceVisualMetrics(rootWidth: number): BalanceVisualMetrics {
  const size = balanceVisualSizeOf(rootWidth);
  const s = size === 's';
  const W = Math.max(1, Math.min(rootWidth, BALANCE_VISUAL_STAGE_MAX_W));
  const pw = s ? Math.round(W * 0.46) : Math.round(Math.min(280, W * 0.38));
  const L = W - pw;
  const swing = (L / 2) * Math.sin(radOf(BALANCE_MAX_ANGLE_DEG));
  const hanger = Math.round(swing + 22);
  const pivotY = s ? 56 : 72;
  // 05 §4.2's targets (s 236 / m/l 268) tuned in the browser during
  // implementation, as the spec's header allows: the measured worst case
  // (four weights in two rows + the two-line EN/fa captions) reads
  // scrollHeight 244 at s-390 (EN labels wrap) and exactly 268 at m/l —
  // so both steps gain slack (s 256 / m/l 280) and nothing ever clips.
  const panH = s ? 256 : 280;
  const stageH = Math.round(pivotY + hanger + panH + swing + 40);
  // Two weights per row fit the pan's inner width by construction: the
  // pan padding (12) + the column gap (8) are reserved before halving.
  const weightW = s ? Math.max(50, Math.min(70, Math.floor((pw - 12 - 8) / 2))) : 78;
  const discPx = s ? Math.min(58, weightW - 8) : 58;
  return {
    stageWidth: W,
    size,
    pw,
    L,
    swing,
    hanger,
    pivotY,
    panH,
    stageH,
    weightW,
    discPx,
    dialR: s ? 30 : 42,
    hubR: s ? 10 : 12,
    beamScale: s ? 0.8 : 1,
  };
}

/** The visual stage's per-frame derivation — everything one frame draws,
 * from the CURRENT signed physical angle (the one animated value):
 * the beam group's rotation (RTL flips the visual sign exactly as the
 * legacy geometry does — the physical sign is direction-free), each
 * pan's pure-vertical drop, the pans' rest centres, the rotated joints
 * the hangers hang from, and the dial needle's 3× magnified angle
 * (clamped to ±32° over the ±35° dial, so a 3° lean stays legible).
 * Pure. */
export interface BalanceVisualFrame {
  /** The beam group's SVG rotation in degrees. */
  beamDeg: number;
  /** The for pan's vertical translation (plumb, its joint's drop). */
  forDrop: number;
  againstDrop: number;
  /** The pans' rest centres on the stage (the pan never moves
   * horizontally; the hangers' angles change instead). */
  forCentreX: number;
  againstCentreX: number;
  /** The rotated beam ends — the hangers' top anchors. */
  forJoint: BalancePoint;
  againstJoint: BalancePoint;
  /** The needle's angle from vertical-up: clamp(beamDeg × 3, ±32). */
  needleDeg: number;
}

export function balanceVisualFrame(
  m: BalanceVisualMetrics,
  signedPhysicalDeg: number,
  rtl: boolean,
): BalanceVisualFrame {
  const cx = m.stageWidth / 2;
  const beamDeg = rtl ? -signedPhysicalDeg : signedPhysicalDeg;
  const rad = radOf(beamDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const left: BalancePoint = { x: cx - (m.L / 2) * cos, y: m.pivotY - (m.L / 2) * sin };
  const right: BalancePoint = { x: cx + (m.L / 2) * cos, y: m.pivotY + (m.L / 2) * sin };
  const forIsLeft = !rtl;
  return {
    beamDeg,
    forDrop: (forIsLeft ? left.y : right.y) - m.pivotY,
    againstDrop: (forIsLeft ? right.y : left.y) - m.pivotY,
    forCentreX: forIsLeft ? cx - m.L / 2 : cx + m.L / 2,
    againstCentreX: forIsLeft ? cx + m.L / 2 : cx - m.L / 2,
    forJoint: forIsLeft ? left : right,
    againstJoint: forIsLeft ? right : left,
    needleDeg: Math.max(-32, Math.min(32, beamDeg * 3)),
  };
}

/** The GB-S4 motion rule (05 §7): the visual branch's own tween — 650ms
 * ease-out QUARTIC (the legacy branch keeps its verbatim 500ms cubic). */
const TILT_ANIMATION_VISUAL_MS = 650;

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

export function BalanceScale({
  drivers,
  copy,
  numberLocale,
  banner,
  subtitle,
  contextLine,
  measuredNote,
  visual,
}: {
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
  /** GB-S4 (05 §11): render the VISUAL REDESIGN — the brass stage, the
   * lane weights, the verdict hero, the tray and the inline ledger.
   * Absent → the legacy markup, byte-for-byte today's default view (the
   * snapshot pin). The merged card passes it exactly when the
   * ?balance=lanes preview flag is on. */
  visual?: boolean | undefined;
}): React.JSX.Element | null {
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

  /* THE ONE ANIMATED VALUE (addendum §A): θ. The LEGACY branch paints
   * the final angle on the first render (progressive: the static picture
   * is the verdict, matching v5/v6 behaviour — no settle-in on load) and
   * the rAF timeline below animates it whenever the model's target
   * changes (a data refresh), re-deriving the beam rotation, joints, pan
   * translations and hanger endpoints in the SAME frame. The VISUAL
   * branch (GB-S4, 05 §7) starts LEVEL and swings to the verdict on
   * load (650ms ease-out quartic), then the same timeline governs data
   * changes; prefers-reduced-motion jumps in both branches. */
  const [theta, setTheta] = useState(visual === true ? 0 : targetDeg);
  const thetaRef = useRef(visual === true ? 0 : targetDeg);
  const frame = useRef(0);

  /** The measured stage width (the pre-paint default is the 640
   * design width; a layout effect swaps in the real measurement
   * before the first paint, and a ResizeObserver keeps it current). */
  const [stageWidth, setStageWidth] = useState(BALANCE_STAGE_W_DESIGN);
  const stageEl = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef(BALANCE_STAGE_W_DESIGN);

  /* GB-S4: the VISUAL root's measured width — drives the size steps
   * (s/m/l by the card's own width, the reference prototype's rule) and
   * the stage width (min(root, 720)). The legacy branch never mounts
   * this element, so the observer simply never attaches. */
  const [visualRootW, setVisualRootW] = useState(BALANCE_VISUAL_ROOT_DESIGN);
  const visualRootEl = useRef<HTMLDivElement | null>(null);
  const visualWRef = useRef(BALANCE_VISUAL_ROOT_DESIGN);
  useEffect(() => {
    const el = visualRootEl.current;
    if (!el) return undefined;
    const apply = (w: number): void => {
      if (w > 0 && Math.abs(w - visualWRef.current) > 0.5) {
        visualWRef.current = w;
        setVisualRootW(w);
      }
    };
    apply(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      apply(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    // GB-S4 (05 §7): the visual branch tweens 650ms ease-out QUARTIC on
    // load and on data change; the legacy branch keeps its verbatim
    // 500ms ease-out cubic.
    const duration = visual === true ? TILT_ANIMATION_VISUAL_MS : TILT_ANIMATION_MS;
    const easeOf = visual === true ? (p: number) => 1 - (1 - p) ** 4 : (p: number) => 1 - (1 - p) ** 3;
    const start = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      land(from + (targetDeg - from) * easeOf(progress));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        land(targetDeg);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [targetDeg, visual]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /* GB-S4 (05 §4.3/§4.6): pressing a WEIGHT opens its lane's ledger row
   * and scrolls it to the centre — the row button receives focus after
   * the row renders (the pending-focus effect below). Declared with the
   * other hooks, BEFORE the empty-driver guard (the hooks order must be
   * unconditional); the effect simply no-ops when nothing is pending. */
  const pendingRowFocus = useRef<string | null>(null);
  useEffect(() => {
    const key = pendingRowFocus.current;
    if (key === null) return;
    pendingRowFocus.current = null;
    const btn = document.getElementById(`gold-balance-row-btn-${key}`);
    if (btn === null) return;
    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof (btn as HTMLElement).scrollIntoView === 'function') {
      btn.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
    (btn as HTMLElement).focus({ preventScroll: true });
  }, [openKey]);

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

  /** Opens a lane's ledger row from a WEIGHT (scroll + focus ride the
   * pending-focus effect declared with the hooks above). DOM order keeps
   * the tab order pan weights → tray weights → ledger rows (03 §5). */
  const openLaneFromWeight = (key: string): void => {
    setOpenKey(key);
    pendingRowFocus.current = key;
  };

  /** The empty-side line (v4 semantics, kept verbatim): when the
   * evaluation ran, the side with no qualifying factors carries the
   * evidence-based line; when NOTHING could be read (readable 0),
   * both sides carry the unavailable line instead — an absence of
   * readings is never worded as an absence of pressure. Shared by the
   * legacy pans and the visual bowl pans. */
  const emptyLineOf = (side: 'for' | 'against'): string =>
    counts.readable === 0 ? b.listEmptyNone : side === 'for' ? b.listEmptyFor : b.listEmptyAgainst;

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

  /* ---------------------------------------------------------------- *
   * GB-S4 — THE VISUAL REDESIGN (05-VISUAL-DESIGN-SPEC.md, from the
   * owner-approved reference prototype). Rendered ONLY when `visual` is
   * set (the lane view behind ?balance=lanes); the legacy markup below
   * is untouched and stays the byte-stable default. Layout, top to
   * bottom (05 §4.1): the head (eyebrow → title → subtitle), the
   * brass STAGE, the VERDICT block (the hero), the context pill, the
   * banner, the "Not leaning" tray, the LEDGER (the detail panel,
   * inline — one row open at a time), the footnote.
   * ---------------------------------------------------------------- */
  if (visual === true) {
    /** The visual stage's metrics + the per-frame derivation (the one
     * animated θ drives everything; pans translate only). */
    const vm = balanceVisualMetrics(visualRootW);
    const vf = balanceVisualFrame(vm, theta, rtl);
    const vSize = vm.size;
    const s = vSize === 's';
    const bh = vm.beamScale;
    const vCx = vm.stageWidth / 2;

    /* The 11 dial ticks (i·7° around vertical-up, the centre tick
     * longer) + the ±35° arc they sit on (the reference's dial). */
    const dialTicks = Array.from({ length: 11 }, (_, i) => {
      const t = i - 5;
      const a = radOf(t * 7);
      const rOut = vm.dialR;
      const rIn = vm.dialR - (t === 0 ? 9 : 5);
      return {
        t,
        x1: r2(vCx + rOut * Math.sin(a)),
        y1: r2(vm.pivotY - rOut * Math.cos(a)),
        x2: r2(vCx + rIn * Math.sin(a)),
        y2: r2(vm.pivotY - rIn * Math.cos(a)),
      };
    });
    const dialArc = `M ${r2(vCx + vm.dialR * Math.sin(radOf(-35)))} ${r2(vm.pivotY - vm.dialR * Math.cos(radOf(35)))} A ${vm.dialR} ${vm.dialR} 0 0 1 ${r2(vCx + vm.dialR * Math.sin(radOf(35)))} ${r2(vm.pivotY - vm.dialR * Math.cos(radOf(35)))}`;

    /* The hangers (redrawn every frame): two brass lines per side, from
     * the ROTATED beam-end joint to the pan's top corners at ±42% of
     * the pan width either side of its rest centre. */
    const visualHangers = (side: 'for' | 'against'): React.JSX.Element => {
      const joint = side === 'for' ? vf.forJoint : vf.againstJoint;
      const centreX = side === 'for' ? vf.forCentreX : vf.againstCentreX;
      const topY = vm.pivotY + vm.hanger + (side === 'for' ? vf.forDrop : vf.againstDrop);
      const spread = vm.pw * 0.42;
      return (
        <>
          <line
            aria-hidden="true"
            data-balance-hanger={`${side}-start`}
            x1={r2(joint.x)}
            y1={r2(joint.y)}
            x2={r2(centreX - spread)}
            y2={r2(topY)}
            stroke="var(--bal-brass-lo)"
            strokeWidth={1.25}
            strokeLinecap="round"
            opacity={0.75}
          />
          <line
            aria-hidden="true"
            data-balance-hanger={`${side}-end`}
            x1={r2(joint.x)}
            y1={r2(joint.y)}
            x2={r2(centreX + spread)}
            y2={r2(topY)}
            stroke="var(--bal-brass-lo)"
            strokeWidth={1.25}
            strokeLinecap="round"
            opacity={0.75}
          />
        </>
      );
    };

    /** The tapered brass beam's local path (centred on the pivot). */
    const beamPath =
      `M ${r2(-vm.L / 2)} ${r2(-3.2 * bh)} L -20 ${r2(-7.5 * bh)} Q 0 ${r2(-10 * bh)} 20 ${r2(-7.5 * bh)} ` +
      `L ${r2(vm.L / 2)} ${r2(-3.2 * bh)} L ${r2(vm.L / 2)} ${r2(3.2 * bh)} L 20 ${r2(7.5 * bh)} ` +
      `Q 0 ${r2(10 * bh)} -20 ${r2(7.5 * bh)} L ${r2(-vm.L / 2)} ${r2(3.2 * bh)} Z`;

    /* The beam end rings' colours: the for end terminates above the for
     * pan (left in LTR, right in RTL — the RTL mirror). */
    const forIsLeft = !rtl;
    const leftEndColor = forIsLeft ? 'var(--color-status-normal)' : 'var(--color-status-alert)';
    const rightEndColor = forIsLeft ? 'var(--color-status-alert)' : 'var(--color-status-normal)';

    /** The LEDGER row's member list — the shared panel's CONTENT contract
     * (03 §3) in the inline look (05 §4.6): dot, name, evidence + value
     * + the deep link on the end side; steady collapses to one muted
     * sentence; unread listed with a hollow dot. */
    const memberListVisual = (members: ReadonlyArray<BalanceMember>): React.JSX.Element => {
      const n = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });
      const firing = (impact: 'supports' | 'pressures'): React.JSX.Element | null => {
        const rows = members.filter((m) => m.impact === impact);
        if (rows.length === 0) return null;
        return (
          <div key={impact} data-balance-member-group={impact}>
            <span className="bal-m-group">{impact === 'supports' ? b.memberSupports : b.memberPressures}</span>
            <ul className="bal-m-list">
              {rows.map((m) => (
                <li key={m.key} data-balance-member={m.key} data-balance-member-impact={m.impact} className="bal-m">
                  <i aria-hidden="true" className="bal-m-dot" data-i={impact} />
                  <span className="bal-m-name">{m.label}</span>
                  <span className="bal-m-ev">
                    {m.evidenceText !== null ? <span>{m.evidenceText}</span> : null}
                    {m.valueText !== null ? (
                      <bdi dir="ltr" className="bal-m-val">
                        {m.valueText}
                      </bdi>
                    ) : null}
                    <a href={`/insights?card=${m.key}`} className="insights-focusable bal-m-link">
                      {b.memberOpenIndicator}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      };
      const steady = members.filter((m) => m.impact === 'steady');
      const unread = members.filter((m) => m.impact === 'unread');
      const joiner = rtl ? '، ' : ', ';
      return (
        <>
          {firing('supports')}
          {firing('pressures')}
          {steady.length > 0 ? (
            <p className="bal-steady" data-balance-member-group="steady">
              {interpolate(b.membersSteadyTitle, { n: n(steady.length) })}:{' '}
              {steady.map((m, i) => (
                <span key={m.key} data-balance-member={m.key} data-balance-member-impact="steady">
                  {i > 0 ? joiner : ''}
                  {m.label}
                </span>
              ))}
            </p>
          ) : null}
          {unread.length > 0 ? (
            <div data-balance-member-group="unread">
              <span className="bal-m-group">{interpolate(b.membersUnreadTitle, { n: n(unread.length) })}</span>
              <ul className="bal-m-list">
                {unread.map((m) => (
                  <li key={m.key} data-balance-member={m.key} data-balance-member-impact="unread" className="bal-m">
                    <i aria-hidden="true" className="bal-m-dot" data-i="unread" />
                    <span className="bal-m-name">{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      );
    };

    /** The verdict block's lane-counts line (05 §4.4): the for and
     * against parts always render (zeros included), the unread part
     * only when > 0. Persian digits through the locale formatter. */
    const vn = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });
    const countsParts = [
      interpolate(b.verdictCountFor, { n: vn(counts.for) }),
      interpolate(b.verdictCountAgainst, { n: vn(counts.against) }),
      interpolate(b.verdictCountNotLeaning, { n: vn(counts.neutral) }),
    ];
    if (counts.unread > 0) countsParts.push(interpolate(b.verdictCountUnread, { n: vn(counts.unread) }));

    /** The verdict word's colour side — green for, red against, primary
     * ink for balanced / can't-read / sparse (colour never rides alone:
     * the word itself always states the state). */
    const verdictSide = !sparse && verdict === 'for' ? 'for' : !sparse && verdict === 'against' ? 'against' : undefined;

    /** The ledger row's state word (05 §4.6): in words, per side; a
     * split lane names the contest. */
    const laneStateOf = (d: BalanceDriver): { text: string; side: string } => {
      if (d.split === true && d.members !== undefined) {
        const supports = d.members.filter((m) => m.impact === 'supports').length;
        const pressures = d.members.filter((m) => m.impact === 'pressures').length;
        return { text: interpolate(b.laneStateSplit, { supports: vn(supports), pressures: vn(pressures) }), side: d.state };
      }
      const text =
        d.state === 'for'
          ? b.laneStateFor
          : d.state === 'against'
            ? b.laneStateAgainst
            : d.state === 'neutral'
              ? b.laneStateNeutral
              : b.laneStateUnread;
      return { text, side: d.state };
    };

    /** The tray holds the neutral AND the unread lane weights (05 §4.5)
     * — the unread ones wear the dotted rim. */
    const trayLanes = [...neutralChips, ...unreadChips];

    return (
      <div
        ref={visualRootEl}
        data-balance={metal}
        data-balance-visual
        data-size={vSize}
        className="relative flex flex-col"
      >
        <BalanceGradients />
        <div className="bal-glow" aria-hidden="true" />
        {/* 1. THE HEAD (05 §4.1): eyebrow → title → subtitle. */}
        <header className="bal-head" data-balance-heading>
          <p className="bal-eyebrow" data-balance-eyebrow>
            {b.eyebrow}
          </p>
          <h4 className="bal-title" data-balance-title>
            {b.heading}
          </h4>
          <p className="bal-sub" data-balance-subtitle>
            {subtitle ?? b.subtitle}
          </p>
        </header>
        {/* 2. THE STAGE: the mechanical layer (one svg — column, base,
         * dial, hangers, the ONE rotated beam group, the needle, the
         * hub) behind the two bowl pans. The whole drawing is one
         * role="img" whose label is the gauge's text equivalent; the
         * stage wrapper carries the group label (the same mechanism as
         * the legacy view). */}
        <div
          ref={stageEl}
          className="bal-stage"
          data-balance-stage
          role="group"
          aria-label={ariaLabel}
          style={{ height: `${vm.stageH}px` }}
        >
          <svg
            data-balance-mech
            className="bal-mech"
            viewBox={`0 0 ${r2(vm.stageWidth)} ${r2(vm.stageH)}`}
            role={gaugeAvailable ? 'img' : undefined}
            aria-label={gaugeAvailable ? gaugeAria : undefined}
            aria-hidden={gaugeAvailable ? undefined : true}
          >
            <defs>
              <linearGradient id="bal-beam-brass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bal-brass-hi)" />
                <stop offset="50%" stopColor="var(--bal-brass-mid)" />
                <stop offset="100%" stopColor="var(--bal-brass-lo)" />
              </linearGradient>
            </defs>
            {/* The contact shadow + the tapered column + the rounded
             * foot (static — the instrument's stand). */}
            <ellipse cx={r2(vCx)} cy={r2(vm.stageH - 16)} rx={s ? 50 : 68} ry={7} fill="rgba(91,61,8,.18)" />
            <path
              d={`M ${r2(vCx - 5)} ${r2(vm.pivotY + 10)} L ${r2(vCx + 5)} ${r2(vm.pivotY + 10)} L ${r2(vCx + 9)} ${r2(vm.stageH - 26)} L ${r2(vCx - 9)} ${r2(vm.stageH - 26)} Z`}
              fill="url(#bal-beam-brass)"
              opacity={0.95}
            />
            <rect x={r2(vCx - (s ? 44 : 58))} y={r2(vm.stageH - 26)} width={s ? 88 : 116} height={12} rx={6} fill="url(#bal-beam-brass)" />
            {/* The dial: 11 ticks (centre longer) over a ±35° arc. */}
            {dialTicks.map((t) => (
              <line
                key={t.t}
                data-balance-dial-tick={t.t}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="var(--color-text-tertiary)"
                strokeWidth={t.t === 0 ? 1.6 : 1}
                strokeLinecap="round"
                opacity={t.t === 0 ? 0.9 : 0.55}
              />
            ))}
            <path d={dialArc} fill="none" stroke="var(--color-border)" strokeWidth={1} />
            {/* The hangers — redrawn per frame from the rotated joints. */}
            {visualHangers('for')}
            {visualHangers('against')}
            {/* THE BEAM GROUP — rotate(θ, pivotX, pivotY): the tapered
             * brass bar with its highlight line + the two side rings.
             * The one and only transform in the drawing. */}
            <g data-balance-beam data-tilt={String(targetDeg)} transform={`rotate(${r2(vf.beamDeg)} ${r2(vCx)} ${r2(vm.pivotY)})`}>
              <g transform={`translate(${r2(vCx)} ${r2(vm.pivotY)})`}>
                <path data-balance-beam-bar d={beamPath} fill="url(#bal-beam-brass)" stroke="var(--bal-brass-lo)" strokeWidth={0.6} />
                <path
                  d={`M ${r2(-vm.L / 2 + 6)} ${r2(-1.6 * bh)} L ${r2(vm.L / 2 - 6)} ${r2(-1.6 * bh)}`}
                  fill="none"
                  stroke="rgba(255,255,255,.55)"
                  strokeWidth={1}
                  strokeLinecap="round"
                />
              </g>
              <circle data-balance-bead="for" cx={r2(vCx - vm.L / 2)} cy={r2(vm.pivotY)} r={7} fill="var(--color-surface)" stroke={leftEndColor} strokeWidth={3} />
              <circle data-balance-bead="against" cx={r2(vCx + vm.L / 2)} cy={r2(vm.pivotY)} r={7} fill="var(--color-surface)" stroke={rightEndColor} strokeWidth={3} />
            </g>
            {/* The needle — a 3× magnified readout over the dial (a 3°
             * lean stays legible); hidden when nothing could be read. */}
            {gaugeAvailable ? (
              <line
                data-balance-needle
                x1={r2(vCx)}
                y1={r2(vm.pivotY)}
                x2={r2(vCx + (vm.dialR - 3) * Math.sin(radOf(vf.needleDeg)))}
                y2={r2(vm.pivotY - (vm.dialR - 3) * Math.cos(radOf(vf.needleDeg)))}
                stroke="var(--color-text-primary)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
            {/* The brass hub caps it: the hub, its dark centre, the
             * specular dot. */}
            <circle cx={r2(vCx)} cy={r2(vm.pivotY)} r={vm.hubR} fill="url(#bal-face-brass)" stroke="var(--bal-brass-lo)" strokeWidth={1} />
            <circle cx={r2(vCx)} cy={r2(vm.pivotY)} r={s ? 3.6 : 4.4} fill="var(--color-text-primary)" />
            <circle cx={r2(vCx - 1.2)} cy={r2(vm.pivotY - 1.4)} r={1.2} fill="rgba(255,255,255,.7)" />
          </svg>
          {/* The two bowl pans — absolutely positioned at their rest
           * centres, translated ONLY vertically by their joints' drops
           * (they hang plumb; the hangers' angles change instead). */}
          {(['for', 'against'] as const).map((side) => {
            const blocks = side === 'for' ? forBlocks : againstBlocks;
            const drop = side === 'for' ? vf.forDrop : vf.againstDrop;
            const centreX = side === 'for' ? vf.forCentreX : vf.againstCentreX;
            return (
              <div
                key={side}
                data-balance-assembly={side}
                data-balance-pan={side}
                className={`bal-pan ${side === 'for' ? 'bal-pan-for' : 'bal-pan-against'}`}
                style={{
                  width: `${vm.pw}px`,
                  height: `${vm.panH}px`,
                  left: `${r2(centreX - vm.pw / 2)}px`,
                  top: `${vm.pivotY + vm.hanger}px`,
                  transform: `translate(0px, ${r2(drop)}px)`,
                }}
              >
                <div className="bal-pan-cap">
                  <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={14} className="shrink-0" />
                  <span>{side === 'for' ? b.sideFor : b.sideAgainst}</span>
                </div>
                {blocks.length > 0 ? (
                  <div className="bal-weights">
                    {blocks.map((d) => (
                      <BalanceWeight
                        key={d.key}
                        laneKey={d.key}
                        label={d.label}
                        ariaLabel={laneChipAriaOf(d)}
                        members={d.members ?? []}
                        side={side}
                        split={d.split}
                        splitBadge={b.splitBadge}
                        onOpen={() => openLaneFromWeight(d.key)}
                        ariaExpanded={openKey === d.key}
                        ariaControls={`gold-balance-row-${d.key}`}
                        widthPx={vm.weightW}
                        discPx={vm.discPx}
                        testKey={d.key}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bal-pan-empty" data-balance-empty={side}>
                    {emptyLineOf(side)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* 3. THE VERDICT BLOCK — the hero (05 §4.4): eyebrow, the
         * verdict word, the lane strip, the counts line, the sparse
         * note, the context pill. */}
        <div className="bal-verdict" data-balance-verdict={verdict}>
          <div className="bal-verdict-eyebrow">{b.verdictEyebrow}</div>
          <h4 className="bal-verdict-word" data-side={verdictSide} data-balance-verdict-word>
            {verdictWord}
          </h4>
          <div className="bal-lanes-bar" aria-hidden="true" data-balance-lane-strip>
            {drivers.map((d) => (
              <i key={d.key} data-side={d.state} />
            ))}
          </div>
          <p className="bal-verdict-counts" data-balance-count>
            {countsParts.join(' · ')}
          </p>
          {/* UI-40, held through the redesign (03 §4): a sparse reading is
           * NOT a reading — the verdict WORD itself becomes the honest
           * not-enough sentence (level beam, no needle, no side colour),
           * so no separate note renders under the counts. */}
          {contextLine}
        </div>
        {banner}
        {/* 4. THE "NOT LEANING" TRAY (05 §4.5): one recessed well for
         * the neutral and unread lane weights; empty when every lane
         * sits on a pan. */}
        <div className="bal-tray" data-balance-tray="not-leaning">
          <div className="bal-tray-head">
            <span className="bal-tray-title">{b.trayTitle}</span>
            <span className="bal-tray-note">{b.trayNote}</span>
          </div>
          {trayLanes.length > 0 ? (
            <div className="bal-weights">
              {trayLanes.map((d) => (
                <BalanceWeight
                  key={d.key}
                  laneKey={d.key}
                  label={d.label}
                  ariaLabel={laneChipAriaOf(d)}
                  members={d.members ?? []}
                  side={d.state}
                  split={d.split}
                  splitBadge={b.splitBadge}
                  onOpen={() => openLaneFromWeight(d.key)}
                  ariaExpanded={openKey === d.key}
                  ariaControls={`gold-balance-row-${d.key}`}
                  widthPx={s ? 72 : 92}
                  discPx={s ? 42 : 46}
                  testKey={d.key}
                />
              ))}
            </div>
          ) : (
            <p className="bal-tray-empty">{b.trayEmpty}</p>
          )}
        </div>
        {/* 5. THE LEDGER (05 §4.6): four expandable rows, one per lane —
         * the detail panel, inline. One row open at a time; the chevron
         * rotates 200ms; opening from a weight scrolls the row to the
         * centre. */}
        <ul className="bal-ledger" data-balance-ledger>
          {drivers.map((d) => {
            const open = openKey === d.key;
            const state = laneStateOf(d);
            return (
              <li key={d.key} className="bal-row" data-open={open} data-balance-row={d.key}>
                <button
                  type="button"
                  id={`gold-balance-row-btn-${d.key}`}
                  className="bal-row-btn"
                  data-balance-row-btn={d.key}
                  aria-expanded={open}
                  aria-controls={`gold-balance-row-${d.key}`}
                  onClick={() => toggle(d.key)}
                >
                  <span className="bal-disc">
                    <BalanceWeightDisc
                      laneKey={d.key}
                      members={d.members ?? []}
                      stone={d.state === 'neutral' || d.state === 'unread'}
                      discPx={40}
                    />
                  </span>
                  <span>
                    <span className="bal-row-name">{d.label}</span>
                    <span className="bal-row-state" data-side={state.side}>
                      {state.text}
                    </span>
                  </span>
                  <span className="bal-row-tally" data-balance-tally>
                    {d.tally ?? ''}
                  </span>
                  <svg
                    className="bal-chev"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div
                  className="bal-members"
                  id={`gold-balance-row-${d.key}`}
                  data-balance-detail={open ? d.key : undefined}
                  hidden={!open}
                >
                  {open ? (
                    <>
                      <p className="bal-members-intro">{d.detail}</p>
                      {d.note !== undefined ? (
                        <p className="bal-members-note" data-balance-lane-note>
                          {d.note}
                        </p>
                      ) : null}
                      {d.members !== undefined && d.members.length > 0 ? memberListVisual(d.members) : null}
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {/* 6. THE FOOTNOTE — the measured note + the backtest link
         * (01 §8.2, the caller-built node). */}
        {measuredNote}
      </div>
    );
  }

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
