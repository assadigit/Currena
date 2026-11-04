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
 * optional slots (subtitle/contextLine/measuredNote) carried the LANE
 * view behind the ?balance=lanes preview flag.
 *
 * Gold balance consolidation P2b (GB-S4, 2026-11-03 — 05-VISUAL-DESIGN-SPEC.md,
 * implemented from the owner-approved prototype
 * docs/specs/gold-balance-consolidation/reference/balance-reference.html):
 * the REDESIGNED balance — the assay-office stage (brass tapered beam,
 * pivot + 11-tick dial, column + base, bowl pans with side tint + brass
 * rim), lane WEIGHTS with segmented rims (signals/BalanceWeight.tsx),
 * the verdict block as the hero, the "Not leaning" tray and the
 * four-row inline LEDGER (the detail panel, inline — the same
 * member-list content contract). The MECHANICS are unchanged: ONE
 * animated angle drives everything (the beam rotates, the pans
 * translate only, the hangers redraw per frame), the beam formula is
 * the owner's (|net|/(for+against)×10° clamped to [3°,10°], level at
 * net 0 / sparse / nothing readable), and prefers-reduced-motion jumps;
 * 650ms ease-out QUARTIC on load and on data change (05 §7).
 *
 * Gold balance consolidation P5 (GB-S6, 2026-11-04 — the owner's
 * recorded "go"): the visual design is THE balance for every visitor —
 * the ?balance=lanes preview flag and its `visual` prop RETIRE with the
 * whole legacy branch (the v8 composition above: the pan tiles, the
 * shared detail panel, the trays, the legacy stage geometry and gauge).
 * The pure law helpers the redesign still shares — driverStateOf,
 * balanceCounts, balanceVerdictOf, countLineParts, balanceTilt,
 * signedTiltDeg, the verdict word and the empty-pan lines — stay
 * verbatim; a fresh vitest snapshot of the flipped view is the
 * byte-stability pin (gold-balance-lanes.test.tsx).
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatNumber } from '@currena/core';
import type { SignalConditionState } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';
import { BalanceGradients, BalanceWeight, BalanceWeightDisc } from './BalanceWeight';

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
   * Absent → the ledger row lists no members. */
  members?: ReadonlyArray<BalanceMember>;
  /** GB-S3 (03 §2): a contested neutral (supports === pressures > 0) —
   * renders the badge beside the label and appends the badge word to the
   * chip's accessible name. */
  split?: boolean;
  /** GB-S3 (03 §2): the chip's second line, built by the caller from
   * copy ("4 of 8 drivers firing" / "No driver firing" / "2 for, 2
   * against"). Absent → no tally line. */
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
 * the legacy v7 geometry did — the physical sign is direction-free), each
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

/** The GB-S4 motion rule (05 §7): 650ms ease-out QUARTIC on load and on
 * data change. */
const TILT_ANIMATION_VISUAL_MS = 650;

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

/** The balance's verdict word — ONE rule for every site that speaks it
 * (the card's hero since GB-S4; since the GB-S6 flip also the summary
 * prose: the merged card's header line and the collapsed section's
 * gold line, which joined the lane model with the flip — the legacy
 * 5-condition sentence counted FOOTING, the circularity D-GB-5
 * removed). Sparse is not a reading (UI-40): readable 0 keeps the
 * component's own stronger "can't read" word; 1–2 readable shows the
 * spec's explicit not-enough line. Pure. */
export function balanceVerdictWordOf(counts: BalanceCounts, copy: InsightsCopy): string {
  const b = copy.signals.balance;
  const sparse = counts.readable < 3;
  const verdict = balanceVerdictOf(counts);
  if (sparse) return counts.readable === 0 ? b.verdictNone : copy.signals.notEnoughReadable;
  if (verdict === 'for') return b.verdictFor;
  if (verdict === 'against') return b.verdictAgainst;
  if (verdict === 'balanced') return b.verdictBalanced;
  return b.verdictNone;
}

/** The verdict block's lane-counts line parts (05 §4.4): the for and
 * against parts always render (zeros included — the strip shows the
 * shape, the counts state it), the unread part only when > 0. The
 * same parts serve the summary prose (the collapsed line + the card
 * header) so the prose can never drift from the card. Pure. */
