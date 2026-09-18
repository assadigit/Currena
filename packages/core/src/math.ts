/**
 * Conversion math — pure functions over validated Snapshots.
 *
 * PRECISION STRATEGY (documented choice):
 *   - Schemas, storage and API responses keep RAW IEEE-754 doubles. Nothing
 *     is ever stored pre-rounded (AGENTS.md rule 5: internal numbers are
 *     canonical; formatting happens only at render time).
 *   - Computation results are rounded to COMPUTE_SIGNIFICANT_DIGITS (12)
 *     significant digits. 12 is far above the precision any real source
 *     serves (TGJU quotes carry ≤ 7 significant digits; Frankfurter ≤ 6)
 *     so no information is lost — it only suppresses IEEE-754 noise like
 *     0.1 + 0.2 === 0.30000000000000004 and cross-rate artifacts like
 *     100 * (1 / 230500) * 230500 === 99.99999999999999.
 *   - DISPLAY rounding (currency minorUnits etc.) is a separate concern
 *     handled by format.ts, never baked into stored values.
 *
 * RATE CONVENTION (schemas.ts): rate(code) = units of `code` per 1 unit of
 * the snapshot `base`. Therefore, converting `amount` from `from` to `to`:
 *
 *     pairRate = rate(to) / rate(from)        // units of `to` per 1 `from`
 *     result   = amount * pairRate
 *
 * which reproduces the legacy API exactly (live check 2026-09-16:
 * 100 USD → IRR = 23,050,000 at rate 230,500). Note the mission brief's
 * literal `amount * (rateFrom / rateTo)` is inverted relative to its own
 * rate definition ("units of code per base") and to observed legacy
 * behavior — the implementation follows the schema definition + legacy
 * parity. Flagged in the Phase-3 worklog for the record.
 */

import { CoreError } from './errors';
import type { Rate, Snapshot, Source } from './schemas';

/** Significant digits kept in computed conversion results. */
export const COMPUTE_SIGNIFICANT_DIGITS = 12;

/**
 * Round to `sigDigits` significant digits (no-op for 0/±Infinity/NaN).
 * See the precision strategy in the module docblock.
 */
export function roundSignificant(value: number, sigDigits: number = COMPUTE_SIGNIFICANT_DIGITS): number {
  if (!Number.isFinite(value) || value === 0) return value;
  if (!Number.isInteger(sigDigits) || sigDigits < 1) {
    throw new CoreError('invalid_sig_digits', `sigDigits must be a positive integer, got ${sigDigits}`);
  }
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimals = sigDigits - 1 - exponent;
  if (decimals > 100) return value; // beyond Number.toFixed's range — keep raw
  if (decimals <= 0) {
    const factor = 10 ** -decimals;
    const scaled = value / factor;
    // Round half AWAY FROM ZERO — Math.round alone rounds ties toward +∞,
    // which rounded negative and positive ties at ≥1e12 in OPPOSITE
    // directions (off by a whole factor unit in money code).
    const rounded = scaled >= 0 ? Math.round(scaled) : -Math.round(-scaled);
    return rounded * factor;
  }
  return Number(value.toFixed(decimals));
}

/** Result of a conversion — mirrors the legacy `/api/convert` payload. */
export interface ConversionResult {
  /** Converted amount (rounded to COMPUTE_SIGNIFICANT_DIGITS). */
  amount: number;
  /** Units of the target currency per 1 unit of the source currency. */
  rate: number;
  /** Where this number came from ('local' for the same-currency short-circuit). */
  source: Source;
  /** ISO datetime of the snapshot the rate came from. */
  fetchedAt: string;
}

/** Find a Rate by code. Throws CoreError('rate_not_found') when absent. */
export function getRate(snapshot: Snapshot, code: string): Rate {
  const rate = snapshot.rates.find((r) => r.code === code);
  if (!rate) {
    throw new CoreError(
      'rate_not_found',
      `Snapshot (base ${snapshot.base}, source ${snapshot.source}, fetched ${snapshot.fetchedAt}) has no rate for ${code}`,
    );
  }
  return rate;
}

function requireFiniteAmount(amount: number): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new CoreError('invalid_amount', `amount must be a finite number, got ${String(amount)}`);
  }
}

/**
 * Convert `amount` from currency `from` to currency `to` through the
 * snapshot base. Never mixes sources (single snapshot in, single result out).
 *
 * Same-currency short-circuit (Gate 1 decision #5, 2026-09-16): `from === to`
 * returns the amount unchanged with rate 1 and source 'local' — no rate
 * lookup, no network. Amount sign is not restricted here (validation of
 * "user must enter a positive amount" is a UI concern); any finite number
 * converts.
 */
export function convert(snapshot: Snapshot, from: string, to: string, amount: number): ConversionResult {
  requireFiniteAmount(amount);

  if (from === to) {
    return { amount, rate: 1, source: 'local', fetchedAt: snapshot.fetchedAt };
  }

  const rateFrom = getRate(snapshot, from).rate;
  const rateTo = getRate(snapshot, to).rate;
  const pairRate = roundSignificant(rateTo / rateFrom);
  return {
    amount: roundSignificant(amount * pairRate),
    rate: pairRate,
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
  };
}

/** Inverse of a rate: 1/rate, rounded to COMPUTE_SIGNIFICANT_DIGITS. */
export function reverseRate(rate: number): number {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new CoreError('invalid_rate', `rate must be a positive finite number, got ${String(rate)}`);
  }
  return roundSignificant(1 / rate);
}

/** Result of a custom-rate conversion (legacy "Manual" source parity). */
export interface ManualConversionResult {
  amount: number;
  rate: number;
  source: 'manual';
}

/**
 * Convert with a user-supplied rate (legacy "Manual" source parity):
 * result = amount * rate, source 'manual'. Overrides any snapshot.
 * No `fetchedAt` — a manual rate has no snapshot timestamp; the caller
 * stamps the interaction time if it needs one.
 */
export function convertWithManualRate(amount: number, rate: number): ManualConversionResult {
  requireFiniteAmount(amount);
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new CoreError('invalid_rate', `rate must be a positive finite number, got ${String(rate)}`);
  }
  return { amount: roundSignificant(amount * rate), rate, source: 'manual' };
}
