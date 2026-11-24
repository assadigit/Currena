# The Trading Economics daily gold briefing — the capture + translation spec

**Status: proposed (2026-11-24, this sitting — the research and the plan;
implementation is the NEXT session's work). The clarifying questions with
the sitting's suggested defaults are in §11; the spec is written against
those defaults, and the owner's answers at the implementing sitting adjust
the plan before code is written.**

The owner's brief: tradingeconomics.com/commodity/gold carries a **daily
briefing** — the gold page's own summary paragraph (the owner's pasted
`<h2 id="description">` snippet) under a title (the pasted card-header
snippet). Scrape it **daily**, and translate it with **the same engine**
the WGC commentary now uses (the Workers AI `@cf/google/gemma-4-26b-a4b-it`
chat-contract runner with its disciplines), for the Persian gold page.

This document is the research record plus the pipeline it justifies — the
WGC spec's own structure, because the two pipelines are siblings: same
account, same D1, same engine, same honesty rules, a different clock
(daily vs monthly) and a different source contract.

---

## 1. The goal and the scope

Ingest the free daily gold briefing of Trading Economics into Currena —
automatically, at least once per day — store it in the desk's own D1,
translate it to Farsi with the same Workers AI engine and the same
fail-closed disciplines as the WGC commentary, serve it through the desk's
own API, and show it on the Persian gold page with honest state lines.

What this is **not**: no chart ingestion, no price-data scraping, no
forecast-card capture, no mirror of tradingeconomics.com. One page GET
per fire (plus one detail GET per NEW briefing), one row per briefing,
one card on the page. The desk's own numbers stay the desk's; TE's
editorial take is attributed content, never data.

## 2. The source, precisely

- **Who**: Trading Economics, tradingeconomics.com — the gold commodity
  page `https://tradingeconomics.com/commodity/gold`.
