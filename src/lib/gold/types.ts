/**
 * Shared type contracts for the Gold Intelligence & Visual Explanation programme.
 *
 * S8 — Briefing layer: narrative sections, market snapshot, scenarios.
 * S9 — Supporting-Visuals layer: chart-ready datasets + per-visual explanations.
 *
 * The API routes (/api/briefing, /api/visuals) and the client components
 * both import from this module, so the contracts stay in lockstep.
 */

export type Sentiment = "positive" | "neutral" | "negative";
export type Impact = "high" | "medium" | "low";

/** A single headline statistic rendered in the market strip. */
export interface MarketStat {
  label: string;
  value: string;
  /** Signed delta used for directional colouring. */
  delta?: number;
  hint: string;
}

/** One of the six S8 briefing sections. */
export interface BriefingSection {
  id: SectionId;
  /** Ordinal kicker, e.g. "01 / Executive Summary". */
  kicker: string;
  /** Insight-first headline (a conclusion, not a field name). */
  title: string;
  /** 2-3 sentence narrative paragraph. */
  body: string;
  bullets: string[];
  /** -100..100 bias score — only present on the executive section. */
  bias?: number;
  /** S9 visual ids that support this section. */
  visualIds: string[];
}

export type SectionId =
  | "exec"
  | "macro"
  | "price-action"
  | "positioning"
  | "news"
  | "outlook";

export interface NewsItem {
  time: string;
  source: string;
  headline: string;
  sentiment: Sentiment;
  impact: Impact;
}

export interface Scenario {
  id: "bull" | "base" | "bear";
  label: string;
  /** Probability in percent; the three scenarios always sum to 100. */
  probability: number;
  /** Spot target in USD per ounce. */
  target: number;
  trigger: string;
  horizon: string;
}

/** Driver attribution for the daily move, in basis points. */
export interface DriverContribution {
  driver: string;
  /** Signed contribution to the day's move, in basis points. */
  bps: number;
  /** One-line human explanation of what the driver did. */
  note: string;
}

export interface PricePoint {
  date: string; // ISO date
  price: number;
  ma20?: number;
  ma50?: number;
}

export interface PriceEvent {
  date: string;
  label: string;
  sentiment: Sentiment;
}

export interface CorrelationMatrix {
  assets: string[];
  /** Row-major n x n Pearson correlations over the trailing window. */
  matrix: number[][];
  /** Window length in trading days. */
  window: number;
}

export interface VolatilitySeriesPoint {
  date: string;
  /** Annualised 20-day realised volatility, percent. */
  vol: number;
}

export interface PositioningPoint {
  date: string;
  /** COMEX managed-money net spec position, in contracts (thousands). */
  netSpecs: number;
  /** Weekly ETF flow, in tonnes. */
  etfFlow: number;
}

export interface SentimentPoint {
  date: string;
  /** Aggregated news sentiment score, -1..1. */
  score: number;
  price: number;
}

export interface ScenarioPathPoint {
  date: string;
  bull: number;
  base: number;
  bear: number;
  /** Band envelopes for the shaded fan. */
  upper: number;
  lower: number;
}

export interface SeasonalityMonth {
  month: string;
  /** Average return for that calendar month, percent. */
  avgReturn: number;
}

/** Full S9 Supporting-Visuals payload. */
export interface VisualsPayload {
  date: string;

  /** Hero price chart dataset. */
  price: {
    points: PricePoint[];
    events: PriceEvent[];
    levels: {
      support: number[];
      resistance: number[];
    };
    /** Trading days covered. */
    window: number;
  };

  /** Daily driver attribution. */
  drivers: DriverContribution[];

  /** Cross-asset correlation heatmap. */
  correlations: CorrelationMatrix;

  /** Volatility regime dataset. */
  volatility: {
    series: VolatilitySeriesPoint[];
    /** Percentile of today's vol within the trailing year. */
    percentile: number;
    regime: "subdued" | "normal" | "elevated" | "extreme";
    /** Percent levels used as reference lines. */
    p25: number;
    p75: number;
  };

  /** Positioning & flows dataset. */
  positioning: {
    series: PositioningPoint[];
    netSpecsPercentile: number;
    etfFlow4w: number;
  };

  /** News sentiment timeline dataset. */
  sentiment: {
    series: SentimentPoint[];
    today: number;
    headlineCount: number;
  };

