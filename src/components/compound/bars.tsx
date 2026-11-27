"use client";

/**
 * Compound Wealth — the outcome visuals (v10.1: the owner's feedback —
 * "I don't like these horizontal bars… use more understandable visuals
 * like charts, pie charts, graphs" — so the two v8 bar families became
 * the two chart families people know: a donut for the share of a
 * whole, and small column charts for side-by-side magnitudes).
 *
 * Two presentational components, both plain divs/SVG (no libraries, no
 * animation, nothing interactive):
 *
 *  - ShareDonut: the two-part proportion under the three tiles (and on
 *    the phone card and the A4 card) as a donut chart — the same
 *    honest split as the old v8 bar, drawn as two SVG ring segments in
 *    the chart's own two tokens, so the donut doubles as the chart's
 *    key. It follows the money toggle: the shares come from the SHOWN
 *    values. The honest-edge rule lives in maths.ts (splitFinal):
 *    negative growth or an empty final hides the donut and keeps the
 *    sentence — never a misleading chart. pathLength="100" makes each
 *    segment's stroke-dasharray literally its percent, so the numbers
 *    stay inspectable in the DOM.
 *
 *  - MiniCols: the what-if cards' small column charts on one common
 *    scale per card (one baseline, heights in proportion, the reader's
 *    own plan in the gold token). The columns carry words only — the
 *    numbers live in the sentence above each set, and the columns'
 *    heights are those same numbers (base ± the sentence's deltas),
 *    never new maths.
 *
 * Every chart graphic is role="img" with an aria-label sentence (the
 * one pattern used everywhere), so each shape has its words.
 */

import type { Locale } from "@/lib/compound/content";
import { formatMoney, shareRounded, type FinalSplit } from "@/lib/compound/maths";

/* =================================================================== *
 * CONFIG BLOCK — every knob in plain English                          *
 * =================================================================== */

/** The page donut's rendered size (px). Small on purpose: the donut
 *  sits on the default screen and must stay quiet. */
const PAGE_DONUT = 44;
/** The phone card's donut size (px) — screenshot-safe, text-free. */
const PHONE_DONUT = 60;
/** The A4 card's donut size (px), in the ink-safe palette. */
const PRINT_DONUT = 40;
/** The donut's ring geometry (viewBox is 40×40): radius and stroke. */
const RING_R = 15.5;
const RING_W = 7;

/** The tallest what-if column's height (px). */
const COL_H = 44;
/** A column's minimum visible height (px) — a nub, never zero. */
const COL_MIN = 3;
/** The what-if columns' maximum width (px), so two- and three-column
 *  sets both read as one chart. */
const COL_MAX_W = 72;

/** The screen tokens — the chart's own two area tokens, so the donut
 *  doubles as the chart's key. */
const PAGE_COLORS = {
  putIn: "var(--color-text-secondary)",
  growth: "var(--color-accent-gold)",
};
/** The A4 card's ink-safe pair (greyscale-friendly, one accent). */
export const PRINT_COLORS = {
  putIn: "#47525d", // the ink chart's put-in line
  growth: "#a87e1c", // the ink chart's value line
};
/** The A4 card's dark-style pair (the same two roles, lighter inks). */
export const PRINT_COLORS_DARK = {
  putIn: "#8f9aa6",
  growth: "#d9a43e",
};

/* =================================================================== *
 * Shared bits                                                          *
 * =================================================================== */

/** A share as a percent word: "62%" / "۶۲٪", or "<1%" when under 1%. */
function shareWord(
  share: number,
  locale: Locale,
  underOne: string,
): string {
  const { pct, underOne: tiny } = shareRounded(share);
  if (tiny) return underOne;
  return `${formatMoney(pct, locale)}${locale === "fa" ? "٪" : "%"}`;
}

export interface ShareBarCopy {
  caption: string;
  sr: string;
  hiddenLine: string;
  underOne: string;
}

/** The sr-only twin sentence with the two percent words filled in. */
function srSentence(copy: ShareBarCopy, putWord: string, growthWord: string): string {
  return copy.sr.replace("{put}", putWord).replace("{growth}", growthWord);
}

/** The share as an exact percent string for the ring's dasharray
 *  (pathLength="100" → the dasharray IS the percent). */
const dashPct = (share: number) => (share * 100).toFixed(3);

/* =================================================================== *
 * The share donut                                                      *
 * =================================================================== */

export interface ShareDonutProps {
  /** splitFinal(shownFinal, shownPutIn) — null hides the donut honestly. */
  split: FinalSplit | null;
  locale: Locale;
  /** The chart's own labels, so donut and chart share vocabulary. */
  labels: { putIn: string; growth: string };
  copy: ShareBarCopy;
  /** page: tokens + key + caption; print: ink palette, the percentages
   *  join one caption line; phone: the caller's colours, no text at
   *  all (screenshot-safe). */
  variant?: "page" | "print" | "phone";
  /** The phone card's dynamic dark/light colours, or the A4 card's
   *  dark-style inks; page and print-light keep their own. */
  colors?: { putIn: string; growth: string };
  /** The donut's rendered size (px); each variant has its own default. */
  size?: number;
}

