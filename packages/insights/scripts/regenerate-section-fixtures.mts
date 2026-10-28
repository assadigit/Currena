/**
 * regenerate-section-fixtures.mts — one-off (PROMPT_VERSION 2, D-42):
 * re-derives every section/overall fixture's `output` from its committed
 * `input` + `now`, so the enriched SectionAlert shape (value, valueUnit,
 * delta, context) lands in the golden fixtures. The tests then re-derive
 * the same way and pass byte-for-byte.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSectionNarrationState,
  type SectionNarrationSnapshot,
  type SectionNarrationState,
  type NarratorSectionId,
} from '../src/narrator/section-state';
import { buildOverallNarrationState, type OverallNarrationState } from '../src/narrator/overall-state';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../fixtures/narration/sections');

interface SectionFixtureFile {
  scenario: string;
  section: string;
  description: string;
  provenance: string;
  now: string;
  input: SectionNarrationSnapshot;
  output: SectionNarrationState;
}
interface OverallFixtureFile {
  scenario: string;
  section: 'overall';
  description: string;
  provenance: string;
  now: string;
  input: SectionNarrationSnapshot;
  output: OverallNarrationState;
}

const FILES = [
  'global-live',
  'australia-live',
  'australia-calm',
  'australia-excluded',
  'world-markets-live',
  'world-currencies-live',
  'overall-live',
] as const;

let touched = 0;
for (const scenario of FILES) {
  const path = resolve(OUT_DIR, `${scenario}.json`);
  const raw = readFileSync(path, 'utf8');
  const fixture = JSON.parse(raw) as SectionFixtureFile | OverallFixtureFile;
  const newOutput =
    fixture.section === 'overall'
      ? buildOverallNarrationState(fixture.input, fixture.now)
      : buildSectionNarrationState(fixture.input, fixture.section as NarratorSectionId, fixture.now);
  const next = { ...fixture, output: newOutput };
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
  touched += 1;
  console.log(`regenerated: ${scenario} (${(newOutput as SectionNarrationState).alerts?.length ?? 0} alerts)`);
}
console.log(`done — ${touched} fixtures regenerated`);
