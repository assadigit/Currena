"use client";

/**
 * The Currena gold page — the visual layer.
 *
 * Every diagram speaks the S4 visual grammar: one brass instrument (the
 * assay balance) explains the verdict; the five lane bars explain the
 * instrument; every driver gets its own explanatory shape (a see-saw, a
 * price tag, a gauge, a split bar, a crowd) — the right visual metaphor
 * per concept, never a generic gauge. Charts are dir="ltr" in both
 * locales (the common Persian financial-chart convention); colour is
 * never the sole carrier (every hue pairs a glyph + a word); both
 * themes come from the tokens only.
 */

import * as React from "react";
import type { LaneReading } from "@/lib/gold-page/content";
import { LANES, LANE_CONTENT, type Locale, type SeatState } from "@/lib/gold-page/content";

/* ------------------------------------------------------------------ *
 * Number + date formatting (locale-aware, Persian digits in fa)
 * ------------------------------------------------------------------ */

export function makeFmt(locale: Locale) {
  const num = (v: number, digits = 1): string => {
    try {
      return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
      }).format(v);
    } catch {
      return String(Math.round(v * 10) / 10);
    }
  };
  const pct = (v: number | null | undefined, digits = 1): string =>
    v === null || v === undefined || !Number.isFinite(v)
      ? "·"
      : `${v > 0 ? "+" : v < 0 ? "−" : ""}${num(Math.abs(v), digits)}%`;
  const usd = (v: number): string =>
    locale === "fa"
      ? `${num(v, 0)} دلار`
      : `US$${num(v, 0)}`;
  const dateWords = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(`${iso}T00:00:00Z`));
    } catch {
      return iso;
    }
  };
  const monthShort = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
        month: "short",
        year: "2-digit",
      }).format(new Date(`${iso}T00:00:00Z`));
    } catch {
      return iso;
    }
  };
  return { num, pct, usd, dateWords, monthShort };
}

export type Fmt = ReturnType<typeof makeFmt>;

/* ------------------------------------------------------------------ *
 * The house chart grammar — stretched SVG, LTR root, tokens only
 * ------------------------------------------------------------------ */

interface SparkProps {
  values: readonly number[];
  width?: number;
  height?: number;
  color?: string; // a CSS var reference
  endDot?: boolean;
  fill?: boolean;
  ariaLabel?: string;
  /** Render at the passed pixel size instead of stretching to the container (MiniSpark). */
  fixed?: boolean;
}

