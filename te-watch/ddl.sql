-- The TE pipeline's tables — docs/te-daily-briefing-spec.md §4.6 verbatim
-- (the Trading Economics daily gold briefing: capture + Persian
-- translation). Idempotent (CREATE TABLE IF NOT EXISTS); no existing table
-- is touched. Applied with:
--   bunx wrangler d1 execute aurum-desk --remote --file te-watch/ddl.sql
-- (run twice to prove idempotence; never re-run any seed).

CREATE TABLE IF NOT EXISTS te_briefing (
  news_id        TEXT PRIMARY KEY,             -- TE's own item id ('603757')
  published_at   TEXT NOT NULL,               -- TE's Article JSON-LD datePublished, verbatim ISO UTC
  title          TEXT NOT NULL,               -- verbatim
  body           TEXT NOT NULL,               -- verbatim, the full briefing
  source_url     TEXT NOT NULL,               -- https://tradingeconomics.com/commodity/gold/news/{id}
  author         TEXT,                        -- TE's own author field, verbatim
  fetched_at     TEXT NOT NULL,               -- when we captured it, ISO UTC
  content_hash   TEXT NOT NULL,               -- sha256 of canonicalized title + body
  status         TEXT NOT NULL DEFAULT 'ok', -- ok | structure_alert
  updated_at     TEXT                         -- bumped only on a re-store
);

CREATE TABLE IF NOT EXISTS te_briefing_fa (
  news_id       TEXT PRIMARY KEY,             -- the English parent's key
  fa_title      TEXT NOT NULL,
  fa_body       TEXT NOT NULL,               -- the briefing's Persian translation
  source_model  TEXT NOT NULL,               -- the engine that produced it (never silent)
  translated_at TEXT NOT NULL,
  content_hash  TEXT NOT NULL                 -- the ENGLISH row's hash at translation time — the freshness key
);

CREATE TABLE IF NOT EXISTS te_scrape_log (
  ts        TEXT NOT NULL,                    -- ISO UTC
  news_id   TEXT,                             -- NULL for fire-level events
  event     TEXT NOT NULL,                    -- fire | fetch-failed | stored | re-stored | translated | translate-failed | structure-alert
  detail    TEXT
);
