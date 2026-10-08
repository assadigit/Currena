/**
 * alerts.test.ts — parse/serialize round-trip, strict validation,
 * boundary-crossing semantics and fire-once idempotency (I14).
 */

import { describe, expect, it } from 'vitest';
import {
  ALERTS_CAP,
  crossesAlert,
  markTriggered,
  parseRateAlerts,
  serializeRateAlerts,
  type RateAlert,
} from './alerts';
import type { CurrencyCode } from './currencies';

function makeAlert(overrides: Partial<RateAlert> = {}): RateAlert {
  return {
    id: 1,
    base: 'USD' as CurrencyCode,
    quote: 'IRR' as CurrencyCode,
    direction: 'above',
    threshold: 280_000,
    createdAt: 1_790_000_000_000,
    ...overrides,
  };
}

describe('parseRateAlerts', () => {
  it('round-trips through serializeRateAlerts', () => {
    const alerts = [
      makeAlert(),
      makeAlert({ id: 2, base: 'EUR', quote: 'USD', direction: 'below', threshold: 1.05 }),
      makeAlert({ id: 3, triggeredAt: 1_790_000_500_000, triggeredRate: 281_100 }),
    ];
    expect(parseRateAlerts(serializeRateAlerts(alerts))).toEqual(alerts);
  });

  it('returns [] for null, corrupt JSON and non-array payloads', () => {
    expect(parseRateAlerts(null)).toEqual([]);
    expect(parseRateAlerts('')).toEqual([]);
    expect(parseRateAlerts('{"oops":')).toEqual([]);
    expect(parseRateAlerts('{"not":"an array"}')).toEqual([]);
  });

  it('drops invalid entries and keeps the valid ones (order preserved)', () => {
    const raw = JSON.stringify([
      makeAlert({ id: 1 }),
      { id: 2, base: 'XXX', quote: 'IRR', direction: 'above', threshold: 1, createdAt: 1 }, // unknown code
      { id: 3, base: 'USD', quote: 'USD', direction: 'above', threshold: 1, createdAt: 1 }, // same pair
      { id: 4, base: 'USD', quote: 'IRR', direction: 'sideways', threshold: 1, createdAt: 1 }, // bad direction
      { id: 5, base: 'USD', quote: 'IRR', direction: 'above', threshold: 0, createdAt: 1 }, // non-positive
      { id: 6, base: 'USD', quote: 'IRR', direction: 'above', threshold: '280k', createdAt: 1 }, // non-number
      'not an object',
      null,
      makeAlert({ id: 7, base: 'GBP', quote: 'IRR' }),
    ]);
    const parsed = parseRateAlerts(raw);
    expect(parsed.map((a) => a.id)).toEqual([1, 7]);
  });

  it('tolerates unknown extra fields (forward-compatible storage)', () => {
    const raw = JSON.stringify([
      { ...makeAlert({ id: 9 }), futureField: { nested: true }, note: 'kept silently' },
    ]);
    expect(parseRateAlerts(raw)).toHaveLength(1);
    expect(parseRateAlerts(raw)[0]?.id).toBe(9);
  });

  it('caps the list at ALERTS_CAP', () => {
    const many = Array.from({ length: ALERTS_CAP + 7 }, (_, i) => makeAlert({ id: i + 1 }));
    expect(parseRateAlerts(serializeRateAlerts(many))).toHaveLength(ALERTS_CAP);
  });

  it('rejects entries whose trigger stamps are malformed', () => {
    const raw = JSON.stringify([
      makeAlert({ id: 1, triggeredAt: Number.NaN }),
      makeAlert({ id: 2, triggeredRate: -5 }),
      makeAlert({ id: 3, triggeredAt: 5, triggeredRate: 300_000 }), // valid pair of stamps
    ]);
    expect(parseRateAlerts(raw).map((a) => a.id)).toEqual([3]);
  });
});

describe('crossesAlert', () => {
  it('above: fires at and past the threshold (inclusive boundary)', () => {
    const alert = makeAlert({ direction: 'above', threshold: 280_000 });
    expect(crossesAlert(alert, 279_999)).toBe(false);
    expect(crossesAlert(alert, 280_000)).toBe(true);
    expect(crossesAlert(alert, 300_000)).toBe(true);
  });

  it('below: fires at and under the threshold (inclusive boundary)', () => {
    const alert = makeAlert({ direction: 'below', threshold: 250_000 });
    expect(crossesAlert(alert, 250_001)).toBe(false);
    expect(crossesAlert(alert, 250_000)).toBe(true);
    expect(crossesAlert(alert, 240_000)).toBe(true);
  });

  it('never re-fires once triggeredAt is stamped (idempotency)', () => {
    const alert = markTriggered(makeAlert(), 285_000, 1_790_000_900_000);
    expect(crossesAlert(alert, 285_000)).toBe(false);
    expect(crossesAlert(alert, 1e12)).toBe(false);
  });

  it('ignores non-positive or non-finite rates', () => {
    const alert = makeAlert({ direction: 'below', threshold: 1 });
    expect(crossesAlert(alert, 0)).toBe(false);
    expect(crossesAlert(alert, Number.NaN)).toBe(false);
    expect(crossesAlert(alert, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('markTriggered', () => {
  it('stamps triggeredAt/triggeredRate immutably', () => {
    const alert = makeAlert();
    const stamped = markTriggered(alert, 281_234.5, 42);
    expect(stamped).not.toBe(alert);
    expect(alert.triggeredAt).toBeUndefined();
    expect(stamped.triggeredAt).toBe(42);
    expect(stamped.triggeredRate).toBe(281_234.5);
  });
});
