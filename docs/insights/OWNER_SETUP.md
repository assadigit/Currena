# OWNER_SETUP.md — the exact steps the owner must do by hand

Nothing else. Every command assumes the repo root and `pnpm` installed
(`npm i -g pnpm@10.34.5`).

## 1. Set the Insights password (REQUIRED before the gated deploy)

The gate fails closed until this exists (every /api/insights* route answers
401 — even for you):

```bash
cd apps/api
npx wrangler secret put INSIGHTS_PASSWORD
# paste a long random password when prompted; do NOT commit it anywhere
```

Local development reads `.dev.vars` (gitignored):

```bash
echo 'INSIGHTS_PASSWORD=choose-a-dev-only-password' >> apps/api/.dev.vars
```

To sign in: open the Insights page, enter the password in the Private page
box. The session lasts 12 hours, then the page asks again.

## 2. Review the branch

```bash
git fetch origin
git checkout insights-rebuild
corepack pnpm install --frozen-lockfile
corepack pnpm -r test          # 1,389 tests, all green
corepack pnpm -r typecheck
corepack pnpm run lint
corepack pnpm run copy:audit
corepack pnpm run build        # includes the T-15 site-mode check
node scripts/check-bundle-budget.mjs
corepack pnpm --filter @currena/insights selfcheck   # writes SELF_AUDIT.md
```

Read the three reports: `docs/insights/FIX_REPORT.md`,
`docs/insights/STEP3_REPORT.md`, `docs/insights/SELF_AUDIT.md`.

## 3. Deploy the preview (staging)

The branch deploys the SAME worker with its own name (never production):

```bash
cd apps/api
npx wrangler versions upload --name currena-api-preview
```

(Or skip this and review locally: `corepack pnpm --filter @currena/api dev`
with `.dev.vars` set — the gate then works on http://localhost:8787.)

## 4. Deploy to production AFTER your approval

```bash
git checkout insights-rebuild
corepack pnpm run build
cd apps/api
npx wrangler deploy
```

Markets/fx worker (only if its code changed on the branch — it did NOT in
this run): `cd apps/markets && npx wrangler deploy`.

## 5. Roll back

```bash
cd apps/api
npx wrangler rollback            # lists deployments, re-activates the previous one
```

## 6. Run the self-check

```bash
corepack pnpm --filter @currena/insights selfcheck
# → docs/insights/SELF_AUDIT.md + docs/insights/exports/currena-insights-full-<UTC date>.md
```

The scheduled GitHub Action (`insights-selfcheck`) runs it daily at 04:50
UTC and shows red on any failing test. It publishes nothing.

## 7. Produce a full export for an audit

Signed in on the page: Tools menu → expand "Show hidden indicators",
"Show full table" and the full calendar → header → "Download data" →
Markdown (.md). The file carries the E-23 audit columns and the E-24 peak
columns; every indicator appears with source, dates, licence and rule.

## 8. Rotate the API tokens (strongly recommended — sixth session with the same keys)

The Cloudflare API token, the GitHub token and the EODHD key have now
crossed several sessions. Rotate them at your leisure:

- Cloudflare: dash.cloudflare.com → My Profile → API Tokens (roll the
  ingest token; update the GitHub Action secrets `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`, `INSIGHTS_KV_NAMESPACE_ID` if the token changes).
- GitHub: Settings → Developer settings → Personal access tokens.
- EODHD: your dashboard → API key.
- Also set the new `INSIGHTS_PASSWORD` (step 1) as part of this pass.

## 9. Known items the owner may want to fix

- `.github/workflows/ci.yml` line 17 reads `branches: ain]` (a stray edit —
  should be `[main]`), so pushes to main do NOT trigger CI (PRs still do).
  One-line fix, left to you because the runbook forbids changes beyond the
  specs.
- SITE_MODE: the owner decreed PUBLIC on 2026-10-19 (“make it public”) —
  it is now 'public' in apps/api/wrangler.jsonc and the T-15 gate passes
  (the generated data/site-mode-overrides.json hides the 24 non-'yes'
  indicators + the EODHD/Yahoo boards; scripts/check-site-mode.mjs
  verifies). Flipping SITE_MODE back to 'private' re-arms the
  INSIGHTS_PASSWORD gate instantly (the secret stays on the Worker).

## 10. STANDING ORDER — auto push, commit and deploy (owner decree 2026-10-19c)

The owner, after approving the round-44 meter grading: "Push, COmmit,
Deploy. From now on, auto push commit and deploy." From this point on:

- Every completed round/change ships WITHOUT a per-round approval gate:
  gates green → commit → push `insights-rebuild` → fast-forward `main`
  → deploy currena-api (markets only if it changed) → post-deploy
  smoke + DOM verification → docs wrap-up, all in one pass.
- The per-change discipline stays: tests/typecheck/lint/budgets MUST
  pass before any push; the deploy smoke MUST verify before the
  session reports done; evidence still lands in docs/evidence/.
- The credentials still arrive per-session in chat (§6) — the standing
  order covers WHEN to deploy, not the secrets themselves.
