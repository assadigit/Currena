/**
 * Layer 1 — the validation gate (spec §9, gates G1–G8).
 *
 * Runs on every `pnpm -r test`. Enforces, on every run:
 *   - every Layer-1 entry that EXISTS is valid (G2–G7)
 *   - no Layer-1 entry exists for an id NOT in the code inventory (G1 orphan)
 * The full-completeness half of G1 (all 134 ids present) is ADVISORY
 * (console) unless `LAYER1_STRICT=1` is set, then it hard-fails. The final
 * session sets `LAYER1_STRICT=1`. See DECISIONS D-07.
 */

import { describe, it, expect } from 'vitest';
import type { Layer1Entry, Layer1GlossaryEntry } from '../../../i18n/insights-copy-en';
import {
  getIndicatorCopy,
  getGlossary,
  LAYER1_INDICATOR_IDS,
  LAYER1_GLOSSARY_IDS,
  LAYER1_INVENTORY_IDS,
} from './index';
// The Layer-1 word canon (G3/G4/G5/G6) lives in ONE place — the insights
// package — so the Layer-2 narrator's validators (V4/V5/V6 + W3/W5/W6)
// and this gate read identical lists, bit for bit (moved verbatim from
// this file; behaviour and test count unchanged).
import {
  ARABIC_KAF,
  ARABIC_YEH,
  ASCII_DIGIT,
  DOUBLE_SPACE,
  EM_DASH,
  JARGON,
  bannedHits,
  faLatinViolations,
  residualDigits,
  sentences,
  wordCount,
} from '@currena/insights/narrator';

type Lang = 'en' | 'fa';
const LANGS: Lang[] = ['en', 'fa'];
const STRICT = process.env.LAYER1_STRICT === '1';

/* ------------------------------------------------------------------ *
 * Word / sentence helpers (shared with the narrator's validators)
 * ------------------------------------------------------------------ */

function isOneSentence(s: string): boolean {
  return sentences(s).length <= 1;
}

/* ------------------------------------------------------------------ *
 * G3 — jargon list (style guide §6, extended). Each entry maps a jargon
 * phrase to the glossary termId that covers it (or null = must be replaced
 * with a plain word; using it without a glossary term fails G3).
 * The list itself is imported from @currena/insights/narrator/wordlists
 * (the one canonical copy, shared with the Layer-2 narrator's V5/W5).
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * G4 — banned advice/certainty words (style guide §5, extended).
 * The lists + bannedHits are imported from the shared wordlists module
 * (shared with the narrator's V4/W3).
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * G5 — Farsi hygiene + G6 digits — the patterns and matchers
 * (ARABIC_YEH/KAF, EM_DASH, ASCII_DIGIT, FA_LATIN_ALLOW, DOUBLE_SPACE,
 * faLatinViolations, TENOR_TOKEN, residualDigits) are imported from the
 * shared wordlists module.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Collect every prose field of an entry (for cross-field checks).
 * ------------------------------------------------------------------ */

interface ProseField {
  path: string;
  text: string;
}

function entryProse(entry: Layer1Entry, idPath: string): ProseField[] {
  const out: ProseField[] = [
    { path: `${idPath}.plainName`, text: entry.plainName },
    { path: `${idPath}.oneLine`, text: entry.oneLine },
  ];
  if (entry.ifRising !== null) out.push({ path: `${idPath}.ifRising`, text: entry.ifRising });
  if (entry.ifFalling !== null) out.push({ path: `${idPath}.ifFalling`, text: entry.ifFalling });
  for (let i = 0; i < entry.connections.length; i++) {
    out.push({ path: `${idPath}.connections[${i}].text`, text: entry.connections[i]!.text });
  }
  if (entry.australiaAngle !== undefined) {
    out.push({ path: `${idPath}.australiaAngle`, text: entry.australiaAngle });
  }
  return out;
}

