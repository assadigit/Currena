/**
 * Currena icon set — the owner's PNG artwork (round 28).
 *
 * Source: "Currena PNG Icons.zip" (kept in docs/icon-source/), 18 pieces at
 * 256×256, copied into /assets/icons/ with web-friendly lowercase-kebab
 * names. Three families:
 *
 *   SUBJECTS  — the thing itself (gold, silver, oil, bitcoin, copper, fuel,
 *               bills, housing, the exchange chart, the US 10Y, the two
 *               region marks). Mapped by indicator id, money-area id and
 *               section so every surface that names a subject can wear it.
 *   STATES    — the four finance states, in the SAME colour coding the app
 *               already speaks (Carbon palette): Stable = the green normal
 *               ink, Cautious = the amber watch ink, Stressed = the orange
 *               stressed ink, Critical = the red alert ink. The artwork was
 *               drawn to match — the icon never replaces the state word,
 *               it rides beside it (icon + word + ink, never colour alone).
 *   DIRECTIONS— the green up / red down estimation arrows. Their fixed
 *               colours match the METALS valence (holder view: up is
 *               good), so they only appear where that valence holds — the
 *               gold-and-silver card. The money panel keeps its stroke
 *               arrows (there, "up" can be the BAD case and must follow
 *               the area's valence ink).
 *
 * Every image is decorative: alt="" + aria-hidden — the adjacent word
 * carries the meaning (the icons add warmth, not information).
 */

import type { CSSProperties } from 'react';
import type { InsightsSection } from '@currena/core';

const BASE = '/assets/icons';

/* ------------------------------------------------------------------ *
 * URL maps
 * ------------------------------------------------------------------ */

/** Subject icon per indicator id (the ids that have artwork). Deliberately
 * NOT exhaustive: ratios, policy rates and FX pairs stay unmapped — FX
 * already has flags, and a wrong icon is worse than none. */
const INDICATOR_ICONS: Readonly<Record<string, string>> = {
  brent: 'oil',
  'gold-usd': 'gold',
  'gold-aud': 'gold',
  'silver-usd': 'silver',
  'btc-usd': 'bitcoin',
  'copper-usd': 'copper',
  'copper-gold': 'copper',
  us10y: 'us-10-year-interest',
  'real-yield-10y': 'us-10-year-interest',
  'yield-curve-10y2y': 'us-10-year-interest',
  'au-cpi': 'bills-shop-prices',
  'au-trimmed-mean': 'bills-shop-prices',
  'us-cpi-yoy': 'bills-shop-prices',
  'rba-cash-rate': 'home-loan-rent-interest',
  'au-home-loan': 'home-loan-rent-interest',
  'au-rent-yoy': 'home-loan-rent-interest',
  'au-home-values': 'home-loan-rent-interest',
  'au-household-debt-arrears': 'home-loan-rent-interest',
  'au-petrol-yoy': 'fuel-price',
};

/** The money-panel life areas (jobs has no artwork — the stroke briefcase
 * stays). "Savings" wears the rising chart with its dollar coin. */
const MONEY_AREA_ICONS: Readonly<Record<string, string>> = {
  petrol: 'fuel-price',
  homeLoan: 'home-loan-rent-interest',
  savings: 'stock-exchange-index',
  shop: 'bills-shop-prices',
  overseas: 'global-finance',
};

/** Region marks for the two sections' verdict cards. */
const SECTION_ICONS: Readonly<Record<InsightsSection, string>> = {
  global: 'global-finance',
  australia: 'australia-map',
};

/** The four finance states by verdict step (1–4). The names follow the
 * artwork; the colour coding follows the app's existing state inks. */
const STATE_ICONS: Readonly<Record<number, string>> = {
  1: 'stable-state',
  2: 'cautious-state',
  3: 'stressed-state',
  4: 'critical-state',
};

const urlOf = (name: string): string => `${BASE}/${name}.png`;

export function indicatorIconUrl(id: string): string | null {
  return INDICATOR_ICONS[id] ? urlOf(INDICATOR_ICONS[id]!) : null;
}

export function moneyAreaIconUrl(area: string): string | null {
  return MONEY_AREA_ICONS[area] ? urlOf(MONEY_AREA_ICONS[area]!) : null;
}

export function sectionIconUrl(section: InsightsSection): string {
  return urlOf(SECTION_ICONS[section]!);
}

export function stateIconUrl(step: number): string | null {
  return STATE_ICONS[step] ? urlOf(STATE_ICONS[step]!) : null;
}

/** The world-markets section's own mark (owner round 44): the exchange
 * chart artwork — the section is not an InsightsSection (it lives on its
 * own feed), so it gets its own named export. The money panel's "savings"
 * area reuses the same artwork — one drawing, two homes, by design. */
export const MARKETS_SECTION_ICON_URL = urlOf('stock-exchange-index');

/** The metals' estimation arrows — green up / red down (fixed colours). */
export const DIRECTION_UP_URL = urlOf('up-support-growth-increase');
export const DIRECTION_DOWN_URL = urlOf('down-work-against-decrease');

/* ------------------------------------------------------------------ *
 * The <img> — one shape everywhere
 * ------------------------------------------------------------------ *
 * Round 29 (owner): "the icons are too small — a few times larger on
 * desktop, relatively larger on mobile." Sizing moved from fixed inline
 * px to two CSS custom properties: --icon-size (the MOBILE box) and
 * --icon-size-sm (the ≥640px box, Tailwind's `sm:` breakpoint — the
 * same breakpoint every money/price row already turns at). The CSS
 * class lives in index.css (.currena-icon) so one media query drives
 * every artwork surface; a surface that wants NO jump passes the same
 * number twice (or omits desktopSize). */

export function IconImg({
  src,
  size = 20,
  desktopSize,
  className = '',
}: {
  src: string;
  /** Rendered box in px on <640px viewports — the 256px source
   * downscales cleanly to any of these sizes. */
  size?: number;
  /** Rendered box in px on ≥640px viewports. Omitted → same as size. */
  desktopSize?: number;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={`currena-icon shrink-0 select-none ${className}`}
      style={
        {
          '--icon-size': `${size}px`,
          ...(desktopSize !== undefined ? { '--icon-size-sm': `${desktopSize}px` } : null),
        } as CSSProperties
      }
    />
  );
}
