/**
 * polymarket.ts — GPE R28 / F24 (2026-11-19): the Polymarket gamma-API
 * adapter — the Fed-meeting market-implied probabilities, the ONE
 * venue the card renders (docs/specs/gold-page-elevation: s8/01 R28 ·
 * s8/02 §1b row 20 · the s15 M1 §1/§2b record).
 *
 * THE KALSHI LEG DOES NOT SHIP (S15-D1): the Kalshi Developer
 * Agreement v1.1 §3 + §3.1 expressly limit API use to facilitating a
 * member's own trading and prohibit collecting/caching/storing data
 * for any other purpose or sharing it with third parties — a public
 * display card sits squarely inside both, so the pre-committed worst
 * case fired and this adapter carries the expectations strip ALONE,
 * honestly named as one venue. Display-only + attribution + link + no
 * key'd endpoints + no bulk redistribution (the s4/04 §3 ToS reading
 * posture, cited not re-litigated).
 *
 * The venue's own shapes (verified live 2026-11-19, the s15 fixtures):
 * the discovery query `events?tag_slug=fomc&closed=false` serves the
 * unclosed FOMC-tagged events; the "Fed Decision in <Month>?" events
 * carry slug `fed-decision-in-…` and exactly five Yes/No outcome
 * markets ("Will the Fed [increase|decrease] interest rates by
 * [25|50+] bps after the <Month> meeting?" / "Will there be no
 * change…"), each market's `outcomePrices[0]` being the implied
 * probability of "Yes". THE ROLLING RULE: pick the fed-decision event
 * with the NEAREST endDate — when a meeting's event closes, the venue
 * flips it to closed and the next month's event becomes the pick
 * (verified live: the December event 2026-12-10T04:59Z, then January,
 * March 2027, April 2027 all open).
 *
 * Parse halves are pure and total; the fetch half takes an INJECTED
 * fetchImpl so unit tests replay the saved payloads without touching
 * the network (AGENTS.md rule 2: web-standard fetch only, no node:*).
 */

import type { FedOutcomeMarket, FedMoveId } from '@currena/core';
import { insightsFetch } from '../../../shared/adapters/fetch-policy';
import { FormatChangedError } from '../../../shared/adapters/fetch-policy';

/** The gamma API (keyless public JSON — the S4/04 §2g verified venue). */
export const POLYMARKET_GAMMA_BASE = 'https://gamma-api.polymarket.com';

/** The public event page (the attribution link, the venue's own URL grammar). */
export function polymarketEventUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

/** The discovery query (one request; the venue's own tag taxonomy). */
export function polymarketFomcEventsUrl(): string {
  return `${POLYMARKET_GAMMA_BASE}/events?tag_slug=fomc&closed=false&limit=50`;
}

/** The adapter's failure — status + short excerpt, never a secret. */
export class PolymarketError extends Error {
  constructor(message: string) {
    super(`[polymarket] ${message}`);
    this.name = 'PolymarketError';
  }
}

/* ------------------------------------------------------------------ *
 * The pure parse halves (total, fail-closed on shape)
 * ------------------------------------------------------------------ */

/** A minimal event row as the venue serves it (the parse's input shape). */
interface GammaEventRow {
  slug?: unknown;
  title?: unknown;
  endDate?: unknown;
  active?: unknown;
  closed?: unknown;
  markets?: unknown;
}

/** A minimal market row as the venue serves it. */
interface GammaMarketRow {
  question?: unknown;
  slug?: unknown;
  outcomes?: unknown;
  outcomePrices?: unknown;
  closed?: unknown;
  active?: unknown;
  volume24hr?: unknown;
}

/** The parsed event (the wire shape's own fields, venue-verbatim). */
export interface PolymarketFedEvent {
  slug: string;
  title: string;
  endDate: string;
  url: string;
  markets: readonly FedOutcomeMarket[];
}

/** The fed-decision slug prefix (the discovery filter — verified live). */
const FED_DECISION_SLUG_PREFIX = 'fed-decision-in-';

/** The canonical move mapping (the venue's five questions → the wire's
 *  five moves; any other question shape is SKIPPED, never guessed). */
function moveOfQuestion(question: string): FedMoveId | null {
  const q = question.toLowerCase();
  if (q.includes('no change')) return 'hold';
  const up = q.includes('increase');
  const down = q.includes('decrease');
  const fifty = /\b50\+?\s*bps/.test(q) || /\b50\+? bp\b/.test(q);
  const twentyFive = /\b25\s*bps/.test(q) || /\b25 bp\b/.test(q);
  if (up && fifty) return 'hike50plus';
  if (up && twentyFive) return 'hike25';
  if (down && fifty) return 'cut50plus';
  if (down && twentyFive) return 'cut25';
  return null; // an exotic row (the venue occasionally adds them) — skipped
}

/** The venue serves its outcome arrays as JSON-ENCODED STRINGS
 *  ('["Yes", "No"]') — decode either shape (the live fixture's own
 *  mixed contract: strings at the event read, arrays at some listing
 *  shapes). Anything else fails closed. */
function decodeJsonArray(value: unknown): unknown[] | null {
  let candidate: unknown = value;
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed.startsWith('[')) return null;
    try {
      candidate = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return Array.isArray(candidate) ? candidate : null;
}