  /** Scenario fan dataset. */
  scenarios: {
    paths: ScenarioPathPoint[];
    spot: number;
    horizonDays: number;
    summary: { id: Scenario["id"]; probability: number; target: number }[];
  };

  /** Seasonality dataset. */
  seasonality: {
    months: SeasonalityMonth[];
    /** 0-based index of the current calendar month. */
    currentMonth: number;
    note: string;
  };

  /** Insight-first chart titles, keyed by visual id. */
  insights: Record<string, string>;

  /** Dynamic "current reading" takeaways, keyed by visual id. */
  takeaways: Record<string, string>;

  /** Static-style "how to read" guidance, keyed by visual id. */
  guides: Record<string, string[]>;
}

/** Full S8 Briefing payload. */
export interface BriefingPayload {
  date: string; // YYYY-MM-DD
  generatedAt: string;
  /** "llm" when the narrative was model-written, "template" for the deterministic fallback. */
  narrativeSource: "llm" | "template";

  spot: number;
  change: { abs: number; pct: number };
  returns: { d5: number; m1: number; m3: number; ytd: number };

  stats: MarketStat[];
  sections: BriefingSection[];
  news: NewsItem[];
  scenarios: Scenario[];

  /** Aggregate bias score, -100..100. */
  bias: number;
}

/** Combined response used by the page. */
export interface DeskResponse {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
  /** S10 Roots layer: how the desk's series were served. Always present on rows built by S10+. */
  provenance?: DeskProvenance;
}

/* ------------------------------------------------------------------ */
/* S10 — Roots layer: provenance contracts                              */
/* ------------------------------------------------------------------ */

/** How the desk's price/macro series were served for a given day. */
export type DataMode = "live" | "mixed" | "modelled";

/** How a single dataset was served. */
export type DatasetMode = "live" | "live-proxy" | "modelled";

/** Provenance entry for one dataset (a market series or a modelled input). */
export interface DatasetProvenance {
  /** Registry key, e.g. "gold" or "netSpecs". */
  dataset: string;
  /** Human label, e.g. "Gold spot (XAU/USD)". */
  label: string;
  mode: DatasetMode;
  /** The EODHD symbol (or formula description) that served it, when live. */
  source?: string;
  /** Latest observation date actually used, when live. */
  asOf?: string;
  /** Honest note — proxies, derivations, or why there is no live source. */
  note?: string;
}

/** The full provenance record stored alongside a desk day. */
export interface DeskProvenance {
  /** "live" = all six price/macro series grounded; "mixed" = some; "modelled" = synthetic fallback. */
  dataMode: DataMode;
  /** The stamped desk date — the latest available trading day with live data, or the requested date when modelled. */
  asOf: string;
  /** The date the caller asked for (may differ from asOf on non-trading days). */
  requestedDate: string;
  /** When the observation store was last pulled from EODHD (ISO timestamp). */
  fetchedAt?: string;
  /** Live trading-day depth of the window the engine consumed. */
  windowDays?: number;
  /** Why the desk fell back to the deterministic engine, when it did. */
  fallbackReason?: string;
  /** Why the desk is stamped on a different day than requested (non-trading days). */
  stampNote?: string;
  /** Dataset-by-dataset record. */
  datasets: DatasetProvenance[];
}

/* ------------------------------------------------------------------ */
/* S11 — Continuity layer: track-record contracts                       */
/* ------------------------------------------------------------------ */

/** One published scenario call read back from the DeskDay cache. */
export interface ArchiveScenarioCall {
  id: Scenario["id"];
  /** Probability in percent, as published that day. */
  probability: number;
  /** Spot target in USD per ounce, as published that day. */
  target: number;
}

/**
 * The realized-outcome comparison for a live-era archived call:
 * the desk's published targets versus what gold actually printed.
 * Present only for live/mixed desk days with observed closes beyond
 * the desk day — modelled-era calls are never silently mixed in.
 */
export interface ArchiveRealized {
  /** The latest observed gold trading day this call is compared against. */
  asOf: string;
  realizedClose: number;
  /** Realized move since the desk day's own published spot, percent. */
  realizedPct: number;
  /** Each published target versus the realized close. */
  scenarioDeltas: {
    id: Scenario["id"];
    probability: number;
    target: number;
    /** The target's implied move versus the desk day's spot, percent. */
    targetPct: number;
    /** Realized close versus the target, percent (negative = target sits above spot). */
    realizedVsTargetPct: number;
  }[];
  /** Which scenario the realized close currently sits closest to. */
  closest: Scenario["id"];
}

