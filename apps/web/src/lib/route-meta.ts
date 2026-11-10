/**
 * route-meta — the per-route document metadata (page-division S19,
 * 2026-11-12 — Phase J "Navigation, mobile & SEO polish"; the roadmap's
 * S19 scope: "meta/OG tags per page").
 *
 * The pure table the App shell's <head> effect reads: every route's
 * title key (the S1 behaviour, moved here verbatim) plus the route's
 * own description key where one exists. The nine page-division
 * destinations reuse their DICTIONARY PURPOSE lines as descriptions
 * (D-48: one wording per concept — the spec §4–§12 "Purpose" sentences
 * ARE the per-page meta descriptions, never a second copy); every
 * other route falls back to the app-wide default (app.metaDescription).
 *
 * SPA honesty (recorded as BD-S19c): this is a client-rendered SPA —
 * the tags are set on route change for every JS-executing reader
 * (browsers, the PWA, JS-aware crawlers); non-JS crawlers see the
 * static defaults in index.html, which S19 refreshed to describe the
 * whole product (the world scan + the destinations + the Toman
 * converter). True per-route server-rendered OG would need SSR —
 * out of scope by the repo's own SPA-only rule (AGENTS.md §14 rule 4).
 */

import type { TranslationKey } from './locale';
import type { RoutePath } from '../router';

export interface RouteMeta {
  /** The <title> key — the legacy "<Page> - Currena" pattern. */
  titleKey: TranslationKey;
  /** The meta/OG description key; null → the app-wide default. */
  descriptionKey: TranslationKey | null;
  /** The canonical path (also the og:url path). */
  path: string;
}

/** The per-route table. Title keys are the S1 wiring, verbatim. */
const ROUTE_META: Record<RoutePath, RouteMeta> = {
  '/': { titleKey: 'pd.global.title', descriptionKey: 'pd.global.purpose', path: '/' },
  '/gold': { titleKey: 'pd.gold.title', descriptionKey: 'pd.gold.purpose', path: '/gold' },
  '/world-markets': { titleKey: 'pd.worldMarkets.title', descriptionKey: 'pd.worldMarkets.purpose', path: '/world-markets' },
  '/currencies': { titleKey: 'pd.currencies.title', descriptionKey: 'pd.currencies.purpose', path: '/currencies' },
  '/commodities': { titleKey: 'pd.commodities.title', descriptionKey: 'pd.commodities.purpose', path: '/commodities' },
  '/usa': { titleKey: 'pd.usa.title', descriptionKey: 'pd.usa.purpose', path: '/usa' },
  '/europe': { titleKey: 'pd.europe.title', descriptionKey: 'pd.europe.purpose', path: '/europe' },
  '/asia-pacific': { titleKey: 'pd.asiaPacific.title', descriptionKey: 'pd.asiaPacific.purpose', path: '/asia-pacific' },
  '/australia': { titleKey: 'pd.australia.title', descriptionKey: 'pd.australia.purpose', path: '/australia' },
  '/insights': { titleKey: 'insights.title', descriptionKey: null, path: '/insights' },
  '/converter': { titleKey: 'converter.title', descriptionKey: null, path: '/converter' },
  '/live-rates': { titleKey: 'liveRates.title', descriptionKey: null, path: '/live-rates' },
  '/calculator': { titleKey: 'calculator.title', descriptionKey: null, path: '/calculator' },
  '/history': { titleKey: 'history.title', descriptionKey: null, path: '/history' },
  '/receipt': { titleKey: 'receipt.title', descriptionKey: null, path: '/receipt' },
  '/splitter': { titleKey: 'expenseSplitter.title', descriptionKey: null, path: '/splitter' },
  '/settle': { titleKey: 'splitSettle.title', descriptionKey: null, path: '/settle' },
  '/batch': { titleKey: 'batchConverter.title', descriptionKey: null, path: '/batch' },
  '/about': { titleKey: 'about.title', descriptionKey: null, path: '/about' },
};

/** The meta row for a route (unknown routes → the app default title). */
export function routeMetaFor(route: string): RouteMeta {
  return ROUTE_META[route as RoutePath] ?? { titleKey: 'app.name', descriptionKey: null, path: '/' };
}

/* ------------------------------------------------------------------ *
 * The <head> writers — find-or-create, idempotent (safe on every
 * route change; jsdom-friendly plain DOM).
 * ------------------------------------------------------------------ */

/** Set (or create) a <meta> tag. `attr` is 'name' or 'property'. */
export function setMetaTag(key: string, attr: 'name' | 'property', content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el === null) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Set (or create) the canonical <link>. */
export function setCanonical(url: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (el === null) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}
