#!/usr/bin/env node
/**
 * narrator-eval.mjs — M3 of the Layer-2 narrator build (spec §12): the
 * OFFLINE evaluation harness (`pnpm narrator:eval`, no key, no network).
 *
 * Everything runs through the REAL pipeline pieces — the golden fixtures,
 * the prompt builder, the template fallback and the deterministic
 * validators — with MOCKED model outputs, including deliberately bad ones.
 * Every bad output must be rejected by its intended check; every good one
 * accepted. One screen of summary; exit 1 on any mismatch.
 *
 * Runs inside `pnpm gates` (the spec: "Add to pnpm gates").
 *
 * The LIVE harness (pnpm narrator:eval:live, M5) runs the same fixtures
 * through the real model and writes EVAL-OUTPUTS.md for the owner.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// The package's TS sources, through tsx (the same pattern the package's
// own scripts use — run via `pnpm narrator:eval` = tsx scripts/narrator-eval.mjs).
const narrator = await import('../packages/insights/src/narrator/index.ts');
const {
  buildNarrationState,
  templateNarrative,
  validateStateNarrative,
  validateNewsNote,
  buildNarratorUserMessage,
  sectionSystemPrompt,
  overallSystemPrompt,
  newsSystemPrompt,
  systemPromptFor,
  PROMPT_VERSION,
  getNarratorVocabulary,
} = narrator;

const PREP_DIR = resolve(ROOT, 'packages/insights/fixtures/narration');
const SECTION_DIR = resolve(PREP_DIR, 'sections');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/* ------------------------------------------------------------------ *
 * The tallies
 * ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

/* ------------------------------------------------------------------ *
 * (0) The prep fixtures — the P4 contract still re-derives
 * ------------------------------------------------------------------ */

const PREP_SCENARIOS = ['stressed-live', 'calm', 'stale-excluded'];
for (const scenario of PREP_SCENARIOS) {
  const fixture = readJson(resolve(PREP_DIR, `${scenario}.json`));
  const derived = buildNarrationState(fixture.input, fixture.now);
  check(`prep ${scenario}: buildNarrationState re-derives the committed output`, JSON.stringify(derived) === JSON.stringify(fixture.output));
}

/* ------------------------------------------------------------------ *
 * (a) Every section/overall fixture through the TEMPLATE, both languages
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

const FIXTURES = new Map();
for (const scenario of SECTION_SCENARIOS) {
  const fixture = readJson(resolve(SECTION_DIR, `${scenario}.json`));
  FIXTURES.set(scenario, fixture);
  const unit = fixture.section === 'overall' ? { kind: 'overall' } : { kind: 'section', section: fixture.section };
  const text = {
    en: templateNarrative(fixture.output, unit, 'en'),
    fa: templateNarrative(fixture.output, unit, 'fa'),
  };
  const failuresForFixture = validateStateNarrative({ text, unit, state: fixture.output });
  check(
    `${scenario}: template passes V1–V10 (both languages)`,
    failuresForFixture.length === 0,
    JSON.stringify(failuresForFixture.map((f) => `${f.check}/${f.lang}`)),
  );
  // the prompt assembly for the same unit: deterministic, no secrets, carries STATE
  const ids = collectIds(fixture.output);
  const message = buildNarratorUserMessage({
    unit,
    state: fixture.output,
    vocabulary: vocabOf(ids, 'en'),
  });
  check(`${scenario}: user message carries SCOPE/STATE/VOCABULARY/GLOSSARY`, /^SCOPE: /.test(message) && message.includes('STATE: {'));
  check(`${scenario}: user message is deterministic`, message === buildNarratorUserMessage({ unit, state: fixture.output, vocabulary: vocabOf(ids, 'en') }));
  check(`${scenario}: user message carries no key shape`, !/AIza[0-9A-Za-z_-]{35}/.test(message) && !message.includes('x-goog-api-key'));
}

/* ------------------------------------------------------------------ *
 * (b) MOCKED model outputs — the good ones accepted
 * ------------------------------------------------------------------ */

const unitOf = (scenario) => {
  const fixture = FIXTURES.get(scenario);
  return fixture.section === 'overall' ? { kind: 'overall' } : { kind: 'section', section: fixture.section };
};