/** One archived desk call — what the desk said that day. */
export interface ArchiveDayCall {
  date: string;
  dataMode: DataMode;
  narrativeSource: "llm" | "template";
  /** The published aggregate bias score, -100..100. */
  bias: number;
  /** The published spot (a real observed close on live-era days). */
  spot: number;
  /** The exec-section headline the desk led with that day. */
  headline: string;
  scenarios: ArchiveScenarioCall[];
  realized?: ArchiveRealized;
}

/** "Then vs now" — the viewed cached day against the desk's latest belief. */
export interface ThenVsNow {
  then: {
    date: string;
    dataMode: DataMode;
    bias: number;
    spot: number;
    headline: string;
    scenarios: ArchiveScenarioCall[];
  };
  /** Realized move since the viewed day's published spot — live-era days only. */
  realizedSince: { asOf: string; close: number; pct: number } | null;
  /** Why no realized comparison is drawn (modelled-era or not-yet-observed days). */
  realizedNote?: string;
  /** The latest cached desk day — what the desk believes today. */
  now: {
    date: string;
    dataMode: DataMode;
    bias: number;
    spot: number;
    headline: string;
  };
}

/** Explicit two-date archive comparison (?from=&to=). */
export interface DeskPairComparison {
  from: ArchiveDayCall;
  to: ArchiveDayCall;
  /** Realized gold closes on both dates, from the live observation store. */
  realizedBetween: {
    fromClose: number;
    toClose: number;
    /** The move between the two dates, percent (live observations only). */
    pct: number;
  } | null;
  note?: string;
}

/** The S11 Continuity payload served by /api/desk/continuity. */
export interface ContinuityPayload {
  /** The date the caller is viewing (may be a non-trading day). */
  viewedDate: string;
  /** The cached desk day the view stamps onto (latest cache row at or before the view). */
  effectiveDeskDate: string | null;
  /** Cached desk calls, ascending by date. */
  archive: ArchiveDayCall[];
  /** Gold observation coverage behind the realized path. */
  realizedCoverage: { from: string; to: string; observations: number } | null;
  /** The latest observed gold close — the "now" anchor for every comparison. */
  realizedNow: { asOf: string; close: number } | null;
  thenVsNow: ThenVsNow | null;
  pair: DeskPairComparison | null;
}

/* ------------------------------------------------------------------ */
/* S12 — Calibration layer: scorecard contracts                         */
/* ------------------------------------------------------------------ */

/**
 * One cached desk day as the scorecard sees it: its published calls with
 * the per-day grades. Realized grades exist only for live-era days with
 * observed evidence; every other day carries an honest exclusion note.
 */
export interface CalibrationDayRow {
  date: string;
  dataMode: DataMode;
  /** The published aggregate bias score, -100..100. */
  bias: number;
  /** The published spot (an observed close on live-era days). */
  spot: number;
  /**
   * Gold's next observed close after the desk day versus the published
   * spot, percent. Live-era days with an observed close on the day itself
   * and a next observation only; null otherwise (see exclusion).
   */
  nextMovePct: number | null;
  /** Why no next-move grade is drawn for this day. */
  nextMoveExclusion?: string;
  /** "hit" = bias sign matched the next move; "miss" = it did not; "flat" = the next move was a flat repeat; "excluded" = era/neutral rule. */
  biasOutcome: "hit" | "miss" | "flat" | "excluded";
  /** The base case's published target and its implied move off the day's spot, percent. */
  baseTarget: number;
  baseTargetPct: number;
  /** |realized close versus the base target|, percent — resolved days only (graded to-date, not at the 90-day horizon). */
  baseErrorPct: number | null;
  /** The scenario whose target the realized close sits nearest to — resolved days only. */
  closest: Scenario["id"] | null;
  /** The stated probability of the scenario that proved closest — resolved days only. */
  closestProb: number | null;
  /** The day's highest-probability scenario; null when the top probability is tied. */
  favoured: { id: Scenario["id"]; probability: number } | null;
  /** Whether the favoured scenario proved closest — resolved days with a favourite only. */
  favouredWon: boolean | null;
}

