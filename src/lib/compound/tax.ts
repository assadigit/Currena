/**
 * Compound Wealth — the tax file (v7). No data feeds, no calls: every rate,
 * threshold and levy the estimator uses lives here, each with its income-year
 * label, its source name and link, and a plain note. Nothing in this file is
 * invented, estimated or recalled from memory; every value was read from the
 * linked official source on the "checked on" date below (the research working
 * is recorded in COMPOUND-WEALTH-REPORT.md §11).
 *
 * SOURCING RULES (spec §7, same discipline as figures.ts): official pages
 * only, fetched during the research sitting, never from memory. The ATO doors
 * (individual income tax rates, Medicare levy) and the IRS doors (Rev. Proc.
 * 2025-32 + news release IR-2025-103, Topic no. 559) were all opened and read
 * this session.
 *
 * SCOPE (v7 decision, recorded in the report): this file carries exactly the
 * income-tax schedules plus the named extras (AU: the Medicare levy; US: the
 * net investment income tax). State taxes, capital-gains timing, account
 * wrappers, offsets and franking credits are deliberately NOT here — each
 * fails the simplicity contract or the sourcing rules, and the How fold says
 * so plainly.
 *
 * The estimator is a guide, not advice: the typed income only sets the
 * bracket, and the rate is the tax on the next dollar of investment earnings
 * at that income (never called "marginal" on screen — plain words only).
 */

import { STALENESS_MONTHS, monthsSince } from "./maths";

/* =================================================================== *
 * CONFIG BLOCK                                                        *
 * =================================================================== */

/** The date every source below was read and recorded (YYYY-MM-DD, UTC). */
export const TAX_CHECKED_ON = "2026-11-26";

/** The ATO's published individual income tax rates page (the AU brackets). */
const ATO_RATES_URL =
  "https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents";
/** The ATO's "What is the Medicare levy?" page. */
const ATO_MEDICARE_URL =
  "https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy";
/** The IRS news release IR-2025-103 (tax year 2026 inflation adjustments). */
const IRS_2026_RELEASE_URL =
  "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill";
/** IRS Rev. Proc. 2025-32 — the tax year 2026 rate tables for all four
 *  filing statuses (the definitive official schedule). */
const IRS_REVPROC_URL = "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf";
/** IRS Topic no. 559 — the net investment income tax (rate and thresholds). */
const IRS_NIIT_URL = "https://www.irs.gov/taxtopics/tc559";

/** The Medicare levy rate the ATO publishes ("2% of your taxable income"). */
const AU_MEDICARE_RATE = 0.02;

/** The net investment income tax rate the IRS publishes (3.8%). */
const US_NIIT_RATE = 0.038;

/* =================================================================== *
 * Types                                                               *
 * =================================================================== */

/** The USA filing statuses the data file carries (default: single).
 *  "Married filing jointly" also covers qualifying surviving spouses —
 *  Rev. Proc. 2025-32 gives them the same table (Table 1). */
export type FilingStatus = "single" | "married-joint" | "married-separate" | "head-of-household";

/** One bracket row, in the ATO/IRS's own words: the rate applies to each
 *  dollar OVER the threshold (null = the first band, from zero). */
export interface TaxBracketRow {
  /** Income above this amount is taxed at `rate` (currency units a year). */
  over: number | null;
  /** The rate on those dollars, as a decimal (0.30 = 30c per dollar). */
  rate: number;
}

/** One named part of the estimate, for the words line. */
export interface TaxPart {
  /** Plain-English name ("income tax", "Medicare levy"). */
  nameEn: string;
  /** The same name in Farsi. */
  nameFa: string;
  /** This part's rate, as a decimal. */
  rate: number;
}

/** The estimate, broken into its named parts. */
export interface TaxBreakdown {
  /** The parts, largest-impact wording first: the income tax, then extras. */
  parts: TaxPart[];
  /** The income-year label in Farsi (English rides on the result). */
  yearLabelFa: string;
}

/** The full result of the estimator (one pure function, no engine coupling). */
export interface TaxEstimate {
  /** The combined rate on extra investment earnings, as a decimal. */
  rate: number;
  /** The named parts, in words. */
  breakdown: TaxBreakdown;
  /** The income-year label, English ("the 2026–27 income year"). */
  yearLabel: string;
  /** Source name for the citation line. */
  sourceName: string;
  /** Source URL. */
  sourceUrl: string;
  /** The date the sources were read (YYYY-MM-DD). */
  checkedOn: string;
}

/* =================================================================== *
 * AUSTRALIA (AUD) — resident rates, 2026–27 income year               *
 * =================================================================== */

