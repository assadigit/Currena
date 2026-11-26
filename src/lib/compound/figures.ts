/**
 * Compound Wealth — the figures file (spec §7). No data feeds, no calls:
 * every number the page uses lives here, each with its period, its basis,
 * its source name and link, and how it was derived. Nothing in this file
 * is invented, estimated or recalled from memory; every value was read
 * from the linked source on the "checked on" date (the full research
 * working is recorded in COMPOUND-WEALTH-REPORT.md §5).
 *
 * SOURCING RULES (spec §7): prefer total return; label price-only rows
 * (there are none — gold needs no dividends and every other row is total
 * return); rows may end on different dates because different providers
 * publish different periods — every row carries its own period end and
 * the page shows it; when a 20- or 30-year figure is not published, the
 * longest published period of at least 10 years is used and labelled.
 *
 * Rounds: published figures keep their published precision; derived
 * figures are stored to two decimals with the exact working in the note.
 */

/* =================================================================== *
 * CONFIG BLOCK                                                        *
 * =================================================================== */

/** The date every source below was read and recorded (YYYY-MM-DD, UTC). */
export const FIGURES_CHECKED_ON = "2026-11-26";

/** The Vanguard 2026 Index Chart (the AUD rows' main source). */
const VANGUARD_CHART_URL =
  "https://www.vanguard.com.au/adviser/tools/index-chart";
/** The poster PDF (30-year returns to 30 June 2026, Andex Charts). */
const VANGUARD_POSTER_URL =
  "https://fund-docs.vanguard.com/AU-Vanguard_Index_Chart_poster.pdf";
/** NYU Stern — Aswath Damodaran's historical returns dataset (S&P 500
 *  total return incl. dividends, year-end LBMA gold, FRED CPIAUCNS). */
const DAMODARAN_URL =
  "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html";
/** The MSCI World Index (USD) factsheet, 30 October 2026. */
const MSCI_WORLD_URL =
  "https://www.msci.com/documents/10199/255599/msci-world-index.pdf";
/** BIS central bank policy rates (monthly; RBA cash rate target, Fed
 *  target midpoint). */
const BIS_CBPOL_URL = "https://data.bis.org/topics/CBPOL";
/** BIS bilateral exchange rates (AUD per USD, month ends). */
const BIS_XRU_URL = "https://data.bis.org/topics/XRU";
/** ABS Consumer Price Index, Australia (latest release read 2026-11-26:
 *  the October 2026 monthly CPI — the W3 honesty figure). */
const ABS_CPI_URL =
  "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release";
/** BLS CPI-U news release, September 2026 (via FRED CPIAUCNS and the DOL
 *  mirror — bls.gov itself is IP-blocked from the sandbox). */
const BLS_CPI_URL = "https://www.bls.gov/news.release/archives/cpi_10142026.htm";

/* =================================================================== *
 * Types                                                               *
 * =================================================================== */

/** How the return was measured. */
export type Basis = "total return" | "net total return" | "price only";

/** One sourced figure (a 20-year, 30-year, or labelled other window). */
export interface Figure {
  /** Annual return as a decimal (0.072 = 7.2% a year). */
  rate: number;
  /** The window, in words, for the page's tiny line and the method box. */
  windowLabel: string;
  /** The same window in Farsi. */
  windowLabelFa: string;
  /** When the window ends (YYYY-MM-DD). */
  periodEnd: string;
}

/** One asset row. */
export interface AssetRow {
  id: string;
  /** English chip label. */
  labelEn: string;
  /** Farsi chip label. */
  labelFa: string;
  /** The index or rate the figure measures, in words. */
  measures: string;
  /** Dividends included? */
  basis: Basis;
  /** Last 20 years, when sourced. */
  f20: Figure | null;
  /** Last 30 years, when sourced. */
  f30: Figure | null;
  /** A shorter published window (at least 10 years), when 20/30 missing. */
  fsingle: Figure | null;
  /** Source name for the citation line. */
  sourceName: string;
  /** Source URL. */
  sourceUrl: string;
  /** How the number was derived, in plain English. */
  note: string;
}

/** One country preset. */
export interface CountryRows {
  /** "AU" or "US". */
  id: "AU" | "US";
  /** Currency shown beside amounts (English). */
  currencyEn: string;
  /** Currency shown beside amounts (Farsi). */
  currencyFa: string;
  /** The asset chips, in display order. */
  assets: AssetRow[];
  /** Average inflation (the "today's money" deflator), sourced like a row. */
  inflation: AssetRow;
  /** W3 (spec §7): the latest 12-month inflation figure, for the honesty
   *  line in "How is this worked out?" — never used in any maths. */
  inflationLatest: { rate: number; labelEn: string; labelFa: string; sourceName: string; sourceUrl: string };
  /** The default asset id. */
  defaultAsset: string;
}

