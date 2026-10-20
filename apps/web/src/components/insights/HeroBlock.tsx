/**
 * HeroBlock — the page's first screen (round-2 Blocks R1/R2/R3/R4 + H5).
 *
 * OWNER DIRECTIVE (2026-10-20, post-v3-merge): "I liked the previous UI
 * more, especially for the world and australia header sections… keep the
 * new data, connections etc. … in the PREVIOUS UI." This file is the
 * PREVIOUS (editorial) hero, restored verbatim from main@1e39a24; the v3
 * UI_SPEC §3 hero (verdict sentence / reading bar / why-3 / what-next /
 * freshness chip) is retired by that directive. The v3 DATA layer stays
 * everywhere: the snapshot's readings (new sources + connections +
 * reliability machinery — state words, delayed tier, sanity gates) feed
 * this hero exactly as they fed the v3 one; the stale/unavailable honesty
 * lives in the header's data-health chip, the on-face card meta and the
 * About section. The v3 hero config helpers (heroSentence/heroWhy/…) stay
 * in config/hero.ts, pinned by their unit tests, for any future use.
 *
 * Top to bottom: the two verdict blocks (GLOBAL first — decision D7, the old
 * Australia-first swap setting is retired), ONE biggest-move CARD (R4 — the
 * line always carries its "unusually large for this indicator" reason; the
 * owner's 11 Oct follow-up puts it back in a proper container), and the
 * what-changed one-liner (H5 — the hero no longer names the next scheduled
 * event; "Next up" lives once, below the indicators, R16).
 *
 * Editorial handoff (2026-10-19, docs/insights/
 * economic-indicators-editorial-spec.md §10): below 768px the two region
 * cards become the mandated GLOBAL-FIRST HORIZONTAL SWIPE CAROUSEL — the
 * same .insights-hero-grid container turns into a native scroll-snap track
 * (index.css), one card per screen, Global first, swipe (or the dots /
 * prev-next control bar above the track) to reach Australia. The DOM order
 * never changes (D7: Global first in every locale), each card keeps its
 * own expand/collapse state while swiped off-screen (both stay mounted),
 * and ≥768px the furniture (cue + dots + buttons) is display:none — the
 * track reverts to the calm tablet stack / the fixed two-column desktop.
 *
 * N2 retired (owner, 2026-10-17): the short disclaimer line + the
 * «درباره این داده‌ها ↧» jump button no longer sit under the hero — the
 * page-bottom About section carries the full text and the global footer
 * already carries the app-wide non-advice disclaimer.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatNumber } from '@currena/core';
import { TrendingUp } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { FlowChevron } from '../icons/FlowChevron';
import { bandWordsOf, bigMovers, changeToneClass, consequenceLine, formatChangeParts } from './config';
import { VerdictBlock, type MarketsAlert, type FxAlert, type SectionIndicatorState } from './VerdictMeter';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** The mobile carousel furniture: a localized swipe cue naming the OTHER
 * card, two position dots, and prev/next buttons (spec §10 — "accessible
 * previous/next controls as a fallback for users who do not use touch
 * gestures"). md:hidden — it exists only where the track scrolls. */
function CarouselControls({
  copy,
  numberLocale,
  labels,
  active,
  onGo,
}: {
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The card labels in DOM order: [Global, Australia]. */
  labels: readonly [string, string];
  active: number;
  onGo: (index: number) => void;
}) {
  const other = labels[active === 0 ? 1 : 0] ?? labels[0]!;
  return (
    <div className="flex items-center justify-between gap-2" data-region-carousel>
      <p className="m-0 flex min-w-0 items-center gap-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
        <span className="truncate">{interpolate(copy.ui.swipeCue, { region: other })}</span>
        <FlowChevron />
      </p>
      <span className="flex shrink-0 items-center gap-2">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onGo(i)}
            aria-label={interpolate(copy.ui.cardPosition, {
              card: label,
              n: num(i + 1, numberLocale),
              m: num(labels.length, numberLocale),
            })}
            aria-current={active === i ? 'true' : 'false'}
            className="insights-focusable flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-opacity hover:opacity-100"
            data-carousel-dot={i}
          >
            {/* The dot: 8px ink mark, aria-hidden — the button's accessible
             * name carries the position; shape+colour signal the active one
             * (never colour alone: aria-current + the enlarged active dot). */}
            <span
              aria-hidden="true"
              className={`block rounded-full transition-all ${
                active === i
                  ? 'h-2.5 w-6 bg-[var(--color-text-primary)]'
                  : 'h-2 w-2 bg-[var(--color-text-primary)]/25'
              }`}
            />
          </button>
        ))}
      </span>
    </div>
  );
}