function glossaryProse(term: Layer1GlossaryEntry, idPath: string): ProseField[] {
  const out: ProseField[] = [
    { path: `${idPath}.term`, text: term.term },
    { path: `${idPath}.plain`, text: term.plain },
  ];
  if (term.example !== undefined) out.push({ path: `${idPath}.example`, text: term.example });
  return out;
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

describe('Layer 1 — G1 completeness', () => {
  const inventory = new Set(LAYER1_INVENTORY_IDS);

  it('every Layer-1 indicator id is in the code inventory (no orphans)', () => {
    const orphans = LAYER1_INDICATOR_IDS.filter((id) => !inventory.has(id));
    expect(orphans, `orphan Layer-1 ids (not in code): ${orphans.join(', ')}`).toEqual([]);
  });

  it('every Layer-1 glossary term id is non-empty', () => {
    expect(LAYER1_GLOSSARY_IDS.length, 'glossary has at least one term').toBeGreaterThan(0);
    for (const id of LAYER1_GLOSSARY_IDS) {
      expect(id.length, `empty glossary term id`).toBeGreaterThan(0);
    }
  });

  it('full completeness (all 134 ids have EN+FA entries) — STRICT when LAYER1_STRICT=1', () => {
    const missing: string[] = [];
    for (const id of LAYER1_INVENTORY_IDS) {
      if (getIndicatorCopy(id, 'en') === undefined || getIndicatorCopy(id, 'fa') === undefined) {
        missing.push(id);
      }
    }
    if (missing.length > 0) {
      console.log(
        `[Layer1 G1] ${missing.length}/${LAYER1_INVENTORY_IDS.length} indicators still need EN+FA copy: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ' …' : ''}`,
      );
    }
    if (STRICT) {
      expect(missing, `LAYER1_STRICT: missing EN+FA copy for ${missing.length} ids`).toEqual([]);
    } else {
      expect(true).toBe(true);
    }
  });
});

describe('Layer 1 — G2 length limits', () => {
  for (const lang of LANGS) {
    for (const id of LAYER1_INDICATOR_IDS) {
      const entry = getIndicatorCopy(id, lang);
      if (!entry) continue;
      it(`${lang} ${id}.plainName ≤ 6 words`, () => {
        expect(wordCount(entry.plainName), `${entry.plainName}`).toBeLessThanOrEqual(6);
      });
      it(`${lang} ${id}.oneLine ≤ 16 words & 1 sentence`, () => {
        expect(wordCount(entry.oneLine)).toBeLessThanOrEqual(16);
        expect(isOneSentence(entry.oneLine), `multi-sentence: ${entry.oneLine}`).toBe(true);
      });
      if (entry.ifRising !== null) {
        const v = entry.ifRising;
        it(`${lang} ${id}.ifRising ≤ 22 words & 1 sentence`, () => {
          expect(wordCount(v)).toBeLessThanOrEqual(22);
          expect(isOneSentence(v), `multi-sentence: ${v}`).toBe(true);
        });
      }
      if (entry.ifFalling !== null) {
        const v = entry.ifFalling;
        it(`${lang} ${id}.ifFalling ≤ 22 words & 1 sentence`, () => {
          expect(wordCount(v)).toBeLessThanOrEqual(22);
          expect(isOneSentence(v)).toBe(true);
        });
      }
      it(`${lang} ${id}.connections ≤ 3`, () => {
        expect(entry.connections.length).toBeLessThanOrEqual(3);
      });
      for (let i = 0; i < entry.connections.length; i++) {
        const c = entry.connections[i]!;
        it(`${lang} ${id}.connections[${i}].text ≤ 1 sentence`, () => {
          expect(isOneSentence(c.text), `multi-sentence: ${c.text}`).toBe(true);
        });
      }
    }
    for (const termId of LAYER1_GLOSSARY_IDS) {
      const term = getGlossary(lang)[termId];
      if (!term) continue;
      it(`${lang} glossary ${termId}.plain ≤ 2 sentences`, () => {
        expect(sentences(term.plain).length, term.plain).toBeLessThanOrEqual(2);
      });
    }
  }
});

describe('Layer 1 — G3 jargon must be a listed glossary term', () => {
  for (const lang of LANGS) {
    it(`${lang}: every jargon word used is a listed glossary term (or replaced)`, () => {
      const violations: string[] = [];
      for (const id of LAYER1_INDICATOR_IDS) {
        const entry = getIndicatorCopy(id, lang);
        if (!entry) continue;
        const listed = new Set(entry.glossaryTerms);
        for (const { path, text } of entryProse(entry, `${lang}.${id}`)) {
          for (const j of JARGON) {
            const phrase = lang === 'fa' ? j.fa : j.en;
            if (!phrase) continue;
            const found =
              lang === 'fa'
                ? text.includes(phrase)
                : text.toLowerCase().includes(j.en.toLowerCase());
            if (!found) continue;
            if (j.termId === null) {
              violations.push(`${path}: jargon "${j.en}" used with no glossary term — replace it ("${text.slice(0, 60)}")`);
            } else if (!listed.has(j.termId)) {
              violations.push(`${path}: jargon "${j.en}" used but "${j.termId}" not in ${id}.glossaryTerms`);
            }
          }
        }
      }
      expect(violations.join('\n  - '), `G3 ${lang} violations`).toBe('');
      expect(violations.length, `${lang} jargon violations`).toBe(0);
    });
  }
});

describe('Layer 1 — G4 banned advice/certainty words', () => {
  for (const lang of LANGS) {
    it(`${lang}: no banned advice/certainty words anywhere`, () => {
      const violations: string[] = [];
      const scan = (path: string, text: string) => {
        const hits = bannedHits(text, lang);
        for (const w of hits) violations.push(`${path}: banned "${w}" in "${text.slice(0, 60)}"`);
      };
      for (const id of LAYER1_INDICATOR_IDS) {
        const entry = getIndicatorCopy(id, lang);
        if (!entry) continue;
        for (const { path, text } of entryProse(entry, `${lang}.${id}`)) scan(path, text);
      }
      for (const termId of LAYER1_GLOSSARY_IDS) {
        const term = getGlossary(lang)[termId];
        if (!term) continue;
        for (const { path, text } of glossaryProse(term, `${lang}.glossary.${termId}`)) scan(path, text);
      }
      expect(violations.join('\n  - '), `G4 ${lang} violations`).toBe('');
      expect(violations.length, `${lang} banned-word violations`).toBe(0);
    });
  }
});

describe('Layer 1 — G5 Farsi hygiene', () => {
  for (const id of LAYER1_INDICATOR_IDS) {
    const entry = getIndicatorCopy(id, 'fa');
    if (!entry) continue;
    for (const { path, text } of entryProse(entry, `fa.${id}`)) {
      it(`${path}: no ASCII digits (Persian only)`, () => {
        expect(ASCII_DIGIT.test(text), `ASCII digit in "${text.slice(0, 60)}"`).toBe(false);
      });
      it(`${path}: Persian ی/ک (no Arabic ي/ك)`, () => {
        expect(ARABIC_YEH.test(text), `Arabic ي in "${text.slice(0, 60)}"`).toBe(false);
        expect(ARABIC_KAF.test(text), `Arabic ك in "${text.slice(0, 60)}"`).toBe(false);
      });
      it(`${path}: no double spaces`, () => {
        expect(DOUBLE_SPACE.test(text), `double space in "${text.slice(0, 60)}"`).toBe(false);
      });
      it(`${path}: no em dash`, () => {
        expect(EM_DASH.test(text), `em dash in "${text.slice(0, 60)}"`).toBe(false);
      });
      it(`${path}: Latin only from allow-list`, () => {
        const v = faLatinViolations(text);
        expect(v, `unexpected Latin in "${text.slice(0, 60)}": ${v.join(',')}`).toEqual([]);
      });
    }
  }
  for (const termId of LAYER1_GLOSSARY_IDS) {
    const term = getGlossary('fa')[termId];
    if (!term) continue;
    for (const { path, text } of glossaryProse(term, `fa.glossary.${termId}`)) {
      it(`${path}: no ASCII digits`, () => {
        expect(ASCII_DIGIT.test(text)).toBe(false);
      });
      it(`${path}: Persian ی/ک`, () => {
        expect(ARABIC_YEH.test(text)).toBe(false);
        expect(ARABIC_KAF.test(text)).toBe(false);
      });
      it(`${path}: no em dash, no double spaces`, () => {
        expect(EM_DASH.test(text)).toBe(false);
        expect(DOUBLE_SPACE.test(text)).toBe(false);
      });
      it(`${path}: Latin only from allow-list`, () => {
        expect(faLatinViolations(text)).toEqual([]);
      });
    }
  }
});

describe('Layer 1 — G6 no digits (except tenor names + glossary examples)', () => {
  for (const lang of LANGS) {
    for (const id of LAYER1_INDICATOR_IDS) {
      const entry = getIndicatorCopy(id, lang);
      if (!entry) continue;
      for (const { path, text } of entryProse(entry, `${lang}.${id}`)) {
        it(`${path}: no stray digits`, () => {
          const res = residualDigits(text);
          expect(res, `stray digits in "${text.slice(0, 60)}": ${res.join(',')}`).toEqual([]);
        });
      }
    }
    for (const termId of LAYER1_GLOSSARY_IDS) {
      const term = getGlossary(lang)[termId];
      if (!term) continue;
      // Glossary example? is EXEMPT from G6; term + plain are NOT.
      const checkFields: ProseField[] = [
        { path: `${lang}.glossary.${termId}.term`, text: term.term },
        { path: `${lang}.glossary.${termId}.plain`, text: term.plain },
      ];
      for (const { path, text } of checkFields) {
        it(`${path}: no stray digits`, () => {
          const res = residualDigits(text);
          expect(res, `stray digits in "${text.slice(0, 60)}"`).toEqual([]);
        });
      }
    }
  }
});

describe('Layer 1 — G7 readability (sentence word counts)', () => {
  const collectAll = (lang: Lang): ProseField[] => {
    const out: ProseField[] = [];
    for (const id of LAYER1_INDICATOR_IDS) {
      const entry = getIndicatorCopy(id, lang);
      if (!entry) continue;
      out.push(...entryProse(entry, `${lang}.${id}`));
    }
    for (const termId of LAYER1_GLOSSARY_IDS) {
      const term = getGlossary(lang)[termId];
      if (!term) continue;
      out.push(...glossaryProse(term, `${lang}.glossary.${termId}`));
    }
    return out;
  };
  for (const lang of LANGS) {
    const all = collectAll(lang);
    const allSentences: { path: string; text: string }[] = [];
    for (const { path, text } of all) {
      for (const s of sentences(text)) allSentences.push({ path, text: s });
    }
    const lengths = allSentences.map((s) => wordCount(s.text));
    const maxLen = lengths.length ? Math.max(...lengths) : 0;
    const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
    const limit = lang === 'fa' ? 22 : 20;
    it(`${lang}: average sentence ≤ ${limit} words (avg ${avg.toFixed(1)})`, () => {
      expect(avg, `${lang} avg too high`).toBeLessThanOrEqual(limit);
    });
    it(`${lang}: no sentence over 28 words (max ${maxLen})`, () => {
      const over = allSentences.filter((s) => wordCount(s.text) > 28);
      expect(over.map((s) => `${s.path}: ${wordCount(s.text)}`).join(' | '), 'sentences over 28 words').toBe('');
    });
  }
});

describe('Layer 1 — G8 shape parity (en ↔ fa)', () => {
  it('every EN Layer-1 indicator id has an FA entry with the same shape', () => {
    for (const id of LAYER1_INDICATOR_IDS) {
      const en = getIndicatorCopy(id, 'en');
      const fa = getIndicatorCopy(id, 'fa');
      expect(fa, `fa missing for ${id}`).toBeDefined();
      if (en && fa) {
        expect(fa.ifRising === null, `${id} ifRising null parity`).toBe(en.ifRising === null);
        expect(fa.ifFalling === null, `${id} ifFalling null parity`).toBe(en.ifFalling === null);
        expect(fa.connections.length, `${id} connections count parity`).toBe(en.connections.length);
        expect(fa.glossaryTerms.length, `${id} glossaryTerms count parity`).toBe(en.glossaryTerms.length);
        expect(fa.australiaAngle !== undefined, `${id} australiaAngle presence parity`).toBe(en.australiaAngle !== undefined);
      }
    }
  });
  it('every EN glossary term id has an FA entry', () => {
    for (const termId of LAYER1_GLOSSARY_IDS) {
      const fa = getGlossary('fa')[termId];
      expect(fa, `fa glossary missing for ${termId}`).toBeDefined();
    }
  });
});
