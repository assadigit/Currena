/**
 * GoldCbDemand — GPE R14 / F2a Tier-1 (2026-11-18): the central-bank
 * demand section, Zone K (docs/specs/gold-page-elevation: s7/01 §6 the
 * section-of-record design · s6/01 §2b the placement + display-only
 * governance · s6/02 C6 the IMF attribution row + C7 rule 3 · s6/03
 * zone K the 390 rules · s8/01 R14).
 *
 * THE DATA (the TIC pattern): ONE key (insights:gold-cb:v1) served at
 * GET /api/insights/gold-cb — the rolling-12m reported-world series +
 * the top buyers + the reported-world stock. Last-good localStorage
 * paint, calm fail-closed states, staleness carried by the data (the
 * asOf month renders).
 *
 * THE SECTION (s7/01 §6, binding): the tracker chart (the rolling-12m
 * line, the three dated episode annotations, the current pace) + the
 * buyers table (latest month + 12m sum + holdings + the
 * share-of-reserves column) + the honest exceptions (the not-a-floor
 * caveat standing, the revision line, China's reporting pattern, the
 * reported-world total labelled, the display-only governance sentence
 * once in the method block) + the mirror-framing cross-link to the
 * usd-reserve-share seat (both name their object + sign convention).
 *
 * THE SHARE COLUMN (the S12-D1 method): gold re-valued at the LIVE
 * market price over total official reserve assets with gold re-valued
 * at the same price — computed at render from the page's own gold-usd
 * reading (named + dated), never baked into the stored payload; a
 * rising share can be price arithmetic (C7 rule 3 — the note renders
 * with the table); a value vintage older than the trailing 6 quarters
 * renders the dash (fail-closed, mixed vintages never blend).
 *
 * DISPLAY-ONLY (s6/01 §2b): no meter membership, no voter — the
 * governance sentence says so once.
 */

