/**
 * Shared library for the Persian copy audit system
 * (docs/localization/persian-copy-manifest.json + scripts/audit-persian-copy.mjs).
 *
 * Everything the checker and the manifest updater need lives here so both
 * tools always agree on how strings are extracted, fingerprinted and matched:
 *
 *   - manifest IO in the repo's one-line-per-entry JSON format
 *   - AST extraction of the two fa dictionaries (nested objects, arrays,
 *     `as` casts) via the workspace's own typescript install
 *   - calendar titleFa extraction from data/insights-calendar.json
 *   - a comment-aware sweep for hardcoded Persian literals in source files
 *   - the audit comparison itself (new / changed / removed / mirror drift /
 *     missing translations / duplicate-source divergences)
 *
 * Fingerprinting is deliberately conservative: sha256 over the NFC-normalized
 * text and NOTHING else. Wording, punctuation, placeholders ({n}, {date}, …),
 * ZWNJ placement and whitespace are all significant; a reviewed string that
 * changes in any of them is flagged needs-review, never silently re-approved.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MANIFEST_PATH = path.join(REPO_ROOT, 'docs', 'localization', 'persian-copy-manifest.json');

/** Repository-relative canonical sources of Persian copy. */
export const SOURCES = {
  insights: 'apps/web/src/i18n/insights-copy-fa.ts',
  app: 'apps/web/src/i18n/fa.ts',
  insightsEn: 'apps/web/src/i18n/insights-copy-en.ts',
  appEn: 'apps/web/src/i18n/en.ts',
  calendar: 'data/insights-calendar.json',
};

/** Source roots the hardcoded-Persian sweep walks (code only, never tests). */
export const SWEEP_ROOTS = [
  'apps/web/src',
  'apps/api/src',
  'apps/markets/src',
  'packages/core/src',
  'packages/insights/src',
  'packages/scraper/src',
];

const PERSIAN = /[\u0600-\u06FF]/;

/* ------------------------------------------------------------------ */
/* TypeScript (resolved from the workspace's own dependency tree)      */
/* ------------------------------------------------------------------ */

