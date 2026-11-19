/**
 * GoldCorrelation — GPE R22 / F11 (2026-11-19): the correlation
 * companion, Zone K's closing panel (docs/specs/gold-page-elevation:
 * s7/01 §3 in full — the mandated design · s7/03 §4.2 the
 * pre-registered-window registry · s6/01 zone K the 390 rules · s8/01
 * R22).
 *
 * THE FOUR LAYERS (s7/01 §3, binding): the dual-axis chart (gold left,
 * the 10y real yield right, NOT inverted — the reader sees the
 * pre-2022 mirror and the post-2022 divergence with their own eyes);
 * the 52-week rolling-correlation strip below (the honest star — it
 * shows the relationship CHANGING); the dated 2022 «چرخش خریدار»
 * annotation (a chart marker when the window reaches it, the teaching
 * line always); and the methodology footer with the windows printed
 * verbatim (C1 — the anti-GPE-S3-05 clause). The scatter stays
 * rejected (s7/01 §3's weighed record).
 *
 * DATA: zero new — the R18 OHLC leg (the shared module-cached hook)
 * + the existing real-yield-10y history (GET /api/insights/:id/history,
 * the M-2 bounded public window). Fail-closed when either series is
 * stale (the universal rider, C6). Display-only — no meter membership.
 *
 * 390 (s6/01 zone K): a Supporting rider — collapsed behind one tap
 * with the rotation teaching line always visible; desktop expanded.
 */

import { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '@currena/core';
import {
  ROTATION_DATE,
  correlationPanel,
  type CorrelationPanel as PanelModel,
} from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { IndicatorHistorySchema } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldXauOhlc } from './gold-xau';

const YIELD_HISTORY_CACHE_KEY = 'currena:insights:gold-corr-yield';
const TIMEOUT_MS = 20_000;

/** GET /api/insights/real-yield-10y/history — null on any failure (the
 *  gold-xau client's discipline: never a throw, the calm fallbacks). */
