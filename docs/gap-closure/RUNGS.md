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
| `04:10` | **main ingest** | collect every source, write snapshot + public projection + stage + status. **FULL — never add fetches** (the free-tier budget table) | **~47/50** | ~5 |
| `04:20` | rung 2 | the gap-audit additions (MOF daily; CFTC Saturdays; the monthly trio first-of-month; bootstraps) — fetch, patch, re-stage | ~10–36 | ~4 |
| `04:25` | history daily-a | daily-cadence histories, first half (the exceededCpu split) | ~26 | ~24 |
| `04:27` | history daily-b | daily-cadence histories, second half | ~26 | ~23 |
| `04:30` | **rung3 (S1-M1.7)** | the generic EXTRA-SOURCES rung — pluggable list, own 50-subrequest budget, own status record `insights:extra-status:rung3`, per-source failure isolation. **Registry EMPTY in S1; S2 registers the TIC tables here** (`apps/api/src/insights-extra-rungs.ts`) | 1 (empty) | 1 |
| `04:35` | **rung4 (S1-M1.7)** | the same machinery, second slot — reserved for a later session's overflow | 1 (empty) | 1 |
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
