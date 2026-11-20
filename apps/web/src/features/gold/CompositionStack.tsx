/**
 * CompositionStack — the hero's conditions block (GUX-S5 M3, 11 §5 /
 * S4-D5): the DUP-2 fix. The balance + the five lanes become ONE
 * explanatory unit, five layers deep:
 *
 *   ① the CONDITIONS header + the verdict word — said ONCE (type-verdict;
 *      the lanes never repeat it — their state words are lane-scoped)
 *   ② the instrument — the page's ONLY full instrument: the brass
 *      GoldBalanceClassic at briefing tier (≥ lg); below lg the
 *      BeamGlyph compact + "inspect the instrument" (the brass mounts
 *      on tap — 11 §12.1, never rendered by default on small screens)
 *   ③ the five LaneBars — the ONE lane renderer, the addends that
 *      explain the beam's tilt (redundant encodings by design at
 *      different fidelities: the tilt is the sum, the bars the parts)
 *   ④ the ledger affordance — "inspect all 37 voters", the anchor to
 *      the five-force overview's per-lane member lists (the only
 *      interactive layer besides the instrument's own weight drill-ins)
 *   ⑤ the honesty line — the not-a-forecast caveat, at every fidelity
 *      (master plan §3.7: a tilted beam reads as a prediction if
 *      unlabeled)
 *
 * What this replaces (the 11 §5.4 dedup ledger, executed at the M3
 * wiring): the hero's verdict-word + outlook-line + scale jumble (F-08)
 * — the verdict word survives here as ①; the outlook line's fate is
 * Q1's (it renders inside the BriefingCard's summary spine until the
 * owner answers); the second full BalanceScale in Signals retires at
 * the M5 wiring.
 */

import { useState } from 'react';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import type { GoldHeroModel, GoldHeroVerdictState } from './gold-tiles';
import { goldHeroTilt } from './gold-tiles';
import { GoldBalanceClassic } from './GoldBalanceClassic';
import { BeamGlyph } from './BeamGlyph';
import { LaneBar, laneBarDataOf } from './LaneBar';

const VERDICT_WORD_KEY: Readonly<Record<GoldHeroVerdictState, TranslationKey>> = {
  for: 'pd.gold.heroVerdictFor',
  balanced: 'pd.gold.heroVerdictBalanced',
  against: 'pd.gold.heroVerdictAgainst',
  none: 'pd.gold.heroVerdictNone',
  'not-enough': 'pd.gold.heroNotEnough',
};

const VERDICT_TONE: Readonly<Record<string, string>> = {
  for: 'text-[var(--color-status-normal)]',
  balanced: 'text-[var(--color-text-secondary)]',
  against: 'text-[var(--color-status-alert)]',
  none: 'text-[var(--color-text-tertiary)]',
  'not-enough': 'text-[var(--color-text-tertiary)]',
};

export function CompositionStack({
  hero,
  verdictState,
  verdictWord,
  className = '',
}: {
  hero: GoldHeroModel;
  /** goldHeroVerdictState(hero) — passed by the caller (pure helpers). */
  verdictState: GoldHeroVerdictState;
  /** The caller-composed verdict word (already localized). */
  verdictWord: string;
  className?: string;
}): React.JSX.Element {
  const { t } = useI18n();
  // The house viewport convention (GoldCorrelation's 390 rule): a
  // session-only matchMedia read — in the lazy initializer (no
  // first-paint flash of the heavy brass on small screens), no resize
  // listener. SSR/jasmine-safe: absent matchMedia defaults to desktop.
  const [desktop] = useState(() => {
    try {
      return (
        typeof window === 'undefined' ||
        typeof window.matchMedia !== 'function' ||
        window.matchMedia('(min-width: 1024px)').matches === true
      );
    } catch {
      return true;
    }
  });
  const [brassOpen, setBrassOpen] = useState(false);

  const tilt = goldHeroTilt(hero);

  return (
    <section
      aria-label={t('pd.gold.conditionsHeading')}
      data-composition-stack
      className={`flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-5 ${className}`}
    >
      {/* ① the verdict, said once */}
      <header className="flex flex-col gap-0.5">
        <p className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t('pd.gold.conditionsHeading')}
        </p>
        <h3 className={`type-verdict m-0 font-bold ${VERDICT_TONE[verdictState] ?? ''}`} data-stack-verdict={verdictState}>
          {verdictWord}
        </h3>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
          {t('pd.gold.conditionsSubheading')}
        </p>
      </header>

      {/* ② the instrument — the page's only full one; the BeamGlyph
          composes its own gauge aria sentence (the shipped rule) */}
      {desktop || brassOpen ? (
        <GoldBalanceClassic hero={hero} />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <BeamGlyph angleDeg={tilt.angleDeg} heavy={tilt.heavy} />
          <button
            type="button"
            data-stack-inspect-instrument
            aria-expanded={brassOpen}
            onClick={() => setBrassOpen(true)}
            className="insights-focusable min-h-[44px] rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
          >
            {t('pd.gold.stackInspectInstrument')}
          </button>
        </div>
      )}

      {/* ③ the five addends */}
      <div className="flex flex-col gap-2.5" data-stack-lanebars>
        {hero.balance.lanes.map((lane) => (
          <LaneBar key={lane.lane} data={laneBarDataOf(lane)} />
        ))}
      </div>

      {/* ④ the ledger affordance */}
      <a
        href="#gold-seats"
        data-stack-ledger-link
        className="insights-focusable self-start rounded-full px-1 py-0.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] underline decoration-dotted underline-offset-4"
      >
        {t('pd.gold.stackLedgerLink')}
      </a>

      {/* ⑤ the honesty line, at every fidelity */}
      <p className="m-0 border-t border-[var(--color-border)] pt-2 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        {t('pd.global.outlookCaveat')}
      </p>
    </section>
  );
}
