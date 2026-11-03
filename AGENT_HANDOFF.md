# AGENT_HANDOFF — Currena gap-closure S6 (FINAL — program complete AND delivered)

> The six-session gap-closure program is COMPLETE (37/37 milestones,
> 2026-11-03) and **DELIVERED** — the eighth session (2026-11-03
> 02:49–03:30 UTC, credentialed) executed the one remaining task this
> handoff used to carry: the push of the union chain, the hygiene deploy,
> the five readings' landings, and the production-browser verification
> (EN + fa). Read `docs/gap-closure/PROGRESS.md` (the authoritative log —
> the eighth claim note has the full delivery record) and
> `docs/gap-closure/CASE-STUDY.md` (the program summary).
> Never record credentials here.

## A. The delivery state (verified 2026-11-03 ~03:30 UTC)

1. **origin/main = `550d76f`** — the union chain pushed
   (`d6f60b6..550d76f`, 6 commits; remote verified via the GitHub API;
   **CI run #472 on `550d76f`: SUCCESS** — the pushed tree is green
   independently on GitHub).
2. **Production**: currena-api **`115eb1e5`** @ 100% (deployment
   `4ccce05b`, 03:14:34 UTC — the hygiene deploy from the union head; the
   build proven byte-identical to the already-live parallel-variant
   deploy: entry `index-DrhFnckY.js` + `Insights-5V_N7nyu.js` unchanged
   pre AND post). currena-markets `58c4eebd` @ 100% — code-unchanged
   since M6.1, correctly NOT redeployed (the repo convention).
   Smoke: `/api/health` · `/` · `/api/insights` · `/api/insights/markets-au`
   all 200.
3. **The readings**: `/api/insights` serves **161 readings** — the five
   pending ids all landed provider-exact (the `insights-ingest` dispatch
   on the pushed code + the `rung2-run --nbs` lever):
   `usd-reserve-share` 56.704761505127 @ 2026-06-30 ·
   `sp500-breadth-ratio` 0.2925 @ 2026-11-02 · `btp-bund-spread` 0.8003
   @ 2026-08-01 · `china-property-investment` −20.6 @ 2026-09-30 ·
   `china-steel-output` 7,359×10kt @ 2026-09-30. The dispatch run's
   exit-1 is the DESIGNED P1 signal (nz-short-rate's known
   sdmx.oecd.org 500 class — the 04:20 retries own it).
4. **The render**: browser-verified on production EN + fa — the
   `dedollar-concentration` gauge (both cards), the Italy–Germany card in
   borrowing, both China cards in the trade lane; Persian digits, RTL,
   0px overflow @360, zero console errors
   (`evidence/M6.3/screenshots-prod/`, 8 screenshots).

## B. What is deliberately left open (the owner's decisions — not tasks)

- **The promotion decision (G-5):** `docs/gap-closure/PROMOTION-PROPOSAL.md`
  + `evidence/M6.4/` — cfnai + ebp proposed; the voters stay 48 until the
  owner approves. §7 of the proposal is the ready execution plan.
- **The two rebalancing questions** (proposal §6) + the Westpac-MI/NAB
  `owner_accepts` flags.
- **The credential rotation — the TOP owner action item**: every token
  pasted into the planning/session chats (now an EIGHTH round) must be
  rotated; after rotating the Cloudflare token, update the repo secret
  `CLOUDFLARE_API_TOKEN` and re-run one `insights-ingest` dispatch to
  confirm green.
- The paid-plan ideas + the re-check horizons (sloos ~2028, ofr-fsi as
  episodes accrue, the young families at the 120-obs floor) — recorded in
  MAINTENANCE.md's S6 follow-ups.

## C. The standing constraints (unchanged, for any future session)

G-3 (never remove/hide), G-5 (nothing scores without the owner's
approval), provider-exact numbers only, fail-closed parsers, credentials
only from the environment and never printed, the full `pnpm gates`
before every push, the CHANGELOG heading-count discipline, the fa
copy-audit flow (next round: 76), the parallel-session protocol
(pull --rebase before committing).

## D. Git + deployment state (as of the eighth session, 2026-11-03 ~03:30 UTC)

- origin/main = `550d76f` (local `main` == origin; tree clean after the
  delivery-record commit). The full S6 chain: `f126010` → … → `d6f60b6`
  (the parallel M6.3 — the union's code base) → `c2a91fe` · `e66a6b9` ·
  `b84660f` · `e1ae37b` · `af17e38` · `550d76f` — all pushed, all 17 on
  origin/main.
- Production: currena-api `115eb1e5` (from the union head) ·
  currena-markets `58c4eebd` (unchanged since M6.1, active @ 100%).
- The scheduled 04:10/04:20/04:50 UTC GHA + Worker runs continue the
  cadence on the pushed code (idempotent content — the same bytes).
