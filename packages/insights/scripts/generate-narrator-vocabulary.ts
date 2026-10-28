/**
 * generate-narrator-vocabulary.ts — P3 of the Layer-2 prep
 * (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §5): makes the Layer-1
 * plain-language vocabulary importable by the Worker WITHOUT duplicating
 * the hand-written text and WITHOUT touching the web app.
 *
 * How: the web dictionaries stay the ONE hand-edited source of truth
 * (apps/web/src/i18n/insights-copy-{en,fa}.ts — unchanged, exactly as
 * today). This script GENERATES a compact, deterministic JSON snapshot
 * of their `layer1` objects (indicators + glossary + ui, both languages)
 * into packages/insights/src/narrator/vocabulary.generated.json, which
 * the Worker-side accessor (@currena/insights/narrator) imports. The
 * web app never imports the generated file — its bundle is untouched.
 *
 * Deterministic by design (no timestamps): the payload carries the sha256
 * of both source files, so the output changes ONLY when the copy changes.
 * Drift is impossible to miss: scripts/check-narrator-vocabulary.ts
 * (run by `pnpm gates`) regenerates in memory and fails on any byte
 * difference — a vocabulary change without regeneration breaks the gate.
 *
 * Run: pnpm narrator:vocabulary   (repo root)
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// The single source of truth (TS imports across the workspace tree — the
// same cross-tree pattern apps/web/visual already uses):
import { insightsCopyEn } from '../../../apps/web/src/i18n/insights-copy-en';
import { insightsCopyFa } from '../../../apps/web/src/i18n/insights-copy-fa';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, '../src/narrator/vocabulary.generated.json');
const EN_REL = 'apps/web/src/i18n/insights-copy-en.ts';
const FA_REL = 'apps/web/src/i18n/insights-copy-fa.ts';
const REPO_ROOT = resolve(HERE, '../../..');

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

/** The generated payload's shape (mirrored as types in src/narrator/vocabulary.ts). */
export interface GeneratedVocabulary {
  v: 1;
  source: {
    enPath: string;
    faPath: string;
    enSha256: string;
    faSha256: string;
    indicatorCount: number;
    glossaryCount: number;
  };
  en: { indicators: unknown; glossary: unknown; ui: unknown };
  fa: { indicators: unknown; glossary: unknown; ui: unknown };
}

/** Build the deterministic payload from the live dictionaries (pure). */
export function buildVocabularyPayload(): GeneratedVocabulary {
  const enIds = Object.keys(insightsCopyEn.layer1.indicators);
  const faIds = Object.keys(insightsCopyFa.layer1.indicators);
  // Parity guard (P3.3): the same compile-time guarantee the web pair has,
  // enforced at generation time — one vocabulary, two languages, no drift.
  const missingInFa = enIds.filter((id) => !(id in insightsCopyFa.layer1.indicators));
  const missingInEn = faIds.filter((id) => !(id in insightsCopyEn.layer1.indicators));
  if (missingInFa.length > 0 || missingInEn.length > 0) {
    throw new Error(
      `layer1 indicator parity broken (en↔fa): missingInFa=[${missingInFa}] missingInEn=[${missingInEn}]`,
    );
  }
  const glossaryEn = Object.keys(insightsCopyEn.layer1.glossary);
  const glossaryFa = Object.keys(insightsCopyFa.layer1.glossary);
  if (glossaryEn.length !== glossaryFa.length || glossaryEn.some((g) => !(g in insightsCopyFa.layer1.glossary))) {
    throw new Error('layer1 glossary parity broken (en↔fa)');
  }
  return {
    v: 1,
    source: {
      enPath: EN_REL,
      faPath: FA_REL,
      enSha256: sha256(readFileSync(resolve(REPO_ROOT, EN_REL), 'utf8')),
      faSha256: sha256(readFileSync(resolve(REPO_ROOT, FA_REL), 'utf8')),
      indicatorCount: enIds.length,
      glossaryCount: glossaryEn.length,
    },
    en: {
      indicators: insightsCopyEn.layer1.indicators,
      glossary: insightsCopyEn.layer1.glossary,
      ui: insightsCopyEn.layer1.ui,
    },
    fa: {
      indicators: insightsCopyFa.layer1.indicators,
      glossary: insightsCopyFa.layer1.glossary,
      ui: insightsCopyFa.layer1.ui,
    },
  };
}

/** The canonical serialization (stable key order — object insertion order is deterministic here). */
export function serializeVocabulary(payload: GeneratedVocabulary): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function main(): void {
  const payload = buildVocabularyPayload();
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, serializeVocabulary(payload));
  console.log(
    `narrator vocabulary: ${payload.source.indicatorCount} indicators + ${payload.source.glossaryCount} glossary terms × 2 languages → ${OUT_PATH}`,
  );
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
