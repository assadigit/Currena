# AURUM Desk — Gold Intelligence & Visual Explanation

The finished 15-session GIE sandbox programme: a standalone Next.js 16 daily
gold-market intelligence desk — complete (Session 15/15 · 0 remaining).

## What this branch carries

- The **S14 digest band** — the whole day in one glance, print-exportable
- The **S8 briefing** — six model-written narrative sections (template fallback)
- The **S9 supporting visuals** — eight explainable charts with reading guides
- The **S10 live grounding** — EODHD price data, fail-closed to the deterministic engine (reachable via `/api/desk?source=modelled`)
- The **S11 track record** and then-vs-now memory
- The **S12 scorecard** — bias direction, base-case accuracy, probability calibration
- The **S13 owner watch rules** — CRUD in the desk, evaluated at read time
- The archive database at `db/custom.db` — part of the record; never rebuild it

## Where it runs

The desk is served by the sandbox dev server (port 3000) and previewed
through the sandbox **Preview Panel** (the "Open in New Tab" button).
It is **not deployed to the public internet**: this app stores its archive
in SQLite on disk (Prisma), which cannot run as-is on Cloudflare Workers.
A real deployment is a separate rearchitecture project (Cloudflare D1, or a
Node host) — start it as its own session if you want it.

## The record

- `AGENTS.md` — the programme rulebook plus the full S15 close-out record.
- One branch per session: `feat/gie-s9-supporting-visuals` through
  `feat/gie-s15-closeout`. Commit `cfe41e5` is the S15 close-out; this main
  tree equals it plus this README.

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
(`.env.local`, gitignored) — never in this repository.
