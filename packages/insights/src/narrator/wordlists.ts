/**
 * wordlists.ts — the Layer-2 narrator's canonical word lists (M1 of the
 * narrator build, docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md §7).
 *
 * TWO kinds of list live here:
 *
 * 1. THE LAYER-1 CANON (JARGON, BANNED_EN, BANNED_FA, FA_LATIN_ALLOW,
 *    TENOR_TOKEN + their match helpers) — moved VERBATIM from
 *    apps/web/src/components/insights/layer1/layer1.test.ts so the
 *    Layer-1 validator (gates G3/G4/G5/G6) and the narrator's validators
 *    (V4/V5/V6 + W3/W5/W6) read ONE list, bit for bit. The Layer-1 test
 *    now imports them from here; its behaviour and its 7,809-test count
 *    are unchanged. This module is the single source of truth — extending
 *    a Layer-1 list means changing it HERE and regenerating nothing else.
 *
 * 2. THE NARRATOR'S OWN SEED LISTS (prediction/certainty phrases beyond
 *    the Layer-1 canon, tone words for V8/W8, attribution phrases for W4,
 *    out-of-date markers for V10) — the spec's "seed word lists EN + FA,
 *    extend" (§7). These are narrator-only: the Layer-1 test never reads
 *    them.
 *
 * Pure data + pure text helpers: no I/O, no clock, no platform APIs
 * (AGENTS.md rule 2). The Persian phrases are validator data, not
 * user-facing copy — triaged in the Persian copy manifest as technical
 * entries (the format.ts digit-table precedent).
 */

/* ------------------------------------------------------------------ *
 * Shared text helpers (identical behaviour to the Layer-1 test's own)
 * ------------------------------------------------------------------ */

/** Split prose into whitespace-separated words. */
export function words(s: string): string[] {
  return s.split(/\s+/).filter((w) => w.length > 0);
}

/** Word count of a prose string. */
export function wordCount(s: string): number {
  return words(s).length;
}

/** Split prose into sentences on EN . ! ? and FA ۔ ؟ (U+06D4, U+061F).
 * A `.` (or other terminator) immediately followed by a digit is NOT a
 * sentence terminator — it is the decimal point of a number (PROMPT_VERSION
 * 2, D-42: the enriched indicator template weaves values like "5.283" into
 * the prose; without this guard V2 over-counts sentences and falls back to
 * the template for every indicator section).
 * PROMPT_VERSION 3 (D-42 follow-up): the negative lookahead now also covers
 * Persian digits (۰-۹, U+06F0-U+06F9) and Arabic-Indic digits (٠-٩,
 * U+0660-U+0669). The model sometimes writes "۵.۲۸" (Persian digits with an
 * ASCII period) instead of "۵٫۲۸" (Persian decimal separator ٫); the v2
 * regex `(?![0-9])` did not recognise ۲ as a digit, so it split "۵.۲۸" into
 * two fake sentences and V2 fell back to the template for every FA section
 * the model wrote that way. */
