/**
 * Tiny hash router — zero deps, Capacitor/file:// friendly (mission §8).
 *
 * Hash routing keeps the SPA runnable from any origin (Workers static assets,
 * file:// in a WebView, offline precache) with no server rewrites. The SPA
 * fallback in wrangler.jsonc (`single-page-application`) still covers the rare
 * path-navigations, but everything internal stays on `#/`.
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

function parseHash(hash: string): RoutePath {
  // '#/live-rates' → '/live-rates'; '', '#', '#' → '/'
  return parseRouteAndQuery(hash).path;
}

/**
 * Pure core of the path-visit canonicalisation (2026-10-13): the hash URL a
 * hash-less visit should adopt. People type and share PATH urls —
 * https://currena.ir/insights, https://currena.ir/insights?card=us10y — and
 * crawlers (firecrawl et al.) request them without ever adding a hash. A
 * known route is adopted verbatim (with its query, so Insights share links
 * and Converter deep links work from the address bar); anything else lands
 * on the converter. Trailing slashes are tolerated ('/insights/' →
 * '/insights').
 */
export function canonicalHashFor(pathname: string, search: string): string {
  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const route = trimmed !== '/' && isRoutePath(trimmed) ? trimmed : '/';
  const query = search === '' ? '' : search.startsWith('?') ? search : `?${search}`;
  return `#${route}${query}`;
}

/**
 * Boot-time canonicalisation for hash-less PATH visits. The old boot forced
 * navigate('/'): visiting https://currena.ir/insights APPENDED a stray '#/'
 * (URL '/insights#/' rendering the converter — the wrong page under an
 * insights-looking address). Now the visit is rewritten IN PLACE — no reload,
 * no history entry — to the canonical hash url ('/#/insights'), and the
 * router is woken manually (replaceState fires no hashchange). No-ops when a
 * hash is already present (every internal navigation).
 */
export function canonicalizePathVisit(): void {
  if (window.location.hash) return;
  const target = canonicalHashFor(window.location.pathname, window.location.search);
  history.replaceState(null, '', `/${target}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/**
 * Parse a hash URL into its route + query params. Query-tolerant since the
 * per-indicator share links (spec §10, I7 #50): '#/insights?card=us10y' is
 * the /insights route with params.card === 'us10y'. Unknown paths still
 * normalize to '/'. Pure — unit-tested without a DOM.
 */
export function parseRouteAndQuery(hash: string): { path: RoutePath; params: URLSearchParams } {
  const raw = hash.replace(/^#/, '');
  const qAt = raw.indexOf('?');
  const pathPart = qAt === -1 ? raw : raw.slice(0, qAt);
  const queryPart = qAt === -1 ? '' : raw.slice(qAt + 1);
  const path: RoutePath =
    pathPart === '' || pathPart === '/' ? '/' : isRoutePath(pathPart) ? pathPart : '/';
  return { path, params: new URLSearchParams(queryPart) };
}

function currentRoute(): RoutePath {
  return parseHash(window.location.hash);
}

/** Query params of the current hash URL (I7 #50 share links read `card`). */
export function routeQuery(): URLSearchParams {
  return parseRouteAndQuery(window.location.hash).params;
}

/** Programmatic navigation. Same-path navigation is a no-op. */
export function navigate(path: string): void {
  const next = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** React hook: the active route, re-rendered on hashchange. */
export function useRoute(): RoutePath {
  return useSyncExternalStore(subscribe, currentRoute);
}
