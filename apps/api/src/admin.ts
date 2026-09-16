/**
 * /admin — server-rendered ops stub (Phase 6, MIGRATION_CHECKLIST #21/#24).
 *
 * Zero JavaScript, zero external subresources (strict CSP), works even when
 * the SPA is broken. Shows per-source ladder status + cached snapshots and
 * offers a manual refresh form guarded by REFRESH_SECRET (same semantics as
 * POST /internal/refresh, but form-encoded so a browser can drive it).
 *
 * EVERY dynamic value is HTML-escaped — status/snapshot data comes from KV and
 * is treated as untrusted. The refresh secret is never rendered or echoed.
 */

import {
  CACHE_HARD_TTL_SEC,
  FRESH_TTL_SEC,
  MIN_SCRAPE_INTERVAL_SEC,
} from '@currena/core';
import type { Snapshot } from '@currena/core';
import type { StatusReport } from './rates-service';
import { LOCK_TTL_SEC } from './rates-service';

export interface AdminBanner {
  /** Short machine code, e.g. 'unauthorized' — rendered escaped. */
  code?: string;
  /** Human message — rendered escaped. */
  message: string;
}

export interface AdminPageData {
  report: StatusReport;
  snapshots: { tgju?: Snapshot; frankfurter?: Snapshot };
  now: Date;
  /** Validated ?refreshed= source → green flash banner. */
  refreshed?: 'tgju' | 'frankfurter';
  /** POST failure (wrong secret, upstream down, …) → red banner. */
  error?: AdminBanner;
}

/** HTML-escape a string for safe interpolation into the document. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escOpt(value: string | undefined): string {
  return value === undefined ? '—' : esc(value);
}

/** 'just now' / '42 s ago' / '3 min ago' / '2 h ago' / '4 d ago'. */
export function relTime(iso: string | undefined, now: Date): string {
  if (iso === undefined) return '—';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '—';
  const sec = Math.round((now.getTime() - ms) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3_600) return `${Math.round(sec / 60)} min ago`;
  if (sec < 86_400) return `${Math.round(sec / 3_600)} h ago`;
  return `${Math.round(sec / 86_400)} d ago`;
}

/** '2026-09-16T22:15:05.772Z · 3 min ago' — absolute + relative, both escaped. */
function stamp(iso: string | undefined, now: Date): string {
  if (iso === undefined) return '—';
  return `${esc(iso)} <span class="rel">· ${esc(relTime(iso, now))}</span>`;
}

function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return '—';
  // Raw data view: up to 8 significant digits, no grouping (ops debugging).
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 8 }).format(rate);
}

function ratesTable(snapshot: Snapshot): string {
  const rows = snapshot.rates
    .map(
      (r) => `<tr><td class="mono">${esc(r.code)}</td><td>${esc(r.name)}</td>` +
        `<td class="mono num">${esc(formatRate(r.rate))}</td>` +
        `<td>${r.unit === undefined ? '—' : esc(r.unit)}</td></tr>`,
    )
    .join('');
  return (
    `<details><summary>Show ${snapshot.rates.length} rates (base ${esc(snapshot.base)})</summary>` +
    `<div class="tablewrap"><table><thead><tr><th>code</th><th>name</th><th>rate / 1 ${esc(snapshot.base)}</th><th>unit</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div></details>`
  );
}

