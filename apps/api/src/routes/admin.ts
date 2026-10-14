/**
 * The zero-JS /admin console routes (Phase 6 origin; Phase 3 split of the
 * former index.ts monolith): GET renders the console (or the view gate),
 * POST handles the no-JS form (sign-in / manual refresh, PRG flash).
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import {
  ADMIN_HEADERS,
  ADMIN_VIEW_COOKIE,
  adminViewToken,
  renderAdminGate,
  renderAdminNotice,
  renderAdminPage,
  type AdminBanner,
} from '../admin';
import { parseSourceParam } from '../http';
import { clientIp, rateLimitTake, rateLimitRetryAfterSec, secretMatches } from '../security';
import { RatesService, RatesServiceError } from '../rates-service';
import type { Bindings } from '../index';

interface AdminRouteDeps {
  /** Service construction (route tests inject a fake ladder). */
  makeService: (env: Bindings) => RatesService;
  /** Insights freshness reader (the console's optional telemetry card). */
  getInsightsReader: (env: Bindings) => import('@currena/insights/store').InsightsReader;
}

/** The no-JS admin form is well under 1 KB; 8 KB is a generous cap. */
const MAX_ADMIN_BODY_BYTES = 8192;

export function createAdminRoutes(deps: AdminRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  /** Shared page render: status report + cached snapshots, escaped HTML. */
  async function renderAdmin(
    c: Context<{ Bindings: Bindings }>,
    opts: {
      refreshed?: 'tgju' | 'frankfurter';
      error?: AdminBanner;
      status?: 200 | 401 | 413;
    } = {},
  ) {
    const service = deps.makeService(c.env);
    // Store-failure honesty (QA audit A-3): every read here degrades
    // independently — a KV failure must never take the whole ops console
    // down (the console is the tool you reach for BECAUSE something is
    // wrong). Snapshot cards simply render as "no snapshot".
    const [report, tgju, frankfurter, insights] = await Promise.all([
      service.status(),
      service.snapshot('tgju').catch(() => undefined),
      service.snapshot('frankfurter').catch(() => undefined),
      // Insights freshness is optional telemetry — a failed read (broken KV
      // binding, poisoned entry) must never take the whole console down;
      // the card simply omits itself when the status is absent.
      deps.getInsightsReader(c.env)
        .getStatus()
        .catch(() => undefined),
    ]);
    const html = renderAdminPage({
      report,
      snapshots: { tgju, frankfurter },
      insights,
      now: new Date(),
      publicMode: c.env.ADMIN_VIEW_SECRET === undefined,
      ...opts,
    });
    return c.html(html, opts.status ?? 200, ADMIN_HEADERS);
  }

  /** True when the request carries a valid admin view session (or gating is off). */
  async function hasAdminViewSession(c: Context<{ Bindings: Bindings }>): Promise<boolean> {
    const viewSecret = c.env.ADMIN_VIEW_SECRET;
    if (viewSecret === undefined || viewSecret === '') return true; // not gated
    const token = await adminViewToken(viewSecret);
    return getCookie(c, ADMIN_VIEW_COOKIE) === token;
  }

  app.get('/admin', async (c) => {
    if (!(await hasAdminViewSession(c))) {
      // Gate page: zero KV reads, zero operational data.
      return c.html(renderAdminGate(), 401, ADMIN_HEADERS);
    }
    // ?refreshed= is set by the POST below (PRG flash) — validated, never trusted.
    const raw = c.req.query('refreshed');
    const refreshed = raw === 'tgju' || raw === 'frankfurter' ? raw : undefined;
    return renderAdmin(c, { refreshed });
  });

  app.post('/admin', async (c) => {
    // Rate limit FIRST (BACKLOG #18): every attempt on this surface costs
    // edge + KV time, and wrong-secret guesses must not amplify. 429 comes
    // before any body read or secret work.
    const rlKey = `${clientIp(c)}#admin`;
    if (!rateLimitTake(rlKey, Date.now())) {
      return c.html(
        renderAdminNotice({
          error: {
            code: 'rate_limited',
            message: 'Too many attempts — wait a minute before trying again.',
          },
        }),
        429,
        { ...ADMIN_HEADERS, 'Retry-After': String(rateLimitRetryAfterSec(rlKey)) },
      );
    }

    // Cap the body before buffering it (the no-JS form is < 1 KB).
    const contentLength = Number(c.req.header('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_ADMIN_BODY_BYTES) {
      return c.html(
        renderAdminNotice({ error: { code: 'payload_too_large', message: 'Admin form body exceeds the size limit.' } }),
        413,
        ADMIN_HEADERS,
      );
    }

    const viewSecret = c.env.ADMIN_VIEW_SECRET;
    const gated = viewSecret !== undefined && viewSecret !== '';
    const viewOk = await hasAdminViewSession(c);

    // application/x-www-form-urlencoded body (the no-JS form).
    let form: Record<string, string | undefined> = {};
    try {
      const contentType = c.req.header('content-type') ?? '';
      if (/application\/x-www-form-urlencoded/i.test(contentType)) {
        const text = (await c.req.text()).slice(0, MAX_ADMIN_BODY_BYTES);
        const params = new URLSearchParams(text);
        form = {
          action: params.get('action') ?? undefined,
          source: params.get('source') ?? undefined,
          secret: params.get('secret') ?? undefined,
        };
      }
    } catch {
      form = {}; // fall through to validation errors below
    }

    // View-gated deployments: only the sign-in action is reachable without a
    // session, and wrong secrets render the gate (never the console).
    if (gated && !viewOk) {
      if (form.action === 'view' && form.secret !== undefined && secretMatches(form.secret, viewSecret!)) {
        setCookie(c, ADMIN_VIEW_COOKIE, await adminViewToken(viewSecret!), {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          path: '/admin',
          maxAge: 3600,
        });
        return c.redirect('/admin', 303);
      }
      return c.html(
        renderAdminGate({ error: { message: 'Missing or invalid view secret.' } }),
        401,
        ADMIN_HEADERS,
      );
    }

    const secret = c.env.REFRESH_SECRET;
    if (!secret) {
      return renderAdmin(c, {
        error: {
          code: 'refresh_not_configured',
          message: 'REFRESH_SECRET is not configured for this deployment.',
        },
      });
    }

    const source = parseSourceParam(form.source);
    if (!source) {
      return renderAdmin(c, {
        error: { message: `Invalid 'source' — must be 'tgju' or 'frankfurter'.` },
      });
    }

    const provided = form.secret ?? '';
    if (provided === '' || !secretMatches(provided, secret)) {
      // Uniform message for missing/wrong secret; no echo of the input.
      return renderAdmin(c, {
        error: { code: 'unauthorized', message: 'Missing or invalid refresh secret.' },
      });
    }

    try {
      await deps.makeService(c.env).getRates(source, { force: true });
      // PRG: redirect so a browser refresh never re-submits the form.
      return c.redirect(`/admin?refreshed=${source}`, 303);
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return renderAdmin(c, { error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });

  return app;
}
