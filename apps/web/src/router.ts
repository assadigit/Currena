/**
 * Tiny PATH router — zero deps, history API.
 *
 * Path routing uses `window.location.pathname` directly: the SPA
 * fallback in wrangler.jsonc (`not_found_handling: single-page-application`)
 * serves index.html for any non-asset navigation request, so every
 * internal route is a clean https://currena.ir/insights URL (no `#/`).
 * `run_worker_first` pins `/api/*`, `/admin/*`, `/internal/*` to the
 * Worker; every other navigation request resolves to the SPA shell,
 * which reads its route from `window.location.pathname` on boot. Deep
 * links (`/insights?card=us10y`, `/?from=EUR&to=GBP&amount=500`) ride
 * on `window.location.search`.
 *
 * `history.pushState` does NOT fire `popstate`, so `navigate()` notifies
 * subscribers manually after each push; `popstate` (browser Back/Forward)
 * is also wired so the store re-renders on history navigation.
 *
 * Routes (Phase 5a): converter + live-rates are live; 3–9 are stubs until 5b.
 */

import { useSyncExternalStore } from 'react';

export const ROUTES = [
  '/',
  '/live-rates',
  '/insights',
  '/calculator',
  '/history',
  '/receipt',
  '/splitter',
  '/settle',
  '/batch',
  '/about',
] as const;

export type RoutePath = (typeof ROUTES)[number];

/** Every internal route is either in ROUTES or normalizes to '/'. */
export function isRoutePath(path: string): path is RoutePath {
  return (ROUTES as readonly string[]).includes(path);
}

/**
 * Parse a pathname (optionally with a `?search`) into its route + query
 * params. Query-tolerant since the per-indicator share links (spec §10,
 * I7 #50): `/insights?card=us10y` is the /insights route with
 * `params.card === 'us10y'`. Trailing slashes tolerated
 * (`/insights/` → `/insights`); unknown paths normalize to `/`. Pure —
 * unit-tested without a DOM. A leading `#` (a stray hash from a stale
 * bookmark) is stripped so `#/insights?card=us10y` parses the same as
 * `/insights?card=us10y` — the boot guard then replaces the URL with
 * the canonical path form.
 *
 * The FIRST `?` splits the route from the query — a `?` inside a value
 * stays data (URLSearchParams keeps it verbatim).
 */
export function parseRouteAndQuery(url: string): { path: RoutePath; params: URLSearchParams } {
  const stripped = url.replace(/^#/, '');
  const qAt = stripped.indexOf('?');
  const pathPart = qAt === -1 ? stripped : stripped.slice(0, qAt);
  const queryPart = qAt === -1 ? '' : stripped.slice(qAt + 1);
  const trimmed = pathPart.length > 1 && pathPart.endsWith('/') ? pathPart.slice(0, -1) : pathPart;
  const path: RoutePath =
    trimmed === '' || trimmed === '/' ? '/' : isRoutePath(trimmed) ? trimmed : '/';
  return { path, params: new URLSearchParams(queryPart) };
}

function currentRoute(): RoutePath {
  return parseRouteAndQuery(window.location.pathname + window.location.search).path;
}

/** Query params of the current URL (Insights share links read `card`). */
export function routeQuery(): URLSearchParams {
  return parseRouteAndQuery(window.location.pathname + window.location.search).params;
}

/**
 * Boot-time guard: if the user lands on an unknown path (a stale
 * bookmark to a removed page, or a typo), silently rewrite the URL to
 * `/` via `history.replaceState` — no reload, no history entry, the
 * Converter renders under a clean address. Known routes pass through
 * untouched. Runs once on the first `useRoute` subscribe.
 */
let booted = false;
function ensureBooted(): void {
  if (booted) return;
  booted = true;
  const { path } = parseRouteAndQuery(window.location.pathname);
  if (path === '/' && window.location.pathname !== '/') {
    history.replaceState(null, '', '/');
  }
}

/** Programmatic navigation. Same-path navigation is a no-op.
 *  `pushState` does NOT fire `popstate`, so subscribers are notified
 *  directly after each push. */
export function navigate(path: string): void {
  const next = path.startsWith('/') ? path : `/${path}`;
  if (window.location.pathname + window.location.search !== next) {
    history.pushState(null, '', next);
    notify();
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  ensureBooted();
  listeners.add(onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
  };
}

/** React hook: the active route, re-rendered on popstate + navigate. */
export function useRoute(): RoutePath {
  return useSyncExternalStore(subscribe, currentRoute);
}