export function sentences(s: string): string[] {
  return s
    .split(/[.!?۔؟]+(?![0-9\u06F0-\u06F9\u0660-\u0669])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/* ------------------------------------------------------------------ *
 * 1. THE LAYER-1 CANON — moved verbatim from layer1.test.ts
 * ------------------------------------------------------------------ */

/**
 * G3 / V5 / W5 — jargon list (style guide §6, extended). Each entry maps a
 * jargon phrase to the glossary termId that covers it (or null = must be
 * replaced with a plain word; using it without a glossary term fails).
 */
export type JargonSpec = { en: string; fa: string; termId: string | null }[];

export const JARGON: JargonSpec = [
  { en: 'yield', fa: 'بازده', termId: 'yield' },
  { en: 'real yield', fa: 'بازده واقعی', termId: 'real-yield' },
  { en: 'breakeven inflation', fa: 'تورم ضمنی بازار', termId: 'breakeven' },
  { en: 'breakeven', fa: 'تورم ضمنی', termId: 'breakeven' },
  { en: 'inflation expectations', fa: 'انتظار تورم', termId: null },
  { en: 'spread', fa: 'اسپرد', termId: null },
  { en: 'basis points', fa: 'نقطه پایه', termId: null },
  { en: 'volatility', fa: 'نوسان', termId: 'volatility' },
  { en: 'VIX', fa: 'VIX', termId: 'vix' },
  { en: 'PMI', fa: 'PMI', termId: 'pmi' },
  { en: 'carry trade', fa: 'کری ترید', termId: 'carry-trade' },
  { en: 'money supply', fa: 'پول در گردش', termId: 'money-supply' },
  { en: 'leading indicator', fa: 'شاخص پیشرو', termId: 'leading-indicator' },
  { en: 'hawkish', fa: 'شاه‌باز', termId: null },
  { en: 'dovish', fa: 'قمری', termId: null },
  { en: 'tightening', fa: 'انقباض', termId: null },
  { en: 'easing', fa: 'انبساط', termId: null },
  { en: 'quantitative easing', fa: 'تسهیم کمّی', termId: null },
  { en: 'risk-on', fa: 'ریسک‌پذیری', termId: null },
  { en: 'risk-off', fa: 'گریز از ریسک', termId: null },
  { en: 'safe haven', fa: 'پناهگاه امن', termId: 'safe-haven' },
  { en: 'correction', fa: 'اصلاح بازار', termId: null },
  { en: 'bear market', fa: 'بازار نزولی', termId: null },
  { en: 'bull market', fa: 'بازار صعودی', termId: null },
  { en: 'drawdown', fa: 'افت از اوج', termId: null },
  { en: 'momentum', fa: 'مومنتوم', termId: null },
  { en: 'overbought', fa: 'خرید بیش‌ازحد', termId: null },
  { en: 'oversold', fa: 'فروش بیش‌ازحد', termId: null },
  { en: 'benchmark', fa: 'سنجه', termId: null },
  { en: 'commodity', fa: 'کالای خام', termId: 'commodity' },
  { en: 'futures', fa: 'قرارداد آینده', termId: null },
  { en: 'curve inversion', fa: 'معکوس شدن منحنی', termId: null },
  { en: 'inverted curve', fa: 'منحنی معکوس', termId: null },
  { en: 'yield curve', fa: 'منحنی بازده', termId: 'yield-curve' },
  { en: 'CPI', fa: 'CPI', termId: null },
  { en: 'GDP', fa: 'GDP', termId: null },
  { en: 'central bank', fa: 'بانک مرکزی', termId: 'central-bank' },
  { en: 'policy rate', fa: 'نرخ سیاستی', termId: 'policy-rate' },
  { en: 'ratio', fa: 'نسبت', termId: null },
  { en: 'dollar index', fa: 'شاخص دلار', termId: null },
  { en: 'equities', fa: 'سهام', termId: null },
  { en: 'bond', fa: 'اوراق قرضه', termId: 'bond' },
  { en: 'bonds', fa: 'اوراق قرضه', termId: 'bond' },
  // gap-closure S3-M3.2 (2026-11-01): the liquidity family's cards use the
  // word on their faces — it now carries its own glossary term (the
  // yield/bond pattern: still flagged, always glossed) instead of the old
  // blanket replace-it rule.
  { en: 'liquidity', fa: 'نقدینگی', termId: 'liquidity' },
  { en: 'recession', fa: 'رکود', termId: 'recession' },
  { en: 'inflation', fa: 'تورم', termId: 'inflation' },
  { en: 'mortgage', fa: 'وام مسکن', termId: 'mortgage' },
  { en: 'stock index', fa: 'شاخص بورس', termId: 'stock-index' },
  { en: 'interest rate', fa: 'نرخ بهره', termId: 'interest-rate' },
  { en: 'deflation', fa: 'ریزش قیمت', termId: 'deflation' },
];

/** G4 / V4 / W3 — banned advice/certainty words (style guide §5, extended). */
export const BANNED_EN: readonly string[] = [
  'buy', 'sell', 'invest now', 'should', 'must', 'guaranteed', 'certainly',
  'definitely', 'will crash', 'will rise', 'will fall', 'sure thing',
  'good time to', 'bad time to', 'get rich', 'risk-free',
];
export const BANNED_FA: readonly string[] = [
  'بخرید', 'بفروشید', 'سرمایه‌گذاری کنید', 'حتماً', 'قطعاً', 'تضمین',
  'بدون ریسک', 'زمان خوب برای', 'زمان بد برای',
];

/** Which banned list applies to a language (the Layer-1 canon pair). */
export function bannedList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? BANNED_FA : BANNED_EN;
}

/** The banned advice/certainty hits in a text (EN: word-boundary, FA: substring). */
export function bannedHits(text: string, lang: 'en' | 'fa'): string[] {
  const list = bannedList(lang);
  const hits: string[] = [];
  for (const w of list) {
    if (lang === 'fa') {
      if (text.includes(w)) hits.push(w);
    } else {
      const re = new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (re.test(text)) hits.push(w);
    }
  }
  return hits;
}

/* ---- G5 / V6 / W6 — Farsi hygiene ---- */

export const ARABIC_YEH = /\u064A/; // ي (Arabic) — must be Persian ی \u06CC
export const ARABIC_KAF = /\u0643/; // ك (Arabic) — must be Persian ک \u06A9
export const EM_DASH = /\u2014/; // —
export const ASCII_DIGIT = /[0-9]/;
export const FA_LATIN_ALLOW =
  /\b(VIX|S&P|ASX|Nikkei|Kospi|HSI|SSE|Taiex|Nifty|Stoxx|Dax|CAC|FTSE|Nasdaq|Dow|TSX|Bovespa|ECB|RBA|USD|AUD|EUR|JPY|CNY|BTC|PMI|GDP|CPI|NFP|HICP|CAPE|SOFR|WPI|DXY|EPU|GPR|NBS|EIA|CFTC|OECD|MOF|BOJ|BOE|FRED|PAYEMS|T10Y|DGS|DFED|T5Y)\b/gi;
export const DOUBLE_SPACE = /\s{2,}/;

/** Latin letter runs that are not on the Layer-1 allow-list. */
export function faLatinViolations(text: string): string[] {
  const stripped = text.replace(FA_LATIN_ALLOW, '');
  const match = stripped.match(/[A-Za-z]+/g);
  return match ?? [];
}

/* ---- G6 / V3 (digit normalisation) — tenor tokens + residual digits ---- */

// Tenor-name tokens that may carry digits:
//   ASCII:  10-year, 2-year, 3-month, 10y, 2y, 3m, 5y5y, 10y2y, 10y3m, 30-year
//   Persian: ۱۰ ساله, ۲ ساله, ۳ ماه, ۱۰–۲ سال (range), ۳۰ سالهٔ
export const TENOR_TOKEN =
  /\b\d+[-\s]?(?:year|month)s?\b|\b\d+[ym]\b|\b\d+y\d+[ym]\b|[\u06F0-\u06F9]+(?:\s*[-–]\s*[\u06F0-\u06F9]+)*\s*(?:سال|ساله|ماه)/gi;

/** Digit runs that are not part of an allowed tenor token. */
export function residualDigits(text: string): string[] {
  const stripped = text.replace(TENOR_TOKEN, '');
  const matches = stripped.match(/[0-9\u06F0-\u06F9]+/g);
  return matches ?? [];
}

/* ------------------------------------------------------------------ *
 * 2. THE NARRATOR'S OWN SEED LISTS (spec §7: "seed word lists, extend")
 * ------------------------------------------------------------------ */

/**
 * V4/W3 extension — prediction phrases the Layer-1 canon already covers in
 * part ("will crash/rise/fall"); these add the common forecast shapes a
 * model is likely to produce. EN: word-boundary matches; FA: substring.
 */
export const PREDICTION_EN: readonly string[] = [
  'will rise', 'will fall', 'will crash', 'will drop', 'will jump', 'will soar',
  'will plunge', 'is going to rise', 'is going to fall', 'is about to',
  'expect it to rise', 'expect it to fall', 'going forward it will',
  'next month it will', 'soon rise', 'soon fall',
];
export const PREDICTION_FA: readonly string[] = [
  'خواهد رفت', 'خواهد شد', 'خواهد کرد', 'قرار است افزایش', 'قرار است کاهش',
  'به‌زودی بالا می‌رود', 'به‌زودی پایین می‌آید', 'انتظار می‌رود بالا',
  'انتظار می‌رود پایین', 'در آینده افزایش می‌یابد', 'در آینده کاهش می‌یابد',
];

/** W3's combined certainty/prediction scan = the banned lists + these. */
export function predictionList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? PREDICTION_FA : PREDICTION_EN;
}

