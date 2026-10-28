/**
 * template.ts — M1 of the Layer-2 narrator build (spec §8): the
 * deterministic template fallback. `templateNarrative(state, unit, lang)`
 * builds a 3–5 sentence section narrative or an exactly-4-sentence overall
 * summary from the approved summary labels, the tier counts, up to two top
 * alerts' plainName + oneLine, and the fixed out-of-date clause — and it
 * must itself pass V1–V10 for every fixture in both languages
 * (template.test.ts pins exactly that).
 *
 * Composition guarantees (V2): a section template always emits 3–5
 * sentences (verdict + enough content sentences + the optional out-of-date
 * clause); the overall template always emits exactly 4 (its 4th merges the
 * out-of-date clause with the not-advice reminder when needed). Vocabulary
 * oneLines carry their own trailing period; `finish` keeps every sentence
 * properly terminated without doubles.
 *
 * Used when: no key, kill switch, API failure, region refusal, or two
 * validation failures. Part 3 (news) has NO template — it is simply absent.
 *
 * The Persian sentences are hand-written template copy (spoken-formal
 * register, Persian digits via the shared digit mapper, correct
 * half-spaces, no em dash, no Latin outside the allow-list) — triaged in
 * the Persian copy manifest like every other fa string in the packages.
 *
 * Pure: no I/O, no clock, no model calls. Deterministic: same state in,
 * same text out, byte for byte.
 */

import { getNarratorVocabulary } from './vocabulary';
import { toPersianDigits } from './wordlists';
import type { SectionNarrationState } from './section-state';
import type { OverallNarrationState } from './overall-state';
import type { NarratorUnit } from './validate';

/** Any unit's state (section or overall). */
export type TemplateState = SectionNarrationState | OverallNarrationState;

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */

/** Persian digits with the Persian decimal separator (٫). */
function faNum(n: number): string {
  return toPersianDigits(String(n).replace('.', '\u066B'));
}

/** Ensure a sentence ends with terminal punctuation (oneLines already do). */
function finish(s: string): string {
  const t = s.trim();
  return /[.!?۔؟]$/.test(t) ? t : `${t}.`;
}

/** The vocabulary entry (plainName + oneLine) for one id, in one language. */
function entryOf(id: string, lang: 'en' | 'fa'): { plainName: string; oneLine: string } | null {
  const vocab = getNarratorVocabulary([id], lang);
  const entry = vocab.entries[id];
  if (entry === undefined) return null;
  return { plainName: entry.plainName, oneLine: entry.oneLine };
}

/** Join composed sentences (each already terminated or terminated here). */
function joinSentences(parts: readonly string[]): string {
  return parts.map(finish).join(' ');
}

/* ------------------------------------------------------------------ *
 * The fixed clauses (both languages; the FA side is manifest-triaged)
 * ------------------------------------------------------------------ */

const OUT_OF_DATE = {
  en: 'Some data is out of date and has been left out.',
  fa: 'برخی داده‌ها به‌روز نیست و کنار گذاشته شده‌اند.',
} as const;

const NOT_ADVICE = {
  en: 'This page explains the data and is not financial advice.',
  fa: 'این صفحه داده‌ها را ساده می‌کند و توصیهٔ مالی نیست.',
} as const;

