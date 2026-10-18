/**
 * world-markets/MarketLogo — one index's wordmark in the section's
 * standardized frame (the 2026-10-18 world-indices handoff round).
 *
 * The supplied 256×256 JPEGs are wordmarks on white with their own
 * padding, so the frame is a quiet WHITE chip with a hairline ring and
 * `object-fit: contain` (ASSET-MAP integration rules 3–5: aspect ratio
 * preserved, never stretched or cropped, consistent neutral frame, and a
 * non-broken fallback when the file is missing — an initials chip, never
 * an unrelated logo). White stays white in dark mode too: these are
 * light-background artworks and a dark chip would crop their edges into
 * invisibility.
 *
 * The logo is SUPPLEMENTARY (02-ui-spec §4): alt="" + aria-hidden — the
 * canonical index name and country text beside it carry the identity. It
 * never overrides the data's canonical name.
 *
 * Sizing follows the .currena-icon recipe: --icon-size (mobile box) and
 * --icon-size-sm (the ≥640px box), driven by .currena-market-logo in
 * index.css so one media query drives every logo surface.
 */

import { useState, type CSSProperties } from 'react';
import type { MarketId } from '@currena/core';
import { marketLogoUrl } from '../../icons/currena';

/** The initials chip when the artwork cannot load — up to 3 leading
 * characters of the Latin name, Latin-direction, decorative like the img
 * it replaces. */
function initialsOf(latin: string): string {
  return latin.replace(/\s+/g, ' ').trim().slice(0, 3).toUpperCase();
}

export function MarketLogo({
  id,
  latin,
  size = 24,
  desktopSize = 32,
  className = '',
}: {
  id: MarketId;
  /** The copy dictionary's Latin display name (the initials source). */
  latin: string;
  /** Rendered box in px on <640px viewports (24–32 on rows, larger on the
   * mover cards). */
  size?: number;
  /** Rendered box in px on ≥640px viewports. Omitted → same as size. */
  desktopSize?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const style = {
    '--icon-size': `${size}px`,
    ...(desktopSize !== undefined ? { '--icon-size-sm': `${desktopSize}px` } : null),
  } as CSSProperties;
  if (failed) {
    return (
      <span
        aria-hidden="true"
        dir="ltr"
        className={`currena-market-logo currena-market-logo-fallback shrink-0 select-none ${className}`}
        style={style}
      >
        {initialsOf(latin)}
      </span>
    );
  }
  return (
    <img
      src={marketLogoUrl(id)}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      onError={() => setFailed(true)}
      className={`currena-market-logo shrink-0 select-none ${className}`}
      style={style}
    />
  );
}
