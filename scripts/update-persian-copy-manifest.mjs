#!/usr/bin/env node
/**
 * Manifest updater — records review decisions for Persian copy.
 *
 * After a reviewer approves new or changed Persian text (workflow §4-5),
 * this tool writes the final text + fingerprint into
 * docs/localization/persian-copy-manifest.json. It never invents text: it
 * snapshots the CURRENT source value for the ids you name.
 *
 * Usage:
 *   # triage findings from an audit report (ids come straight from it):
 *   node scripts/audit-persian-copy.mjs --json /tmp/audit.json
 *   node scripts/update-persian-copy-manifest.mjs --report /tmp/audit.json \
 *        --ids ui.someNewKey,hardcoded.apps.web...e3b0c442 \
 *        --status processed --round round-3 --reference my-review.md [--note "..."]
 *
 *   # explicitly queue something for later review (no round/reference needed):
 *   node scripts/update-persian-copy-manifest.mjs --status needs-review \
 *        --ids converter.something --note "meaning unclear, ask owner"
 *
 * Rules:
 *   - ids must resolve in the CURRENT sources (dictionary key, calendar id,
 *     or sweep id from the audit report).
 *   - status processed REQUIRES --round and --reference (traceability).
 *   - unreviewed / needs-review REQUIRE --note instead.
 *   - existing entries are updated in place (text, fingerprint, status,
 *     round, reference, note); ids are stable.
 */

import fs from 'node:fs';
import { loadManifest, saveManifest, collectState, fingerprint } from './lib/persian-copy.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};

const status = flag('status');
const round = flag('round');
const reference = flag('reference');
const note = flag('note');
const ids = (flag('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
const reportPath = flag('report');

if (!status || !ids.length) {
  console.error('usage: update-persian-copy-manifest.mjs --ids id1,id2 --status processed|unreviewed|needs-review [--round R] [--reference F] [--note N] [--report audit.json]');
  process.exit(2);
}
if (!['processed', 'unreviewed', 'needs-review'].includes(status)) {
  console.error(`invalid --status ${JSON.stringify(status)}`);
  process.exit(2);
}
if (status === 'processed' && (!round || !reference)) {
  console.error('--status processed requires --round and --reference (traceable basis for the review)');
  process.exit(2);
}
if (status !== 'processed' && !note) {
  console.error(`--status ${status} requires --note (why it is queued)`);
  process.exit(2);
}

// current live values for the requested ids
const state = collectState();
const liveOf = new Map();
for (const [id, text] of state.insights) liveOf.set(id, { source: 'apps/web/src/i18n/insights-copy-fa.ts', text });
for (const [id, text] of state.app) liveOf.set(id, { source: 'apps/web/src/i18n/fa.ts', text });
for (const [id, text] of state.calendar) liveOf.set(id, { source: 'data/insights-calendar.json', text });
// audit-report ids for sweep hits carry their own source/line info
if (reportPath && fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  for (const item of [...(report.result?.new || []), ...(report.result?.changed || [])]) {
    if (!liveOf.has(item.id)) liveOf.set(item.id, { source: item.source, text: item.text ?? item.now, line: item.line });
  }
}

const manifest = loadManifest();
const byId = new Map(manifest.entries.map((e) => [e.id, e]));

for (const id of ids) {
  const live = liveOf.get(id);
  if (!live) {
    console.error(`✗ ${id}: not found in current sources — run the audit first and copy ids from its report`);
    process.exit(1);
  }
  const entry = byId.get(id) || { id, source: live.source };
  Object.assign(entry, {
    source: live.source,
    status,
    kind: entry.kind || (id.startsWith('hardcoded.') ? undefined : entry.kind) || 'copy',
    text: live.text,
    sha256: fingerprint(live.text),
  });
  if (status === 'processed') {
    entry.round = round;
    entry.reference = reference;
    if (note) entry.note = note; else delete entry.note;
  } else {
    delete entry.round;
    delete entry.reference;
    entry.note = note;
  }
  if (entry.kind === undefined) delete entry.kind;
  if (!byId.has(id)) manifest.entries.push(entry);
  console.log(`✓ ${id} → ${status} (${live.source})`);
}

saveManifest(manifest);
console.log(`manifest saved: ${manifest.entries.length} entries`);