/** Bias-direction hit rate: the desk's stance sign versus gold's next observed move. */
export interface BiasDirectionScore {
  /** Live-era days graded (hits + misses; flat and excluded days are counted separately, never inside the rate). */
  sample: number;
  hits: number;
  /** Next moves that repeated the desk day's close (a flat grade — excluded from the rate, stated). */
  flat: number;
  /** Days with a zero bias (a neutral stance — excluded from the rate, stated). */
  neutralBias: number;
  /** hits / sample; null when sample is 0. */
  hitRate: number | null;
  /** Mean published bias across the graded days. */
  meanBias: number | null;
  /** The recent rolling window (last 10 graded days), when the archive has more than 10. */
  recent?: {
    windowDays: number;
    sample: number;
    hits: number;
    hitRate: number | null;
  };
}

/** Scenario-target accuracy: how close the published base case landed versus realized. */
export interface ScenarioAccuracyScore {
  /** Resolved live-era days graded. */
  sample: number;
  /** Mean |realized close versus the base target|, percent. */
  meanAbsErrorPct: number | null;
  /** Median of the same. */
  medianAbsErrorPct: number | null;
  /** Best and worst misses in the window, percent. */
  minAbsErrorPct: number | null;
  maxAbsErrorPct: number | null;
  /** The recent rolling window (last 10 resolved days), when the archive has more than 10. */
  recent?: {
    windowDays: number;
    sample: number;
    meanAbsErrorPct: number | null;
  };
}

/** One probability band of the calibration check. */
export interface CalibrationBucket {
  /** The band label, e.g. "favourite stated < 40%". */
  label: string;
  /** Days whose favourite fell in this band. */
  sample: number;
  /** Days in the band whose favourite proved closest. */
  wins: number;
  /** wins / sample; null when sample is 0. */
  winRate: number | null;
  /** Mean stated probability across the band's days. */
  meanStated: number | null;
}

/** Probability calibration: when the desk favoured a side, how often that side won. */
export interface ProbabilityCalibrationScore {
  /** Resolved live-era days with a single favourite (ties counted separately). */
  sample: number;
  favouredWins: number;
  /** favouredWins / sample; null when sample is 0. */
  favouredWinRate: number | null;
  /** Days whose top probability was tied (no favourite — excluded from the rate, stated). */
  ties: number;
  /** Mean stated probability of the favoured scenario across graded days. */
  meanFavouredProb: number | null;
  /** Mean stated probability of the scenario that proved closest — a coarse calibration gap. */
  meanWinnerProb: number | null;
  /** Stated-probability bands, fixed structure (empty bands show their zero sample). */
  buckets: CalibrationBucket[];
}

/** How the cached record splits — every score above pools only the live-era rows. */
export interface CalibrationRecordComposition {
  /** Total cached desk days. */
  cachedDays: number;
  liveDays: number;
  mixedDays: number;
  /** Modelled-era days: in the record, labelled, never in realized math. */
  modelledDays: number;
  /** Cached days whose narrative was model-written vs deterministic template. */
  llmDays: number;
  templateDays: number;
  /** Live-era days without realized evidence yet — calls still in flight. */
  inFlight: number;
  /** Earliest and latest live-era desk day, when any exist. */
  liveFrom: string | null;
  liveTo: string | null;
}

/** The S12 Calibration payload served by /api/desk/calibration. */
export interface CalibrationPayload {
  /** The date the caller is viewing (may be a non-trading day). */
  viewedDate: string;
  /** The cached desk day the view stamps onto. */
  effectiveDeskDate: string | null;
  /** The realized anchor every comparison is graded against: the latest observed gold close. */
  anchor: { asOf: string; close: number } | null;
  /** Gold observation coverage behind the realized path. */
  coverage: { from: string; to: string; observations: number } | null;
  /** The cached-record split — states what each score pools. */
  record: CalibrationRecordComposition;
  biasDirection: BiasDirectionScore;
  scenarioAccuracy: ScenarioAccuracyScore;
  probabilityCalibration: ProbabilityCalibrationScore;
  /** Per-day grades, ascending by date (every day states its era and its exclusions). */
  days: CalibrationDayRow[];
}

/* ------------------------------------------------------------------ */
/* S13 — Watch layer: rule + evaluation contracts                       */
/* ------------------------------------------------------------------ */

/** The four owner-configurable rule families the watch engine evaluates. */
export type WatchRuleKind =
  | "price-level" // gold's latest observed close crossing a level
  | "bias-flip" // the published stance changing sign or crossing a level
  | "scenario-band" // the latest base-case target / implied move crossing a level
  | "calibration"; // a rolling scorecard threshold breach

