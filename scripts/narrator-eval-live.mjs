#!/usr/bin/env node
/**
 * narrator-eval-live.mjs — M5 of the Layer-2 narrator build (spec §12):
 * `pnpm narrator:eval:live` — runs every fixture through the REAL Gemini
 * model + writes the outputs (EN + FA + validation results) to
 * `docs/insights/layer2/EVAL-OUTPUTS.md` for the owner to read.
 *
 * Skips CLEANLY when `GEMINI_API_KEY` is unset (the spec §12: "needs the
 * key, skipped cleanly if absent") — exit 0 with one line. The owner
 * runs this in their own terminal after `pnpm narrator:set-key` (M3) has
 * placed the key on the worker; the script reads the key from the env
 * (the owner `export`s it before running, never as a CLI argument — the
 * secret-scan gate would catch a literal `AIza…` in shell history too).
 *
 * What runs:
 *   - The 7 section/overall fixtures × the REAL Gemini model (call type A).
 *     Each output is run through V1–V10. The "first failure → regenerate
 *     with the failed-check names appended; second failure → template"
 *     ladder is reproduced so the owner sees the production behaviour.
 *   - 1 fixture through the REAL grounded news call (call type B) — the
 *     world-currencies fixture (its vocabulary carries the most specific
 *     plainNames for W10's topic-word check).
 *
 * Output: `docs/insights/layer2/EVAL-OUTPUTS.md` — a single markdown
 * file with one section per fixture (EN + FA + the validation verdict +
 * the source `ai`/`template` + the model + the timing). The owner reads
 * the file in their editor, never in the terminal.
 *
 * NEVER logs the key, full prompts with state, or raw model output beyond
 * the truncated debug line (spec §5).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const narrator = await import('../packages/insights/src/narrator/index.ts');
const {
  GeminiClient,
  PROMPT_VERSION,
  templateNarrative,
  validateStateNarrative,
  validateNewsNote,
  buildNarratorUserMessage,
  buildNewsUserMessage,
  newsSystemPrompt,
  systemPromptFor,
  getNarratorVocabulary,
} = narrator;

const PREP_DIR = resolve(ROOT, 'packages/insights/fixtures/narration');
const SECTION_DIR = resolve(PREP_DIR, 'sections');
const OUT_PATH = resolve(ROOT, 'docs/insights/layer2/EVAL-OUTPUTS.md');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/* ------------------------------------------------------------------ *
 * The key — read from the env, NEVER from argv. Skip cleanly if absent.
 * ------------------------------------------------------------------ */

const apiKey = process.env.GEMINI_API_KEY;
if (typeof apiKey !== 'string' || apiKey === '' || !/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey)) {
  console.log('narrator:eval:live — GEMINI_API_KEY not set (or not a valid AIza… shape). Skipping.');
  console.log('  The owner runs this in their own terminal after `pnpm narrator:set-key`.');
  console.log('  The script reads the key from the env (export GEMINI_API_KEY=…), never from argv.');
  process.exit(0);
}

const MODEL = process.env.NARRATOR_MODEL || 'gemini-3.5-flash-lite';
const client = new GeminiClient({ apiKey, model: MODEL, timeoutMs: 30_000 });

/* ------------------------------------------------------------------ *
 * The fixtures + the run loop
 * ------------------------------------------------------------------ */

const SECTION_SCENARIOS = [
  'global-live',
  'australia-live',
  'australia-calm',
  'australia-excluded',
  'world-markets-live',
  'world-currencies-live',
  'overall-live',
];

const unitOf = (fixture) =>
  fixture.section === 'overall' ? { kind: 'overall' } : { kind: 'section', section: fixture.section };

const results = [];
let aiValid = 0;
let aiFailed = 0;
let apiErrors = 0;
let newsAttempted;
let newsValid = 0;
let newsOmitted = 0;

