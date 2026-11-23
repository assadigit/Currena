# AURUM Desk — Gold Intelligence & Visual Explanation

The finished 15-session GIE sandbox programme: a standalone Next.js 16 daily
gold-market intelligence desk — complete (Session 15/15 · 0 remaining) —
deployed per the owner's instruction as the upgrade of the Currena site's
gold page, live at:

**https://currena.ir/gold**

## What this branch carries

- The **S8–S14 layer stack** exactly as the programme shipped it (briefing,
  visuals, live grounding, memory, scorecard, watch rules, digest) — the
  contracts are in `AGENTS.md`
- The **Currena Worker deployment**: OpenNext for Cloudflare + Prisma over
  Cloudflare D1 — the same schema and the same queries; only the runtime
  seam changes (`src/lib/db.ts`: the engine client in the sandbox, the
  PrismaD1 driver adapter on the Worker)
- The **archive seed**: `scripts/d1-dump.ts` — a strictly read-only,
  SQLite-`quote()`-exact snapshot of `db/custom.db` (3474 rows matching the
  S15 record counts)
- The deterministic engine stays reachable via
  `/api/desk?source=modelled` — on the Worker too

## Where it runs

- **Sandbox (the desk of record):** the dev server on port 3000 through the
  sandbox **Preview Panel** ("Open in New Tab"). The archive lives in SQLite
  at `db/custom.db` — never rebuilt except through the desk's own
  regenerate path.
- **Cloudflare Worker (the deployment):** live at **https://currena.ir/gold**
  — the upgrade of the Currena site's gold page. Zone routes
  (`currena.ir/gold` and `currena.ir/gold/*`, recorded in `wrangler.jsonc`)
  claim exactly the `/gold` paths for the `currena-gold-desk` worker; the
  rest of currena.ir — the Currency Converter served by the owner's
  `currena-api` worker through its custom domain — is untouched. The worker
  build runs with `NEXT_PUBLIC_BASE_PATH=/gold` (Next.js basePath — every
  route, asset and RSC fetch under `/gold`; the sandbox dev server serves
  the same code at `/`). A workers.dev mirror of the desk serves at
  `currena-gold-desk.sedanama-ir.workers.dev/gold` as a preview. D1 database
  `aurum-desk` seeded from the archive, `EODHD_TOKEN` attached as a Worker
  secret. Verified against the live URL: every route, the force flag,
  byte-identical archive responses, the watch write path through the routed
  URL, and the browser golden path with zero console errors. The full
  record is in `AGENTS.md`'s deployment addendum.

Deployed live on 2026-11-22 — first to the account's workers.dev subdomain,
then, per the owner's clarification ("we supposed to upgrade
currena.ir/gold"), routed onto the Currena site at currena.ir/gold the
same day and re-verified there end to end. Credentials were used env-only
— never stored or printed, per the repo's credential rule.

Honest differences on the Worker (both fail-closed by design):

- New/regenerated desk days there carry **template-written narratives** (the
  strategist LLM is a sandbox-internal service; `narrativeSource` records
  which one served).
- The Worker's D1 is **seeded once** from the archive and then continues on
  its own; `db/custom.db` remains the desk of record in this repository.

## The record

- `AGENTS.md` — the programme rulebook, the full S15 close-out record, and
  the Currena Worker deployment addendum.
- One branch per session: `feat/gie-s9-supporting-visuals` through
  `feat/gie-s15-closeout`, then `feat/gie-deploy-currena-worker` (this
  branch).

## History note (important)

On 2026-11-22, per the owner's instruction, this branch's tree was switched
to the desk via a normal merge commit — no force, nothing deleted. The
previous main tree — the upstream **Currena** monorepo (`apps/`, `packages/`,
`docs/`, last at the upstream GIE-S8 close-out, commit `e45397b`) — is
preserved in full in git history as that merge commit's first parent.

Restore the previous tree any time: `git revert -m 1 <merge-commit>` on a
new branch, or check out `e45397b` directly.

## Honesty rules

Every number on the desk states its era and its sample size; the desk is an
observation, never advice. API keys stay in environment variables
(`.env.local` and `.dev.vars`, both gitignored) — never in this repository.
