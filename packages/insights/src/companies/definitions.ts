/**
 * Global companies table — CONFIG FIRST (R10-3, 2026-10-28).
 *
 * The owner's R9-09 directive was blocked on the EODHD free-plan quota
 * (20 API calls/day total — the markets board already consumes ~16–18).
 * R10-3 pre-builds the table behind a feature flag (OFF by default):
 *
 *  - This file owns the ONE typed ticker list of ~50 world-leading
 *    companies (Nvidia, Microsoft, Apple, SAP, ASML, LVMH, Toyota, Sony,
 *    …). Add or remove a row here and every consumer (UI, adapter,
 *    fixtures, the future cron rung) follows automatically.
 *  - The adapter STUB (adapter.ts) carries a zod contract for EODHD's
 *    /api/eod/{symbol} response + unit tests against fixtures. Zero
 *    live calls; the daily pipeline never invokes it while the flag is
 *    off. Flipping the flag (the future paid plan) is a one-line change
 *    in apps/web/src/components/insights/config/companies.ts and — when
 *    the owner is ready — wiring a `companies` fetch rung on the markets
 *    worker (bulk-last-day per exchange, or per-symbol EOD split across
 *    the budget). See ROUND10_REPORT.md R10-3 for the flip procedure.
 *
 * Platform-free (AGENTS.md rule 2): pure data, no fetch, no clock, no
 * node:* — imported identically by the currena-markets Worker, the
 * runner scripts, the SPA and unit tests.
 *
 * Latin script only (R10-3 task): the company `name` carries the
 * publisher's own Latin name (no transliteration in the config); the fa
 * UI surfaces localize the column HEADERS, not the names. Numbers stay
 * LTR inside the RTL fa flow (RULES.md §5).
 */

/**
 * The exchange code carries:
 *  - the EODHD EXCHANGE code (the `.EXCHANGE` suffix on a ticker — used
 *    verbatim in the EOD endpoint URL);
 *  - a short Latin display label for the UI's "Exchange" column
 *    (e.g. "NASDAQ", "XETRA", "TSE", "LSE") — kept Latin in BOTH locales
 *    (exchange names are proper nouns; the fa dictionary carries the
 *    localized headers only).
 *
 * The list is the owner's R9-09 sample expanded to ~50 names — every
 * G7 + major Asian exchange represented, one ticker per company, no
 * ADR duplicates. Sorted alphabetically by ticker for stable display
 * (the UI re-sorts by daily change at render time).
 */
export interface CompanyDefinition {
  /** EODHD ticker, exchange-suffixed (the exact /api/eod/{symbol} value). */
  ticker: string;
  /** Latin-script company name (publisher's own; never transliterated). */
  name: string;
  /** Exchange code (Latin; same in both locales — proper noun). */
  exchange: CompanyExchangeId;
}

/** The exchange ids the table carries (the UI's exchange-column short label). */
export type CompanyExchangeId =
  | 'NASDAQ'
  | 'NYSE'
  | 'XETRA'
  | 'EPA' // Euronext Paris
  | 'LSE'
  | 'AMS' // Euronext Amsterdam
  | 'TSE' // Tokyo
  | 'HKG' // Hong Kong
  | 'SSE' // Shanghai
  | 'KRX' // Korea
  | 'TPEX' // Taipei
  | 'SWX' // SIX Swiss
  | 'MIL' // Borsa Italiana
  | 'TSX' // Toronto
  | 'BSE' // Bombay
  | 'NSE' // National Stock Exchange of India
  | 'ASX' // Australian Securities Exchange
  | 'SAO' // B3 (São Paulo)
  | 'KLS' // Bursa Malaysia
;

/** The Latin display labels for the Exchange column (same in EN + fa). */
export const COMPANY_EXCHANGE_LABELS: Readonly<Record<CompanyExchangeId, string>> = {
  NASDAQ: 'NASDAQ',
  NYSE: 'NYSE',
  XETRA: 'XETRA',
  EPA: 'EPA',
  LSE: 'LSE',
  AMS: 'AMS',
  TSE: 'TSE',
  HKG: 'HKG',
  SSE: 'SSE',
  KRX: 'KRX',
  TPEX: 'TPEX',
  SWX: 'SWX',
  MIL: 'MIL',
  TSX: 'TSX',
  BSE: 'BSE',
  NSE: 'NSE',
  ASX: 'ASX',
  SAO: 'SAO',
  KLS: 'KLS',
};

/**
 * ~50 world-leading companies (R10-3). One ticker per company; sorted
 * alphabetically by ticker for stable display. The owner's R9-09 sample
 * (Nvidia, Microsoft, Apple, SAP, ASML, LVMH, Toyota, Sony, …) sits at
 * the top of its letter group.
 *
 * The EODHD ticker suffixes were probed against the live API on
 * 2026-10-27 (the R9-09 audit) — `AAPL.US` and `SAP.XETRA` both
 * returned real daily bars. The full list below will be re-verified
 * against the live API when the flag flips on; the zod contract
 * (adapter.ts) catches any ticker the API rejects before it reaches
 * the page.
 */
