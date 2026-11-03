/**
 * signals/BalanceWeight — the gold balance's LANE WEIGHT, the signature
 * object of the visual redesign (gold balance consolidation P2b / GB-S4,
 * 2026-11-03 — docs/specs/gold-balance-consolidation/05-VISUAL-DESIGN-SPEC.md
 * §4.3, implemented from the owner-approved prototype
 * reference/balance-reference.html).
 *
 * A round brass weight with the lane's icon engraved in dark brass; a
 * neutral or unread lane weighs in STONE instead. Around the face runs
 * the SEGMENTED RIM: one arc segment per driver of the lane, sorted
 * supports → pressures → steady → unread so a lane reads clockwise from
 * the top as a bar — green supports, red pressures, a hairline for
 * steady, a dotted hairline for unread. The rim is DECORATIVE
 * (aria-hidden): the counts live in the button's accessible name and in
 * the ledger (05 §10 — no information by colour alone; the sort order is
 * stable so the rim is still scannable).
 *
 * A split lane (a contested neutral, 03 §2) carries the small white
 * "Split" badge on the weight's upper inline-end corner.
 *
 * The button is a real control (44px minimum hit area including the
 * label — the disc plus the label column): hover lifts it 1px, press
 * scales it to 0.97, focus shows the 2px brass ring with a 3px offset.
 * Pressing it opens the lane's LEDGER row (the inline detail panel).
 *
 * Pure props only (05 §11): the lane key picks the engraved icon, the
 * member impacts draw the rim, and every word (label, badge, accessible
 * name) arrives from the caller's copy — this component knows nothing
 * about gold beyond the four lane icons' shapes. The SVG gradients it
 * references (bal-face-brass / bal-face-stone) are defined ONCE by the
 * visual BalanceScale root (BalanceGradients below) — the weight renders
 * only inside it.
 */

import type { ReactNode } from 'react';

/** The rim segment vocabulary — the engine's member impacts. */
export type BalanceWeightImpact = 'supports' | 'pressures' | 'steady' | 'unread';

/** The sorted rim order (05 §4.3): supports, pressures, steady, unread. */
const RIM_ORDER: Record<BalanceWeightImpact, number> = { supports: 0, pressures: 1, steady: 2, unread: 3 };

/** The minimal member shape the rim reads (the full BalanceMember also
 * fits — the extra fields are simply ignored). */
export interface BalanceWeightMember {
  impact: BalanceWeightImpact;
}

/** One computed rim segment (pure — exported for the rim-count tests). */
export interface BalanceRimSegment {
  /** The member's impact (drives the colour, the stroke and the dash). */
  impact: BalanceWeightImpact;
  /** The arc path, in the 60×60 disc viewBox. */
  d: string;
  /** 4.2px for firing drivers (supports/pressures), 3px otherwise. */
  strokeWidth: number;
  /** Unread segments render dotted (stroke-dasharray), steady plain. */
  dotted: boolean;
}

/** The disc's rim radius + centre in its 60×60 viewBox (the prototype's
 * numbers: face r=20, rim ring at r=27, so the 4.2px stroke's outer edge
 * sits at 29.1 < 30 — nothing clips). */
const RIM_R = 27;
const DISC_CX = 30;
const DISC_CY = 30;

/**
 * The rim's arc segments — one per member, sorted supports → pressures →
 * steady → unread, starting at the top (−90°) and running clockwise, a
 * few degrees of gap between them (8° for ≤5 members, 6° when the lane
 * is crowded). Pure and deterministic: same members, same rim.
 */
export function balanceRimSegments(members: ReadonlyArray<BalanceWeightMember>): BalanceRimSegment[] {
  const n = members.length;
  if (n === 0) return [];
  const gap = n > 5 ? 6 : 8;
  const seg = 360 / n;
  const ordered = [...members].sort((a, b) => RIM_ORDER[a.impact] - RIM_ORDER[b.impact]);
  const f = (v: number): number => Math.round(v * 100) / 100;
  return ordered.map((m, i) => {
    const a0 = (-90 + i * seg + gap / 2) * (Math.PI / 180);
    const a1 = (-90 + (i + 1) * seg - gap / 2) * (Math.PI / 180);
    return {
      impact: m.impact,
      d:
        `M ${f(DISC_CX + RIM_R * Math.cos(a0))} ${f(DISC_CY + RIM_R * Math.sin(a0))} ` +
        `A ${RIM_R} ${RIM_R} 0 0 1 ${f(DISC_CX + RIM_R * Math.cos(a1))} ${f(DISC_CY + RIM_R * Math.sin(a1))}`,
      strokeWidth: m.impact === 'supports' || m.impact === 'pressures' ? 4.2 : 3,
      dotted: m.impact === 'unread',
    };
  });
}

/** The rim colour per impact: the side hues for firing drivers, the
 * hairline for steady and unread (the CSS custom properties resolve the
 * theme). */
const RIM_COLOR: Record<BalanceWeightImpact, string> = {
  supports: 'var(--color-status-normal)',
  pressures: 'var(--color-status-alert)',
  steady: 'var(--color-border)',
  unread: 'var(--color-border)',
};

