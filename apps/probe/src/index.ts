/**
 * currena-probe — TEMPORARY Gate-2 diagnostic worker (deleted after the
 * Path A/B decision). It exists for exactly one reason: to answer
 * "can a deployed Cloudflare Worker egress to TGJU?" with hard evidence.
 *
 * Endpoints:
 *   GET /            — worker info (which colo/country served the request)
 *   GET /probe?url=  — single allowlisted-URL probe
 *   GET /probe/all   — full battery (TGJU profiles + TGJU JSON APIs + Frankfurter control)
 *
 * No secrets, no bindings, no storage. Responses are JSON diagnostics only.
 */

const ALLOWED_HOSTS = new Set([
  'www.tgju.org',
  'tgju.org',
  'api.tgju.org',
  'call1.tgju.org',
  'api.frankfurter.dev',
  'frankfurter.dev',
]);

interface BatteryItem {
  label: string;
  url: string;
  kind: 'tgju-html' | 'tgju-json' | 'control-json';
}

/** Same battery the Gate-2 GitHub Actions probe runs — apples-to-apples evidence. */
const BATTERY: BatteryItem[] = [
  { label: 'tgju-profile-dollar', url: 'https://www.tgju.org/profile/price_dollar_rl', kind: 'tgju-html' },
  { label: 'tgju-profile-eur', url: 'https://www.tgju.org/profile/price_eur', kind: 'tgju-html' },
  { label: 'tgju-api-summary', url: 'https://api.tgju.org/v1/market/indicator/summary', kind: 'tgju-json' },
  { label: 'tgju-call1-ajax', url: 'https://call1.tgju.org/ajax.json', kind: 'tgju-json' },
  { label: 'frankfurter-latest', url: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR', kind: 'control-json' },
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface ProbeResult {
  label: string;
  url: string;
  kind: string;
  ok: boolean;
  status: number | null;
  ms: number | null;
  contentType: string | null;
  bodyLength: number;
  finalUrl: string | null;
  check: string;
  head: string;
  error: string | null;
}

async function probe(item: BatteryItem): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.text();
    const ms = Date.now() - started;
    let check: string;
    if (item.kind === 'tgju-json' || item.kind === 'control-json') {
      try {
        JSON.parse(body);
        check = 'json-ok';
      } catch {
        check = 'json-fail';
      }
    } else {
      // A real TGJU profile page mentions its own symbol and is sizeable;
      // block/challenge pages are small and generic.
      const marker = item.url.split('/').pop() ?? '';
      check = body.length > 5_000 && body.includes(marker) ? 'html-ok' : 'html-suspect';
    }
    return {
      label: item.label,
      url: item.url,
      kind: item.kind,
      ok: res.ok,
      status: res.status,
      ms,
      contentType: res.headers.get('content-type'),
      bodyLength: body.length,
      finalUrl: res.url,
      check,
      head: body.slice(0, 240).replace(/\s+/g, ' '),
      error: null,
    };
  } catch (e) {
    return {
      label: item.label,
      url: item.url,
      kind: item.kind,
      ok: false,
      status: null,
      ms: Date.now() - started,
      contentType: null,
      bodyLength: 0,
      finalUrl: null,
      check: 'fetch-error',
      head: '',
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cf = (request.cf ?? {}) as unknown as Record<string, unknown>;
    const where = { colo: cf.colo ?? null, country: cf.country ?? null, city: cf.city ?? null };

    if (url.pathname === '/') {
      return json({
        worker: 'currena-probe',
        purpose: 'Gate 2 reachability evidence (TEMPORARY)',
        where,
        time: new Date().toISOString(),
        usage: 'GET /probe?url=<allowlisted> | GET /probe/all',
        allowlisted: [...ALLOWED_HOSTS],
      });
    }

    if (url.pathname === '/probe/all') {
      const results = await Promise.all(BATTERY.map(probe));
      return json({ where, time: new Date().toISOString(), results });
    }

    if (url.pathname === '/probe') {
      const target = url.searchParams.get('url');
      if (!target) return json({ error: 'missing ?url=' }, 400);
      let parsed: URL;
      try {
        parsed = new URL(target);
      } catch {
        return json({ error: 'unparseable url' }, 400);
      }
      if (parsed.protocol !== 'https:') return json({ error: 'https only' }, 400);
      if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        return json({ error: `host not allowlisted: ${parsed.hostname}` }, 400);
      }
      const item: BatteryItem = { label: 'adhoc', url: parsed.toString(), kind: 'tgju-html' };
      const result = await probe(item);
      return json({ where, time: new Date().toISOString(), results: [result] });
    }

    return json({ error: 'not found' }, 404);
  },
};
