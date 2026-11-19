/**
 * lbma-forecast.ts — GPE R32 / F23 (2026-11-19, S17): the forecast-
 * accuracy retrospective's static series + PURE compute (docs/specs/
 * gold-page-elevation: s8/01 R32 · s5/02 F23 · s4/02 §1d the extraction ·
 * s6/01 zone 14 "F23 as a COLLAPSED COMPANION INSIDE the honest-record
 * zone (trust-band contiguity preserved, S6-D2)" · s7/03 §4 the
 * constructive alternative · the s17 M1 §3 + S17-D4 records).
 *
 * THE HONESTY DEVICE SA CANNOT COPY (O8): LBMA's own analyst-survey
 * record — the professionals' published consensus MISSED gold's actual
 * average by −2.1% mean / 8.1% mean-abs over 2010–2025 (10 of 16 years
 * under-forecast; −20.2% in 2025) — beside Currena's own published
 * no-edge backtest. The two records together are the constructive
 * anti-forecast posture: the TE forecast-as-headline anti-pattern
 * (S4/02 §3) forbids faking either one.
 *
 * THE SERIES (S17-D4 — extracted LIVE 2026-11-19 ~17:5x UTC from the
 * publisher's own embedded Highcharts config on the public page
 * `www.lbma.org.uk/forecast-survey-2026/2010-2026-performance`; HTTP 200,
 * both pages, the s4/02 method — no login, no credentials, public page
 * data, LBMA's own numbers): every aggregate the research specs recorded
 * reproduces EXACTLY over this series (10/16 under-forecast; mean
 * −2.11%; mean-abs 8.13%; 2025 −20.24%; 2024 −13.71%; the 2026 forecast
 * average $4,741.97) — the strongest possible provenance check.
 *
 * TWO honest discrepancies, LBMA's own (recorded, not reconciled — the
 * s4/02 §1d note): the 2025 annual-survey page's text carries the
 * analysts' 2025 forecast average as $2,735.33 while the performance
 * chart's series carries 2736.69 (the chart series is the
 * series-of-record); and the July-2026 mid-year pulse's revised
 * whole-year text says $4,604 against the January survey's $4,741.97.
 * Each figure is cited with its own context.
 *
 * THE UPKEEP: annual dated entry — the January survey each year appends
 * one row (the year before flips from forecast-pending to scored when
 * the actual average lands); the mid-year snapshot rides as a dated
 * note. A MANUAL, dated editorial change — never a silent rewrite.
 *
 * Pure, platform-free (AGENTS.md rule 2): constants + one function. The
 * root barrel exports it so the card rides the shared insights chunk.
 */

/* ------------------------------------------------------------------ *
 * The series (the publisher's own chart bytes, extracted 2026-11-19)
 * ------------------------------------------------------------------ */

/** Where the series was extracted from (attribution, rendered at point of use). */
export const LBMA_FORECAST_SOURCE_URL = 'https://www.lbma.org.uk/forecast-survey-2026/2010-2026-performance';

/** When the extraction ran (the dated provenance stamp). */
export const LBMA_FORECAST_EXTRACTED_AT = '2026-11-19';

/**
 * One year's row: the analysts' forecast average (the January survey's
 * consensus, USD/oz) and the actual average price once the year
 * completed (null until it does — the pending year is honest, never
 * scored early).
 */
export interface LbmaForecastYear {
  readonly year: number;
  /** The analysts' forecast average for the year, USD/oz (the January survey). */
  readonly forecast: number;
  /** The year's actual average price, USD/oz — null until the year completes. */
  readonly actual: number | null;
}

/**
 * The 2010–2026 series, verbatim from the publisher's embedded chart
 * config. 16 completed years + the pending 2026 (the January 2026
 * survey's forecast average $4,741.97 — 28 analysts).
 */