export const COMPANIES: readonly CompanyDefinition[] = [
  // ── United States (NASDAQ + NYSE) ──────────────────────────────────
  { ticker: 'AAPL.US', name: 'Apple', exchange: 'NASDAQ' },
  { ticker: 'AMZN.US', name: 'Amazon', exchange: 'NASDAQ' },
  { ticker: 'AVGO.US', name: 'Broadcom', exchange: 'NASDAQ' },
  { ticker: 'BRK-B.US', name: 'Berkshire Hathaway', exchange: 'NYSE' },
  { ticker: 'COST.US', name: 'Costco', exchange: 'NASDAQ' },
  { ticker: 'GOOGL.US', name: 'Alphabet', exchange: 'NASDAQ' },
  { ticker: 'JPM.US', name: 'JPMorgan Chase', exchange: 'NYSE' },
  { ticker: 'LLY.US', name: 'Eli Lilly', exchange: 'NYSE' },
  { ticker: 'META.US', name: 'Meta', exchange: 'NASDAQ' },
  { ticker: 'MSFT.US', name: 'Microsoft', exchange: 'NASDAQ' },
  { ticker: 'NVDA.US', name: 'Nvidia', exchange: 'NASDAQ' },
  { ticker: 'TSLA.US', name: 'Tesla', exchange: 'NASDAQ' },
  { ticker: 'UNH.US', name: 'UnitedHealth', exchange: 'NYSE' },
  { ticker: 'V.US', name: 'Visa', exchange: 'NYSE' },
  // ── Europe (XETRA, Euronext, LSE, Swiss, Italian) ─────────────────
  { ticker: 'ASML.AMS', name: 'ASML Holding', exchange: 'AMS' },
  { ticker: 'BATS.LSE', name: 'British American Tobacco', exchange: 'LSE' },
  { ticker: 'BAYN.XETRA', name: 'Bayer', exchange: 'XETRA' },
  { ticker: 'BNP.PA', name: 'BNP Paribas', exchange: 'EPA' },
  { ticker: 'DTE.XETRA', name: 'Deutsche Telekom', exchange: 'XETRA' },
  { ticker: 'LIN.XETRA', name: 'Linde', exchange: 'XETRA' },
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy Louis Vuitton', exchange: 'EPA' },
  { ticker: 'NOVO-B.CO', name: 'Novo Nordisk', exchange: 'KLS' },
  { ticker: 'NOVN.SW', name: 'Novartis', exchange: 'SWX' },
  { ticker: 'OR.PA', name: "L'Oréal", exchange: 'EPA' },
  { ticker: 'RIO.LSE', name: 'Rio Tinto', exchange: 'LSE' },
  { ticker: 'SAP.XETRA', name: 'SAP', exchange: 'XETRA' },
  { ticker: 'SIE.XETRA', name: 'Siemens', exchange: 'XETRA' },
  { ticker: 'SHEL.LSE', name: 'Shell', exchange: 'LSE' },
  { ticker: 'TIT.MI', name: 'Eni', exchange: 'MIL' },
  { ticker: 'TTE.PA', name: 'TotalEnergies', exchange: 'EPA' },
  { ticker: 'NESN.SW', name: 'Nestlé', exchange: 'SWX' },
  // ── Japan + Asia (ex-China) ────────────────────────────────────────
  { ticker: '7203.T', name: 'Toyota Motor', exchange: 'TSE' },
  { ticker: '6758.T', name: 'Sony Group', exchange: 'TSE' },
  { ticker: '8306.T', name: 'Mitsubishi UFJ Financial', exchange: 'TSE' },
  { ticker: '9984.T', name: 'SoftBank Group', exchange: 'TSE' },
  { ticker: '005930.KS', name: 'Samsung Electronics', exchange: 'KRX' },
  { ticker: '1299.HK', name: 'AIA Group', exchange: 'HKG' },
  { ticker: '0700.HK', name: 'Tencent', exchange: 'HKG' },
  { ticker: '2330.TW', name: 'TSMC', exchange: 'TPEX' },
  // ── China (Shanghai + Hong Kong dual listings) ────────────────────
  { ticker: '600519.SS', name: 'Kweichow Moutai', exchange: 'SSE' },
  { ticker: '601318.SS', name: 'Ping An Insurance', exchange: 'SSE' },
  { ticker: '601398.SS', name: 'ICBC', exchange: 'SSE' },
  // ── India ──────────────────────────────────────────────────────────
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE' },
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE' },
  // ── Other Asia-Pacific ─────────────────────────────────────────────
  { ticker: 'BHP.AX', name: 'BHP Group', exchange: 'ASX' },
  { ticker: 'CSL.AX', name: 'CSL', exchange: 'ASX' },
  // ── Americas (ex-US) ───────────────────────────────────────────────
  { ticker: 'RY.TO', name: 'Royal Bank of Canada', exchange: 'TSX' },
  { ticker: 'VALE.SA', name: 'Vale', exchange: 'SAO' },
  { ticker: 'PETR4.SA', name: 'Petrobras', exchange: 'SAO' },
] as const;

/** The number of companies on file (the UI's intro line cites it). */
export const COMPANIES_COUNT = COMPANIES.length;

/** Lookup helper: the company definition for a ticker (throws if absent). */
export function companyByTicker(ticker: string): CompanyDefinition {
  const found = COMPANIES.find((c) => c.ticker === ticker);
  if (found === undefined) {
    throw new Error(`companies: no ticker "${ticker}" in the config (R10-3)`);
  }
  return found;
}

/** All exchange ids referenced by the config (used by the UI's column header). */
export const COMPANY_EXCHANGES_USED: readonly CompanyExchangeId[] = Array.from(
  new Set(COMPANIES.map((c) => c.exchange)),
);