export function balanceVerdictCountsParts(counts: BalanceCounts, copy: InsightsCopy, numberLocale: 'en-US' | 'fa-IR'): string[] {
  const b = copy.signals.balance;
  const n = (value: number): string => formatNumber(value, numberLocale, { maximumFractionDigits: 0 });
  const parts = [
    interpolate(b.verdictCountFor, { n: n(counts.for) }),
    interpolate(b.verdictCountAgainst, { n: n(counts.against) }),
    interpolate(b.verdictCountNotLeaning, { n: n(counts.neutral) }),
  ];
  if (counts.unread > 0) parts.push(interpolate(b.verdictCountUnread, { n: n(counts.unread) }));
  return parts;
}

export interface BalancePoint {
  x: number;
  y: number;
}


export function BalanceScale({
  drivers,
  copy,
  numberLocale,
  banner,
  subtitle,
  contextLine,
  measuredNote,
}: {
  drivers: readonly BalanceDriver[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The card's existing verdict banner sentence (spec §5.2 — kept
   * unchanged, rendered inside the aggregate assessment box). */
  banner?: ReactNode;
  /** The balance's subtitle — the lane wording (03 §6). Absent → the
   * dictionary's own `subtitle`. */
  subtitle?: string;
  /** GB-S3 (01 §6): the non-voting context line under the verdict box
   * (gold's own 30-day move, never counted). Absent → nothing renders. */
  contextLine?: ReactNode;
  /** GB-S3 (01 §8.2): the measured note + the backtest link, visible
   * without a tap. Absent → nothing renders. */
  measuredNote?: ReactNode;
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

  /* THE ONE ANIMATED VALUE (addendum §A): θ. The balance starts LEVEL
   * and swings to the verdict on load (650ms ease-out quartic), then the
   * rAF timeline below animates it whenever the model's target changes
   * (a data refresh), re-deriving the beam rotation, joints, pan
   * translations and hanger endpoints in the SAME frame;
   * prefers-reduced-motion jumps. */
  const [theta, setTheta] = useState(0);
  const thetaRef = useRef(0);
  const frame = useRef(0);

  /* GB-S4: the VISUAL root's measured width — drives the size steps
   * (s/m/l by the card's own width, the reference prototype's rule) and
   * the stage width (min(root, 720)). */
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
    // GB-S4 (05 §7): 650ms ease-out QUARTIC on load and on data change.
    // GB-S6: the tween's t0 is the FIRST rAF tick's own timestamp (the
    // browser's animation clock) — no separate now() call; the tween
    // starts at the first vsync frame after the data lands.
    const duration = TILT_ANIMATION_VISUAL_MS;
    const easeOf = (p: number) => 1 - (1 - p) ** 4;
    let start: number | null = null;
    const tick = (now: number): void => {
      if (start === null) start = now;
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
  }, [targetDeg]);

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
  const verdictWord = balanceVerdictWordOf(counts, copy);
  const parts = countLineParts(counts, copy, numberLocale);
  const ariaLabel = interpolate(b.aria, { summary: parts.join(' · '), verdict: verdictWord });
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

  const toggle = (key: string): void => setOpenKey((prev) => (prev === key ? null : key));

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
   * readings is never worded as an absence of pressure — the visual
   * bowl pans. */
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

/* ---------------------------------------------------------------- *
 * GB-S4 — THE VISUAL REDESIGN (05-VISUAL-DESIGN-SPEC.md, from the
 * owner-approved reference prototype) — since the GB-S6 flip THE
 * balance for every visitor (the legacy branch retired with the
 * flag). Layout, top to bottom (05 §4.1): the head (eyebrow → title →
 * subtitle), the brass STAGE, the VERDICT block (the hero), the
 * context pill, the banner, the "Not leaning" tray, the LEDGER (the
 * detail panel, inline — one row open at a time), the footnote.
 * ---------------------------------------------------------------- */
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
  const countsParts = balanceVerdictCountsParts(counts, copy, numberLocale);

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
       * stage wrapper carries the group label. */}
      <div
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