let tsApi = null;
export function typescript() {
  if (tsApi) return tsApi;
  for (const base of ['apps/web', 'packages/core', '']) {
    try {
      const req = createRequire(pathToFileURL(path.join(REPO_ROOT, base, 'package.json')));
      tsApi = req('typescript');
      return tsApi;
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error('typescript not resolvable — run `pnpm install` first (the audit reads dictionaries via the TS AST)');
}

/* ------------------------------------------------------------------ */
/* Manifest IO (one line per entry, so git diffs stay reviewable)      */
/* ------------------------------------------------------------------ */

const HEADER_KEYS = ['version', 'description', 'statuses', 'kinds', 'fingerprint', 'sources'];

export function loadManifest(fromPath = MANIFEST_PATH) {
  const raw = JSON.parse(fs.readFileSync(fromPath, 'utf8'));
  if (!Array.isArray(raw.entries)) throw new Error(`${fromPath}: missing "entries" array`);
  return raw;
}

export function serializeManifest(manifest) {
  const lines = ['{'];
  for (const key of HEADER_KEYS) {
    if (manifest[key] === undefined) continue;
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(manifest[key], null, 2).replace(/\n/g, '\n  ')},`);
  }
  lines.push(`  ${JSON.stringify('entries')}: [`);
  manifest.entries.forEach((e, i) => lines.push(`    ${JSON.stringify(e)}${i === manifest.entries.length - 1 ? '' : ','}`));
  lines.push('  ]');
  lines.push('}');
  return lines.join('\n') + '\n';
}

export function saveManifest(manifest, toPath = MANIFEST_PATH) {
  const sorted = { ...manifest, entries: [...manifest.entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) };
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.writeFileSync(toPath, serializeManifest(sorted));
}

/* ------------------------------------------------------------------ */
/* Fingerprint                                                         */
/* ------------------------------------------------------------------ */

/** sha256 over the NFC-normalized text — conservative by design. */
export function fingerprint(text) {
  return createHash('sha256').update(text.normalize('NFC'), 'utf8').digest('hex');
}

/* ------------------------------------------------------------------ */
/* Dictionary extraction (TS AST)                                      */
/* ------------------------------------------------------------------ */

function unquote(keyText) {
  const t = keyText.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) return t.slice(1, -1);
  return t;
}

/**
 * Flatten a dictionary file into Map<dotted.key.path, runtimeString>.
 * Handles nested object literals, arrays (numeric path segments),
 * `expr as T` / `<T>expr` / `satisfies` casts around initializers, and
 * properties referencing a top-level `const NAME = {...}` in the same file
 * (insights-copy-en.ts builds `indicators: INDICATORS` that way).
 */
export function extractDictionary(relPath) {
  const ts = typescript();
  const filePath = path.join(REPO_ROOT, relPath);
  const src = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true);
  const out = new Map();

  // top-level const objects that properties may reference by identifier
  const topObjects = new Map();
  for (const stmt of sf.statements) {
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && ts.isObjectLiteralExpression(decl.initializer)) {
          topObjects.set(decl.name.text, decl.initializer);
        }
      }
    }
  }

  function walkObj(objNode, prefix) {
    for (const prop of objNode.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = unquote(prop.name.getText(sf));
      const p = prefix ? `${prefix}.${key}` : key;
      let init = prop.initializer;
      while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isTypeAssertionExpression(init)) {
        init = init.expression;
      }
      if (ts.isIdentifier(init) && topObjects.has(init.text)) {
        init = topObjects.get(init.text);
      }
      if (ts.isObjectLiteralExpression(init)) {
        walkObj(init, p);
      } else if (ts.isArrayLiteralExpression(init)) {
        init.elements.forEach((el, idx) => {
          if (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) out.set(`${p}.${idx}`, el.text);
          else if (ts.isObjectLiteralExpression(el)) walkObj(el, `${p}.${idx}`);
        });
      } else if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
        out.set(p, init.text);
      }
    }
  }

  let found = false;
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    // only EXPORTED consts are roots; helper consts (e.g. INDICATORS in
    // insights-copy-en.ts) are walked via identifier references only,
    // otherwise their keys would be counted twice (bare and prefixed)
    const exported = !!stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isObjectLiteralExpression(decl.initializer)) {
        walkObj(decl.initializer, '');
        found = true;
      }
    }
  }
  if (!found) throw new Error(`${relPath}: no top-level object literal found`);
  return out;
}

/* ------------------------------------------------------------------ */
/* Calendar extraction                                                 */
/* ------------------------------------------------------------------ */

/** Map<calendarEventId, titleFa> from data/insights-calendar.json. */
export function extractCalendar() {
  const cal = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, SOURCES.calendar), 'utf8'));
  const out = new Map();
  for (const ev of cal) out.set(ev.id, ev.titleFa);
  return out;
}

/* ------------------------------------------------------------------ */
/* Hardcoded-Persian sweep (comments and tests excluded by design)     */
/* ------------------------------------------------------------------ */

function listSourceFiles(rootRel, out) {
  const root = path.join(REPO_ROOT, rootRel);
  if (!fs.existsSync(root)) return;
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, ent.name);
    if (ent.isDirectory()) listSourceFiles(path.join(rootRel, ent.name), out);
    else if (/\.(ts|tsx)$/.test(ent.name) && !/\.test\./.test(ent.name)) out.push(path.join(rootRel, ent.name));
  }
}

/**
 * Every string literal / template span / JSX text containing Persian script
 * in code files, OUTSIDE the dictionaries, test files and the manifest docs.
 * Comments never appear because only AST string-bearing nodes are visited.
 * Each hit gets a stable proposed id (used when triaging a new hit):
 *   hardcoded.<file.path.dotted>.<sha256-8>
 */
export function sweepPersianLiterals() {
  const ts = typescript();
  const dictFiles = new Set(Object.values(SOURCES));
  const files = [];
  for (const root of SWEEP_ROOTS) listSourceFiles(root, files);

  const hits = [];
  for (const rel of files) {
    if (dictFiles.has(rel)) continue;
    const filePath = path.join(REPO_ROOT, rel);
    const src = fs.readFileSync(filePath, 'utf8');
    const kind = rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, kind);
    const push = (node, text, how) => {
      if (!PERSIAN.test(text)) return;
      hits.push({
        id: `hardcoded.${rel.replace(/\//g, '.').replace(/\.(ts|tsx)$/, '')}.${fingerprint(text).slice(0, 8)}`,
        source: rel,
        line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        text,
        foundAs: how,
      });
    };
    (function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) push(node, node.text, 'string-literal');
      else if (ts.isTemplateExpression(node)) {
        for (const span of node.templateSpans) push(span.literal, span.literal.text, 'template-span');
      } else if (ts.isJsxText(node)) push(node, node.getText(sf), 'jsx-text');
      node.forEachChild(visit);
    })(sf);
  }
  return hits;
}

