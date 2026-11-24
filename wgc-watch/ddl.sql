-- The WGC pipeline's two tables — docs/wgc-monthly-commentary-spec.md
-- §4.6 verbatim. Idempotent (CREATE TABLE IF NOT EXISTS); no existing
-- table is touched. Applied with:
--   bunx wrangler d1 execute aurum-desk --remote --file wgc-watch/ddl.sql
-- (run twice to prove idempotence; never re-run any seed).

CREATE TABLE IF NOT EXISTS wgc_commentary (
  month_key       TEXT PRIMARY KEY,           -- the REVIEWED month, 'YYYY-MM'
  source_url      TEXT NOT NULL,
  headline        TEXT,                        -- e.g. 'Gold Market Commentary: Where floor art thou?'
  published_at    TEXT,                        -- WGC's own JSON-LD datePublished, verbatim
  fetched_at      TEXT NOT NULL,               -- when we captured it, ISO UTC
  highlights_json TEXT NOT NULL,               -- [{"heading":…,"body":…}] verbatim, in order
  block_variant   TEXT NOT NULL,              -- e.g. 'h2+strong-br-p'
  content_hash    TEXT NOT NULL,               -- sha256 of the canonicalized segments JSON
  status          TEXT NOT NULL DEFAULT 'ok', -- ok | missed | structure_alert
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  updated_at      TEXT
);

CREATE TABLE IF NOT EXISTS wgc_scrape_log (
  ts        TEXT NOT NULL,                    -- ISO UTC
  month_key TEXT NOT NULL,
  event     TEXT NOT NULL,                    -- fetch-404 | fetch-redirect-rejected | stored | re-stored | structure-alert | missed | skip-month
  detail    TEXT
);
