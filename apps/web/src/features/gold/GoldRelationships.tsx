/**
 * GoldRelationships — the relationship explorer (GUX-S6 M1, 12 §5.1–5.4
 * over 10 §5's record contract): the advanced map of how gold's forces
 * connect — 23 canvas records + 1 legend-only blocked record (R-26),
 * rendering ONLY the verified records of 10 §3.
 *
 * THE CONTRACT (12 §5, binding):
 *   §5.1 LIST-FIRST EVERYWHERE — the list is the primary surface on
 *   every viewport (the accessibility guarantee: every record findable
 *   without the canvas); the CANVAS is a desktop ≥lg opt-in toggle
 *   (a pan/zoom graph at 390px is legal but never the only path — the
 *   master plan's §7.1 progressive-disclosure rule). Mobile gets the
 *   list only (no canvas toggle below lg — the honest small-screen
 *   cut, not a shrunken graph).
 *   §5.2 THE EDGE GRAMMAR — the class is ALWAYS visible (shape + dash
 *   + label, never hue alone): M solid · C dashed · X the flag token ·
 *   K the heaviest stroke + the evidence tag. The X pennant renders
 *   as a REAL, same-size token on the row and the edge — "conditions
 *   apply" is never fine print (10 §5's own rule). The blocked edge
 *   (R-26) renders in the LEGEND ONLY — a muted row, never a canvas
 *   edge (a drawn edge would imply charted evidence).
 *   §5.3 THE HONESTY FOOTER — the meter's own measured record rides
 *   the explorer's foot (both locales): no directional edge in the
 *   37-voter table; sign-agreements 46.8/42.2/32.7% at 5/20/60 trading
 *   days — the standing anchor so no visitor mistakes the map of
 *   conventional thinking for a proven system. It reuses the honest
 *   record's OWN dictionary sentences (one wording, one page).
 *   §5.4 THE WORD FIDELITY — every row's accessible name is
 *   "«A» to «B»: «class word». «the one-liner». «conditions apply»."
 *   The one-liners are the rows' FULL text (10 §5's copy rule);
 *   anything longer opens the linked indicator record — the row's
 *   concept chips are the existing cross-page anchors (#gold-seats
 *   lanes, card anchors), never new surfaces.
 *
 * THE CHARTING RULE (10 §5 clause 4): NO edge draws history — the
 * only charted relationship on the page remains the correlation
 * companion (R-01's pre-registered windows, Zone K); this explorer
 * renders structure, never unverified charts.
 *
 * Budget note: the one-liners live in the record module (this chunk)
 * per the 12 §5 contract — they are the edge labels' full text, the
 * explorer's content of record (NOT deep-tier content; 10 §3 authored
 * them for exactly this surface).
 */

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { GOLD_RELATIONSHIPS, type GoldRelationshipRecord, type RelationshipClass } from './gold-relationships';
import { LANE_BAR_LABEL_KEY } from './LaneBar';
import { VOTER_NAME_KEY } from './GoldSeats';

/* ------------------------------------------------------------------ *
 * The concept labels (10 §5's node contract): an indicator id → the
 * page's own seat/context names; a lane id → the lane labels; the
 * named concepts → their two dictionary words. No new vocabulary —
 * every label is a surface the page already renders.
 * ------------------------------------------------------------------ */

const CONCEPT_KEY: Readonly<Record<string, TranslationKey>> = {
  gold: 'pd.gold.relNodeGold',
  inflation: 'pd.gold.relNodeInflation',
  'wgc-cb-demand': 'pd.gold.relNodeCbDemand',
  'wgc-etf-holdings': 'pd.gold.relNodeEtfFlows',
} as const;

/** A concept's display label + its in-page anchor (the cross-page
 *  contract: voters → their lane's seat cards; lanes → the lane
 *  section; context ids → the card anchors; concepts → null). */
function useConceptLabels(): (id: string) => { label: string; href: string | null } {
  const { t } = useI18n();
  return (id: string) => {
    const conceptKey = CONCEPT_KEY[id];
    if (conceptKey !== undefined) return { label: t(conceptKey), href: id === 'inflation' ? '#lane-inflation' : null };
    if (id === 'borrowing-costs') return { label: t(LANE_BAR_LABEL_KEY['borrowing-costs']), href: '#lane-borrowing-costs' };
    const voterKey = (VOTER_NAME_KEY as Readonly<Record<string, TranslationKey>>)[id];
    if (voterKey !== undefined) return { label: t(voterKey), href: '#gold-seats' };
    return { label: id, href: null };
  };
}