/* ------------------------------------------------------------------ */
/* Current-state collection                                            */
/* ------------------------------------------------------------------ */

export function collectState() {
  return {
    insights: extractDictionary(SOURCES.insights),
    app: extractDictionary(SOURCES.app),
    insightsEn: extractDictionary(SOURCES.insightsEn),
    appEn: extractDictionary(SOURCES.appEn),
    calendar: extractCalendar(),
    sweep: sweepPersianLiterals(),
  };
}

/* ------------------------------------------------------------------ */
/* The audit                                                           */
/* ------------------------------------------------------------------ */

function entryOk(e) {
  return e && typeof e.text === 'string' && typeof e.sha256 === 'string' && fingerprint(e.text) === e.sha256;
}

/**
 * Compare the manifest against the live state. Result groups:
 *   new            — user-facing Persian strings with no manifest entry
 *   changed        — manifest entries whose source text drifted (needs-review)
 *   removed        — manifest entries whose source disappeared
 *   missingTranslations — en keys with no fa counterpart (and vice versa)
 *   mirrorDrift    — hardcoded mirrors no longer matching their linked key
 *   queued         — manifest entries explicitly unreviewed / needs-review
 *   divergentDuplicates — same English text translated differently (advisory)
 *   manifestSelfErrors   — entries whose text/fingerprint pair is inconsistent
 */
