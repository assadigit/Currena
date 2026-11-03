/**
 * signals/BalanceWeight — the gold balance's LANE WEIGHT, the P2b visual
 * redesign's signature object (GB-S4, 2026-11-04 — docs/specs/
 * gold-balance-consolidation/05-VISUAL-DESIGN-SPEC.md §4.3 + the owner's
 * approved reference prototype, reference/balance-reference.html).
 *
 * A round brass weight (a stone face for neutral and unread lanes) with
 * the lane's icon engraved in dark brass, and THE SEGMENTED RIM: one arc
 * segment per driver of the lane, coloured by what it does — green
 * supports, red pressures, a hairline for steady, a dotted hairline for
 * unread — sorted supports → pressures → steady → unread so the disc
 * reads clockwise from 12 as a bar (05 §3: "the rim shows the evidence
 * count without numbers").
 *
 * Pure props only (05 §11): the component knows nothing about gold
 * beyond the strings its caller composes. The caller (BalanceScale's
 * lanes visual) supplies the lane key (for the engraved glyph), the
 * member impacts (for the rim), the label, the aria text and the split
 * badge word. The rim segments are DECORATIVE (aria-hidden): the counts
 * live in the accessible name and the ledger (05 §10 — no information
 * by colour alone).
 *
 * DQ-4 (lane icons): the existing inline icon sets are STATE-keyed
 * (ConditionIcon: supportive/against/neutral/unknown) and the PNG
 * artwork is photographic — neither carries a per-LANE identity that
 * can be engraved at 1.9px. This file draws the four lane glyphs as
 * inline stroke paths exactly as the owner's approved prototype does
 * (bank → borrowing costs, dollar → the dollar, activity → market
 * stress, flame → inflation). Recorded with the DQ-4 resolution in the
 * PR.
 */

import type { ReactNode } from 'react';
import type { BalanceDriverState, BalanceMember } from './BalanceScale';

/** The engraved lane glyphs (24×24 stroke geometry, the reference's
 * set). Keys are the lane keys the callers pass. */