/** The neutral sparkline (never tinted by direction; direction rides the signed delta beside it). Fluid: fills its card's width, so no fixed pixel ever overflows a phone. */
export function Sparkline({ values, width = 300, height = 64, color = "var(--color-accent-gold-strong)", endDot = true, fill = false, ariaLabel, fixed = false }: SparkProps) {
  const pts = React.useMemo(() => {
    const clean = values.filter((v) => Number.isFinite(v));
    if (clean.length < 2) return null;
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const span = max - min || 1;
    return clean.map((v, i) => {
      const x = (i / (clean.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((v - min) / span) * (height - 10);
      return [x, y] as const;
    });
  }, [values, width, height]);
  if (!pts) return <svg dir="ltr" width={fixed ? width : undefined} height={height} aria-hidden="true" />;
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD = `${d}L${pts[pts.length - 1][0].toFixed(1)},${height}L2,${height}Z`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg
      dir="ltr"
      viewBox={`0 0 ${width} ${height}`}
      {...(fixed ? { width, height } : {})}
      className={fixed ? "block" : "block h-auto w-full"}
      preserveAspectRatio={fixed ? undefined : "xMidYMid meet"}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      aria-hidden={ariaLabel ? undefined : "true"}
    >
      {fill ? <path d={areaD} fill={color} opacity={0.12} /> : null}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {endDot ? <circle cx={ex} cy={ey} r={3} fill={color} /> : null}
    </svg>
  );
}

/** A tiny inline spark for dashboard rows. */
export function MiniSpark({ values, color = "var(--color-text-tertiary)" }: { values: readonly number[]; color?: string }) {
  return <Sparkline values={values} width={64} height={18} color={color} endDot={false} fixed />;
}

/* ------------------------------------------------------------------ *
 * TraceChart — the house line chart with real X/Y axes + a hover
 * trace (the crosshair + the tooltip that follows the pointer).
 * ------------------------------------------------------------------ */

/** One traced line — its own points (own dates), its own color. */
export interface TraceSeriesDef {
  label: string;
  /** A CSS var reference (the tokens only). */
  color: string;
  points: ReadonlyArray<{ d: string; v: number }>;
  dashed?: boolean;
  /** True to fill softly under this line (the hero's single line). */
  fill?: boolean;
  /** The drawn stroke width (default 2; the comparison chart rides wider). */
  lineWidth?: number;
  /** "left" (default) rides the primary axis; "right" rides its own
   *  honest second scale (a rate beside indexed assets — the house
   *  dual-axis convention the correlation band uses). */
  axis?: "left" | "right";
  /** The tooltip's own value format (defaults to the axis formatter). */
  format?: (v: number) => string;
}

export interface TraceChartProps {
  series: TraceSeriesDef[];
  height?: number;
  /** The left (primary) Y-axis + tooltip value formatter. */
  yFormat: (v: number) => string;
  /** The right (secondary) axis formatter — present only in dual-axis charts. */
  yFormatRight?: (v: number) => string;
  fmt: Fmt;
  ariaLabel: string;
  /** Draw a dashed reference line at this Y (e.g. the 100 index base). */
  baseline?: number | null;
  /** Tooltip secondary line (e.g. the % from window start). */
  hoverNote?: ((series: TraceSeriesDef, v: number, first: number) => string | null) | null;
  /** True to mark the first / last / highest / lowest points of the first
   *  series with dots + price tags, and to widen the Y axis to five ticks
   *  (the hero's single-line chart: the price points read without hovering). */
  pricePoints?: boolean;
}

/**
 * The multi-line chart with labelled axes and a pointer-driven trace:
 * the crosshair locks to the nearest point in time, and the tooltip
 * reads every line's value at that date. LTR root (the Persian
 * financial-chart convention), tokens only, colour never alone — the
 * legend pairs each line's colour with its name and the tooltip lists
 * values by name.
 */
export function TraceChart({
  series,
  height = 200,
  yFormat,
  yFormatRight,
  fmt,
  ariaLabel,
  baseline = null,
  hoverNote = null,
  pricePoints = false,
}: TraceChartProps) {
  const [hoverT, setHoverT] = React.useState<number | null>(null);
  const traceRef = React.useRef<HTMLDivElement | null>(null);

  const model = React.useMemo(() => {
    const W = 640;
    const H = height;
    const padL = 10;
    const padR = yFormatRight !== undefined ? 92 : 64;
    const padT = 14;
    const padB = 26;
    const hasRight = series.some((s) => s.axis === "right");
    const times: number[] = [];
    const leftValues: number[] = [];
    const rightValues: number[] = [];
    for (const s of series) {
      for (const p of s.points) {
        const t = Date.parse(`${p.d}T00:00:00Z`);
        if (!Number.isFinite(t) || !Number.isFinite(p.v)) continue;
        times.push(t);
        (s.axis === "right" ? rightValues : leftValues).push(p.v);
      }
    }
    if (times.length < 2) return null;
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const domain = (values: number[], includeBaseline: boolean): [number, number] => {
      let lo = Math.min(...values, ...(includeBaseline && baseline !== null ? [baseline] : []));
      let hi = Math.max(...values, ...(includeBaseline && baseline !== null ? [baseline] : []));
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo) {
        lo = Number.isFinite(lo) ? lo - 1 : 0;
        hi = lo + 2;
      }
      const pad = (hi - lo) * 0.06;
      return [lo - pad, hi + pad];
    };
    const [vMin, vMax] = domain(leftValues, true);
    const [rMin, rMax] = hasRight ? domain(rightValues, false) : [vMin, vMax];
    const xOf = (t: number) => padL + ((t - tMin) / Math.max(1, tMax - tMin)) * (W - padL - padR);
    const yOfLeft = (v: number) => padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB);
    const yOfRight = (v: number) => padT + (1 - (v - rMin) / Math.max(1e-9, rMax - rMin)) * (H - padT - padB);
    const yOf = (v: number, axis: "left" | "right") => (axis === "right" ? yOfRight(v) : yOfLeft(v));
    const pathOf = (s: TraceSeriesDef): string => {
      const axis = s.axis ?? "left";
      let d = "";
      for (const p of s.points) {
        const t = Date.parse(`${p.d}T00:00:00Z`);
        if (!Number.isFinite(t) || !Number.isFinite(p.v)) continue;
        d += `${d === "" ? "M" : "L"}${xOf(t).toFixed(1)},${yOf(p.v, axis).toFixed(1)}`;
      }
      return d;
    };
    // the x ticks: quarter points, labelled with the house month-short
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const t = tMin + f * (tMax - tMin);
      return { t, x: xOf(t), label: fmt.monthShort(new Date(t).toISOString().slice(0, 10)) };
    });
    // the y ticks: five when the price points ride the chart (the hero),
    // three otherwise — labelled on the right, always real prices
    const yTicks = pricePoints
      ? [0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = vMin + f * (vMax - vMin);
          return { v, y: yOfLeft(v), label: yFormat(v) };
        })
      : [
          { v: vMin, y: yOfLeft(vMin), label: yFormat(vMin) },
          { v: (vMin + vMax) / 2, y: yOfLeft((vMin + vMax) / 2), label: yFormat((vMin + vMax) / 2) },
          { v: vMax, y: yOfLeft(vMax), label: yFormat(vMax) },
        ];
    const rightTicks =
      hasRight && yFormatRight !== undefined
        ? [
            { v: rMin, y: yOfRight(rMin), label: yFormatRight(rMin) },
            { v: (rMin + rMax) / 2, y: yOfRight((rMin + rMax) / 2), label: yFormatRight((rMin + rMax) / 2) },
            { v: rMax, y: yOfRight(rMax), label: yFormatRight(rMax) },
          ]
        : [];
    // the price-point markers: the first / last / highest / lowest point of
    // the FIRST series, each with its own labelled dot. A min/max whose
    // point sits visually ON the last reading is dropped (the last's own
    // tag already tells that story — no double labels at the edge).
    const markers: Array<{ d: string; v: number; kind: "first" | "last" | "max" | "min" }> = [];
    if (pricePoints && series.length > 0 && series[0]!.points.length > 0) {
      const pts = series[0]!.points.filter((p) => Number.isFinite(p.v) && Number.isFinite(Date.parse(`${p.d}T00:00:00Z`)));
      if (pts.length > 0) {
        let maxP = pts[0]!;
        let minP = pts[0]!;
        for (const p of pts) {
          if (p.v > maxP.v) maxP = p;
          if (p.v < minP.v) minP = p;
        }
        const first = pts[0]!;
        const last = pts[pts.length - 1]!;
        const tLast = Date.parse(`${last.d}T00:00:00Z`);
        const xSpan = Math.max(1, tMax - tMin);
        const ySpan = Math.max(1e-9, vMax - vMin);
        const ridesTheLast = (p: { d: string; v: number }): boolean =>
          Math.abs(Date.parse(`${p.d}T00:00:00Z`) - tLast) < 0.12 * xSpan && Math.abs(p.v - last.v) < 0.04 * ySpan;
        const seen = new Set<string>();
        for (const m of [
          { d: first.d, v: first.v, kind: "first" as const },
          { d: last.d, v: last.v, kind: "last" as const },
          { d: maxP.d, v: maxP.v, kind: "max" as const },
          { d: minP.d, v: minP.v, kind: "min" as const },
        ]) {
          if (seen.has(`${m.d}`) && m.kind !== "last") continue;
          if ((m.kind === "max" || m.kind === "min") && ridesTheLast(m)) continue;
          seen.add(m.d);
          markers.push(m);
        }
      }
    }
    return { W, H, padL, padR, padT, padB, tMin, tMax, vMin, vMax, rMin, rMax, xOf, yOf, yOfLeft, yOfRight, pathOf, ticks, yTicks, rightTicks, hasRight, markers };
  }, [series, height, baseline, fmt, yFormat, yFormatRight, pricePoints]);

  /* the pointer trace — the crosshair locks to the nearest date */
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (model === null || traceRef.current === null) return;
    const rect = traceRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverT(model.tMin + frac * (model.tMax - model.tMin));
  };

  /* each series' nearest point at the hover time */
  const hovered = React.useMemo(() => {
    if (model === null || hoverT === null) return null;
    const rows = series.map((s) => {
      let best: { d: string; v: number } | null = null;
      let bestDx = Infinity;
      for (const p of s.points) {
        const t = Date.parse(`${p.d}T00:00:00Z`);
        if (!Number.isFinite(t)) continue;
        const dx = Math.abs(t - hoverT);
        if (dx < bestDx) {
          bestDx = dx;
          best = p;
        }
      }
      return { s, p: best };
    });
    const date = rows.find((r) => r.p !== null)?.p?.d ?? null;
    return { rows, date };
  }, [series, hoverT, model]);

  if (model === null) {
    return <div dir="ltr" aria-hidden="true" style={{ height: `${height}px` }} />;
  }

  return (
    <div
      dir="ltr"
      ref={traceRef}
      className="relative w-full touch-pan-y select-none"
      onPointerMove={onPointer}
      onPointerLeave={() => setHoverT(null)}
    >
      <svg
        viewBox={`0 0 ${model.W} ${model.H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {/* the Y grid + axis labels (left = the primary index; right = the yield's own honest % scale) */}
        {model.yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={model.padL} y1={tick.y} x2={model.W - model.padR} y2={tick.y} stroke="var(--color-border)" strokeWidth={0.8} opacity={0.6} />
            <text x={model.W - model.padR + 6} y={tick.y + 3.5} fontSize={10} fill="var(--color-text-tertiary)">
              {tick.label}
            </text>
          </g>
        ))}
        {model.hasRight && model.rightTicks.length > 0 ? (
          <g>
            <line x1={model.W - 44} y1={model.padT} x2={model.W - 44} y2={model.H - model.padB} stroke="var(--color-border)" strokeWidth={0.8} opacity={0.6} />
            {model.rightTicks.map((tick, i) => (
              <text
                key={i}
                x={model.W - 40}
                y={tick.y + 3.5}
                fontSize={10}
                fontWeight={700}
                fill="var(--color-status-context)"
              >
                {tick.label}
              </text>
            ))}
          </g>
        ) : null}
        {/* the X axis line + its date labels */}
        <line x1={model.padL} y1={model.H - model.padB} x2={model.W - model.padR} y2={model.H - model.padB} stroke="var(--color-border)" strokeWidth={0.8} opacity={0.8} />
        {model.ticks.map((tick, i) => (
          <g key={i}>
            <line x1={tick.x} y1={model.H - model.padB} x2={tick.x} y2={model.H - model.padB + 4} stroke="var(--color-text-tertiary)" strokeWidth={0.8} />
            <text x={tick.x} y={model.H - model.padB + 14} fontSize={10} fill="var(--color-text-tertiary)" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
              {tick.label}
            </text>
          </g>
        ))}
        {/* the baseline (the 100 index, the flat reference) */}
        {baseline !== null ? (
          <line x1={model.padL} y1={model.yOf(baseline, "left")} x2={model.W - model.padR} y2={model.yOf(baseline, "left")} stroke="var(--color-text-tertiary)" strokeWidth={1} strokeDasharray="3 4" opacity={0.7} />
        ) : null}
        {/* the lines */}
        {series.map((s) => {
          const d = model.pathOf(s);
          if (d === "") return null;
          const areaD = s.fill
            ? `${d}L${(model.W - model.padR).toFixed(1)},${(model.H - model.padB).toFixed(1)}L${model.padL.toFixed(1)},${(model.H - model.padB).toFixed(1)}Z`
            : null;
          const axis = s.axis ?? "left";
          return (
            <g key={s.label}>
              {areaD ? <path d={areaD} fill={s.color} opacity={0.1} /> : null}
              <path d={d} fill="none" stroke={s.color} strokeWidth={s.dashed ? (s.lineWidth ?? 1.4) : (s.lineWidth ?? 2)} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "4 3" : undefined} />
              {/* the end dot */}
              {s.points.length > 0 ? (
                <circle cx={model.xOf(Date.parse(`${s.points[s.points.length - 1]!.d}T00:00:00Z`))} cy={model.yOf(s.points[s.points.length - 1]!.v, axis)} r={3} fill={s.color} />
              ) : null}
            </g>
          );
        })}
        {/* the price-point markers: first / last / highest / lowest, each
            with its own price tag — the hero's clear price points */}
        {pricePoints && model.markers.length > 0 && series.length > 0 ? (
          <g>
            {model.markers.map((m) => {
              const t = Date.parse(`${m.d}T00:00:00Z`);
              const x = model.xOf(t);
              const y = model.yOf(m.v, series[0]!.axis ?? "left");
              const isMax = m.kind === "max";
              const isMin = m.kind === "min";
              const isLast = m.kind === "last";
              /* the label rides where the chart itself is empty: above the
                 point when there is headroom, below it when there is not —
                 never into the date axis, never off the top edge */
              const spaceAbove = y - model.padT > 26;
              const spaceBelow = model.H - model.padB - y > 26;
              const dy = spaceAbove ? -12 : spaceBelow ? 16 : -10;
              const anchor: "start" | "middle" | "end" = m.kind === "first" ? "start" : isLast ? "end" : "middle";
              const ink = isMax ? "var(--color-return-up)" : isMin ? "var(--color-return-down)" : "var(--color-text-primary)";
              const glyph = isMax ? "▲ " : isMin ? "▼ " : "";
              return (
                <g key={`${m.kind}-${m.d}`}>
                  <circle cx={x} cy={y} r={4.5} fill="var(--color-surface)" stroke={series[0]!.color} strokeWidth={2.5} />
                  <text x={x} y={y + dy} textAnchor={anchor} fontSize={11} fontWeight={800} fill={ink} style={{ paintOrder: "stroke" }} stroke="var(--color-surface)" strokeWidth={3} strokeLinejoin="round">
                    {glyph}
                    {yFormat(m.v)}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}
        {/* the hover trace: the crosshair + the focus dots */}
        {hovered !== null && hovered.date !== null ? (
          <g>
            <line
              x1={model.xOf(Date.parse(`${hovered.date}T00:00:00Z`))}
              y1={model.padT}
              x2={model.xOf(Date.parse(`${hovered.date}T00:00:00Z`))}
              y2={model.H - model.padB}
              stroke="var(--color-text-secondary)"
              strokeWidth={0.8}
              opacity={0.5}
            />
            {hovered.rows.map((r) =>
              r.p !== null ? (
                <circle
                  key={r.s.label}
                  cx={model.xOf(Date.parse(`${r.p.d}T00:00:00Z`))}
                  cy={model.yOf(r.p.v, r.s.axis ?? "left")}
                  r={3.6}
                  fill="var(--color-surface)"
                  stroke={r.s.color}
                  strokeWidth={2}
                />
              ) : null,
            )}
          </g>
        ) : null}
      </svg>
      {/* the tooltip (HTML — real bilingual text, never clipped by the viewBox) */}
      {hovered !== null && hovered.date !== null ? (
        <div
          className="pointer-events-none absolute top-1 z-10 max-w-[240px] rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-1.5 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]"
          style={{
            left: `${Math.min(72, Math.max(4, (model.xOf(Date.parse(`${hovered.date}T00:00:00Z`)) / model.W) * 100))}%`,
          }}
        >
          <p className="m-0 type-caption font-bold text-[var(--color-text-primary)]">
            {hovered.date.includes("T")
              ? `${fmt.dateWords(hovered.date.slice(0, 10))} · ${hovered.date.slice(11, 16)}`
              : fmt.dateWords(hovered.date)}
          </p>
          <ul className="m-0 mt-0.5 flex list-none flex-col gap-0.5 p-0">
            {hovered.rows.map((r) => {
              const first = r.s.points[0]?.v ?? null;
              return (
                <li key={r.s.label} className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5 type-caption text-[var(--color-text-secondary)]">
                    <span aria-hidden="true" className="inline-block h-[3px] w-[12px] rounded-full" style={{ background: r.s.color }} />
                    {r.s.label}
                  </span>
                  <span className="type-caption font-bold tabular-nums text-[var(--color-text-primary)]">
                    {r.p === null
                      ? "·"
                      : (r.s.format ?? (r.s.axis === "right" && yFormatRight !== undefined ? yFormatRight : yFormat))(r.p.v)}
                    {hoverNote != null && r.p !== null && first !== null && first !== 0
                      ? ` · ${hoverNote(r.s, r.p.v, first) ?? ""}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The state vocabulary — colour never travels alone
 * ------------------------------------------------------------------ */

export const STATE_INK: Record<SeatState, { ink: string; chip: string; glyph: string }> = {
  supports: { ink: "var(--color-chip-ink-normal)", chip: "var(--color-status-normal)", glyph: "▲" },
  pressures: { ink: "var(--color-chip-ink-attention)", chip: "var(--color-status-alert)", glyph: "▼" },
  steady: { ink: "var(--color-text-secondary)", chip: "var(--color-text-tertiary)", glyph: "•" },
  unread: { ink: "var(--color-text-tertiary)", chip: "var(--color-text-tertiary)", glyph: "◌" },
};

/** The signed-return word (direction channel — loud hues + sign + triangle). */
export function SignedDelta({ v, fmt, ariaHidden }: { v: number | null; fmt: Fmt; ariaHidden?: boolean }) {
  if (v === null || !Number.isFinite(v)) return <bdi className="type-caption text-[var(--color-text-tertiary)]" aria-hidden={ariaHidden}>·</bdi>;
  const down = v < 0;
  return (
    <bdi dir="ltr" className={`font-bold ${down ? "text-[var(--color-return-down)]" : "text-[var(--color-return-up)]"}`} aria-hidden={ariaHidden}>
      {down ? "▼" : "▲"} {fmt.pct(Math.abs(v)).replace("+", "")}
    </bdi>
  );
}

/* ------------------------------------------------------------------ *
 * LaneBar — the one lane-summary renderer (the S4 LaneBar)
 * ------------------------------------------------------------------ */

export function LaneBar({ lane, reading, locale, fmt }: { lane: (typeof LANES)[number]; reading: LaneReading; locale: Locale; fmt: Fmt }) {
  const total = reading.members.length || 1;
  const label = LANE_CONTENT[lane].label[locale === "en" ? 0 : 1];
  const sideInk =
    reading.side === "for" ? "var(--color-chip-ink-normal)" : reading.side === "against" ? "var(--color-chip-ink-attention)" : "var(--color-text-secondary)";
  const word =
    reading.side === "for" ? (locale === "en" ? "for gold" : "به نفع طلا") : reading.side === "against" ? (locale === "en" ? "against gold" : "علیه طلا") : locale === "en" ? "not leaning" : "بدون گرایش";
  const segs = [
    { n: reading.supports, cls: "bg-[var(--color-status-normal)]" },
    { n: reading.pressures, cls: "bg-[var(--color-status-alert)]" },
    { n: reading.steady, cls: "bg-[var(--color-text-tertiary)]/40" },
    { n: reading.unread, cls: "bg-transparent border border-dashed border-[var(--color-text-tertiary)]" },
  ];
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="type-label truncate text-[var(--color-text-primary)]">{label}</span>
          <span className="type-caption font-bold whitespace-nowrap" style={{ color: sideInk }}>
            {word}
          </span>
        </div>
        <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]/60" aria-hidden="true">
          {segs.map((s, i) =>
            s.n > 0 ? (
              <div key={i} className={`${s.cls} h-full`} style={{ width: `${(s.n / total) * 100}%` }} />
            ) : null,
          )}
        </div>
        <div className="mt-1 type-caption text-[var(--color-text-tertiary)]">
          {locale === "en"
            ? `${reading.supports} for · ${reading.pressures} against · ${reading.steady} steady · ${reading.unread} unread`
            : `${fmt.num(reading.supports)} موافق · ${fmt.num(reading.pressures)} مخالف · ${fmt.num(reading.steady)} بی‌طرف · ${fmt.num(reading.unread)} ناخوانده`}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The brass assay balance — the page's one full instrument
 * ------------------------------------------------------------------ */

const DEG_OF_NET: Record<number, number> = { 0: 0, 1: 5, 2: 9, 3: 12, 4: 14, 5: 16 };

/**
 * The assay-office drawing, drawn honestly: a tapered brass beam on a
 * column, each pan hung PLUMB from its own beam end by a full hanger
 * line, the pans carrying their force names INSIDE the bowl, and the
 * not-leaning tray below. The whole pan assembly is drawn at its REST
 * position and then translated by exactly its beam end's displacement
 * (CSS-transitioned over 650 ms, guarded by prefers-reduced-motion), so
 * the hanger's top stays GLUED to the beam end, the bowl stays plumb,
 * and nothing ever escapes the viewBox — a real balance: the pan
 * holding more items sinks, the other rises.
 */
export function BrassBalance({
  readings,
  verdict,
  sideLabels,
  locale,
  trayTitle,
  trayNote,
  fmt,
}: {
  readings: readonly LaneReading[];
  verdict: "for" | "against" | "balanced" | "none";
  sideLabels: { for: string; against: string; balanced: string; noneFor: string; noneAgainst: string };
  locale: Locale;
  trayTitle: string;
  trayNote: string;
  fmt: Fmt;
}) {
  const forLanes = readings.filter((l) => l.side === "for");
  const againstLanes = readings.filter((l) => l.side === "against");
  const neutralLanes = readings.filter((l) => l.side === "neutral" || l.side === "unread");
  const net = forLanes.length - againstLanes.length;
  /* a REAL balance: the pan holding more items sinks, the other rises
     (the tilt's sign is the INVERSE of the net — net<0 means against
     is heavier, so the against pan on the right must go DOWN) */
  const tilt = (DEG_OF_NET[Math.abs(net)] ?? 10) * (net > 0 ? -1 : net < 0 ? 1 : 0);

  /* the stage's own frame — everything fits inside, even at full tilt */
  const W = 380;
  const H = 248;
  const pivotX = 190;
  const pivotY = 54;
  const arm = 116; // half-beam length
  const hang = 52; // hanger length (beam end → bowl rim)
  const panW = 132;
  const panH = 84;

  const [settled, setSettled] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const rad = (settled ? tilt : 0) * (Math.PI / 180);

  /* each beam end's REST position (level beam) and its FINAL position
     under the tilt — the pan assemblies ride the displacement */
  const restL = { x: pivotX - arm, y: pivotY };
  const restR = { x: pivotX + arm, y: pivotY };
  const finL = { x: pivotX - arm * Math.cos(rad), y: pivotY - arm * Math.sin(rad) };
  const finR = { x: pivotX + arm * Math.cos(rad), y: pivotY + arm * Math.sin(rad) };

  const beamStyle: React.CSSProperties = {
    transform: `rotate(${settled ? tilt : 0}deg)`,
    transformOrigin: `${pivotX}px ${pivotY}px`,
    transition: "transform 650ms cubic-bezier(0.23,1,0.32,1)",
  };
  /* the pan assembly's own ride — EXACTLY the beam end's displacement,
     so the hanger's top stays glued to the beam end (no detached lines,
     no double transforms) and the bowl stays plumb beneath it */
  const panStyle = (rest: { x: number; y: number }, fin: { x: number; y: number }): React.CSSProperties => ({
    transform: `translate(${settled ? fin.x - rest.x : 0}px, ${settled ? fin.y - rest.y : 0}px)`,
    transition: "transform 650ms cubic-bezier(0.23,1,0.32,1)",
  });

  /* one pan assembly, drawn at its REST coordinates (cx, restY = the
   * beam end's own column): the pan hangs from the beam end by TWO
   * suspension lines (the classic V), the bowl carries its own side
   * label as the bold first line INSIDE it, and the force names follow
   * beneath — every name inside the bowl, never spilling past its walls */
  const panAssembly = (
    rest: { x: number; y: number },
    fin: { x: number; y: number },
    lanes: readonly LaneReading[],
    tone: "for" | "against",
    sideLabel: string,
  ) => {
    const cx = rest.x;
    const topY = rest.y + hang; // the bowl's rim line
    const botY = topY + panH;
    return (
      <g style={panStyle(rest, fin)}>
        {/* the suspension — two lines from the beam end fanning to the
            bowl's two rim corners (the classic V hanger, always full) */}
        <line x1={cx} y1={rest.y} x2={cx - panW / 2 + 12} y2={topY} stroke="var(--bal-brass-lo)" strokeWidth={1.4} />
        <line x1={cx} y1={rest.y} x2={cx + panW / 2 - 12} y2={topY} stroke="var(--bal-brass-lo)" strokeWidth={1.4} />
        {/* the bowl */}
        <path
          d={`M${cx - panW / 2},${topY} L${cx + panW / 2},${topY} L${cx + panW / 2 - 14},${botY} Q${cx},${botY + 12} ${cx - panW / 2 + 14},${botY} Z`}
          fill={tone === "for" ? "color-mix(in srgb, var(--color-status-normal) 8%, transparent)" : "color-mix(in srgb, var(--color-status-alert) 8%, transparent)"}
          stroke={tone === "for" ? "var(--color-status-normal)" : "var(--color-status-alert)"}
          strokeWidth={1.2}
          opacity={0.95}
        />
        <rect x={cx - panW / 2 + 8} y={botY + 1} width={panW - 16} height={5} rx={2.5} fill="var(--bal-brass-mid)" />
        {/* the pan's own side label — the bold first line INSIDE the bowl */}
        <text x={cx} y={topY + 15} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={tone === "for" ? "var(--color-chip-ink-normal)" : "var(--color-chip-ink-attention)"}>
          {sideLabel}
        </text>
        {/* the summarized force NAMES — small type, every name INSIDE
            the bowl beneath the label, never spilling past its walls */}
        {lanes.map((l, i) => (
          <text
            key={l.lane}
            x={cx}
            y={topY + 30 + i * 11}
            textAnchor="middle"
            fontSize={9}
            fontWeight={700}
            fill={tone === "for" ? "var(--color-chip-ink-normal)" : "var(--color-chip-ink-attention)"}
          >
            {LANE_CONTENT[l.lane].short[locale === "en" ? 0 : 1]}
          </text>
        ))}
      </g>
    );
  };

  const ariaSummary =
    locale === "en"
      ? `The assay balance: ${forLanes.length} of the five forces sit on the for-gold pan, ${againstLanes.length} on the against pan.`
      : `ترازوی عیارسنجی: از پنج عامل، ${fmt.num(forLanes.length)} روی کفهٔ نفع طلا و ${fmt.num(againstLanes.length)} روی کفهٔ علیه آن نشسته‌اند.`;

  return (
    <div data-balance-visual data-size="s" className="relative w-full" role="img" aria-label={ariaSummary}>
      <div className="bal-glow" />
      <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="bal-stage mx-auto block h-auto w-full max-w-[420px]" aria-hidden="true">
        <defs>
          <linearGradient id="balBeamFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--bal-brass-lo)" />
            <stop offset="0.5" stopColor="var(--bal-brass-hi)" />
            <stop offset="1" stopColor="var(--bal-brass-lo)" />
          </linearGradient>
          <linearGradient id="balColumnFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--bal-brass-lo)" />
            <stop offset="0.45" stopColor="var(--bal-brass-hi)" />
            <stop offset="1" stopColor="var(--bal-brass-lo)" />
          </linearGradient>
        </defs>

        {/* the column + base */}
        <rect x={pivotX - 5} y={pivotY} width={10} height={H - 26 - pivotY} fill="url(#balColumnFace)" />
        <path d={`M${pivotX - 30},${H - 8} L${pivotX + 30},${H - 8} L${pivotX + 20},${H - 22} L${pivotX - 20},${H - 22} Z`} fill="url(#balBeamFace)" />

        {/* the dial under the pivot — a proper arc with radiating ticks */}
        <path d={`M${pivotX - 24},${pivotY + 2} A24,24 0 0 0 ${pivotX + 24},${pivotY + 2}`} fill="none" stroke="var(--bal-stone-lo)" strokeWidth={1} />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (-80 + i * 20) * (Math.PI / 180);
          const x1 = pivotX + Math.sin(a) * 19;
          const y1 = pivotY + 2 + Math.cos(a) * 19;
          const x2 = pivotX + Math.sin(a) * 24;
          const y2 = pivotY + 2 + Math.cos(a) * 24;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bal-stone-lo)" strokeWidth={1} />;
        })}

        {/* the pans, hung plumb — each assembly rides its beam end */}
        {panAssembly(restL, finL, forLanes, "for", sideLabels.noneFor)}
        {panAssembly(restR, finR, againstLanes, "against", sideLabels.noneAgainst)}

        {/* the beam (animated to the tilt), its pointer riding it —
            drawn LAST so it rides over the pans' hangers at the pivot */}
        <g style={beamStyle}>
          <path d={`M${pivotX - arm},${pivotY - 4} L${pivotX + arm},${pivotY - 3} L${pivotX + arm},${pivotY + 4} L${pivotX - arm},${pivotY + 6} Z`} fill="url(#balBeamFace)" />
          {/* the pointer — swings against the dial with the tilt */}
          <path d={`M${pivotX - 2.2},${pivotY + 8} L${pivotX + 2.2},${pivotY + 8} L${pivotX},${pivotY + 22} Z`} fill="var(--bal-brass-lo)" />
          <circle cx={pivotX} cy={pivotY} r={7} fill="var(--bal-brass-mid)" stroke="var(--bal-brass-lo)" strokeWidth={1.5} />
          {/* the beam's own end caps — the hanger's hang points */}
          <circle cx={pivotX - arm} cy={pivotY} r={3} fill="var(--bal-brass-hi)" stroke="var(--bal-brass-lo)" strokeWidth={1} />
          <circle cx={pivotX + arm} cy={pivotY} r={3} fill="var(--bal-brass-hi)" stroke="var(--bal-brass-lo)" strokeWidth={1} />
        </g>
      </svg>

      {/* THE center verdict — big, bold, unmissable; the counted detail
          (the موافق/مخالف tallies) lives behind the boxes' own modal */}
      <p
        className="m-0 mt-2 text-center text-[1.45rem] font-black leading-tight tracking-tight sm:text-[1.7rem]"
        style={{
          color:
            verdict === "against"
              ? "var(--color-chip-ink-attention)"
              : verdict === "for"
                ? "var(--color-chip-ink-normal)"
                : "var(--color-text-secondary)",
        }}
      >
        {verdict === "against" ? sideLabels.against : verdict === "for" ? sideLabels.for : sideLabels.balanced}
      </p>
      {neutralLanes.length > 0 ? (
        <p className="bal-tray m-0 mx-auto mt-1 flex w-fit items-center gap-2 type-caption">
          <span aria-hidden="true">◍</span>
          <span>
            {trayTitle}: {neutralLanes.map((l) => LANE_CONTENT[l.lane].label[locale === "en" ? 0 : 1]).join(locale === "en" ? ", " : "، ")}
          </span>
          <span className="opacity-70">({trayNote})</span>
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The five-forces spine — the combined overview of the five families
 * ------------------------------------------------------------------ */

export function ForcesSpine({
  readings,
  locale,
  upLabel,
  downLabel,
  fmt,
}: {
  readings: readonly LaneReading[];
  locale: Locale;
  upLabel: string;
  downLabel: string;
  fmt: Fmt;
}) {
  return (
    <div className="relative flex flex-col gap-0 ps-6">
      {/* the vertical gold spine */}
      <span className="absolute inset-y-2 start-[11px] w-[3px] rounded-full bg-[var(--color-accent-gold)]/70" aria-hidden="true" />
      {readings.map((r) => {
        const tone = r.side === "for" ? "supports" : r.side === "against" ? "pressures" : "steady";
        const ink = STATE_INK[tone as SeatState];
        const label = LANE_CONTENT[r.lane].label[locale === "en" ? 0 : 1];
        const intro = LANE_CONTENT[r.lane].intro[locale === "en" ? 0 : 1];
        return (
          <div key={r.lane} className="relative py-2.5">
            {/* the station dot on the spine */}
            <span
              className="absolute -start-6 top-[calc(1.25rem+0.4rem)] flex h-[15px] w-[15px] items-center justify-center rounded-full border-2 bg-[var(--color-surface)] text-[9px] font-bold"
              style={{ borderColor: ink.chip, color: ink.chip }}
              aria-hidden="true"
            >
              {ink.glyph === "▲" ? "▲" : ink.glyph === "▼" ? "▼" : "•"}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="type-label font-bold text-[var(--color-text-primary)]">{label}</span>
              <span className="type-caption font-bold" style={{ color: ink.ink }}>
                {r.side === "for" ? upLabel : r.side === "against" ? downLabel : locale === "en" ? "not leaning" : "بدون گرایش"} ·{" "}
                {fmt.num(r.members.length)} {locale === "en" ? "voters" : "رأی‌دهنده"}
              </span>
            </div>
            <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{intro}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The driver diagrams — one metaphor per force
 * ------------------------------------------------------------------ */

/** Borrowing costs: the see-saw — a bond's real yield vs gold's zero. */
export function SeeSawDiagram({ realYield, locale, fmt, captions }: { realYield: number | null; locale: Locale; fmt: Fmt; captions: { bond: string; gold: string; read: string } }) {
  const ry = realYield ?? 4.9;
  const tilt = Math.max(-14, Math.min(14, ry * 2.4)); // presentation scale, honest about the direction
  const W = 300;
  const H = 120;
  const px = 150;
  const py = 44;
  return (
    <figure className="m-0">
      <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: `${px}px ${py}px` }}>
          <rect x={px - 120} y={py - 4} width={240} height={8} rx={4} fill="var(--bal-brass-mid)" />
          <circle cx={px - 92} cy={py - 16} r={13} fill="var(--color-surface)" stroke="var(--color-status-context)" strokeWidth={2} />
          <text x={px - 92} y={py - 12.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--color-status-context)">$</text>
          <rect x={px + 78} y={py - 20} width={34} height={22} rx={4} fill="var(--color-accent-gold)" stroke="var(--color-accent-gold-deep)" strokeWidth={1.5} />
          <text x={px + 95} y={py - 5.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="var(--color-accent-gold-ink)">
            Au
          </text>
        </g>
        <path d={`M${px - 16},${py + 2} L${px + 16},${py + 2} L${px + 5},${py + 46} L${px - 5},${py + 46} Z`} fill="var(--bal-stone-lo)" />
        <line x1={px - 130} y1={py + 54} x2={px + 130} y2={py + 54} stroke="var(--color-border)" strokeWidth={2} />
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center justify-center gap-x-3 type-caption text-[var(--color-text-secondary)]">
        <span>
          {captions.bond}: <bdi dir="ltr" className="font-bold text-[var(--color-status-context)]">{fmt.pct(ry, 1).replace("+", "")}</bdi>
        </span>
        <span>
          {captions.gold}: <bdi dir="ltr" className="font-bold text-[var(--color-accent-gold-deep)]">0%</bdi>
        </span>
        <span className="text-[var(--color-text-tertiary)]">{captions.read}</span>
      </figcaption>
    </figure>
  );
}

/** The dollar: the same ounce priced through other currencies (computed from the store). */
export function PriceTagDiagram({ ounceEur, ounceJpy, locale, fmt, captions }: { ounceEur: number; ounceJpy: number; locale: Locale; fmt: Fmt; captions: { eur: string; jpy: string; note: string } }) {
  const tags = [
    { label: "EUR", v: `€${fmt.num(ounceEur, 0)}`, ink: "var(--color-status-context)" },
    { label: "JPY", v: `¥${fmt.num(ounceJpy, 0)}`, ink: "var(--color-status-context)" },
  ];
  return (
    <figure className="m-0">
      <div className="flex items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-gold)]/20 ring-1 ring-[var(--color-accent-gold)]/50" aria-hidden="true">
          <span className="text-2xl font-extrabold text-[var(--color-accent-gold-deep)]">Au</span>
        </div>
        <span className="text-[var(--color-text-tertiary)]" aria-hidden="true">
          ⟶
        </span>
        <div className="flex flex-col gap-2">
          {tags.map((t) => (
            <div key={t.label} className="flex items-center gap-2" dir="ltr">
              <span className="type-caption rounded-full bg-[var(--color-surface)] px-2 py-0.5 ring-1 ring-[var(--color-border)]" style={{ color: t.ink }}>
                {t.label} {t.v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-center type-caption text-[var(--color-text-secondary)]">{captions.note}</figcaption>
    </figure>
  );
}

/** Stress: the semicircular traffic-light gauge with the needle. */
export function StressGauge({ locale, level, word, captions }: { locale: Locale; level: number; word: string; captions: { calm: string; watch: string; elevated: string; high: string } }) {
  const W = 240;
  const H = 130;
  const cx = 120;
  const cy = 112;
  const r = 88;
  const zoneArc = (a0: number, a1: number, color: string) => {
    const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return <path d={`M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`} fill="none" stroke={color} strokeWidth={13} strokeLinecap="butt" />;
  };
  const needleA = level * (Math.PI / 2) * 0.92 + Math.PI * 0.04;
  const nx = cx + (r - 14) * Math.sin(needleA);
  const ny = cy - (r - 14) * Math.cos(needleA);
  return (
    <figure className="m-0">
      <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[240px]" aria-hidden="true">
        {zoneArc(Math.PI * 0.0, Math.PI * 0.25, "var(--color-status-normal)")}
        {zoneArc(Math.PI * 0.25, Math.PI * 0.5, "var(--color-status-watch)")}
        {zoneArc(Math.PI * 0.5, Math.PI * 0.75, "var(--color-status-stressed)")}
        {zoneArc(Math.PI * 0.75, Math.PI * 0.98, "var(--color-status-alert)")}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--color-text-primary)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="var(--color-text-primary)" />
      </svg>
      <figcaption className="mt-1 flex items-center justify-center gap-3 type-caption text-[var(--color-text-tertiary)]">
        <span>{captions.calm}</span>
        <span>{captions.watch}</span>
        <span>{captions.elevated}</span>
        <span>{captions.high}</span>
        <span className="rounded-full bg-[var(--color-status-watch)]/15 px-2 py-0.5 font-bold text-[var(--color-chip-ink-watch)]">{word}</span>
      </figcaption>
    </figure>
  );
}

/** Inflation: the split bar — realised heat vs expectations cooling. */
export function SplitBar({ locale, captions, fmt }: { locale: Locale; captions: { left: string; right: string; leftWord: string; rightWord: string; note: string }; fmt: Fmt }) {
  return (
    <figure className="m-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-[38%] text-end type-caption font-bold text-[var(--color-chip-ink-normal)]">{captions.left}</span>
          <span className="h-3 flex-1 rounded-l-full rounded-r-sm bg-[var(--color-status-normal)]/70" aria-hidden="true" />
          <span className="type-caption font-bold text-[var(--color-chip-ink-normal)]">{captions.leftWord}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-[38%] text-end type-caption font-bold text-[var(--color-chip-ink-attention)]">{captions.right}</span>
          <span className="h-3 flex-1 rounded-l-full rounded-r-sm bg-[var(--color-status-alert)]/70" aria-hidden="true" />
          <span className="type-caption font-bold text-[var(--color-chip-ink-attention)]">{captions.rightWord}</span>
        </div>
      </div>
      <figcaption className="mt-2 text-center type-caption text-[var(--color-text-secondary)]">{captions.note}</figcaption>
    </figure>
  );
}

/** Flows: the crowded room — one-sided longs, the narrow exit. */
export function CrowdDiagram({ locale, captions }: { locale: Locale; captions: { packed: string; note: string; empty: string } }) {
  return (
    <figure className="m-0">
      <div className="flex h-[72px] items-end justify-center gap-3" aria-hidden="true">
        <div className="flex items-end gap-[3px] rounded-lg bg-[var(--color-status-alert)]/10 px-2.5 pb-1.5 pt-3 ring-1 ring-[var(--color-status-alert)]/30">
          {Array.from({ length: 9 }).map((_, i) => (
            <svg key={i} width={11} height={26} viewBox="0 0 11 26">
              <circle cx={5.5} cy={4.5} r={3.4} fill="var(--color-status-alert)" opacity={0.75 + (i % 3) * 0.08} />
              <rect x={2.4} y={9} width={6.2} height={10} rx={3} fill="var(--color-status-alert)" opacity={0.75 + (i % 3) * 0.08} />
            </svg>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-1 px-1">
          <span className="text-[var(--color-status-alert)]">→</span>
          <span className="type-caption font-bold text-[var(--color-chip-ink-attention)]">{captions.packed}</span>
        </div>
        <div className="flex h-full w-16 items-center justify-center rounded-lg border border-dashed border-[var(--color-text-tertiary)]/60 text-[var(--color-text-tertiary)]">
          <span className="rotate-0 text-lg">🚪</span>
        </div>
      </div>
      <figcaption className="mt-2 text-center type-caption text-[var(--color-text-secondary)]">{captions.note}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * The scenario fan — three illustrative paths from today's price
 * ------------------------------------------------------------------ */

export function ScenarioFan({ spot, locale, fmt, labels }: { spot: number; locale: Locale; fmt: Fmt; labels: { up: string; base: string; down: string; upNote: string; baseNote: string; downNote: string } }) {
  const cards = [
    { key: "up", tone: "var(--color-return-up)", ink: "var(--color-chip-ink-normal)", end: 1.08, title: labels.up, note: labels.upNote },
    { key: "base", tone: "var(--color-text-tertiary)", ink: "var(--color-text-secondary)", end: 1.0, title: labels.base, note: labels.baseNote },
    { key: "down", tone: "var(--color-return-down)", ink: "var(--color-chip-ink-attention)", end: 0.92, title: labels.down, note: labels.downNote },
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => {
        const W = 120;
        const H = 56;
        const wob = c.key === "base" ? [0.02, -0.02, 0.01, -0.01, 0] : c.key === "up" ? [0.02, 0.05, 0.03, 0.06, 0.08] : [-0.02, -0.05, -0.03, -0.06, -0.08];
        const path = wob.map((w, i) => `${i === 0 ? "M" : "L"}${(i / (wob.length - 1)) * (W - 8) + 4},${H - 8 - w * H}`).join(" ");
        return (
          <div key={c.key} className="rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center justify-between gap-2">
              <span className="type-label font-bold" style={{ color: c.ink }}>
                {c.title}
              </span>
              <bdi dir="ltr" className="type-caption font-bold" style={{ color: c.tone }}>
                {c.key === "base" ? "±0–5%" : c.key === "up" ? "+5–10%" : "−5–10%"}
              </bdi>
            </div>
            <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" aria-hidden="true">
              <line x1={4} y1={H - 8} x2={W - 4} y2={H - 8} stroke="var(--color-border)" strokeWidth={1} />
              <path d={path} fill="none" stroke={c.tone} strokeWidth={2.2} strokeLinecap="round" />
            </svg>
            <p className="m-0 mt-1.5 type-caption text-[var(--color-text-secondary)]">{c.note}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The seats grid — the five lanes' own tally table: one row per lane,
 * its lean word, its stacked proportion bar and its counted seats.
 * (The 37 tiny dials the owner called noise are gone; the numbers
 * stand in open columns instead.)
 * ------------------------------------------------------------------ */

export function SeatsGrid({ readings, locale, fmt }: { readings: readonly LaneReading[]; locale: Locale; fmt: Fmt }) {
  const head =
    locale === "en"
      ? { lane: "Lane", for: "▲ for", against: "▼ against", steady: "• steady", unread: "◌ unread", lean: "Lean" }
      : { lane: "لاین", for: "▲ موافق", against: "▼ مخالف", steady: "• بی‌طرف", unread: "◌ ناخوانده", lean: "گرایش" };
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="m-0 w-full border-collapse type-caption">
        <thead>
          <tr className="text-[var(--color-text-tertiary)]">
            <th scope="col" className="px-2 py-1 text-start font-bold">{head.lane}</th>
            <th scope="col" className="px-1.5 py-1 text-end font-bold">{head.for}</th>
            <th scope="col" className="px-1.5 py-1 text-end font-bold">{head.against}</th>
            <th scope="col" className="px-1.5 py-1 text-end font-bold">{head.steady}</th>
            <th scope="col" className="px-1.5 py-1 text-end font-bold">{head.unread}</th>
            <th scope="col" className="px-2 py-1 text-end font-bold">{head.lean}</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const total = r.members.length || 1;
            const word =
              r.side === "for" ? (locale === "en" ? "for gold" : "به نفع طلا") : r.side === "against" ? (locale === "en" ? "against gold" : "علیه طلا") : locale === "en" ? "not leaning" : "بدون گرایش";
            const sideInk =
              r.side === "for" ? "var(--color-chip-ink-normal)" : r.side === "against" ? "var(--color-chip-ink-attention)" : "var(--color-text-secondary)";
            return (
              <tr key={r.lane} className="border-t border-[var(--color-border)]">
                <th scope="row" className="px-2 py-1.5 text-start font-semibold">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-bold text-[var(--color-text-primary)]">{LANE_CONTENT[r.lane].label[locale === "en" ? 0 : 1]}</span>
                    <span className="flex h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[var(--color-border)]/60" aria-hidden="true">
                      <span className="h-full bg-[var(--color-status-normal)]" style={{ width: `${(r.supports / total) * 100}%` }} />
                      <span className="h-full bg-[var(--color-status-alert)]" style={{ width: `${(r.pressures / total) * 100}%` }} />
                      <span className="h-full bg-[var(--color-text-tertiary)]/40" style={{ width: `${(r.steady / total) * 100}%` }} />
                      <span className="h-full border border-dashed border-[var(--color-text-tertiary)]" style={{ width: `${(r.unread / total) * 100}%` }} />
                    </span>
                  </span>
                </th>
                <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-chip-ink-normal)]">{fmt.num(r.supports, 0)}</td>
                <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-chip-ink-attention)]">{fmt.num(r.pressures, 0)}</td>
                <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-secondary)]">{fmt.num(r.steady, 0)}</td>
                <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-tertiary)]">{fmt.num(r.unread, 0)}</td>
                <td className="px-2 py-1.5 text-end font-bold whitespace-nowrap" style={{ color: sideInk }}>
                  {word}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The if-you'd-bought calculator — real closes, no counterfactuals
 * ------------------------------------------------------------------ */

export function IfBoughtChart({ bars, spot, locale, fmt, labels }: { bars: readonly { d: string; v: number }[]; spot: number; locale: Locale; fmt: Fmt; labels: { title: string; subtitle: string; ago: (n: string) => string; worth: string } }) {
  const rows = React.useMemo(() => {
    const pick = (days: number) => {
      const t = new Date(`${bars[bars.length - 1].d}T00:00:00Z`);
      t.setUTCDate(t.getUTCDate() - days);
      let best: { d: string; v: number } | null = null;
      let bx = Infinity;
      for (const p of bars) {
        const x = Math.abs(new Date(`${p.d}T00:00:00Z`).getTime() - t.getTime());
        if (x < bx) {
          bx = x;
          best = p;
        }
      }
      return best;
    };
    return [
      { key: "1m", days: 30, label: locale === "en" ? "1 month" : "۱ ماه" },
      { key: "3m", days: 90, label: locale === "en" ? "3 months" : "۳ ماه" },
      { key: "6m", days: 180, label: locale === "en" ? "6 months" : "۶ ماه" },
      { key: "1y", days: 365, label: locale === "en" ? "1 year" : "۱ سال" },
    ]
      .map((w) => {
        const p = pick(w.days);
        if (!p) return null;
        const worth = 100 * (spot / p.v);
        return { ...w, from: p.d, fromV: p.v, worth };
      })
      .filter((r): r is { key: string; days: number; label: string; from: string; fromV: number; worth: number } => r !== null);
  }, [bars, spot, locale]);

  const max = Math.max(...rows.map((r) => r.worth), 100);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const up = r.worth >= 100;
        return (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-[76px] shrink-0 type-caption font-semibold text-[var(--color-text-secondary)]">{r.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[var(--color-border)]/40">
              <div
                className={`h-full rounded-md ${up ? "bg-[var(--color-return-up)]/25" : "bg-[var(--color-return-down)]/25"}`}
                style={{ width: `${(r.worth / max) * 100}%`, marginInlineStart: 0 }}
                aria-hidden="true"
              />
              <span className="absolute inset-y-0 start-0 flex items-center ps-2">
                <bdi dir="ltr" className={`type-caption font-bold ${up ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}`}>
                  {up ? "▲" : "▼"} ${fmt.num(r.worth, 0)}
                </bdi>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
