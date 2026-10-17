/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, 2026-10-17e): the grouped
 * driver list (Supports / Works against / Sitting neutral) becomes a
 * beam balance. A visitor with no finance education sees in five seconds
 * which way the conditions lean for gold, and how many drivers could not
 * be read.
 *
 * Layout (spec §5): the verdict line (word + icon + the " · "-joined
 * count line) → the card's banner sentence (passed through unchanged) →
 * the balance (beam, pivot, two pans of blocks) → the two trays
 * (Neutral / Couldn't read) with the shared detail panel between.
 *
 * Beam rule (spec §6): net = for − against; the HEAVIER side goes DOWN
 * like a real scale; angle = |net|/total × 14° with a 3° floor so a
 * one-driver lean stays visible; unread drivers pull the beam toward
 * level (the ratio divides by TOTAL, not readable). Only the beam
 * rotates — the pans and their text stay upright and just ride each
 * beam end up or down (the pan drop equals the beam end's drop exactly:
 * both are sin(angle) × halfBeam). RTL flips the rotation sign so the
 * lowered side still matches the heavier side; grid columns mirror the
 * pans automatically.
 *
 * Blocks (spec §7) are real <button>s with aria-expanded: below ~900px a
 * tap opens the driver's existing explanation sentence in the detail
 * panel under the balance (one open at a time); at ~900px and above the
 * sentence is shown inside the block and no tap is needed. Trays (spec
 * §8) hold neutral (quiet) and unread (dashed + the existing clock icon)
 * chips; both are tappable into the same panel. Price footing is NOT a
 * driver and never touches the beam (spec §9 — it lives in the merged
 * card below the trays).
 *
 * Reusable by contract (spec §2.6): the component takes a list of
 * drivers and knows nothing about gold beyond the copy strings; the
 * merged card applies it to the gold driver list only.
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
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
  /** The driver's existing explanation sentence (shown in the block at
   * ≥900px, in the detail panel below that). */
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

/** Spec §6 suggested constants. The drop cap (not in the spec) keeps the
 * graphic a fixed, modest height on wide screens — where a 14° tilt on a
 * 720px beam would otherwise swing the pans ±87px; the angle is then
 * derived back from the capped drop so the beam ends and the pans still
 * move EXACTLY together. Recorded in the notes file. */
export const BALANCE_MAX_ANGLE_DEG = 14;
export const BALANCE_MIN_ANGLE_DEG = 3;
export const BALANCE_DROP_CAP_PX = 30;

const radOf = (deg: number): number => (deg * Math.PI) / 180;
const degOf = (rad: number): number => (rad * 180) / Math.PI;

export interface BalanceTilt {
  /** The beam's CSS rotation in degrees (LTR sign convention; RTL flips
   * it at render time). 0 = level. */
  angleDeg: number;
  /** The vertical drop of the heavy beam end (and its pan) in px. */
  dropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (spec §6): net 0 → level; nothing readable → level;
 * otherwise angle = |net|/total × MAX (floored at MIN so one driver
 * still leans), capped by the pan-drop cap. `halfBeamPx` is half the
 * rendered beam width (0 → level).
 */
export function balanceTilt(counts: BalanceCounts, halfBeamPx: number): BalanceTilt {
  if (counts.readable === 0 || counts.net === 0 || halfBeamPx <= 0) {
    return { angleDeg: 0, dropPx: 0, heavy: null };
  }
  const ratio = Math.abs(counts.net) / counts.total;
  const rawDeg = Math.min(BALANCE_MAX_ANGLE_DEG, Math.max(BALANCE_MIN_ANGLE_DEG, ratio * BALANCE_MAX_ANGLE_DEG));
  const rawDrop = Math.sin(radOf(rawDeg)) * halfBeamPx;
  const dropPx = Math.min(rawDrop, BALANCE_DROP_CAP_PX);
  const angleDeg = degOf(Math.asin(Math.min(1, dropPx / halfBeamPx)));
  return { angleDeg, dropPx, heavy: counts.net > 0 ? 'for' : 'against' };
}

export type BalanceVerdict = 'for' | 'balanced' | 'against' | 'none';

/** The verdict word (spec §5.1 + §13): nothing readable → "Can't read…";
 * otherwise the net's sign, "Balanced" at exactly zero. */
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

/** Spec §7.9: a pan stacks its blocks in one column up to four; beyond
 * that the extra blocks go to a second column inside the same pan. */
export function panColumnCounts(blockCount: number): [number, number] {
  if (blockCount <= 4) return [blockCount, 0];
  return [4, blockCount - 4];
}

/** The rendered beam width in px. ResizeObserver's first callback fires
 * right after observe (before paint), so the real width lands without a
 * synchronous setState in the effect body; jsdom/older envs keep the
 * mobile-first fallback (the SPA never server-renders). */
function useMeasuredWidth(fallback = 340): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => setWidth(el.clientWidth > 0 ? el.clientWidth : fallback);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width];
}