/* ------------------------------------------------------------------ *
 * The engraved lane icons (DQ-4: the prototype's own lucide-style set —
 * the owner approved their look beside the brass; the existing
 * ConditionIcon glyphs name STATES, not lanes, so they cannot label a
 * weight). 24×24 stroke paths, scaled 0.8333 into the 60×60 disc.
 * ------------------------------------------------------------------ */
const LANE_ICONS: Record<string, ReactNode> = {
  // borrowing costs: the institution's roof over its bars
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
  // the dollar: the currency's own mark
  dollar: (
    <>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  // market stress: the monitor's trace
  stress: (
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  ),
  // inflation: the flame of running hot
  inflation: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
};

/**
 * The SVG gradients the discs reference — rendered ONCE at the visual
 * balance's root (a 0×0 svg; ids are document-global, so they are
 * namespaced bal-* and only the visual balance uses them).
 */
export function BalanceGradients(): React.JSX.Element {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="bal-face-brass" cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="var(--bal-brass-hi)" />
          <stop offset="55%" stopColor="var(--bal-brass-mid)" />
          <stop offset="100%" stopColor="var(--bal-brass-lo)" />
        </radialGradient>
        <radialGradient id="bal-face-stone" cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="var(--bal-stone-hi)" />
          <stop offset="100%" stopColor="var(--bal-stone-lo)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/**
 * The DISC itself — the segmented rim around a brass (or stone) face with
 * the lane icon engraved. Decorative by contract (aria-hidden): the
 * accessible name and the ledger carry the counts. Rendered inside the
 * weight button, inside a ledger row button (never a control itself, so
 * it never nests interactives) and unit-tested through the rim helper.
 */
export function BalanceWeightDisc({
  laneKey,
  members,
  stone,
  discPx,
}: {
  /** The lane key — picks the engraved icon (unknown keys render the
   * plain disc, still honest). */
  laneKey: string;
  /** The lane's members — one rim segment each. */
  members: ReadonlyArray<BalanceWeightMember>;
  /** true for neutral and unread lanes (the stone face, 05 §4.3). */
  stone: boolean;
  /** The rendered diameter in px (58 pan / 46 tray / 40 row). */
  discPx: number;
}): React.JSX.Element {
  const segments = balanceRimSegments(members);
  const icon = LANE_ICONS[laneKey];
  return (
    <svg
      viewBox="0 0 60 60"
      aria-hidden="true"
      focusable="false"
      style={{ width: discPx, height: discPx, display: 'block', overflow: 'visible' }}
    >
      <g>
        {segments.map((s, i) => (
          <path
            key={i}
            data-bal-seg={s.impact}
            d={s.d}
            fill="none"
            stroke={RIM_COLOR[s.impact]}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={s.dotted ? '1.4 3.2' : undefined}
          />
        ))}
      </g>
      <g className="bal-disc-face">
        <circle cx={DISC_CX} cy={DISC_CY} r="20" fill={stone ? 'url(#bal-face-stone)' : 'url(#bal-face-brass)'} />
        <circle cx={DISC_CX} cy={DISC_CY} r="19.4" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".8" />
        <circle cx={DISC_CX} cy={DISC_CY} r="15.6" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth=".7" />
      </g>
      {icon !== undefined ? (
        <g
          transform="translate(20 20) scale(.8333)"
          fill="none"
          stroke={stone ? 'var(--color-text-secondary)' : 'var(--bal-brass-ink)'}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </g>
      ) : null}
    </svg>
  );
}

/**
 * The WEIGHT — the disc + the split badge + the label, as one button.
 * Pressing it opens the lane's ledger row (the caller's onOpen scrolls
 * the row into view and focuses it). The 44px hit area is the whole
 * button: the disc plus its label column.
 */
export function BalanceWeight({
  laneKey,
  label,
  ariaLabel,
  members,
  side,
  split,
  splitBadge,
  onOpen,
  ariaExpanded,
  ariaControls,
  widthPx,
  discPx,
  testKey,
}: {
  laneKey: string;
  /** The lane's short name (the label under the disc). */
  label: string;
  /** The accessible name (the caller's laneChipAria composition). */
  ariaLabel: string;
  members: ReadonlyArray<BalanceWeightMember>;
  side: 'for' | 'against' | 'neutral' | 'unread';
  /** A contested neutral (03 §2) — renders the badge. */
  split?: boolean | undefined;
  /** The badge word from the caller's copy ("Split" / «دوپاره»). */
  splitBadge: string;
  onOpen: () => void;
  ariaExpanded?: boolean | undefined;
  ariaControls?: string | undefined;
  /** The button's column width (the stage/tray metrics set it). */
  widthPx: number;
  /** The disc's diameter. */
  discPx: number;
  /** The data-balance-weight key (the lane id). */
  testKey: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="bal-weight"
      data-balance-weight={testKey}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onOpen}
      style={{ width: widthPx, minHeight: 44 }}
    >
      <span className="bal-disc">
        <BalanceWeightDisc laneKey={laneKey} members={members} stone={side === 'neutral' || side === 'unread'} discPx={discPx} />
        {split === true ? (
          <span className="bal-badge-split" data-balance-split-badge>
            {splitBadge}
          </span>
        ) : null}
      </span>
      <span className="bal-weight-label">{label}</span>
    </button>
  );
}
