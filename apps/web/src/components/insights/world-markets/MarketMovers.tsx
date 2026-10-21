/**
 * world-markets/MarketMovers — the two featured market movers
 * (02-ui-spec §3.4, the 2026-10-18 world-indices handoff round):
 * «بیشترین رشد» and «بیشترین افت» over the SELECTED period.
 *
 * Data truth (briefing.topMovers): true extrema of the RAW values —
 * rows without a reading for the lens are never ranked (never as zero),
 * and with no valid values the card shows the honest empty state, never
 * a fake winner. The distance from the 52-week high rides as secondary
 * context (status word + tone, exactly like the tiles), and the small
 * period caption keeps the ranking unambiguous when the cards sit above
 * the period control on mobile (§5's suggested order).
 *
 * The direction valence: the gainer card wears the success ink and the
 * decliner the alert ink, but the SIGNED PERCENTAGE and the arrow glyph
 * carry the meaning — colour is never alone (§6.8 / 02-ui-spec §9).
 */

import type { MarketEntry } from '@currena/core';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { MarketLogo } from './MarketLogo';
import { topMovers, periodValueOf } from './briefing';
import {
  DirTriangle,
  periodWord,
  returnToneClass,
  signOf,
  signedPct,
  statusToneOf,
  statusWordKeyOf,
  type MarketsView,
} from './shared';

/* ------------------------------------------------------------------ *
 * One mover card
 * ------------------------------------------------------------------ */

function MoverCard({
  entry,
  title,
  toneClass,
  copy,
  locale,
  numberLocale,
  view,
}: {
  entry: MarketEntry;
  /** «بیشترین رشد» / «بیشترین افت» — the card's own label. */
  title: string;
  /** The valence ink (success for the gain, alert for the fall). */
  toneClass: string;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  view: MarketsView;
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const pct = periodValueOf(entry, view);
  // 2026-10-27: sign-based bright ink + triangle (see shared.signOf).
  const dir = signOf(pct);
  // The 52-week distance as quiet secondary context (§3.4): the same
  // status word + tone family every other surface wears.
  const atHigh = entry.fromHigh > -0.5;
  const period = periodWord(view, copy);
  // §9: the screen reader hears name, country, period, value — and
  // whether the value is missing (noReadingAria) — in one sentence.
  const aria = interpolate(copy.markets.heatmapValueAria, {
    name: marketCopy.name,
    country: marketCopy.country,
    value: pct === null ? copy.markets.noReadingAria : signedPct(pct, numberLocale, locale),
    period,
  });
  return (
    <article
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
      aria-label={aria}
    >
      {/* The card's own role label wears the calm valence ink (the value's
       * ink follows the NUMBER's own direction — see the hero line below). */}
      <p className={`m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide ${toneClass}`}>
        {title}
      </p>
      <div className="flex min-w-0 items-center gap-3">
        {/* 2026-10-18 owner follow-up ("at least 96×96 px"): the featured
         * mover wordmark renders at 96px (112 on desktop) — the cards are
         * half/full-width, so the horizontal identity row keeps its room. */}
        <MarketLogo id={entry.id} latin={marketCopy.latin} size={96} desktopSize={112} />
        <span className="min-w-0 flex-1">
          {/* The canonical index name leads; the Latin name rides beside it
           * in Farsi (§6.7) and the country/market is the secondary line. */}
          <span className="block truncate text-[1rem] font-bold leading-snug text-[var(--color-text-primary)]">
            {marketCopy.name}
            {locale === 'fa' ? (
              <span lang="en" dir="ltr" className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
                {marketCopy.latin}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {marketCopy.country}
          </span>
        </span>
      </div>
      {/* The selected-period signed return — the card's hero number, in
       * the 2026-10-27 owner round's BRIGHT return ink with the crisp
       * triangle ("write the positive indexes with more clear and bright
       * green … a triangle showing up for green, and do the same for red,
       * down and brighter red") — the ink follows the number's own SIGN.
       * A missing lens reading renders the honest dash (never a fake 0).
       * The gainer/decliner VALENCE stays on the card's title label above
       * — a decliner card can still carry a bright green weekly number
       * when that week rose. */}
      <p className={`m-0 inline-flex items-center gap-1.5 text-[length:var(--type-number)] font-bold leading-none ${
        dir === 'flat' ? 'text-[var(--color-text-primary)]' : returnToneClass(dir)
      }`}>
        <bdi dir="ltr" className="type-number tabular-nums">
          {pct === null ? '—' : signedPct(pct, numberLocale, locale)}
        </bdi>
        {pct === null ? null : <DirTriangle dir={dir} size={14} />}
      </p>
      {/* The quiet secondary line: the distance from the 52-week high —
       * a SEPARATE metric, never the period's return (§3.3). The signed
       * value and the status word chip say it once, cleanly. */}
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <span>{copy.markets.thFromHigh}:</span>
        <bdi dir="ltr" className="font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {signedPct(entry.fromHigh, numberLocale, locale)}
        </bdi>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${atHigh ? 'bg-currena-success/10 text-[var(--color-status-normal)]' : statusToneOf(entry.fromHigh)}`}>
          {atHigh ? copy.markets.atHighTag : copy.markets[statusWordKeyOf(entry.fromHigh)]}
        </span>
      </p>
      {/* The small explanatory period caption (§3.4) — the ranking stays
       * unambiguous even above the period control on mobile. */}
      <p className="m-0 text-[0.68rem] font-semibold text-[var(--color-text-tertiary)]">
        <bdi>{interpolate(copy.markets.moverPeriodLabel, { period })}</bdi>
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The pair
 * ------------------------------------------------------------------ */

export function MarketMovers({
  markets,
  view,
  copy,
  locale,
  numberLocale,
}: {
  markets: readonly MarketEntry[];
  view: MarketsView;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const { gainer, decliner } = topMovers(markets, view);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
      {gainer !== null ? (
        <MoverCard
          entry={gainer}
          title={copy.markets.moverGain}
          toneClass="text-[var(--color-status-normal)]"
          copy={copy}
          locale={locale}
          numberLocale={numberLocale}
          view={view}
        />
      ) : (
        <MoverEmpty copy={copy} title={copy.markets.moverGain} />
      )}
      {decliner !== null ? (
        <MoverCard
          entry={decliner}
          title={copy.markets.moverLoss}
          toneClass="text-[var(--color-status-alert)]"
          copy={copy}
          locale={locale}
          numberLocale={numberLocale}
          view={view}
        />
      ) : (
        <MoverEmpty copy={copy} title={copy.markets.moverLoss} />
      )}
    </div>
  );
}

/** §3.4's honest empty state — no valid values, no fake winner. */
function MoverEmpty({ copy, title }: { copy: InsightsCopy; title: string }) {
  return (
    <article className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-4">
      <p className="m-0 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {title}
      </p>
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {copy.markets.moversNone}
      </p>
    </article>
  );
}
