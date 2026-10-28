# Insights — Layer 2: The AI Narrator (Spec, customized)

Repo: assadigit/Currena. Prerequisites (done): Layer 1 plain-language copy; Layer 2 prep (`docs/insights/layer2/PREP-REPORT.md`, §7 lists the contracts to use). Read those first.

## 1. What this builds

A scheduled job in the Worker that uses Gemini to explain, in plain words, in Farsi and English:

1. **A narrative for EVERY section** of the Insights page (discover the sections from the code, e.g. global indicators, Australia, currency pairs, world indices, commodities/prices, whatever exists), explaining what that section's readings show today.
2. **An overall summary** for the whole page, anchored to the page's existing overall verdict(s).
3. **Optional "in the news" context** per section, produced by Gemini with Google Search grounding, clearly separated from (1) and (2), with sources shown.

Core principle: the math decides, the AI explains. The AI never decides a verdict, never invents a cause, never advises, never predicts, and is never called per visitor. Part 1 and 2 use ONLY our computed state (no internet). Only part 3 may use the internet, and it is kept visibly separate.

Interpretation to follow (log it in the decisions log): "overall verdict" = the page's existing math-computed verdict label(s) (Global and Australia summaries) shown with the overall narrative. Do not invent new verdict labels for sections that do not already have one.

## 2. Non-negotiables

- Do not ask the owner questions. Ambiguity → read code/docs, choose the most conservative option, log it in `docs/insights/layer2/DECISIONS.md` (continue after D-27).
- SECRETS: the Gemini API key is a Worker secret only. Never in the repo, logs, responses, client bundle, prompts or chat. See §10 for the key-setting tool you must build. The code must run safely WITHOUT a key (templates only, no errors).
- Do not change verdict math, thresholds, alert behaviour or Layer 1 copy. You MAY add new pure derived inputs for the narrator (e.g. per-section state) without displaying new verdict labels.
- Free-tier safety: report every new KV read/write and external call with daily totals. Reuse the existing scheduled handler; no new cron trigger unless unavoidable (log why). Check the CURRENT Cloudflare limits for the plan the Worker is on (subrequests per invocation, CPU time per invocation, cron triggers) and design within them; if one invocation cannot finish all calls, process a capped batch per run and carry the pending list in KV.
- Web bundle budgets hold (entry 296.00/89.50, Insights lazy 1100.00/260.00); D-16 path only if truly unavoidable. All earlier gates unchanged (`pnpm gates` green: Layer 1 validator 7809/7809, copy:audit, vocab drift, budgets).
- Never deploy while any gate fails; follow the deploy-lock protocol.

## 3. Inputs (use prep contracts; extend additively)

- Existing: `buildNarrationState(snapshot, now)`, `getNarratorVocabulary(ids, lang)`, `getNarratorUi`, `freshnessOf`.
- NEW pure, tested, additive: `buildSectionNarrationState(snapshot, sectionId, now)` returning for one section: the section id and plain label (both languages from existing UI strings), tier counts (how many readings in each existing tier/status), the top firing alerts and active patterns inside that section (id, tier, direction, plain magnitude), per-item freshness, an `excluded` array for stale/unavailable items, and the section's existing verdict label if it has one. Add golden fixtures for at least: a calm section, a section with several alerts, a section with excluded data, plus the Global and Australia sections from live-like data. Document in `docs/insights/layer2/SECTION-STATE.md`. Keep the existing 3 prep fixtures valid.
- `buildOverallNarrationState`: the page's existing verdict labels with their counts, the top few alerts across sections, overall exclusions.
- Vocabulary subset: only the ids present in the given state, plus their glossary terms.
- RULE: the AI never reads AI output. The overall narrative is generated from the overall STATE, not from the section texts.

## 4. When to run

Inside the existing scheduled handler. For each unit (each section, the overall) compute a `stateHash` (timestamps removed). Regenerate a unit only when its hash changed OR its text is older than 24 h. Process at most a capped number of model calls per invocation; pending units continue in the next run. Space calls to respect the free-tier per-minute limit (look it up).

## 5. Model calls

