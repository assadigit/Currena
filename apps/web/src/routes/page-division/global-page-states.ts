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
 */

export type InsightsLoadStateLike<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; value: T }
  | { kind: 'empty' };