export function HeroBlock({
  readings,
  changedThisWeek,
  copy,
  numberLocale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
  marketsAlert,
  onJumpMarkets,
  fxAlert,
  onJumpFx,
  sectionIndicators,
}: {
  readings: readonly IndicatorReading[];
  changedThisWeek: readonly { id: IndicatorId; to: string }[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
  /** §5.3 (build step 9): the world-markets signal when raised — joins the
   * GLOBAL verdict's attention module; undefined when calm or unpopulated. */
  marketsAlert?: MarketsAlert;
  /** Scroll to the world-markets section (the alert line's destination). */
  onJumpMarkets?: () => void;
  /** §6.5 (currencies build step 11): the world-currencies signal when
   * raised — joins the same attention module with its pattern names. */
  fxAlert?: FxAlert;
  /** Scroll to the world-currencies section (the alert line's destination). */
  onJumpFx?: () => void;
  /** §6.11/§9.10: the two world sections as separate indicators in the
   * transparent count — each with its own measure label and chip. */
  sectionIndicators?: readonly SectionIndicatorState[];
}) {
  // R4: ONE mover line — |z| ≥ 2 only, stale items already excluded by the
  // engine (stale readings never carry a move score — test below pins it).
  const mover = useMemo(() => bigMovers(readings, 1)[0] ?? null, [readings]);

  // H5: one line — the week's status changes, or the calm quiet-week line.
  const changedLine = useMemo(() => {
    if (changedThisWeek.length === 0) return copy.ui.quietWeekLine;
    const names = changedThisWeek
      .slice(0, 3)
      .map((e) => `${copy.indicators[e.id].name}${e.to === 'warning' ? ' ↑' : ' ↓'}`)
      .join(' · ');
    const suffix = changedThisWeek.length > 3 ? ` +${num(changedThisWeek.length - 3, numberLocale)}` : '';
    return interpolate(copy.ui.whatChangedLine, { changes: `${names}${suffix}` });
  }, [changedThisWeek, copy, numberLocale]);

  const moverEntry = mover ? copy.indicators[mover.id] : null;
  const moverReading = mover ? readings.find((r) => r.id === mover.id) : null;
  // The mover's change in PARTS: the signed number rides its own ltr island;
  // a WORD unit («واحد درصد» / 'pts') rides OUTSIDE as its own element so the
  // RTL line reads «+۰٫۲۵ واحد درصد» and never the scattered
  // «واحد درصد … +۰٫۲۵» the owner reported (2026-10-17).
  const moverChange =
    mover && moverReading
      ? formatChangeParts(mover.change30d, mover.changeKind, numberLocale, copy.units)
      : null;
  const moverTone = mover ? changeToneClass(mover.change30d) : '';

  // §10 mobile carousel: the track element + which card rests at the
  // reading edge (0 = Global — the D7 DOM order guarantees Global is the
  // first card, so the carousel OPENS on Global in every locale). The
  // index is measured, never assumed: the "closest card edge to the
  // scroll origin" comparison is sign-agnostic, so RTL's negative
  // scrollLeft (Chrome/Edge) and positive-descending variants (older
  // Safari/Firefox) both resolve to the same visible card.
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const labels = useMemo<readonly [string, string]>(
    () => [copy.sections.global, copy.sections.australia],
    [copy.sections.global, copy.sections.australia],
  );

  const onTrackScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as unknown as readonly HTMLElement[];
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < kids.length; i++) {
      const d = Math.abs(kids[i]!.offsetLeft - el.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setActiveCard(best);
  }, []);

  const goToCard = useCallback((index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const kids = Array.from(el.children) as unknown as readonly HTMLElement[];
    const target = kids[index];
    if (!target) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: target.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    setActiveCard(index);
  }, []);

  // §10 keyboard: ArrowLeft/ArrowRight on the cue line step along the
  // READING direction (in RTL the visual arrows invert — Left means
  // "forward"), Home/End jump to the first/last card. The buttons remain
  // the always-available control; this only adds the shortcut where the
  // furniture already sits.
  const onCarouselKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const rtl = document.documentElement.dir === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward && activeCard < labels.length - 1) {
        e.preventDefault();
        goToCard(activeCard + 1);
      } else if (e.key === back && activeCard > 0) {
        e.preventDefault();
        goToCard(activeCard - 1);
      } else if (e.key === 'Home' && activeCard !== 0) {
        e.preventDefault();
        goToCard(0);
      } else if (e.key === 'End' && activeCard !== labels.length - 1) {
        e.preventDefault();
        goToCard(labels.length - 1);
      }
    },
    [activeCard, goToCard, labels.length],
  );

  return (
    <section aria-label={copy.ui.heroTitle} className="m-0">
      <h2 className="sr-only">{copy.ui.heroTitle}</h2>
      {/* R30: items-STRETCH (was items-start) — the two verdict cards share
       * one height, so the shorter one carries no floating void beside the
       * taller one (the roast: "a void under Australia").
       *
       * Real spec (economic-indicators-ui-spec.md §5, 2026-10-17): the
       * two-column hero turns on only at lg (1024px) — below that, two
       * columns would make each card narrower than the spec's ~420px
       * minimum. Editorial handoff (§10): <768px the container is the
       * swipeable single-card track (index.css media query); 768–1023px
       * stays the calm one-column stack. Gap 12px on the mobile track →
       * 16px stacked (md) → 24px at the two-column desktop.
       *
       * Real spec §5 + §8: at >=1024px the cards keep FIXED locations in
       * BOTH locales — Global on the right, Australia on the left (matching
       * both supplied references; intentional content priority, NOT
       * mirrored by direction). index.css drives that via
       * .insights-hero-grid [data-region-card] order rules; the DOM keeps
       * D7's Global-first order so the mobile carousel AND the stacked
       * tablet reading order stay Global → Australia in every locale. */}
      {/* §10: the cue + dots + prev/next — the carousel's control bar,
       * rendered ABOVE the track (mobile only, md:hidden): a card is taller
       * than a phone screen, so a below-the-track affordance would sit under
       * the fold and never be seen; here it rides with the page header and
       * the first thing the reader meets is the card + its swipe cue
       * together. Prev/next are real buttons so keyboard/touch users without
       * swipe gestures still change cards; the words are direction-neutral
       * ("Previous"/"Next") whose meaning follows the reading direction. */}
      <div onKeyDown={onCarouselKey} className="mb-2.5 md:hidden">
        <CarouselControls
          copy={copy}
          numberLocale={numberLocale}
          labels={labels}
          active={activeCard}
          onGo={goToCard}
        />
        <div className="mt-1 flex items-center justify-center gap-2" data-carousel-buttons>
          <button
            type="button"
            onClick={() => goToCard(Math.max(0, activeCard - 1))}
            disabled={activeCard === 0}
            className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-currena-muted/15 px-4 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25 disabled:cursor-default disabled:opacity-40"
          >
            {/* Mirrors with the reading flow (RTL = visually points the
             * other way) — the shared flow glyph, flipped. */}
            <FlowChevron className="rotate-180" />
            {copy.ui.prevCard}
          </button>
          <button
            type="button"
            onClick={() => goToCard(Math.min(labels.length - 1, activeCard + 1))}
            disabled={activeCard === labels.length - 1}
            className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-currena-muted/15 px-4 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25 disabled:cursor-default disabled:opacity-40"
          >
            {copy.ui.nextCard}
            <FlowChevron />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="insights-hero-grid grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6"
        data-region-track
        aria-label={copy.ui.carouselLabel}
      >
        {/* D7/R1: Global first, always — the blocks array is fixed order. The
         * world-markets alert (when raised) lives in the GLOBAL block: world
         * stock markets are a global question (§5.3). role=group + the
         * "n of m" label lets screen readers announce the carousel position
         * (spec §10) without duplicating the card's own heading. */}
        <div data-region-card="global" role="group" aria-label={interpolate(copy.ui.cardPosition, { card: labels[0], n: num(1, numberLocale), m: num(2, numberLocale) })}>
          <VerdictBlock
            section="global"
            sectionLabel={copy.sections.global}
            readings={readings}
            copy={copy}
            numberLocale={numberLocale}
            onJumpSection={onJumpSection}
            onJumpAbout={onJumpAbout}
            onFocusCard={onFocusCard}
            marketsAlert={marketsAlert}
            onJumpMarkets={onJumpMarkets}
            fxAlert={fxAlert}
            onJumpFx={onJumpFx}
            sectionIndicators={sectionIndicators}
          />
        </div>
        <div data-region-card="australia" role="group" aria-label={interpolate(copy.ui.cardPosition, { card: labels[1], n: num(2, numberLocale), m: num(2, numberLocale) })}>
          <VerdictBlock
            section="australia"
            sectionLabel={copy.sections.australia}
            readings={readings}
            copy={copy}
            numberLocale={numberLocale}
            onJumpSection={onJumpSection}
            onJumpAbout={onJumpAbout}
            onFocusCard={onFocusCard}
          />
        </div>
      </div>

      {/* R4 → owner follow-up (11 Oct) → round 24 (roast #7) → grayscale
       * redesign (spec §8): the biggest move keeps its place as the page's
       * focal moment, but the emphasis now comes from TYPOGRAPHY (the big
       * signed number) on a standard neutral card — the gold ring and gold
       * kicker icon are retired. The signed number keeps its own ltr island;
       * the WORD unit (fa «واحد درصد») rides OUTSIDE the island as its own
       * span so the RTL line never scatters it (2026-10-17 owner glitch
       * report). The value speaks the owner's sign inks: positive green,
       * negative red. */}
      {mover && moverReading && moverEntry ? (
        <div
          className="mt-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3 ring-1 ring-[var(--color-border)]"
          data-biggest-move
        >
          <p className="m-0 mb-1 flex items-center gap-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            <TrendingUp aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-secondary)]" />
            {copy.ui.bigMoverTitle}
          </p>
          <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
            <button
              type="button"
              onClick={() => onFocusCard(mover.id)}
              className="insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 font-bold text-[var(--color-text-primary)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:decoration-[var(--color-text-secondary)]"
            >
              {moverEntry.name}
            </button>
            <bdi dir="ltr" className={`type-number shrink-0 font-bold tabular-nums ${moverTone || 'text-[var(--color-text-primary)]'}`}>
              {moverChange!.value}
            </bdi>
            {moverChange!.unit !== null ? (
              <span className="shrink-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
                {moverChange!.unit}
              </span>
            ) : null}
            <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{copy.ui.days30}</span>
            <span>{copy.ui.bigMoverReason}</span>
            <span className="sr-only">{consequenceLine(moverReading, moverEntry, false, bandWordsOf(copy))}</span>
          </p>
        </div>
      ) : null}

      {/* H5: what changed — one line under the hero (or the calm line). */}
      <p className="mt-3 mb-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{changedLine}</bdi>
      </p>

      {/* N2 retired (owner, 2026-10-17): the short disclaimer + the
       * about-jump button no longer live under the hero. The full text is
       * the page-bottom About section; the global footer carries the
       * app-wide non-advice disclaimer. */}
    </section>
  );
}