- Provider: Google Gemini API, free-tier key. Look up in Google's official docs the CURRENT Flash-class model name, free-tier rate limits, and Google Search grounding availability/quota on the free tier. Record in the decisions log. Model name in env var `NARRATOR_MODEL`.
- **Call type A (state narratives, no internet):** one call per unit returning both languages as JSON `{ "en": string, "fa": string }`, schema-constrained, temperature 0.2, short max tokens, 15 s timeout, one retry on network/5xx.
- **Call type B (news context, Google Search grounding):** a SEPARATE call per section (never mixed with call type A). Many Gemini versions cannot combine grounding with schema-constrained output, so ask for plain text with a fixed two-block format `EN: ... / FA: ...` and parse it; verify the current constraint in the docs. Use grounding metadata (sources, titles, search queries) from the response. Budget: a daily cap env var `NARRATOR_WEB_DAILY_CAP` (default 20 grounded calls/day) and at most one grounded call per section per 24 h; over the cap → skip part 3, never fail.
- Region risk: calls from some Cloudflare locations can be refused ("location not supported"). Handle explicitly: failure → template fallback / skip part 3, count in stats, check current mitigation (placement hints, AI Gateway) and report findings.
- Free-tier terms: free-tier content may be used by the provider to improve its products. Our inputs are public market data only. Note this in the decisions log and in `docs/DEPLOY.md`.
- **Grounding terms gate (mandatory before enabling part 3):** read the CURRENT Google terms for Grounding with Google Search and decide in the decisions log: (a) required display elements (e.g. search suggestions / search entry point) and how to render them; (b) any limits on storing, caching or redistributing grounded responses (we cache in KV and serve to many visitors); (c) free-tier eligibility. If any requirement cannot be met, or terms are unclear, SHIP PART 3 DISABLED (`NARRATOR_WEB_CONTEXT=false`) and say so in the report. If met, implement the required elements exactly.
- Never log the key, full prompts with state, or raw model output beyond a short truncated debug line.

## 6. The prompts (in `packages/insights/src/narrator/prompt.ts`, versioned `PROMPT_VERSION`)

### 6.1 Shared base rules (included in A-section and A-overall)

```
You write plain-language explanations for a financial dashboard, for ordinary readers with no finance education. You receive STATE (facts the dashboard's own math has already computed), VOCABULARY (approved plain wording for the indicators involved) and GLOSSARY (approved plain definitions). You never see the internet. Your only job is to explain STATE in plain words.

Hard rules:
1. Use only facts in STATE. Never add numbers, dates, causes, forecasts or events that are not in STATE or VOCABULARY.
2. Describe a relationship between indicators only if it appears in VOCABULARY (ifRising, ifFalling, connections). Never invent a reason why something moved.
3. Never advise. Never say buy, sell, invest, should or must. Never predict. Use hedged words: usually, often, tends to.
4. Any verdict label in STATE is given. Do not contradict, soften or exaggerate it. Describe it calmly in everyday words. No alarm, no drama.
5. Use plain words and the plain names from VOCABULARY. If you must use a term from GLOSSARY, explain it in the same sentence with its plain definition. Never use other finance jargon.
6. If STATE lists excluded items, say once, in one short clause, that some data is out of date and left out. Never state values of excluded items. For monthly items, say "latest monthly reading".
7. Short sentences, one idea each. Never name an indicator that is not in STATE.
8. Write the Farsi natively, as a clear Iranian finance explainer would for ordinary readers: spoken-formal register, Persian digits, correct half-spaces, no Latin letters except allowed symbols (VIX, S&P, ASX, ECB, RBA, USD, AUD, EUR, JPY, CNY, BTC, PMI). It must say the same thing as the English, not mirror its sentences.
9. Output only JSON matching {"en": string, "fa": string}. No markdown, no extra text.
```

### 6.2 Section prompt (A-section) = base rules + 

```
TASK: Explain what this one section shows today. 3 to 5 sentences, at most 90 words per language. Start with the big picture of the section (calm, mixed or under pressure, according to the tier counts and any verdict label in STATE), then name at most the two most important readings and what each usually means for everyday life, using VOCABULARY.
```

### 6.3 Overall prompt (A-overall) = base rules +

```
TASK: Write the overall summary of the whole page. 4 to 6 sentences, at most 120 words per language. State the overall verdict(s) given in STATE in everyday words, then the one or two themes that stand out across sections, using only STATE and VOCABULARY. End with one sentence reminding the reader this explains data and is not a recommendation.
```

### 6.4 News-context prompt (call type B, internet allowed via Google Search grounding)

