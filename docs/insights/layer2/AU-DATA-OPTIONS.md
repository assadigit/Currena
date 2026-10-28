# Australia data source — investigation record (P2)

**Work item:** `docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md` §4.
**Session:** 2026-10-28. **Read together with:** DECISIONS.md D-26/D-27
(the outcome + the R10 correction).

The three RBA-fed indicators: `au-10y`, `rba-expectations`,
`au-us-10y-gap` (the latter two derive from the same F2/F2.1 yield
tables — fix the 10y/3y venue and all three refresh).

---

## 1. What exactly is blocked, and why

| Surface | From Cloudflare Workers egress | Evidence (2026-10-28) |
|---|---|---|
| `rba.gov.au/statistics/tables/csv/f2-data.csv` (DAILY 10y + 3y yields) | **BLOCKED — HTTP 403** (Akamai edge rule, path-scoped, IP-reputation class) | Re-verified live by invoking the still-deployed `rba-probe` worker: `{"status":403,"len":423}`; first venue-verified 2026-10-21 |
| `f2.1-data.csv` (MONTHLY 10y + 3y yields) | **SERVED — HTTP 200** | The 04:10 UTC ingest's KV status blob: both F2.1 series `fetched` (hashes e9355162 / 0554a4ec); the `currena-r10-probe` worker serves the file (publication date 02-Oct-2026) |
| `f1-data.csv` (daily cash rate) | SERVED | Status blob `fetched`; the rba-cash-rate reading sits at asOf 2026-10-27 |
| `f1.1-data.csv`, `e2-data.csv`, `f6-data.csv`, `f4.1-data.csv` | SERVED | Status blob `fetched` (this morning's run) |
| `/statistics/cash-rate/` (HTML decision table) | SERVED | Status blob `fetched` (hash 1a66bc33) |

Why: Akamai's edge on rba.gov.au applies an IP-reputation rule that 403s
the **f2-data.csv path specifically** for Cloudflare Workers egress IPs.
It is not UA-based (the production fetches run with the honest declared
`CurrenaDashboard/1.0` UA — fetch-policy F-09/T-25, "nothing may present
a browser identity"), not terms-based (RBA material is CC BY 4.0), and
not site-wide (six other RBA tables + the HTML page serve to the same
egress). **Corrections to the record:** Round 10's claim that "every
rba.gov.au path (CSV tables AND the HTML cash-rate page)" is blocked, and
the Layer-1 report §9.4's "readings are stale at 2026-09-30", are both
superseded by the evidence above — the F2.1 monthly fallback is LIVE and
the trio's data is monthly-CURRENT (the September file, published
02-Oct-2026, is the freshest monthly print that exists; October's
publishes ~02-Nov-2026).

**The honest current state of the three readings:** official RBA monthly
yields, honestly dated (`asOf 2026-09-30`), fetched successfully every
ingest run, expected to refresh ~02-Nov. The DAILY granularity the
indicator definitions describe is the part that is venue-blocked. A true
freeze (F2.1 stops serving) trips the existing 40-day status window AND
the P1 freshness window simultaneously (same threshold — D-21), so
frozen data can never present as live: it greys out, stops voting, is
excluded from narration, and the safety-net "Data as of" line appears.

## 2. The fix-order walk (spec §4.2)

1. **An official RBA feed or file that is not blocked and is permitted
   for automated access — SATISFIED, LIVE:** the F2.1 monthly table (the
   current serving path). Terms: RBA material is CC BY 4.0
   (LICENCES.md L0, owner research 2026-10-16, re-read 2026-10-20;
   commercial/personal use allowed with no implied endorsement);
   attribution "Source: Reserve Bank of Australia" already renders on the
   cards. The daily F2 file is the blocked one.
2. **Another free, official source for the same (daily) figures — none
   found:**
   - **AOFM (aofm.gov.au):** HTTP 520 from Cloudflare Workers egress on
     every statistics path probed (the venue is dead for us regardless of
     what they publish). The sandbox egress is WAF-blocked too (403 "Your
     request has been blocked") — so even the venue's terms could not be
     read honestly. Not usable; not circumvented.
   - **data.gov.au (the government open-data portal):** reachable from
     Worker egress (HTTP 200), but no daily AGS 10y/3y yield dataset was
     found (catalog searches; the CKAN API is bot-walled from the
     sandbox, honestly recorded).
   - **ASX:** the Terms of use PROHIBIT automated access verbatim
     (LICENCES.md L3) — never fetched; link-out only.
   - **investing.com / brokers / aggregators:** bot-protected or
     unofficial — out of bounds by the session rules.
3. **An existing free API the project already uses — no gain:** FRED's
   Australian long-term rate series (e.g. `IRLTLT01AUM156N`) is
   OECD-sourced MONTHLY — the same granularity the live F2.1 path
   already serves, with a longer lag; EODHD is quota-bound (the markets
   board) and bond data is not on the free tier; Frankfurter is FX-only;
   gold-api is metals/crypto; Yahoo has no AU-10y yield ticker and its
   unofficial endpoints are L2-limited to the four price tiles by owner
   directive.

## 3. What remains (the honest gap)

- **Daily granularity** for the three indicators, until the Akamai rule
  on `f2-data.csv` relents for Cloudflare egress (it has been path-scoped
  and stable since 2026-10-21). The ingest skips that one path by design
  (`skipRbaCsvTables: true` — six doomed 403s would burn subrequests);
  the moment it serves again, remove the skip and the F2 daily pair
  re-takes its place automatically (the fallback ladder prefers it).
- **The GHA venue** (different egress, historically able to reach
  f2-data.csv) is idle while the account's GitHub Actions minutes are
  exhausted since 2026-10-20 — owner-side (see docs/DEPLOY.md
  "Repairing CI").

## 4. The single recommended next step

**Watch the f2 path, not "RBA".** Once a week (or on the next Insights
maintenance round), invoke the probe worker pattern — or simply remove
the `skipRbaCsvTables: true` skip in `apps/api/src/insights-ingest-cron.ts`
for one rung — and check whether
`https://www.rba.gov.au/statistics/tables/csv/f2-data.csv` answers 200
from Worker egress. When it does: (1) delete the skip, (2) delete the
three `FRESHNESS_CADENCE_REFINEMENTS` entries in
`packages/insights/src/freshness.ts` (D-21 — the trio re-tightens to
daily), (3) update the AU-DATA note in the definitions' comments, and
(4) run `pnpm gates`. Until then the live state — official monthly
yields, honestly dated, freeze-tripped at 40 days — IS the clean fix the
spec's fix-order item 1 describes, and no new source should be wired.

## 5. Free-tier impact of this session (P2, for the record)

Zero new KV operations; zero new external calls in production code; zero
changes to the ingest's request budget (the F2.1 fetch was already a
daily rung before this session). The one-off diagnostics (invoking the
two existing probe workers, 5 requests total; reading `insights:status`
once via the Cloudflare API) touched no production path and added no
recurring load.
