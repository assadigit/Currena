# Insights — Layer 1: Plain-Language Copy (Spec)

Repo: assadigit/Currena (Cloudflare Workers). Page: currena.ir/#/insights.
Companion file: `INSIGHTS-L1-STYLE-GUIDE.md` (voice, hard writing rules, glossary seed, examples). Read both fully before doing anything.

## 1. Why this exists

Insights is full of financial terms an average person does not understand ("US 10-year real yield 2.95%"). Numbers without meaning are useless to our reader. Layer 1 adds fixed, hand-quality plain-language writing to EVERY indicator, in Farsi and English, so each card answers: "what is this, and what does it mean for my everyday life?"

Layer 1 uses NO AI at runtime. The writing is static, bundled with the app, and identical for every visitor. (A later Layer 2 will use an AI to explain the live state; Layer 1 supplies its vocabulary. Do not build any AI feature now.)

Target reader: an adult with no finance education who wants leads for saving and investing decisions. The site owner himself is this reader. If he cannot explain a sentence to a friend after reading it, the sentence fails.

## 2. Scope

IN: copy for every indicator on the Insights page (all sections: global indicators, Australia indicators, prices, world stock markets, currencies/pairs, any gauges/patterns that have their own name), a glossary of plain-word definitions, minimal display of this copy, automated checks, a review file.

OUT (do not touch): data fetching, API calls, KV usage, thresholds, verdict/gauge math, hero logic, visual design system, section layout, the disclaimer, status-chip wording that was already approved. Only add copy and the smallest possible display hook.

## 3. Step 0 — Discovery (do this first, no questions to the owner)

1. Read the repo's existing Insights specs/docs/roadmap and any wording decisions (status chips Warning/Normal/Context, summary labels Relaxed/Cautious/Stressed/Alarmed, Persian terminology choices, Persian digits, Jalali dates). Already-approved wording is authoritative: match it, never contradict it.
2. Build the full indicator inventory FROM THE CODE (single source of truth): every card/indicator/pattern/ratio/pair/index, with its stable id, official name, section, unit, and what it measures. Write it to `docs/insights/layer1/INVENTORY.md`.
3. Find how the page currently renders cards and the expanded view, and how languages and the toggle work. Reuse them.

## 4. Copy model (per indicator, both languages)

Every indicator gets all fields below in `en` and `fa`. Limits are for English; Farsi must be of comparable length.

| Field | What it is | Limit |
|---|---|---|
| `plainName` | friendly label shown beside the official name (the official name stays) | ≤ 6 words |
| `oneLine` | ALWAYS-TRUE everyday effect, direction-neutral, state-independent | ≤ 16 words, 1 sentence |
| `whatItIs` | what is being measured, in plain words | ≤ 35 words |
| `whyItMatters` | how it touches daily life (prices, loans, savings, jobs, travel) | ≤ 55 words |
| `ifRising` | what a rise usually means for ordinary people | 1 sentence, ≤ 22 words |
| `ifFalling` | what a fall usually means | 1 sentence, ≤ 22 words |
| `connections` | 0–3 links to other indicators: `{with: <id>, text, strength}` with strength `reliable` / `usually` / `sometimes` | 1 sentence each |
| `australiaAngle` | OPTIONAL: only when it clearly affects people in Australia (RBA, home loans, rent, petrol, AUD) | 1–2 sentences |
| `glossaryTerms` | ids of glossary terms used in this indicator's copy | list |

Critical rule: `oneLine`, `ifRising`, `ifFalling` must be TRUE REGARDLESS OF TODAY'S NUMBERS. Never write "oil is high" — write "when oil gets more expensive…". Static copy must never contradict a live gauge or alert.

If rising/falling is genuinely meaningless for an indicator, set that field to `null` and add `skipReason` (rare; justify in the decisions log).

## 5. Where the copy lives

- One typed content source keyed by the indicator's existing stable id (follow the repo's language and conventions: TS modules or JSON, agent's choice). Example shape: `copy[id][lang].oneLine`.
- Glossary in the same place: `glossary[termId][lang] = { term, plain, example? }`.
- Bundled with the app. NO KV reads/writes, NO new external calls, NO runtime generation. Zero impact on free-tier limits.
- Export typed accessors `getIndicatorCopy(id, lang)` and `getGlossary(lang)` and add a short README in the folder explaining the shape (Layer 2 will import these).

## 6. Showing it on the page (minimal)

