# OWNER_SETUP.md — the exact steps the owner must do by hand (v3)

Nothing else. Every command assumes the repo root and `pnpm` installed
(`npm i -g pnpm@10.34.5`). Nothing below was done by the agent: no deploy,
no secret, no production change was made on this branch.

## 1. Review the branch (start here)

```bash
git fetch origin
git checkout insights-rebuild
git pull            # the branch is pushed; a PR named "Insights rebuild" is open — do NOT merge it from the agent's side; review then merge when satisfied
pnpm install --frozen-lockfile
pnpm -r test          # 1,637 tests, all green
pnpm -r typecheck
pnpm run lint
pnpm run copy:audit   # clean (new fa strings are queued needs-review — see §9)
pnpm run build        # includes the T-15 site-mode check + the bundle budgets
pnpm --filter @currena/web run visual:fixtures
pnpm --filter @currena/web run visual:test      # 19/19 (U-14 wired in §6's boot)
pnpm --filter @currena/insights selfcheck       # runs everything incl. the unit suites; writes SELF_AUDIT.md + the dated export
```

Read the four reports: `docs/insights/FIX_REPORT.md`,
`docs/insights/STEP3_REPORT.md`, `docs/insights/UI_REPORT.md`,
`docs/insights/SELF_AUDIT.md` (+ `RISK_REGISTER.md` for the source
decisions that are YOURS alone).

## 2. Set the owner token (REQUIRED for the export and the live panic switch)

```bash
cd apps/api
npx wrangler secret put INSIGHTS_OWNER_TOKEN
# paste a long random token; do NOT commit it anywhere
```

- Without it: the export tool answers 403 `owner_disabled` (by design) and
  the live mode flip is unavailable — the env-var panic switch (§5) still
  works.
- With it: the page's Tools menu → "Owner sign-in" accepts the token (it is
  sent once to `POST /api/insights/owner/session`, stored only as a 12-hour
  HttpOnly cookie, never logged), unlocking the export menu including the
  server-side full audit export.

## 3. Keep the login password alive (the private gate)

`INSIGHTS_PASSWORD` is already set on the Worker (the v2 handover). It
matters whenever the panic switch (§5) arms the private gate:

```bash
cd apps/api
npx wrangler secret list          # confirm INSIGHTS_PASSWORD exists
npx wrangler secret put INSIGHTS_PASSWORD   # only if you want to rotate it
```

## 4. Any missing API key?

None are missing for the Insights pipeline: FRED/ABS/RBA/ECB/Frankfurter/
World Bank/Alternative.me are keyless; `EODHD_API_TOKEN` (markets board)
and `GH_INGEST_DISPATCH_TOKEN` (the watchdog) are already set;
`INSIGHTS_OWNER_TOKEN` is the ONE new secret (§2). Local development reads
`.dev.vars` (gitignored):

```bash
echo 'INSIGHTS_PASSWORD=choose-a-dev-only-password' >> apps/api/.dev.vars
echo 'INSIGHTS_OWNER_TOKEN=choose-a-dev-only-token' >> apps/api/.dev.vars
```

## 5. The panic switch (M-5) — flip the page private in minutes

```bash
# (a) no-redeploy, from the owner tools (needs the §2 token):
#     Tools → Owner sign-in → the mode control (POST /api/insights/mode)
# (b) env-var (survives everything, needs a deploy):
cd apps/api
npx wrangler deploy --var PANIC_PRIVATE:true     # every Insights data endpoint answers 401 within one refresh cycle
npx wrangler deploy --var PANIC_PRIVATE:false    # back to public (ACCESS_MODE defaults to public)
```

`ACCESS_MODE=private` does the same as a var; `SITE_MODE` still works
(private re-arms the gate). Flipping via (a) takes effect within ~60 s
(one cached read); via (b) at the next deploy.

## 6. Boot it locally and see it (including the U-14 export check)

```bash
pnpm --parallel dev
# api: wrangler dev on :8787 · web: vite on :5173
```

Then in another terminal (or your browser): open http://localhost:5173,
switch the app to فارسی too, and try:
`GET http://localhost:8787/api/insights/export` without a token → 401;
with the owner token (`Authorization: Bearer <token>`) → the audit export.
`GET /api/insights` unauthenticated in public mode → the public projection;
set `PANIC_PRIVATE=true` in `apps/api/.dev.vars`, restart → 401 everywhere
until you sign in.

## 7. Deploy the preview (staging) — never production from the agent's side

```bash
cd apps/api
npx wrangler versions upload --name currena-api-preview
```

## 8. Deploy to production AFTER your approval

```bash
git checkout insights-rebuild
pnpm run build
cd apps/api
npx wrangler deploy          # currena-api
cd ../markets
npx wrangler deploy          # currena-markets (its code DID change on this branch: honest-UA fetches)
```

## 9. Roll back / enable-disable a source / run the self-check / the export

```bash
cd apps/api && npx wrangler rollback                 # the previous deployment
# enable/disable a source (the M-6 kill switch): edit packages/insights/src/sources.ts
#   → set that row's `enabled` (and for a NEW L2 source, set owner_accepts to yes
#   in docs/insights/RISK_REGISTER.md YOURSELF — the agent never flips it)
pnpm registry:generate                                # regenerates the registry + the hidden set
pnpm -r test                                          # the pin tests re-verify everything
pnpm --filter @currena/insights selfcheck             # SELF_AUDIT.md + the dated full export
# on the page (owner): Tools → Owner sign-in → "Download data" → any format,
# or the server audit export (md/csv/json) — it carries the E-23 columns
# incl. level, owner accepts, source enabled, fetch method.
```