export function audit(manifest, state) {
  const result = {
    new: [], changed: [], removed: [], missingTranslations: [], mirrorDrift: [],
    queued: [], divergentDuplicates: [], manifestSelfErrors: [],
  };

  const byId = new Map(manifest.entries.map((e) => [e.id, e]));
  for (const e of manifest.entries) {
    if (!entryOk(e)) result.manifestSelfErrors.push({ id: e.id, reason: 'text/sha256 mismatch or missing' });
  }

  // --- dictionaries + calendar: match by id -------------------------
  const dictOf = (source) =>
    source === SOURCES.insights ? state.insights : source === SOURCES.app ? state.app : source === SOURCES.calendar ? state.calendar : null;

  for (const e of manifest.entries) {
    if (e.kind === 'mirror' || e.id.startsWith('hardcoded.')) continue; // matched via the sweep below
    const live = dictOf(e.source);
    if (!live) continue;
    if (e.status === 'unreviewed' || e.status === 'needs-review') {
      result.queued.push({ id: e.id, status: e.status, source: e.source });
    }
    if (!live.has(e.id)) {
      result.removed.push({ id: e.id, source: e.source, note: 'source key/event no longer exists' });
      continue;
    }
    const current = live.get(e.id);
    if (fingerprint(current) !== e.sha256) {
      result.changed.push({ id: e.id, source: e.source, was: e.text, now: current });
    }
  }

  // new dictionary keys / calendar events (any script: they are fa copy slots)
  const coveredIds = new Set(manifest.entries.filter((e) => e.kind !== 'mirror' && !e.id.startsWith('hardcoded.')).map((e) => e.id));
  for (const [source, live] of [[SOURCES.insights, state.insights], [SOURCES.app, state.app], [SOURCES.calendar, state.calendar]]) {
    for (const [id, text] of live) {
      if (!coveredIds.has(id)) result.new.push({ id, source, text, foundAs: source === SOURCES.calendar ? 'calendar-titleFa' : 'dictionary-key' });
    }
  }

  // --- sweep hits: match by (source file, fingerprint) ---------------
  // entries living outside the dictionaries/calendar (inline copy, mirrors,
  // technical strings) claim their hardcoded literal via source+fingerprint
  const sweepClaims = manifest.entries.filter((e) => !dictOf(e.source));
  for (const hit of state.sweep) {
    const claim = sweepClaims.find((e) => e.source === hit.source && e.sha256 === fingerprint(hit.text));
    if (!claim) {
      result.new.push({ id: hit.id, source: hit.source, text: hit.text, line: hit.line, foundAs: `hardcoded-${hit.foundAs}` });
    } else if (claim.status === 'unreviewed' || claim.status === 'needs-review') {
      result.queued.push({ id: claim.id, status: claim.status, source: claim.source });
    }
  }
  // claimed sweep entries that no longer resolve to any hit = removed/changed
  for (const claim of sweepClaims) {
    const stillThere = state.sweep.some((h) => h.source === claim.source && fingerprint(h.text) === claim.sha256);
    if (!stillThere) {
      const sameFileOther = state.sweep.find((h) => h.source === claim.source);
      result.removed.push({
        id: claim.id,
        source: claim.source,
        note: sameFileOther ? `text changed on this file (now e.g. ${JSON.stringify(sameFileOther.text.slice(0, 40))})` : 'Persian literal gone from this file',
      });
    }
  }

  // --- mirror sync: hardcoded strings must equal their linked key ----
  const app = state.app;
  for (const claim of sweepClaims) {
    if (claim.kind !== 'mirror' || !claim.linkedKey) continue;
    const live = app.get(claim.linkedKey);
    if (live === undefined) {
      result.mirrorDrift.push({ id: claim.id, problem: `linked key ${claim.linkedKey} no longer exists in ${SOURCES.app}` });
      continue;
    }
    const hit = state.sweep.find((h) => h.source === claim.source && fingerprint(h.text) === claim.sha256);
    if (!hit) continue; // already reported as removed/changed
    const expected = live.split('{n}').join('');
    if (hit.text !== expected) {
      result.mirrorDrift.push({
        id: claim.id,
        problem: `${claim.source} has ${JSON.stringify(hit.text)} but ${claim.linkedKey} implies ${JSON.stringify(expected)}`,
      });
    }
  }

  // --- translation parity (en ↔ fa key sets) --------------------------
  for (const [enMap, faMap, label] of [
    [state.appEn, state.app, SOURCES.app],
    [state.insightsEn, state.insights, SOURCES.insights],
  ]) {
    for (const k of enMap.keys()) if (!faMap.has(k)) result.missingTranslations.push({ id: k, source: label, problem: 'key exists in en but not fa' });
    for (const k of faMap.keys()) if (!enMap.has(k)) result.missingTranslations.push({ id: k, source: label, problem: 'key exists in fa but not en' });
  }

  // --- advisory: same English value, divergent Persian ----------------
  const byEn = new Map();
  for (const [k, v] of state.appEn) {
    if (!byEn.has(v)) byEn.set(v, []);
    byEn.get(v).push(k);
  }
  for (const [enText, keys] of byEn) {
    if (keys.length < 2 || !enText) continue;
    const faValues = new Set(keys.map((k) => state.app.get(k)));
    if (faValues.size > 1) {
      result.divergentDuplicates.push({ en: enText, keys, faValues: [...faValues] });
    }
  }

  return result;
}

export function auditIsClean(result) {
  return (
    result.new.length === 0 &&
    result.changed.length === 0 &&
    result.removed.length === 0 &&
    result.missingTranslations.length === 0 &&
    result.mirrorDrift.length === 0 &&
    result.manifestSelfErrors.length === 0
  );
}