/* The class chip: the letter + the word, always visible (12 §5.2). */
const CLASS_CHIP_KEY: Readonly<Record<RelationshipClass, TranslationKey>> = {
  M: 'pd.gold.relClassM',
  C: 'pd.gold.relClassC',
  X: 'pd.gold.relClassX',
  K: 'pd.gold.relClassK',
};

/* The class word tone — analytical inks, never market hues (the class
 * is an evidence statement, not a direction). */
const CLASS_CHIP_TONE: Readonly<Record<RelationshipClass, string>> = {
  M: 'ring-[var(--color-text-secondary)]/50 text-[var(--color-text-secondary)]',
  C: 'ring-[var(--color-text-secondary)]/40 text-[var(--color-text-secondary)]',
  X: 'ring-[var(--color-status-watch)]/60 text-[var(--color-status-watch)]',
  K: 'ring-[var(--color-accent-gold)]/60 text-[var(--color-text-primary)]',
};

/* ------------------------------------------------------------------ *
 * One relationship row (the list's unit — the primary surface)
 * ------------------------------------------------------------------ */

function RelationshipRow({ record }: { record: GoldRelationshipRecord }): React.JSX.Element {
  const { t, locale } = useI18n();
  const concept = useConceptLabels();
  const a = concept(record.from).label;
  const b = concept(record.to).label;
  const oneLiner = locale === 'fa' ? record.fa : record.en;
  const classWord = t(CLASS_CHIP_KEY[record.class]);
  const ariaName = `${a} — ${b}: ${classWord}. ${oneLiner}${record.xFlag ? ` ${t('pd.gold.relConditionsApply')}` : ''}`;

  return (
    <li
      className="m-0 flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
      data-rel-row={record.id}
      data-rel-class={record.class}
      data-rel-xflag={record.xFlag ? 'true' : undefined}
      aria-label={ariaName}
    >
      {/* The two concepts + the class chip — the row's header line. */}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]" data-rel-a={record.from}>
          {a}
        </span>
        <span aria-hidden="true" className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">↔</span>
        <span className="min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]" data-rel-b={record.to}>
          {b}
        </span>
        <span
          className={`ms-auto inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[length:var(--type-caption)] font-bold ring-1 ${CLASS_CHIP_TONE[record.class]}`}
          data-rel-class-chip
        >
          {classWord}
        </span>
      </div>
      {/* The one-liner — the row's FULL text (10 §5's copy rule). */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]" data-rel-oneliner>
        {oneLiner}
      </p>
      {/* The X pennant — a real, same-size token, never fine print
       * (10 §5 clause 3 / 12 §5.2: amber ink, same type size). */}
      {record.xFlag ? (
        <p
          className="m-0 inline-flex w-fit items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-status-watch)]/10 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-status-watch)] ring-1 ring-[var(--color-status-watch)]/40"
          data-rel-x-pennant
        >
          <span aria-hidden="true">⚑</span>
          {t('pd.gold.relConditionsApply')}
        </p>
      ) : null}
    </li>
  );
}

/** The concept label read OUTSIDE a component (the canvas's aria joins
 *  resolve through the same hook inside the component tree; the canvas
 *  itself is aria-hidden with the list as the SR path — 12 §5.4). */

/* ------------------------------------------------------------------ *
 * The canvas (desktop ≥lg, behind the toggle) — a static radial
 * arrangement: gold hub + the five lane clusters + the outer-ring
 * market-structure nodes, edges per the record set. NO pan/zoom
 * dependency: the shipped interaction grammar for this surface is the
 * LIST (the accessibility guarantee); the canvas is a structural
 * reading aid whose rows carry the same content.
 * ------------------------------------------------------------------ */

/** The canvas node positions (a fixed radial layout, viewBox units). */
interface CanvasNode {
  id: string;
  x: number;
  y: number;
}

