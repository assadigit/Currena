# Layer-2 Narrator — Kill Criteria + Switch-Off (M5, spec §13)

This is the operator's runbook for **turning the narrator OFF** (templates only)
or **turning Part 3 ("In the news") OFF**, in one line. The thresholds are the
spec §13 verbatim.

---

## 1. Narrator off (templates only)

Switch off **the model calls** but keep the texts flowing (the templates
take over — same layout, same V1–V10 validation, just deterministic and
plainer). One command, applied via `wrangler versions upload` so the
deploy-lock protocol stays intact:

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_ENABLED:false
```

(Or edit `apps/api/wrangler.jsonc` to `"NARRATOR_ENABLED": "false"` and run
`pnpm deploy` from the repo root — same effect, same protocol.)

**When to flip it (the spec §13 thresholds, applied to the daily-bucket
stats in `insights:narrator:stats`):**

1. **More than 1 in 5 A-generations fail validation.**
   Compute: `aiFailedByCheck (sum over checks)` ÷ `(aiValid + aiFailedByCheck + templateUsed + apiErrors)`.
   If the 7-day rolling ratio exceeds 0.20 → switch off.

2. **Any published text contradicts a gauge or verdict.**
   A spot check at `https://currena.ir/?narrative=preview#/insights` finds a
   narrative saying "calm" when the gauge reads Stressed, or vice versa.
   The validators should catch this (V8) — but if one slips through, switch
   off immediately. One contradiction is enough; this is the kill the spec
   treats as non-negotiable.

3. **The owner cannot explain a text to a friend in one breath.**
   The "one-breath" test from the spec §13. If a narrative is too complex,
   too hedge-heavy, or too vague for the owner to read aloud naturally,
   the model is not the right model for the audience. Switch off.

4. **API/region errors make it unreliable.**
   Compute: `apiErrors (sum over kinds, region included)` ÷
   `(aiValid + aiFailedByCheck + templateUsed + apiErrors)`.
   If the 7-day rolling ratio exceeds 0.20 → switch off (the template
   fallback is the safe default; the spec §5 region-risk path says: try
   `placement: { mode: 'smart' }` first, switch off if still failing).

After the switch-off, the texts keep rendering (templates), and the
stats keep counting. To re-enable, flip `NARRATOR_ENABLED` back to `true`.

---

## 2. News context off (`NARRATOR_WEB_CONTEXT=false`)

Switch off **only Part 3 ("In the news")**. Part 1 (section narratives) and
Part 2 (overall summary) keep running. One command:

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_WEB_CONTEXT:false
```

**When to flip it (the spec §13 thresholds):**

1. **Any item is found inaccurate or stale on a spot check.**
   The owner reads an "In the news" note, opens the linked sources, and
   finds the note contradicts the source or the source is older than this
   week. Switch off Part 3 immediately.

2. **Any item gives anything resembling advice.**
   The W3 check should catch "buy / sell / invest / should / must" but
   anything advice-shaped (a phrasing like "this could be a chance to…")
   is a kill.

3. **Google's terms change in a way we cannot meet.**
   The grounding terms (re-verified per D-29) require rendering Google's
   `searchEntryPoint.renderedContent` HTML beside grounded text. If Google
   changes the terms and the new requirements cannot be met, switch off.

4. **More than 1 in 3 grounded outputs are omitted by checks.**
   Compute: `newsOmittedByCheck` ÷ `(newsValid + newsOmittedByCheck + newsOverCap)`.
   If the 7-day rolling ratio exceeds 0.33 → switch off Part 3 (the W
   checks exist to keep bad notes off the page; if a third are failing,
   the model is not finding reputable recent sources for these sections).

---

## 3. Full kill (narrator + display off)

If both gates need to close — the model is fundamentally broken AND the
templates are reading wrong (very unlikely — the templates are deterministic
and pinned by 7,809 Layer-1 + 50 narrator eval tests) — turn off the
display too:

```sh
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_ENABLED:false --var NARRATOR_VISIBLE:false
```

The page renders exactly as it did before Layer 2. The KV doc stays in
place (the next flip is instant).

---

## 4. How to read the stats

The daily-bucket stats live at KV key `insights:narrator:stats`. To read
today's bucket from your own terminal:

```sh
cd apps/api && pnpm exec wrangler kv:key get --binding RATES insights:narrator:stats | jq .
```

The shape (per `apps/api/src/narrator-stats.ts`):

```jsonc
{
  "v": 1,
  "days": {
    "2026-10-28": {
      "runs": 24,                  // hourly ticks that ran
      "skippedUnchanged": 18,      // ticks where the stateHash was stable
      "aiValid": 5,                // A-generations that passed V1–V10
      "aiFailedByCheck": {         // A-generations that failed, by check id
        "V3": 0, "V7": 0, "V8": 1, "V10": 0
      },
      "apiErrors": {               // API errors, by kind (region included)
        "region": 0, "quota": 0, "invalid-key": 0, "http": 0,
        "network": 0, "timeout": 0, "schema": 0, "empty": 0
      },
      "templateUsed": 2,           // A-generations that fell back to template
      "newsAttempted": 4,
      "newsValid": 3,
      "newsOmittedByCheck": 1,
      "newsOverCap": 0
    }
  }
}
```

14 daily buckets are kept (pruned on write). The kill-criteria ratios
above are 7-day rolling — sum the last 7 buckets and apply the threshold.

---

## 5. The first-week discipline (the staged rollout)

The default state on deploy: `NARRATOR_ENABLED=false` (templates only) +
`NARRATOR_VISIBLE=false` (preview only). The owner's first week:

1. Run `pnpm narrator:set-key` in their own terminal (M3).
2. Flip `NARRATOR_ENABLED=true` (templates are replaced by AI output; the
   preview URL is still the only place to read it).
3. Read `https://currena.ir/?narrative=preview#/insights` daily for ~7
   days, in EN + FA, at 360px and 1280px. Spot-check the news notes
   against their sources.
4. If the kill criteria above stay green, flip `NARRATOR_VISIBLE=true`
   (the public URL starts rendering the narratives).
5. Keep watching the stats daily for another week. Any kill criterion
   tripping → the one-line switch-off above.

---

## 6. References

- The spec: `docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md` §13.
- The decisions: `docs/insights/layer2/DECISIONS.md` D-35 (kill-criteria
  defaults) + D-38 (the rung) + D-39 (M5 implementation).
- The final report: `docs/insights/layer2/LAYER2-REPORT.md`.
- The deploy-lock protocol: `docs/DEPLOY.md` (the D-43 lesson — check
  Cloudflare versions/deployments APIs before every `wrangler versions upload`).
