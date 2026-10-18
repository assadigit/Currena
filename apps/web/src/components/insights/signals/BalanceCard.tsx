/**
 * signals/BalanceCard — the gold/silver balance card (owner spec
 * docs/insights/gold-card/, "Balance Rework"). ONE template rendered per
 * asset behind the Gold | Silver segmented control; the pure rules live
 * in @currena/insights (computeLean) and ./balance-card-model.
 *
 * Anatomy, top to bottom (spec 01, final):
 *   A. header — segmented control (role=tablist, arrows, aria-selected)
 *      + "Updated {ago} · {n} sources" meta
 *   B. verdict — the largest text in the card + the confidence subline
 *   C. beam — hairline beam on a small pivot over a dotted level line;
 *      one token per supporting/pressuring driver stacked upward; heavier
 *      side lower; level + "Not enough readings to call" below 75%
 *      coverage; one 800ms settle on first reveal / asset switch
 *   D. neutral + unread bands — solid and dashed ghost chips (unread
 *      drivers are never hidden); a chip opens its row
 *   E. price context — the metal's own price, range phrase and 30-day
 *      change: context, never a weight (no state colour)
 *   F. factor rows — native details/summary, pressuring → supporting →
 *      neutral → unread, plain-language effect lines + expanded
 *      explanation, range bar and as-of
 *   G. flip line — one config-defined threshold, only with enough
 *      coverage and a real lean (hidden otherwise; never invented)
 *   H. footnote
 *
 * Reuses the page's own ink/surface/border tokens (02 rule 1); the state
 * hues are the spec's contrast-checked set scoped to .balance-card in
 * index.css. No new fetch, no KV read, no storage: the card reads what
 * the section already evaluated.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatDateWords, formatJalaliDate, formatNumber, formatRelative } from '@currena/core';
import { computeLean, type FactorState, type SignalReading } from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatChange, formatIndicatorValue, priceValueParts } from '../config';
import {
  beamGeometry,
  buildBalanceFactors,
  cardMeta,
  footingPhraseOf,
  orderFactors,
  TOKEN_W,
  type BalanceFactor,
} from './balance-card-model';

type AssetId = 'gold' | 'silver';
type NumberLocale = 'en-US' | 'fa-IR';

/* ------------------------------------------------------------------ *
 * State glyphs (spec 01 §Accessibility: an icon SHAPE + a word, never
 * colour alone; arrows and clocks never mirror in RTL)
 * ------------------------------------------------------------------ */

const STATE_ICON_PATHS: Record<FactorState, string> = {
  supports: 'M4 12 12 4M5 4h7v7',
  pressures: 'M4 4l8 8M5 12h7V5',
  neutral: 'M3 8h10',
  unread: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM8 5v3l2 1.5',
};

