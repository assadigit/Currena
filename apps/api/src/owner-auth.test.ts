/**
 * owner-auth.test.ts — M-3 (RULES.md §3): the owner token's signed session
 * cookie (the twin of insights-auth's password session, keyed on
 * INSIGHTS_OWNER_TOKEN). Pure helper coverage; the endpoint behaviour lives in
 * routes/insights-mitigations.test.ts.
 */

import { describe, expect, it } from 'vitest';
import {
  INSIGHTS_OWNER_COOKIE,
  OWNER_SESSION_TTL_SEC,
  ownerSessionTokenFor,
  verifyOwnerSessionToken,
} from './owner-auth';

const OWNER_TOKEN = 'owner-auth-test-token';

describe('the owner session token (HMAC keyed on INSIGHTS_OWNER_TOKEN)', () => {
  it('round-trips: a fresh token verifies against the same owner token', async () => {
    const now = Date.now();
    const { token, maxAge } = await ownerSessionTokenFor(OWNER_TOKEN, now);
    expect(maxAge).toBe(OWNER_SESSION_TTL_SEC);
    expect(await verifyOwnerSessionToken(token, OWNER_TOKEN, now + 1000)).toBe(true);
  });

  it('a token signed with a different owner token is refused (rotation kills old sessions)', async () => {
    const { token } = await ownerSessionTokenFor('the-old-token', Date.now());
    expect(await verifyOwnerSessionToken(token, OWNER_TOKEN, Date.now() + 1000)).toBe(false);
  });

  it('a tampered token is refused', async () => {
    const { token } = await ownerSessionTokenFor(OWNER_TOKEN, Date.now());
    const tampered = `${token.slice(0, -2)}ff`;
    expect(await verifyOwnerSessionToken(tampered, OWNER_TOKEN, Date.now() + 1000)).toBe(false);
  });

  it('an expired token is refused (12h TTL)', async () => {
    const { token } = await ownerSessionTokenFor(OWNER_TOKEN, Date.now());
    expect(await verifyOwnerSessionToken(token, OWNER_TOKEN, Date.now() + OWNER_SESSION_TTL_SEC * 1000 + 1)).toBe(false);
  });

  it('garbage/absent tokens are refused, never thrown', async () => {
    expect(await verifyOwnerSessionToken(undefined, OWNER_TOKEN, Date.now())).toBe(false);
    expect(await verifyOwnerSessionToken('', OWNER_TOKEN, Date.now())).toBe(false);
    expect(await verifyOwnerSessionToken('not-a-token', OWNER_TOKEN, Date.now())).toBe(false);
    expect(await verifyOwnerSessionToken('9999999999999.deadbeef', OWNER_TOKEN, Date.now())).toBe(false);
  });

  it('the cookie name is distinct from the password session cookie', () => {
    expect(INSIGHTS_OWNER_COOKIE).toBe('currena_insights_owner');
    expect(INSIGHTS_OWNER_COOKIE).not.toBe('currena_insights_session');
  });
});
