/**
 * global-page-states — the Global page's load-state shapes (S3,
 * 2026-11-08). One tiny module so GlobalBoard's props stay import-light
 * (the world-sections' MarketsLoadState/FxLoadState live in component
 * modules whose import chains pull the whole insights corpus — the Global
 * chunk deliberately owns this slimmer shape instead).
 *
 * The discipline is the boards' own (lib/markets.ts, lib/fx.ts): a feed
 * never surfaces an error — `loading` paints the pulse, a failed fetch
 * with no cache resolves to `empty`, and the tile renders the honest
 * unread state (never a verdict, never a guess).
 *
 * S4 (2026-11-08) — the M-17 flag rides the type: a `ready` state may be
 * a cached copy (`fromCache`) whose stored generation time is `cachedAt`.
 * The label discipline (the projection's own, from the S4 display pass):
 * a cached copy is LABELLED exactly when it renders — the boot paint from
 * localStorage while the refresh is in flight, and the outage path where
 * a failed refresh keeps the last good copy on screen (world-markets-map-
 * spec M17, inherited from the legacy route's world-feeds: never
 * unlabelled cached data, never the "being prepared" collapse while a
 * good copy sits in the cache).
 */

export type InsightsLoadStateLike<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; value: T; fromCache?: boolean; cachedAt?: string }
  | { kind: 'empty' };
