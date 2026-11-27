"use client";

/**
 * The gold page's section-icon family — the owner's commissioned 3D
 * gold icon pack (the "Tinified" set, public/icons/), one icon marking
 * each section family on the page:
 *
 *   gold-briefing.png                    → the daily + monthly briefing
 *                                         pair (the TE daily card, the
 *                                         WGC monthly card)
 *   gold-price-up-or-down.png            → the Market Brief's own trend
 *                                         table — how gold performed at
 *                                         every window, now back to 1
 *                                         year and 5 years
 *   gold-price-influential-factors.png   → the Market Brief's key
 *                                         factors at work right now
 *   gold-dealers-long-short-position.png → the trader positioning
 *   gold-events-calendar.png             → the economic calendar (the
 *                                         upcoming events inside the
 *                                         scenarios band)
 *   gold-price-speculation-scenarios.png → the price-change scenarios
 *   gold-technical-analysis.png          → the technical analysis
 *
 * The second pack (the owner's Tinified-secondpack upload, 2026-11-27):
 *
 *   gold-against-major-currencies.png   → the currency-grid card — the
 *                                        ounce against every major
 *                                        currency (with the toman)
 *   gold-and-alternative-assets-performance.png → the comparison —
 *                                        gold's return against the
 *                                        alternatives, the graph band
 *   gold-central-bank-demand-supply.png → the central-bank demand —
 *                                        the buyers' and sellers' tables
 *   gold-dollar-comparison-iran-inflation-hedge.png → «طلا یا دلار؟» —
 *                                        the Iran yield question
 *   gold-forces-bearish-bullish-balance.png → the brass balance — the
 *                                        aggregate of the five forces
 *   gold-wealth-calculator.png          → the gold calculator band
 *   iranian-gold-coin-market.png        → Iran's gold and coin market —
 *                                        the Tehran board section
 *
 * The pack's master icon, gold-bar.png, does NOT ride this component:
 * it replaced the round coin as the page header's identity mark (the
 * batch-M [logo][title] law), at the header row's own 64px box — the
 * 128px floor below is the section icons' law, not the identity mark's.
 *
 * More icons are incoming; every one of them rides this single
 * component, so the treatment stays uniform: a plain
 * transparent-background <img> at the size the row asks for,
 * decorative — the heading beside it carries the name, the alt stays
 * empty — with width/height set so it never shifts layout, lazy and
 * async so the icons never block the page's own paint.
 *
 * THE SIZE LAW (the owner's batch-O ask): every icon renders at the
 * 128×128 CSS-pixel FLOOR — the owner found the first pass's sizes
 * (26px sub-heads, 34px card and section titles) too small and asked
 * for at least 128×128; the 250×250 sources stay crisp at 128
 * (~1.95× density), and the rows ride the same flex law as before —
 * the heading is the row, the icon its start element (items-center,
 * gap-3/gap-4), RTL flips it to the start-side for free.
 *
 * The files keep their pack spelling corrected only (calender →
 * calendar, scnearios → scenarios); the desk's basePath prefix rides
 * deskBasePath, as every other public asset on the page.
 */

import { deskBasePath } from "@/lib/utils";

export function PackIcon({
  file,
  size = 128,
  className = "",
}: {
  /** The file name inside public/icons/ (e.g. "gold-briefing.png"). */
  file: string;
  /** The rendered square size in CSS pixels; width/height are set to it.
      The owner's floor is 128 — no call site may ask for less. */
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={`${deskBasePath}/icons/${file}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      className={`shrink-0 select-none ${className}`}
    />
  );
}
