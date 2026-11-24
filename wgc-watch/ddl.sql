-- The WGC pipeline's tables — docs/wgc-monthly-commentary-spec.md §4.6
-- verbatim, extended 2026-11-25 by the Persian-translation sitting (spec
-- §8's deferred phase: the additive side table wgc_commentary_fa, and the
-- two new scrape-log event values the translation step logs). Idempotent
-- (CREATE TABLE IF NOT EXISTS); no existing table is touched. Applied with:
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
  event     TEXT NOT NULL,                    -- fetch-404 | fetch-redirect-rejected | fetch-error | stored | re-stored | structure-alert | missed | skip-month | translated | translate-failed
  detail    TEXT
);

-- The Persian (Farsi) translation side table — one row per REVIEWED month,
-- written by the watch worker's translation step (wgc-watch/src/translate.ts)
-- right after the English store/re-store and refreshed through the same
-- path when WGC edits the box (the re-store). Keyed to the ENGLISH row's
-- content_hash: a stored translation serves forever until the English
-- content actually changes — the AI is never called per-request, and never
-- twice for the same content. The desk reads it strictly read-only
-- (Prisma read model WgcCommentaryFa); this app never writes it.
--
-- source_model records the engine that produced the translation (e.g.
-- '@cf/meta/m2m100-1.2b' — the bake-off record lives in AGENTS.md); an
-- engine that is not the platform model declares itself there and is
-- never silently attributed.

CREATE TABLE IF NOT EXISTS wgc_commentary_fa (
  month_key     TEXT PRIMARY KEY,             -- the REVIEWED month, 'YYYY-MM' (the English parent's key)
  fa_headline   TEXT,                          -- the headline's Persian translation; NULL when the English headline is NULL
  fa_json       TEXT NOT NULL,                 -- [{"heading":…,"body":…}] Persian, the SAME order and shape as the English highlights_json
  source_model  TEXT NOT NULL,                 -- the Workers AI model that produced it
  translated_at TEXT NOT NULL,                 -- ISO UTC — when the translation was stored
  content_hash  TEXT NOT NULL                  -- the ENGLISH row's content_hash at translation time — the freshness key
);