/**
 * V8 / W8 — tone seed words. ALARM words are panic language a calm section
 * must never wear; ALL_CLEAR words are the "nothing to see here" phrases a
 * firing section must never wear. EN: word-boundary; FA: substring.
 */
export const ALARM_EN: readonly string[] = [
  'panic', 'crisis', 'catastrophe', 'disaster', 'emergency', 'turmoil',
  'collapse', 'crashing', 'meltdown', 'terrifying', 'alarm bells',
];
export const ALARM_FA: readonly string[] = [
  'وحشت', 'بحران شدید', 'فاجعه', 'آشوب', 'سقوط آزاد', 'فروپاشی', 'سراسیمه',
  'زنگ خطر جدی', 'شرایط اضطراری',
];
export const ALL_CLEAR_EN: readonly string[] = [
  'all clear', 'completely calm', 'nothing to worry about', 'no concerns at all',
  'everything is fine', 'totally calm', 'perfectly calm', 'no problems at all',
];
export const ALL_CLEAR_FA: readonly string[] = [
  'کاملاً آرام', 'هیچ نگرانی نیست', 'هیچ مشکلی وجود ندارد', 'همه‌چیز کاملاً خوب است',
  'بدون هیچ نگرانی', 'اصلاً مشکلی نیست',
];

