/**
 * insights-export.ts — M-3 (RULES.md §3, defect E-23, runbook Phase 3/7): the
 * OWNER-ONLY full export's pure builders, served by GET /api/insights/export.
 *
 * The document mirrors the web export's STRUCTURE
 * (apps/web/src/components/insights/full-export.ts — read, never imported):
 * the same section order (verdicts → prices → markets → fx → connections →
 * signals → indicators → calendar → changed), a title + meta floor, per-
 * section tables with their own header rows, and the MD/CSV renderers. The
 * DATA is server-side: the CURRENT PRIVATE snapshot + the boards + the
 * bundled indicator-audit sidecar — so the export always includes every
 * E-23 column:
 *
 *   id, title, value, unit, status, data date (asOf), published date
 *   (releaseDate), stale flag + age, fetched/updated time, source URL,
 *   licence name, level, owner_accepts, enabled, peak value/date/basis where
 *   present, rule version + the rule JSON verbatim.
 *
 * Wording differences from the web export (deliberate, server-side): the
 * section text is plain English machine-oriented copy (no localized
 * dictionaries exist server-side), statuses/trends ride their canonical
 * tokens, values stay canonical (AGENTS.md rule 5 — the web's display
 * scaling is a presentation concern), and the unit column derives from the
 * registry's changeKind (RULES.md §6: percentage points vs %).
 *
 * Pure, platform-free: everything derives from the passed snapshot; the
 * route injects the readers.
 */

import { csvEscapeField, csvNeutralizeFormula, formatNumber } from '@currena/core';
import type {
  FxSnapshot,
  IndicatorReading,
  InsightsSnapshot,
  MarketEntry,
  MarketsSnapshot,
} from '@currena/core';
import { DEFINITIONS, evaluateConnections, evaluateSignals } from '@currena/insights';
import { FX_GROUP_ORDER, FX_PAIRS } from '@currena/insights/fx/definitions';
import { INDICATOR_AUDIT_BY_ID, type IndicatorAuditEntry } from './audit-sidecar';
import { DATA_CONTACT_URL } from './contact';

export type ExportFormat = 'md' | 'csv' | 'json';

/** The registry's English titles + change kinds (canonical, never localized). */
const DEFINITION_BY_ID = new Map(DEFINITIONS.map((def) => [def.id as string, def]));

/** ASCII-number rendering for export cells (machine-readable, en-US): period
 * decimals, NO thousands separators — the web export's documented discipline. */
function asciiNumber(value: number, digits = 6): string {
  return formatNumber(value, 'en-US', { maximumFractionDigits: digits, useGrouping: false });
}

/** RULES.md §6 units from the registry's own changeKind vocabulary. */
function unitOf(id: string): string {
  const def = DEFINITION_BY_ID.get(id);
  if (def === undefined) return '';
  return def.changeKind === 'points' ? 'percentage points' : '%';
}

function titleOf(id: string): string {
  return DEFINITION_BY_ID.get(id)?.name ?? id;
}

/** One section's table: its own columns, in the web export's section order. */
export interface DocSection {
  /** Stable key (tests) — never rendered. */
  key: string;
  heading: string;
  headers: string[];
  /** Cells: canonical scalars; booleans render as true/false (the stored
   * stale/bigMove flags ride the markets/fx rows verbatim). */
  rows: (string | number | boolean | null)[][];
  /** Fraction digits for number cells in the text renderers. */
  digits: number;
}

export interface ExportDoc {
  heading: string;
  metaLines: string[];
  sections: DocSection[];
}

export interface ExportInput {
  snapshot: InsightsSnapshot;
  markets: MarketsSnapshot | null;
  fx: FxSnapshot | null;
}

/** The stale flag with its age (defect E-23): days between the snapshot's own
 * clock and the reading's asOf — never the wall clock. */
function staleFlagOf(reading: IndicatorReading, nowDay: string): string {
  if (reading.status !== 'stale' && reading.status !== 'check-pending') return 'no';
  if (reading.asOf === null) return 'yes';
  const ageDays = Math.max(
    0,
    Math.round((Date.parse(`${nowDay}T00:00:00Z`) - Date.parse(`${reading.asOf}T00:00:00Z`)) / 86_400_000),
  );
  return `yes (${ageDays} days)`;
}

/** The audit sidecar's owner/level switches as export cells (null-safe). */
function ownerAcceptsCell(audit: IndicatorAuditEntry | undefined): string {
  if (audit === undefined || audit.ownerAccepts === null) return '';
  return audit.ownerAccepts ? 'true' : 'false';
}

/** M-6's kill switch as an export cell (null when the id is absent from the sidecar). */
function enabledCell(audit: IndicatorAuditEntry | undefined): string | null {
  if (audit === undefined) return null;
  return audit.enabled ? 'true' : 'false';
}