## 10. Rotate the API tokens (strongly recommended — the same keys have
## crossed many sessions, including this one's chat handover)

- Cloudflare: dash.cloudflare.com → My Profile → API Tokens; update the
  GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `INSIGHTS_KV_NAMESPACE_ID` if the token changes.
- GitHub: Settings → Developer settings → Personal access tokens.
- EODHD: your dashboard → API key.
- Set the new `INSIGHTS_OWNER_TOKEN` (§2) as part of this pass.

## 11. The fa copy review (a human step the repo's own workflow requires)

`pnpm copy:audit` lists the new Persian strings queued `needs-review`
(the hero, balance, relationship, About and owner-tools copy from this
rebuild). View the page in فارسی (§6), then record the approval:

```bash
node scripts/update-persian-copy-manifest.mjs --ids <id1,id2,…> \
  --status processed --round <your-round-name> --reference <your review note>
pnpm copy:audit    # must stay clean
```

## 12. UPDATE — the 2026-10-19 owner directive SHIPPED this round

The owner's live directive (2026-10-19): "Commit Push deploy. merge with
main branch. and deploy and release." — executed: merge commit `f8f55cb`
(the v3 rebuild × main's 96 parallel owner-round commits, the v3 spec
package governing the Insights page), pushed to `main` (`eaa06c4` with
the deploy record), deployed live (`currena-api` d50def63 +
`currena-markets` 3f245d75, SITE_MODE=public), live-verified EN/fa
desktop+mobile on currena.ir, and released as `2026-10-19-v3-merge`.
PR #1 is closed as merged-by-directive.

**What is left for YOU by hand after this round:**

1. **§2 — `INSIGHTS_OWNER_TOKEN`** — the ONE unset secret. The live
   export answers 403 `owner_disabled` until you set it; the env-var
   panic switch (§5b) works without it.
2. **§10 — rotate the API tokens** — the Cloudflare/GitHub/EODHD keys
   crossed session handovers in chat; rotate them, then update the
   Worker secrets if values change (`cd apps/markets && npx wrangler
   secret put EODHD_API_TOKEN`, etc.).
   **CRITICAL (2026-10-26)**: `context.txt` (the owner's own upload in
   `d3f64bb`) carried the raw Cloudflare Workers API token in plain text.
   Removed from the tree in `5b74dde`, but **the token remains in git
   history — removal is NOT remediation.** Rotate it NOW:
   1. Go to https://dash.cloudflare.com/profile/api-tokens
   2. Find the token that starts with `cfut_` (the Workers API token)
   3. Click **Roll** (or Delete + Create a new one with the same
      permissions: "Edit Cloudflare Workers" scoped to account
      `5f123468027e4b2094167df1d2f2e852`)
   4. Update the Worker secrets with the new token:
      `cd apps/api && npx wrangler secret put CLOUDFLARE_API_TOKEN`
      (needed for the GHA `insights-ingest.yml` workflow — the Worker
      minute-cron doesn't use this token, it uses the KV binding directly)
   5. Update the GitHub repo secret:
      `gh secret set CLOUDFLARE_API_TOKEN --repo assadigit/Currena`
   6. Also rotate the GitHub token (`ghp_…`) at
      https://github.com/settings/tokens — it also crossed session handovers.
   **The token in git history cannot be purged without a force-push
   rewrite of the entire history (git filter-repo); the rotation above
   is the practical remediation.**
3. **§11 — the fa copy review** — the queued needs-review strings now
   include the v3 + merge rounds (the hero, the balance silver twins,
   the owner tools, the About rework); view فارسی and record approvals.
4. **The nightly `chg1y` backfill** rides tonight's 23:30 UTC cron —
   verify the Yearly lens shows values tomorrow; today's honest dashes
   are by design.

## 13. UPDATE — the 2026-10-20 owner directive: the PREVIOUS UI restored over the v3 data

The owner's follow-up directive (2026-10-20), on seeing the merged v3
surface live: "I liked the previous UI more, especially for the world and
australia header sections. please revert back to the previous version UI,
but keep the new data, connections etc. … in the PREVIOUS UI." — executed
on top of §12's shipped tree: the editorial hero (world + Australia
header cards), the ContinueStrip and the full five-lens markets table are
restored verbatim from `main@1e39a24`; every v3 update about the
indicators, their connections and reliability STAYS (sources registry,
state words, delayed tier, on-face meta, data-health chip, About rework,
owner export, sparse-honesty balance). Full record: CHANGELOG
§2026-10-20 (owner UI restore) + UI_REPORT's addendum. The four §12
hand items are unchanged and still yours (owner token, token rotation,
fa copy review, the chg1y backfill check).

## 14. UPDATE — the 2026-10-20d owner round: the World card's photo band

The owner's follow-up directive (2026-10-20d): "Use this picture, turn it
to webP, and use it for the World container. so both containers aus and
world now have picture." — shipped on top of §13's tree: the World
(Global) region card's header band now carries the owner's New York
harbour photo (converted to webp, Sydney-matched veil, framing at 72%
and a horizon-safe bottom fade — the two tunings recorded in
`apps/web/src/index.css`). Both region headers now open on a photograph.
No data, scoring, export or copy change. Full record: CHANGELOG
§2026-10-20d + UI_REPORT's 2026-10-20d addendum. The §12 hand items are
unchanged and still yours (owner token, token rotation, fa copy review);
the chg1y backfill check is resolved (§13).
