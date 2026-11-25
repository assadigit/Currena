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
 * More icons are incoming; every one of them rides this single
 * component, so the treatment stays uniform: a plain
 * transparent-background <img> at the size the row asks for,
 * decorative — the heading beside it carries the name, the alt stays
 * empty — with width/height set so it never shifts layout, lazy and
 * async so the icons never block the page's own paint.
 *
 * The files keep their pack spelling corrected only (calender →
 * calendar, scnearios → scenarios); the desk's basePath prefix rides
 * deskBasePath, as every other public asset on the page.
 */

import { deskBasePath } from "@/lib/utils";

export function PackIcon({
  file,
  size = 34,
  className = "",
}: {
  /** The file name inside public/icons/ (e.g. "gold-briefing.png"). */
  file: string;
  /** The rendered square size in CSS pixels; width/height are set to it. */
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
