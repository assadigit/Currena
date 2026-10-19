/**
 * insights-auth.ts — the PRIVATE GATE (Step 3 §2.2, AC-01…AC-08; runbook
 * Phase 3). Fallback design per AC-01: Cloudflare Access is not part of the
 * owner's free setup, so the login is handled by this Worker with a password
 * stored as the `INSIGHTS_PASSWORD` secret and a signed, expiring cookie.
 *
 * Contract:
 *  - AC-02  every /api/insights* data route sits behind `requireInsightsAuth`
 *           — an unauthenticated request returns 401 with NO data.
 *  - AC-03  the 401 envelope says "Private page" and carries no values, no
 *           source names and no hints.
 *  - AC-04  no keys reach the browser: the password is only compared
 *           server-side (constant-time-ish), the cookie carries only the
 *           HMAC-signed expiry.
 *  - AC-05  authenticated responses set `Cache-Control: private, no-store`
 *           (the middleware stamps it after `next()`); the 401s themselves
 *           are `no-store` too, so no shared cache can hold even the refusal.
 *  - AC-06  `X-Robots-Tag: noindex, nofollow` on every gated response.
 *  - AC-07  owner only: one password, one cookie, no user registry.
 *  - AC-08  `SITE_MODE` env: 'private' (default) gates everything; 'public'
 *           skips the gate (content eligibility is then T-15's job, which
 *           fails the build while any displayed source is not public-ok).
 *
 * Fail closed (runbook rule 5): with `INSIGHTS_PASSWORD` UNSET the gate
 * refuses EVERY request — an unconfigured gate must never silently open.
 * OWNER_SETUP step 1 sets the secret before the first gated deploy.
 *
 * Rate limiting reuses the isolate-local bucket (security.ts) on the login
 * route — the same defense-in-depth the /admin gate uses.
 */

import { getCookie, setCookie } from 'hono/cookie';
import type { Context, MiddlewareHandler } from 'hono';
import { clientIp, rateLimitRetryAfterSec, rateLimitTake, secretMatches } from './security';
import type { AccessMode } from './access-mode';
import type { Bindings } from './index';

/** The session cookie (HttpOnly, Secure, SameSite=Lax, expiring). */
export const INSIGHTS_SESSION_COOKIE = 'currena_insights_session';

/** Session lifetime: half a day — the owner re-signs in daily at most. */
export const SESSION_TTL_SEC = 12 * 60 * 60;

/** The domain-separation label for the HMAC (never reused elsewhere). */
const SESSION_MSG_PREFIX = 'currena-insights-session-v1:';

/** The uniform 401 envelope (AC-03: neutral, zero information). */
export function privatePageResponse(c: Context<{ Bindings: Bindings }>): Response {
  return c.json(
    { error: { code: 'private_page', message: 'Private page' } },
    401,
    {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  );
}

/** HMAC-SHA256 over the domain-separated expiry, keyed by the password. */
async function sessionMac(password: string, expiryMs: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${SESSION_MSG_PREFIX}${expiryMs}`));
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The signed, expiring token: `<expiryMs>.<hmac>` (AC-01's signed cookie). */
export async function sessionTokenFor(password: string, nowMs: number): Promise<{ token: string; maxAge: number }> {
  const expiryMs = String(nowMs + SESSION_TTL_SEC * 1000);
  return { token: `${expiryMs}.${await sessionMac(password, expiryMs)}`, maxAge: SESSION_TTL_SEC };
}

/** Verify a presented token against the CURRENT password (fail closed). */
export async function verifySessionToken(token: string | undefined, password: string, nowMs: number): Promise<boolean> {
  if (token === undefined || token.length === 0) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiryMs = token.slice(0, dot);
  if (!/^\d{13,16}$/.test(expiryMs)) return false;
  if (Number(expiryMs) <= nowMs) return false; // expired — sign in again
  const expected = await sessionMac(password, expiryMs);
  // Constant-time-ish compare of the MAC half (security.ts discipline).
  return secretMatches(token.slice(dot + 1), expected);
}

/**
 * The gate middleware (AC-02/03/05/06/08 + M-5). Mount on the insights
 * sub-app so EVERY data route behind it is covered by one wrap. The gate is
 * armed by the RESOLVED ACCESS MODE (access-mode.ts — PANIC_PRIVATE / the
 * KV runtime override / ACCESS_MODE / the legacy SITE_MODE): 'public' skips
 * it (T-15 governs what may be displayed), any private signal re-arms it.
 */
export interface InsightsGateDeps {
  /** The resolved access mode for THIS request (KV-memoized, never a raw env read). */
  accessModeOf: (c: Context<{ Bindings: Bindings }>) => Promise<AccessMode>;
}

export function requireInsightsAuth(deps: InsightsGateDeps): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    // M-5/AC-08: public mode skips the gate; a private resolution re-arms it.
    if ((await deps.accessModeOf(c)) === 'public') {
      await next();
      return;
    }
    const password = c.env.INSIGHTS_PASSWORD;
    if (password === undefined || password === '') {
      // Fail closed: an unconfigured gate refuses everything (rule 5).
      return privatePageResponse(c);
    }
    const token = getCookie(c, INSIGHTS_SESSION_COOKIE);
    if (!(await verifySessionToken(token, password, Date.now()))) {
      return privatePageResponse(c);
    }
    await next();
    // AC-05: nothing an authenticated response carries may sit in a shared
    // cache; the browser keeps its own copy for the session only.
    c.header('Cache-Control', 'private, no-store');
    c.header('X-Robots-Tag', 'noindex, nofollow');
  };
}

/** The login route: POST /login {password} → sets the signed cookie. */
export function insightsLoginRateKey(ip: string): string {
  return `${ip}#insights-login`;
}

export async function handleInsightsLogin(c: Context<{ Bindings: Bindings }>): Promise<Response> {
  const password = c.env.INSIGHTS_PASSWORD;
  // Fail closed when unconfigured — the form must never reveal whether the
  // gate exists (the same neutral envelope everywhere).
  if (password === undefined || password === '') return privatePageResponse(c);
  // Rate limit FIRST (the /admin discipline): guesses are cheap, cookies are not.
  const rlKey = insightsLoginRateKey(clientIp(c));
  if (!rateLimitTake(rlKey, Date.now())) {
    return c.json(
      { error: { code: 'rate_limited', message: 'Too many attempts' } },
      429,
      { 'Cache-Control': 'no-store', 'Retry-After': String(rateLimitRetryAfterSec(rlKey)) },
    );
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return privatePageResponse(c);
  }
  const provided = (body as { password?: unknown })?.password;
  if (typeof provided !== 'string' || !secretMatches(provided, password)) {
    // Same envelope as any refusal — no hint whether the password was close.
    return privatePageResponse(c);
  }
  const { token, maxAge } = await sessionTokenFor(password, Date.now());
  setCookie(c, INSIGHTS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge,
  });
  return c.json({ ok: true }, 200, { 'Cache-Control': 'no-store' });
}