/** Assemble the whole document (shared by all three renderers). */
export function buildInsightsExportDoc(input: ExportInput): ExportDoc {
  const { snapshot, markets, fx } = input;
  const nowDay = snapshot.generatedAt.slice(0, 10);

  // Meta — the export's floor: title, generated date, data date, rule
  // version, and the M-7 contact address every data owner can use.
  const metaLines = [
    `Generated: ${snapshot.generatedAt}`,
    `Data as of: ${nowDay}`,
  ];
  if (snapshot.pricesAsOf !== undefined) {
    metaLines.push(`Prices updated: ${snapshot.pricesAsOf.slice(0, 16).replace('T', ' ')} UTC`);
  }
  if (snapshot.ruleVersion !== undefined) {
    metaLines.push(`Rule version: ${snapshot.ruleVersion}`);
  }
  metaLines.push(`Data questions: ${DATA_CONTACT_URL}`);

  const sections: DocSection[] = [];

  // Verdicts — the precomputed summary lines (the hero's own words).
  sections.push({
    key: 'verdicts',
    heading: 'Summary verdicts',
    headers: ['region', 'label', 'warnings', 'voting', 'excluded'],
    rows: [
      ['Global', snapshot.summary.global.label, snapshot.summary.global.warningCount, snapshot.summary.global.votingCount, snapshot.summary.global.excludedCount],
      ['Australia', snapshot.summary.australia.label, snapshot.summary.australia.warningCount, snapshot.summary.australia.votingCount, snapshot.summary.australia.excludedCount],
    ],
    digits: 0,
  });

  // Prices — the registry's prices-board rows with their peaks (defect E-24).
  const priceRows = snapshot.readings
    .filter((r) => DEFINITION_BY_ID.get(r.id)?.group === 'prices-board')
    .map((r) => [
      r.id,
      titleOf(r.id),
      r.value,
      unitOf(r.id),
      r.status,
      r.change7d ?? null,
      r.change30d ?? null,
      r.percentile10y ?? null,
      r.fromPeak10y ?? null,
      r.peak?.value ?? null,
      r.peak?.date ?? null,
      r.peak?.basis ?? null,
      r.asOf,
      r.sourceName,
    ]);
  sections.push({
    key: 'prices',
    heading: 'Prices',
    headers: [
      'id', 'name', 'value', 'unit', 'status', 'change7d', 'change30d',
      'percentile10y', 'fromPeak10y', 'peakValue', 'peakDate', 'peakBasis', 'dataDate', 'sourceName',
    ],
    rows: priceRows,
    digits: 6,
  });

  // World stock markets — the table's worst-first order (E-18/E-22 ride the
  // STORED trend/status tokens; the words themselves are the page's copy).
  if (markets !== null) {
    const worstFirst = [...markets.markets].sort((a, b) => a.fromHigh - b.fromHigh);
    sections.push({
      key: 'markets',
      heading: 'World stock markets',
      headers: [
        'id', 'asOf', 'close', 'chg1d', 'chg1m', 'chg3m', 'fromHigh',
        'high52w', 'low52w', 'trend', 'status', 'source', 'stale',
      ],
      rows: worstFirst.map((m: MarketEntry) => [
        m.id, m.asOf, m.close, m.chg1d, m.chg1m ?? null, m.chg3m, m.fromHigh,
        m.high52w, m.low52w, m.trend, m.status, m.source, m.stale,
      ]),
      digits: 2,
    });
  }

  // World currencies — the table's group order.
  if (fx !== null) {
    const byId = new Map(fx.pairs.map((p) => [p.id as string, p]));
    const rows: (string | number | boolean | null)[][] = [];
    for (const group of FX_GROUP_ORDER) {
      for (const def of FX_PAIRS.filter((p) => p.group === group)) {
        const entry = byId.get(def.id);
        if (entry === undefined) continue; // never-populated row: absent, never zero
        rows.push([
          entry.id,
          entry.asOf,
          entry.rate,
          entry.chg.d1,
          entry.chg.m1,
          entry.chg.m3,
          entry.chg.y1,
          entry.moveRank,
          entry.bigMove,
          entry.source,
          entry.stale,
        ]);
      }
    }
    sections.push({
      key: 'fx',
      heading: 'World currencies',
      headers: ['id', 'asOf', 'rate', 'chg1d', 'chg1m', 'chg3m', 'chg1y', 'moveRank', 'bigMove', 'source', 'stale'],
      rows,
      digits: 6,
    });
  }

  // Together — the connection cards (states + legs in the canonical tokens).
  const connections = evaluateConnections(snapshot.readings);
  const connectionRows = connections.map((c) => [
    c.connection,
    c.state,
    c.legs
      .map((leg) => `${leg.id}:${leg.direction ?? 'unknown'}(${leg.move ?? '-'} @ ${leg.moveWindow ?? '-'}d, ${leg.role})`)
      .join(' · '),
    c.passThrough === undefined ? null : `${c.passThrough.decisionDate}: ${c.passThrough.decisionPoints} pts → ${c.passThrough.loanPoints} pts`,
  ]);
  if (connectionRows.length > 0) {
    sections.push({
      key: 'connections',
      heading: 'Together',
      headers: ['connection', 'state', 'legs', 'passThrough'],
      rows: connectionRows,
      digits: 6,
    });
  }

  // Signals — the metal condition checklists.
  const { gold, silver } = evaluateSignals(snapshot.readings);
  const signalRows = [gold, silver].map((s) => [
    s.metal,
    s.lean,
    `${s.metCount}/${s.conditions.length}`,
    s.conditions.map((c) => `${c.key}:${c.state}`).join(' · '),
  ]);
  if (signalRows.length > 0) {
    sections.push({
      key: 'signals',
      heading: 'Signals',
      headers: ['metal', 'lean', 'conditionsMet', 'conditions'],
      rows: signalRows,
      digits: 0,
    });
  }

  // Indicators — every reading plus the E-23 audit columns.
  sections.push({
    key: 'indicators',
    heading: 'Indicators',
    headers: [
      'id', 'title', 'value', 'unit', 'status', 'dataDate', 'publishedDate', 'stale',
      'fetchedAt', 'sourceName', 'sourceUrl', 'licenceName', 'level', 'ownerAccepts',
      'enabled', 'peakValue', 'peakDate', 'peakBasis', 'ruleVersion', 'rule',
    ],
    rows: snapshot.readings.map((r) => {
      const audit = INDICATOR_AUDIT_BY_ID.get(r.id);
      return [
        r.id,
        titleOf(r.id),
        r.value,
        unitOf(r.id),
        r.status,
        r.asOf,
        r.releaseDate ?? null,
        staleFlagOf(r, nowDay),
        r.updatedAt,
        r.sourceName,
        r.sourceUrl ?? null,
        audit?.licenceName ?? null,
        audit?.level ?? null,
        ownerAcceptsCell(audit),
        enabledCell(audit),
        r.peak?.value ?? null,
        r.peak?.date ?? null,
        r.peak?.basis ?? null,
        audit?.ruleVersion ?? null,
        // The rule rides VERBATIM — the sidecar's raw JSON string.
        audit?.rule ?? null,
      ];
    }),
    digits: 6,
  });

  // Upcoming key dates.
  if (snapshot.calendar.length > 0) {
    sections.push({
      key: 'calendar',
      heading: 'Upcoming key dates',
      headers: ['id', 'date', 'title', 'kind'],
      rows: snapshot.calendar.map((e) => [e.id, e.date, e.titleEn, e.kind]),
      digits: 0,
    });
  }

  // Changed this week.
  if (snapshot.changedThisWeek.length > 0) {
    sections.push({
      key: 'changed',
      heading: 'Changed this week',
      headers: ['id', 'from', 'to', 'dataDate'],
      rows: snapshot.changedThisWeek.map((c) => [c.id, c.from, c.to, c.asOf]),
      digits: 0,
    });
  }

  return { heading: 'Currena Insights', metaLines, sections };
}