const LANE_GLYPHS: Readonly<Record<string, ReactNode>> = {
  // A bank facade — borrowing costs.
  'borrowing-costs': (
    <>
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </>
  ),
  // A dollar sign — the dollar lane.
  dollar: (
    <>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  // An activity trace — market stress.
  stress: (
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  ),
  // A flame — inflation.
  inflation: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
};

/** The rim's sort order (05 §4.3): supports, then pressures, then steady,
 * then unread — a lane reads clockwise from 12 o'clock as a bar. */
const IMPACT_ORDER: Readonly<Record<BalanceMember['impact'], number>> = {
  supports: 0,
  pressures: 1,
  steady: 2,
  unread: 3,
};

/** One arc segment of the rim (pure — unit-tested). */
export interface BalanceRimSegment {
  impact: BalanceMember['impact'];
  /** SVG arc path inside the 60×60 disc viewBox. */
  d: string;
  stroke: 'for' | 'against' | 'hairline';
  /** 4.2 for firing drivers, 3 otherwise (05 §4.3). */
  strokeWidth: number;
  /** The dotted unread rim (05 §4.3). */
  dashed: boolean;
}

/** The disc's design viewBox: 60×60, rim radius 27, centre 30/30. */
export const BALANCE_RIM_R = 27;
export const BALANCE_RIM_CX = 30;
export const BALANCE_RIM_CY = 30;

/**
 * The segmented rim (05 §4.3, pure): one arc segment per member, sorted
 * supports → pressures → steady → unread, drawn clockwise from −90°
 * (12 o'clock) with a small gap between segments; green for supports,
 * red for pressures, a hairline for steady, a dotted hairline for
 * unread. Firing segments stroke 4.2, the rest 3. The caller maps the
 * semantic colours (`for` → the site's normal status hue, `against` →
 * alert); `hairline` → the border token (set by CSS, not here).
 */
export function balanceRimSegments(impacts: ReadonlyArray<BalanceMember['impact']>): BalanceRimSegment[] {
  const n = impacts.length;
  if (n === 0) return [];
  const sorted = [...impacts].sort((a, b) => IMPACT_ORDER[a] - IMPACT_ORDER[b]);
  const seg = 360 / n;
  const gap = n > 5 ? 6 : 8;
  const f = (v: number): string => v.toFixed(2);
  return sorted.map((impact, i) => {
    const a0 = ((-90 + i * seg + gap / 2) * Math.PI) / 180;
    const a1 = ((-90 + (i + 1) * seg - gap / 2) * Math.PI) / 180;
    const R = BALANCE_RIM_R;
    const cx = BALANCE_RIM_CX;
    const cy = BALANCE_RIM_CY;
    return {
      impact,
      d: `M${f(cx + R * Math.cos(a0))} ${f(cy + R * Math.sin(a0))} A${R} ${R} 0 0 1 ${f(cx + R * Math.cos(a1))} ${f(cy + R * Math.sin(a1))}`,
      stroke: impact === 'supports' ? 'for' : impact === 'pressures' ? 'against' : 'hairline',
      strokeWidth: impact === 'supports' || impact === 'pressures' ? 4.2 : 3,
      dashed: impact === 'unread',
    };
  });
}

/** The rim's stroke class per semantic colour — the SITE's pinned status
 * hues (05 §5: side colours stay --color-status-normal / -alert). */
const rimStrokeClass: Record<BalanceRimSegment['stroke'], string> = {
  for: 'stroke-[var(--color-status-normal)]',
  against: 'stroke-[var(--color-status-alert)]',
  hairline: 'stroke-[var(--color-border)]',
};

/** The lane's engraved glyph, or null for an unknown key (never throws:
 * an unmapped lane renders the plain face — no wrong icon). */
export function laneGlyphOf(laneKey: string): ReactNode | null {
  return LANE_GLYPHS[laneKey] ?? null;
}

/* ------------------------------------------------------------------ *
 * The disc: the SVG face + rim + the split badge anchored on its
 * inline-end upper corner. Gradient fills come from the ONE defs block
 * BalanceScale renders at the visual root (gb-faceBrass / gb-faceStone —
 * document-scoped url(#…) references, the reference prototype's own
 * pattern).
 * ------------------------------------------------------------------ */
export function BalanceWeightDisc({
  laneKey,
  impacts,
  state,
  splitBadge,
}: {
  laneKey: string;
  impacts: ReadonlyArray<BalanceMember['impact']>;
  /** Stone face for neutral and unread lanes (05 §4.3). */
  state: BalanceDriverState;
  splitBadge: string | null;
}): React.JSX.Element {
  const stone = state === 'neutral' || state === 'unread';
  const segments = balanceRimSegments(impacts);
  const glyph = laneGlyphOf(laneKey);
  return (
    <span className="disc" data-balance-disc={laneKey} data-balance-disc-face={stone ? 'stone' : 'brass'}>
      <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
        {/* The rim: one decorative arc segment per driver (05 §10). */}
        {segments.map((s, i) => (
          <path
            key={i}
            data-balance-seg={s.impact}
            d={s.d}
            fill="none"
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            {...(s.dashed ? { strokeDasharray: '1.4 3.2' } : {})}
            className={rimStrokeClass[s.stroke]}
          />
        ))}
        {/* The face: brass for side lanes, stone for neutral/unread. */}
        <g className="face">
          <circle cx="30" cy="30" r="20" fill={stone ? 'url(#gb-faceStone)' : 'url(#gb-faceBrass)'} />
          <circle cx="30" cy="30" r="19.4" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".8" />
          <circle cx="30" cy="30" r="15.6" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth=".7" />
        </g>
        {/* The engraved lane glyph. */}
        {glyph !== null ? (
          <g
            transform="translate(20 20) scale(.8333)"
            fill="none"
            stroke={stone ? 'var(--color-text-secondary)' : 'var(--bal-brass-ink)'}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {glyph}
          </g>
        ) : null}
      </svg>
      {splitBadge !== null ? (
        <span className="badge-split" data-balance-split-badge>
          {splitBadge}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The weight: a real button (44px minimum hit area incl. the label —
 * 05 §4.3), hover lift / active press / brass focus ring (the CSS),
 * the split badge on the disc's inline-end upper corner, the label
 * under. Opening is the caller's concern.
 * ------------------------------------------------------------------ */
export function BalanceWeight({
  laneKey,
  impacts,
  state,
  label,
  ariaLabel,
  splitBadge,
  onOpen,
  ariaExpanded,
}: {
  laneKey: string;
  impacts: ReadonlyArray<BalanceMember['impact']>;
  state: BalanceDriverState;
  label: string;
  ariaLabel: string;
  splitBadge: string | null;
  onOpen: () => void;
  ariaExpanded?: boolean | undefined;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="weight"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      onClick={onOpen}
      data-balance-weight={laneKey}
      data-balance-weight-state={state}
    >
      <BalanceWeightDisc laneKey={laneKey} impacts={impacts} state={state} splitBadge={splitBadge} />
      <span className="weight-label">{label}</span>
    </button>
  );
}

/** The skeleton weight (05 §8 loading): a grey disc, no motion. */
export function BalanceWeightSkeleton(): React.JSX.Element {
  return (
    <div className="weight" aria-hidden="true" style={{ cursor: 'default' }}>
      <span className="disc">
        <span className="sk" style={{ display: 'block', width: '100%', height: '100%' }} />
      </span>
      <span className="sk" style={{ height: 10, width: '80%' }} />
    </div>
  );
}
