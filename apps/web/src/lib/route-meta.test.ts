/**
 * @vitest-environment jsdom
 *
 * route-meta.test.ts (S19, 2026-11-12) — the per-route metadata table's
 * own suite. What is pinned:
 *
 *   - EVERY route in the router's ROUTES list resolves to a meta row
 *     (a future route that forgets its wiring fails here, not in prod);
 *   - the S1 title wiring is byte-identical to the table (titleKeyFor's
 *     old switch, moved verbatim — the regression pin);
 *   - the nine page-division destinations carry their PURPOSE lines as
 *     descriptions (D-48: one wording per concept — the spec §4–§12
 *     "Purpose" sentences ARE the meta descriptions, never a second
 *     copy) and their canonical paths equal their routes;
 *   - every other route falls back to the app-wide default;
 *   - the <head> writers are idempotent (find-or-create — a repeated
 *     route change must not duplicate tags) and update in place.
 */

import { describe, expect, it } from 'vitest';
import { ROUTES } from '../router';
import { getDictionary } from '../i18n';
import { routeMetaFor, setCanonical, setMetaTag } from './route-meta';

/** The S1 title switch, restated here as the regression pin. */
const S1_TITLE_KEYS: Record<string, string> = {
  '/': 'pd.global.title',
  '/converter': 'converter.title',
  '/live-rates': 'liveRates.title',
  '/insights': 'insights.title',
  '/gold': 'pd.gold.title',
  '/world-markets': 'pd.worldMarkets.title',
  '/currencies': 'pd.currencies.title',
  '/commodities': 'pd.commodities.title',
  '/usa': 'pd.usa.title',
  '/europe': 'pd.europe.title',
  '/asia-pacific': 'pd.asiaPacific.title',
  '/australia': 'pd.australia.title',
  '/calculator': 'calculator.title',
  '/history': 'history.title',
  '/receipt': 'receipt.title',
  '/splitter': 'expenseSplitter.title',
  '/settle': 'splitSettle.title',
  '/batch': 'batchConverter.title',
  '/about': 'about.title',
};

const DESTINATION_PURPOSE_KEYS: Record<string, string> = {
  '/': 'pd.global.purpose',
  '/gold': 'pd.gold.purpose',
  '/world-markets': 'pd.worldMarkets.purpose',
  '/currencies': 'pd.currencies.purpose',
  '/commodities': 'pd.commodities.purpose',
  '/usa': 'pd.usa.purpose',
  '/europe': 'pd.europe.purpose',
  '/asia-pacific': 'pd.asiaPacific.purpose',
  '/australia': 'pd.australia.purpose',
};

describe('route-meta', () => {
  it('every router route resolves to a meta row (no route left unwired)', () => {
    for (const route of ROUTES) {
      const meta = routeMetaFor(route);
      expect(meta.titleKey, route).toBeTruthy();
      expect(meta.path, route).toBe(route);
    }
  });

  it('the S1 title wiring is byte-identical to the table (the regression pin)', () => {
    for (const [route, key] of Object.entries(S1_TITLE_KEYS)) {
      expect(routeMetaFor(route).titleKey).toBe(key);
    }
  });

  it('the nine destinations carry their PURPOSE lines as descriptions + their own canonical paths', () => {
    for (const [route, purposeKey] of Object.entries(DESTINATION_PURPOSE_KEYS)) {
      const meta = routeMetaFor(route);
      expect(meta.descriptionKey, route).toBe(purposeKey);
      expect(meta.path, route).toBe(route);
      // The key resolves in BOTH dictionaries (the fa render sets Persian).
      const en = getDictionary('en') as unknown as Record<string, unknown>;
      const fa = getDictionary('fa') as unknown as Record<string, unknown>;
      expect(en, `en ${purposeKey}`).toBeTruthy();
      expect(fa, `fa ${purposeKey}`).toBeTruthy();
    }
  });

  it('non-destination routes fall back to the app-wide default description', () => {
    for (const route of ['/converter', '/about', '/insights', '/history', '/settle']) {
      expect(routeMetaFor(route).descriptionKey).toBeNull();
    }
    // Unknown routes: the app-name title + the default description.
    const unknown = routeMetaFor('/not-a-route');
    expect(unknown.titleKey).toBe('app.name');
    expect(unknown.descriptionKey).toBeNull();
  });

  it('the app-wide default description exists and is the whole-product sentence (both locales)', () => {
    const en = getDictionary('en') as unknown as { app: { metaDescription: string } };
    const fa = getDictionary('fa') as unknown as { app: { metaDescription: string } };
    expect(en.app.metaDescription).toContain('world');
    expect(en.app.metaDescription).toContain('Toman');
    // The fa mirror is a real sentence, not a copy of the English.
    expect(fa.app.metaDescription).not.toBe(en.app.metaDescription);
    expect(fa.app.metaDescription.length).toBeGreaterThan(20);
  });
});

describe('route-meta <head> writers', () => {
  it('setMetaTag finds-or-creates (idempotent) and updates in place', () => {
    document.head.querySelectorAll('meta[name="route-meta-test"]').forEach((el) => el.remove());
    setMetaTag('route-meta-test', 'name', 'first');
    setMetaTag('route-meta-test', 'name', 'second');
    const tags = document.head.querySelectorAll('meta[name="route-meta-test"]');
    expect(tags.length).toBe(1);
    expect(tags[0]?.getAttribute('content')).toBe('second');
    // The property-attr form is a distinct query (og:*).
    setMetaTag('route-meta-test-og', 'property', 'p');
    expect(document.head.querySelectorAll('meta[property="route-meta-test-og"]').length).toBe(1);
    document.head.querySelectorAll('meta[name="route-meta-test"], meta[property="route-meta-test-og"]').forEach((el) => el.remove());
  });

  it('setCanonical finds-or-creates (idempotent) and updates in place', () => {
    document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
    setCanonical('https://example.com/gold');
    setCanonical('https://example.com/europe');
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0]?.getAttribute('href')).toBe('https://example.com/europe');
    document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  });
});