const AU_TAX = {
  yearLabel: "the 2026–27 income year",
  yearLabelFa: "سال مالی ۲۰۲۶–۲۷",
  sourceName: "Australian Taxation Office",
  sourceUrl: ATO_RATES_URL,
  note: "Resident tax rates 2026–27, read from the ATO's published individual income tax rates page ('Tax rates – Australian resident', page dated 13 August 2026): 0–$18,200 nil; $18,201–$45,000 15c for each $1 over $18,200; $45,001–$135,000 $4,020 plus 30c for each $1 over $45,000; $135,001–$190,000 $31,020 plus 37c for each $1 over $135,000; $190,001 and over $51,370 plus 45c for each $1 over $190,000. The 15% second-bracket rate is the 2026–27 Budget's cut of the former 16% rate, already in the published table. The page itself states these rates do not include the Medicare levy.",
  brackets: [
    { over: null, rate: 0 },
    { over: 18_200, rate: 0.15 },
    { over: 45_000, rate: 0.3 },
    { over: 135_000, rate: 0.37 },
    { over: 190_000, rate: 0.45 },
  ] as TaxBracketRow[],
  /** The Medicare levy: a separate ATO page, the estimator's one AU extra. */
  medicare: {
    rate: AU_MEDICARE_RATE,
    sourceName: "Australian Taxation Office (Medicare levy)",
    sourceUrl: ATO_MEDICARE_URL,
    note: "The ATO's 'What is the Medicare levy?' page (last updated 30 April 2026): 'The Medicare levy is 2% of your taxable income.' Added in full by the estimator; the reductions and exemptions the page describes for low incomes are not modelled (the How fold says so).",
  },
};

/* =================================================================== *
 * USA (USD) — tax year 2026, four filing statuses                     *
 * =================================================================== */

/** The label pair for one filing status (the UI control reads these). */
interface StatusRow {
  labelEn: string;
  labelFa: string;
  brackets: TaxBracketRow[];
}

const US_TAX = {
  yearLabel: "tax year 2026",
  yearLabelFa: "سال مالیاتی ۲۰۲۶",
  sourceName: "IRS, Rev. Proc. 2025-32 (news release IR-2025-103)",
  sourceUrl: IRS_REVPROC_URL,
  note: "The tax-year-2026 rate tables for all four filing statuses, read from Rev. Proc. 2025-32 section 4.01 (Tables 1–4; released 9 October 2025 with IR-2025-103). Single thresholds: $12,400 / $50,400 / $105,700 / $201,775 / $256,225 / $640,600 at 10 / 12 / 22 / 24 / 32 / 35 / 37%. The release page was read as the cross-check; the revenue procedure PDF is the definitive schedule. Qualifying surviving spouses use the married-filing-jointly table, per the table's own heading.",
  statuses: {
    "single": {
      labelEn: "Single",
      labelFa: "مجرد",
      brackets: [
        { over: null, rate: 0.1 },
        { over: 12_400, rate: 0.12 },
        { over: 50_400, rate: 0.22 },
        { over: 105_700, rate: 0.24 },
        { over: 201_775, rate: 0.32 },
        { over: 256_225, rate: 0.35 },
        { over: 640_600, rate: 0.37 },
      ],
    } as StatusRow,
    "married-joint": {
      labelEn: "Married, filing jointly",
      labelFa: "متأهل — اظهار مشترک",
      brackets: [
        { over: null, rate: 0.1 },
        { over: 24_800, rate: 0.12 },
        { over: 100_800, rate: 0.22 },
        { over: 211_400, rate: 0.24 },
        { over: 403_550, rate: 0.32 },
        { over: 512_450, rate: 0.35 },
        { over: 768_700, rate: 0.37 },
      ],
    } as StatusRow,
    "married-separate": {
      labelEn: "Married, filing separately",
      labelFa: "متأهل — اظهار جداگانه",
      brackets: [
        { over: null, rate: 0.1 },
        { over: 12_400, rate: 0.12 },
        { over: 50_400, rate: 0.22 },
        { over: 105_700, rate: 0.24 },
        { over: 201_775, rate: 0.32 },
        { over: 256_225, rate: 0.35 },
        { over: 384_350, rate: 0.37 },
      ],
    } as StatusRow,
    "head-of-household": {
      labelEn: "Head of household",
      labelFa: "سرپرست خانوار",
      brackets: [
        { over: null, rate: 0.1 },
        { over: 17_700, rate: 0.12 },
        { over: 67_450, rate: 0.22 },
        { over: 105_700, rate: 0.24 },
        { over: 201_750, rate: 0.32 },
        { over: 256_200, rate: 0.35 },
        { over: 640_600, rate: 0.37 },
      ],
    } as StatusRow,
  } as Record<FilingStatus, StatusRow>,
  /** The net investment income tax: the estimator's one US extra. */
  niit: {
    rate: US_NIIT_RATE,
    /** The MAGI thresholds by filing status (not inflation-indexed; fixed
     *  by statute). The estimator adds the NIIT at or above the threshold,
     *  because the next dollar of investment income above it is taxed 3.8%. */
    thresholds: {
      "single": 200_000,
      "married-joint": 250_000,
      "married-separate": 125_000,
      "head-of-household": 200_000,
    } as Record<FilingStatus, number>,
    sourceName: "IRS, Topic no. 559 (net investment income tax)",
    sourceUrl: IRS_NIIT_URL,
    note: "IRS Topic no. 559 (page reviewed 25 November 2026): a 3.8% net investment income tax applies to individuals with net investment income above threshold amounts — the lesser of net investment income, or the excess of modified adjusted gross income over $250,000 married filing jointly, $125,000 married filing separately, or $200,000 single or head of household.",
  },
};