```
You add a short "what is being reported" note to one section of a financial dashboard, for ordinary readers with no finance education. You receive SECTION (its id and plain label), STATE (what the dashboard's own math shows today) and VOCABULARY. You may search the web.

Rules:
1. Use only recent reports (this week). If you find nothing relevant and recent, output exactly NONE.
2. Report what reputable news and official sources are saying about the topics in this section, in your own words. Never quote. Never copy sentences. Never name individual people.
3. Attribute everything: use phrases like "reports suggest", "analysts commonly point to", "news coverage this week focuses on". Never state anything as certain.
4. No numbers or digits at all. No predictions. No advice. Never say buy, sell, invest, should or must.
5. Do not contradict STATE, and do not explain STATE; add context only. Stay on the section's topics.
6. Plain words only; if you use a finance term, explain it in the same sentence. Maximum 2 short sentences, at most 45 words per language.
7. Write the Farsi natively (spoken-formal, Persian letters and digits, correct half-spaces). It must carry the same meaning as the English.
8. Output exactly:
EN: <text>
FA: <text>
or the single word NONE.
```

User message for all calls: `SCOPE: <section id | overall>`, `STATE: <json>`, `VOCABULARY: <json>`, `GLOSSARY: <json>`.

## 7. Validation (deterministic, `narrator/validate.ts`, pure, unit-tested)

**State narratives (A) must pass ALL:**
- V1 schema valid, both languages non-empty.
- V2 length limits per prompt; no sentence over 28 words.
- V3 numbers: every number (normalise Persian/Arabic digits) must be in the allowed set derived from that unit's STATE.
- V4 banned advice/certainty words (Layer 1 EN + FA lists).
- V5 jargon (Layer 1 list) only if the term is in the provided GLOSSARY.
- V6 Farsi hygiene (Layer 1 G5).
- V7 invented drivers: no indicator name (plainName or official name, either language) from the FULL vocabulary that is not in this unit's state.
- V8 tone consistency: against the verdict label if present; otherwise against the section's tier counts (no firing alerts → reject alarm words; many firing → reject "calm / all clear"). Seed word lists EN + FA, extend.
- V9 language check: `fa` mostly Persian script, `en` mostly Latin.
- V10 exclusions: if `excluded` is non-empty the text must include the out-of-date clause; if empty it must not claim data is out of date.

**News context (B) must pass ALL, else part 3 is simply omitted for that section:**
- W1 at least one grounding source (URL + title) came back with the response; otherwise omit.
- W2 no digits at all, in either language.
- W3 no advice, certainty or prediction words (Layer 1 lists + "will rise/fall/crash" etc., EN + FA).
- W4 an attribution phrase is present (seed list EN + FA).
- W5 jargon rule as V5; W6 Farsi hygiene as V6; W9 language check as V9.
- W7 at most 2 sentences and 45 words per language.
- W8 no quotation marks (no quoting) and no tone words contradicting the verdict/section tone (as V8).
- W10 the text must be about the section: it must mention at least one topic word from the section's vocabulary plainNames, or be omitted.

On a failed A check: one regeneration attempt with the failed check names appended; second failure → template for that unit. A failed B check: omit part 3 (no retry). Record all outcomes in stats.

## 8. Template fallback (no AI, always works)

`templateNarrative(state, unit, lang)` in `narrator/template.ts`: deterministic 2–4 sentences from the approved summary labels, tier counts, up to two top alerts' `plainName` + `oneLine`, and the out-of-date clause when needed. It must itself pass V1–V10 for every fixture in both languages. Used when: no key, kill switch, API failure, region refusal, or two validation failures. Part 3 has no template: it is simply absent.

## 9. Storage, API, stats

- KV `insights:narrative:v1`: `{ promptVersion, model, generatedAt, dataAsOf, overall: {stateHash, en, fa, source:"ai"|"template"}, sections: { <id>: { stateHash, en, fa, source, news?: { en, fa, sources:[{title,url}], generatedAt, requiredDisplay? } } } }`. One write per generation cycle that changed something.
- KV `insights:narrator:stats`: daily buckets (keep 14 days): runs, skipped-unchanged, ai-valid, ai-failed-by-check (per check id), api-errors (incl. region), template-used, news-attempted, news-valid, news-omitted-by-check, news-over-cap.
- Endpoint `/api/insights/narrative` (additive; do not enlarge the existing payload), edge-cached (e.g. `s-maxage=600`) so visitors do not become KV reads. Report estimated KV reads/day.
- Env flags: `NARRATOR_ENABLED` (kill switch), `NARRATOR_VISIBLE` (public visibility, default false), `NARRATOR_WEB_CONTEXT` (part 3 generation; default true ONLY if the grounding terms gate passed, else false), `NARRATOR_WEB_DAILY_CAP`, `NARRATOR_MODEL`.

