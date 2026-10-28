/**
 * check-narrator-vocabulary.ts — the P3 drift gate
 * (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §5): the generated
 * Worker-side vocabulary snapshot must be byte-identical to what the web
 * dictionaries would produce NOW. Any Layer-1 copy change without a
 * regeneration (`pnpm narrator:vocabulary`) fails here — no silent drift
 * between the web bundle's vocabulary and the narrator's.
 *
 * Run by `pnpm gates` (and safe to run alone):
 *   pnpm --filter @currena/insights exec tsx scripts/check-narrator-vocabulary.ts
 * Exit 0 = in sync · 1 = drift (with the fields that moved).
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildVocabularyPayload,
  serializeVocabulary,
  type GeneratedVocabulary,
} from './generate-narrator-vocabulary';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, '../src/narrator/vocabulary.generated.json');

function fail(message: string): never {
  console.error(`✗ narrator vocabulary drift — ${message}`);
  console.error('  regenerate with: pnpm narrator:vocabulary');
  process.exit(1);
}

const committed = readFileSync(OUT_PATH, 'utf8');
const expected = serializeVocabulary(buildVocabularyPayload());
if (committed === expected) {
  const payload = JSON.parse(committed) as GeneratedVocabulary;
  console.log(
    `✓ narrator vocabulary in sync — ${payload.source.indicatorCount} indicators + ${payload.source.glossaryCount} glossary terms × 2 languages (source sha en=${payload.source.enSha256.slice(0, 8)} fa=${payload.source.faSha256.slice(0, 8)})`,
  );
  process.exit(0);
}

// Not a plain byte match — explain what moved (shape first, then content).
let committedPayload: GeneratedVocabulary | null = null;
try {
  committedPayload = JSON.parse(committed) as GeneratedVocabulary;
} catch {
  fail('the committed file is no longer valid JSON');
}
const expectedPayload = JSON.parse(expected) as GeneratedVocabulary;
if (committedPayload!.source.enSha256 !== expectedPayload.source.enSha256) {
  fail('insights-copy-en.ts changed since the last regeneration');
}
if (committedPayload!.source.faSha256 !== expectedPayload.source.faSha256) {
  fail('insights-copy-fa.ts changed since the last regeneration');
}
const committedIds = Object.keys(committedPayload!.en.indicators as object);
const expectedIds = Object.keys(expectedPayload.en.indicators as object);
const added = expectedIds.filter((id) => !committedIds.includes(id));
const removed = committedIds.filter((id) => !expectedIds.includes(id));
if (added.length > 0 || removed.length > 0) {
  fail(`indicator ids moved (added=[${added}] removed=[${removed}]) but the source hashes match — regeneration half-finished`);
}
fail('content differs while source hashes match — regenerate to resync');
