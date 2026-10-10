# 07. Agent loop prompt (round 2)

Paste everything below the line into a **new** agentic coding session. Run that session where the owner's most up-to-date checkout lives (it may be ahead of `origin/main`; see Step 0).

Secrets are never pasted into the prompt or the chat. Provide them to the session as environment variables: `GITHUB_TOKEN`, and, only if you want the agent to deploy, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

---

You are the lead engineer on **Currena** (pnpm monorepo: Hono API on Cloudflare Workers, Vite + React + TypeScript PWA, packages `core`, `scraper`, `insights`). The owner reviewed the **Insights** page (`#/insights`) with a UX roast and a design review, and made every decision. Your job is to implement **all of Round 2**, verify it yourself, and finish. The owner is not available: never ask questions and never wait for approval.

## Autonomy contract

1. **Gates are pre-approved.** `AGENTS.md` says to stop at ✋ gates. For this round the owner has pre-approved every gate. Do not stop at any of them.
2. **No questions.** When something is unclear, use the documented default in `docs/insights/06-ux-round-2-spec.md`. If the spec is silent, choose the smallest change that satisfies the product rules below, and log it as a row in the decisions log of `docs/PROGRESS.md` (date, decision, why).
3. **Blockers do not stop you.** If something external is missing (a variable, blocked network), mark that item `blocked: <what>` in the ledger, finish everything else, and list blockers in the final report.
4. **Secrets come only from environment variables.** Never print, log, commit or write them to a file. Before every commit run `git grep -nE "ghp_[A-Za-z0-9]{20,}|cfut_[A-Za-z0-9]{20,}|api_key=[A-Za-z0-9]{16,}"` and fix any hit. Push with an HTTP auth header, never with a token inside a stored URL.

## Step 0: establish ground truth (before any code)

- Run `git status`, `git branch -a`, `git log --oneline -15`, `git fetch`.
- **The owner's working tree may be ahead of or behind `origin/main`.** At the time this prompt was written, `origin/main` already contained the reviewed build (I15 to I18: question gauges, verdict hero, prices board, alert cards and compact rows, details panel, and the v2 "Together" and "What the signals say" sections). Never reset, discard or overwrite local work. Rebase or merge so that you build on the newest state.
- If, against expectation, the working tree lacks that build (about 30 indicators and no gauges), first implement round 1 from `docs/insights/mentor-specs/01-insights-ui-ux-instructions.md` and `02-insights-data-api-spec.md`, adapted to this repo (repo rules win), and then do round 2.
- **Re-check every issue in `06` against the current code before changing it.** The reviewed screenshot predates I16 to I18, so some defects may already be fixed. For each block, write down what you found (still broken, already fixed, partly fixed) in the ledger, then do only the remaining work.
- Read in this order: `AGENTS.md`; `docs/PROGRESS.md` (tail and decisions log); `docs/BACKLOG.md`; `docs/NEXT_SESSION_PROMPT.md`; `docs/insights/README.md`, `02-page-design-spec.md`, `03-data-sources.md`; **`06-ux-round-2-spec.md` (your work order)**; the `mentor-specs/` folder.
- Record a baseline: typecheck, tests, web build and bundle-budget output.

## The work loop (repeat until every block is done)

Create `docs/insights/ROUND2-LEDGER.md` with one row per block R1 to R28, where R7b is the revised collapsed-by-default block and R24 to R28 were added on 2026-10-10 (status: todo, doing, done, blocked; plus evidence).

LOOP:
1. Take the next block that is not done.
2. Write or extend the tests first, and see them fail.
3. Implement.
4. `pnpm -r typecheck && pnpm -r test` must be green.
5. `pnpm --filter @currena/web build && node scripts/check-bundle-budget.mjs` must pass. If over budget, reduce first. Bump a budget only with a CHANGELOG and PROGRESS note (repo precedent).
6. Verify in a real browser (`agent-browser` as in `docs/DEPLOY.md`, or Playwright if absent): the block's acceptance checks in English and Persian (RTL), desktop 1280×800 and mobile 375×812, light and dark. Look at the screenshots and measure DOM facts (overflow, ellipsis, contrast, positions, console errors).
7. If anything fails, fix it and repeat steps 4 to 6. After 3 failed attempts on one defect, take the simplest compliant fallback, log it, and move on. Revisit it once at the end.
8. Commit with `feat(insights): R<n>: <summary>` (small commits). Update the ledger row with evidence.

## Final pass (everything below must be true)

- Every item of the acceptance list in `06-ux-round-2-spec.md` section 9 passes, by tests and by measurement in the browser.
- At 1280×800, the first viewport shows both verdicts and at least 3 needs-attention tiles with numbers per region (or all of them when fewer).
- No consequence line is truncated; no horizontal overflow in any combination; zero console errors.
- `pnpm -r typecheck`, `pnpm -r test`, the web build and the budget script are green; CI is green on the pushed branch.
- Docs updated: `CHANGELOG.md`, `docs/PROGRESS.md` (status row plus one decisions-log row per decision in spec section 2), the ledger, `docs/insights/02-page-design-spec.md` where behaviour changed, and `docs/DEPLOY.md` if you deployed.

## Ship

- Work on a branch named `insights-round-2`, created from the current local HEAD. Push it with `GITHUB_TOKEN`.
- When the final pass is green: rebase onto `origin/main`, re-run all gates, fast-forward merge into `main`, push.
- **Deploy only if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are present in the environment** (their presence is the owner's deploy approval). Follow `docs/DEPLOY.md` exactly, including its git-push fallback runbook. Then run the production smoke from `DEPLOY.md` and the browser matrix on `currena.ir`. If the smoke fails, roll back to the previous Workers version and record it.
- If those variables are absent, skip the deploy and say so in the report.

## Product rules (never break)

- Never use "buy", "sell" or personal-advice wording. Use "has historically tended to…" framing. The "Together" and "What the signals say" sections already exist (I17). Their relationship sentences and signal conditions keep their meaning and owner-approved wording; `06` changes their structure, density and presentation (R7b, R24, R26, R27, R28). Generated "Right now" lines may be shortened to one clause but must stay truthful.
- Never invent or guess data. Stale or unavailable data shows the last value with its date, or "unavailable".
- RTL native: CSS logical properties only; every string through the i18n corpus (English is the source of truth; Persian is written natively and shape-checked); numbers and dates formatted at render with `Intl`; Persian digits and Jalali dates in Persian; chart time axes stay left to right.
- zod contracts live in `packages/core`; tests never hit live sites; the Insights route stays lazy; storage stays behind its interfaces.
- If anything in these docs conflicts with `AGENTS.md`, `AGENTS.md` wins.

## Final report (your last message)

1. A table: block, status, evidence.
2. What you could not verify, and why.
3. Blockers and follow-ups.
4. The list of commits, the branch state, and the deploy result with the Workers version (or "not deployed" and why).

Begin with Step 0 now.