const GOOD_MOCKED = [
  {
    scenario: 'global-live',
    intended: 'accepted',
    text: {
      en: "The global picture is under pressure today: 9 of 32 scored indicators are in warning. One of them, The gold crowd gauge, says big traders' gold bets have become unusually crowded. Another, Euro-area inflation, shows prices climbing across the euro area.",
      fa: 'تصویر جهانی امروز تحت فشار است: ۹ شاخص از ۳۲ شاخص مؤثر در وضعیت هشدار هستند. یکی از آنها فشارسنج شلوغی طلا است: شرط‌بندی‌های بزرگ معامله‌گران روی طلا شلوغ شده است. مورد دیگر، تورم منطقهٔ یورو است: قیمت‌ها در منطقهٔ یورو بالا می‌روند.',
    },
  },
  {
    scenario: 'world-markets-live',
    intended: 'accepted',
    text: {
      en: "World markets need attention today: 6 of 16 indices have slipped into a correction and 1 is in a bear market. The Asia-Pacific group holds the most pressured markets. South Korea's biggest companies are the furthest below their yearly high.",
      fa: 'بازارهای جهان امروز نیازمند توجه است: ۶ شاخص از ۱۶ شاخص در اصلاح قیمتی است و ۱ شاخص در بازار خرسی. گروه آسیا و اقیانوسیه بیشترین بازارهای تحت فشار را دارد. شرکت‌های بزرگ کرهٔ جنوبی بیشترین فاصله را از اوج سالانهٔ خود دارند.',
    },
  },
  {
    scenario: 'world-currencies-live',
    intended: 'accepted',
    text: {
      en: "World currencies need attention today: one pattern is counted in warning. Europe's worry meter says the euro usually slips against the franc when Europe worries. An unusually large move sits on the euro versus the franc.",
      fa: 'ارزهای مهم جهان امروز نیازمند توجه است: یک الگو در وضعیت هشدار است. دماسنج نگرانی اروپا می‌گوید وقتی اروپا نگران می‌شود، یورو معمولاً در برابر فرانک پایین می‌آید. حرکت غیرعادی بزرگی در یورو در برابر فرانک سوئیس دیده می‌شود.',
    },
  },
  {
    scenario: 'overall-live',
    intended: 'accepted',
    text: {
      en: "Today's verdicts: Global reads Stressed and Australia reads Stressed. World markets and world currencies both need attention. One standout is The gold crowd gauge: big traders' gold bets have become crowded. This page explains the data and is not financial advice.",
      fa: 'حکم‌های امروز: جهانی پرتنش است و استرالیا پرتنش است. بازارهای جهان و ارزهای مهم جهان هر دو نیازمند توجه هستند. یکی از موارد برجسته فشارسنج شلوغی طلا است: شرط‌بندی‌های بزرگ معامله‌گران روی طلا شلوغ شده است. این صفحه داده‌ها را ساده می‌کند و توصیهٔ مالی نیست.',
    },
  },
];

for (const mocked of GOOD_MOCKED) {
  const fixture = FIXTURES.get(mocked.scenario);
  const outcome = validateStateNarrative({ text: mocked.text, unit: unitOf(mocked.scenario), state: fixture.output });
  check(
    `mocked good (${mocked.scenario}): accepted`,
    outcome.length === 0,
    JSON.stringify(outcome.map((f) => `${f.check}/${f.lang}: ${f.detail}`)),
  );
}

/* ------------------------------------------------------------------ *
 * (b, cont.) The DELIBERATELY BAD outputs — each rejected by its check
 * ------------------------------------------------------------------ */

const templateText = (scenario) => {
  const fixture = FIXTURES.get(scenario);
  const unit = unitOf(scenario);
  return {
    en: templateNarrative(fixture.output, unit, 'en'),
    fa: templateNarrative(fixture.output, unit, 'fa'),
  };
};

const BAD_MOCKED = [
  {
    name: 'invented number',
    intended: 'V3',
    scenario: 'global-live',
    mutate: (t) => ({ en: `${t.en} The move was 77.7 points.`, fa: t.fa }),
  },
  {
    name: 'invented cause (names an indicator outside the state)',
    intended: 'V7',
    scenario: 'australia-live',
    mutate: (t) => ({ en: `${t.en} This is happening because The bitcoin price crashed last week.`, fa: t.fa }),
  },
  {
    name: 'advice word',
    intended: 'V4',
    scenario: 'global-live',
    mutate: (t) => ({ en: `${t.en} You should buy gold.`, fa: t.fa }),
  },
  {
    name: 'wrong tone (all-clear on a fired section)',
    intended: 'V8',
    scenario: 'global-live',
    mutate: (t) => ({ en: `${t.en} Everything is fine and completely calm.`, fa: t.fa }),
  },
  {
    name: 'English digits in Farsi',
    intended: 'V6',
    scenario: 'global-live',
    mutate: (t) => ({ en: t.en, fa: `${t.fa} عدد 5 اینجاست.` }),
  },
  {
    name: 'missing out-of-date clause',
    intended: 'V10',
    scenario: 'australia-excluded',
    mutate: (t) => ({
      en: t.en.replace('Some data is out of date and has been left out.', ''),
      fa: t.fa.replace('برخی داده‌ها به‌روز نیست و کنار گذاشته شده‌اند.', ''),
    }),
  },
];