const CANVAS_NODES: readonly CanvasNode[] = [
  { id: 'gold', x: 360, y: 250 },
  // The five lane clusters (the upper arc) — one representative node per
  // lane + the lane hubs the records name (inflation, borrowing-costs).
  { id: 'borrowing-costs', x: 150, y: 110 },
  { id: 'real-yield-10y', x: 80, y: 60 },
  { id: 'us10y', x: 150, y: 30 },
  { id: 'term-premium-10y', x: 230, y: 60 },
  { id: 'dollar-basket', x: 360, y: 60 },
  { id: 'stress-stlfsi', x: 510, y: 70 },
  { id: 'gpr-daily', x: 600, y: 120 },
  { id: 'inflation', x: 640, y: 250 },
  { id: 'us-cpi-yoy', x: 660, y: 170 },
  { id: 'm2-us', x: 660, y: 330 },
  { id: 'michigan-1y-expectations', x: 590, y: 400 },
  { id: 'cftc-gold-positioning', x: 80, y: 250 },
  // The structural/chain nodes (the lower arc).
  { id: 'fed-expectations', x: 110, y: 400 },
  { id: 'usdjpy', x: 220, y: 450 },
  { id: 'usd-reserve-share', x: 420, y: 450 },
  { id: 'wgc-cb-demand', x: 470, y: 340 },
  // The market-structure outer ring.
  { id: 'gold-btc', x: 620, y: 30 },
  { id: 'gold-oil-ratio', x: 700, y: 100 },
  { id: 'gold-silver', x: 260, y: 120 },
  { id: 'copper-gold', x: 660, y: 460 },
  { id: 'gold-equities-ratio', x: 320, y: 500 },
  { id: 'gold-aud', x: 200, y: 210 },
  { id: 'shanghai-gold-premium', x: 140, y: 500 },
];

function canvasNodeOf(id: string): CanvasNode | undefined {
  return CANVAS_NODES.find((n) => n.id === id);
}

/** The class → the edge stroke (12 §5.2's grammar: M solid · C dashed ·
 *  X the flag token · K heaviest — never hue alone). */
function edgeStrokeOf(record: GoldRelationshipRecord): { dash: string; width: number } {
  switch (record.class) {
    case 'M':
      return { dash: 'none', width: 2 };
    case 'C':
      return { dash: '4 3', width: 2 };
    case 'X':
      return { dash: 'none', width: 2 };
    case 'K':
      return { dash: 'none', width: 3.5 };
  }
}