import { useEffect, useMemo, useState } from 'react';
import type { GoldCbBuyer, GoldCbSnapshot, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { navigate } from '../../router';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { stageAnchorScroll } from '../../shared/lib/anchor-scroll';
import { fetchGoldCbSnapshot, readCachedGoldCb } from './gold-cb';
import { GOLD_SEAT_DEST_NAME_KEY, seatAnchorHref } from './gold-tiles';

type NumberLocale = 'en-US' | 'fa-IR';

/** The buyers-table country names (the IMF codes the current cast can
 * print; an unmapped code renders the code itself — technical, never a
 * guessed name). FA names ride the dictionary (manifest-gated). */
const CB_COUNTRY_KEY: Readonly<Record<string, TranslationKey>> = {
  POL: 'pd.gold.cbCountries.POL',
  CHN: 'pd.gold.cbCountries.CHN',
  UZB: 'pd.gold.cbCountries.UZB',
  KAZ: 'pd.gold.cbCountries.KAZ',
  CZE: 'pd.gold.cbCountries.CZE',
  BRA: 'pd.gold.cbCountries.BRA',
  MYS: 'pd.gold.cbCountries.MYS',
  JOR: 'pd.gold.cbCountries.JOR',
  AUS: 'pd.gold.cbCountries.AUS',
  KGZ: 'pd.gold.cbCountries.KGZ',
  SRB: 'pd.gold.cbCountries.SRB',
  KHM: 'pd.gold.cbCountries.KHM',
  IDN: 'pd.gold.cbCountries.IDN',
  EZB: 'pd.gold.cbCountries.EZB',
  GEO: 'pd.gold.cbCountries.GEO',
  GTM: 'pd.gold.cbCountries.GTM',
  PHL: 'pd.gold.cbCountries.PHL',
  EGY: 'pd.gold.cbCountries.EGY',
  IRQ: 'pd.gold.cbCountries.IRQ',
  IND: 'pd.gold.cbCountries.IND',
  TUR: 'pd.gold.cbCountries.TUR',
  QAT: 'pd.gold.cbCountries.QAT',
  RUS: 'pd.gold.cbCountries.RUS',
  ARE: 'pd.gold.cbCountries.ARE',
  ARM: 'pd.gold.cbCountries.ARM',
  SGP: 'pd.gold.cbCountries.SGP',
  IRL: 'pd.gold.cbCountries.IRL',
};

/** The dated episode annotations (s7/01 §6 item 1 — the data-true set,
 * the S12-D5 record: the reported-world series shows no 2014-18
 * selling→buying flip; the flip was 2008→09 inside the GFC wave's own
 * window, and 2015's step is China's catch-up print). Each carries its
 * anchor month + a label key; the marker renders the dated fact. */
const EPISODES: readonly { month: string; labelKey: TranslationKey }[] = [
  { month: '2009-06', labelKey: 'pd.gold.cbEpGfc' },
  { month: '2015-07', labelKey: 'pd.gold.cbEpCatchup' },
  { month: '2022-03', labelKey: 'pd.gold.cbEpRotation' },
];

/** The month label ("2026-10" → "Oct 2026" / the fa short form). */
function monthLabel(month: string, locale: 'en' | 'fa'): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** The chart geometry + the SVG path (pure). */
interface ChartModel {
  width: number;
  height: number;
  path: string;
  areaPath: string;
  points: Array<{ x: number; y: number; month: string; tonnes: number }>;
  yMin: number;
  yMax: number;
  yZero: number;
  xOf: (month: string) => number;
}

function monthIndex(month: string): number {
  return (Number(month.slice(0, 4)) - 2000) * 12 + Number(month.slice(5, 7));
}

function buildChartModel(series: readonly { month: string; tonnes: number }[]): ChartModel {
  const width = 640;
  const height = 190;
  const padL = 8;
  const padR = 62; // the current-pace label's room
  const padT = 26; // the annotation labels' room
  const padB = 18;
  const first = monthIndex(series[0]!.month);
  const last = monthIndex(series[series.length - 1]!.month);
  const values = series.map((p) => p.tonnes);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values);
  const yMin = rawMin - (rawMax - rawMin) * 0.08;
  const yMax = rawMax + (rawMax - rawMin) * 0.14;
  const xOf = (month: string): number => padL + ((monthIndex(month) - first) / Math.max(1, last - first)) * (width - padL - padR);
  const yOf = (v: number): number => padT + (1 - (v - yMin) / (yMax - yMin)) * (height - padT - padB);
  const points = series.map((p) => ({ x: xOf(p.month), y: yOf(p.tonnes), month: p.month, tonnes: p.tonnes }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const yZero = yOf(0);
  const firstP = points[0]!;
  const lastP = points[points.length - 1]!;
  const areaPath = `${path} L${lastP.x.toFixed(1)},${yZero.toFixed(1)} L${firstP.x.toFixed(1)},${yZero.toFixed(1)} Z`;
  return { width, height, path, areaPath, points, yMin, yMax, yZero, xOf };
}

/** The tracker chart: the rolling line + the zero axis + the dated
 * annotations + the current pace. Hand-rolled SVG (the page's chart
 * grammar — no chart library in the gold chunk). */
function CbChart({ snapshot }: { snapshot: GoldCbSnapshot }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const model = useMemo(() => buildChartModel(snapshot.series), [snapshot.series]);
  const last = snapshot.series[snapshot.series.length - 1]!;
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-1" data-cb-chart>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
        <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.cbChartTitle')}</span>
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{t('pd.gold.cbChartReportedWorld')}</bdi>
        </span>
      </figcaption>
      <div dir="ltr" className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${model.width} ${model.height}`}
          role="img"
          aria-label={`${t('pd.gold.cbChartTitle')} — ${t('pd.gold.cbChartReportedWorld')}`}
          className="h-auto w-full"
          data-cb-series-count={snapshot.series.length}
        >
          {/* The zero axis (the selling era prints below it). */}
          <line x1={4} y1={model.yZero} x2={model.width - 56} y2={model.yZero} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 4" />
          <text x={model.width - 54} y={model.yZero + 3.5} fontSize={10} fill="var(--color-text-tertiary)">0</text>
          {/* The area fill (signed — fills to the zero line). */}
          <path d={model.areaPath} fill="var(--color-accent-gold)" opacity={0.13} />
          {/* The rolling line. */}
          <path d={model.path} fill="none" stroke="var(--color-accent-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" data-cb-line />
          {/* The dated episode annotations: a thin rule + the label at
           * alternating heights (the dated-fact encoding, s7/03 §4.1 —
           * the F6 episode records land at P3; the link rides that row). */}
          {EPISODES.map((ep, i) => {
            const x = model.xOf(ep.month);
            if (x <= 4 || x >= model.width - 56) return null; // outside the drawn window — never invented
            const y = i % 2 === 0 ? 10 : 22;
            return (
              <g key={ep.month} data-cb-episode={ep.month}>
                <line x1={x} y1={y + 3} x2={x} y2={model.height - 12} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.5} />
                <text x={x + 3} y={y} fontSize={9.5} fill="var(--color-text-tertiary)">
                  {t(ep.labelKey)}
                </text>
              </g>
            );
          })}
          {/* The current pace: the end dot + the value. */}
          <circle cx={model.points[model.points.length - 1]!.x} cy={model.points[model.points.length - 1]!.y} r={3.2} fill="var(--color-accent-gold)" stroke="var(--color-surface)" strokeWidth={1.2} />
          <text
            x={Math.min(model.points[model.points.length - 1]!.x + 6, model.width - 52)}
            y={model.points[model.points.length - 1]!.y + 3.5}
            fontSize={11}
            fontWeight={700}
            fill="var(--color-text-primary)"
            data-cb-current-pace
          >
            {num(last.tonnes)}
          </text>
          {/* The window's own labels: the first + last year. */}
          <text x={4} y={model.height - 4} fontSize={10} fill="var(--color-text-tertiary)">{snapshot.series[0]!.month.slice(0, 4)}</text>
          <text x={model.width - 56} y={model.height - 4} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="end">{last.month.slice(0, 4)}</text>
        </svg>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <bdi>{interpolate(t('pd.gold.cbAsOf'), { month: monthLabel(snapshot.asOf, locale) })}</bdi>
        <span aria-hidden="true"> · </span>
        <span>{t('pd.gold.cbChartUnit')}</span>
      </p>
    </figure>
  );
}

/** The S12-D1 share: gold at the live price over total reserves with
 * gold re-valued at the same price; fail-closed on missing inputs and
 * stale value vintages (> 6 quarters behind the data month). */
function buyerSharePct(buyer: GoldCbBuyer, goldPriceUsd: number | null, asOf: string): number | null {
  if (goldPriceUsd === null || goldPriceUsd <= 0) return null;
  if (buyer.goldUsd === undefined || buyer.totalUsd === undefined || buyer.valuePeriod === undefined) return null;
  // The vintage bound: the value quarter must sit within the trailing 6
  // quarters of the data month (a mixed-vintage share never renders).
  const [vy, vq] = [Number(buyer.valuePeriod.slice(0, 4)), Number(buyer.valuePeriod.slice(6, 7))];
  const [ay, am] = [Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7))];
  const valueQuarterEnd = vy * 4 + vq;
  const dataQuarter = ay * 4 + Math.ceil(am / 3);
  if (dataQuarter - valueQuarterEnd > 6) return null;
  if (buyer.totalUsd <= buyer.goldUsd) return null; // a broken value pair
  const ozt = (buyer.tonnes * 1e6) / 31.1034768;
  const goldAtMarket = ozt * goldPriceUsd;
  const denominator = buyer.totalUsd - buyer.goldUsd + goldAtMarket;
  if (denominator <= 0) return null;
  return (goldAtMarket / denominator) * 100;
}

/** One buyers-table row (the desktop table row + the mobile stacked
 * row render from the same model). */
function BuyerRow({
  buyer,
  share,
  numberLocale,
  locale,
  t,
  mobile,
}: {
  buyer: GoldCbBuyer;
  share: number | null;
  numberLocale: NumberLocale;
  locale: 'en' | 'fa';
  t: ReturnType<typeof useI18n>['t'];
  mobile: boolean;
}): React.JSX.Element {
  const name = CB_COUNTRY_KEY[buyer.code] !== undefined ? t(CB_COUNTRY_KEY[buyer.code]!) : buyer.code;
  const num = (v: number, decimals = 1): string => formatNumber(v, numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const latest = `${buyer.latestDelta >= 0 ? '+' : '−'}${num(Math.abs(buyer.latestDelta))}`;
  const sum12m = `${buyer.sum12m >= 0 ? '+' : '−'}${num(Math.abs(buyer.sum12m))}`;
  const shareText = share !== null ? interpolate(t('pd.gold.cbSharePct'), { v: num(share) }) : '—';
  if (mobile) {
    return (
      <li className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60" data-cb-buyer={buyer.code}>
        <div className="flex min-w-0 items-baseline justify-between gap-2.5">
          <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{name}</span>
          <span className="text-[length:var(--type-caption)] font-bold tabular-nums text-[var(--color-text-secondary)]">{sum12m}</span>
        </div>
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{interpolate(t('pd.gold.cbTonnesShort'), { v: num(buyer.tonnes) })}</bdi>
          <span aria-hidden="true"> · </span>
          <span>{monthLabel(buyer.latestMonth, locale)} {latest}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-semibold">{shareText}</span>
        </p>
      </li>
    );
  }
  return (
    <tr data-cb-buyer={buyer.code}>
      <th scope="row" className="px-1.5 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">{name}</th>
      <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">
        <span>{monthLabel(buyer.latestMonth, locale)}</span>{' '}
        <span className={buyer.latestDelta >= 0 ? 'text-[var(--color-return-up)]' : 'text-[var(--color-return-down)]'}>{latest}</span>
      </td>
      <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">{sum12m}</td>
      <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">{num(buyer.tonnes)}</td>
      <td className="px-1.5 py-1.5 text-end font-semibold tabular-nums text-[var(--color-text-secondary)]" data-cb-share>{shareText}</td>
    </tr>
  );
}

export function GoldCbDemand({ price }: { price: IndicatorReading | undefined }): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const [snapshot, setSnapshot] = useState<GoldCbSnapshot | null>(() => {
    try {
      return readCachedGoldCb();
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    void fetchGoldCbSnapshot().then((s) => {
      if (settled) return;
      settled = true;
      setLoading(false);
      if (s !== null) setSnapshot(s);
    });
    // A hanging fetch (not a failed one — those resolve null instantly)
    // resolves the loading state after the bounded wait: the last-good
    // copy stays, or the calm unavailable line renders — never a
    // permanent spinner.
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    }, 2500);
    return () => {
      settled = true;
      clearTimeout(timer);
    };
  }, []);

  // The live price for the share column (the S12-D1 method — the
  // reading's own value, its as-of named beside it in the share note).
  const goldPriceUsd = price !== undefined && price.value !== null && Number.isFinite(price.value) ? price.value : null;

  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  // The mirror-framing cross-link (s6/01 §2b): the seat's own anchor +
  // its own name (R10's contract), both naming their sign convention.
  const mirrorHref = seatAnchorHref({ id: 'usd-reserve-share', homePage: 'currencies' });
  const mirrorName = t(GOLD_SEAT_DEST_NAME_KEY['usd-reserve-share']);

  return (
    <section
      id="gold-zone-k"
      aria-labelledby="gold-zone-k-title"
      data-gold-cb-demand
      className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] scroll-mt-24 sm:p-3.5"
    >
      <header className="flex min-w-0 flex-col gap-0.5">
        <h3 id="gold-zone-k-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {t('pd.gold.cbTitle')}
        </h3>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">{t('pd.gold.cbSubtitle')}</p>
      </header>

      {snapshot !== null ? (
        <>
          <CbChart snapshot={snapshot} />

          {/* The buyers table: the table from sm; the top-5 stacked rows
           * below (s6/03 zone K — right-aligned tonnes, the share the
           * muted secondary). */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">{t('pd.gold.cbBuyersTitle')}</h4>
            <table className="m-0 hidden w-full border-collapse text-[length:var(--type-caption)] sm:table" data-cb-buyers-table>
              <thead>
                <tr className="text-[var(--color-text-tertiary)]">
                  <th scope="col" className="px-1.5 py-1 text-start font-semibold">{t('pd.gold.cbBuyersHeadCountry')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.cbBuyersHeadLatest')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.cbBuyersHead12m')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.cbBuyersHeadHoldings')}</th>
                  <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t('pd.gold.cbBuyersHeadShare')}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.buyers.map((buyer) => (
                  <BuyerRow
                    key={buyer.code}
                    buyer={buyer}
                    share={buyerSharePct(buyer, goldPriceUsd, snapshot.asOf)}
                    numberLocale={numberLocale}
                    locale={locale}
                    t={t}
                    mobile={false}
                  />
                ))}
              </tbody>
            </table>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 sm:hidden">
              {snapshot.buyers.slice(0, 5).map((buyer) => (
                <BuyerRow
                  key={buyer.code}
                  buyer={buyer}
                  share={buyerSharePct(buyer, goldPriceUsd, snapshot.asOf)}
                  numberLocale={numberLocale}
                  locale={locale}
                  t={t}
                  mobile
                />
              ))}
            </ul>
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
              <bdi>{t('pd.gold.cbShareNote')}</bdi>
            </p>
          </div>

          {/* The honest exceptions (s7/01 §6, binding): the standing
           * caveat, the reported-world line, the revision + China notes. */}
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-1.5 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-cb-caveat>
            <bdi>{t('pd.gold.cbCaveat')}</bdi>
          </p>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{interpolate(t('pd.gold.cbReportedWorldLine'), { tonnes: num(snapshot.reportedWorld.tonnes), n: num(snapshot.reportedWorld.reporters) })}</bdi>
          </p>

          {/* The method block (C6's IMF row + the governance sentence
           * once + the WGC cross-reference + the mirror cross-link). */}
          <details className="rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-cb-method>
            <summary className="insights-focusable min-h-[44px] cursor-pointer font-semibold text-currena-blue underline-offset-2 hover:underline">{t('pd.gold.cbMethodTitle')}</summary>
            <div className="flex flex-col gap-1.5 pt-1.5">
              <p className="m-0">{t('pd.gold.cbMethodLine')}</p>
              <p className="m-0 text-[var(--color-text-tertiary)]">{t('pd.gold.cbRevisionNote')}</p>
              <p className="m-0 text-[var(--color-text-tertiary)]">{t('pd.gold.cbChinaNote')}</p>
              <p className="m-0">
                <a href="https://gold.org/goldhub/data" target="_blank" rel="noopener noreferrer" className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                  {t('pd.gold.cbWgcLink')}
                </a>
              </p>
              <p className="m-0 font-semibold text-[var(--color-text-secondary)]">{t('pd.gold.cbGovernanceNote')}</p>
              {/* The mirror framing (s6/01 §2b): both objects + sign
               * conventions named; the seat link lands on its card. */}
              <p className="m-0">
                <bdi>
                  {t('pd.gold.cbMirrorPre')}
                  {mirrorHref !== null ? (
                    <a
                      href={mirrorHref}
                      className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        const hashAt = mirrorHref.indexOf('#');
                        if (hashAt !== -1) stageAnchorScroll(mirrorHref.slice(hashAt + 1));
                        navigate(mirrorHref.slice(0, hashAt === -1 ? undefined : hashAt));
                      }}
                    >
                      {mirrorName}
                    </a>
                  ) : null}
                  {t('pd.gold.cbMirrorPost')}
                </bdi>
              </p>
            </div>
          </details>
        </>
      ) : loading ? (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" role="status">
          {t('pd.gold.loadingLine')}
        </p>
      ) : (
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-cb-unavailable>
          {t('pd.gold.cbUnavailable')}
        </p>
      )}
    </section>
  );
}
