> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# The markets cron consolidation — the source port

**Status: Done in code, not deployed (by design — the LIVE worker already
carries the patch; this port makes the source match so the next deploy
from this repository no longer reverts it).**

## Why this port exists

On 2026-11-24 (~01:50 UTC) the deployed `currena-markets` worker was
consolidated from FOUR cron triggers to ONE covering trigger —
`0,30,50 1,7,8,23 * * *` — with a time-based dispatch patched into the
deployed handler, to free the account's Workers Free cron quota (five
triggers per account) for `currena-wgc-watch` (the WGC monthly-commentary
watch worker, which needed two). That patch touched ONLY the deployed
bundle; this repository's source still carried the original four-trigger
string dispatch (`event.cron` equality against MAIN_CRON / RETRY_CRON /
ASIA_CRON / AU_CRON) and the four-cron `wrangler.jsonc`. Without this
port, the next `pnpm --filter @currena/markets run deploy` would revert
the deployed dispatch and re-request four triggers (the quota now has
room for ONE — a partial attach whose expression the reverted string
dispatch would not recognize).

The consolidation record (the offline equivalence proof — every minute of
a full week, 10,080 minutes, zero dispatch mismatches, all 20 weekly real
jobs covered, 64 logged no-op wakes) lives in the desk repository:
`tests/markets-cron-consolidation-2026-11-24.json` +
`tests/markets-cron-equivalence-test.ts`
(github.com/assadigit/Currena, the `main` line). The deployed patch was
built from this repository's `apps/markets` source as deployed 2026-11-10
(Cloudflare version 31/37 lineage), so this port is the source-side twin
of that deployed reference.

## What changed (apps/markets only)

- **`src/index.ts`** — the scheduled handler now derives the job from the
  fire's own `event.scheduledTime` (UTC day-of-week + hour + minute):
  Mon–Fri 23:30 → main; Tue–Sat 01:30 → retry; Tue–Sat 08:50 → retry
  (the F1 Asia rung, retry-shaped exactly as before); Mon–Fri 07:00 →
  the AU job, still ALONE (no fx twin). Every other minute — the covering
  trigger's wakes (01:00, 01:50, 07:30, 08:00, 08:30, 23:00, 23:50) and
  any job time outside its day-of-week window — logs one
  `arkets] covering-cron wake at HH:MM UTC (day D) — no job at this
  minute` line and returns. QA audit A-7's spirit is preserved: an
  unexpected minute can never be silently treated as a run. The three
  job functions, their error isolation and the markets→fx chaining are
  untouched.
- **`src/crons.ts`** — the four original expressions stay exported as the
  DOCUMENTED SCHEDULE SEMANTICS (nothing reads them at runtime anymore;
  the tests pin them), and `COVERING_CRON = '0,30,50 1,7,8,23 * * *'` is
  added as the one trigger this Worker runs on.
- **`wrangler.jsonc`** — `"triggers": { "crons": ["0,30,50 1,7,8,23 * * *"] }`
  (the four originals kept in the comment block for the record). The KV
  binding, observability and compatibility date are untouched.
- **`src/index.scheduled.test.ts`** — rewritten for the time-based
  dispatch: the four covered windows (day-of-week guards included — a
  Saturday 23:30 / Sunday 01:30 / Sunday 08:50 are WAKES, not jobs), the
  covering wake, the AU window running the AU job ALONE (new coverage —
  the AU branch had no wrapper test before), an AU failure logging
  without rethrowing, and the unchanged chaining + fault-isolation tests.
- **`src/index.test.ts`** — the audit C-8 config test now asserts the
  config carries exactly the ONE covering trigger matching
  `COVERING_CRON`, with the four original windows still pinned as the
  documented semantics. All budget tests are untouched (they exercise
  `runScheduledMarkets` directly, which did not change).

## Verification (this port, on this branch)

- `pnpm --filter @currena/markets run typecheck` — clean.
- `pnpm --filter @currena/markets run test` — **19/19 passed** (12
  scheduled-wrapper + 7 budget/config).
- `npx eslint` over the four changed files — 0 problems.
- `npx wrangler deploy --dry-run` (from `apps/markets`) — the config
  parses, the covering cron is schema-valid, the bundle builds
  (1,060.75 KiB, in line with the deployed ~1 MB), the RATES binding
  intact.
- NOT run: the full `pnpm gates` (the 15k-suite pre-deploy gate) — this
  branch changes no runtime surface outside `apps/markets`, and the
  deploy itself belongs to the owner's integration session. Run the full
  gates before the next production deploy from this line, per DEPLOY.md.

## The equivalence claim, stated honestly

The time-based dispatch in this port is the source-side transcription of
the deployed patch (the reference implementation), which was proven
equivalent to the original string dispatch offline over every minute of a
full week (the desk repository's record). The wrapper tests here pin the
same contract at the four windows and the wake minutes, day-of-week
guards included. The first LIVE fires of the deployed patch (the 07:00
AU rung, the covering wakes, the 08:50 Asia retry on 2026-11-24; the
23:30 main run) are being observed through the worker's stored
observability logs by the desk repository's scheduled checks — their
findings land in that repository's AGENTS.md.

## Rollback

The consolidation is reversible at the account level without this repo:
the original deployed bundle is pinned as Cloudflare Worker version
`9c525932-611e-4c12-853f-ca87b3d55326` (redeployable via the
gradual-deployments API), and the four original schedules can be re-PUT
as a bare array. In this repo, reverting this commit restores the source
four-cron config (which a deploy would then re-attach — mind the quota:
it now has room for exactly ONE more trigger).
