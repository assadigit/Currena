/**
 * The LBMA forecast-accuracy series — the honesty device the previous
 * gold page's Zone M companion carried (upstream
 * `packages/insights/src/domains/gold/lbma-forecast.ts`, ported
 * verbatim): the professionals' published consensus record beside
 * Currena's own no-edge backtest.
 *
 * THE SERIES (the upstream's own note): extracted live 2026-11-19 from
 * the publisher's own embedded Highcharts config on the public page
 * www.lbma.org.uk/forecast-survey-2026/2010-2026-performance — every
 * recorded aggregate reproduces exactly (10/16 under-forecast; mean
 * −2.11%; mean-abs 8.13%; 2025 −20.24%; the 2026 forecast average
 * $4,741.97).
 *
 * Pure + platform-free: constants + one function.
 */

/** Where the series was extracted from (attribution at point of use). */
export const LBMA_FORECAST_SOURCE_URL =
  "https://www.lbma.org.uk/forecast-survey-2026/2010-2026-performance";

/** When the extraction ran (the dated provenance stamp). */
export const LBMA_FORECAST_EXTRACTED_AT = "2026-11-19";

/** One year's row: the January survey's consensus + the actual average. */
export interface LbmaForecastYear {
  readonly year: number;
  /** The analysts' forecast average for the year, USD/oz (January survey). */
  readonly forecast: number;
  /** The year's actual average price, USD/oz — null until it completes. */
  readonly actual: number | null;
}

/** The 2010–2026 series, verbatim (16 completed years + pending 2026). */
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

/** The mid-year revision LBMA's own July pulse recorded (dated note). */
export const LBMA_2026_MIDYEAR_REVISION = 4604;

/** One scored year's derived row. */
export interface LbmaForecastScoredYear {
  year: number;
  forecast: number;
  actual: number;
  /** (forecast − actual) ÷ actual × 100 — negative = under-forecast. */
  missPct: number;
}

/** The retrospective over the completed years + the pending row. */
export interface LbmaForecastRetrospective {
  scored: readonly LbmaForecastScoredYear[];
  n: number;
  /** The years the consensus under-forecast (miss < 0). */
  underForecast: readonly number[];
  /** The mean signed miss, percent. */
  meanMissPct: number;
  /** The mean absolute miss, percent. */
  meanAbsMissPct: number;
  /** The pending year — honest, never scored early. */
  pending: { year: number; forecast: number } | null;
}

/**
 * The forecast-accuracy retrospective over the extracted series. Pure;
 * never throws. Miss convention disclosed at point of use:
 * (forecast − actual) ÷ actual — NEGATIVE means under-forecast.
 */
export function forecastRetrospective(
  series: readonly LbmaForecastYear[] = LBMA_FORECAST_SERIES,
): LbmaForecastRetrospective {
  const scored: LbmaForecastScoredYear[] = [];
  let pending: { year: number; forecast: number } | null = null;
  for (const row of series) {
    if (row.actual === null) {
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
