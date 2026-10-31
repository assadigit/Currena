# Session kickoff prompts

Paste the prompt for the next session into a fresh agent session opened at the
repo root. **Before you start:** export `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the shell, and make sure `git push origin main` works.
Never paste a credential into the chat.

At the end of every session the agent rewrites the next prompt below (with lessons
learned and exact state) and prints it. If you use an older prompt from this file
after a session ran, prefer the one the agent printed.

---

## S1 — Foundation and trust

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on the `main` branch; commit, push and deploy after every milestone.

Read, in this order, before touching anything:
1. AGENTS.md
2. docs/gap-closure/README.md
3. docs/gap-closure/00-OPERATING-RULES.md  (rules win over older docs for this program)
4. docs/gap-closure/PROGRESS.md
5. docs/gap-closure/VERIFIED-SOURCES.md
6. docs/gap-closure/S1-foundation-and-trust.md  (your session spec)

Your job: execute milestones M1.1 to M1.7 of S1 in order. For each milestone follow the loop in 00-OPERATING-RULES.md section 3: tests first, `pnpm gates` green, commit, `git pull --rebase`, push to main, deploy, verify on production in a real browser (EN and fa), update PROGRESS.md and CHANGELOG.md, push again.

Credentials: they must already be in the environment (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID). Never print or write them anywhere. If missing, stop and ask me to export them; never ask me to paste secrets.

Do not ask me questions unless: a credential is missing, an action is destructive or irreversible, a source needs an `owner_accepts` decision, or the spec says to ask. Otherwise choose the safest option, record it, and continue. After three honest failed attempts on an item, record it as blocked in PROGRESS.md and move on. Never circumvent a block, never remove or hide any existing indicator, index or country.

At the end: update PROGRESS.md (ticks, session log, gap coverage), update VERIFIED-SOURCES.md, rewrite the S2 prompt in docs/gap-closure/PROMPTS.md with lessons learned and the exact current state, commit and push, and print the S2 prompt in a code block as the last thing in your final message with a 5-line summary (what shipped, what is blocked, what I must do).
```

---

## S2 — Foreign holdings of US Treasuries

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md (confirm S1 is done; if S1 is incomplete, finish the carried-over items that this session needs, especially `rung3`), docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S2-treasury-foreign-holders.md.

Execute M2.1 to M2.6. This is the owner's top-priority feature: a table showing which countries hold, buy and sell US Treasuries (Japan and China are reducing holdings). The most important design rule: separate real net buying/selling (TIC Table 3 "Net U.S. Sales") from price effects ("Valuation Change"), and show the custody-hub caveat. Use ONLY the verified `slt_table5` and `slt_table3` URLs; the old `mfh.txt` is frozen at 2023.

Follow the milestone loop in 00-OPERATING-RULES.md section 3 (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify on production in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials come from the environment only; never print or write them. Ask me questions only under the conditions in the rules. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S3 prompt in PROMPTS.md with the exact state and lessons, commit and push, and print the S3 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S3 — US credit, liquidity, fiscal and growth nowcast

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S3-us-plumbing.md. Confirm S1 is done (the extra ingest rungs must exist).

Execute M3.1 to M3.6. Verify every candidate series and licence before building (never invent ids). New items are context-only. New fetches go on the new rungs, never on the full `main` rung. Keep daily KV writes within the budget in the rules.

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Ask questions only under the conditions in the rules. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S4 prompt in PROMPTS.md, commit and push, and print the S4 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S4 — Geopolitics, supply chain and energy

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S4-geopolitics-supply-energy.md. Confirm S1 is done.

Execute M4.1 to M4.6. Build the new "Is the world getting more fragmented?" gauge in shadow mode (members are context-only and the gauge says it is not scored yet). Verify GPR columns, PortWatch fields and the GSCPI egress before building; if GSCPI is blocked from Worker egress, record it and do not circumvent. Wording rule: measurements and tendencies only, never news causes.

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S5 prompt in PROMPTS.md, commit and push, and print the S5 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S5 — Australia deep-dive and Australian markets

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push (deploy both the api and, if changed, the markets worker) after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S5-australia.md. Confirm S1 is done.

Execute M5.1 to M5.6. Use ABS (CC BY 4.0) for the new macro series; verify every dataflow id from the ABS structure endpoints. Build a SEPARATE Australian markets board; do not touch the existing 16 world indices. Probe every index symbol before including it and keep only complete, fresh, plausible ones; prove EODHD quota arithmetic or use the Yahoo path. New gauges are shadow-mode ("not scored yet").

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: update PROGRESS.md and VERIFIED-SOURCES.md, rewrite the S6 prompt in PROMPTS.md, commit and push, and print the S6 prompt in a code block as the last thing in your final message with a 5-line summary.
```

---

## S6 — New Zealand, China and world links, promotion and polish

```
You are continuing the Currena gap-closure program in the repo assadigit/Currena (public). Work on `main`; commit, push and deploy after every milestone.

Read in order: AGENTS.md, docs/gap-closure/README.md, docs/gap-closure/00-OPERATING-RULES.md, docs/gap-closure/PROGRESS.md, docs/gap-closure/VERIFIED-SOURCES.md, then docs/gap-closure/S6-links-promotion-polish.md. Check PROGRESS.md for any blocked or carried-over items from S1 to S5 and handle those that matter first.

Execute M6.1 to M6.6. For New Zealand, measure the connection to Australia first and apply the decision rule in the spec. For promotion of shadow indicators to voters (M6.4): write the evidence-based proposal, then STOP and ask me to approve the list; promote only what I approve. Finish with the quality pass, the docs refresh, the portfolio case study and the credential-hygiene check.

Follow the milestone loop (tests first, `pnpm gates`, commit, rebase, push to main, deploy, verify in EN and fa, update PROGRESS.md and CHANGELOG.md). Credentials from the environment only. Never remove existing indicators.

At the end: finalise PROGRESS.md and VERIFIED-SOURCES.md, commit and push, and print a final summary (what shipped overall, final counts, what was rejected or blocked, my remaining action items). There is no next prompt.
```
