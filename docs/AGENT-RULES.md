# Currena — Agent Working Rules

> **Permanent rules for any AI agent or developer working on this repository.**
> Supplied by the owner, Assad (2026-11-07), and rephrased here for the repo.
> These rules override convenience and always win over speed or style
> preferences. They live at the repo root on purpose: read them before
> touching anything.

---

### 1. Short sessions, many of them

Never cram work into one long session. Smaller scope = more stable and more
accurate work. Three short sessions always beat one long one. The session
scope is defined by `docs/page-division/01-SESSION-ROADMAP.md` — do exactly
one session's scope per session, then stop and hand off.

### 2. Commit continuously — never lose work

During every session, commit and push to GitHub at every meaningful
checkpoint: after each component, each fix, each document. An interrupted or
crashed session must never cost more than the last checkpoint. An unpushed
session is a session that never happened.

### 3. Close every session with a hand-off

Every finished session ends with three things, in this order:

1. a **next-session prompt** (copy-paste ready),
2. an **explicit progress counter** in the form `Session X/30 · Y remaining`,
3. a **clear list of what remains** (next session's scope + anything carried
   over).

Never leave the next agent — or the owner — to guess the state.

### 4. Green gates or no progress

Every session must **test, backtest, and audit** what it touched:

- **Testing** — rendering, interactions, routes, mobile widths, error states.
- **Backtesting** — verdicts and series verified against the stored engines,
  frozen scenarios, and `/api/insights` snapshots; page-rendered values must
  match engine values byte-for-byte.
- **Auditing** — a spec-vs-implementation diff for the session's scope, plus
  data freshness within cadence grace.

Work passes to the next session **only when everything is green**. If
something is red and unfixable within the session, roll it back or clearly
quarantine it — and say so in the hand-off. Never pass red work forward
silently.

### 5. Financial-data discipline — never assume

This product deals with people's money. Therefore:

- **Never assume a number, series, or verdict is correct.** Fetch it, verify
  it against its source, and cross-check against a second voice where one
  exists.
- **When unsure, fail closed.** Unverifiable data is displayed as
  unverifiable (`unread`) or not displayed at all. No silent guesses, no
  "probably fine", no invented values — ever.
- Candidate data sources (new FRED/ECB series, new venues) are verified live
  against the publisher before an adapter merges them; if a candidate can't
  be verified, it is discarded and recorded.

### 6. Credentials stay out of the repo

API tokens, account ids, and keys belong in environment variables / wrangler
secrets — never in code, never in commits, never in documents pushed to
GitHub. If a token appears in a chat, it is re-supplied per session; it is
never written to disk inside this repository.

---

*These rules are the owner's voice in the repo. Breaking them = the session
doesn't count.*
