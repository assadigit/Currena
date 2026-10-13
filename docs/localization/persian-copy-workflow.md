# Persian copy workflow

How this repo keeps its Persian (fa) user-facing copy polished, and how to add
or change Persian text without silently losing review status.

The three artifacts:

| Artifact | Path | What it is |
| --- | --- | --- |
| Audit manifest | `docs/localization/persian-copy-manifest.json` | The canonical record: every user-facing fa string, its reviewed text, a sha256 fingerprint, where it lives, which round approved it |
| Audit checker | `scripts/audit-persian-copy.mjs` (`pnpm copy:audit`) | Compares live sources against the manifest; fails on untriaged, changed or removed strings |
| Manifest updater | `scripts/update-persian-copy-manifest.mjs` (`pnpm copy:audit:update`) | Records review decisions into the manifest after approval |

Terminology decisions live in `persian-terminology.md` (same folder).
CI runs the audit on every push and pull request (`.github/workflows/ci.yml`).

## Where Persian copy lives (and what the audit covers)

1. **Insights dictionary** — `apps/web/src/i18n/insights-copy-fa.ts`
   (1,379 strings: dashboard UI, markets, fx, panels, 47 indicator cards).
2. **App dictionary** — `apps/web/src/i18n/fa.ts` (423 strings: converter,
   tools, navigation, errors, accessibility labels). Key parity with `en.ts`
   is type-enforced and re-checked by the audit.
3. **Calendar titles** — `data/insights-calendar.json` (`titleFa` per event).
4. **Inline strings** — the ICS calendar name (`ics.ts`), the header language
   chip/menu (`Header.tsx`).
5. **Mirrors** — `packages/core/src/format.ts` hardcodes the four time-ago
   strings (`همین حالا`, `{n} دقیقه پیش`, `{n} ساعت پیش`, `{n} روز پیش`) that
   must stay identical to `common.justNow` / `common.minutesAgo` /
   `common.hoursAgo` / `common.daysAgo`. The audit checks the sync both ways.

The audit also sweeps all non-test source files for **any hardcoded Persian
literal** (string literals, template spans, JSX text — comments are never
scanned) and flags anything not claimed by the manifest. Persian-script
technical data (digit tables, separators, the TGJu scraper matcher) is claimed
by `kind: "technical"` entries so the sweep stays quiet; if one of those
changes, the audit still flags it.

## Statuses and kinds

Statuses (per manifest header):

- `processed` — reviewed and approved copy, fingerprint recorded.
- `unreviewed` — newly discovered string awaiting review.
- `needs-review` — previously processed text changed, or a human must verify.

A string is never `processed` just because it is written in Persian: the entry
must carry a traceable basis (`round` + `reference`).

Kinds: `copy` (user-facing text), `mirror` (hardcoded duplicate of a
dictionary key, `linkedKey`), `technical` (Persian-script data, not copy),
`latin-only` (fa dictionary value intentionally without Persian script —
tickers, pinned English notices such as the FRED attribution).

## The workflow

1. **A developer adds or changes a Persian string** in any of the covered
   sources (new dictionary key, new calendar event, new inline string, edit of
   an existing value, or a new hardcoded literal anywhere in `src/`).
2. **The audit flags it.** Run `pnpm copy:audit`:

   ```text
   NEW — untriaged Persian strings (1):
     common.someNewKey · apps/web/src/i18n/fa.ts · "متن جدید" → triage …
   CHANGED — reviewed text drifted (needs-review) (1):
     app.name · apps/web/src/i18n/fa.ts
   ```

   CI shows the same output. Exit 1 = something needs triage.
3. **A reviewer edits the text** into clear, natural, standard Persian while
   preserving technical meaning: keep `{placeholders}` intact (position may
   move), keep Latin tickers and pinned English notices (e.g. FRED attribution)
   as they are, no em dashes, respect the terminology glossary.
4. **Check the text in its real UI context** (run `pnpm --parallel dev`, switch
   the app to فارسی, look at the actual component; verify RTL rendering and
   wrapping). Also update any test that pins the old wording.
5. **Record the decision** in the manifest with the updater — it snapshots the
   current source text and fingerprint, never invents text:

   ```bash
   pnpm copy:audit -- --json /tmp/audit.json
   pnpm copy:audit:update -- --report /tmp/audit.json \
     --ids common.someNewKey \
     --status processed --round round-3 --reference my-copy-review.md
   ```

   - `--status processed` requires `--round` and `--reference`
     (which review document or discussion approved the wording).
   - To explicitly queue something instead:
     `--status needs-review --ids … --note "why it needs a human"`.
   - If a mirror is involved, update **both** places (`fa.ts` key **and** the
     `format.ts` template) before recording; the audit verifies the sync.
6. **Re-run the audit** — `pnpm copy:audit` must exit 0 before you push.

## Rules of thumb

- Never hand-edit `sha256` or `text` in the manifest JSON directly — run the
  updater; a fingerprint that does not match its own `text` is reported as
  `MANIFEST-ERROR`.
- Never mark a changed string `processed` just to silence the audit — the flag
  exists precisely so changed wording gets re-read by a human.
- New calendar events appear as NEW (id = event id) — review their `titleFa`
  with the same care as dictionary copy.
- Removing a dictionary key or an inline string leaves a `REMOVED` finding;
  delete the corresponding manifest entry in the same commit (that is the one
  manual manifest edit that is expected).
- The `DIVERGENT` section is advisory: it lists English texts that currently
  map to different Persian strings in different contexts (nav label vs page
  title, etc.). Read it, keep it intentional, no action needed if it is.
- Do not put review markers (like `[PROCESSED]`) into visible UI text — the
  manifest is the only place review status lives.

## History

- **Round 1** — `persian_site_copy_edited.md`: 253 insights strings + 8
  calendar titles, applied in commit 749ed6a.
- **Round 2** — the seven `persian_site_copy_round2_part*_polished-translated.md`
  files: the remaining 1,522 strings (dashboard UI/vocabulary, markets/fx
  panels, calendar, 47 indicator cards, converter core, tools), applied
  together with this audit system. The pre-polish inventory (`persian_site_copy_round2.md`
  and its seven part files) documents what was excluded and why.
