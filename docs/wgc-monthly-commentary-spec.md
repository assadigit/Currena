# The WGC monthly commentary — the Highlights spec

**Status: proposed (2026-11-24). Nothing in this document is built, deployed,
or wired into the desk yet — it is the owner-reviewed plan for the
implementing sitting.**

The owner's brief: the World Gold Council (WGC) publishes a monthly *Gold
Market Commentary* at a predictable URL; scrape its **Highlights** box —
"for now we can only scrap the highlights part" — once per month, bound to
the dates when the issue actually appears ("they might publish this with
delay"), and research those dates first ("10-20-30 pages") so the fetching
stays inside a known window. This document is that research plus the
pipeline it justifies.

---

## 1. The goal and the scope

Ingest the free Highlights box of the WGC's monthly Gold Market Commentary
into Currena — automatically, once per month, bounded to a research-backed
publication window — store it in the desk's own D1, serve it through the
desk's own API, and show it on the Persian gold page with honest state
lines. **Highlights only**: the article proper is registration-gated (the
page's own markup shows a login wall after the box) and is out of scope by
the owner's decision and by licensing discipline (§9).

What this is **not**: no full-article scraping, no chart ingestion, no
attempt to keep a mirror of gold.org. One GET per attempt, one row per
issue, one card on the page.

## 2. The source, precisely

- **Who**: the World Gold Council, gold.org — the monthly *Gold Market
  Commentary*, the series that reviews the month just ended.
- **The URL contract**:
  `https://www.gold.org/goldhub/research/gold-market-commentary-{month}-{year}`
  with the full lowercase English month name (`january` … `december`). The
  issue that reviews month *M* of year *Y* is published in the **following**
  month (§3.2 measures the delay).
- **The month key** used everywhere downstream (D1, API, UI) is the
  **reviewed** month (`YYYY-MM`, e.g. `2026-10` for the issue published
  2026-11-05) — never the publication month. The UI labels it as the review
  of that month.
- **The box is free, the article is not.** The Highlights box renders in the
  server HTML outside the paywall: a plain `GET` with a browser User-Agent
  and no cookies returns the box in the initial ~100 KB document. The
  article body sits behind "Login or register to keep reading…", and the
  page's own JSON-LD marks `isAccessibleForFree: false` with a `.paywall`
  selector. No JS execution is needed for the box — verified on every page
  in §3.
- **The metadata rides the page**: every issue carries a schema.org
  `Report` JSON-LD block with `headline`, `datePublished`,
  `dateModified`, and a `description` that usually paraphrases the box. The
  scraper stores `headline` and `datePublished` verbatim; the description
  is an opportunistic cross-check only (§3.4).

## 3. The research record (2026-11-24, 48 URLs)

Method: `bun scripts/wgc-probe.ts` (this repo) fetched the canonical URL of
every month 2023-01 → 2026-10 plus the June/November skip months, plus two
not-yet-published controls (2026-11, 2026-12), with a desktop Chrome
User-Agent and `Accept-Language: en-GB`. Raw rows, including the parsed
segments verbatim: `docs/evidence/wgc-census-2026-11-24.json`. The probe is
re-runnable — the implementing sitting must run it again first (§10).

### 3.1 The series calendar: ten issues a year

**Every June and November has no issue at all** — the series skips both
months every year observed: 2023-06, 2023-11, 2024-06, 2024-11, 2025-06,
2025-11 all answer clean 404s; 2026-11 404s today (as of 2026-11-24), and
2026-12 404s (not yet published — the December issue arrives in January).

One behavioral change already observed and handled: **the June 2026 URL
301-redirects to the July 2026 issue** (`…-june-2026` → `…-july-2026`,
final URL confirmed) where earlier Junes simply 404'd. A scraper that
trusts a 200 would silently store July's highlights under June's key. The
slug guard (§4.3) exists because of this observed case.

### 3.2 The publication window: 4–12 days after month-end

39 genuine issues were measured (2023-01 → 2026-10, skips and the June-2026
redirect excluded). Delay = WGC's own `datePublished` date minus the
reviewed month's last day:

| Stat | Days after reviewed month-end |
|---|---|
| Minimum | 4 |
| Median | 7 |
| Maximum | 12 |
| Distribution | 4×2 · 5×5 · 6×6 · 7×9 · 8×9 · 9×3 · 10×4 · 12×1 |

**The clock**: every single issue's JSON-LD `datePublished` is `08:00:00`
London time (`+00:00` in winter, `+01:00` in summer) — a scheduled CMS
publish. That is 07:00–08:00 UTC, 10:30–11:30 Asia/Tehran. The full table:

| Issue | Published | Delay | Box variant | Segments |
|---|---|---|---|---|
| 2023-01 | 2023-02-09 | 9 | — (no box) | 0 |
| 2023-02 | 2023-03-07 | 7 | — (no box) | 0 |
| 2023-03 | 2023-04-06 | 6 | — (no box) | 0 |
| 2023-04 | 2023-05-10 | 10 | — (no box) | 0 |
| 2023-05 | 2023-06-07 | 7 | — (no box) | 0 |
| 2023-07 | 2023-08-08 | 8 | — (no box) | 0 |
| 2023-08 | 2023-09-06 | 6 | — (no box) | 0 |
| 2023-09 | 2023-10-10 | 10 | — (no box) | 0 |
| 2023-10 | 2023-11-07 | 7 | — (no box) | 0 |
| 2023-12 | 2024-01-10 | 10 | — (no box) | 0 |
| 2024-01 | 2024-02-07 | 7 | — (no box) | 0 |
| 2024-02 | 2024-03-07 | 7 | — (no box) | 0 |
| 2024-03 | 2024-04-09 | 9 | — (no box) | 0 |
| 2024-04 | 2024-05-08 | 8 | — (no box) | 0 |
| 2024-05 | 2024-06-06 | 6 | — (no box) | 0 |
| 2024-07 | 2024-08-08 | 8 | — (no box) | 0 |
| 2024-08 | 2024-09-05 | 5 | — (no box) | 0 |
| 2024-09 | 2024-10-08 | 8 | — (no box) | 0 |
| 2024-10 | 2024-11-12 | 12 | — (no box) | 0 |
| 2024-12 | 2025-01-08 | 8 | — (no box) | 0 |
| 2025-01 | 2025-02-10 | 10 | — (no box) | 0 |
| 2025-02 | 2025-03-06 | 6 | — (no box) | 0 |
| 2025-03 | 2025-04-08 | 8 | `h2` + `<h3>` subheads + `<ul><li>` | 2 |
| 2025-04 | 2025-05-08 | 8 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2025-05 | 2025-06-05 | 5 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2025-07 | 2025-08-07 | 7 | `h2` + `<h3>` subheads + `<ul><li>` | 2 |
| 2025-08 | 2025-09-04 | 4 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2025-09 | 2025-10-07 | 7 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2025-10 | 2025-11-06 | 6 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2025-12 | 2026-01-08 | 8 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2026-01 | 2026-02-05 | 5 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2026-02 | 2026-03-05 | 5 | `h2` + `<p><strong>` heads + `<p>` | 2 |
| 2026-03 | 2026-04-08 | 8 | `h2` + `<h3>` subheads + `<p>` | 2 |
| 2026-04 | 2026-05-07 | 7 | `h2` + `<p><strong>` heads + `<p>` | 2 |
| 2026-05 | 2026-06-04 | 4 | `h2` + `<p><strong>…</strong><br>` one-paragraph | 2 |
| 2026-06 | 2026-08-06 | (37) | redirects to july-2026 — **rejected** | — |
| 2026-07 | 2026-08-06 | 6 | `h2` + `<p><strong>` heads + `<p>` | 2 |
| 2026-08 | 2026-09-09 | 9 | `h3` box + `<p><strong>` heads + `<p>` | 2 |
| 2026-09 | 2026-10-07 | 7 | `h3` box + `<p><strong>` heads + `<p>` | 2 |
| 2026-10 | 2026-11-05 | 5 | `h2` + `<h3>` subheads + `<p>` | 2 |

### 3.3 The box: present since the 2025-03 issue, always two segments

The Highlights box exists **only from the 2025-03 issue onward** (22
issues before that carry none — the box is a newer editorial feature).
Every one of the 17 box issues observed has **exactly two segments**: a
review of the month and a look ahead. The headings are recorded **verbatim**
because WGC varies them: "March review", "October in review", "December and
FY 2025 review"; "Looking forward" vs "Looking ahead". Nothing downstream
may hard-code either word.

### 3.4 The markup census: the box shape changes month to month

The box lives in the same structural slot every time — inside
`<div class="paragraph paragraph--type--body-text …"> <div class="wrapper">`
at the top of the main content — but WGC mixes **five body styles** within
two box-heading levels, with no discernible schedule (adjacent months
differ):

1. `h2` box heading, `<h3>March review</h3>` subheads, bodies in
   `<p>…</p>` — e.g. 2025-04, 2026-10 (heading "October in review" /
   "Looking ahead").
2. `h2` box heading, `<h3>` subheads, bodies in
   `<ul><li>…</li></ul>` — 2025-03, 2025-07 (with `&nbsp;` entities inside).
3. `h2` box heading, subheads as `<p><strong>February review</strong></p>`,
   bodies as following plain `<p>` — 2026-02, 2026-04, 2026-07.
4. `h2` box heading, each segment as one paragraph
   `<p><strong>May review</strong><br>body…</p>` — 2026-05, plus one
   trailing plain `<p>` note that appends to the last segment.
5. `h3` box heading, subheads as `<p><strong>…</strong></p>`, bodies as
   plain `<p>` — 2026-08, 2026-09 (the owner's pasted snippet is this
   issue, and the parser reproduces it byte-identically).

The parser contract (§4.4) handles all five by tokenizing, not by matching
one template. The JSON-LD `description` cross-matched the box's first
sentence on 11 of the 17 box issues (phrasing drifts) — useful as a
bonus signal, never a gate.

## 4. The pipeline, proposed

### 4.1 Where it runs: a separate tiny Worker

A new, minimal Cloudflare Worker — **`currena-wgc-watch`** — in the owner's
account (code in this repo under `wgc-watch/`, its own `wrangler.toml`,
deployed with `bunx wrangler deploy` there; the account token and account
id through the environment only, the house rule). It binds the **same D1
database** as the desk (`aurum-desk`, id
`264617a4-5bfa-43af-8c9c-d4c95d257dc8`, binding name of its choosing) and
does nothing else: scheduled fetch → parse → upsert, plus a read-only
`fetch` health endpoint on its own workers.dev URL (§4.7).

Why separate: the desk's worker entry is build-generated by OpenNext, and
its two-step deploy runbook is proven — the watch worker touches none of
that. The desk reads the rows through its own D1 binding; D1 happily serves
multiple Workers on one database. (The alternative — a `scheduled` handler
grafted into the OpenNext entry of the main worker — is possible but puts
the whole desk at risk for a 100-line scraper; rejected.)

### 4.2 When it runs: the bounded window

Cron triggers on the watch worker (UTC):

```toml
triggers.crons = [
  "30 9 1-15 * *",    # daily, days 1–15 of every month — 09:30 UTC
  "30 9 17-25/2 * *",  # grace: alternate days 17, 19, 21, 23, 25
]
```

- **Days 1–15** covers the observed publication delays (max 12) with three
  days of margin; the **grace days through 25** honor the owner's "they
  might publish this with delay" without unbounded polling. 09:30 UTC =
  13:00 Asia/Tehran, ~1.5–2.5 hours after the earliest observed appearance
  (08:00 London = 07:00–08:00 UTC), so a typical issue lands the same day
  it is published. **The hard bound: at most 20 fetch attempts per month,
  zero in June and November.**
- **The target rule**, per fire: the target is the **previous calendar
  month** (UTC) — in January that is December of the prior year. If the
  target month is June or November → exit (a skip month; no request is
  ever made). If a row for the target exists with `status = 'ok'` → exit
  (stop-on-success: a captured month never re-fetches inside the window).
  Otherwise → one fetch.

### 4.3 How one fetch behaves

- `GET` the canonical URL with the tested headers (`User-Agent`: the
  desktop Chrome string from the probe, `Accept-Language: en-GB,en;q=0.9`),
  redirects followed, 25 s timeout.
- **404** → the expected pre-publication state: `attempts++`,
  `last_attempt_at` now, a log line, wait for the next fire.
- **200** → first the **slug guard**: the final URL's month-year slug must
  equal the requested one (and/or the JSON-LD `mainEntityOfPage.@id`);
  a redirect to a different month (the observed June-2026 case) is treated
  as *this month's issue does not exist* — same handling as a 404, but
  logged as `redirect-rejected`.
- Timeouts and 5xx → `attempts++`, next fire. No in-window backoff is
  needed at one attempt per day; the calendar itself is the backoff.
- **Window close** (day 25, still nothing): set `status = 'missed'` and log
  it. A missed month is a stated fact on the page (§6), never a silent gap;
  the next issue resumes automatically.

### 4.4 The parser contract (validated against all 17 box issues)

1. **Locate the box**: the first heading element `<h2|h3|h4 …>` whose
   trimmed inner text, case-insensitive, is exactly `Highlights`.
2. **Take the block**: from just after that heading's closing tag to the
   first `</div>` — the enclosing `.wrapper`'s close, verified to contain
   no nested `div` in every observed box. Defensive fallback exits, in
   case a nested `div` ever appears: the next `<aside`, the next
   `<div class="paragraph`, or the next `<h2`.
3. **Tokenize in document order**:
   - `<h3|h4>text</h3|h4>` → a segment **heading**;
   - `<p>` whose inner starts with `<strong>X</strong>`: if the remainder
     (after the strong, `<br>` and tags stripped) is non-empty → a segment
     with heading X and that remainder as body (style 4); otherwise → a
     segment heading X awaiting its body (style 3/5);
   - a plain `<p>` or an `<li>` → **body text**: appended to the current
     segment (a leading one before any subhead opens a heading-less
     segment — observed as 2026-05's trailing note, which verbatim-appends
     to the last segment);
   - strip tags, collapse whitespace, `&nbsp;` → space.
4. **Record verbatim**: headings are never normalized ("October in review"
   stays "October in review"); the variant actually seen is stored
   (`block_variant`).

### 4.5 Validation and the alarm states

Store nothing that fails the gates: **≥ 1 segment; every heading
non-empty; every body ≥ 40 characters** (observed bodies run 60–200);
**a JSON-LD `datePublished` present** on the page. A 200 response that
fails the gates is a **structure alarm** — the WGC template changed and a
human must look: `status = 'structure_alert'`, a log line with the reason,
the last known good stays served, the page says so plainly (§6). This path
is exactly what would have caught the five-style census drift, including
this sitting's own two parser iterations (`<li>` bodies, the
`strong+<br>` paragraphs).

### 4.6 Storage (D1) — the two tables

```sql
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
```

Upsert keyed by `month_key`. A re-run over an already-`ok` month (backfill
or manual) recomputes the hash: unchanged → nothing written; changed (WGC
edited the box post-publication) → re-store, `updated_at` bumped, a
`re-stored` log line — never silent. The desk's Prisma schema gains the
matching read model so its client can query the table; the DDL is applied
with `wrangler d1 execute … --file` (idempotent `CREATE TABLE IF NOT
EXISTS` statements; **no existing table is touched**) — the
implementing sitting follows the house D1 procedure exactly.

### 4.7 The health endpoint

The watch worker's `fetch` handler answers its workers.dev URL with a
small read-only JSON: the last three log lines, the current target month's
row, and the cron schedule — the ops glance and the acceptance evidence
that the cron actually fired. No route on currena.ir is claimed; the zone
stays exactly as it is.

## 5. The API

One route joins the desk's existing family, read-only, fail-closed, D1
only — no outbound fetch from the desk itself:

```
GET /gold/api/gold/wgc-commentary                → the latest issue
GET /gold/api/gold/wgc-commentary?month=YYYY-MM → that specific issue
```

```json
{
  "status": "ok",
  "month": "2026-10",
  "headline": "Gold Market Commentary: Where floor art thou?",
  "publishedAt": "2026-11-05T08:00:00+00:00",
  "fetchedAt": "2026-11-05T10:30:12Z",
  "sourceUrl": "https://www.gold.org/goldhub/research/gold-market-commentary-october-2026",
  "blockVariant": "h2+h3-subheads",
  "segments": [
    { "heading": "October in review", "body": "Gold fell in October, likely on asset rotation, de-grossing and Fed rate-path repricing." },
    { "heading": "Looking ahead", "body": "The post-2011 downturn is a poor parallel…" }
  ]
}
```

Before the first capture (or inside an open window) the route answers
honestly: `status: "waiting"` with the target month and the attempt count;
a closed window without an issue → `status: "missed"`; a failed gate →
`status: "structure_alert"` with the last known good beside it. The
existing route set is untouched — `meter` and `daily` keep their honest
parameter 400s, every other `/gold/api/gold/*` neighbor keeps its 200.

## 6. The card on the gold page

A compact band on the Persian page — proposed placement: directly under
the Market Brief at the top (the WGC's monthly one-glance beside the
desk's own), the implementing sitting places it with the owner's layout
standards. Bilingual chrome per the house pattern: the fa title
(«نگارش ماهانهٔ شورای جهانی طلا») with the EN subtitle; the two English
segments render **verbatim inside a `dir="ltr"` block** (English text
inside the RTL page, quoted); the 11px whisper meta line carries the
published date, the fetched date, and the source attribution with the
canonical link («منبع: World Gold Council» + gold.org). The honest states
ride the same card: *waiting* states that the next issue has not been
published yet and names the window; *missed* states that the window closed;
*structure_alert* states that the source's template changed and the desk
is showing the last known good. Mobile 375px with zero horizontal overflow,
44px targets, dark mode, zero console errors — the house rules, no
exceptions.

## 7. The backfill

A one-off script (`scripts/wgc-backfill.ts`, to be written at
implementation) walks 2025-03 → the latest published issue — skipping
June/November, applying the same slug guard, parser, gates, and upserts —
**17 rows as of 2026-11-24**. Idempotent: re-running changes nothing. The
22 pre-box issues (2023-01 → 2025-02) are **not** backfilled and the card
does not pretend they exist — the box did not exist then, and that fact is
stated, not hidden.

## 8. Later phases — explicitly not v1

- **Persian translation of the two segments via Workers AI** (the account
  already carries the credentials), stored beside the English, rendered
  under an honest «ترجمهٔ ماشینی» label — a separate sitting, separate
  acceptance, never silently.
- The full article, the charts, the GRAM datasets — paywalled and out of
  scope (§1, §9).

## 9. Licensing and attribution

The box is published by the WGC outside its paywall for free reading; the
desk stores a **verbatim two-paragraph excerpt** (≈500–900 characters)
with visible attribution and the canonical link — never the article, never
the charts, never a mirror. If the WGC ever objects, the card and the rows
come down. The desk's own copy around it stays ours.

## 10. Acceptance criteria for the implementing sitting

1. **Re-run the probe first**: `bun scripts/wgc-probe.ts` and diff against
   `docs/evidence/wgc-census-2026-11-24.json` — if gold.org's template
   drifted since 2026-11-24, the census in this spec updates before code
   is written.
2. **Parser harness**: the parser (the production module, not a copy)
   over the 17 box issues plus the owner's pasted September snippet — 17
   × 2 segments, every heading and body non-empty; the September snippet
   byte-identical; all five body styles exercised (2025-03 and 2025-07
   `<li>`; 2025-08 `<h3>`+`<p>`; 2026-02/04/07 `strong-p`;
   2026-05 `strong+<br>` with the trailing note; 2026-08 `h3` box).
3. **Negative paths**: a no-box month (2023-02) → structure alarm, nothing
   stored; the June-2026 redirect → slug-guard rejection logged; a 404 and
   a far-future month → the waiting state.
4. **Clock walk**: simulated days 1…7 (six 404s, one 200) → `attempts = 7`,
   `status = ok`; further fires exit without fetching; a June/November
   fire makes zero requests; the month bound never exceeds 20 attempts.
5. **D1**: the DDL applies idempotently (twice, no error); an unchanged
   re-run writes nothing; a simulated edit bumps `updated_at` and logs
   `re-stored`.
6. **API + page**: the route answers `ok | waiting | missed |
   structure_alert` honestly; the card renders EN/fa chrome, the LTR
   block, the whisper line; zero console errors; 375px clean; dark mode;
   the full desk route set stays green; `currena.ir/` and `/goldsmith`
   untouched.
7. **Live**: the watch worker deployed with the env-only credentials, the
   cron observed firing at least once (the health endpoint or the scrape
   log), and the first real capture of the next issue (the 2026-12 issue,
   expected in early January 2027 inside the measured window).

---

*Artifacts: the research probe `scripts/wgc-probe.ts`; the raw census
`docs/evidence/wgc-census-2026-11-24.json` (40 pages, 39 genuine issues,
every segment verbatim). Proposed by the 2026-11-24 sitting; the AGENTS.md
record of that sitting carries the summary.*