/** Per-kind selector semantics (validated server-side; see watch.ts). */
export type WatchDirection =
  | "above" // the watched value is at or past the level from below
  | "below" // the watched value is at or past the level from above
  | "cross" // price-level only: any crossing of the level, either side
  | "sign" // bias-flip only: the stance changed sign between consecutive desk days
  | "target" // scenario-band only: watch the base target's USD level
  | "implied-move"; // scenario-band only: watch the base target's implied % move

/** The calibration metrics a rule can threshold. */
export type WatchCalibrationMetric =
  | "base-miss" // rolling mean |realized − base target|, percent
  | "direction-hit-rate"; // rolling bias-direction hit rate, percent

/** A watch rule as persisted (scalar columns only — no list primitives). */
export interface WatchRuleRecord {
  id: string;
  kind: WatchRuleKind;
  label: string;
  /** USD (price/scenario target), bias points, or percent — per kind. */
  level: number;
  direction: WatchDirection;
  /** Calibration rules only: which scorecard metric is thresholded. */
  metric: WatchCalibrationMetric;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Why a rule cannot be evaluated yet — stated, never silently dropped. */
export interface WatchEvaluationGap {
  /** Machine-readable gap code. */
  code:
    | "no-observations" // the observation store has no gold closes
    | "no-live-desk-day" // no live-era cached desk day to read a stance/target from
    | "no-graded-days" // no resolved live days for a calibration metric
    | "no-prior-close" // a crossing rule needs a previous close to cross from
    | "no-prior-desk-day" // a sign-flip rule needs a previous desk day
    | "invalid"; // the stored rule failed validation (shown with its reason)
  /** Human sentence explaining the gap. */
  note: string;
}

/** The evaluated state of one rule against the persisted record. */
export interface WatchEvaluation {
  /** The rule as persisted. */
  rule: WatchRuleRecord;
  /** "triggered" = the condition holds on the latest evidence; "quiet" = it does not. */
  state: "triggered" | "quiet";
  /** The observation behind the state — the fact, the date it last held, its era, its sample. */
  statement: string;
  /** The latest value the rule watched (USD / bias points / percent). */
  watchedValue: number | null;
  /** The date the watched value was observed or published. */
  watchedDate: string | null;
  /** The previous value, when the rule is about a change (crossings and flips). */
  previousValue: number | null;
  /** The era of the evidence: live desk days only for anything touching realized prices. */
  era: "live" | "modelled" | "none";
  /** The sample size behind a rate (calibration rules); null for point observations. */
  sample: number | null;
  /** Why no state could be drawn, when it could not. */
  gap: WatchEvaluationGap | null;
  /** When this evaluation was computed (ISO timestamp). */
  evaluatedAt: string;
}

/** The S13 Watch payload served by /api/desk/watch. */
export interface WatchPayload {
  /** The date the caller is viewing (may be a non-trading day). */
  viewedDate: string;
  /** The cached desk day the view stamps onto. */
  effectiveDeskDate: string | null;
  /** Every rule (active and inactive) with its evaluation — inactive rules state they are paused. */
  rules: WatchEvaluation[];
  /** The latest observed gold close — the anchor for price rules. */
  anchor: { asOf: string; close: number } | null;
  /** The era note for the whole band: realized math pools live desk days only. */
  liveDays: number;
  modelledDays: number;
}

/* ------------------------------------------------------------------ */
/* S14 — Digest layer: the morning-read contracts                       */
/* ------------------------------------------------------------------ */

/** The day's scenario calls as the digest compresses them. */
export interface DigestScenario {
  id: Scenario["id"];
  label: string;
  /** Probability in percent, as published. */
  probability: number;
  /** Spot target in USD per ounce, as published. */
  target: number;
  /** The target's implied move off the day's own spot, percent. */
  impliedPct: number;
}

/**
 * The briefing tie-in: the latest cached desk day at or before the view —
 * its own headline, snapshot and provenance, read back from the cache.
 */
export interface DigestHeadline {
  /** The cached desk day the digest stamps onto. */
  date: string;
  /** The exec-section headline the desk led with that day. */
  headline: string;
  spot: number;
  /** The day's own published change (abs USD / percent). */
  changeAbs: number;
  changePct: number;
  /** The published aggregate bias, -100..100. */
  bias: number;
  dataMode: DataMode;
  narrativeSource: "llm" | "template";
  /** The provenance asOf stamp (the data day behind the row), when it carries one. */
  asOf: string | null;
  /** Honest note when the view stamped onto an earlier trading day. */
  stampNote: string | null;
  /** How many of the row's provenance datasets were live / live-proxy. */
  liveSeries: number;
  /** Total provenance datasets recorded on the row. */
  totalSeries: number;
  /** Why the desk fell back to the deterministic engine, when it did. */
  fallbackReason: string | null;
}

/** One fired watch trigger, quoted verbatim from the S13 evaluation. */
export interface DigestTrigger {
  id: string;
  label: string;
  kind: WatchRuleKind;
  /** The verbatim S13 statement — the fact, its dates, its era, its sample. */
  statement: string;
  era: "live" | "modelled" | "none";
  /** The sample size behind a rate, when the rule thresholds one. */
  sample: number | null;
  /** The date the watched value last held. */
  watchedDate: string | null;
}

/** The watch digest: what fired, what stayed quiet, what is paused. */
export interface DigestWatch {
  totalRules: number;
  activeCount: number;
  triggeredCount: number;
  pausedCount: number;
  /** Fired triggers, verbatim, in the watch band's triggered-first order. */
  triggers: DigestTrigger[];
  /** Labels of the active-but-quiet rules (one-line quiet summary). */
  quietLabels: string[];
}

/** The scorecard digest: the three S12 verdicts with their samples. */
export interface DigestScorecard {
  /** Bias-direction: hits/sample across graded live-era days. */
  direction: {
    hits: number;
    sample: number;
    /** hits / sample; null when sample is 0. */
    hitRate: number | null;
    /** Flat repeats — excluded from the rate, counted. */
    flat: number;
    /** Neutral-stance days — excluded from the rate, counted. */
    neutralBias: number;
  };
  /** Base-case accuracy: |latest observed close − base target|, percent, graded to-date. */
  baseMiss: {
    meanPct: number | null;
    medianPct: number | null;
    sample: number;
  };
  /** Probability calibration: the favoured scenario versus how often it proved closest. */
  probability: {
    wins: number;
    sample: number;
    /** wins / sample; null when sample is 0. */
    winRate: number | null;
    /** Tied-top days (no favourite) — excluded from the rate, counted. */
    ties: number;
  };
  /** Resolved live-era days behind the base-case grade (the verdict-cap driver). */
  resolvedDays: number;
  /** True below ten resolved days: the numbers are the record, not a verdict. */
  verdictCap: boolean;
  /** The cached-record composition every score states. */
  record: CalibrationRecordComposition;
}

/** The memory digest: the live era compressed (the S11 record, honest eras). */
export interface DigestMemory {
  /** The first live-era cached desk day — where honest realized memory begins. */
  from:
    | {
        date: string;
        bias: number;
        spot: number;
        /** The day's published base-case target, USD. */
        baseTarget: number;
      }
    | null;
  /** The latest cached desk day — the desk's current belief (its era stated). */
  to:
    | {
        date: string;
        bias: number;
        spot: number;
        baseTarget: number;
        dataMode: DataMode;
      }
    | null;
  /** Latest observed close vs the first live day's spot, percent — live evidence only. */
  realizedPct: number | null;
  realizedClose: number | null;
  realizedAsOf: string | null;
  /** Live-era cached days pooled into the memory. */
  liveDays: number;
  /** Modelled-era days in the record — counted, labelled, never pooled. */
  modelledDays: number;
  /** Total cached desk days in the archive. */
  archiveDays: number;
}

/** The S14 Digest payload served by /api/desk/digest. */
export interface DigestPayload {
  /** The date the caller is viewing (may be a non-trading day). */
  viewedDate: string;
  /** The cached desk day the view stamps onto. */
  effectiveDeskDate: string | null;
  /** When this digest was assembled (ISO timestamp). */
  generatedAt: string;
  /** The viewed desk day's own lead — null before the first cached desk day. */
  headline: DigestHeadline | null;
  /** The viewed desk day's scenario calls. */
  scenarios: DigestScenario[];
  /** The S13 watch, compressed (fired triggers verbatim). */
  watch: DigestWatch;
  /** The S12 scorecard, compressed (three verdicts, each with its n). */
  scorecard: DigestScorecard;
  /** The S11 archive, compressed (the live era, then vs now). */
  memory: DigestMemory;
  /** The latest observed gold close — the anchor behind every realized number. */
  anchor: { asOf: string; close: number } | null;
}
