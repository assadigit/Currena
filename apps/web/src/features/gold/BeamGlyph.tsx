/**
 * BeamGlyph — the balance's COMPACT fidelity (11 §5.2): the 120×46
 * monochrome beam drawing on the engine's own tilt math. Born inside
 * GoldHero (the S5 minimal view); GUX-S5 M3b moves it to its own module
 * — the hero's view radio RETIRED (the CompositionStack is the balance
 * view now) and the stack is the glyph's remaining consumer, but the
 * module keeps the drawing independent so any future compact context
 * (the time machine, narrative references) reuses it without importing
 * the hero.
 *
 * Decorative geometry by contract: role="img" with the corpus's gauge
 * aria sentence — the verdict word beside it carries the meaning;
 * colour and geometry never alone.
 */

import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';

export function BeamGlyph({ angleDeg, heavy }: { angleDeg: number; heavy: 'for' | 'against' | null }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  // The visual rotation: the heavy side's end dips. The for pan sits at
  // the beam's start side (left in LTR); in RTL the whole drawing mirrors
  // (the legacy drawing's own rule) so the heavy end still dips toward
  // the reading's start side.
  const signed = heavy === 'for' ? -angleDeg : angleDeg;
  const rtl = locale === 'fa';
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const verdictWord =
    heavy === null ? '' : heavy === 'for' ? t('pd.gold.heroVerdictFor') : t('pd.gold.heroVerdictAgainst');
  const aria = interpolate(t('pd.gold.heroBeamAria'), {
    n: num(angleDeg),
    verdict: heavy === null ? t('pd.gold.heroVerdictBalanced') : verdictWord,
  });
  return (
    <svg
      viewBox="0 0 120 46"
      role="img"
      aria-label={aria}
      className="h-[46px] w-[120px] shrink-0 text-[var(--color-text-secondary)]"
      data-hero-beam
      data-hero-beam-angle={angleDeg}
    >
      <g transform={rtl ? 'scale(-1,1) translate(-120,0)' : undefined}>
        {/* The beam group: bar + pivot + needle, rotated about the pivot
         * by the engine's own tilt angle (level at net 0 / nothing
         * readable — UI-40 keeps the honest level beam). */}
        <g transform={`rotate(${signed} 60 12)`}>
          <line x1="16" y1="12" x2="104" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          {/* The needle fixed to the pivot, pointing down — the legible
           * cue the legacy v7 drawing uses. */}
          <line x1="60" y1="12" x2="60" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="12" r="4.5" fill="currentColor" />
        {/* The pans hang plumb from the beam ends: translate only, by the
         * joint's vertical displacement (risePx = endDrop ÷ 2). */}
        <g transform={`translate(0 ${(angleDeg / 10) * 7})`}>
          <line x1="16" y1="12" x2="16" y2="22" stroke="currentColor" strokeWidth="1" />
          <path d="M8 22 H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g transform={`translate(0 ${(-angleDeg / 10) * 7})`}>
          <line x1="104" y1="12" x2="104" y2="22" stroke="currentColor" strokeWidth="1" />
          <path d="M96 22 H112" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