/* ------------------------------------------------------------------ *
 * Renderer: Markdown
 * ------------------------------------------------------------------ */

function mdCell(value: string | number | boolean | null, digits: number): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const s = typeof value === 'number' ? asciiNumber(value, digits) : value;
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function renderExportMarkdown(doc: ExportDoc): string {
  const out: string[] = [`# ${doc.heading}`, ''];
  for (const line of doc.metaLines) out.push(`- ${line}`);
  out.push('');
  for (const section of doc.sections) {
    out.push(`## ${section.heading}`, '');
    if (section.rows.length === 0) continue;
    out.push(`| ${section.headers.map((h) => mdCell(h, 0)).join(' | ')} |`);
    out.push(`| ${section.headers.map(() => '---').join(' | ')} |`);
    for (const row of section.rows) {
      out.push(`| ${row.map((cell) => mdCell(cell ?? null, section.digits)).join(' | ')} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Renderer: CSV — one dense block per section (the page's own tables),
 * RFC 4180 CRLF, UTF-8 **with BOM** (the web export's owner finding:
 * Excel on every locale must decode the file), OWASP formula-injection
 * guard on every free-text cell.
 * ------------------------------------------------------------------ */

function csvText(field: string): string {
  return csvEscapeField(csvNeutralizeFormula(field));
}

function csvCell(value: string | number | boolean | null, digits: number): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return asciiNumber(value, digits);
  return csvText(value);
}

export function renderExportCsv(doc: ExportDoc): string {
  const lines: string[] = [`\uFEFF${csvText(doc.heading)}`];
  for (const line of doc.metaLines) lines.push(csvText(line));
  for (const section of doc.sections) {
    if (section.rows.length === 0) continue;
    lines.push('');
    lines.push(csvText(section.heading));
    lines.push(section.headers.map(csvText).join(','));
    for (const row of section.rows) {
      lines.push(row.map((cell) => csvCell(cell ?? null, section.digits)).join(','));
    }
  }
  return `${lines.join('\r\n')}\r\n`;
}

/** The download filename (the web export's convention). */
export function insightsExportFilename(generatedAt: string, format: ExportFormat): string {
  return `currena-insights-full-${generatedAt.slice(0, 10)}.${format}`;
}
