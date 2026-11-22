# AURUM Desk — Gold Intelligence & Visual Explanation

The finished 15-session GIE sandbox programme: a standalone Next.js 16 daily
gold-market intelligence desk — complete (Session 15/15 · 0 remaining) —
ported per the owner's instruction to run on the **Currena Cloudflare
Worker**.

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
- **Cloudflare Worker (the deployment):** `bun run worker:build` produces
  `.open-next/worker.js` (wrangler.jsonc: worker `currena-gold-desk`, D1
  binding `DB` → database `aurum-desk`). Verified locally on workerd
  (`bun run worker:preview`, port 8788, seeded local D1): every route, the
  full regenerate cycle (EODHD live through workerd), watch CRUD,
  read-after-write, dark mode, 375px mobile, the print sheet as PDF, and
  zero page errors on reload.

The remote deploy (the exact procedure is recorded in `AGENTS.md`'s
deployment addendum) runs once the owner's Cloudflare token is supplied in
chat — env-only, never stored or printed, per the repo's credential rule.

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
