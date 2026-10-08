/**
 * alerts.ts — rate-alert contracts and pure crossing logic (I14).
 *
 * A rate alert is a user-stored intent like "tell me when USD → IRR climbs
 * above 280,000". The whole lifecycle besides storage lives here so the
 * Worker-side, the SPA and the tests share ONE definition (same rule as
 * settle/split — platform-free by construction, no DOM, no I/O):
 *
 *   - parse/serialize: the persisted JSON shape, strictly validated —
 *     unknown entries are DROPPED, never rendered (recent-pairs rule).
 *   - crossesAlert: the crossing test, inclusive at the boundary and
 *     idempotent by construction — a triggered alert never re-fires
 *     (triggeredAt is a one-way stamp; "re-arm" = delete + recreate).
 *
 * Evaluation cadence is a web concern (checked while the app is open —
 * see the honest footer in AlertsDialog); this module only decides WHAT
 * a crossing is, given a rate.
 */

import { isCurrencyCode } from './currencies';
import type { CurrencyCode } from './currencies';

/** Which side of the threshold the user is watching. */
export type AlertDirection = 'above' | 'below';

/** The persisted alert shape (`id` is the web's monotonic uniqueId). */
export interface RateAlert {
  id: number;
  base: CurrencyCode;
  quote: CurrencyCode;
  direction: AlertDirection;
  /** Positive finite target rate (in quote units per 1 base). */
  threshold: number;
  /** Epoch ms — when the user created the alert. */
  createdAt: number;
  /** One-way stamp: set the first time the rate crossed; never reset. */
  triggeredAt?: number;
  /** The rate that fired the alert (kept for the honest status line). */
  triggeredRate?: number;
}

/** How many alerts one browser may keep (keeps the dialog list sane). */
export const ALERTS_CAP = 20;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A valid persisted entry: known codes, distinct pair, sane numbers. */
function isValidAlert(value: unknown): value is RateAlert {
  if (!(value instanceof Object)) return false;
  const a = value as Partial<RateAlert>;
  return (
    isFiniteNumber(a.id) &&
    isFiniteNumber(a.threshold) &&
    a.threshold > 0 &&
    isFiniteNumber(a.createdAt) &&
    typeof a.base === 'string' &&
    isCurrencyCode(a.base) &&
    typeof a.quote === 'string' &&
    isCurrencyCode(a.quote) &&
    a.base !== a.quote &&
    (a.direction === 'above' || a.direction === 'below') &&
    (a.triggeredAt === undefined || isFiniteNumber(a.triggeredAt)) &&
    (a.triggeredRate === undefined || (isFiniteNumber(a.triggeredRate) && a.triggeredRate > 0))
  );
}

/**
 * Parse a stored JSON payload. Anything unreadable (corrupt JSON, a
 * non-array, invalid entries, overflow past the cap) degrades to the
 * longest valid prefix — storage damage must never break the page or
 * render garbage entries (fail-open, same as recent-pairs/chart-range).
 */
export function parseRateAlerts(raw: string | null): RateAlert[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidAlert).slice(0, ALERTS_CAP);
}

/** Serialize for storage (round-trips through parseRateAlerts). */
export function serializeRateAlerts(alerts: readonly RateAlert[]): string {
  return JSON.stringify(alerts.slice(0, ALERTS_CAP));
}

/**
 * Does `rate` cross this alert right now?
 *
 * Inclusive at the boundary ("≥ 280,000" fires AT 280,000 — the number
 * the user typed is the number they care about) and idempotent: once
 * `triggeredAt` is stamped, the answer is always false. The evaluation
 * loop can therefore re-run on every snapshot generation without
 * spamming duplicate fires.
 */
export function crossesAlert(alert: RateAlert, rate: number): boolean {
  if (!Number.isFinite(rate) || rate <= 0) return false;
  if (alert.triggeredAt !== undefined) return false;
  return alert.direction === 'above' ? rate >= alert.threshold : rate <= alert.threshold;
}

/** Immutable copy with the one-way trigger stamp applied. */
export function markTriggered(alert: RateAlert, rate: number, atMs: number): RateAlert {
  return { ...alert, triggeredAt: atMs, triggeredRate: rate };
}
