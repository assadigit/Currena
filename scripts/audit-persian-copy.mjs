#!/usr/bin/env node
/**
 * Persian copy audit — the permanent gate for reviewed fa copy.
 *
 * Compares the live user-facing Persian strings (both dictionaries, the
 * calendar titleFa values, and every hardcoded Persian literal in source)
 * against docs/localization/persian-copy-manifest.json and reports:
 *
 *   NEW             strings nobody triaged yet (fails CI until triaged)
 *   CHANGED         reviewed strings whose text drifted (needs-review)
 *   REMOVED         manifest entries whose source key/file vanished
 *   MIRROR-DRIFT    hardcoded mirrors no longer matching their linked key
 *   MISSING-TRANS   en↔fa key parity breaks
 *   QUEUED          entries explicitly marked unreviewed / needs-review
 *                   (visible review debt — does not fail the audit)
 *   DIVERGENT       same English text translated differently (advisory)
 *
 * Comments, tests, fixtures and docs are never scanned (AST-based sweep).
 *
 * Usage:   node scripts/audit-persian-copy.mjs [--json <report.json>] [--quiet]
 *          pnpm copy:audit
 * Exit 0 = clean · 1 = new/changed/removed/missing/mirror-drift found.
 * Workflow: docs/localization/persian-copy-workflow.md
 */

import fs from 'node:fs';
import { loadManifest, collectState, audit, auditIsClean } from './lib/persian-copy.mjs';

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const quiet = args.includes('--quiet');

const manifest = loadManifest();
const state = collectState();
const result = audit(manifest, state);

const lines = [];
const say = (s = '') => lines.push(s);

const total = manifest.entries.length;
const processed = manifest.entries.filter((e) => e.status === 'processed').length;
const queued = manifest.entries.filter((e) => e.status !== 'processed').length;

say(`Persian copy audit — ${total} manifest entries (${processed} processed, ${queued} queued)`);
say('');

const section = (label, items, render) => {
  if (!items.length) return;
  say(`${label} (${items.length}):`);
  for (const item of items) say(`  ${render(item)}`);
  say('');
};

section('NEW — untriaged Persian strings', result.new,
  (x) => `${x.id} · ${x.source}${x.line ? `:${x.line}` : ''} · ${JSON.stringify(x.text.slice(0, 70))}${x.text.length > 70 ? '…' : ''} → triage in the manifest (see workflow §3)`);

section('CHANGED — reviewed text drifted (needs-review)', result.changed,
  (x) => `${x.id} · ${x.source}\n      was: ${JSON.stringify(x.was.slice(0, 80))}\n      now: ${JSON.stringify(x.now.slice(0, 80))}`);

section('REMOVED — manifest entry has no source anymore', result.removed,
  (x) => `${x.id} · ${x.source} · ${x.note || ''}`);

section('MIRROR-DRIFT — hardcoded mirror out of sync', result.mirrorDrift,
  (x) => `${x.id} · ${x.problem}`);

section('MISSING-TRANS — en/fa key parity breaks', result.missingTranslations,
  (x) => `${x.id} · ${x.problem}`);

section('MANIFEST-ERROR — entry text/fingerprint inconsistent', result.manifestSelfErrors,
  (x) => `${x.id} · ${x.reason}`);

section('QUEUED — review debt (does not fail the audit)', result.queued,
  (x) => `${x.id} · ${x.status} · ${x.source}`);

section('DIVERGENT — same English, different Persian (advisory)', result.divergentDuplicates,
  (x) => `${JSON.stringify(x.en.slice(0, 40))} → ${x.keys.join(', ')}`);

if (auditIsClean(result)) {
  say('✓ clean — every user-facing Persian string matches its reviewed fingerprint.');
} else {
  const n = result.new.length + result.changed.length + result.removed.length + result.missingTranslations.length + result.manifestSelfErrors.length;
  say(`✗ ${n} finding(s) need attention — see docs/localization/persian-copy-workflow.md.`);
}

if (!quiet) process.stdout.write(lines.join('\n') + '\n');
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ generatedAt: new Date().toISOString(), result }, null, 2) + '\n');

process.exit(auditIsClean(result) ? 0 : 1);
