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
}
