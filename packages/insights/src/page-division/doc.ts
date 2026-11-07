/**
 * The PLACEMENT.generated.md builder (S2, 2026-11-08).
 *
 * Renders the authoritative per-id placement table (spec §14: "generated
 * programmatically in build Session 2 from data/indicators.json + this
 * spec's rules, then committed as docs/page-division/
 * PLACEMENT.generated.md") from the placement module + the live registry.
 *
 * DETERMINISTIC BY DESIGN: no timestamps, no environment, no engine state
 * beyond the placement module's own imports — the same registry + the
 * same module always produce byte-identical output, which is what the
 * sync test (doc.test.ts) pins: the committed doc must equal the
 * regeneration, so an engine or registry change that moves a mirror or a
 * home surfaces as a visible diff, never as silent drift (Agent Rule 5).
 *
 * Drift is REPORTED, not fixed: the reconciliation section prints the
 * live verdict, and the audit findings (the spec's own hand-count
 * defects + any dynamic drift) are recorded in the doc itself.
 */

import type { PageDivisionPageId } from '@currena/core';
import { BLOCKED_NOTES, PAGE_PLACEMENTS, pageHomeIds, pageMirrorIds, PLACEMENT_AUDIT_FINDINGS, reconcilePlacement } from './placement';

/** The registry shape the builder reads (data/indicators.json's subset). */
export interface PlacementRegistryIndicator {
  id: string;
  title: string;
  area: { section: string; group: string };
}

export interface PlacementRegistry {
  version: number;
  indicators: readonly PlacementRegistryIndicator[];
}

/** The session stamp printed in the header (bumped per regenerating session). */
const DOC_SESSION_STAMP = '2026-11-08';

/** Board attachment labels (§14's boards, the four served). */
const BOARD_LABELS: Readonly<Record<string, string>> = {
  markets: 'World Markets board',
  'markets-au': 'AU Markets board',
  fx: 'FX board',
  tic: 'TIC board',
};

/** The fixed mirror-purpose sentence per page (the spec's own display rules). */
const MIRROR_PURPOSE: Readonly<Record<PageDivisionPageId, string>> = {
  global:
    'Verdict-board inputs (D-21): the five thematic gauges\u2019 voters, the gold meter\u2019s 37 voters (the Gold Balance tile + the dedollar tile\u2019s usd-reserve-share/nyfed-custody), and the ribbon\u2019s gold-usd + btc-usd (brent arrives as a prices-heat voter).',
  gold:
    'Seat-chip inputs (spec \u00a75.2): the gold meter\u2019s voters whose homes are elsewhere \u2014 each seat renders name \u00b7 lean \u00b7 evidence word, linking to the seat\u2019s home card.',
  'world-markets': '\u2014',
  usa: 'Verdict-strip inputs (D-30): the five thematic gauges\u2019 non-USA voters \u2014 the same computed verdicts as Global, US-framed copy.',
  europe: '\u2014',
  'asia-pacific': '\u2014',
  australia:
    'Seat-chip inputs (spec \u00a710): the AU gauges\u2019 moved-out members (D-32/D-35/D-42) \u2014 the chips remain in the gauges, linking to the new homes.',
  commodities: '\u2014',
  currencies: '\u2014',
};

/** `gold` → "14 + 4 blocked" for the summary table's count column. */
function cardCountLabel(page: PageDivisionPageId): string {
  const homes = pageHomeIds(page).length;
  const blocked = BLOCKED_NOTES.filter((n) => n.page === page).length;
  return blocked > 0 ? `${homes} + ${blocked} blocked` : `${homes}`;
}

/** md-escape a title's pipes (registry titles are plain prose; belt and braces). */
const esc = (s: string): string => s.replaceAll('|', '\\|');

/**
 * Build the full PLACEMENT.generated.md content. Pure: same registry +
 * same placement module → byte-identical string.
 */