export const LBMA_FORECAST_SERIES: readonly LbmaForecastYear[] = [
  { year: 2010, forecast: 1199, actual: 1225 },
  { year: 2011, forecast: 1457, actual: 1572 },
  { year: 2012, forecast: 1766, actual: 1669 },
  { year: 2013, forecast: 1753, actual: 1411 },
  { year: 2014, forecast: 1219, actual: 1267 },
  { year: 2015, forecast: 1211, actual: 1160 },
  { year: 2016, forecast: 1103, actual: 1251 },
  { year: 2017, forecast: 1244, actual: 1257 },
  { year: 2018, forecast: 1318, actual: 1268.41 },
  { year: 2019, forecast: 1311.71, actual: 1392.6 },
  { year: 2020, forecast: 1558.8, actual: 1769.6 },
  { year: 2021, forecast: 1973.8, actual: 1798.6 },
  { year: 2022, forecast: 1801.9, actual: 1800.094 },
  { year: 2023, forecast: 1859.9, actual: 1940.54 },
  { year: 2024, forecast: 2059, actual: 2386.2 },
  { year: 2025, forecast: 2736.69, actual: 3431.54 },
  { year: 2026, forecast: 4741.97, actual: null },
];

/** The mid-year revision LBMA's own pulse article recorded (the dated note). */
export const LBMA_2026_MIDYEAR_REVISION = 4604;

/* ------------------------------------------------------------------ *
 * The compute (pure)
 * ------------------------------------------------------------------ */

/** One scored year's derived row. */
export interface LbmaForecastScoredYear {
  year: number;
  forecast: number;
  actual: number;
  /** (forecast − actual) ÷ actual × 100 — negative = the consensus under-forecast. */
  missPct: number;
}

/** The retrospective over the completed years + the pending row. */
export interface LbmaForecastRetrospective {
  /** The scored (completed) years, ascending. */
  scored: readonly LbmaForecastScoredYear[];
  /** How many completed years the record covers. */
  n: number;
  /** The years the consensus UNDER-forecast (miss < 0) — the 10 of 16 headline. */
  underForecast: readonly number[];
  /** The mean signed miss, percent (negative = under-forecast on average). */
  meanMissPct: number;
  /** The mean absolute miss, percent. */
  meanAbsMissPct: number;
  /** The pending year (forecast recorded, actual not yet) — honest, never scored. */
  pending: { year: number; forecast: number } | null;
}

/**
 * The forecast-accuracy retrospective over the extracted series. Pure;
 * never throws (an all-pending series reads honestly empty). The miss
 * convention is disclosed at point of use: (forecast − actual) ÷ actual
 * — NEGATIVE means the consensus UNDER-forecast the actual average.
 */
export function forecastRetrospective(series: readonly LbmaForecastYear[] = LBMA_FORECAST_SERIES): LbmaForecastRetrospective {
  const scored: LbmaForecastScoredYear[] = [];
  let pending: { year: number; forecast: number } | null = null;
  for (const row of series) {
    if (row.actual === null) {
      // The first pending year rides; a second never exists (one survey
      // per year), but the LAST pending one is kept if it ever did.
      pending = { year: row.year, forecast: row.forecast };
      continue;
    }
    scored.push({
      year: row.year,
      forecast: row.forecast,
      actual: row.actual,
      missPct: ((row.forecast - row.actual) / row.actual) * 100,
    });
  }
  const n = scored.length;
  if (n === 0) {
    return { scored, n: 0, underForecast: [], meanMissPct: 0, meanAbsMissPct: 0, pending };
  }
  const underForecast = scored.filter((r) => r.missPct < 0).map((r) => r.year);
  const meanMissPct = scored.reduce((sum, r) => sum + r.missPct, 0) / n;
  const meanAbsMissPct = scored.reduce((sum, r) => sum + Math.abs(r.missPct), 0) / n;
  return { scored, n, underForecast, meanMissPct, meanAbsMissPct, pending };
}
