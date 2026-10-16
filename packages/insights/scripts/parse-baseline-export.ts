/**
 * parse-baseline-export.ts — Setup step of AGENT_RUNBOOK.md: parse
 * docs/insights/baseline/currena-insights-full-2026-10-15.md (the 15 Oct
 * export the defects were found in) into JSON fixture data under
 * tests/fixtures/ so tests and the baseline defect checks can run against it.
 *
 * The parser is deliberately mechanical: it splits the export on its `##`
 * section headings, reads each Markdown table's header row, and keeps every
 * cell AS TEXT plus numeric views where the cell is a clean number. No
 * interpretation, no repair — the fixture mirrors the export so a defect
 * check fails against the data exactly as the audit saw it.
 *
 * Usage: corepack pnpm --filter @currena/insights exec tsx scripts/parse-baseline-export.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const SOURCE = resolve(REPO, 'docs', 'insights', 'baseline', 'currena-insights-full-2026-10-15.md');
const OUT = resolve(REPO, 'tests', 'fixtures', 'insights-baseline-2026-10-15.json');

interface Table {
  section: string;
  headers: string[];
  rows: string[][];
}

function splitRows(block: string): string[][] {
  const rows: string[][] = [];
  for (const line of block.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    // separator row (---)
    if (cells.every((c) => /^:?-{2,}:?$/.test(c) || c === '')) continue;
    rows.push(cells);
  }
  return rows;
}

function parse(md: string): { meta: Record<string, string>; tables: Table[] } {
  const meta: Record<string, string> = {};
  const tables: Table[] = [];
  const lines = md.split('\n');
  let i = 0;
  let section = '';
  while (i < lines.length) {
    const line: string = lines[i] ?? '';
    if (line.startsWith('# ')) {
      section = line.replace(/^#\s+/, '').trim();
      // collect the bullet block right after the heading (the meta floor
      // sits under the document's H1 — 'Data as of', 'Prices updated', …)
      const bullets: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const l: string = lines[j] ?? '';
        if (l.startsWith('|') || l.startsWith('#')) break;
        if (l.trim().startsWith('-')) bullets.push(l.trim().replace(/^-\s*/, ''));
        j++;
      }
      for (const b of bullets) {
        const m = b.match(/^([^:]+):\s*(.+)$/);
        if (m?.[1] && m[2]) meta[m[1].trim()] = m[2].trim();
      }
      i = j;
      continue;
    }
    if (line.startsWith('## ')) {
      section = line.replace(/^##\s+/, '').trim();
      i++;
      continue;
    }
    if (line.trim().startsWith('|')) {
      // gather the whole contiguous table block
      let j = i;
      const block: string[] = [];
      while (j < lines.length) {
        const l: string = lines[j] ?? '';
        if (!l.trim().startsWith('|')) break;
        block.push(l);
        j++;
      }
      const rows = splitRows(block.join('\n'));
      const header: string[] = rows[0] ?? [];
      if (rows.length >= 2 && header.length > 0) {
        tables.push({ section, headers: header, rows: rows.slice(1) });
      }
      i = j;
      continue;
    }
    i++;
  }
  return { meta, tables };
}

function maybeNumber(s: string): string | number {
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

const md = readFileSync(SOURCE, 'utf8');
const { meta, tables } = parse(md);

const out: Record<string, unknown> = {
  _fixture: 'Parsed from docs/insights/baseline/currena-insights-full-2026-10-15.md by packages/insights/scripts/parse-baseline-export.ts — regenerate, never hand-edit.',
  meta,
  tables: {} as Record<string, { headers: string[]; rows: Record<string, string | number>[] }>,
};

for (const t of tables) {
  const key = t.section;
  (out.tables as Record<string, unknown>)[key] = {
    headers: t.headers,
    rows: t.rows.map((r) => {
      const o: Record<string, string | number> = {};
      t.headers.forEach((h, idx) => {
        const cell = r[idx] ?? '';
        o[h] = maybeNumber(cell);
      });
      return o;
    }),
  };
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');

const sections = Object.keys(out.tables as object);
console.log(`parsed ${tables.length} tables → ${OUT}`);
console.log('sections:', sections.join(' · '));
const ind = (out.tables as Record<string, { rows: unknown[] }>)['Indicators'];
console.log('indicator rows:', ind ? ind.rows.length : 0);