/** Spec §7.5/§7.6's ~900px wide-screen branch. The initial read happens
 * in the useState initialiser; the effect only subscribes to changes (no
 * synchronous setState in the effect body). */
function useWideScreen(query = '(min-width: 900px)'): boolean {
  const read = (): boolean =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches;
  const [wide, setWide] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent): void => setWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return wide;
}

/** The graphic strip's fixed geometry (px): beam centred at 24, strings
 * hang 24→44, the pans row tucks under with −4px so a level pan's label
 * meets its string exactly. */
const STRIP_CLASS = 'relative h-12';
const BEAM_CENTER_CLASS = 'top-1/2';
const STRING_TOP_CLASS = 'top-6';
const STRING_LENGTH_CLASS = 'h-5';
const PANS_TUCK_CLASS = '-mt-1';

/** The tilt animation (spec §6.7): ~500 ms ease, disabled for
 * prefers-reduced-motion users (the repo's standard pair). */
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
   * unchanged, rendered between the verdict line and the balance). */
  banner?: ReactNode;
}): React.JSX.Element | null {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const wide = useWideScreen();
  const [areaRef, areaWidth] = useMeasuredWidth();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (drivers.length === 0) return null;

  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);
  const tilt = balanceTilt(counts, areaWidth / 2);

  // Spec §6.6: RTL flips the rotation SIGN so the lowered end still sits
  // under the heavier pan (the pans themselves are side-agnostic — the
  // heavy one always moves DOWN by dropPx).
  const ltrSign = tilt.heavy === 'for' ? -1 : 1; // CSS: negative = counter-clockwise = the inline-start (left) end down
  const rotateDeg = tilt.angleDeg === 0 ? 0 : ltrSign * tilt.angleDeg * (rtl ? -1 : 1);
  const forDrop = tilt.heavy === 'for' ? tilt.dropPx : tilt.heavy === 'against' ? -tilt.dropPx : 0;
  const againstDrop = -forDrop;

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

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  const toggle = (key: string): void => setOpenKey((prev) => (prev === key ? null : key));
  const openDriver = drivers.find((d) => d.key === openKey) ?? null;

  /** One pan column: the side label above the stacked blocks (§7.3), the
   * dish below; the whole column rides its beam end up/down (§6.5). */
  const pan = (
    side: 'for' | 'against',
    blocks: readonly BalanceDriver[],
    dropPx: number,
  ): React.JSX.Element => {
    const [firstCol, secondCol] = panColumnCounts(blocks.length);
    const column = (items: readonly BalanceDriver[]): React.JSX.Element[] =>
      items.map((d) => {
        const expanded = wide ? true : openKey === d.key;
        return (
          <button
            key={d.key}
            type="button"
            aria-expanded={expanded}
            aria-controls={wide ? undefined : 'gold-balance-detail'}
            onClick={() => {
              if (!wide) toggle(d.key);
            }}
            data-balance-block={d.key}
            className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)]"
          >
            <IconImg
              src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL}
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-primary)]">
                {d.label}
              </span>
              {d.valueText !== null ? (
                <bdi
                  dir="ltr"
                  className="text-[length:var(--type-label)] font-semibold tabular-nums leading-snug text-[var(--color-text-secondary)]"
                >
                  {d.valueText}
                </bdi>
              ) : null}
              {wide ? (
                <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                  {d.detail}
                </span>
              ) : null}
            </span>
          </button>
        );
      });
    return (
      <span
        data-balance-pan={side}
        className={`flex min-w-0 flex-col gap-1.5 ${TILT_TRANSITION_CLASS}`}
        style={{ transform: `translateY(${dropPx}px)` }}
      >
        <span
          className={`text-[length:var(--type-label)] font-bold ${
            side === 'for' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
          }`}
        >
          {side === 'for' ? b.sideFor : b.sideAgainst}
        </span>
        {secondCol > 0 ? (
          <span className="grid grid-cols-2 items-start gap-1.5">
            <span className="flex min-w-0 flex-col gap-1.5">{column(blocks.slice(0, firstCol))}</span>
            <span className="flex min-w-0 flex-col gap-1.5">{column(blocks.slice(firstCol))}</span>
          </span>
        ) : (
          <span className="flex min-w-0 flex-col gap-1.5">{column(blocks)}</span>
        )}
        {/* The pan's dish — decorative, the blocks sit "in" it. */}
        <span
          aria-hidden="true"
          className="h-1.5 w-full rounded-b-full bg-currena-dark/45 dark:bg-white/45"
        />
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-3" data-balance>
      {/* 1. THE VERDICT LINE (§5.1) — the answer first: word + icon, then
       * the " · "-joined count line. Colour never rides alone: the icon
       * and the word carry the meaning (§12.2). */}
      <div className="flex flex-col gap-0.5" data-balance-verdict={verdict}>
        <span className={`inline-flex items-center gap-1.5 ${verdictToneClass}`}>
          <VerdictIcon verdict={verdictIcon} size={20} desktopSize={24} />
          <span className="text-[length:var(--type-label)] font-bold leading-tight">{verdictWord}</span>
        </span>
        {parts.length > 0 ? (
          <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]" data-balance-count>
            {parts.join(' · ')}
          </span>
        ) : null}
      </div>

      {/* 2. THE CARD'S BANNER SENTENCE (§5.2) — passed through unchanged. */}
      {banner}

      {/* 3. THE BALANCE (§5.3). The graphic strip carries role="img" with
       * the result as its label (§12.1); the interactive pans live
       * OUTSIDE it as siblings — role="img" children are presentational,
       * and the blocks must stay real buttons (§7.4). The area is capped
       * at ~720px and centred on wide screens (§10.3); full width on
       * mobile (§10.2). */}
      <div ref={areaRef} className="relative mx-auto w-full max-w-[720px]" style={{ paddingBottom: tilt.dropPx + 6 }}>
        {/* The beam + pivot + strings. Only the beam rotates (§6.5); the
         * strings translate with their pans so they stay attached to both
         * the beam end and the pan. */}
        <div className={STRIP_CLASS} role="img" aria-label={ariaLabel} data-balance-graphic>
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-12">
            <span
              data-balance-beam
              className={`absolute inset-x-0 h-1.5 rounded-full bg-currena-dark/45 dark:bg-white/45 ${BEAM_CENTER_CLASS} ${TILT_TRANSITION_CLASS}`}
              style={{ transform: `translateY(-50%) rotate(${rotateDeg}deg)` }}
            />
            {/* The fulcrum under the beam's centre — it never moves. */}
            <span className="absolute inset-x-0 top-[26px] flex justify-center">
              <span className="border-x-[7px] border-x-transparent border-t-[11px] border-t-currena-dark/60 dark:border-t-white/60" />
            </span>
            <span
              data-balance-string="for"
              className={`absolute start-0 w-0.5 bg-currena-dark/30 dark:bg-white/35 ${STRING_TOP_CLASS} ${STRING_LENGTH_CLASS} ${TILT_TRANSITION_CLASS}`}
              style={{ transform: `translateY(${forDrop}px)` }}
            />
            <span
              data-balance-string="against"
              className={`absolute end-0 w-0.5 bg-currena-dark/30 dark:bg-white/35 ${STRING_TOP_CLASS} ${STRING_LENGTH_CLASS} ${TILT_TRANSITION_CLASS}`}
              style={{ transform: `translateY(${againstDrop}px)` }}
            />
          </span>
        </div>
        {/* The pans: for at the inline-start end, against at the inline
         * end (§6.2) — grid columns mirror in RTL automatically. DOM
         * order (for → against) is the tab order (§12.4). */}
        <div className={`grid grid-cols-2 items-start gap-2.5 ${PANS_TUCK_CLASS}`}>
          {pan('for', forBlocks, forDrop)}
          {pan('against', againstBlocks, againstDrop)}
        </div>
      </div>

      {/* The shared detail panel (§7.5): one open panel at a time, tap
       * again to close. It always exists in the DOM (so every
       * aria-controls is valid) and stays hidden until a block (narrow
       * screens) or a tray chip (§8.4 — every width) opens it. */}
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

      {/* 4. THE TRAYS (§5.4 + §8) — neutral (quiet) and unread (dashed +
       * the existing clock icon) are DIFFERENT states and never touch the
       * beam. Empty trays hide (§8.5). */}
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