for (const scenario of SECTION_SCENARIOS) {
  const fixture = readJson(resolve(SECTION_DIR, `${scenario}.json`));
  const unit = unitOf(fixture);
  const state = fixture.output;
  const systemInstruction = systemPromptFor(unit);
  const ids = collectIds(state);
  const userMessage = buildNarratorUserMessage({
    unit,
    state,
    vocabulary: vocabOf(ids, 'en'),
  });

  const startedAt = Date.now();
  const outcome = await client.callStateNarrative({ systemInstruction, userMessage });
  const elapsedMs = Date.now() - startedAt;

  if (!outcome.ok) {
    apiErrors += 1;
    results.push({
      scenario,
      unit,
      source: 'api-error',
      error: outcome.error,
      elapsedMs,
      template: {
        en: templateNarrative(state, unit, 'en'),
        fa: templateNarrative(state, unit, 'fa'),
      },
    });
    continue;
  }

  // The first validation pass.
  const text = outcome.value;
  const firstFailures = validateStateNarrative({ text, unit, state });
  let attempts = 1;
  let finalText = text;
  let finalFailures = firstFailures;

  if (firstFailures.length > 0) {
    // The retry: append the failed-check names to the user message.
    const retryMessage = `${userMessage}\n\nThe previous output failed these checks: ${firstFailures.map((f) => `${f.check}/${f.lang}`).join(', ')}. Please fix and rewrite the output.`;
    const retryOutcome = await client.callStateNarrative({
      systemInstruction,
      userMessage: retryMessage,
    });
    attempts = 2;
    if (retryOutcome.ok) {
      const retryFailures = validateStateNarrative({
        text: retryOutcome.value,
        unit,
        state,
      });
      finalText = retryOutcome.value;
      finalFailures = retryFailures;
    }
  }

  if (finalFailures.length === 0) {
    aiValid += 1;
    results.push({
      scenario,
      unit,
      source: 'ai',
      text: finalText,
      failures: [],
      attempts,
      elapsedMs,
    });
  } else {
    aiFailed += 1;
    results.push({
      scenario,
      unit,
      source: 'template',
      text: {
        en: templateNarrative(state, unit, 'en'),
        fa: templateNarrative(state, unit, 'fa'),
      },
      failures: finalFailures,
      attempts,
      elapsedMs,
    });
  }
}

/* ------------------------------------------------------------------ *
 * One grounded news call — the world-currencies fixture
 * ------------------------------------------------------------------ */

const currenciesFixture = readJson(resolve(SECTION_DIR, 'world-currencies-live.json'));
const newsSystem = newsSystemPrompt();
const newsUser = buildNewsUserMessage({
  section: 'world-currencies',
  state: currenciesFixture.output,
  vocabulary: vocabOf(collectIds(currenciesFixture.output), 'en'),
});
const newsStartedAt = Date.now();
const newsOutcome = await client.callNewsNote({
  systemInstruction: newsSystem,
  userMessage: newsUser,
});
const newsElapsedMs = Date.now() - newsStartedAt;
newsAttempted = 1;
let newsResult;
if (!newsOutcome.ok) {
  newsResult = {
    source: 'api-error',
    error: newsOutcome.error,
    elapsedMs: newsElapsedMs,
  };
} else {
  const newsValue = newsOutcome.value;
  // The 'none' kind = the model answered NONE — no note, no sources. Count
  // as omitted (W1 effectively — no grounding sources came back).
  if (newsValue.kind === 'none') {
    newsOmitted = 1;
    newsResult = {
      source: 'omitted',
      failures: [{ check: 'W1', lang: 'en', detail: 'the model answered NONE' }],
      elapsedMs: newsElapsedMs,
    };
  } else {
    const newsText = { en: newsValue.en, fa: newsValue.fa };
    const newsSources = newsValue.sources ?? [];
    const newsFailures = validateNewsNote({
      text: newsText,
      section: 'world-currencies',
      state: currenciesFixture.output,
      sources: newsSources,
    });
    if (newsFailures.length === 0) {
      newsValid = 1;
      newsResult = {
        source: 'ai',
        text: newsText,
        sources: newsSources,
        requiredDisplay: newsValue.requiredDisplay,
        failures: [],
        elapsedMs: newsElapsedMs,
      };
    } else {
      newsOmitted = 1;
      newsResult = {
        source: 'omitted',
        failures: newsFailures,
        elapsedMs: newsElapsedMs,
      };
    }
  }
}

/* ------------------------------------------------------------------ *
 * The markdown report
 * ------------------------------------------------------------------ */