function RelationshipCanvas(): React.JSX.Element {
  const { t } = useI18n();
  const concept = useConceptLabels();
  const edges = useMemo(() => {
    const drawn: Array<{ record: GoldRelationshipRecord; from: CanvasNode; to: CanvasNode }> = [];
    for (const record of GOLD_RELATIONSHIPS) {
      if (record.blocked) continue; // the legend-only edge, never drawn
      const a = canvasNodeOf(record.from);
      const b = canvasNodeOf(record.to);
      if (a !== undefined && b !== undefined) drawn.push({ record, from: a, to: b });
    }
    return drawn;
  }, []);

  return (
    <div dir="ltr" role="img" aria-label={t('pd.gold.relCanvasAria')} data-rel-canvas className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 ring-1 ring-[var(--color-border)]">
      <svg viewBox="0 0 760 540" className="h-auto w-full min-w-[560px]" aria-hidden="true">
        {/* The edges. */}
        {edges.map(({ record, from, to }) => {
          const stroke = edgeStrokeOf(record);
          return (
            <g key={record.id} data-rel-edge={record.id} data-rel-edge-class={record.class}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--color-text-tertiary)"
                strokeWidth={stroke.width}
                strokeDasharray={stroke.dash === 'none' ? undefined : stroke.dash}
                opacity={record.class === 'K' ? 0.9 : 0.6}
              />
              {/* The X pennant at the edge's midpoint — a real token,
               * never fine print (12 §5.2). */}
              {record.xFlag ? (
                <g>
                  <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2 - 7} r="8" fill="var(--color-status-watch)" opacity="0.18" />
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 3.5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--color-status-watch)"
                  >
                    ⚑
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        {/* The nodes: the gold hub wears the accent gold; the rest are
         * surface circles with the concept labels beside them. */}
        {CANVAS_NODES.map((node) => (
          <g key={node.id} data-rel-node={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.id === 'gold' ? 14 : 9}
              fill={node.id === 'gold' ? 'var(--color-accent-gold)' : 'var(--color-surface)'}
              stroke={node.id === 'gold' ? 'var(--color-accent-gold-strong)' : 'var(--color-text-tertiary)'}
              strokeWidth={node.id === 'gold' ? 2.5 : 1.5}
            />
            <text
              x={node.x}
              y={node.y - (node.id === 'gold' ? 20 : 16)}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--color-text-secondary)"
            >
              {concept(node.id).label}
            </text>
          </g>
        ))}
      </svg>
      <span className="sr-only">{t('pd.gold.relCanvasNote')}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The explorer section
 * ------------------------------------------------------------------ */

/** The lane filter options (all + the four classes — 12 §5.1's "filter
 *  by class" list panel). */
type RelFilter = 'all' | RelationshipClass;

const FILTER_OPTIONS: ReadonlyArray<{ id: RelFilter; key: TranslationKey }> = [
  { id: 'all', key: 'pd.gold.relFilterAll' },
  { id: 'M', key: 'pd.gold.relClassM' },
  { id: 'C', key: 'pd.gold.relClassC' },
  { id: 'X', key: 'pd.gold.relClassX' },
  { id: 'K', key: 'pd.gold.relClassK' },
];

export function GoldRelationships(): React.JSX.Element {
  const { t } = useI18n();
  const [filter, setFilter] = useState<RelFilter>('all');
  const [canvasOpen, setCanvasOpen] = useState(false);

  const rows = useMemo(
    () => (filter === 'all' ? GOLD_RELATIONSHIPS : GOLD_RELATIONSHIPS.filter((r) => r.class === filter)),
    [filter],
  );

  return (
    <section id="gold-relationships" aria-label={t('pd.gold.relAria')} data-gold-relationships className="mt-3 flex min-w-0 scroll-mt-24 flex-col gap-2.5 sm:mt-5">
      <h2 className="m-0 text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg">{t('pd.gold.relTitle')}</h2>
      <p className="m-0 max-w-prose text-[length:var(--type-label)] leading-snug text-[var(--color-text-secondary)]">{t('pd.gold.relIntro')}</p>

      {/* The class filter chips (12 §5.1's filter panel). */}
      <div className="flex min-w-0 flex-wrap items-center gap-1.5" role="group" aria-label={t('pd.gold.relFilterAria')} data-rel-filters>
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              aria-pressed={active}
              data-rel-filter={opt.id}
              className={`insights-focusable inline-flex min-h-[36px] cursor-pointer items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[length:var(--type-caption)] font-semibold ring-1 transition-colors ${
                active
                  ? 'bg-[var(--color-accent-gold)]/15 text-[var(--color-text-primary)] ring-[var(--color-accent-gold)]/45'
                  : 'bg-transparent text-[var(--color-text-secondary)] ring-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t(opt.key)}
            </button>
          );
        })}
      </div>

      {/* The canvas toggle — desktop ≥lg only (the list is the primary
       * surface everywhere; 12 §5.1's mobile list-first rule). */}
      <div className="hidden lg:block">
        <button
          type="button"
          onClick={() => setCanvasOpen((v) => !v)}
          aria-expanded={canvasOpen}
          data-rel-canvas-toggle
          className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ChevronDown aria-hidden size={16} className={canvasOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          {t('pd.gold.relCanvasToggle')}
        </button>
        {canvasOpen ? <RelationshipCanvas /> : null}
      </div>

      {/* The list — the primary surface, every record findable. */}
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 lg:grid-cols-2" data-rel-list>
        {rows.map((record) => (
          <RelationshipRow key={record.id} record={record} />
        ))}
      </ul>

      {/* The legend: the class grammar + the blocked edge + the
       * excluded-claims pointer (12 §5.2/§5.3). */}
      <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-currena-soft/40 p-3 ring-1 ring-[var(--color-border)]/60" data-rel-legend>
        <h3 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">{t('pd.gold.relLegendTitle')}</h3>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
          <li className="m-0" data-rel-legend-class="M">{t('pd.gold.relLegendM')}</li>
          <li className="m-0" data-rel-legend-class="C">{t('pd.gold.relLegendC')}</li>
          <li className="m-0" data-rel-legend-class="X">{t('pd.gold.relLegendX')}</li>
          <li className="m-0" data-rel-legend-class="K">{t('pd.gold.relLegendK')}</li>
          {/* The blocked edge — legend-only, muted (12 §5.2). */}
          <li className="m-0 text-[var(--color-text-tertiary)]" data-rel-legend-blocked>
            {t('pd.gold.relLegendBlocked')}
          </li>
        </ul>
      </div>

      {/* The honesty footer (12 §5.3): the meter's own measured record,
       * verbatim — the same sentences the honest record renders. */}
      <footer className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-currena-soft/50 p-3 ring-1 ring-[var(--color-border)]/60" data-rel-honesty>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          {t('pd.gold.relHonestyNote')}
        </p>
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
          {t('pd.gold.noEdge')}
        </p>
      </footer>
    </section>
  );
}
