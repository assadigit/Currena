# The ingest rung map (currena-api's minute-cron)

The account's free 5-cron budget is full, so EVERYTHING schedules inside the
Worker's `* * * * *` minute-cron via UTC hour:minute gates
(`apps/api/src/insights-ingest-cron.ts` + `cron.ts`). On an ingest-rung minute
the ever-green rates ladder idles (its 300 s fresh window absorbs the skip).

Maintained by gap-closure S1-M1.7 (2026-10-31). **When you add or move a rung,
update this table in the same commit.**

| UTC time | Rung | What it does | Subrequests | KV writes |
|---|---|---|---|---|
| hourly `:13` | live prices | Yahoo quotes for the Prices board → `insights:prices-live:v1` (write-only-if-changed) | 4 fetches | 0–1 |
| hourly `:50` | narrator | Layer-2 states from the public projection; ≤3 model calls; one write when a hash changed | ~5 reads + ≤3 AI calls | 0–1 |
| hourly (watchdog minute) | ingest watchdog | re-dispatches the GHA ingest when it silently stops | 1–2 | 0 |
| `04:10` | **main ingest** | collect every source, write snapshot + public projection + stage + status. **FULL — never add fetches** (the free-tier budget table). *(S2-M2.4 completion, 2026-10-31: the weekly custody series `WSEFINTL1` joined the existing mixed-frequency FRED bulk group beside `WALCL` — one more id inside an EXISTING request, so the subrequest count is UNCHANGED (~47/50); the group stays 11/12 ids. Not a new fetch — but do not add more ids to this path casually; the ZIP truncates past ~12.)* | **~47/50** | ~5 |
| `04:20` | rung 2 | the gap-audit additions (MOF daily; CFTC Saturdays; the monthly trio first-of-month; bootstraps) — fetch, patch, re-stage | ~10–36 | ~4 |
| `04:25` | history daily-a | daily-cadence histories, first half (the exceededCpu split) | ~26 | ~24 |
| `04:27` | history daily-b | daily-cadence histories, second half | ~26 | ~23 |
| `04:30` | **rung3 (S1-M1.7)** | the generic EXTRA-SOURCES rung — pluggable list, own 50-subrequest budget, own status record `insights:extra-status:rung3`, per-source failure isolation. **S2-M2.2 registered `tic-slt`** (the TIC fetch pins its own 30 s single-attempt timeout — the first live firing died at the 12 s default, see VERIFIED-SOURCES) (the Treasury TIC SLT tables → `insights:tic:v1`; release-aware gate: daily on the 15th–25th until the new data month appears — the write is idempotent, so post-release days are a cheap re-check — otherwise Saturdays; the manual lever is `POST /internal/insights-ingest?phase=extra`, force mode). **S4-M4.3 (2026-11-01) registered `portwatch`** — the IMF PortWatch chokepoint transits: the five shipping chokepoints' daily n_total (Suez, Panama, Bab el-Mandeb, Malacca, Taiwan; Hormuz rejected at the source, M4.1), read as the 7-day average, DAILY gate, own phase `runInsightsPortwatchPhase` (fetch → merge into the ONE combined raw-history key `insights:portwatch:v1`, 400 days per chokepoint → derive the MA7 readings + the chokepointCompare block → patch snapshot/public/stage/status → write the five per-id history keys). Budget 18: the daily run is 1 fetch + 5 reads + 10 writes = 16; the bootstrap path (no stored key, or older than 45 days) adds ≤2 more pages of the same batched query. The fetch pins 30 s (the SLOW host — 12.5 s first byte from Worker egress, the S1 probe) with a 4 s politeness pause between pages (the host 400s rapid successive queries; a pause, not a retry — F-11 stands). Routed to RUNG3 by the session plan (rung4 carries 45/50 on all-gates days; rung3 has its own 50 budget). The rung3 registry total on an all-gates day: 1 status + 4 + 18 = 23/50. The ids ride CARRY_FORWARD_IDS; the history phases exclude them | 1 status write + the sources' declared 22 (tic-slt 4 + portwatch 18; the daily portwatch live shape is 16) | 1 (rung status) + 1–2 (tic) + ~11 (combined key + snapshot + public + stage + status + 5 histories) |
| `04:35` | **rung4 (S1-M1.7)** | the same machinery, second slot. **S3-M3.2 (2026-11-01) registered `fred-s3`** — the S3 FRED liquidity/funding/macro groups: TWO fredgraph ZIP requests (the two truncation-safe 6-id groups: THREEFYTP10/WTREGEN/RRPONTSYD/WRESBAL/IORB/CCSA + GDPNOW/GACDISA/MEDCPIM/STICKCPIM/MTSDS133FMS/DRTSCILM), daily gate; the phase (`runInsightsRung4Phase`) derives the six M3.2 cards against the STAGED sofr/walcl legs (the 04:10 main rung's own collect), patches the snapshot + public projection + stage, and writes its OWN six history keys (the 04:25/04:27 daily halves EXCLUDE RUNG4_IDS — they run 10 minutes earlier; see ingest/run.ts historyPhaseIds). Declared budget 24 (gap-closure S3-M3.5, 2026-11-01: the phase now writes FOURTEEN own history keys — the liquidity six + the macro six + the M3.5 deficit pair; 2 fetches + 3 reads + 4 patches + 14 histories = 23 live, declared with headroom). The main rung carries the readings forward (CARRY_FORWARD_IDS = RUNG2 ∪ RUNG4); the GHA/Node venue runs the same collection inline (scripts/ingest.ts rung4Series). IORB arrives FUTURE-TRIMMED (announced rows past today dropped at collect). NOTE: the fredgraph ZIP path IGNORES cosd — every member serves its series' full history (probed live 2026-11-01); parse sizes stay modest (~12.5k rows both groups). **S3-M3.3 (2026-11-01) registered `frb-ebp` + `ofr-fsi`** — the credit-stress pair: the Fed Board's monthly EBP CSV (Saturday re-check — a monthly file needs no daily fetch; the sweeps heal failures within hours, gate bypassed) + the OFR's daily FSI aggregate CSV (daily gate). Each calls its OWN phase (`runInsightsCreditPhase`, files=['ebp']/['ofr'] — different hosts than FRED, failure domains isolated); each patches the snapshot family and writes its OWN history key (the ids joined RUNG4_IDS, so the daily halves and the periodic rung exclude them). Budget 10 each: 1 fetch + 2 reads (snapshot, status) + 5 writes (snapshot, public, stage, status, history) = 8 live, declared with headroom. The rung4 registry total on the day every gate fires: 1 status + 24 + 10 + 10 = 45/50. The Node venue collects the same two files inline (collectCreditSources — the venues cannot drift). **S3-M3.5 (2026-11-01): the Treasury auction families are a NODE-VENUE-ONLY addition** — `collectTreasuryAuctions` (adapters/auctions.ts) runs in scripts/ingest.ts's inline build ONLY (api.fiscaldata.treasury.gov is BLOCKED from Worker egress, the S1 probe ×3); the four ids (`treasury-auction-10y`/`-10y-indirect`/`-30y`/`-30y-indirect`) ride RUNG4_IDS for the main rung's carry + the history-phase exclusions, and their history keys are written by the Node venue's inline read-compared writes (the Worker phase never derives them). The EBP/OFR hosts answered ~270 ms/~1.2 s in the S1 probe; the 12 s single-attempt policy stands. | 1 status write + the sources' declared 44 (fred-s3 24 + frb-ebp 10 + ofr-fsi 10; live shape ~23 + 8 + 8) | 1 (rung status) + ~19 (14 history keys + snapshot + public + stage + status patches from fred-s3, + 2 history keys + the same 4 patches from each credit source) |
| `04:40` | history periodic | monthly/quarterly histories (read-compared writes) | ~26 | ~varies |
| `10:10` / `20:10` | sweeps | gated re-run: one KV read on healthy days; a full ingest re-run when the last status shows failures/staleness **+ the S1-M1.7 extra-rung heal** (a failed rung3/rung4 source retries within hours, its day gate bypassed) | 1 healthy · ~50 when firing | 0 / ~5 |
| quarter-hours | Frankfurter | the ECB pair rides `:00/:15/:30/:45` with the ladder | 1 | ≤1 |

## Registering an extra source (S2+)

1. Build the adapter + parser + fixture + tests in `packages/insights`
   (the normal add-an-indicator recipe — see
   `docs/gap-closure/NEW-INDICATOR-CHECKLIST.md`).
2. Add an `ExtraSourceDef` to `EXTRA_SOURCES` in
   `apps/api/src/insights-extra-rungs.ts`: id, rung (3 or 4), day gate
   (`firstOfMonthGate()` / `weekdayGate(6)` / `dailyGate()`), declared
   `budget` (fetches + KV ops), and the `run(env, now)` body.
3. The rung enforces the ceiling: a source whose budget would cross
   50 subrequests is REFUSED, loudly, in the status record.
4. The sweeps heal it: a `failed`/`blocked`/`format-changed` row arms the
   10:10/20:10 retry (day gate bypassed — a monthly source that failed does
   not wait a month).
5. Report the rung's subrequest/KV numbers in the milestone's PROGRESS entry.

**Never** add a cron trigger to a wrangler config; **never** add fetches to
the 04:10 main rung.