/* =================================================================== *
 * AUSTRALIA (AUD)                                                     *
 * =================================================================== */

const AU_ROWS: CountryRows = {
  id: "AU",
  currencyEn: "A$",
  currencyFa: "دلار استرالیا",
  defaultAsset: "australian-shares",
  assets: [
    {
      id: "australian-shares",
      labelEn: "Australian shares",
      labelFa: "سهام استرالیایی",
      measures: "S&P/ASX All Ordinaries Total Return Index (dividends included)",
      basis: "total return",
      f20: { rate: 0.072, windowLabel: "20 years to 30 June 2026", windowLabelFa: "۲۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      f30: { rate: 0.09, windowLabel: "30 years to 30 June 2026", windowLabelFa: "۳۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      fsingle: null,
      sourceName: "Vanguard Australia, 2026 Index Chart (Andex Charts)",
      sourceUrl: VANGUARD_POSTER_URL,
      note: "Read straight from the chart's published returns table (per annum total returns to 30 June 2026; Australian Shares row; footnote 3 names the S&P/ASX All Ordinaries Total Return Index). Re-read and re-verified 2026-11-26. The spec asked for the S&P/ASX 200; the published 20- and 30-year figure the research could legally source is the All Ordinaries, which covers the whole Australian market — the page says 'Australian shares' and this note names the index. Cross-check: CFS 'Investment essentials' (30 Sep 2026) publishes 6.97% for the S&P/ASX 300 Accumulation over 20 years — 0.23 points below, an index difference plus the 3-month offset. See the report for how to upgrade to ASX 200.",
    },
    {
      id: "sp500",
      labelEn: "S&P 500",
      labelFa: "اس‌اند‌پی ۵۰۰",
      measures: "S&P 500 Total Return Index, in Australian dollars (unhedged)",
      basis: "total return",
      f20: { rate: 0.118, windowLabel: "20 years to 30 June 2026", windowLabelFa: "۲۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      f30: { rate: 0.108, windowLabel: "30 years to 30 June 2026", windowLabelFa: "۳۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      fsingle: null,
      sourceName: "Vanguard Australia, 2026 Index Chart (Andex Charts)",
      sourceUrl: VANGUARD_POSTER_URL,
      note: "The chart's 'U.S. Shares' row is the S&P 500 Total Return Index expressed in AUD (the poster's footnote 2), so the exchange-rate effect is already inside the published figure — no separate AUD conversion was needed (spec §6.3's method is implemented in the maths and used for the gold row). Re-read and re-verified 2026-11-26. Cross-check: Damodaran's USD figure (10.90% over 20 years to Dec 2025) times the BIS FX effect (≈ +0.46 points a year from the AUD's fall) ≈ 11.4% — consistent.",
    },
    {
      id: "world",
      labelEn: "World shares",
      labelFa: "سهام جهانی",
      measures: "MSCI World ex-Australia Net Total Return Index, in AUD",
      basis: "net total return",
      f20: { rate: 0.091, windowLabel: "20 years to 30 June 2026", windowLabelFa: "۲۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      f30: { rate: 0.086, windowLabel: "30 years to 30 June 2026", windowLabelFa: "۳۰ سال تا ۳۰ ژوئن ۲۰۲۶", periodEnd: "2026-06-30" },
      fsingle: null,
      sourceName: "Vanguard Australia, 2026 Index Chart (Andex Charts)",
      sourceUrl: VANGUARD_POSTER_URL,
      note: "The chart's 'International Shares' row is MSCI World ex-Australia Net Total Return (AUD) — the poster's footnote 4 — the world outside Australia, which is the right 'World shares' for the Australia preset because Australian shares have their own chip. Re-read and re-verified 2026-11-26. Cross-check: CFS 'Investment essentials' (30 Sep 2026) publishes 8.95% for MSCI World Net in A$ over 20 years — 0.15 points below, the 3-month offset.",
    },
    {
      id: "gold",
      labelEn: "Gold",
      labelFa: "طلا",
      measures: "Gold, London market price (LBMA), converted into AUD at endpoint exchange rates",
      basis: "total return",
      f20: { rate: 0.1178, windowLabel: "20 years to 31 December 2025", windowLabelFa: "۲۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      f30: { rate: 0.0878, windowLabel: "30 years to 31 December 2025", windowLabelFa: "۳۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      fsingle: null,
      sourceName: "LBMA year-end prices via NYU Stern (Damodaran); BIS exchange rates",
      sourceUrl: DAMODARAN_URL,
      note: "Derived by spec §6.3: USD growth = year-end LBMA price 513.00 (Dec 2005) → 4,339.645 (Dec 2025) = ×8.4593, and 387.00 (Dec 1995) → 4,339.645 = ×11.2136. FX = USD per 1 AUD at month ends (BIS daily series, inverted from AUD per USD): Dec 1995 0.744498, Dec 2005 0.732323, Dec 2025 0.668335. AUD growth = USD growth × (FX start ÷ FX end): ×9.2693 (20y) and ×12.4914 (30y); annualised over 20 and 30 years → 11.78% and 8.78%. Gold pays no dividends, so price return is total return. Both endpoint sets re-read and the derivation recomputed on 2026-11-26 — exact match.",
    },
    {
      id: "cash",
      labelEn: "Cash",
      labelFa: "پول نقد",
      measures: "RBA cash rate target (monthly average over the window)",
      basis: "total return",
      f20: { rate: 0.0303, windowLabel: "20 years to October 2026", windowLabelFa: "۲۰ سال تا اکتبر ۲۰۲۶", periodEnd: "2026-10-31" },
      f30: { rate: 0.0376, windowLabel: "30 years to October 2026", windowLabelFa: "۳۰ سال تا اکتبر ۲۰۲۶", periodEnd: "2026-10-31" },
      fsingle: null,
      sourceName: "BIS policy-rate dataset (source: Reserve Bank of Australia)",
      sourceUrl: BIS_CBPOL_URL,
      note: "Spec §7 method: the average of the official policy rate over the period — the mean of 240 (20y) and 360 (30y) month-end values of the RBA cash rate target, November 2006 – October 2026 and November 1996 – October 2026. Recomputed from the BIS bulk CSV on 2026-11-26: 3.0321% and 3.7561% — exact match. Cross-checks: Vanguard's chart publishes a bank-bill 'Cash' row of 3.3%/4.0% (bank bills track the cash rate plus a small spread); CFS (30 Sep 2026) publishes 3.25% for the Bloomberg AusBond Bank Bill Index.",
    },
  ],
  inflation: {
    id: "inflation",
    labelEn: "Inflation",
    labelFa: "تورم",
    measures: "Australian CPI, all groups (index change between the period endpoints)",
    basis: "total return",
    f20: { rate: 0.0276, windowLabel: "20 years to September 2026", windowLabelFa: "۲۰ سال تا سپتامبر ۲۰۲۶", periodEnd: "2026-09-30" },
    f30: { rate: 0.0271, windowLabel: "30 years to September 2026", windowLabelFa: "۳۰ سال تا سپتامبر ۲۰۲۶", periodEnd: "2026-09-30" },
    fsingle: null,
    sourceName: "Australian Bureau of Statistics, Consumer Price Index",
    sourceUrl: ABS_CPI_URL,
    note: "Spec §7 method: the annualised change of the CPI index between the period endpoints — 86.6 → 149.2 (Sep 2006 → Sep 2026) = 2.76% a year, and 66.9 → 149.2 (Sep 1996 → Sep 2026) = 2.71% a year, from the ABS quarterly all-groups series. Cross-check: Vanguard's chart (read 2026-11-26) publishes 2.7% for both 20 and 30 years to 30 June 2026 — within 0.06 points. The ABS's long quarterly series pages are retired from the current monthly-first release format; the endpoints' arithmetic and the Vanguard cross-check were re-verified this sitting.",
  },
  inflationLatest: {
    rate: 0.049,
    labelEn: "the 12 months to October 2026",
    labelFa: "۱۲ ماه تا اکتبر ۲۰۲۶",
    sourceName: "ABS monthly CPI, October 2026 release",
    sourceUrl: ABS_CPI_URL,
  },
};

/* =================================================================== *
 * USA (USD)                                                           *
 * =================================================================== */

const US_ROWS: CountryRows = {
  id: "US",
  currencyEn: "$",
  currencyFa: "دلار آمریکا",
  defaultAsset: "sp500",
  assets: [
    {
      id: "sp500",
      labelEn: "S&P 500",
      labelFa: "اس‌اند‌پی ۵۰۰",
      measures: "S&P 500, dividends included",
      basis: "total return",
      f20: { rate: 0.109, windowLabel: "20 years to 31 December 2025", windowLabelFa: "۲۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      f30: { rate: 0.1026, windowLabel: "30 years to 31 December 2025", windowLabelFa: "۳۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      fsingle: null,
      sourceName: "NYU Stern — Aswath Damodaran, historical returns dataset",
      sourceUrl: DAMODARAN_URL,
      note: "Compounded from the dataset's published annual 'S&P 500 (includes dividends)' returns for 2006–2025 (×7.9205 → 10.90% a year) and 1996–2025 (×18.7103 → 10.26% a year). Re-downloaded and recomputed from the XLS on 2026-11-26 — exact match. Cross-check: Vanguard's AUD figure for the S&P 500 (11.8% over 20 years to June 2026) matches this order once the falling AUD is accounted for (≈ +0.46 points a year).",
    },
    {
      id: "world",
      labelEn: "World shares",
      labelFa: "سهام جهانی",
      measures: "MSCI World Index, gross returns, in USD",
      basis: "total return",
      f20: null,
      f30: null,
      fsingle: { rate: 0.122, windowLabel: "15 years to 30 October 2026", windowLabelFa: "۱۵ سال تا ۳۰ اکتبر ۲۰۲۶", periodEnd: "2026-10-30" },
      sourceName: "MSCI World Index (USD) factsheet, 30 October 2026",
      sourceUrl: MSCI_WORLD_URL,
      note: "MSCI publishes 20- and 30-year figures only inside its interactive (login-gated) tools, so this row uses the longest published window of at least 10 years: the factsheet's cumulative gross-return chart, 100 → 562.23 over Oct 2011 – Oct 2026, = ×5.6223 → 12.20% a year. The same factsheet also publishes 'since 31 Dec 1987' = 8.98% a year and 10 years = 13.50% a year, recorded here for context. The page labels this row '15 years'. The factsheet was re-read on 2026-11-26 — exact match.",
    },
    {
      id: "gold",
      labelEn: "Gold",
      labelFa: "طلا",
      measures: "Gold, London market price (LBMA), in USD",
      basis: "total return",
      f20: { rate: 0.1127, windowLabel: "20 years to 31 December 2025", windowLabelFa: "۲۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      f30: { rate: 0.0839, windowLabel: "30 years to 31 December 2025", windowLabelFa: "۳۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
      fsingle: null,
      sourceName: "LBMA year-end prices via NYU Stern (Damodaran)",
      sourceUrl: DAMODARAN_URL,
      note: "Year-end LBMA price per ounce: $513.00 (Dec 2005) → $4,339.645 (Dec 2025) = ×8.4593 → 11.27% a year; $387.00 (Dec 1995) → $4,339.645 = ×11.2136 → 8.39% a year. Gold pays no dividends, so price return is total return. Re-read and recomputed on 2026-11-26 — exact match. Cross-check: this repo's own long-view series (validated against LBMA annual averages within 1%) carries 2005 = 444.74 and 2025 = 3,441.50 as annual averages — a smoother basis, same story.",
    },
    {
      id: "cash",
      labelEn: "Cash",
      labelFa: "پول نقد",
      measures: "Federal Reserve target rate, midpoint (monthly average over the window)",
      basis: "total return",
      f20: { rate: 0.017, windowLabel: "20 years to October 2026", windowLabelFa: "۲۰ سال تا اکتبر ۲۰۲۶", periodEnd: "2026-10-31" },
      f30: { rate: 0.0241, windowLabel: "30 years to October 2026", windowLabelFa: "۳۰ سال تا اکتبر ۲۰۲۶", periodEnd: "2026-10-31" },
      fsingle: null,
      sourceName: "BIS policy-rate dataset (source: US Federal Reserve)",
      sourceUrl: BIS_CBPOL_URL,
      note: "Spec §7 method: the average of the official policy rate over the period — the mean of 240 (20y) and 360 (30y) month-end values of the Fed's target rate (midpoint of the target range since December 2008), November 2006 – October 2026 and November 1996 – October 2026. Recomputed from the BIS bulk CSV on 2026-11-26: 1.6953% and 2.4052% — exact match. Cross-check: the NY Fed's effective fed funds rate over the same 20-year window averages 1.68%, within 0.02 points of the target midpoint.",
    },
  ],
  inflation: {
    id: "inflation",
    labelEn: "Inflation",
    labelFa: "تورم",
    measures: "US CPI-U (index change between the period endpoints)",
    basis: "total return",
    f20: { rate: 0.0253, windowLabel: "20 years to 31 December 2025", windowLabelFa: "۲۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
    f30: { rate: 0.0252, windowLabel: "30 years to 31 December 2025", windowLabelFa: "۳۰ سال تا ۳۱ دسامبر ۲۰۲۵", periodEnd: "2025-12-31" },
    fsingle: null,
    sourceName: "US CPI-U (FRED CPIAUCNS) via NYU Stern (Damodaran)",
    sourceUrl: DAMODARAN_URL,
    note: "Compounded from the dataset's published annual CPI-U inflation rates (the FRED CPIAUCNS series): 2006–2025 = ×1.6475 → 2.53% a year; 1996–2025 = ×2.1123 → 2.52% a year. Re-downloaded and recomputed on 2026-11-26 — exact match; FRED's own index endpoints (Dec 2005 196.8 → Dec 2025 324.054) give 2.5250% and 2.5220% a year, within 0.01 points.",
  },
  inflationLatest: {
    rate: 0.037,
    labelEn: "the 12 months to September 2026",
    labelFa: "۱۲ ماه تا سپتامبر ۲۰۲۶",
    sourceName: "BLS CPI-U, September 2026 release",
    sourceUrl: BLS_CPI_URL,
  },
};

/* =================================================================== *
 * The exported table                                                  *
 * =================================================================== */

export const COUNTRY_ROWS: Record<"AU" | "US", CountryRows> = {
  AU: AU_ROWS,
  US: US_ROWS,
};

/** The asset rows that have at least one sourced figure (the chips). */
export function assetChips(country: "AU" | "US"): AssetRow[] {
  return COUNTRY_ROWS[country].assets.filter(
    (a) => a.f20 !== null || a.f30 !== null || a.fsingle !== null,
  );
}

/** One asset row by id (null when the id is unknown or unsourced). */
export function assetById(country: "AU" | "US", id: string): AssetRow | null {
  const row = COUNTRY_ROWS[country].assets.find((a) => a.id === id);
  if (!row) return null;
  if (row.f20 === null && row.f30 === null && row.fsingle === null) return null;
  return row;
}

/** The cash row (for the what-if and the compare table). */
export function cashRow(country: "AU" | "US"): AssetRow | null {
  return assetById(country, "cash");
}

/** The inflation row. */
export function inflationRow(country: "AU" | "US"): AssetRow {
  return COUNTRY_ROWS[country].inflation;
}

/** W3: the latest 12-month inflation (the honesty line only, never maths). */
export function latestInflation(country: "AU" | "US") {
  return COUNTRY_ROWS[country].inflationLatest;
}

/** Default inflation (the country average, editable on the page). */
export function defaultInflation(country: "AU" | "US"): number {
  const row = COUNTRY_ROWS[country].inflation;
  // The 20-year average when present, else the 30-year, else 0.025.
  return row.f20?.rate ?? row.f30?.rate ?? 0.025;
}

/** The measured figures in the maths module's shape. */
export function figuresOf(row: AssetRow): {
  r20: number | null;
  r30: number | null;
  single?: { rate: number; years: number; label?: string };
} {
  return {
    r20: row.f20?.rate ?? null,
    r30: row.f30?.rate ?? null,
    single: row.fsingle
      ? {
          rate: row.fsingle.rate,
          years: Number(row.fsingle.windowLabel.replace(/^(\d+) years.*$/, "$1")) || 15,
          label: row.fsingle.windowLabel,
        }
      : undefined,
  };
}

/** The tiny line under the chart: which figures this asset used. */
export function measuredLine(row: AssetRow, locale: "en" | "fa"): string {
  const parts: string[] = [];
  const label = (f: Figure) => (locale === "fa" ? f.windowLabelFa : f.windowLabel);
  const pctOf = (v: number) =>
    locale === "fa"
      ? `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(v * 100)}٪`
      : `${(v * 100).toFixed(1)}%`;
  if (row.f20) parts.push(`${pctOf(row.f20.rate)} · ${label(row.f20)}`);
  if (row.f30) parts.push(`${pctOf(row.f30.rate)} · ${label(row.f30)}`);
  if (row.fsingle) parts.push(`${pctOf(row.fsingle.rate)} · ${label(row.fsingle)}`);
  const joined = parts.join(locale === "fa" ? "؛ " : "; ");
  if (row.f20 && row.f30) {
    return locale === "fa"
      ? `${joined}؛ عدد کمتر را به‌کار می‌بریم.`
      : `${joined}. We use the lower one.`;
  }
  return locale === "fa" ? joined : joined + ".";
}
