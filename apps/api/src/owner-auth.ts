/**
 * owner-auth.ts — M-3 (RULES.md §3, T-24/U-14-API): the OWNER TOKEN surface.
 * The owner-only full export (GET /api/insights/export) and the mode switch
 * (POST /api/insights/mode) authenticate with the `INSIGHTS_OWNER_TOKEN`
 * Cloudflare secret, presented either as `Authorization: Bearer <token>`
 * (constant-time compared) or as the signed, expiring HttpOnly cookie minted
 * by POST /api/insights/owner/session (the web export menu's unlock).
 *
 * Fail closed (runbook Phase 3): when the secret is UNSET, every owner
 * endpoint answers 403 `owner_disabled` — the export is simply disabled —
 * and the PANIC_PRIVATE environment switch still works without it (that
 * path never reads this secret).
 *
 * The cookie is the structural twin of insights-auth's password session
 * (HMAC-SHA256 over a domain-separated expiry), but keyed on the OWNER TOKEN
 * and under its own cookie name — rotating the token invalidates every
 * outstanding owner session at once.
 */

import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { secretMatches } from './security';
import type { Bindings } from './index';

/** The owner session cookie (HttpOnly, Secure, SameSite=Lax, expiring). */
export const INSIGHTS_OWNER_COOKIE = 'currena_insights_owner';

/** Owner session lifetime: half a day, mirroring the password session. */
export const OWNER_SESSION_TTL_SEC = 12 * 60 * 60;

/** Domain-separation label for the HMAC (never reused elsewhere). */
const OWNER_SESSION_MSG_PREFIX = 'currena-insights-owner-session-v1:';

/** The bearer token from `Authorization: Bearer <token>` (scheme per RFC 7235). */
export function ownerBearerToken(c: Context<{ Bindings: Bindings }>): string | undefined {
  const header = c.req.header('Authorization');
  if (header === undefined) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1];
}

/** True when the owner secret is configured (fail closed otherwise). */
export function isOwnerTokenConfigured(env: Bindings): boolean {
  return env.INSIGHTS_OWNER_TOKEN !== undefined && env.INSIGHTS_OWNER_TOKEN !== '';
}

/** Constant-time bearer comparison against the configured secret. */
export function ownerTokenMatches(provided: string | undefined, env: Bindings): boolean {
  const secret = env.INSIGHTS_OWNER_TOKEN;
  if (provided === undefined || secret === undefined || secret === '') return false;
  return secretMatches(provided, secret);
}

/* ------------------------------------------------------------------ *
 * The signed owner session (the insights-auth pattern, owner-token-keyed).
 * ------------------------------------------------------------------ */

/** HMAC-SHA256 over the domain-separated expiry, keyed on the owner token. */
async function ownerSessionMac(ownerToken: string, expiryMs: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(ownerToken), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${OWNER_SESSION_MSG_PREFIX}${expiryMs}`));
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The signed, expiring token: `<expiryMs>.<hmac>`. */
export async function ownerSessionTokenFor(ownerToken: string, nowMs: number): Promise<{ token: string; maxAge: number }> {
  const expiryMs = String(nowMs + OWNER_SESSION_TTL_SEC * 1000);
  return { token: `${expiryMs}.${await ownerSessionMac(ownerToken, expiryMs)}`, maxAge: OWNER_SESSION_TTL_SEC };
}

/** Verify a presented token against the CURRENT owner token (fail closed). */
export async function verifyOwnerSessionToken(
  token: string | undefined,
  ownerToken: string,
  nowMs: number,
): Promise<boolean> {
  if (token === undefined || token.length === 0) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiryMs = token.slice(0, dot);
  if (!/^\d{13,16}$/.test(expiryMs)) return false;
  if (Number(expiryMs) <= nowMs) return false; // expired — sign in again
  const expected = await ownerSessionMac(ownerToken, expiryMs);
  return secretMatches(token.slice(dot + 1), expected);
}

/* ------------------------------------------------------------------ *
 * The shared owner-auth outcome for the export endpoint.
 * ------------------------------------------------------------------ */

export type OwnerAuthOutcome = 'ok' | 'owner_disabled' | 'unauthorized';

/**
 * The export's auth: a valid Bearer, or a valid owner session cookie.
 * 'owner_disabled' when the secret is unset (403); 'unauthorized' when it is
 * set but neither credential verifies (401). Never throws.
 */
export async function checkOwnerAuth(c: Context<{ Bindings: Bindings }>, nowMs: number): Promise<OwnerAuthOutcome> {
  const secret = c.env.INSIGHTS_OWNER_TOKEN;
  if (secret === undefined || secret === '') return 'owner_disabled';
  if (ownerTokenMatches(ownerBearerToken(c), c.env)) return 'ok';
  if (await verifyOwnerSessionToken(getCookie(c, INSIGHTS_OWNER_COOKIE), secret, nowMs)) return 'ok';
  return 'unauthorized';
}

/** The uniform 403 envelope (the export is disabled — zero data). */
export function ownerDisabledResponse(c: Context<{ Bindings: Bindings }>): Response {
  return c.json(
    { error: { code: 'owner_disabled', message: 'This feature is disabled — INSIGHTS_OWNER_TOKEN is not configured.' } },
    403,
    { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  );
}

/** The uniform 401 envelope (owner credentials required — zero data). */
export function ownerAuthRequiredResponse(c: Context<{ Bindings: Bindings }>): Response {
  return c.json(
    { error: { code: 'owner_auth_required', message: 'Owner authentication required (Authorization: Bearer <token>).' } },
    401,
    { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  );
}
