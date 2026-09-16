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
  const path = hash.replace(/^#/, '');
  if (path === '' || path === '/') return '/';
  return isRoutePath(path) ? path : '/';
}

export function currentRoute(): RoutePath {
  return parseHash(window.location.hash);
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