function StateIcon({ state, className }: { state: FactorState; className?: string }) {
  return (
    <svg
      className={`ic ${className ?? ''}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width={16}
      height={16}
    >
      <path d={STATE_ICON_PATHS[state]} />
    </svg>
  );
}

/** The token's arrow glyph (LTR text run; never mirrored). */
const STATE_ARROW: Record<FactorState, string> = {
  supports: '↗',
  pressures: '↘',
  neutral: '→',
  unread: '',
};

const stateWordClass: Record<FactorState, string> = {
  supports: 'gc-s-supports',
  pressures: 'gc-s-pressures',
  neutral: 'gc-s-neutral',
  unread: 'gc-s-unread',
};

/* ------------------------------------------------------------------ *
 * A. Header — the Gold | Silver segmented control + the meta line
 * ------------------------------------------------------------------ */

function SegmentedControl({
  asset,
  onAsset,
  copy,
  fa,
  idBase,
}: {
  asset: AssetId;
  onAsset: (a: AssetId) => void;
  copy: InsightsCopy;
  fa: boolean;
  idBase: string;
}) {
  const tabs: readonly AssetId[] = ['gold', 'silver'];
  const ref = useRef<HTMLDivElement>(null);

  // Roving tabindex: Arrow/Home/End move, the selected tab is the tab
  // stop (WAI-ARIA tablist; in RTL ArrowLeft is "forward").
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const i = tabs.indexOf(asset);
    const forward = fa ? 'ArrowLeft' : 'ArrowRight';
    const back = fa ? 'ArrowRight' : 'ArrowLeft';
    let next: number | null = null;
    if (e.key === forward || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
    else if (e.key === back || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onAsset(tabs[next]!);
    requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLButtonElement>(`[data-gc-tab="${tabs[next]}"]`)?.focus();
    });
  };

  return (
    <div
      ref={ref}
      className="gc-seg"
      role="tablist"
      aria-label={copy.signals.title}
      onKeyDown={onKeyDown}
      data-gc-seg
    >
      {tabs.map((t) => (
        <button
          key={t}
          id={`${idBase}-tab-${t}`}
          type="button"
          role="tab"
          data-gc-tab={t}
          aria-selected={asset === t}
          tabIndex={asset === t ? 0 : -1}
          aria-controls={`${idBase}-panel`}
          onClick={() => onAsset(t)}
        >
          {copy.signals.metals[t]}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * C. The beam (SVG; geometry from balance-card-model / spec 02)
 * ------------------------------------------------------------------ */

function BeamSvg({
  factors,
  tilt,
  fa,
  copy,
  numberLocale,
  replayKey,
  live,
  idBase,
}: {
  factors: readonly BalanceFactor[];
  tilt: number;
  fa: boolean;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  replayKey: string;
  live: boolean;
  idBase: string;
}) {
  const s = copy.signals.balanceCard;
  const supports = factors.filter((f) => f.state === 'supports');
  const pressures = factors.filter((f) => f.state === 'pressures');
  const unread = factors.filter((f) => f.state === 'unread');
  const dir: 1 | -1 = fa ? -1 : 1;
  const g = beamGeometry(supports.length, pressures.length, tilt, dir);
  const heavierIsPressures = tilt > 0;

  const valueText = (f: BalanceFactor): string | null => {
    const r = f.primary;
    if (r === null || r.value === null) return null;
    return formatIndicatorValue(r.id, r.value, numberLocale, copy.units);
  };

  // Heavier-side tokens ride DOWN by dy, the lighter side up (spec 02).
  const dyOf = (state: FactorState): number => {
    if (tilt === 0) return 0;
    const heavier = heavierIsPressures ? 'pressures' : 'supports';
    return state === heavier ? g.dy : -g.dy;
  };

  const tiltSentence = tilt > 0 ? s.tiltPressures : tilt < 0 ? s.tiltSupports : s.tiltLevel;
  const alt = interpolate(s.beamAlt, {
    s: formatNumber(supports.length, numberLocale, { maximumFractionDigits: 0 }),
    p: formatNumber(pressures.length, numberLocale, { maximumFractionDigits: 0 }),
    u: formatNumber(unread.length, numberLocale, { maximumFractionDigits: 0 }),
    tilt: tiltSentence,
  });

  const token = (f: BalanceFactor, i: number, x: number, cls: 'sup' | 'prs'): React.ReactNode => {
    const y = g.tokenY(i);
    const v = valueText(f);
    return (
      <g
        key={f.key}
        className={`gc-tok ${cls}`}
        data-gc-token={f.key}
        style={{ '--gc-dy': `${dyOf(f.state)}px` } as CSSProperties}
      >
        <rect className="gc-tok-rect" x={x - TOKEN_W / 2} y={y} width={TOKEN_W} height={44} rx={6} />
        <text className="gc-tok-name" x={x} y={y + 18}>
          {copy.signals.conditions[f.key].name}
        </text>
        {v !== null ? (
          <text className="gc-tok-val" x={x} y={y + 35} style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
            {STATE_ARROW[f.state]} {v}
          </text>
        ) : null}
      </g>
    );
  };

  const caption = (x: number, text: string, key: string): React.ReactNode => (
    <text key={key} className="gc-cap" x={x} y={g.captionY}>
      {text}
    </text>
  );

  return (
    <svg
      key={replayKey}
      className={`gc-svg ${live ? 'gc-live' : ''}`}
      viewBox={`0 0 ${g.width} ${g.height}`}
      role="img"
      aria-labelledby={`${idBase}-beam-title ${idBase}-beam-desc`}
      data-gc-beam
      data-gc-tilt={tilt}
    >
      <title id={`${idBase}-beam-title`}>{alt}</title>
      <desc id={`${idBase}-beam-desc`}>{tiltSentence}</desc>
      {/* The dotted level reference line. */}
      <line x1={24} y1={g.beamY} x2={656} y2={g.beamY} stroke="var(--gc-control)" strokeDasharray="2 4" />
      {/* The pivot: triangle + base, hairline weight. */}
      <path
        d={`M340 ${g.beamY + 5} L326 ${g.beamY + 30} L354 ${g.beamY + 30} Z`}
        fill="none"
        stroke="var(--gc-text-2)"
      />
      <line x1={340 - 44} y1={g.beamY + 30} x2={340 + 44} y2={g.beamY + 30} stroke="var(--gc-text-2)" />
      {/* The beam group: the one element that rotates. */}
      <g className="gc-beam" style={{ '--gc-rot': `${g.rotationDeg}deg`, '--gc-by': `${g.beamY}px` } as CSSProperties}>
        <line x1={340 - 240} y1={g.beamY} x2={340 + 240} y2={g.beamY} stroke="var(--gc-text)" strokeWidth={2} />
        <circle
          cx={g.xSupports}
          cy={g.beamY}
          r={5}
          fill={tilt < 0 ? 'var(--gc-supports)' : 'var(--gc-surface)'}
          stroke="var(--gc-supports)"
          strokeWidth={1.5}
        />
        <circle
          cx={g.xPressures}
          cy={g.beamY}
          r={5}
          fill={tilt > 0 ? 'var(--gc-pressures)' : 'var(--gc-surface)'}
          stroke="var(--gc-pressures)"
          strokeWidth={1.5}
        />
      </g>
      {/* The pivot ring sits over the beam. */}
      <circle cx={340} cy={g.beamY} r={5} fill="var(--gc-surface)" stroke="var(--gc-text)" strokeWidth={1.5} />
      {/* Tokens stacked upward from each end (nearest first). */}
      {supports.map((f, i) => token(f, i, g.xSupports, 'sup'))}
      {pressures.map((f, i) => token(f, i, g.xPressures, 'prs'))}
      {supports.length === 0 ? (
        <text className="gc-none" x={g.xSupports} y={g.emptyY}>
          {s.sideEmpty}
        </text>
      ) : null}
      {pressures.length === 0 ? (
        <text className="gc-none" x={g.xPressures} y={g.emptyY}>
          {s.sideEmpty}
        </text>
      ) : null}
      {caption(
        g.xSupports,
        interpolate(s.capSupports, { n: formatNumber(supports.length, numberLocale, { maximumFractionDigits: 0 }) }),
        'cap-sup',
      )}
      {caption(
        g.xPressures,
        interpolate(s.capPressures, { n: formatNumber(pressures.length, numberLocale, { maximumFractionDigits: 0 }) }),
        'cap-prs',
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The <520px lists (CSS shows them under the container query)
 * ------------------------------------------------------------------ */

function MobileLists({
  factors,
  copy,
  numberLocale,
}: {
  factors: readonly BalanceFactor[];
  copy: InsightsCopy;
  numberLocale: NumberLocale;
}) {
  const s = copy.signals.balanceCard;
  const supports = factors.filter((f) => f.state === 'supports');
  const pressures = factors.filter((f) => f.state === 'pressures');
  const n = (x: number): string => formatNumber(x, numberLocale, { maximumFractionDigits: 0 });

  const list = (rows: readonly BalanceFactor[]): React.ReactNode =>
    rows.length > 0
      ? rows.map((f) => {
          const v =
            f.primary !== null && f.primary.value !== null
              ? formatIndicatorValue(f.primary.id, f.primary.value, numberLocale, copy.units)
              : null;
          return (
            <span key={f.key} className="block">
              {copy.signals.conditions[f.key].name}
              {v !== null ? <> <bdi dir="ltr">{STATE_ARROW[f.state]} {v}</bdi></> : null}
            </span>
          );
        })
      : s.sideEmpty;

  return (
    <div className="gc-mob" data-gc-mob>
      <div>
        <b>{interpolate(s.capSupports, { n: n(supports.length) })}</b>
        {list(supports)}
      </div>
      <div>
        <b>{interpolate(s.capPressures, { n: n(pressures.length) })}</b>
        {list(pressures)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * D. Neutral + unread bands (ghost chips open their row)
 * ------------------------------------------------------------------ */

function Bands({
  factors,
  copy,
  numberLocale,
  idBase,
}: {
  factors: readonly BalanceFactor[];
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  idBase: string;
}) {
  const s = copy.signals.balanceCard;
  const neutral = factors.filter((f) => f.state === 'neutral');
  const unread = factors.filter((f) => f.state === 'unread');
  const n = (x: number): string => formatNumber(x, numberLocale, { maximumFractionDigits: 0 });

  const chip = (f: BalanceFactor, cls: 'n' | 'u'): React.ReactNode => (
    <button
      key={f.key}
      type="button"
      className={`gc-chip ${cls}`}
      data-gc-chip={f.key}
      onClick={() => {
        const row = document.getElementById(`${idBase}-row-${f.key}`);
        if (row instanceof HTMLDetailsElement) {
          row.open = true;
          row.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
      }}
    >
      {copy.signals.conditions[f.key].name}
    </button>
  );

  if (neutral.length === 0 && unread.length === 0) return null;
  return (
    <div className="gc-bands">
      {neutral.length > 0 ? (
        <div>
          <div className="gc-gcap">{interpolate(s.grpNeutral, { n: n(neutral.length) })}</div>
          <div className="gc-chips">{neutral.map((f) => chip(f, 'n'))}</div>
        </div>
      ) : null}
      {unread.length > 0 ? (
        <div>
          <div className="gc-gcap unr">{interpolate(s.grpUnread, { n: n(unread.length) })}</div>
          <div className="gc-chips">{unread.map((f) => chip(f, 'u'))}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * E. Price context — a phrase, never a weight
 * ------------------------------------------------------------------ */

function PriceContext({
  price,
  copy,
  numberLocale,
  fa,
  metal,
}: {
  price: IndicatorReading | null;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  fa: boolean;
  metal: AssetId;
}) {
  const s = copy.signals.balanceCard;
  const phrase = footingPhraseOf(price);
  if (price === null || price.value === null || phrase === null) return null;

  const assetName = copy.signals.metals[metal];
  const assetWord = numberLocale === 'en-US' ? assetName.toLowerCase() : assetName;
  const parts = priceValueParts(price.id, price.value, numberLocale, copy.units);
  const priceEl =
    numberLocale === 'fa-IR' ? (
      <>
        <bdi className="tabular-nums">{parts.number}</bdi>
        {parts.suffix !== null ? ` ${parts.suffix}` : null}
      </>
    ) : (
      <bdi dir="ltr">
        {parts.prefix ?? ''}
        {parts.number}
      </bdi>
    );
  const change =
    price.change30d !== undefined && Number.isFinite(price.change30d)
      ? formatChange(price.change30d, 'pct', numberLocale, copy.units)
      : null;
  const pos = price.percentile10y ?? null;

  // "{pct} in 30 days" with the signed number isolated LTR (RTL rule 5).
  const changeEl =
    change !== null ? (
      <>
        {fa ? '، ' : ', '}
        {s.ctxChange.split('{pct}')[0]}
        <bdi dir="ltr">{change}</bdi>
        {s.ctxChange.split('{pct}')[1] ?? ''}
      </>
    ) : null;

  return (
    <div className="gc-ctx" data-gc-ctx>
      <div className="min-w-0">
        <div className="gc-ctx-label">{interpolate(s.ctxLabel, { asset: assetWord })}</div>
        <div className="gc-ctx-price">
          {priceEl} <span>{s[phrase]}{changeEl}</span>
        </div>
      </div>
      {pos !== null ? (
        <div>
          <div className="gc-bar">
            <i style={{ insetInlineStart: `${Math.min(100, Math.max(0, pos * 100))}%` }} />
          </div>
          <div className="gc-bar-labels">
            <span>{s.rangeLow}</span>
            <span>{s.rangeHigh}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * F. Factor rows (native details/summary)
 * ------------------------------------------------------------------ */

function FactorRow({
  factor,
  copy,
  numberLocale,
  metal,
  idBase,
}: {
  factor: BalanceFactor;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  metal: AssetId;
  idBase: string;
}) {
  const s = copy.signals.balanceCard;
  const conditions = copy.signals.conditions;
  const effect = copy.signals.balanceCard.effect[factor.key];
  const name = conditions[factor.key].name;
  const metalName = copy.signals.metals[metal];
  const assetWord = numberLocale === 'en-US' ? metalName.toLowerCase() : metalName;

  // The plain-language effect line: the state's own sentence, the inverse
  // for the opposite state, the neutral line for neutral (spec 04).
  const effectLine =
    factor.state === 'unread'
      ? factor.unreadReason !== null
        ? factor.unreadReason === 'stale' && factor.staleDays !== null
          ? interpolate(s.unreadReason.stale, {
              n: formatNumber(factor.staleDays, numberLocale, { maximumFractionDigits: 0 }),
            })
          : s.unreadReason[factor.unreadReason]
        : s.unreadReason.not_available_yet
      : factor.state === 'neutral'
        ? s.neutralLine
        : interpolate(factor.state === 'pressures' ? effect.against : effect.forAsset, { asset: assetWord });

  // All input values (a two-index driver shows both).
  const values = factor.inputs
    .filter((r) => r.value !== null)
    .map((r) => formatIndicatorValue(r.id, r.value!, numberLocale, copy.units));
  const showValue = factor.state !== 'unread' && values.length > 0;

  const dateOf = (iso: string): string =>
    numberLocale === 'fa-IR' ? formatJalaliDate(iso, 'fa-IR') : formatDateWords(iso, 'en-US');

  const lastKnown =
    factor.state === 'unread' && factor.primary !== null && factor.primary.value !== null
      ? formatIndicatorValue(factor.primary.id, factor.primary.value, numberLocale, copy.units)
      : null;

  return (
    <details id={`${idBase}-row-${factor.key}`} data-gc-row={factor.key} data-gc-state={factor.state}>
      <summary>
        <StateIcon state={factor.state} className={stateWordClass[factor.state]} />
        <span className="gc-row-main">
          <span className={`gc-row-name ${factor.state === 'unread' ? 'gc-s-unread' : ''}`}>{name}</span>
          <small className="gc-row-effect">{effectLine}</small>
        </span>
        {showValue ? (
          <span className="gc-row-val">
            {values.map((v, i) => (
              <bdi key={i} dir="ltr" className="whitespace-nowrap">
                {v}
              </bdi>
            )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' · ', el]), [])}
          </span>
        ) : null}
        <ChevronDown aria-hidden size={16} strokeWidth={2} className="gc-chev" />
      </summary>
      <div className="gc-row-x">
        <p className="m-0">{effect.explain}</p>
        {factor.rangePos !== null ? (
          <div className="mt-2" aria-hidden="true">
            <div className="gc-bar">
              <i style={{ insetInlineStart: `${Math.min(100, Math.max(0, factor.rangePos * 100))}%` }} />
            </div>
          </div>
        ) : null}
        {lastKnown !== null ? (
          <p className="mt-2 mb-0">
            {interpolate(s.lastKnown, { value: '' }).split('{value}')[0]}
            <bdi dir="ltr">{lastKnown}</bdi>
            {interpolate(s.lastKnown, { value: '' }).split('{value}')[1] ?? ''}
          </p>
        ) : null}
        {factor.primary !== null && factor.primary.asOf !== null ? (
          <p className="mt-1 mb-0">
            {interpolate(s.asOf, {
              date: dateOf(factor.primary.asOf),
              source: factor.primary.sourceName,
            })}
          </p>
        ) : null}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ *
 * G. The flip line
 * ------------------------------------------------------------------ */

function FlipLine({
  factor,
  flip,
  net,
  copy,
  numberLocale,
}: {
  factor: BalanceFactor;
  flip: { dir: 'below' | 'above'; at: number; key: 'flip_balance' | 'flip_ease' };
  net: number;
  copy: InsightsCopy;
  numberLocale: NumberLocale;
}) {
  const s = copy.signals.balanceCard;
  const name = copy.signals.conditions[factor.key].name;
  const x =
    factor.primary !== null
      ? formatIndicatorValue(factor.primary.id, flip.at, numberLocale, copy.units)
      : formatNumber(flip.at, numberLocale, { maximumFractionDigits: 2 });
  const key =
    flip.key === 'flip_balance' ? `balance_${flip.dir}` : `${net > 0 ? 'ease_pressure' : 'ease_support'}_${flip.dir}`;
  return (
    <p className="gc-flip m-0" data-gc-flip>
      {interpolate(s.flip[key as keyof typeof s.flip], { name, x })}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * The card
 * ------------------------------------------------------------------ */

export function BalanceCard({
  gold,
  silver,
  readings,
  copy,
  numberLocale,
  now,
}: {
  gold: SignalReading;
  silver: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: NumberLocale;
  /** Render-time clock (explicit for deterministic tests; captured once
   * per mount otherwise — the lazy initializer keeps the render pure). */
  now?: number;
}) {
  const [asset, setAsset] = useState<AssetId>('gold');
  const [revealed, setRevealed] = useState(false);
  const [fallbackNow] = useState(() => Date.now());
  const nowMs = now ?? fallbackNow;
  const rootRef = useRef<HTMLElement>(null);
  const idBase = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const fa = numberLocale === 'fa-IR';
  const s = copy.signals.balanceCard;

  // Animate once when the card first becomes visible (01 §C.8) — no
  // IntersectionObserver (tests, SSR-less jsdom) → treat as visible.
  useEffect(() => {
    if (revealed) return;
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const el = rootRef.current;
    if (el === null) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: '48px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [revealed]);

  const byId = useMemo(() => new Map(readings.map((r) => [r.id as string, r])), [readings]);
  const signal = asset === 'gold' ? gold : silver;
  const factors = useMemo(() => buildBalanceFactors(signal, byId, nowMs), [signal, byId, nowMs]);
  const lean = useMemo(() => computeLean(factors), [factors]);
  const ordered = useMemo(() => orderFactors(factors), [factors]);
  const price = byId.get(signal.priceId as string) ?? null;
  const meta = cardMeta(factors, price);

  // The beam settles once on first reveal and replays on a data change or
  // a Gold | Silver switch (01 §Interaction 3): the svg's key changes →
  // remount → the CSS animation runs again.
  const replayKey = `${asset}:${factors.map((f) => f.state).join('')}`;

  const flipFactor = lean.flip !== null ? factors.find((f) => f.key === lean.flip!.factorId) ?? null : null;
  const assetName = copy.signals.metals[asset];
  const assetWord = numberLocale === 'en-US' ? assetName.toLowerCase() : assetName;
  const verdictPhrase = interpolate(s.verdict[lean.verdict], { asset: assetWord });
  const confidenceWord = s.confidence[lean.confidence];
  const subline =
    lean.verdict === 'none'
      ? null
      : interpolate(s.subline, {
          confidence: confidenceWord,
          read: formatNumber(lean.read, numberLocale, { maximumFractionDigits: 0 }),
          total: formatNumber(lean.total, numberLocale, { maximumFractionDigits: 0 }),
        });
  const metaLine =
    meta.newestUpdatedAt !== null
      ? interpolate(meta.sourcesCount === 1 ? s.updatedMetaOne : s.updatedMeta, {
          ago: formatRelative(meta.newestUpdatedAt, numberLocale, nowMs),
          n: formatNumber(meta.sourcesCount, numberLocale, { maximumFractionDigits: 0 }),
        })
      : null;

  return (
    <article
      ref={rootRef}
      className={`balance-card flex flex-col rounded-[12px] border border-[var(--gc-hairline)] bg-[var(--gc-surface)] p-5 ${revealed ? 'gc-live' : ''}`}
      data-gc-card
      data-gc-asset={asset}
      data-gc-verdict={lean.verdict}
      aria-labelledby={`${idBase}-verdict`}
    >
      {/* A. Header */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <SegmentedControl asset={asset} onAsset={setAsset} copy={copy} fa={fa} idBase={idBase} />
        {metaLine !== null ? <span className="gc-meta">{metaLine}</span> : null}
      </header>

      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${asset}`}>
        {/* B. Verdict */}
        <h3 className="gc-verdict" id={`${idBase}-verdict`}>
          {verdictPhrase}
        </h3>
        {subline !== null ? <p className="gc-subline m-0">{subline}</p> : null}

        {/* C. Beam + the <520px lists */}
        <BeamSvg
          factors={factors}
          tilt={lean.tilt}
          fa={fa}
          copy={copy}
          numberLocale={numberLocale}
          replayKey={replayKey}
          live={revealed}
          idBase={idBase}
        />
        <MobileLists factors={factors} copy={copy} numberLocale={numberLocale} />

        {/* D. Neutral + unread bands */}
        <Bands factors={factors} copy={copy} numberLocale={numberLocale} idBase={idBase} />

        {/* E. Price context */}
        <PriceContext price={price} copy={copy} numberLocale={numberLocale} fa={fa} metal={asset} />

        {/* F. Factor rows */}
        <div className="gc-rows">
          {ordered.map((f) => (
            <FactorRow key={f.key} factor={f} copy={copy} numberLocale={numberLocale} metal={asset} idBase={idBase} />
          ))}
        </div>

        {/* G. Flip line */}
        {flipFactor !== null && lean.flip !== null ? (
          <FlipLine factor={flipFactor} flip={lean.flip} net={lean.net} copy={copy} numberLocale={numberLocale} />
        ) : null}

        {/* H. Footnote */}
        <p className="gc-foot m-0">{s.footnote}</p>
      </div>
    </article>
  );
}