## 10. The Gemini key (owner enters it; never pasted into chat or into the agent)

Build `pnpm narrator:set-key`:
1. Prompts in the terminal for the key with HIDDEN input (no echo). Never accepts it as a command-line argument. Never prints, logs or stores it.
2. Validates it with one minimal Gemini call; shows only success or a clear failure reason (invalid key, quota, region).
3. Pipes it to `wrangler secret put GEMINI_API_KEY` via stdin. If wrangler is not logged in, prints the single command to fix that.
4. Prints "Key saved. Nothing else to do." On success.
Add to `pnpm gates` a secret scan (Google key pattern `AIza[0-9A-Za-z_-]{35}` and generic long secrets) over the whole repo and its tracked files; also ensure `.dev.vars` and similar are git-ignored. Document in `docs/DEPLOY.md`: create the key in Google AI Studio inside a project WITHOUT billing enabled (so the free tier can never charge), and rotate the key immediately if it was ever pasted anywhere public.

## 11. Display (minimal; a designer refines later)

- Under each section's header: a muted block with the section narrative in the active language, small label «خلاصهٔ ساده» / "Plain-language summary", `updated <time>`. Under the page's top verdict(s): the overall narrative. If `source` is `ai`, add «نوشته‌شده با هوش مصنوعی، نه توصیهٔ مالی» / "AI-written, not financial advice" (match the site's existing disclaimer wording); template → no AI label.
- Part 3, only when present: a visually separate small block «در خبرها» / "In the news" with the note, the line «از گزارش‌های وب، خلاصه‌شده با هوش مصنوعی؛ تأییدنشده و نه توصیهٔ مالی» / "Summarized by AI from web reports; not verified; not financial advice", the sources (title + domain as links, opening in a new tab with `rel="noopener noreferrer"`), and any display element Google's terms require (§5).
- Missing/failed fetch → render nothing; nothing breaks. Existing styles, RTL, Persian digits, `copy:audit` clean.
- STAGED ROLLOUT: while `NARRATOR_VISIBLE=false` the narratives are generated and stored but shown only in preview (URL marker that works with the hash router, e.g. `?narrative=preview`). The owner reads real text on the real page for about a week, then flips visibility.

## 12. Evaluation harness

- `pnpm narrator:eval` (offline, no key): all fixtures (prep fixtures + new section/overall fixtures + relaxed/alarmed/mixed/excluded days) through (a) templates and (b) MOCKED model outputs, including deliberately bad ones (invented number, invented cause, advice word, wrong tone, English digits in Farsi, missing out-of-date clause, news text with digits / quotes / no sources / no attribution). Every bad output must be rejected by the intended check, every good one accepted. Add to `pnpm gates`.
- `pnpm narrator:eval:live` (needs the key, skipped cleanly if absent): runs fixtures through the real model, including a few grounded calls, and writes outputs + validation results to `docs/insights/layer2/EVAL-OUTPUTS.md` for the owner to read (Farsi included).

## 13. Kill criteria (write to `docs/insights/layer2/KILL-CRITERIA.md`, with one-line switch-off instructions)

Narrator off (templates only) if: more than 1 in 5 A-generations fail validation; any published text contradicts a gauge or verdict; the owner cannot explain a text to a friend in one breath; API/region errors make it unreliable. News context off (`NARRATOR_WEB_CONTEXT=false`) if: any item is found inaccurate or stale on a spot check, any item gives anything resembling advice, Google's terms change in a way we cannot meet, or more than 1 in 3 grounded outputs are omitted by checks.

## 14. Deployment and done

Deploy with `NARRATOR_VISIBLE=false`; without a key, templates only. Verify live: health ok, narrative endpoint returns, preview URL shows every section's text plus the overall summary in EN and FA at 360px and 1280px, the normal URL shows nothing new, no console errors, KV/API numbers reported.

Done = all gates green (Layer 1 numbers unchanged, secret scan clean), eval harness passing, deploy verified, and `docs/insights/layer2/LAYER2-REPORT.md` with: what shipped per section of this spec, files, gate results, free-tier numbers, Cloudflare limits found and how the design stays within them, the Gemini model/limits/grounding findings, the grounding-terms decision, region-risk findings, decisions D-28…, and the exact owner steps still required as copy-paste commands (`pnpm narrator:set-key`, preview, flip visibility).