export function alarmList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? ALARM_FA : ALARM_EN;
}
export function allClearList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? ALL_CLEAR_FA : ALL_CLEAR_EN;
}

/** Phrase-hit helper: EN word-boundary (case-insensitive), FA substring. */
export function phraseHits(text: string, phrases: readonly string[], lang: 'en' | 'fa'): string[] {
  const hits: string[] = [];
  for (const p of phrases) {
    if (lang === 'fa') {
      if (text.includes(p)) hits.push(p);
    } else {
      const re = new RegExp(`\\b${p.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (re.test(text)) hits.push(p);
    }
  }
  return hits;
}

/**
 * W4 — attribution seed phrases. A news note MUST carry at least one
 * (the spec's "attribute everything" rule made checkable).
 */
export const ATTRIBUTION_EN: readonly string[] = [
  'reports suggest', 'reports say', 'reporting suggests', 'news coverage',
  'news reports', 'analysts commonly point to', 'commentators point to',
  'coverage this week', 'according to reports', 'reported this week',
  'has been reported',
];
export const ATTRIBUTION_FA: readonly string[] = [
  'گزارش‌ها حاکی از', 'گزارش‌ها نشان می‌دهد', 'به گزارش', 'در خبرها',
  'پوشش خبری این هفته', 'تحلیلگران معمولاً به', 'گزارش شده است',
  'در گزارش‌های این هفته',
];

export function attributionList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? ATTRIBUTION_FA : ATTRIBUTION_EN;
}

/**
 * V10 — the out-of-date markers. When a unit's state lists excluded items,
 * its narrative MUST contain one of these (the template's fixed clause is
 * built from the first entry); when it lists none, none of these may
 * appear (no invented staleness).
 */
export const OUT_OF_DATE_EN: readonly string[] = [
  'out of date', 'left out', 'not included', 'excluded', 'not fresh',
];
export const OUT_OF_DATE_FA: readonly string[] = [
  'به‌روز نیست', 'کنار گذاشته شده', 'قدیمی', 'خارج شده',
];

export function outOfDateList(lang: 'en' | 'fa'): readonly string[] {
  return lang === 'fa' ? OUT_OF_DATE_FA : OUT_OF_DATE_EN;
}

/* ------------------------------------------------------------------ *
 * Digit normalisation (V3/W2) — Persian/Arabic digits to ASCII
 * ------------------------------------------------------------------ */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Persian/Arabic-Indic digits → ASCII (used before any numeric check). */
export function normalizeDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) {
      out += String(a);
      continue;
    }
    out += ch;
  }
  return out;
}

/** ASCII digits → Persian (the FA templates' render side). */
export function toPersianDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const d = ch.charCodeAt(0) - 48;
    out += d >= 0 && d <= 9 ? PERSIAN_DIGITS[d]! : ch;
  }
  return out;
}