/** The up-to-two-top-alerts block (name + oneLine), shared by the section kinds. */
function alertSentences(
  alerts: ReadonlyArray<{ id: string }>,
  lang: 'en' | 'fa',
  firstLead: string,
  secondLead: string,
): string[] {
  const out: string[] = [];
  const entries = alerts
    .slice(0, 2)
    .map((a) => entryOf(a.id, lang))
    .filter((e): e is { plainName: string; oneLine: string } => e !== null);
  for (const [i, entry] of entries.entries()) {
    out.push(i === 0 ? `${firstLead}${entry.plainName}: ${entry.oneLine}` : `${secondLead}${entry.plainName}: ${entry.oneLine}`);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * global / australia
 * ------------------------------------------------------------------ */

function indicatorSectionText(state: SectionNarrationState, lang: 'en' | 'fa'): string {
  if (state.section !== 'global' && state.section !== 'australia') {
    throw new Error(`template: indicator template called for section "${state.section}"`);
  }
  const label = state.label[lang];
  const verdict = state.verdict;
  const counts = verdict?.counts ?? {};
  const warningCount = counts['warningCount'] ?? 0;
  const votingCount = counts['votingCount'] ?? 0;
  const n = lang === 'fa' ? faNum : String;

  // S1 — the approved summary label + its counts.
  const s1 =
    lang === 'fa'
      ? `بخش ${label} امروز ${verdict === null ? 'بدون حکم' : verdict.word.fa} است: ${n(warningCount)} شاخص از ${n(votingCount)} شاخص مؤثر در وضعیت هشدار است`
      : `The ${label} section reads ${verdict === null ? 'without a verdict' : verdict.word.en} today: ${n(warningCount)} of ${n(votingCount)} scored indicators are in warning`;

  const sentences: string[] = [s1];

  // S2/S3 — up to two top alerts' plainName + oneLine (the state's own
  // alert order, which is id-sorted).
  const alertSentencesOut = alertSentences(
    state.alerts,
    lang,
    lang === 'fa' ? 'یکی از موارد هشدار، ' : 'One reading in warning is ',
    lang === 'fa' ? 'مورد دیگر، ' : 'Another is ',
  );
  sentences.push(...alertSentencesOut);

  // The tier sentence fills the calm / one-alert shapes (the section's own
  // status words; only the non-empty context part varies it).
  if (alertSentencesOut.length < 2) {
    const normal = state.tiers['normal'] ?? 0;
    const context = state.tiers['context'] ?? 0;
    sentences.push(
      lang === 'fa'
        ? context > 0
          ? `در این بخش ${n(normal)} شاخص در محدودهٔ عادی خود است و ${n(context)} شاخص صرفاً جنبهٔ اطلاعاتی دارد`
          : `در این بخش ${n(normal)} شاخص در محدودهٔ عادی خود است`
        : context > 0
          ? `Across the section, ${n(normal)} readings sit in their normal range and ${n(context)} are context-only`
          : `Across the section, ${n(normal)} readings sit in their normal range`,
    );
  }

  // The honest no-alert line (the calm shape's third sentence).
  if (state.alerts.length === 0) {
    sentences.push(
      lang === 'fa' ? 'هیچ موردی امروز نیازمند توجه نیست' : 'No reading needs attention today',
    );
  }

  // The out-of-date clause when the state lists excluded items.
  if (state.excluded.length > 0) sentences.push(OUT_OF_DATE[lang]);

  return joinSentences(sentences);
}

/* ------------------------------------------------------------------ *
 * world-markets
 * ------------------------------------------------------------------ */

function marketsSectionText(state: SectionNarrationState, lang: 'en' | 'fa'): string {
  if (state.section !== 'world-markets') {
    throw new Error(`template: markets template called for section "${state.section}"`);
  }
  const label = state.label[lang];
  const verdict = state.verdict;
  const counts = verdict?.counts ?? {};
  const count = counts['count'] ?? state.items.length;
  const nAttention = counts['nAttention'] ?? 0;
  const nUnusual = counts['nUnusual'] ?? 0;
  const roseToday = counts['roseToday'] ?? 0;
  const n = lang === 'fa' ? faNum : String;
  const word = verdict?.word[lang] ?? (lang === 'fa' ? 'بدون سیگنال' : 'without a signal');
  const correction = state.statusWords.correction[lang];
  const bear = state.statusWords.bear[lang];

  const sentences: string[] = [];
  const roseSentence =
    lang === 'fa'
      ? `${n(roseToday)} شاخص از ${n(count)} شاخص در آخرین معامله صعودی بود`
      : `${n(roseToday)} of ${n(count)} indices rose at their latest close`;

  if (nAttention + nUnusual > 0) {
    // S1 — the signal + the counts, in the page's own status words.
    if (lang === 'fa') {
      const tail = nUnusual > 0 ? ` و ${n(nUnusual)} شاخص در ${bear} است` : '';
      sentences.push(`بازارهای جهان امروز ${word} است: ${n(nAttention)} شاخص از ${n(count)} شاخص در ${correction} است${tail}`);
    } else {
      const tail = nUnusual > 0 ? `, and ${n(nUnusual)} in a ${bear.toLowerCase()}` : '';
      sentences.push(`${label} read ${word} today: ${n(nAttention)} of ${n(count)} indices have slipped into a ${correction.toLowerCase()}${tail}`);
    }
    // S2/S3 — the top one or two under-pressure markets (bear first, then
    // correction, then id — the state's own alert order).
    sentences.push(
      ...alertSentences(
        state.alerts,
        lang,
        lang === 'fa' ? 'یکی از موارد تحت فشار، ' : 'Under pressure today is ',
        lang === 'fa' ? 'مورد دیگر، ' : 'Also under pressure is ',
      ),
    );
    // The breadth sentence always (and the honest no-bear clause only when
    // the state says no market is in a bear market).
    if ((state.tiers['bear'] ?? 0) === 0) {
      sentences.push(
        lang === 'fa'
          ? `هیچ شاخصی در ${bear} نیست و ${n(roseToday)} بازار از ${n(count)} بازار در آخرین معامله صعودی بود`
          : `None of the ${n(count)} indices is in a ${bear.toLowerCase()}, and ${n(roseToday)} of ${n(count)} rose at their latest close`,
      );
    } else {
      sentences.push(roseSentence);
    }
  } else {
    // The calm shape: normal range, breadth, and the honest no-alert line.
    if (lang === 'fa') {
      sentences.push(`بازارهای جهان امروز ${word} است: هر ${n(count)} شاخص در محدودهٔ عادی خود بسته شد`);
      sentences.push(roseSentence);
      sentences.push(`هیچ شاخصی در ${correction} یا ${bear} نیست`);
    } else {
      sentences.push(`${label} read ${word} today: all ${n(count)} indices closed in their normal range`);
      sentences.push(roseSentence);
      sentences.push(`No index is in a ${correction.toLowerCase()} or a ${bear.toLowerCase()}`);
    }
  }

  if (state.excluded.length > 0) sentences.push(OUT_OF_DATE[lang]);

  return joinSentences(sentences);
}

/* ------------------------------------------------------------------ *
 * world-currencies
 * ------------------------------------------------------------------ */

function currenciesSectionText(state: SectionNarrationState, lang: 'en' | 'fa'): string {
  if (state.section !== 'world-currencies') {
    throw new Error(`template: currencies template called for section "${state.section}"`);
  }
  const label = state.label[lang];
  const verdict = state.verdict;
  const countedWarnings = verdict?.counts['countedWarnings'] ?? 0;
  const n = lang === 'fa' ? faNum : String;
  const word = verdict?.word[lang] ?? (lang === 'fa' ? 'بدون سیگنال' : 'without a signal');
  const sentences: string[] = [];

  // S1 — the signal + the counted warnings.
  sentences.push(
    countedWarnings > 0
      ? lang === 'fa'
        ? `${label} امروز ${word} است: ${n(countedWarnings)} الگو در وضعیت هشدار است`
        : `${label} read ${word} today: ${n(countedWarnings)} pattern${countedWarnings === 1 ? '' : 's'} counted in warning`
      : lang === 'fa'
        ? `${label} امروز ${word} است: هیچ الگویی در وضعیت هشدار نیست`
        : `${label} read ${word} today: no pattern is in warning`,
  );

  // S2 — the headline pattern (the fx document's own headline rule, else
  // the first active pattern), with its oneLine.
  const headlineId = verdict?.headlineRule ?? state.patterns[0]?.id ?? null;
  const headline = headlineId !== null ? entryOf(headlineId, lang) : null;
  if (headline !== null) {
    sentences.push(
      lang === 'fa'
        ? `الگوی فعال، ${headline.plainName} است: ${headline.oneLine}`
        : `The active pattern is ${headline.plainName}: ${headline.oneLine}`,
    );
  }

  // S3 — the unusually-large-move sentence (or its honest negative).
  const bigMove = state.alerts.find((a) => a.tier === 'unusual-move');
  if (bigMove !== undefined) {
    const entry = entryOf(bigMove.id, lang);
    if (entry !== null) {
      sentences.push(
        lang === 'fa'
          ? `حرکت غیرعادی بزرگ در ${entry.plainName} دیده می‌شود`
          : `An unusually large move sits on ${entry.plainName}`,
      );
    }
  } else {
    sentences.push(
      lang === 'fa' ? 'هیچ جفت ارزی حرکت غیرعادی بزرگ نداشته است' : 'No pair shows an unusually large move',
    );
  }

  // S4 (when needed for the 3-sentence floor) — the dollar measure's own
  // one-month move (an item in this state).
  const dollar = state.items.find((i) => i.id === 'dollar-basket');
  if (dollar !== undefined && sentences.length < 3) {
    const up = dollar.chg1m >= 0;
    const abs = Math.abs(dollar.chg1m);
    const entry = entryOf('dollar-basket', lang);
    const name = entry?.plainName ?? (lang === 'fa' ? 'قدرت کلی دلار آمریکا' : 'The dollar\u2019s overall strength');
    sentences.push(
      lang === 'fa'
        ? `${name} این ماه ${n(abs)} درصد ${up ? 'بالاتر' : 'پایین‌تر'} است`
        : `${name} is ${n(abs)}% ${up ? 'higher' : 'lower'} this month`,
    );
  }

  if (state.excluded.length > 0) sentences.push(OUT_OF_DATE[lang]);

  return joinSentences(sentences);
}

/* ------------------------------------------------------------------ *
 * the overall
 * ------------------------------------------------------------------ */

function overallText(state: OverallNarrationState, lang: 'en' | 'fa'): string {
  const n = lang === 'fa' ? faNum : String;
  const sections = new Map(state.sections.map((s) => [s.section, s]));

  // S1 — the two indicator verdicts with their counts.
  const verdictClauses: string[] = [];
  for (const key of ['global', 'australia'] as const) {
    const entry = sections.get(key);
    if (entry === undefined || !entry.present) continue;
    const label = entry.label[lang];
    if (entry.verdict === null) {
      verdictClauses.push(lang === 'fa' ? `${label} بدون حکم است` : `${label} has no verdict`);
      continue;
    }
    const warningCount = entry.verdict.counts['warningCount'] ?? 0;
    const votingCount = entry.verdict.counts['votingCount'] ?? 0;
    verdictClauses.push(
      lang === 'fa'
        ? `${label} ${entry.verdict.word.fa} است (${n(warningCount)} از ${n(votingCount)} در وضعیت هشدار)`
        : `${label} reads ${entry.verdict.word.en} (${n(warningCount)} of ${n(votingCount)} in warning)`,
    );
  }
  const s1 =
    verdictClauses.length > 0
      ? lang === 'fa'
        ? `حکم‌های امروز صفحه: ${verdictClauses.join('؛ ')}`
        : `Today\u2019s verdicts: ${verdictClauses.join('; ')}`
      : lang === 'fa'
        ? 'حکم‌های امروز صفحه قابل محاسبه نبود'
        : 'Today\u2019s verdicts could not be scored';

  // S2 — the markets + currencies signals (or a second standout when both
  // feeds are absent).
  const signalClauses: string[] = [];
  for (const key of ['world-markets', 'world-currencies'] as const) {
    const entry = sections.get(key);
    if (entry === undefined || !entry.present || entry.verdict === null) continue;
    signalClauses.push(
      lang === 'fa'
        ? `${entry.label.fa} ${entry.verdict.word.fa} است`
        : `${entry.label.en} reads ${entry.verdict.word.en}`,
    );
  }

  // S3 — the first standout alert (section order, then the section's own
  // alert order), with its oneLine.
  const firstAlert = state.alerts[0];
  const firstEntry = firstAlert !== undefined ? entryOf(firstAlert.id, lang) : null;
  const secondAlert = state.alerts[1];

  const sentences: string[] = [s1];
  if (signalClauses.length > 0) {
    sentences.push(lang === 'fa' ? `${signalClauses.join('؛ ')}` : `${signalClauses.join('; ')}`);
  } else if (secondAlert !== undefined && entryOf(secondAlert.id, lang) !== null) {
    const second = entryOf(secondAlert.id, lang)!;
    sentences.push(
      lang === 'fa'
        ? `مورد دیگر، ${second.plainName} است: ${second.oneLine}`
        : `Another standout is ${second.plainName}: ${second.oneLine}`,
    );
  } else {
    sentences.push(
      lang === 'fa'
        ? 'بخش‌های بازارها و ارزها امروز در دسترس نیست'
        : 'The markets and currencies feeds are not available today',
    );
  }

  if (firstEntry !== null) {
    sentences.push(
      lang === 'fa'
        ? `یکی از موارد برجستهٔ صفحه، ${firstEntry.plainName} است: ${firstEntry.oneLine}`
        : `One standout reading is ${firstEntry.plainName}: ${firstEntry.oneLine}`,
    );
  } else {
    sentences.push(
      lang === 'fa'
        ? 'هیچ موردی در هیچ بخشی در وضعیت هشدار نیست'
        : 'No reading is in warning across the page\u2019s sections',
    );
  }

  // S4 — the out-of-date clause (when needed) + the not-advice reminder,
  // merged into one sentence so the overall template stays at exactly four.
  sentences.push(
    state.excluded.length > 0
      ? lang === 'fa'
        ? `${OUT_OF_DATE.fa} ${NOT_ADVICE.fa}`
        : `${OUT_OF_DATE.en} ${NOT_ADVICE.en}`
      : lang === 'fa'
        ? NOT_ADVICE.fa
        : NOT_ADVICE.en,
  );

  return joinSentences(sentences);
}

/* ------------------------------------------------------------------ *
 * The entry point
 * ------------------------------------------------------------------ */

/**
 * The deterministic template narrative for one unit (spec §8). Pure.
 *
 * @param state the unit's own state (section or overall)
 * @param unit  which unit this is (section or overall)
 * @param lang  the language to render
 */
export function templateNarrative(state: TemplateState, unit: NarratorUnit, lang: 'en' | 'fa'): string {
  if (unit.kind === 'overall') {
    if ('section' in state) {
      throw new Error('template: overall unit needs the overall state');
    }
    return overallText(state, lang);
  }
  if (!('section' in state)) {
    throw new Error('template: section unit needs a section state');
  }
  if (state.section !== unit.section) {
    throw new Error(`template: state section "${state.section}" does not match unit section "${unit.section}"`);
  }
  switch (state.section) {
    case 'global':
    case 'australia':
      return indicatorSectionText(state, lang);
    case 'world-markets':
      return marketsSectionText(state, lang);
    case 'world-currencies':
      return currenciesSectionText(state, lang);
  }
}
