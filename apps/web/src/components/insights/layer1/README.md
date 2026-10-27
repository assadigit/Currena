# Layer 1 — accessors

Typed accessors for the Layer-1 plain-language copy
(`docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md`). The copy itself lives as a
new `layer1` object on the existing i18n dictionaries
(`apps/web/src/i18n/insights-copy-{en,fa}.ts`); this folder is the typed
contract for consumers and for the future Layer 2 (AI-driven live-state
explainer — not built here).

## Shape

```ts
interface Layer1Entry {
  plainName: string;           // ≤ 6 words; shown beside the official name
  oneLine: string;             // ALWAYS-TRUE everyday effect; ≤ 16 words, 1 sentence
  ifRising: string | null;     // what a rise usually means; ≤ 22 words; null for patterns (D-09)
  ifFalling: string | null;    // what a fall usually means; ≤ 22 words; null for patterns (D-09)
  skipReason?: string;         // present only when ifRising/ifFalling are null
  connections: Layer1Connection[];   // 0–3 links to other indicators
  australiaAngle?: string;     // only for AU + AUD/RBA/petrol/home-loan globals (D-08)
  glossaryTerms: string[];     // ids of glossary terms used in this entry's copy
}

interface Layer1GlossaryEntry { term: string; plain: string; example?: string; }
```

The approved `whatItIs` / `whyItMatters` are intentionally NOT here — they
are reused from the existing `copy.indicators[id]` (decision D-02: approved
wording wins over the style guide). A consumer reads them from the existing
copy structure for its surface (indicator card, market tile, FX pair).

## API

```ts
import {
  getIndicatorCopy, getGlossary, getGlossaryTerm, getLayer1Ui,
  LAYER1_INDICATOR_IDS, LAYER1_GLOSSARY_IDS, LAYER1_INVENTORY_IDS,
} from '@/components/insights/layer1';

getIndicatorCopy('us10y', 'en');   // Layer1Entry | undefined (undefined until written)
getGlossary('fa');                  // Record<termId, Layer1GlossaryEntry>
getGlossaryTerm('inflation', 'en'); // Layer1GlossaryEntry | undefined
getLayer1Ui('en');                  // { ifRising, ifFalling, connections, australiaAngle, plainWords, noDirection }
```

## Validation

`layer1.test.ts` enforces gates G1–G8 (spec §9) on every `pnpm -r test`. The
full-completeness half of G1 is advisory during the batched roll-out and
hard-fails only when `LAYER1_STRICT=1` (set in the final session — see
DECISIONS D-07).

## Leave-behind for Layer 2

> Layer 2 will pass the model the computed indicator state plus the glossary
> returned here; the static copy is the source of vocabulary. The stable ids
> (`LAYER1_INVENTORY_IDS`) and these accessors are the contract Layer 2
> imports. **No AI is built in Layer 1.**