function sourceCard(
  source: 'tgju' | 'frankfurter',
  data: AdminPageData,
): string {
  const entry = data.report.sources.find((s) => s.source === source);
  const snapshot = data.snapshots[source];
  const status = entry?.status;
  const cache = entry?.cache;

  const pillClass = !cache?.present ? 'none' : cache.fresh ? 'ok' : 'warn';
  const pillText = !cache?.present ? 'no cache' : cache.fresh ? 'fresh' : 'stale (served with banner)';

  const cacheLine = !cache?.present
    ? '<dd>no snapshot in KV</dd>'
    : `<dd>age <span class="mono">${cache.ageSec ?? '?'}s</span> · fetched ${stamp(cache.fetchedAt, data.now)}</dd>`;

  const snapLine = !snapshot
    ? '<dd>—</dd>'
    : `<dd>base <span class="mono">${esc(snapshot.base)}</span> · <span class="mono">${snapshot.rates.length}</span> rates · ${stamp(snapshot.fetchedAt, data.now)}</dd>`;

  const errorLine = !status?.lastError
    ? ''
    : `<dt class="err">last error</dt><dd class="err mono">${esc(status.lastError.code)} — ${esc(status.lastError.message)} <span class="rel">· ${esc(relTime(status.lastError.at, data.now))}</span></dd>`;

  return `<section class="card source">
  <h2><span class="mono">${source}</span> <span class="pill ${pillClass}">${pillText}</span></h2>
  <dl>
    <dt>last success</dt><dd>${stamp(status?.lastSuccessAt, data.now)}</dd>
    <dt>last attempt</dt><dd>${stamp(status?.lastScrapeAt, data.now)}${status?.lastDurationMs !== undefined ? ` <span class="rel">· ${status.lastDurationMs} ms</span>` : ''}</dd>
    <dt>cache</dt><dd>${cacheLine}</dd>
    <dt>snapshot</dt><dd>${snapLine}</dd>
    ${errorLine}
  </dl>
  ${snapshot ? ratesTable(snapshot) : '<p class="hint">No snapshot stored — the next /api/rates request will attempt a live scrape.</p>'}
</section>`;
}

const STYLE = `
:root{color-scheme:light dark;--bg:#f6f8f7;--fg:#0f172a;--muted:#64748b;--card:#ffffff;--border:#e2e8f0;--accent:#059669;--accent-soft:#ecfdf5;--err:#dc2626;--err-soft:#fef2f2;--warn:#b45309;--warn-soft:#fffbeb;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#e2e8f0;--muted:#94a3b8;--card:#101a2c;--border:#1e293b;--accent:#34d399;--accent-soft:#06281e;--err:#f87171;--err-soft:#2a0f0f;--warn:#fbbf24;--warn-soft:#2a1f06}}
*{box-sizing:border-box}
body{margin:0;font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--fg);min-height:100vh;display:flex;flex-direction:column}
header{padding:20px 24px 16px;border-bottom:1px solid var(--border)}
.brand{font-weight:800;letter-spacing:.04em;font-size:18px}
.brand .logo{display:inline-block;width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#0d9488);color:#fff;text-align:center;line-height:26px;margin-inline-end:9px;font-size:15px}
.brand .tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent);border-radius:999px;padding:2px 10px;vertical-align:2px;margin-inline-start:10px}
.sub{color:var(--muted);font-size:13px;margin-top:6px}
main{flex:1;width:100%;max-width:1060px;margin:0 auto;padding:24px}
.grid{display:grid;gap:16px}
@media (min-width:820px){.grid{grid-template-columns:1fr 1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px 20px;margin-bottom:16px}
.card h2{margin:0 0 12px;font-size:15px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pill{font-size:11px;font-weight:700;border-radius:999px;padding:2px 10px;border:1px solid}
.pill.ok{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.pill.warn{color:var(--warn);border-color:var(--warn);background:var(--warn-soft)}
.pill.none{color:var(--err);border-color:var(--err);background:var(--err-soft)}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:13px}
dt{color:var(--muted)}
dd{margin:0;overflow-wrap:anywhere}
.mono{font-family:var(--mono);font-size:12.5px}
.rel{color:var(--muted)}
.err{color:var(--err)}
table{border-collapse:collapse;width:100%;font-size:12.5px}
th,td{text-align:start;padding:6px 10px;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.num{font-variant-numeric:tabular-nums}
.tablewrap{overflow-x:auto;margin-top:8px}
details{margin-top:12px}
summary{cursor:pointer;color:var(--accent);font-size:13px;font-weight:600;user-select:none}
summary:hover{text-decoration:underline}
form{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end}
label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted);font-weight:600}
select,input{font:inherit;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--fg);min-width:120px}
input[type=password]{width:240px}
button{font:inherit;font-weight:700;padding:12px 22px;border-radius:10px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;min-height:44px}
button:hover{filter:brightness(1.08)}
button:active{transform:translateY(1px)}
select,input{min-height:44px}
.hint{color:var(--muted);font-size:12.5px;margin:12px 0 0}
.config{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:4px}
.config .kv{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:8px 12px}
.config .kv b{display:block;font-family:var(--mono);font-size:15px;font-variant-numeric:tabular-nums}
.config .kv span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.config .kv span i{font-style:normal;text-transform:none;letter-spacing:0}
.banner{border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px;border:1px solid}
.banner.success{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.banner.error{border-color:var(--err);background:var(--err-soft);color:var(--err)}
.banner .code{font-family:var(--mono);font-size:12px;opacity:.85}
ul.planned{margin:8px 0 0;padding-inline-start:20px;color:var(--muted);font-size:13px}
ul.planned li{margin:3px 0}
footer{padding:16px 24px;border-top:1px solid var(--border);color:var(--muted);font-size:12.5px}
footer a{color:var(--accent);text-decoration:none}
footer a:hover{text-decoration:underline}
`;

