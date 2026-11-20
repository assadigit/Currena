/**
 * gold-content-core.ts — the shared types + the canonical id unions of the
 * gold indicator content module (S5 M1, the GUX program's content
 * foundation).
 *
 * The records themselves live in the four data files:
 *
 *   - `gold-content-brief-en.ts` / `gold-content-brief-fa.ts` — the EAGER
 *     tier (plainLabel + defaultCopy for the 37 lane voters only; what the
 *     closed cards and the BriefingCard reason rows render before anything
 *     is opened).
 *   - `gold-content-deep-en.ts` / `gold-content-deep-fa.ts` — the LAZY tier
 *     (all 52 records: the ten content dimensions of 09, loaded only when
 *     a details panel opens).
 *
 * Every string in those files is transcribed byte-faithful from
 * `docs/gold-redesign/09-indicator-explanations-fa-en.md` (Session 3's
 * authored records) under the field contract of
 * `docs/gold-redesign/08-indicator-content-schema.md` §3 — NO re-authoring;
 * the 09 records are the content of record. The accessor is
 * `gold-content.ts`; the module is not yet consumed by any component (the
 * M3/M4 milestones wire it).
 *
 * The id lists are the CANONICAL engine ids (never invented or renamed —
 * the financial-model protection §9.3). The 37 voter ids follow the
 * engine's `GOLD_LANE_VOTERS` order exactly; `gold-content.test.ts` pins
 * that parity against the engine at test time. The 11 context ids and the
 * 4 blocked ids follow 09 §4/§5.
 */

/* ------------------------------------------------------------------ *
 * The canonical id unions
 * ------------------------------------------------------------------ */

/** The 37 lane-voter record ids (09 §3; the engine's GOLD_LANE_VOTERS order). */
export const GOLD_VOTER_IDS = [
  'real-yield-10y',
  'us10y',
  'us30y',
  'fed-target',
  'fed-expectations',
  'ecb-dfr',
  'real-yield-5y',
  'dollar-basket',
  'usdjpy',
  'us-japan-10y-gap',
  'usd-reserve-share',
  'nyfed-custody',
  'dollar-broad',
  'dollar-eme',
  'stress-stlfsi',
  'nfci',
  'vix',
  'gold-silver',
  'term-premium-10y',
  'ebp',
  'michigan-sentiment',
  'gpr-daily',
  'epu-us',
  'sp500-breadth-ratio',
  'bank-stress',
  'us-cpi-yoy',
  'us-pce-core-yoy',
  'euro-hicp',
  'breakeven-5y5y',
  'breakeven-tilt',
  't5yie',
  'michigan-1y-expectations',
  'm2-us',
  'us-deficit-12m',
  'michigan-5y-expectations',
  'cftc-gold-positioning',
  'cftc-gold-gross-long',
] as const;

export type GoldVoterId = (typeof GOLD_VOTER_IDS)[number];

/** The 11 non-voter present readings (09 §4, the context homes). */
export const GOLD_CONTEXT_RECORD_IDS = [
  'gold-usd',
  'gold-btc',
  'gold-aud',
  'gold-oil-ratio',
  'gold-platinum',
  'real-gold-price',
  'copper-gold',
  'gold-equities-ratio',
  'sge-gold-withdrawals',
  'swiss-gold-flow',
  'shanghai-gold-premium',
] as const;

export type GoldContextRecordId = (typeof GOLD_CONTEXT_RECORD_IDS)[number];

/** The 4 licence-blocked absentees (09 §5 — the honest-disclosure records). */
export const GOLD_BLOCKED_RECORD_IDS = [
  'wgc-etf-holdings',
  'wgc-cb-demand',
  'official-gold-demand',
  'etf-short-interest',
] as const;

export type GoldBlockedRecordId = (typeof GOLD_BLOCKED_RECORD_IDS)[number];

/** All 52 indicator record ids (voters + context + blocked, 09's own order). */
export const GOLD_RECORD_IDS = [
  ...GOLD_VOTER_IDS,
  ...GOLD_CONTEXT_RECORD_IDS,
  ...GOLD_BLOCKED_RECORD_IDS,
] as const;

