/**
 * Router unit tests (I7 #50 — first router tests, the parse layer only).
 * House pattern: pure functions, no DOM — useRoute's external-store wiring
 * is exercised by the route smoke in every session instead.
 */

import { describe, expect, it } from 'vitest';
import { canonicalHashFor, isRoutePath, parseRouteAndQuery, ROUTES } from './router';

describe('parseRouteAndQuery', () => {
  it('parses bare routes', () => {
    expect(parseRouteAndQuery('#/live-rates').path).toBe('/live-rates');
    expect(parseRouteAndQuery('#/insights').path).toBe('/insights');
  });

  it('empty-ish hashes normalize to the converter', () => {
    expect(parseRouteAndQuery('').path).toBe('/');
    expect(parseRouteAndQuery('#').path).toBe('/');
    expect(parseRouteAndQuery('#/').path).toBe('/');
  });

  it('unknown paths normalize to the converter — with or without a query', () => {
    expect(parseRouteAndQuery('#/nope').path).toBe('/');
    expect(parseRouteAndQuery('#/nope?card=us10y').path).toBe('/');
  });

  it('carries the query of a share link through (I7 #50)', () => {
    const { path, params } = parseRouteAndQuery('#/insights?card=us10y');
    expect(path).toBe('/insights');
    expect(params.get('card')).toBe('us10y');
  });

  it('parses multi-param and empty queries', () => {
    const { params } = parseRouteAndQuery('#/insights?card=gold-usd&lang=fa');
    expect(params.get('card')).toBe('gold-usd');
    expect(params.get('lang')).toBe('fa');
    expect(parseRouteAndQuery('#/insights?').params.get('card')).toBeNull();
    expect(parseRouteAndQuery('#/insights').params.get('card')).toBeNull();
  });

  it('only the FIRST ? splits route from query (a ? inside a value stays data)', () => {
    const { path, params } = parseRouteAndQuery('#/insights?card=a?b');
    expect(path).toBe('/insights');
    expect(params.get('card')).toBe('a?b');
  });
});

describe('isRoutePath', () => {
  it('accepts every declared route and rejects queries/unknowns', () => {
    for (const route of ROUTES) expect(isRoutePath(route)).toBe(true);
    expect(isRoutePath('/insights?card=us10y')).toBe(false);
    expect(isRoutePath('/admin')).toBe(false);
  });
});

describe('canonicalHashFor (path visits — the /insights#/ fix)', () => {
  it('a known path route is adopted verbatim', () => {
    expect(canonicalHashFor('/insights', '')).toBe('#/insights');
    expect(canonicalHashFor('/live-rates', '')).toBe('#/live-rates');
    expect(canonicalHashFor('/about', '')).toBe('#/about');
  });

  it('the query of a typed/shared path url rides along (share + deep links)', () => {
    expect(canonicalHashFor('/insights', '?card=us10y')).toBe('#/insights?card=us10y');
    // Converter deep links from the address bar now work too
    expect(canonicalHashFor('/', '?from=EUR&to=IRR&amount=500')).toBe('#/?from=EUR&to=IRR&amount=500');
    // A search without the leading ? is normalised, not doubled
    expect(canonicalHashFor('/insights', 'card=us10y')).toBe('#/insights?card=us10y');
  });

  it('trailing slashes are tolerated', () => {
    expect(canonicalHashFor('/insights/', '')).toBe('#/insights');
    expect(canonicalHashFor('/live-rates/', '?x=1')).toBe('#/live-rates?x=1');
  });

  it('unknown paths and the bare root land on the converter', () => {
    expect(canonicalHashFor('/nope', '')).toBe('#/');
    expect(canonicalHashFor('/admin', '')).toBe('#/');
    expect(canonicalHashFor('/', '')).toBe('#/');
    expect(canonicalHashFor('/insights?card=us10y', '')).toBe('#/'); // query without a route path is NOT a route
  });

  it('every canonical output round-trips through the parser to the same route', () => {
    for (const route of ROUTES) {
      expect(parseRouteAndQuery(canonicalHashFor(route, '')).path).toBe(route === '/' ? '/' : route);
    }
  });
});
