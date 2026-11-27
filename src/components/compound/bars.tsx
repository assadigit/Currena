"use client";

/**
 * Compound Wealth — the v8 outcome bars.
 *
 * Two small presentational components, both plain divs (no libraries,
 * no animation, nothing interactive):
 *
 *  - ShareBar: the two-segment proportion bar under the three tiles
 *    (and on the phone card and the A4 card). Its two segments use the
 *    chart's own area tokens, so the bar doubles as the chart's key.
 *    It follows the money toggle: the shares come from the SHOWN
 *    values. The honest-edge rule lives in maths.ts (splitFinal):
 *    negative growth or an empty final hides the bar and keeps the
 *    sentence — never a misleading bar.
 *
 *  - MiniBars: the what-if cards' thin labelled bars on one common
 *    scale per card. The rows carry words only — the numbers live in
 *    the sentence above each set, and the bar endpoints are those same
 *    numbers (base ± the sentence's deltas), never new maths.
 *
 * Every bar graphic is role="img" with an aria-label sentence (the one
 * pattern used everywhere), so each shape has its words.
 */

import type { Locale } from "@/lib/compound/content";
import { formatMoney, shareRounded, type FinalSplit } from "@/lib/compound/maths";

/* =================================================================== *
 * CONFIG BLOCK — every knob in plain English                          *
 * =================================================================== */

/** The page bar's track height (px). Slim on purpose: the bar sits on
 *  the default screen and must stay quiet. */
const PAGE_TRACK_H = 10;
/** The phone card's strip height (px) — screenshot-safe, text-free. */
const PHONE_TRACK_H = 7;
/** The A4 card's bar height (px), in the ink-safe palette. */
const PRINT_TRACK_H = 8;
/** The what-if mini-bar track height (px). */
const MINI_TRACK_H = 5;
/** The mini-bar label column width, wide enough for the longest row
 *  label in either language so tracks always align. */
const MINI_LABEL_W = "7.5rem";

/** The screen tokens — the chart's own two area tokens, so the bar
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

/* =================================================================== *
 * The share bar                                                        *
 * =================================================================== */

export interface ShareBarProps {
  /** splitFinal(shownFinal, shownPutIn) — null hides the bar honestly. */
  split: FinalSplit | null;
  locale: Locale;
  /** The chart's own labels, so bar and chart share vocabulary. */
  labels: { putIn: string; growth: string };
  copy: ShareBarCopy;
  /** page: tokens + key line + caption; print: ink palette, the
   *  percentages join one caption line; phone: the caller's colours,
   *  no text at all (screenshot-safe). */
  variant?: "page" | "print" | "phone";
  /** The phone card's dynamic dark/light colours, or the A4 card's
   *  dark-style inks; page and print-light keep their own. */
  colors?: { putIn: string; growth: string };
}

export function ShareBar({ split, locale, labels, copy, variant = "page", colors }: ShareBarProps) {
  /* The honest edge: no drawable split → no bar; the sentence stays. */
  if (!split) {
    if (variant === "phone" || variant === "print") return null;
    return (
      <p className="mt-2 mb-0 text-[11.5px] leading-snug text-[var(--color-text-tertiary)]" data-cw="share-bar-hidden">
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
  const trackH = variant === "phone" ? PHONE_TRACK_H : variant === "print" ? PRINT_TRACK_H : PAGE_TRACK_H;

  const bar = (
    <div
      className={`flex w-full overflow-hidden rounded-full ${variant === "phone" ? "" : "mt-2"}`}
      style={{ height: trackH }}
      role="img"
      aria-label={sr}
      data-cw="share-bar"
    >
      <div
        className="h-full shrink-0"
        style={{ width: `${(split.putInShare * 100).toFixed(3)}%`, background: palette.putIn }}
        data-cw="share-seg-putin"
      />
      <div
        className="h-full min-w-0 flex-1"
        style={{ background: palette.growth }}
        data-cw="share-seg-growth"
      />
    </div>
  );

  if (variant === "phone") return bar;

  if (variant === "print") {
    /* The A4 card: the bar plus ONE caption line — the two percentages
       in words with the two ink dots, so the bar keys the print chart. */
    return (
      <div className="cw-share-bar">
        {bar}
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

  /* The page: bar + the key line (the chart's key) + the caption. */
  return (
    <div data-cw="share-bar-wrap">
      {bar}
      <p
        className="mt-1.5 mb-0 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] font-semibold text-[var(--color-text-secondary)]"
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
      <p className="mt-0.5 mb-0 text-[11px] leading-snug text-[var(--color-text-tertiary)]" data-cw="share-caption">
        {copy.caption}
      </p>
    </div>
  );
}

/* =================================================================== *
 * The what-if mini-bars                                                *
 * =================================================================== */

export interface MiniBarRow {
  /** The row's label, in words (never a number). */
  label: string;
  /** The endpoint — the sentence's own number (base ± its delta). */
  value: number;
  /** The reader's own plan's row: drawn in the growth token. */
  mine?: boolean;
}

export function MiniBars({ rows, sr }: { rows: MiniBarRow[]; sr: string }) {
  /* One common scale per card: the largest endpoint fills the track. */
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <div className="mt-2" role="img" aria-label={sr} data-cw="whatif-bars">
      {rows.map((r, i) => (
        <div key={r.label} className={`flex items-center gap-2 ${i > 0 ? "mt-[5px]" : ""}`}>
          <span
            className="shrink-0 text-[10.5px] font-semibold leading-none text-[var(--color-text-tertiary)]"
            style={{ width: MINI_LABEL_W }}
          >
            {r.label}
          </span>
          <span
            className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-border)_55%,var(--color-surface))]"
            style={{ height: MINI_TRACK_H }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: max > 0 ? `${Math.min(100, (r.value / max) * 100).toFixed(2)}%` : "0%",
                background: r.mine ? "var(--color-accent-gold)" : "var(--color-text-secondary)",
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
