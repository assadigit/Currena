# Insights — Layer 1: Plain-Language Copy

Layer 1 adds fixed, hand-quality plain-language writing to **every
indicator** on the Insights page, in Farsi and English, so each card answers
"what is this, and what does it mean for my everyday life?" It uses **no AI
at runtime** — the copy is static, bundled with the app, identical for every
visitor.

## What lives here

| File | Purpose |
|---|---|
| `PLAIN-LANGUAGE-SPEC.md` | The task spec (the source of truth for this work) |
| `STYLE-GUIDE.md` | Voice, hard writing rules, glossary seed, worked examples |
| `DECISIONS.md` | Every ambiguity the spec left open, with the conservative choice taken |
| `INVENTORY.md` | The full 134-item indicator inventory built from code (the G1 source of truth) |
| `COPY-REVIEW.md` | Per-indicator factual-claim review table (for the owner / a qualified reviewer) |

## Where the copy lives (code)

The Layer-1 copy is a new top-level `layer1` object added to the existing
i18n dictionaries:

- `apps/web/src/i18n/insights-copy-en.ts` — `layer1.ui`, `layer1.indicators`, `layer1.glossary` (EN, source of truth)
- `apps/web/src/i18n/insights-copy-fa.ts` — the same shape (FA, compile-time shape-checked against EN)

Each `layer1.indicators[id]` carries the NEW Layer-1 fields only:
`plainName`, `oneLine`, `ifRising`, `ifFalling`, `connections`,
`australiaAngle?`, `glossaryTerms`. The approved `whatItIs` / `whyItMatters`
are REUSED from the existing `copy.indicators[id]` entry (see DECISIONS D-02
— approved wording wins; never duplicated).

Typed accessors live in `apps/web/src/components/insights/layer1/`:

```ts
import { getIndicatorCopy, getGlossary } from '@/components/insights/layer1';
const entry = getIndicatorCopy('us10y', 'en');   // merged Layer-1 + approved whatItIs/whyItMatters
const glossary = getGlossary('fa');              // { [termId]: { term, plain, example? } }
```

## The validation gate

`apps/web/src/components/insights/layer1/layer1.test.ts` enforces G1–G8
(spec §9) and runs with every `pnpm -r test`. A new indicator added to the
code without Layer-1 copy FAILS the build — by design.

## Leave-behind for Layer 2

> Layer 2 (a later, AI-driven live-state explainer) will pass the model the
> computed indicator state plus this glossary; the static copy here is the
> source of vocabulary. The typed accessors (`getIndicatorCopy`,
> `getGlossary`) and the stable ids are the contract Layer 2 imports. **No
> AI is built in Layer 1** — the spec is explicit.

## Free-tier safety

Layer 1 adds **zero** KV operations and **zero** external calls. The copy
is bundled into the (lazy) `/insights` route chunk; the only cost is the
documented bundle-budget bump (see CHANGELOG and `scripts/check-bundle-budget.mjs`).