const lines = [];
lines.push('# Layer-2 Narrator — Live Eval Outputs (M5, spec §12)');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Model: \`${MODEL}\``);
lines.push(`Prompt version: ${PROMPT_VERSION}`);
lines.push('');
lines.push('Run by the owner (the script reads `GEMINI_API_KEY` from the env, never');
lines.push('from argv). The outputs below are the REAL model responses — the same');
lines.push('pipeline the worker cron rung runs hourly, reproduced locally. The');
lines.push('first-failure → regenerate-with-check-names → template ladder is');
lines.push('reproduced too, so the file shows the production behaviour.');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- ${SECTION_SCENARIOS.length} fixtures run through the real model (call type A)`);
lines.push(`- AI valid: ${aiValid} · AI failed → template: ${aiFailed} · API errors: ${apiErrors}`);
lines.push(`- News (call type B): ${newsAttempted} attempted · ${newsValid} valid · ${newsOmitted} omitted by checks`);
lines.push('');

for (const r of results) {
  lines.push(`## ${r.scenario}`);
  lines.push('');
  lines.push(`- Unit: ${r.unit.kind}${r.unit.kind === 'section' ? ` (${r.unit.section})` : ''}`);
  lines.push(`- Source: \`${r.source}\`${r.source === 'ai' || r.source === 'template' ? '' : ' (the template fallback rode)'}`);
  lines.push(`- Elapsed: ${r.elapsedMs} ms`);
  if (r.attempts !== undefined) {
    lines.push(`- Attempts: ${r.attempts} (1 = first-pass valid; 2 = regenerated)`);
  }
  if (r.error !== undefined) {
    lines.push(`- API error: \`${r.error.kind}\` — ${redactForReport(r.error.detail)}`);
  }
  if (r.failures !== undefined && r.failures.length > 0) {
    lines.push(`- Validation failures: ${r.failures.map((f) => `\`${f.check}/${f.lang}\``).join(', ')}`);
  }
  lines.push('');
  lines.push('### EN');
  lines.push('');
  lines.push('```');
  lines.push((r.text ?? r.template).en);
  lines.push('```');
  lines.push('');
  lines.push('### FA');
  lines.push('');
  lines.push('```');
  lines.push((r.text ?? r.template).fa);
  lines.push('```');
  lines.push('');
}

// The news section.
lines.push('## news (world-currencies-live, call type B)');
lines.push('');
lines.push(`- Source: \`${newsResult.source}\``);
lines.push(`- Elapsed: ${newsResult.elapsedMs} ms`);
if (newsResult.error !== undefined) {
  lines.push(`- API error: \`${newsResult.error.kind}\` — ${redactForReport(newsResult.error.detail)}`);
}
if (newsResult.failures !== undefined && newsResult.failures.length > 0) {
  lines.push(`- Validation failures: ${newsResult.failures.map((f) => `\`${f.check}/${f.lang}\``).join(', ')}`);
}
if (newsResult.sources !== undefined) {
  lines.push(`- Sources: ${newsResult.sources.length}`);
  for (const s of newsResult.sources) {
    lines.push(`  - ${s.title} — ${s.url}`);
  }
}
lines.push('');
if (newsResult.text !== undefined) {
  lines.push('### EN');
  lines.push('');
  lines.push('```');
  lines.push(newsResult.text.en);
  lines.push('```');
  lines.push('');
  lines.push('### FA');
  lines.push('');
  lines.push('```');
  lines.push(newsResult.text.fa);
  lines.push('```');
  lines.push('');
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');

console.log(`narrator:eval:live — wrote ${OUT_PATH}`);
console.log(`  ${aiValid}/${SECTION_SCENARIOS.length} AI valid · ${aiFailed} fell back to template · ${apiErrors} API errors`);
console.log(`  news: ${newsValid}/${newsAttempted} valid · ${newsOmitted} omitted by checks`);

/* ------------------------------------------------------------------ *
 * Helpers (mirrored from narrator-eval.mjs)
 * ------------------------------------------------------------------ */

function collectIds(state) {
  const ids = new Set();
  const walk = (value, key) => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const v of value) walk(v, key);
      return;
    }
    const obj = value;
    if (typeof obj.id === 'string' && (key === 'items' || key === 'alerts' || key === 'patterns' || key === 'excluded')) {
      ids.add(obj.id);
    }
    for (const k of Object.keys(obj)) walk(obj[k], k);
  };
  walk(state, 'root');
  return [...ids].sort();
}

function vocabOf(ids, lang) {
  return getNarratorVocabulary(ids, lang);
}

function redactForReport(s) {
  if (typeof s !== 'string') return '';
  // The error detail may carry a truncated model output — keep it short.
  return s.length > 200 ? `${s.slice(0, 200)}…` : s;
}
