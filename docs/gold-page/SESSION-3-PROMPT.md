# SESSION 3 — implementation prompt (owner-approved additions)

Written 2026-11-27 (session 2), after the owner approved: **A, B1, B2, B3,
"Gold in 30 seconds", ATH record watch.** This file is the work order for the
next session. It is self-contained: read it fully, then the other working
docs, then build.

---

## Role, repo, audience

- You are the lead developer on Currena's gold page (currena.ir/gold; repo
  `github.com/assadigit/Currena`; branch **`gold-page-additions`**).
- The audience is the average Iranian buyer/saver, not a trader. fa first with
  full RTL; EN with the optional Iran layer. Plain words; every term
  translated; no trader jargon on the surface.
- Sandbox: re-clone to `/home/z/currena` if it was reset, then
  `git checkout gold-page-additions` — HEAD must sit at or after `fb79cf61`
  (this prompt's commit).

## The one hard rule — ADD ONLY

- Never modify, rename, move, reorder, restyle, restructure, fix, or delete
  anything existing.
- The only allowed edits to existing files: minimal insertion lines in
  `src/app/page.tsx` ONLY — import lines, JSX mount lines, one-line
  NAV_SECTIONS chips. Nothing else, nowhere else.
- Prove it per commit: `git diff fb79cf61..HEAD` shows additions only
  (page.tsx receives `+` lines only; every other file is new).
- Existing problems found go to "Needs my approval" in PROGRESS.md — never
  fixed.
- Real data only: every displayed number traces to a fetched payload or a
  cited static table already in the repo. Never invent, never hard-code a
  market number. A persistently failing source renders fail-closed and gets
  a BLOCKED note.
- No questions to the owner mid-session; record assumptions in PROGRESS.md
  and continue.

## Approved scope — ONLY these, in this order (one additive commit each)

1. **A** — the COMEX futures band (`gold-futures`)
2. **B1** — the "one metal, four prices" band (`gold-four-prices`),
   including **B3** (the digital-gold card) inside it
3. **B2** — the physical venues explainer (`gold-venues`)
4. **"Gold in 30 seconds" + ATH record watch** (`gold-thirty-seconds`)

NOT approved — do not build: Phase 2 buying guide, why-people-hold-gold
cards, dealer-spread changes, hero/board unification, ETF flows, price
alerts, any other proposal. If the session's budget ends before the queue
does: stop after the last completed item, update PROGRESS.md honestly, close
with the standard line naming the first unfinished item.

## Placement + plug-in law (exact)

- Mount all four new bands between `<PhysicalBand … />` and `<FaqBand … />`
  in `src/app/page.tsx`, in this order: FuturesBand → FourPricesBand →
  VenuesBand → ThirtySecondsBand.
- Variables already in scope at that mount site (confirm by reading it):
  `data` (the hero `/api/gold` payload), `projection.data`, `rates.data`,
  `showIran`, `locale`, `fmt`, `t`. Pass what each band needs through its own
  new mount line; never edit an existing mount line.
- NAV_SECTIONS — insert one chip line per band, between `gold-other` and
  `gold-faq` (matching page order):

  ```ts
  { id: "gold-futures", key: null, label: ["Futures", "آتی"] },
  { id: "gold-four-prices", key: null, label: ["Four prices", "چهار قیمت"] },
  { id: "gold-venues", key: null, label: ["Venues", "بازارها"] },
  { id: "gold-thirty-seconds", key: null, label: ["30 seconds", "۳۰ ثانیه"] },
  ```

- The entire allowed edit surface in page.tsx: 2 import lines (FuturesBand
  and the rest are components in new files — import per the house style),
  4 mount lines, 4 chip lines.

## Data sources — verified 2026-11-27 (verification log in PROPOSALS.md; re-verify cheaply at session start)

1. **Yahoo chart — front contract.**
   `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=1d&interval=30m`
   (the exact leg `trend.ts` already fetches — copy its fetch pattern:
   `user-agent` + `accept` headers, `AbortSignal.timeout`, in-memory TTL
   cache, failed legs retry within ~a minute). meta fields to use:
   `shortName` (e.g. "Gold Dec 26" — read it, never hard-code a month),
   `regularMarketPrice`, `regularMarketChangePercent`,
   `regularMarketDayHigh/Low`, `regularMarketVolume`, `regularMarketTime`,
   `fiftyTwoWeekHigh/Low`. There is NO open interest — never show OI.
2. **Yahoo spark — the term structure.**
   `https://query1.finance.yahoo.com/v8/finance/spark?symbols=GCG27.CMX,GCJ27.CMX,GCM27.CMX,GCQ27.CMX,GCV27.CMX,GCZ27.CMX`
   (month codes computed from today's date: G=Feb, J=Apr, M=Jun, Q=Aug,
   V=Oct, Z=Dec, `.CMX` suffix; take the next ~6 quarterly actives after the
   front). Per symbol: `fulldayPrice`, `previousClose`,
   `fulldayChangePercent`, `close[]`. Symbols that fail are dropped honestly.
3. **Yahoo has NO spot symbol** (XAUUSD=X and XAU=X both 404 — probed). The
   basis row pairs the futures front with the hero store spot from `data`,
   showing BOTH stamps (the store syncs once per UTC day — say so in one
   honest line).
4. **TGJU per-indicator — the B3 digital-gold leg** (house pattern: see
   `src/app/api/gold/fx/route.ts`):
   `https://api.tgju.org/v1/market/indicator/summary-table-data/tether_gold_xaut?lang=fa&formated=1&responseType=full`
   (probed working — latest row close $3,567.41, change −0.23%, dated
   2026-11-26; stamp the row's own date honestly). PAXG/XAUt = the token
   claiming 1:1 troy-ounce backing.
5. Reuse, never re-implement: the حباب engine (`src/lib/gold-page/coin-premium.ts`),
   the projection's Shanghai reading (`byId.get("shanghai-gold-premium").value`
   — the same read PhysicalBand does), `/api/gold/trend?range=all` (eight
   windows, each with points/chgPct/source), the store spot in `data`.
6. Do NOT use: CME direct quotes (anti-scraping block — probed), LBMA live
   JSON (Cloudflare-blocked from the sandbox — probed), new EODHD legs
   (quota-troubled; existing store legs only).

## Item specs

### 1. FuturesBand — `gold-futures`

New files: `src/lib/gold-page/futures.ts` (fetch + cache + types, honest
nulls), `src/app/api/gold/futures/route.ts` (`force-dynamic`; GET returns
`{ front: { contract, price, changePct, dayHigh, dayLow, volume, marketTime,
fiftyTwoWeekHigh, fiftyTwoWeekLow }, term: [{ symbol, monthLabel, price,
vsFrontUsd }], fetchedAt, source: "yahoo-finance", delayed: true }`; honest
503 when both legs fail), `src/components/gold-page/futures.tsx`, one icon.

The band shows:

- Front card: contract name, price, day change (house up/down colors), day
  range, volume, updated stamp, "delayed" note; 52-week high/low as a small
  line labeled COMEX futures.
- Basis row: front − store spot ($ and %), both stamps, one plain line why
  futures usually sit above spot (storage + financing until delivery).
- Term table: month, price, $ vs front; curve verdict chip from the slope:
  contango (the normal carry) / flat / backwardation (unusual — often a
  tight-physical-demand signal) — all translated, none scary.
- Globex session chip: open/closed computed from the New York clock
  (`America/New_York`; Sun 18:00 → Fri 17:00 ET, daily 17:00–18:00 halt) —
  deterministic client-side, no source.
- Beginner collapsible (native `<details>`, house pattern): what a futures
  contract is (a promise to deliver at a set date and price), why it is
  "paper gold", why the front month is the quoted one, cross-link to
  `#gold-positions` (the same market's traders).
- Sources line: Yahoo Finance public API · delayed · updated {time}.

### 2. FourPricesBand — `gold-four-prices` (with the B3 card)

New files: `src/app/api/gold/digital-gold/route.ts` (the TGJU XAUt leg,
house fx-route pattern, 5-min cache, fail-closed 503 →
`{ price, changePct, date, source: "tgju-paxg" }`),
`src/components/gold-page/four-prices.tsx`, one icon.

One table, four rows, each row its own source + timestamp + one-line why:

1. Global spot (XAU/USD, the store) — from `data`; the world's reference.
2. COMEX front future (paper) — from `/api/gold/futures`; paper + carry
   until delivery; links `#gold-futures`.
3. Shanghai premium (physical China) — from `projection.data` byId
   `shanghai-gold-premium`; China's buyers pay over spot when demand is
   strong; links `#gold-other`.
4. Tehran Emami حباب (physical Iran) — from `rates.data` + the
   coin-premium engine (the same computation BridgeBand shows); rides the
   showIran layer exactly like the bridge (the owner's layer law); links
   `#gold-bridge`.

Every row fails closed independently. The caption says it plainly: the same
metal, four markets, four prices — the differences are the markets' own
signals.

B3 card under the table — "Digital gold — a fifth price": PAXG/XAUt price +
change + its own date stamp (TGJU), its gap vs the store spot, one plain
line: a token claiming each unit is backed by one troy ounce in a vault — a
market price shown for reference, not an endorsement, not advice.

### 3. VenuesBand — `gold-venues` (static education)

New files: `src/components/gold-page/venues.tsx`, one icon. Four venue cards,
bilingual, plain words: London OTC (the wholesale market behind "spot"; the
LBMA benchmark lives here — the page's own vault numbers link in), COMEX New
York (the futures exchange — the paper price; links `#gold-futures`),
Shanghai SGE (China's physical exchange — where the premium is born; links
`#gold-other`), Tehran bazaar + union (where the board's coin prices come
from; حباب is Tehran's own premium; links `#gold-bridge`). One takeaway line:
the same metal trades at different prices in different markets — the
differences (premium, basis, حباب) are the market's own signals, each shown
with its stamp on this page. "Last reviewed" stamp (house pattern). No data,
no fetch.

### 4. ThirtySecondsBand — `gold-thirty-seconds`

New files: `src/components/gold-page/thirty-seconds.tsx`, one icon. Rides
existing routes only — no new route:

- Fetch `/api/gold/trend?range=all` (the same payload the briefing's trend
  table uses). Verdict rows: day / week / month / year up-down-sideways with
  the honest % (house wording + colors), each with its own source label.
- ATH record watch: the highest close + its date computed from the payload's
  5Y window points, labeled exactly "the highest level in our stored price
  history (from {date})" — never an unqualified "all-time high" — plus the
  distance from it (%). The 52-week high line from `/api/gold/futures`
  (labeled COMEX futures, its own stamp) if that leg is up.
- The "why it moved" line: quote ONLY numbers already fetched (trend
  windows; projection percentile/from-peak context if loaded). When no
  single driver dominates, print the honest neutral sentence. Never invent
  causality. Link `#gold-briefing` for the full story.
- The disclaimer inside the box (house wording: descriptive, never advice).

## Icons (the S1 pack recipe — PROGRESS.md)

`public/icons/gold-futures-paper-market.png`, `gold-one-metal-prices.png`,
`gold-market-venues.png`, `gold-thirty-seconds.png` — 250×250 transparent
PNG in the pack style (generate, flood-fill the background out,
palette-quantize to pack-like sizes, VLM-verify against the pack). Rendered
with PackIcon at 128px beside the h2, like every band.

## Quality gates — every item, before its commit

1. Dev runbook (PROGRESS S1): `cp db/custom.db /tmp/currena-dev.db` then
   `DATABASE_URL="file:/tmp/currena-dev.db" EODHD_TOKEN=6acc3a501a3b65.34846207 bun run dev`
   in the background (never let db writes land in `db/custom.db` — the
   watcher trap). Read `dev.log`.
2. `bun run lint` clean.
3. Browser-verify: EN + fa (full RTL), 375px + desktop, dark mode; chips
   scroll to the bands; `<details>` open/close; money in `<bdi dir>`; fa
   digits in fa; charts stay LTR; no console errors; no 375px overflow.
4. Fail-closed tests: curl each new route (happy path returns real numbers
   with stamps; the unreachable case returns the honest 503 JSON and the
   band renders its "·" line — never a stuck spinner).
5. Additive proof: `git diff fb79cf61..HEAD` — additions only; page.tsx
   shows exactly the allowed insertions.
6. Commit per item, messages: "Gold page: approved A — COMEX futures band
   (additive)", "Gold page: approved B1+B3 — one metal, four prices +
   digital-gold card (additive)", "Gold page: approved B2 — physical venues
   explainer (additive)", "Gold page: approved — gold in 30 seconds + ATH
   record watch (additive)".

## If something cannot be done additively

Stop that item, record the exact blocker under "Needs my approval" in
PROGRESS.md, and continue with the next item. Never solve a blocker by
editing existing code.

## Session end

Update PROGRESS.md (session log, assumptions, decisions, new needs-approval
items), give the owner a plain-language report of what shipped and what was
verified in the browser, and finish with exactly:

"Next session: paste the same prompt again and I will continue from {the
first unfinished approved item}."