export function ShareDonut({
  split,
  locale,
  labels,
  copy,
  variant = "page",
  colors,
  size,
}: ShareDonutProps) {
  /* The honest edge: no drawable split → no donut; the sentence stays. */
  if (!split) {
    if (variant === "phone" || variant === "print") return null;
    return (
      <p className="mt-2 mb-0 text-[11.5px] leading-snug text-[var(--color-text-tertiary)]" data-cw="share-donut-hidden">
        {copy.hiddenLine}
      </p>
    );
  }

  const putWord = shareWord(split.putInShare, locale, copy.underOne);
  const growthWord = shareWord(split.growthShare, locale, copy.underOne);
  const sr = srSentence(copy, putWord, growthWord);
  const palette =
    variant === "phone" || variant === "print"
      ? (colors ?? (variant === "print" ? PRINT_COLORS : PAGE_COLORS))
      : PAGE_COLORS;
  const px = size ?? (variant === "phone" ? PHONE_DONUT : variant === "print" ? PRINT_DONUT : PAGE_DONUT);
  /** The put-in arc starts at 12 o'clock and runs clockwise; the growth
   *  arc continues where it ends — the two together are always the full
   *  ring, so the chart reads as one whole (a share of 100%). */
  const putDash = dashPct(split.putInShare);
  const growthDash = dashPct(split.growthShare);

  const donut = (
    <svg
      viewBox="0 0 40 40"
      width={px}
      height={px}
      dir="ltr"
      className="block shrink-0"
      role="img"
      aria-label={sr}
      data-cw="share-donut"
    >
      <circle
        data-cw="share-seg-putin"
        cx="20"
        cy="20"
        r={RING_R}
        fill="none"
        stroke={palette.putIn}
        strokeWidth={RING_W}
        pathLength="100"
        strokeDasharray={`${putDash} ${(100 - split.putInShare * 100).toFixed(3)}`}
        transform="rotate(-90 20 20)"
      />
      <circle
        data-cw="share-seg-growth"
        cx="20"
        cy="20"
        r={RING_R}
        fill="none"
        stroke={palette.growth}
        strokeWidth={RING_W}
        pathLength="100"
        strokeDasharray={`${growthDash} ${(100 - split.growthShare * 100).toFixed(3)}`}
        strokeDashoffset={`-${putDash}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );

  if (variant === "phone") return donut;

  if (variant === "print") {
    /* The A4 card: the donut plus ONE caption line — the two
       percentages in words with the two ink dots, so the donut keys
       the print chart. */
    return (
      <div className="cw-share-bar">
        {donut}
        <div className="cw-share-key">
          <span className="cw-share-dot" style={{ background: palette.putIn }} />
          <span>
            {putWord} {labels.putIn}
          </span>
          <span className="cw-share-dot" style={{ background: palette.growth }} />
          <span>
            {growthWord} {labels.growth}
          </span>
        </div>
      </div>
    );
  }

  /* The page: donut + the two key lines (the chart's key) + the
     caption. The donut sits beside its words at the tiles' own
     width — one compact block on the default screen. */
  return (
    <div data-cw="share-donut-wrap">
      <div className="mt-1.5 flex items-center gap-3">
        {donut}
        <p
          className="m-0 flex flex-col gap-1 text-[11.5px] font-semibold text-[var(--color-text-secondary)]"
          data-cw="share-key"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 shrink-0 rounded-[3px]" style={{ background: PAGE_COLORS.putIn }} aria-hidden="true" />
            <span>
              {putWord} {labels.putIn}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 shrink-0 rounded-[3px]" style={{ background: PAGE_COLORS.growth }} aria-hidden="true" />
            <span>
              {growthWord} {labels.growth}
            </span>
          </span>
        </p>
      </div>
      <p className="mt-0.5 mb-0 text-[11px] leading-snug text-[var(--color-text-tertiary)]" data-cw="share-caption">
        {copy.caption}
      </p>
    </div>
  );
}

/* =================================================================== *
 * The what-if column charts                                            *
 * =================================================================== */

export interface MiniColRow {
  /** The column's label, in words (never a number). */
  label: string;
  /** The column's height source — the sentence's own number (base ±
   *  its delta). */
  value: number;
  /** The reader's own plan's column: drawn in the growth token. */
  mine?: boolean;
}

export function MiniCols({ rows, sr }: { rows: MiniColRow[]; sr: string }) {
  /* One common scale per card: the largest value draws the tallest
     column; every other column is proportionally shorter. The columns
     and their word labels live in two bands with the SAME flex
     distribution (flex-1 wrappers, content centered), so every label
     sits under its own column at every card width. */
  const max = Math.max(...rows.map((r) => r.value), 0);
  const h = (v: number) => (max > 0 ? Math.max(COL_MIN, Math.round((v / max) * COL_H)) : COL_MIN);
  return (
    <div className="mt-2.5" role="img" aria-label={sr} data-cw="whatif-cols">
      {/* the columns, on one shared baseline */}
      <div className="flex items-end gap-2 border-b-[1.5px] border-[var(--color-border)]" aria-hidden="true">
        {rows.map((r) => (
          <span key={r.label} className="flex min-w-0 flex-1 justify-center">
            <span
              data-cw="whatif-col"
              className="block w-full max-w-[72px] rounded-t-md"
              style={{
                height: `${h(r.value)}px`,
                background: r.mine ? "var(--color-accent-gold)" : "var(--color-text-secondary)",
              }}
            />
          </span>
        ))}
      </div>
      {/* the words, one centered under its own column */}
      <div className="mt-1 flex gap-2">
        {rows.map((r) => (
          <span key={r.label} className="min-w-0 flex-1 text-center text-[10.5px] font-semibold leading-tight text-[var(--color-text-tertiary)]">
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