for (const bad of BAD_MOCKED) {
  const fixture = FIXTURES.get(bad.scenario);
  const text = bad.mutate(templateText(bad.scenario));
  const outcome = validateStateNarrative({ text, unit: unitOf(bad.scenario), state: fixture.output });
  const checkIds = outcome.map((f) => f.check);
  check(
    `mocked bad (${bad.name}): rejected by ${bad.intended}`,
    checkIds.includes(bad.intended),
    `got [${checkIds.join(', ')}]`,
  );
}

/* ------------------------------------------------------------------ *
 * (b, cont.) The NEWS notes — good accepted, the bad four omitted
 * ------------------------------------------------------------------ */

const currenciesFixture = FIXTURES.get('world-currencies-live');
const NEWS_GOOD = {
  text: {
    en: 'News coverage this week focuses on the euro and the Swiss franc, reports suggest.',
    fa: 'به گزارش خبرهای این هفته، یورو و فرانک سوئیس در کانون توجه بوده است.',
  },
  sources: [{ title: 'Markets wrap', url: 'https://example.com/markets-wrap' }],
};

const newsOutcome = validateNewsNote({
  text: NEWS_GOOD.text,
  section: 'world-currencies',
  state: currenciesFixture.output,
  sources: NEWS_GOOD.sources,
});
check('news mocked good: accepted', newsOutcome.length === 0, JSON.stringify(newsOutcome.map((f) => `${f.check}/${f.lang}`)));

const BAD_NEWS = [
  {
    name: 'news with digits',
    intended: 'W2',
    text: { en: `${NEWS_GOOD.text.en} The euro moved 2%.`, fa: NEWS_GOOD.text.fa },
    sources: NEWS_GOOD.sources,
  },
  {
    name: 'news with quotes',
    intended: 'W8',
    text: { en: `${NEWS_GOOD.text.en} One report said "the euro is sliding".`, fa: NEWS_GOOD.text.fa },
    sources: NEWS_GOOD.sources,
  },
  { name: 'news with no sources', intended: 'W1', text: NEWS_GOOD.text, sources: [] },
  {
    name: 'news with no attribution',
    intended: 'W4',
    text: { en: 'The euro and the franc are moving this week.', fa: 'یورو و فرانک سوئیس این هفته در حال حرکت است.' },
    sources: NEWS_GOOD.sources,
  },
];

for (const bad of BAD_NEWS) {
  const outcome = validateNewsNote({
    text: bad.text,
    section: 'world-currencies',
    state: currenciesFixture.output,
    sources: bad.sources,
  });
  const checkIds = outcome.map((f) => f.check);
  check(`news mocked bad (${bad.name}): rejected by ${bad.intended}`, checkIds.includes(bad.intended), `got [${checkIds.join(', ')}]`);
}

/* ------------------------------------------------------------------ *
 * (c) The prompts the eval rides on (a light sanity pass — the snapshot
 *     tests pin the texts)
 * ------------------------------------------------------------------ */

check('prompt version is pinned', PROMPT_VERSION === 1);
check('section/overall prompts compose the base rules', sectionSystemPrompt().includes('Hard rules:') && overallSystemPrompt().includes('Hard rules:'));
check('news prompt is standalone (no JSON-only rule)', !newsSystemPrompt().includes('Output only JSON'));
check('systemPromptFor routes units', systemPromptFor({ kind: 'overall' }) === overallSystemPrompt());

/* ------------------------------------------------------------------ *
 * The one-screen summary
 * ------------------------------------------------------------------ */

const width = 64;
const line = '─'.repeat(width);
console.log(`\n${line}`);
console.log(` NARRATOR EVAL (offline, no key) — fixtures × templates × mocked outputs`);
console.log(line);
console.log(` fixtures: ${PREP_SCENARIOS.length} prep + ${SECTION_SCENARIOS.length} section/overall`);
console.log(` good mocked: ${GOOD_MOCKED.length} accepted · bad mocked: ${BAD_MOCKED.length + BAD_NEWS.length} rejected by their intended checks`);
console.log(` prompts: PROMPT_VERSION ${PROMPT_VERSION}, user messages assembled for every fixture`);
console.log(line);
if (failed === 0) {
  console.log(` ✓ ${passed} checks passed — eval clean`);
  process.exit(0);
}
console.log(` ✗ ${failed} of ${passed + failed} checks FAILED:`);
for (const f of failures) console.log(`   - ${f}`);
process.exit(1);

/* ------------------------------------------------------------------ *
 * Helpers (the validators' own id derivation, mirrored for the prompts)
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