export function buildPlacementMarkdown(registry: PlacementRegistry): string {
  const byId = new Map<string, PlacementRegistryIndicator>(registry.indicators.map((i) => [i.id, i]));
  const title = (id: string): string => byId.get(id)?.title ?? '—';
  const area = (id: string): string => {
    const ind = byId.get(id);
    return ind === undefined ? '—' : `${ind.area.section}/${ind.area.group}`;
  };

  // The home map (blocked notes included — they are placements too).
  const homeOf = new Map<string, PageDivisionPageId>();
  for (const p of PAGE_PLACEMENTS) for (const id of pageHomeIds(p.page)) homeOf.set(id, p.page);
  for (const n of BLOCKED_NOTES) homeOf.set(n.id, n.page);

  const rec = reconcilePlacement(registry.indicators.map((i) => i.id));

  const lines: string[] = [];
  const w = (s = ''): void => {
    lines.push(s);
  };

  w('# Page-division placement — the authoritative table (GENERATED)');
  w();
  w('> **Generated file — do not edit by hand.** Regenerate with `pnpm placement:generate`');
  w('> (scripts/generate-placement-table.ts) from `data/indicators.json` v' + registry.version +
    ' + the spec \u00a714 rules encoded in `packages/insights/src/page-division/placement.ts` (the mirror sets derive from the engine\u2019s own tables — GAUGES + GOLD_LANE_VOTERS — so this table cannot drift from the engine silently).');
  w('> Page-division Session 2/30 \u00b7 ' + DOC_SESSION_STAMP + ' \u00b7 drift is recorded as audit findings below, never silently fixed (AGENT-RULES.md \u00a75).');
  w();

  /* ------------------------- reconciliation ------------------------- */
  w('## Reconciliation — 184 ids + 6 boards');
  w();
  w('| Check | Result |');
  w('|---|---|');
  w('| Registry ids (`data/indicators.json` v' + registry.version + ') | ' + registry.indicators.length + ' |');
  w('| Placed (one home each — blocked notes included) | ' + rec.placedCount + ' |');
  w('| Unplaced | ' + rec.unplaced.length + (rec.unplaced.length === 0 ? '' : ' \u2014 ' + rec.unplaced.join(', ')) + ' |');
  w('| Duplicate homes | ' + rec.duplicateHomes.length + (rec.duplicateHomes.length === 0 ? '' : ' \u2014 ' + rec.duplicateHomes.join(', ')) + ' |');
  w('| Unknown ids (placement \u2216 registry) | ' + rec.unknownIds.length + (rec.unknownIds.length === 0 ? '' : ' \u2014 ' + rec.unknownIds.join(', ')) + ' |');
  w('| Mirror/home overlaps | ' + rec.mirrorOverlaps.length + (rec.mirrorOverlaps.length === 0 ? '' : ' \u2014 ' + rec.mirrorOverlaps.join(', ')) + ' |');
  w('| Boards | 6 \u2014 4 served + the Prices live overlay + Companies (flag OFF) |');
  w();
  w(rec.ok ? '**Verdict: reconciles** \u2014 zero unplaced, zero duplicate homes. The spec\u2019s own hand-count drift is recorded as the audit findings AF-1\u2026AF-' + PLACEMENT_AUDIT_FINDINGS.length + ' below.' : '**Verdict: STRUCTURAL DRIFT \u2014 see the table above. This is an audit finding, not a silent fix; the generator exited non-zero.**');
  w();
  w('| Page | Route | Registry cards | Mirror inputs | Boards | Decisions |');
  w('|---|---|---|---|---|---|');
  for (const p of PAGE_PLACEMENTS) {
    const boards = p.boards.length === 0 ? '\u2014' : p.boards.map((b) => BOARD_LABELS[b] ?? b).join(' \u00b7 ');
    w('| ' + p.page + ' | `/' + (p.page === 'global' ? '' : p.page) + '` | ' + cardCountLabel(p.page) + ' | ' + p.mirrors.length + ' | ' + boards + ' | ' + p.decisions + ' |');
  }
  w();
  const countSum = PAGE_PLACEMENTS.map((p) => cardCountLabel(p.page)).join(' + ');
  w('Count check: ' + countSum + ' = **' + rec.placedCount + ' registry ids placed** (+ ' + rec.unplaced.length + ' unplaced). Dual-membership ids keep ONE home each (spec \u00a714); engine membership is untouched (spec \u00a73.3).');
  w();

  /* ----------------------- per-page membership ----------------------- */
  w('## Per-page membership');
  w();
  for (const p of PAGE_PLACEMENTS) {
    const homes = pageHomeIds(p.page);
    const blocked = BLOCKED_NOTES.filter((n) => n.page === p.page);
    const mirrors = pageMirrorIds(p.page);
    const route = p.page === 'global' ? '/' : '/' + p.page;
    w('### ' + p.page + ' \u2014 `' + route + '`');
    w();
    w('> ' + homes.length + ' registry cards' + (blocked.length > 0 ? ' + ' + blocked.length + ' blocked notes' : '') +
      ' \u00b7 ' + mirrors.length + ' mirror inputs \u00b7 boards: ' + (p.boards.length === 0 ? 'none' : p.boards.map((b) => BOARD_LABELS[b] ?? b).join(' \u00b7 ')) + ' \u00b7 ' + p.decisions);
    w();
    if (homes.length > 0) {
      w('| id | title | registry area | group | role |');
      w('|---|---|---|---|---|');
      for (const g of p.groups) {
        for (const id of g.ids) {
          w('| `' + id + '` | ' + esc(title(id)) + ' | ' + area(id) + ' | ' + g.id + ' | home |');
        }
      }
      for (const n of blocked) {
        w('| `' + n.id + '` | ' + esc(title(n.id)) + ' | ' + area(n.id) + ' | blocked-notes | blocked-note \u2014 ' + esc(n.why) + ' |');
      }
      w();
    } else {
      w('Zero registry cards by design (verdict board only, D-7/D-11 \u2014 every tile is a display of an engine value, linking out).');
      w();
    }
    if (mirrors.length > 0) {
      w('**Mirror inputs (' + mirrors.length + ')** \u2014 ' + MIRROR_PURPOSE[p.page]);
      w();
      w('| id | title | registry area | home page |');
      w('|---|---|---|---|');
      for (const id of mirrors) {
        w('| `' + id + '` | ' + esc(title(id)) + ' | ' + area(id) + ' | ' + (homeOf.get(id) ?? '?') + ' |');
      }
      w();
    }
    const notes = p.groups.filter((g) => g.note !== undefined);
    if (notes.length > 0) {
      w('Group notes:');
      for (const g of notes) w('- **' + g.id + '** \u2014 ' + g.note);
      w();
    }
  }

  /* ------------------------------ boards ------------------------------ */
  w('## Boards (spec \u00a714\u2019s boards line)');
  w();
  w('| Board | Rows | Home / feeds | Endpoint |');
  w('|---|---|---|---|');
  w('| FX board | 10 pairs + 7 rule lights (R1\u2013R7) | `/currencies` (the 11th pair AUDNZD joins at S18, D-42) | `GET /api/insights/fx` |');
  w('| World Markets board | 16 indexes | `/world-markets` \u00b7 zoom maps on USA / Europe / Asia & Pacific (D-44) \u00b7 the Global World-Markets tile | `GET /api/insights/markets` |');
  w('| AU Markets board | 19 symbols | `/australia` | `GET /api/insights/markets-au` |');
  w('| Prices live board | 4 assets + companion ratios | the serve-time merge \u2192 Global ribbon (D-22) \u00b7 Gold hero \u00b7 Commodities live | rides `GET /api/insights` + `GET /api/insights/pages/:page` |');
  w('| TIC board | 21 foreign holders | `/usa` (D-31, "who finances America") | `GET /api/insights/tic` |');
  w('| Companies board | 49 | PARKED \u2014 feature-flag OFF (spec \u00a716, EODHD free quota) | \u2014 |');
  w();

  /* --------------------------- audit findings --------------------------- */
  w('## Audit findings (drift \u2014 recorded, never silently fixed)');
  w();
  for (const f of PLACEMENT_AUDIT_FINDINGS) {
    w('- **' + f.id + ' (' + f.severity + ')** \u2014 ' + f.text);
  }
  w();
  if (!rec.ok) {
    w('- **AF-RUNTIME (red)** \u2014 dynamic drift at generation time: unplaced `' + rec.unplaced.join('`, `') +
      '`; unknown `' + rec.unknownIds.join('`, `') + '`; duplicates `' + rec.duplicateHomes.join('`, `') +
      '`; mirror overlaps `' + rec.mirrorOverlaps.join('`, `') + '`. The generator exited non-zero.');
    w();
  }
  w('---');
  w();
  w('*End of generated file. Regeneration re-derives everything from `data/indicators.json` + `packages/insights/src/page-division/placement.ts`; the sync test (`packages/insights/src/page-division/doc.test.ts`) fails if this committed file drifts from the module.*');
  w();
  return lines.join('\n');
}