async function fetchYieldHistory(): Promise<Array<[number, number]> | null> {
  try {
    const response = await fetch('/api/insights/real-yield-10y/history', {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
      cache: 'default',
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const parsed = IndicatorHistorySchema.safeParse(body);
    if (!parsed.success || parsed.data.id !== 'real-yield-10y') return null;
    try {
      window.localStorage.setItem(YIELD_HISTORY_CACHE_KEY, JSON.stringify(parsed.data));
    } catch {
      /* best-effort */
    }
    return parsed.data.points;
  } catch {
    return null;
  }
}

function readCachedYieldHistory(): Array<[number, number]> | null {
  try {
    const raw = window.localStorage.getItem(YIELD_HISTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = IndicatorHistorySchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.id === 'real-yield-10y' ? parsed.data.points : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * The chart geometry (pure)
 * ------------------------------------------------------------------ */

const CHART_W = 640;
const CHART_H = 210;
const STRIP_H = 96;
const PAD_L = 8;
const PAD_R = 56;
const PAD_T = 24;
const PAD_B = 20;

function dayOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

interface ChartModel {
  goldPath: string;
  yieldPath: string;
  xOf: (date: string) => number;
  goldMin: number;
  goldMax: number;
  yieldMin: number;
  yieldMax: number;
  firstDay: number;
  lastDay: number;
}

function buildChartModel(panel: PanelModel): ChartModel {
  const d = panel.daily;
  const firstDay = dayOf(d[0]!.date);
  const lastDay = dayOf(d[d.length - 1]!.date);
  const span = Math.max(1, lastDay - firstDay);
  const xOf = (date: string): number => PAD_L + ((dayOf(date) - firstDay) / span) * (CHART_W - PAD_L - PAD_R);
  let goldMin = Infinity;
  let goldMax = -Infinity;
  let yieldMin = Infinity;
  let yieldMax = -Infinity;
  for (const p of d) {
    goldMin = Math.min(goldMin, p.gold);
    goldMax = Math.max(goldMax, p.gold);
    yieldMin = Math.min(yieldMin, p.yield10y);
    yieldMax = Math.max(yieldMax, p.yield10y);
  }
  const goldPad = (goldMax - goldMin) * 0.06 || 1;
  const yieldPad = (yieldMax - yieldMin) * 0.12 || 0.1;
  const gMin = goldMin - goldPad;
  const gMax = goldMax + goldPad;
  const yMin = yieldMin - yieldPad;
  const yMax = yieldMax + yieldPad;
  const yGold = (v: number): number => PAD_T + (1 - (v - gMin) / (gMax - gMin)) * (CHART_H - PAD_T - PAD_B);
  const yYield = (v: number): number => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * (CHART_H - PAD_T - PAD_B);
  let goldPath = '';
  let yieldPath = '';
  d.forEach((p, i) => {
    const x = xOf(p.date).toFixed(1);
    goldPath += `${i === 0 ? 'M' : 'L'}${x},${yGold(p.gold).toFixed(1)} `;
    yieldPath += `${i === 0 ? 'M' : 'L'}${x},${yYield(p.yield10y).toFixed(1)} `;
  });
  return { goldPath, yieldPath, xOf, goldMin, goldMax, yieldMin, yieldMax, firstDay, lastDay };
}

/** The year tick labels (≤ 11 ticks, first + last included). */
function yearTicks(firstDay: number, lastDay: number): Array<{ x: number; label: string }> {
  const firstYear = new Date(firstDay * 86_400_000).getUTCFullYear();
  const lastYear = new Date(lastDay * 86_400_000).getUTCFullYear();
  const out: Array<{ x: number; label: string }> = [];
  const span = Math.max(1, lastDay - firstDay);
  const step = Math.max(1, Math.ceil((lastYear - firstYear + 1) / 10));
  for (let y = firstYear; y <= lastYear; y += step) {
    const day = Math.floor(Date.parse(`${y}-01-01T00:00:00Z`) / 86_400_000);
    const x = PAD_L + ((day - firstDay) / span) * (CHART_W - PAD_L - PAD_R);
    if (x >= PAD_L && x <= CHART_W - PAD_R) out.push({ x, label: String(y) });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

export function GoldCorrelation(): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const goldState = useGoldXauOhlc();
  const [yieldPoints, setYieldPoints] = useState<Array<[number, number]> | null>(() => {
    try {
      return readCachedYieldHistory();
    } catch {
      return null;
    }
  });
  const [yieldLoading, setYieldLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    void fetchYieldHistory().then((points) => {
      if (settled) return;
      settled = true;
      setYieldLoading(false);
      if (points !== null) setYieldPoints(points);
    });
    return () => {
      settled = true;
    };
  }, []);

  // The pure derivation (the engine, imported — no arithmetic here).
  const panel = useMemo(() => {
    if (goldState.kind !== 'ready' || yieldPoints === null) return null;
    return correlationPanel(goldState.snapshot.series, yieldPoints, Date.now());
  }, [goldState, yieldPoints]);

  // The 390 rule (the GoldTaLevels pattern): collapsed on small
  // viewports, expanded on desktop — session-only.
  const [open, setOpen] = useState(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(min-width: 640px)').matches !== true
          ? false
          : true
      );
    } catch {
      return true;
    }
  });

  const num = (v: number, digits = 0): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  /** The honest window word (the S13-D1 posture — named from the data,
   *  through the corpus's own span keys — no parallel copy). */
  const windowWord =
    panel !== null && panel.window !== null
      ? spanWord(panel.window.from, panel.window.to, t, numberLocale)
      : null;

  const header = (
    <header className="flex min-w-0 flex-col gap-0.5">
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {t('pd.gold.corrTitle')}
      </h4>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        {t('pd.gold.corrSubtitle')}
      </p>
    </header>
  );

  if (goldState.kind === 'loading' || yieldLoading) {
    return (
      <section aria-label={t('pd.gold.corrTitle')} data-gold-correlation="loading" className="mt-0 flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]" role="status">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }
  if (panel === null || panel.window === null || panel.daily.length < 2) {
    return (
      <section aria-label={t('pd.gold.corrTitle')} data-gold-correlation="none" className="mt-0 flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-corr-unavailable>
          {goldState.kind === 'none' || yieldPoints === null ? t('pd.gold.corrUnavailable') : t('pd.gold.corrNotEnough')}
        </p>
      </section>
    );
  }

  const chart = buildChartModel(panel);
  const ticks = yearTicks(chart.firstDay, chart.lastDay);
  const rotationX = chart.xOf(ROTATION_DATE);
  const rotationVisible = panel.rotationInWindow && rotationX > PAD_L + 4 && rotationX < CHART_W - PAD_R - 4;
  const stripZeroY = PAD_T + (STRIP_H / 2);

  return (
    <section
      aria-label={t('pd.gold.corrTitle')}
      data-gold-correlation
      data-corr-window-days={Math.round(dayOf(panel.window!.to) - dayOf(panel.window!.from))}
      className="mt-0 flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      {header}

      {/* The ALWAYS-VISIBLE takeaway (the 390 rule): the dated rotation
       * teaching line — the chart marker renders only when the window
       * reaches 2022 (never invented), the line teaches always. */}
      <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-1.5 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-corr-rotation-line>
        <bdi>
          <a href="#gold-zone-k" className="insights-focusable text-currena-blue underline-offset-2 hover:underline">
            {t('pd.gold.corrRotationLabel')}
          </a>
          {' — '}
          {t('pd.gold.corrRotationLine')}
        </bdi>
      </p>

      {/* The 390 toggle (the session-only collapse). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-label)] font-bold text-currena-blue"
      >
        <span>{t('pd.gold.corrStripTitle')}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <>
          {/* 1 — the dual-axis chart (gold left, the yield right, not inverted). */}
          <figure className="m-0 flex min-w-0 flex-col gap-1" data-corr-chart>
            <div dir="ltr" className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                role="img"
                aria-label={`${t('pd.gold.corrTitle')} — ${t('pd.gold.corrGoldLabel')}, ${t('pd.gold.corrYieldLabel')}`}
                className="h-auto w-full"
                data-corr-points={panel.daily.length}
              >
                {/* The rotation marker (only when the window contains it). */}
                {rotationVisible ? (
                  <g data-corr-rotation-marker>
                    <line x1={rotationX} y1={PAD_T - 6} x2={rotationX} y2={CHART_H - PAD_B} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.55} strokeDasharray="4 3" />
                    <text x={rotationX + 3} y={PAD_T - 9} fontSize={9.5} fill="var(--color-text-tertiary)">
                      {t('pd.gold.corrRotationLabel')}
                    </text>
                  </g>
                ) : null}
                {/* The gold line (left axis). */}
                <path d={chart.goldPath} fill="none" stroke="var(--color-accent-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" data-corr-gold-line />
                {/* The yield line (right axis, muted — never inverted). */}
                <path d={chart.yieldPath} fill="none" stroke="var(--color-text-secondary)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} data-corr-yield-line />
                {/* The axis min/max labels + the year ticks. */}
                <text x={CHART_W - PAD_R + 4} y={PAD_T + 4} fontSize={9.5} fill="var(--color-text-tertiary)">{num(chart.yieldMax, 1)}%</text>
                <text x={CHART_W - PAD_R + 4} y={CHART_H - PAD_B} fontSize={9.5} fill="var(--color-text-tertiary)">{num(chart.yieldMin, 1)}%</text>
                <text x={PAD_L} y={PAD_T - 10} fontSize={9.5} fill="var(--color-accent-gold)">{num(chart.goldMax)}</text>
                <text x={PAD_L} y={CHART_H - 4} fontSize={9.5} fill="var(--color-accent-gold)">{num(chart.goldMin)}</text>
                {ticks.map((tick) => (
                  <text key={tick.label} x={tick.x} y={CHART_H - 4} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="middle">
                    {num(Number(tick.label))}
                  </text>
                ))}
              </svg>
            </div>
            <figcaption className="m-0 flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
              <span>{t('pd.gold.corrGoldLabel')}</span>
              <span>{t('pd.gold.corrYieldLabel')}</span>
            </figcaption>
          </figure>

          {/* 2 — the 52-week rolling-correlation strip (the honest star). */}
          <figure className="m-0 flex min-w-0 flex-col gap-1" data-corr-strip>
            <figcaption className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
              {t('pd.gold.corrStripTitle')}
            </figcaption>
            {panel.strip.length > 0 ? (
              <div dir="ltr" className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${CHART_W} ${STRIP_H}`}
                  role="img"
                  aria-label={t('pd.gold.corrStripTitle')}
                  className="h-auto w-full"
                  data-corr-strip-points={panel.strip.length}
                >
                  {/* The −1/0/+1 gridlines. */}
                  <line x1={PAD_L} y1={stripZeroY} x2={CHART_W - PAD_R} y2={stripZeroY} stroke="var(--color-border)" strokeWidth={1} />
                  <text x={CHART_W - PAD_R + 4} y={PAD_T + 4} fontSize={9.5} fill="var(--color-text-tertiary)">+1</text>
                  <text x={CHART_W - PAD_R + 4} y={stripZeroY + 3.5} fontSize={9.5} fill="var(--color-text-tertiary)">0</text>
                  <text x={CHART_W - PAD_R + 4} y={STRIP_H - PAD_B} fontSize={9.5} fill="var(--color-text-tertiary)">−1</text>
                  {/* The r line. */}
                  <path
                    d={stripPath(panel)}
                    fill="none"
                    stroke="var(--color-accent-gold)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    data-corr-strip-line
                  />
                </svg>
              </div>
            ) : (
              <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-corr-strip-none>
                <bdi>{interpolate(t('pd.gold.corrStripNone'), { n: num(panel.fridays.length) })}</bdi>
              </p>
            )}
          </figure>
        </>
      ) : null}

      {/* 3 + 4 — the methodology footer (the windows printed verbatim, C1). */}
      <footer className="m-0 flex flex-col gap-1 border-t border-[var(--color-border)]/60 pt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-corr-method>
        <p className="m-0">{t('pd.gold.corrMethodSeries')}</p>
        <p className="m-0">
          <bdi>{interpolate(t('pd.gold.corrMethodWindow'), { window: windowWord ?? '' })}</bdi>
        </p>
        <p className="m-0 font-semibold text-[var(--color-text-secondary)]">
          <bdi>{t('pd.gold.corrCaveat')}</bdi>
        </p>
        {panel.staleness.stale ? (
          <p className="m-0 font-semibold text-[var(--color-text-secondary)]" data-corr-stale>
            <bdi>
              {interpolate(t('pd.gold.corrStale'), {
                goldAge: num(panel.staleness.gold.ageDays),
                yieldAge: num(panel.staleness.yield10y.ageDays),
              })}
            </bdi>
          </p>
        ) : null}
      </footer>
    </section>
  );
}

/* ------------------------- helpers ------------------------- */

/** The honest window word from a span (the GoldTaLevels basisWord pattern,
 *  through the corpus's own chartSpanMonths/chartSpanYears keys). */
function spanWord(
  from: string,
  to: string,
  t: ReturnType<typeof useI18n>['t'],
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (days < 335) {
    return interpolate(t('pd.gold.chartSpanMonths'), {
      n: formatNumber(Math.max(1, Math.round(days / 30.4)), numberLocale, { maximumFractionDigits: 0 }),
    });
  }
  return interpolate(t('pd.gold.chartSpanYears'), {
    years: formatNumber(Math.round((days / 365.25) * 10) / 10, numberLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }),
  });
}

/** The strip's SVG path (y: −1..+1 → the strip's box). */
function stripPath(panel: PanelModel): string {
  const first = panel.strip[0]!;
  const last = panel.strip[panel.strip.length - 1]!;
  const firstDay = dayOf(first.friday);
  const lastDay = dayOf(last.friday);
  const span = Math.max(1, lastDay - firstDay);
  const xOf = (date: string): number => PAD_L + ((dayOf(date) - firstDay) / span) * (CHART_W - PAD_L - PAD_R);
  const yOf = (r: number): number => PAD_T + (1 - (r + 1) / 2) * (STRIP_H - PAD_T - PAD_B);
  let path = '';
  panel.strip.forEach((p, i) => {
    path += `${i === 0 ? 'M' : 'L'}${xOf(p.friday).toFixed(1)},${yOf(p.r).toFixed(1)} `;
  });
  return path;
}