/** Parse ONE event row's markets (fail-closed per row: a market that
 *  does not carry the exact Yes/No outcome shape is skipped, never
 *  half-parsed; the event survives on its well-formed markets). */
function parseMarkets(row: GammaEventRow): FedOutcomeMarket[] {
  if (!Array.isArray(row.markets)) return [];
  const out: FedOutcomeMarket[] = [];
  for (const m of row.markets as GammaMarketRow[]) {
    if (m.closed === true || m.active === false) continue;
    const question = typeof m.question === 'string' ? m.question : null;
    const slug = typeof m.slug === 'string' ? m.slug : null;
    if (question === null || slug === null) continue;
    const move = moveOfQuestion(question);
    if (move === null) continue;
    // The venue's own outcome contract: exactly ["Yes","No"] with a price pair.
    const outcomes = decodeJsonArray(m.outcomes);
    const outcomePrices = decodeJsonArray(m.outcomePrices);
    if (outcomes === null || outcomePrices === null) continue;
    if (outcomes.length !== 2 || outcomes[0] !== 'Yes' || outcomes[1] !== 'No') continue;
    if (outcomePrices.length !== 2) continue;
    const yesRaw = outcomePrices[0];
    if (typeof yesRaw !== 'string' && typeof yesRaw !== 'number') continue;
    const yesPrice = Number(yesRaw);
    if (!Number.isFinite(yesPrice) || yesPrice < 0 || yesPrice > 1) continue;
    const volume = typeof m.volume24hr === 'number' && Number.isFinite(m.volume24hr) && m.volume24hr >= 0
      ? m.volume24hr
      : undefined;
    out.push({ move, question, slug, yesPrice, ...(volume !== undefined ? { volume24hr: volume } : {}) });
  }
  return out;
}

/**
 * Parse the discovery payload: keep the well-formed unclosed
 * fed-decision events (slug prefix + active + a valid endDate + at
 * least one mapped market). A payload whose SHAPE is wrong (not an
 * array of objects) throws FormatChangedError — the upstream-change
 * discipline; individual odd rows are skipped, never guessed.
 */
export function parseFedDecisionEvents(payload: unknown): PolymarketFedEvent[] {
  if (!Array.isArray(payload)) {
    throw new FormatChangedError('gamma /events payload is not an array');
  }
  const events: PolymarketFedEvent[] = [];
  for (const row of payload as GammaEventRow[]) {
    if (row === null || typeof row !== 'object') continue;
    const slug = typeof row.slug === 'string' ? row.slug : null;
    if (slug === null || !slug.startsWith(FED_DECISION_SLUG_PREFIX)) continue;
    if (row.closed === true || row.active === false) continue;
    const title = typeof row.title === 'string' ? row.title : null;
    const endDate = typeof row.endDate === 'string' ? row.endDate : null;
    if (title === null || endDate === null) continue;
    if (Number.isNaN(Date.parse(endDate))) continue;
    const markets = parseMarkets(row);
    if (markets.length === 0) continue;
    events.push({ slug, title, endDate, url: polymarketEventUrl(slug), markets });
  }
  return events;
}

/**
 * THE ROLLING RULE: the fed-decision event with the NEAREST endDate
 * at/after `now` (the next meeting to resolve). When every listed
 * event has already passed `now` (a stale listing between the venue's
 * own close-flip and the next listing), the SOONEST end date wins —
 * the freshest event the venue still lists, never a guess.
 */
export function pickFedEvent(events: readonly PolymarketFedEvent[], now: Date): PolymarketFedEvent | null {
  if (events.length === 0) return null;
  const nowMs = now.getTime();
  let best: PolymarketFedEvent | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const e of events) {
    const end = Date.parse(e.endDate);
    if (!Number.isFinite(end)) continue;
    // Future events score by proximity; past events score by proximity
    // plus the whole horizon (so any future event beats every past one).
    const score = end >= nowMs ? end - nowMs : end - nowMs + 4 * 365 * 86_400_000;
    if (score < bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * The fetch half (one injected-fetch request; tests replay fixtures)
 * ------------------------------------------------------------------ */

export interface PolymarketFetchDeps {
  /** Injectable fetch (tests replay the saved payloads — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests pin the rolling pick). */
  now?: Date;
}

/**
 * ONE honest request: the discovery query → the parse → the rolling
 * pick. Throws PolymarketError/FormatChangedError on transport or
 * shape failure; the caller (the rung) records the failure and keeps
 * the stored snapshot (the last-good discipline — staleness is
 * data-carried through the snapshot's own fetchedAt).
 */
export async function fetchPolymarketFedExpectations(
  deps: PolymarketFetchDeps = {},
): Promise<PolymarketFedEvent> {
  const response = await insightsFetch(polymarketFomcEventsUrl(), {}, { fetchImpl: deps.fetchImpl, timeoutMs: 15_000 });
  if (!response.ok) {
    throw new PolymarketError(`gamma events HTTP ${response.status}`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (err) {
    throw new PolymarketError(`gamma events body is not JSON (${err instanceof Error ? err.message : String(err)})`);
  }
  const events = parseFedDecisionEvents(payload);
  const picked = pickFedEvent(events, deps.now ?? new Date());
  if (picked === null) {
    throw new FormatChangedError('no unclosed fed-decision event with mapped markets in the listing');
  }
  return picked;
}