export type GoldRecordId = (typeof GOLD_RECORD_IDS)[number];

/* ------------------------------------------------------------------ *
 * The record shapes
 * ------------------------------------------------------------------ */

/**
 * The brief (default-tier) record: what a closed card / reason row shows
 * before anything is opened (08 §4's Default tier: the plain label + the
 * one-to-two-sentence default copy).
 */
export interface GoldBriefRecord {
  /** The audience-facing plain label (09's identity line). */
  plainLabel: string;
  /** The default tier's 1–2 sentence explanation (09's default copy). */
  defaultCopy: string;
}

/** The eager brief map: exactly the 37 voter ids, no more, no less. */
export type GoldBriefMap = Record<GoldVoterId, GoldBriefRecord>;

/**
 * The deep record for a lane voter (09 §3). The measurement-line values
 * (unit · referencePeriod · firingRule · source) and relations are
 * locale-neutral; the explanation fields are authored per locale. 09's
 * combined "What/Why" dimension rides as ONE field (`whatWhy`).
 */
export interface GoldVoterDeepRecord {
  plainLabel: string;
  defaultCopy: string;
  /** The recognized technical name (always secondary to plainLabel). */
  techName: string;
  /** The display unit exactly as the page renders it (the CSV rule_or_unit). */
  unit: string;
  /** The historical reference the position/percentile uses. */
  referencePeriod: string;
  /** How the seat fires: the 30-day move threshold or the level-only band rule. */
  firingRule: string;
  /** The named source at point of use. */
  source: string;
  /** What it measures + why it matters for gold (09's combined What/Why). */
  whatWhy: string;
  /** What a higher reading may mean, written through the seat's polarity. */
  rises: string;
  /** The mirror of `rises`. */
  falls: string;
  /** The everyday analogy — present on exactly the nine records 09 authored one for. */
  analogy?: string;
  /** What the selected visual shows and what to notice. */
  visualReading: string;
  /** The conventional relationships (the R-ids of 10-indicator-relationship-map.md). */
  relations: string[];
}

/**
 * The deep record for a context reading (09 §4): never votes, so no
 * firing rule; the state vocabulary is value + decade position +
 * freshness. 09 gives rises/falls copy for every context record (framed
 * as the comparison, never a directional gold claim) — typed optional
 * because the schema allows a context record without one.
 */
export interface GoldContextDeepRecord {
  plainLabel: string;
  defaultCopy: string;
  techName: string;
  unit: string;
  referencePeriod: string;
  source: string;
  whatWhy: string;
  rises?: string;
  falls?: string;
  analogy?: string;
  visualReading: string;
  relations: string[];
}

/**
 * The deep record for a licence-blocked absentee (09 §5): renders nowhere
 * as data; the fields explain what the indicator WOULD show and why it
 * cannot (the honesty-first discipline — never a fake neutral). 09
 * authored the fa side of `whyItMatters` (and the fa label); the other
 * passages are EN-sourced and ride both locale files verbatim.
 */
export interface GoldBlockedDeepRecord {
  plainLabel: string;
  /** What the indicator would show if it could be served. */
  whatItWouldShow: string;
  /** Why it matters for gold (09's EN field; the fa file carries 09's fa summary). */
  whyItMatters: string;
  /** Why it is blocked / the honest disclosure (the licence/dead-source/no-venue reason). */
  blockedReason: string;
  /** The owner's lever to unblock it (the revival/licence path 09 names). */
  ownerLever: string;
  relations: string[];
}

export type GoldDeepRecord = GoldVoterDeepRecord | GoldContextDeepRecord | GoldBlockedDeepRecord;

/** The lazy deep map: exactly the 52 record ids, no more, no less. */
export type GoldDeepMap = Record<GoldRecordId, GoldDeepRecord>;

/** The module's two locales (runtime renders only the selected one — 08 §9.2). */
export type GoldLocale = 'en' | 'fa';