- Card (collapsed): show `oneLine` as small, muted text under the value/label, in the active language. Keep the card's existing hierarchy; do not enlarge cards.
- Expanded view: add, in order, `whatItIs` (label: "What is it?" / «چیست؟»), `whyItMatters` («چرا مهم است؟»), `ifRising` («اگر بالا برود») and `ifFalling` («اگر پایین بیاید»), `connections` («ارتباط با»), `australiaAngle` if present, and a small "Plain words" («معنی واژه‌ها») list for the indicator's glossary terms. If the card already knows its direction, visually emphasise the matching ifRising/ifFalling line. Prefer labels already used in the UI; use the above as seeds.
- Use existing styles, RTL handling and Persian digit conventions. Final placement and polish will be refined later by a designer; keep it simple and consistent now.

## 7. How to write (process)

1. Read the style guide. Learn the glossary seed. Extend the glossary as you find jargon.
2. For each indicator, write English FIRST from its meaning, then write Farsi NATIVELY from the same meaning. Do not machine-translate; write the way a clear Iranian finance explainer would. Use terms Iranian users already know from Iranian economic/stock websites (consistent with already-approved site wording).
3. Work in batches (5–8 indicators), run the checks after every batch, fix, then continue.
4. Same thing = same word everywhere (consistency): one plain word per concept across all indicators and both languages.

## 8. Accuracy rules (important — this is finance)

- Describe, never advise. No "buy/sell/should/invest now". No predictions. No certainty words: use "usually", "often", "tends to", "can".
- Only state relationships economists widely teach (e.g. higher interest rates tend to pressure gold, higher oil tends to push up inflation). If you are not highly confident a relationship is widely accepted, leave it out or mark `sometimes` with softened wording.
- No invented numbers or thresholds. Do not put digits in static copy except glossary examples (clearly marked as examples) or values read from the existing threshold config.
- Region honesty: say "people" / "households" for global indicators; mention Australia only in `australiaAngle` or inside the Australia section.
- Everything must be consistent with the site's existing disclaimer and its "not financial advice" stance.

## 9. Automated gates (build a validation script/test and wire it into the existing test command)

The task is not done until all pass:

- G1 Completeness: every indicator id found in code has every required field in both languages; no copy exists for ids that no longer exist. (This also protects the future: adding an indicator without copy fails the check.)
- G2 Length limits from section 4.
- G3 Jargon: a jargon list (seed in the style guide, extend it). Any jargon term in copy must be a glossary term listed in that indicator's `glossaryTerms`, or be replaced with a plain word.
- G4 Banned advice/certainty words (EN and FA lists in the style guide) appear nowhere.
- G5 Farsi hygiene: Persian digits only, no Latin letters except the allow-list (tickers/symbols such as VIX, S&P), Persian yeh/kaf (ی ک) not Arabic (ي ك), no double spaces, correct half-space (نیم‌فاصله) where the repo already uses it.
- G6 No digits in static copy except allowed cases (section 8).
- G7 Readability: average sentence ≤ 20 words (EN) and ≤ 22 words (FA); no single sentence over 28 words.
- G8 Existing tests and build still pass; no change in data/verdict outputs.
- G9 Rendering: if a headless browser is available, check the page in EN and FA at 360px and 1280px wide: no horizontal overflow, no clipped text, RTL intact, toggle works. If not available, state that in the final report.
- G10 Free-tier safety: confirm in the report that Layer 1 adds zero KV operations and zero external calls.

## 10. Meaning review (you do this yourself)

After the gates pass, re-read every indicator as a non-economist. For each: does `oneLine` alone tell a normal person something useful? Does the Farsi say the same thing as the English? Would any sentence need a second read? Rewrite until no. Record the check in the review file.

## 11. Review file for the owner

Generate `docs/insights/layer1/COPY-REVIEW.md`: per indicator, a table of every factual claim (`ifRising`, `ifFalling`, each `connection`, `australiaAngle`) with its strength and the plain basis ("widely taught: higher rates make non-interest assets less attractive"). Mark any Australia-specific or less-certain claim "needs expert check". The owner may have a qualified person review this file.

## 12. Autonomous loop and definition of done

Do not ask the owner questions. When something is ambiguous, read the code and existing specs, choose the most conservative reasonable option, and log it in `docs/insights/layer1/DECISIONS.md` (assumption + reason). Loop: write → validate → render-check → fix → repeat until every gate passes.

Work in small commits. Follow the repo's existing branch/deploy convention (check git log and README for how earlier sessions did it). Never deploy while any gate fails.

Done = all gates green, every indicator has complete EN+FA copy, copy visible on the page in both languages, review + decisions + inventory files present, and a final report that lists: indicator count, glossary term count, gates passed, anything skipped and why.

## 13. Leave behind for Layer 2

Stable ids, the typed accessors, the glossary, and a one-paragraph note in the folder README: "Layer 2 will pass the AI the computed state plus this glossary; static copy here is the source of vocabulary."