/* =================================================================== *
 * The countries' availability                                         *
 * =================================================================== */

/** Is the guided estimator available for a country? (If a future country
 *  has no sourced schedule, the link hides and only the manual rate shows.) */
export function taxEstimatorAvailable(country: "AU" | "US"): boolean {
  return country === "AU" || country === "US";
}

/** The filing statuses the US data file carries, in control order. */
export const US_STATUSES: readonly FilingStatus[] = [
  "single", "married-joint", "head-of-household", "married-separate",
];

/** The label pair for a filing status (EN + fa). */
export function statusLabels(status: FilingStatus): { labelEn: string; labelFa: string } {
  return US_TAX.statuses[status];
}

/* =================================================================== *
 * The estimator (one pure function, no engine coupling)               *
 * =================================================================== */

/** The income-tax rate on the next dollar at an income (the "over" rule:
 *  an income exactly on a threshold belongs to the bracket above it). */
function bracketRate(brackets: TaxBracketRow[], income: number): number {
  let rate = brackets[0].rate;
  for (const row of brackets) {
    if (row.over !== null && income >= row.over) rate = row.rate;
  }
  return rate;
}

/**
 * Estimate the share of extra investment earnings that goes to tax.
 *
 * - AU: the income-tax bracket rate at that income, plus the Medicare levy
 *   (2%, added in full — low-income reductions are not modelled).
 * - US: the bracket rate for the chosen filing status, plus the 3.8% net
 *   investment income tax at or above its threshold.
 *
 * The income only sets the bracket; the result is a guide, not advice.
 * Returns null when the income is not a usable positive number (the UI
 * shows its plain hint instead).
 */
export function estimateTaxOnEarnings(
  country: "AU" | "US",
  income: number,
  status: FilingStatus = "single",
): TaxEstimate | null {
  if (!Number.isFinite(income) || income <= 0) return null;

  if (country === "AU") {
    const bracket = bracketRate(AU_TAX.brackets, income);
    const parts: TaxPart[] = [
      { nameEn: "income tax", nameFa: "مالیات بر درآمد", rate: bracket },
      { nameEn: "Medicare levy", nameFa: "عوارض مدیکر", rate: AU_TAX.medicare.rate },
    ];
    return {
      rate: bracket + AU_TAX.medicare.rate,
      breakdown: { parts, yearLabelFa: AU_TAX.yearLabelFa },
      yearLabel: AU_TAX.yearLabel,
      sourceName: AU_TAX.sourceName,
      sourceUrl: AU_TAX.sourceUrl,
      checkedOn: TAX_CHECKED_ON,
    };
  }

  const row = US_TAX.statuses[status];
  const bracket = bracketRate(row.brackets, income);
  const parts: TaxPart[] = [{ nameEn: "income tax", nameFa: "مالیات بر درآمد", rate: bracket }];
  if (income >= US_TAX.niit.thresholds[status]) {
    parts.push({
      nameEn: "net investment income tax",
      nameFa: "مالیات بر درآمد سرمایه‌گذاری",
      rate: US_TAX.niit.rate,
    });
  }
  return {
    rate: parts.reduce((sum, p) => sum + p.rate, 0),
    breakdown: { parts, yearLabelFa: US_TAX.yearLabelFa },
    yearLabel: US_TAX.yearLabel,
    sourceName: US_TAX.sourceName,
    sourceUrl: US_TAX.sourceUrl,
    checkedOn: TAX_CHECKED_ON,
  };
}

/* =================================================================== *
 * Staleness (the same 18-month rule as the figures file)              *
 * =================================================================== */

/** True when the tax file is older than STALENESS_MONTHS. */
export function taxDataIsStale(): boolean {
  return monthsSince(TAX_CHECKED_ON) > STALENESS_MONTHS;
}

/* =================================================================== *
 * Citations (for the report and the How fold's source line)           *
 * =================================================================== */

/** Every source behind the file, for the report's tax data table. */
export const TAX_SOURCES = [
  {
    country: "AU" as const,
    what: "Resident income-tax rates 2026–27",
    sourceName: AU_TAX.sourceName,
    sourceUrl: AU_TAX.sourceUrl,
    note: AU_TAX.note,
  },
  {
    country: "AU" as const,
    what: "Medicare levy 2%",
    sourceName: AU_TAX.medicare.sourceName,
    sourceUrl: AU_TAX.medicare.sourceUrl,
    note: AU_TAX.medicare.note,
  },
  {
    country: "US" as const,
    what: "Tax-year-2026 rate schedules, four filing statuses",
    sourceName: US_TAX.sourceName,
    sourceUrl: US_TAX.sourceUrl,
    note: US_TAX.note,
  },
  {
    country: "US" as const,
    what: "Net investment income tax (3.8%, thresholds)",
    sourceName: US_TAX.niit.sourceName,
    sourceUrl: US_TAX.niit.sourceUrl,
    note: US_TAX.niit.note,
  },
];