- **The briefing is the page's top news item.** The page renders, below
  the chart, a "Gold - Summary" card whose `h2#description` carries the
  full daily briefing body (the owner's first snippet) — and the same
  text, **byte-identical (verified 2026-11-24)**, is the top item of the
  page's News Stream card: `<b><a href='/commodity/gold/news/{id}'>{title}
  </a></b>` (the owner's second snippet — the title) followed by
  `<div class="comment more">{the full body}</div>`. One source of
  truth: the news stream's top item (title + body + the canonical news
  URL + the item's own id); the Summary h2 is the same content and is
  used as a cross-check, never as a second extraction path.
- **The news detail page** `https://tradingeconomics.com/commodity/gold/
  news/{id}` carries a schema.org **Article JSON-LD**: `name`/`headline`
  (the title verbatim), `datePublished` / `dateModified` (ISO UTC — the
  authoritative timestamp), `url` (the canonical link), `author` (TE
  staff). The scraper stores the title, the body, the id/URL and TE's
  own `datePublished`; `dateModified` is an opportunistic re-store signal
  (§4.3).
- **No JS execution needed.** A plain `GET` with a desktop Chrome
  User-Agent and `Accept-Language: en-GB,en;q=0.9` returns the full page
  in server HTML (443 KB) with the briefing, the stream and the
  JSON-LD present — verified from the sandbox AND from a Cloudflare
  Worker's own egress (§3).
- **The page's own metadata**: the commodity page's Dataset JSON-LD
  declares `isAccessibleForFree: true` and
  `license: https://creativecommons.org/licenses/by/4.0/` (§9).
- **The key** used everywhere downstream (D1, API, UI) is the **news
  item id** (the numeric `{id}` of `/commodity/gold/news/{id}`) — TE's
  own stable identifier — with the capture date (`YYYY-MM-DD`, UTC) as
  the human-facing label. The briefing is per-item, not per-day: TE
  publishes **1–2 gold briefings per day** (observed; §3), and each is
  captured as its own row.

## 3. The research record (2026-11-24)

Method: one sandbox GET of the commodity page with the tested headers,
three news detail GETs, and — the feasibility question this source
actually turns on — a **one-off Cloudflare Worker probe** (`currena-te-probe`,
deployed read-only to the owner's account, invoked twice, then deleted:
the account's worker list is exactly as it was). Raw rows:
`docs/evidence/te-gold-census-2026-11-24.json`.

### 3.1 The Worker-side fetch works

Trading Economics sits behind Cloudflare's own edge; the honest risk was
that a Workers egress IP would be challenged (403/1020). It is not —
two consecutive Worker-side fetches answered **200 with the full 443 KB
page, the briefing present, no challenge page, ~210–275 ms from HKG**.
The probe worker's two invocation results are recorded verbatim in the
evidence file. The pipeline's fetch leg is therefore proven on the real
platform, not just from the sandbox — and the remaining risk (a future
rate-limit or bot-protection change on TE's side) is an alarm state
(§4.5), never a silent gap.

### 3.2 The cadence: 1–2 briefings per day

The stream currently carries 3 items (the page exposes exactly the
latest three — deep history is not retrievable without crawling, and a
mirror is out of scope by §9):

| news id | title | published (TE's own) | body |
|---|---|---|---|
| 603757 | Gold Holds Gains Amid Recovery in Equity Markets | 2026-11-24T02:17:13Z | 939 chars |
| 603608 | Gold Rebounds From One-Year Lows | 2026-11-23T14:46:48Z | 910 chars |
| 603349 | Gold Rises as Fed Rate Hike Bets Ease | 2026-11-23T01:53:00Z | 948 chars |

Two items on Nov 23, one (so far) on Nov 24. The publish times observed
(01:53, 02:17, 14:46 UTC) straddle the day: an Asia-morning piece around
~02:00 UTC and an intraday/US piece in the ~14:00–15:00 UTC band. The
capture window (§4.2) is designed against this observed pattern; the
honest bound is **at most 2 fires per day, one GET per fire plus one
per genuinely new item**.

### 3.3 The body is complete in the stream markup

The `comment more` class suggests truncation; it does not truncate —
the full body rides the div (939/910/948 chars observed, no "more"
anchor, no elision). The Summary card's `h2#description` is
**byte-identical** to the top item's body — the page's own editorial
mirror, and the parser's cross-check.

### 3.4 The account's cron inventory (the binding constraint)

The Workers Free plan allows **five cron triggers per account**. Today:
`currena-api` (`* * * * *`), `currena-markets` (one covering trigger),
`currena-wgc-watch` (two) — **four used, exactly one free**. A TE watch
worker therefore gets **one** trigger. One trigger can carry two fire
times (a comma list — the wgc-watch's own day-list pattern), so the
design is 2 fires/day on a single trigger — and the slot budget lands
at 5/5, stated plainly: any future cron need requires consolidation or
the paid plan. That is the owner's accepted trade-off question (§11 Q2).

## 4. The pipeline, proposed

### 4.1 Where it runs: a separate tiny Worker

A new, minimal Cloudflare Worker — **`currena-te-watch`** — in the owner's
account (code in this repo under `te-watch/`, its own `wrangler.jsonc`,
the wgc-watch pattern: zero dependencies, deployed with `bunx wrangler
deploy`, credentials env-only). It binds the **same D1** as the desk
(`aurum-desk`, binding name of its choosing) and the same **Workers AI
[ai] binding**, and does nothing else: scheduled fetch → parse → gates →
upsert → translate, plus a read-only health endpoint on its own
workers.dev URL (§4.7). Why separate (the wgc-watch's own argument, one
layer over): the desk's worker entry is OpenNext-build-generated and its
two-step runbook is proven; a 100-line scraper never puts the desk at
risk; D1 happily serves multiple Workers on one database. Why a sibling
and not a graft onto `currena-wgc-watch`: the two workers have different
clocks (daily vs monthly window), different failure surfaces, and
different runbooks — coupling them doubles the blast radius of either's
next change; the trigger count is per-account, so grafting saves nothing
(§3.4).

### 4.2 When it runs: twice daily, one trigger

```jsonc
"triggers": { "crons": ["0 5,16 * * *"] }   // UTC — 05:00 and 16:00 daily
```

- **05:00 UTC** (08:30 Tehran) captures the Asia-morning piece (observed
  ~02:00 UTC publishes, 3 hours of margin); **16:00 UTC** (19:30 Tehran)
  captures any intraday second piece (observed ~14:46, margin likewise).
  Each fire is cheap (§4.3); the day's budget is 2 page GETs + at most
  2 detail GETs + at most 2 translation runs (a new item translates
  exactly once, §5).
- **The target rule**, per fire: fetch the commodity page once; take the
  news stream's items **in order**; for each item whose `news_id` is not
  already stored (`status = 'ok'`) → capture it (§4.3). Items already
  stored → re-store check (§4.3's hash rule). Nothing new → exit (the
  honest quiet fire; weekends observed: no new item, the card keeps
  showing the last briefing with its own date — a stated fact, not a
  gap).
- No bounded publication window exists to poll inside (the stream is
  continuous); the fire clock itself is the bound — **2 fires/day, one
  page GET each**, the TE-side load a rounding error against any
  rate limit.

### 4.3 How one capture behaves

1. `GET https://tradingeconomics.com/commodity/gold` with the tested
   headers (desktop Chrome UA, `Accept-Language: en-GB,en;q=0.9`),
   redirects followed, 25 s timeout.
2. Parse the news stream (§4.4) → the ordered items (id, title, body).
   Cross-check: the top item's body must equal the `h2#description`
   text (allowing the element to be absent entirely — the cross-check
   fires only when both exist and differ → structure alarm, §4.5).
3. For each **new** item: `GET /commodity/gold/news/{id}` → read the
   Article JSON-LD (`headline`, `datePublished`, `url`; the body from
   the detail page's own stream markup cross-checked against the
   commodity page's copy — byte-identical or the alarm path).
4. Gates (§4.5) pass → upsert keyed by `news_id`. For an **already
   stored** item: recompute the content hash; unchanged → nothing
   written; changed (TE edited the body post-publication, or
   `dateModified` moved) → re-store, `updated_at` bumped, a
   `re-stored` log line — never silent, exactly the WGC rule.
5. The translation rides the same path (§5): after a store/re-store,
   plus a retry pre-step at the top of every fire for stored-but-
   untranslated rows (the retry-on-next-fire discipline — an AI
   failure never fails the capture, never re-fetches English, retries
   on the next fire).

Timeouts, 5xx and 403/429 (the bot-protection risk, §3.1's honest tail)
→ `fetch-failed` logged, next fire. No in-window backoff: the fire
clock is the backoff.

### 4.4 The parser contract

Tokenizing, not template-matching — the WGC census's own lesson
(five body styles in one year):

1. **Locate the stream**: the `<div class="card-header">` whose trimmed
   text equals `News Stream`; take the following sibling region up to
   the closing of the enclosing card (the next `card-header` or the
   container's close — defensive exits, the WGC parser's own fallback
   ladder).
2. **Tokenize the region in document order**:
   `<div class="list-group-item indc_news_stream te-stream-repeater">`
   blocks; within each: the `<b><a href='/commodity/gold/news/{id}'>`
   → the item's id + title; the `<div class="comment more">` → the
   body (tags stripped, whitespace collapsed, entities decoded).
3. **Record verbatim**: the title and the body are stored exactly as
   served — no normalization, no re-capitalisation; `datePublished`
   verbatim from the detail JSON-LD.

### 4.5 Validation and the alarm states

Store nothing that fails the gates: **≥ 1 stream item parsed; the top
item's title non-empty; the top item's body ≥ 200 characters**
(observed 910–948; the floor guards against a login/interstitial page
being parsed as a briefing); **the detail JSON-LD `headline` equals the
stream title** (verbatim identity — the authoritative cross-check);
**a JSON-LD `datePublished` present**. A 200 page that fails the gates
is a **structure alarm** — TE's template changed and a human must look:
`status = 'structure_alert'`, the log line names the failed gate, the
last known good stays served, the card says so plainly (§6). A
challenge/interstitial page (403 + the "Just a moment" signature) is a
**fetch-failed**, not a structure alarm — the alarm vocabulary stays
for template drift.

### 4.6 Storage (D1) — the three tables

```sql
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
```

The same rules as the WGC tables: upsert keyed by `news_id`;
`CREATE TABLE IF NOT EXISTS` only, no existing table touched, applied
with `bunx wrangler d1 execute aurum-desk --remote --file te-watch/ddl.sql`
(run twice, the idempotence proof); the desk's Prisma schema gains the
read models so its client queries them.

### 4.7 The health endpoint

The `fetch` handler answers the worker's workers.dev URL with a small
read-only JSON: the last three log lines, the latest stored briefing's
row, and the fire schedule — the ops glance and the acceptance evidence
that the cron fired. No route on currena.ir is claimed; the zone stays
exactly as it is.

## 5. The translation — the same engine, the same law

The owner's explicit requirement: "translated with same engine". That is
the WGC translation sitting's now-live machinery, carried over with the
disciplines intact and only the payload's shape fitted to TE's briefing:

- **Model**: `@cf/google/gemma-4-26b-a4b-it` — the live bake-off's
  selected translator (AGENTS.md's credentials-sitting record), called
  through the worker's **[ai] binding** (the platform-native path, no
  secret surface; the REST path is what any outside-the-worker script
  uses — the same model, the same contract).
- **The contract, TE-shaped**: the WGC runner's chat contract
  verbatim **except** the JSON shape line — TE's briefing is a headline
  plus one body, so the strict output contract becomes
  `{"headline": <string>, "body": <string>}` (the WGC module's own
  disciplines — fences/preamble stripped, the outermost object taken,
  both served shapes read — carry over verbatim). A **sibling module**
  `te-watch/src/translate.ts` implements it; the WGC module is not
  touched (its own contract stays exactly as deployed). One call per
  briefing; `max_tokens: 2048` (the bake-off's uniform envelope).
- **The disciplines, all of them, per-string over the whole payload**:
  the identity check (an untranslated string — the llama-4-scout
  failure mode — fails the run, nothing stored); the mirror checks (a
  dropped or invented headline, an empty content channel — the
  gpt-oss failure mode — fail closed); the freshness gate (a stored fa
  row with a matching hash serves forever; a re-stored English
  re-opens it); the failure discipline (any error logs
  `translate-failed`, the English row is already safe, retried on the
  next fire — an AI failure never fails the capture).
- **Attribution**: `source_model` records the engine; the honest
  «ترجمهٔ ماشینی» label renders on the card, exactly as the WGC card's.
- **Neuron budget**: 2 calls/day, well inside the free plan's daily
  10,000-neuron allocation — the WGC pipeline's one-call-per-month and
  this two-per-day ride the same budget comfortably.

## 6. The API

One route joins the desk's existing family — read-only, fail-closed,
D1-only, no outbound fetch from the desk itself:

```
GET /gold/api/gold/te-briefing              → the latest captured briefing
GET /gold/api/gold/te-briefing?id={news_id} → that specific briefing
```

```json
{
  "status": "ok",
  "newsId": "603757",
  "title": "Gold Holds Gains Amid Recovery in Equity Markets",
  "publishedAt": "2026-11-24T02:17:13Z",
  "fetchedAt": "2026-11-24T05:00:41Z",
  "sourceUrl": "https://tradingeconomics.com/commodity/gold/news/603757",
  "author": "Jam Kaimo Samonte",
  "body": "Gold held above $3,600 per ounce on Tuesday …",
  "fa": {
    "title": "…",
    "body": "…",
    "sourceModel": "@cf/google/gemma-4-26b-a4b-it",
    "translatedAt": "2026-11-24T05:01:03Z"
  }
}
```

The `fa` field is additive and always-include when fresh (hash match +
parseable), absent otherwise — the WGC route's own decided shape, the
flat fields stay backward-compatible, the fa layer fails closed to
absent. Before the first capture: `status: "waiting"`; a failed gate:
`status: "structure_alert"` with the last known good beside it. The
existing route set is untouched.

## 7. The card on the gold page

A compact band in the WGC card's own visual family — proposed placement:
directly **under the desk's Market Brief** (the daily TE take beside the
desk's own), with the WGC monthly card following it: the page's
"today / this month" pair of attributed market commentary. Bilingual
chrome per the house pattern: the fa title («خلاصهٔ روزانهٔ بازار طلا»)
with the EN subtitle; fa mode with a fresh translation renders the
Farsi as the primary RTL text under the honest «ترجمهٔ ماشینی» pill,
with the English original still available verbatim below (the existing
`dir="ltr"` block, captioned «متن اصلی به انگلیسی»); fa mode with no
stored Farsi renders the English verbatim with no label, no fake
translation; EN mode always renders the English verbatim. The 11px
whisper meta line carries TE's publish date (Persian calendar in fa
mode — the house convention), the fetched date, and the source
attribution with the canonical link («منبع: Trading Economics» +
tradingeconomics.com). The honest states ride the same card: *waiting*
names the next fire; *fetch-failed* streaks state that TE has not been
reachable since N fires (the last known good stays served, dated);
*structure_alert* states that the source's template changed. Mobile
375px with zero horizontal overflow, 44px targets, dark mode, zero
console errors — the house rules, no exceptions.

## 8. The seed

A one-off script (`scripts/te-seed.ts`, written at implementation) walks
the CURRENT news stream at implementation time — the three items already
in today's fetched page (`docs/evidence/te-gold-census-2026-11-24.json`
records them verbatim) — applying the same detail-GET, gates and upserts,
then translating the three. Cheap (three detail GETs, three translation
runs ≈ a trivial neuron spend against the fresh daily allocation), and
the card has content and a little history from the first minute. If the
owner prefers the v1-minimal start (§11 Q3), the seed shrinks to the
top item and the rest is live-captured history from there on. No
crawling of TE's archive — the stream exposes the latest three only and
a mirror is out of scope (§9); the honest line on the page states the
coverage begins at the seed date.

## 9. Licensing and attribution

The page's own Dataset JSON-LD declares
`isAccessibleForFree: true` and `license: CC BY 4.0`
(`https://creativecommons.org/licenses/by/4.0/`) — a *page-metadata*
declaration. The conservative reading the spec takes: the **news
briefing is editorial content**, and its license status is not what a
dataset block proves; so the WGC discipline applies unchanged — a
**verbatim one-paragraph excerpt** (title + ~900-char body) with visible
attribution and the canonical link, never a mirror, never the charts,
never the data tables; if TE objects, the card and the rows come down.
The CC BY declaration is recorded as a favorable signal (attribution +
link is TE's own stated condition for the page's licensed metadata),
not as a permission slip to go wider. The desk's own copy around it
stays ours.

## 10. Later phases — explicitly not v1

- The other TE commodity pages (silver, oil…): the worker's URL constant
  parameterizes per commodity — one table column and one card each,
  only when the owner asks.
- The "previous briefing" navigation on the card (the rows are there;
  the card is one-glance by design).
- A bake-off re-open against a future catalog change — the same
  one-command re-open the WGC pipeline carries.

## 11. The clarifying questions (asked before implementation)

The owner's answers adjust the plan; the spec is written against the
suggested defaults.

**Q1 — The capture scope.** The daily briefing = the top news-stream
item (title + body + canonical URL + TE's own timestamp). Include
anything else from the page (the Forecast card, the stats table)?
*Suggestion: the briefing only — the owner's own brief named exactly
this part, and the licensing discipline keeps the excerpt narrow.*

**Q2 — The cron slot trade-off.** The account's fifth and last free
cron trigger goes to this worker (`0 5,16 * * *` — two fires a day on
one trigger). After it, the slot budget is 5/5 full: the next cron need
anywhere in the account requires consolidation or the paid plan.
Accept? *Suggestion: yes — the desk's automation roadmap is complete
(markets, WGC, TE), and this is the last planned cron consumer.*

**Q3 — The seed.** Seed with the current three stream items (immediate
content + two days of history; three detail GETs + three translations)
or the top item only? *Suggestion: all three — the cost is trivial and
the card starts alive; history before the seed is honestly absent.*

**Q4 — The cadence.** Two fires/day (05:00 + 16:00 UTC) against the
observed 1–2 publishes/day — or one fire (05:00) accepting a ~11-hour
staleness window for the second piece? *Suggestion: two — the same
single trigger carries both times; the second piece is exactly the
"recovery rally" style update the Persian reader wants same-day.*

**Q5 — The card placement.** Under the desk's Market Brief, above the
WGC monthly card (the today/this-month pair)? *Suggestion: yes — the
daily voice sits with the desk's own daily voice, the monthly voice
below it.*

**Q6 — The bot-protection posture.** If TE starts challenging the
Worker egress (403/interstitial): log `fetch-failed`, retry next fire,
the card keeps the last known good with its date and an honest line;
no proxy, no headless-browser arms race. Accept? *Suggestion: yes —
the probe proved today's path; the day it stops working is a stated
fact on the page, never a silent gap.*

## 12. Acceptance criteria for the implementing sitting

1. **Re-run the probe first**: re-fetch the commodity page and diff its
   structure against `docs/evidence/te-gold-census-2026-11-24.json` —
   if TE's markup drifted since 2026-11-24, the census updates before
   code is written.
2. **Parser harness**: the production parser module over the recorded
   census stream (3 items: titles verbatim, bodies 939/910/948 chars,
   the h2 cross-check true) plus a synthetic login-page negative (body
   < 200 chars → structure alarm, nothing stored) and a challenge-page
   negative (fetch-failed, nothing parsed as content).
3. **Clock walk**: simulated fires (nothing new → zero writes, one
   `fire` log line; a new top item → detail GET, gates, store,
   translation; a re-stored body → hash bump, `re-stored` log;
   a translate failure → `translate-failed`, English stored, retried
   and healed on the next fire).
4. **D1**: the DDL applies idempotently (twice); the Prisma read
   models land; the desk route set stays green.
5. **Worker deploys**: `currena-te-watch` deployed (the D1 + [ai]
   bindings attached, the one cron trigger live — the account's fifth
   slot), the health endpoint answering; the desk worker redeployed
   (the route/card going live) on the two-step OpenNext runbook.
6. **Live**: the first real fire captures a real briefing end to end —
   English row + fa row + `translated` log — and the live card renders
   the Persian under the «ترجمهٔ ماشینی» label with the English
   original captioned below; browser walk + VLM; zero console errors;
   375px clean; dark mode; the full desk route set stays green;
   currena.ir/ untouched.
7. **The quota dependency stated**: the sitting lands after the daily
   neuron reset or states which legs wait for it (the WGC sitting's own
   pattern).

---

*Artifacts: the census `docs/evidence/te-gold-census-2026-11-24.json`
(the stream verbatim, the Worker-side probe results, the license fields,
the cron inventory); the probe worker itself was deleted after the
evidence was captured — the account's worker list is exactly as it was.
Proposed by the 2026-11-24 sitting; AGENTS.md's record of that sitting
carries the summary and the translation-sitting wrap-up beside it.*