/** Render the full /admin document. Pure — no platform APIs. */
export function renderAdminPage(data: AdminPageData): string {
  const banners: string[] = [];
  if (data.refreshed) {
    banners.push(
      `<div class="banner success">✓ ${esc(data.refreshed)} refreshed — snapshot served from the live scrape.</div>`,
    );
  }
  if (data.error) {
    banners.push(
      `<div class="banner error">✗ Refresh failed${data.error.code ? ` <span class="code">[${esc(data.error.code)}]</span>` : ''}: ${esc(data.error.message)}</div>`,
    );
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Currena Admin — ops console</title>
<style>${STYLE}</style>
</head>
<body>
<header>
  <div class="brand"><span class="logo">⇄</span>CURRENA<span class="tag">admin</span></div>
  <div class="sub">Operational stub (Phase 6) — per-source ladder status &amp; manual refresh. Noindex; secrets never echoed.</div>
</header>
<main>
  ${banners.join('\n  ')}
  <div class="grid">
  ${sourceCard('tgju', data)}
  ${sourceCard('frankfurter', data)}
  </div>
  <section class="card">
    <h2>Manual refresh</h2>
    <form method="post" action="/admin">
      <label>Source
        <select name="source">
          <option value="tgju">tgju</option>
          <option value="frankfurter">frankfurter</option>
        </select>
      </label>
      <label>Refresh secret
        <input type="password" name="secret" autocomplete="off" required placeholder="REFRESH_SECRET">
      </label>
      <button type="submit">Force scrape now</button>
    </form>
    <p class="hint">Bypasses the fresh-cache window and the 60 s min-scrape interval — same semantics as <span class="mono">POST /internal/refresh</span> with <span class="mono">X-Refresh-Secret</span>. The secret is compared in constant time and is never stored, logged, or echoed.</p>
  </section>
  <section class="card">
    <h2>Runtime config <span class="rel">(fallback ladder — mission §5/§6)</span></h2>
    <div class="config">
      <div class="kv"><span>fresh window</span><b>${FRESH_TTL_SEC}s</b><span><i>serve from cache, zero network</i></span></div>
      <div class="kv"><span>min scrape interval</span><b>${MIN_SCRAPE_INTERVAL_SEC}s</b><span><i>between live attempts</i></span></div>
      <div class="kv"><span>cache hard TTL</span><b>${CACHE_HARD_TTL_SEC / 86_400}d</b><span><i>stale banner until</i></span></div>
      <div class="kv"><span>scrape lock TTL</span><b>${LOCK_TTL_SEC}s</b><span><i>best-effort single-flight</i></span></div>
    </div>
    <p class="hint">IRR pairs always route to TGJU and never fall back to Frankfurter; international pairs never touch TGJU. One conversion never mixes sources.</p>
  </section>
  <section class="card">
    <h2>Planned (post-cutover)</h2>
    <ul class="planned">
      <li>Source enable/disable toggles (SourceConfig)</li>
      <li>Cloudflare Access in front of <span class="mono">/admin</span></li>
      <li>D1 rate history &amp; charts</li>
    </ul>
  </section>
</main>
<footer>Currena admin stub · <span class="mono">noindex, nofollow</span> · <a href="/">← back to the app</a></footer>
</body>
</html>`;
}

/** Shared no-store + anti-index headers for every /admin response. */
export const ADMIN_HEADERS: Readonly<Record<string, string>> = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
