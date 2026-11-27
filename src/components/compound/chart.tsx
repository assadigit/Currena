"use client";

/**
 * Compound Wealth — the chart, as one inline SVG.
 *
 * The house pattern (the gold page's own Sparkline family): hand-built
 * SVG, dir="ltr" in both locales (the Persian financial-chart
 * convention), colour never the sole carrier (every line pairs a dash
 * pattern and a direct end label), tokens for both themes. The page
 * variant measures its container and draws 1:1 in real pixels, so text
 * stays legible at every width; the print variant is a fixed-size sheet
 * drawing with a fixed ink palette; the spark variant is the phone
 * card's compact stacked area.
 */

import * as React from "react";
import type { Locale } from "@/lib/compound/content";
import type { Milestone, MonthPoint } from "@/lib/compound/maths";

export interface OtherLine {
  /** Stable id for the v9 layer toggles (e.g. "sp500", "cash"). */
  id?: string;
  /** Short label written at the line's end. */
  label: string;
  /** Total value by month (future money). */
  series: MonthPoint[];
  /** Dash pattern index for lines that are not colour-alone. */
  dash?: number;
  /** Is this the cash line? (drawn dotted, calm) */
  cash?: boolean;
}

/** v9: which of the chart's own layers are drawn (the page variant's
 * filter row). Unspecified means all — so the print and spark variants
 * and every other caller keep today's look untouched. */
export interface ChartVisible {
  putIn: boolean;
  growth: boolean;
  total: boolean;
  band: boolean;
}

export interface GrowthChartProps {
  series: MonthPoint[];
  lowSeries: MonthPoint[] | null;
  highSeries: MonthPoint[] | null;
  others: OtherLine[];
  milestones: Milestone[];
  crossoverMonth: number | null;
  locale: Locale;
  variant?: "page" | "print" | "spark";
  /** Screen-reader summary (already translated). */
  summary?: string;
  /** v9: layer visibility (page variant only; defaults to all shown). */
  visible?: ChartVisible;
  labels?: {
    putIn: string;
    /** The value (total) line's end label. The page passes its "Total"
     * wording so the label maps 1:1 to the v9 Total chip; the print
     * card keeps the v6 "Growth" wording (no chips there). */
    value: string;
    bandLow: string;
    bandHigh: string;
    crossover: string;
  };
  /** Value formatter for milestone markers. */
  fmtValue?: (v: number) => string;
}

/** Fixed ink palette for print (greyscale-safe, one accent). */
const INK = {
  putInFill: "rgba(44, 62, 80, 0.10)",
  growthFill: "rgba(168, 126, 28, 0.20)",
  bandFill: "rgba(168, 126, 28, 0.10)",
  putInLine: "#47525d",
  valueLine: "#a87e1c",
  bandEdge: "rgba(168, 126, 28, 0.55)",
  otherLine: "rgba(71, 82, 93, 0.55)",
  cashLine: "rgba(107, 114, 128, 0.65)",
  crossover: "#256d29",
  milestone: "#a87e1c",
  text: "#2c3e50",
  textMuted: "#4f5a66",
  grid: "rgba(44, 62, 80, 0.10)",
};

/** Token palette for the screen (adapts to dark mode). */
const TOKEN = {
  putInFill: "var(--color-text-secondary)",
  growthFill: "var(--color-accent-gold)",
  bandFill: "var(--color-accent-gold)",
  putInLine: "var(--color-text-tertiary)",
  valueLine: "var(--color-accent-gold-deep)",
  bandEdge: "var(--color-accent-gold-deep)",
  otherLine: "var(--color-currena-muted)",
  cashLine: "var(--color-currena-muted)",
  crossover: "var(--color-status-normal)",
  milestone: "var(--color-accent-gold-deep)",
  text: "var(--color-text-secondary)",
  textMuted: "var(--color-text-tertiary)",
  grid: "var(--color-border)",
};

/** The dash patterns (index 0 = solid). Exported so the v9 filter chips
 *  can mirror each line's own pattern in their swatches. */
export const DASHES = ["", "5 3", "1 4", "7 4", "2 2"];

/** Reduce a series to at most ~200 points for a smooth path. */
function stride<T>(arr: T[], max = 200): T[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

/** A Jalali (fa) or Gregorian (en) year label for an x position. */
function yearLabel(locale: Locale, isoMonth: string): string {
  try {
    const d = new Date(`${isoMonth}-01T00:00:00Z`);
    return new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
      { year: "numeric", timeZone: "UTC" },
    ).format(d);
  } catch {
    return isoMonth.slice(0, 4);
  }
}

/** The month of a 1-based plan month index from a start YYYY-MM. */
function isoOfMonth(startYm: string, m: number): string {
  const [y, mo] = startYm.split("-").map(Number);
  const total = y * 12 + (mo - 1) + (m - 1);
  return `${String(Math.floor(total / 12)).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function GrowthChart({
  series,
  lowSeries,
  highSeries,
  others,
  milestones,
  crossoverMonth,
  locale,
  variant = "page",
  summary,
  visible,
  labels,
  fmtValue,
  startYm,
}: GrowthChartProps & { startYm?: string }) {
  const p = variant === "print" || variant === "spark" ? INK : TOKEN;
  /* v9: the layer filters. Unset (print, spark, older callers) = all on,
   * so only the page variant can hide layers. */
  const vis: ChartVisible = visible ?? { putIn: true, growth: true, total: true, band: true };

  /* The page variant measures its box and draws 1:1 (crisp text at
     every width); print and spark are fixed-size. */
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [measuredW, setMeasuredW] = React.useState(640);
  React.useEffect(() => {
    if (variant !== "page") return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 640);
      if (w > 40) setMeasuredW(Math.max(300, Math.min(760, w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant]);

  if (series.length < 2) {
    return (
      <div ref={wrapRef}>
        <svg dir="ltr" viewBox="0 0 320 120" className="block h-auto w-full" aria-hidden="true" />
      </div>
    );
  }

  /* The spark variant: a compact stacked area, nothing else. */
  if (variant === "spark") {
    const W = 320;
    const H = 96;
    const pts = stride(series);
    const maxV = Math.max(...series.map((s) => s.value), 1);
    const x = (i: number) => (i / (pts.length - 1)) * (W - 4) + 2;
    const y = (v: number) => H - 4 - (v / maxV) * (H - 12);
    const putPath =
      `M${x(0)},${y(pts[0].putIn)}` +
      pts.map((s, i) => `L${x(i)},${y(s.putIn)}`).join("") +
      `L${x(pts.length - 1)},${H}L${x(0)},${H}Z`;
    const valPath =
      `M${x(0)},${y(pts[0].value)}` +
      pts.map((s, i) => `L${x(i)},${y(s.value)}`).join("") +
      `L${x(pts.length - 1)},${y(pts[pts.length - 1].putIn)}` +
      pts.map((s, i) => `L${x(pts.length - 1 - i)},${y(pts[pts.length - 1 - i].putIn)}`).join("") +
      `Z`;
    return (
      <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={summary ?? ""}>
        <path d={putPath} fill={p.putInFill} opacity={0.9} />
        <path d={valPath} fill={p.growthFill} opacity={0.85} />
        <path
          d={`M${x(0)},${y(pts[0].value)}` + pts.map((s, i) => `L${x(i)},${y(s.value)}`).join("")}
          fill="none"
          stroke={p.valueLine}
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  /* The full chart, drawn 1:1 in real pixels. */
  const W = variant === "print" ? 660 : measuredW;
  const H = variant === "print" ? 240 : 250;
  const padL = 8;
  const padR = Math.min(104, Math.max(78, Math.round(W * 0.16))); // room for end labels
  const padT = 18;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const start = startYm ?? (() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  /* v9: the y scale fits only what is drawn — hidden layers (and the
     hidden comparison lines the caller already filtered out of `others`)
     must not squash the visible ones. */
  const planDrawn = vis.putIn || vis.growth || vis.total;
  const maxCandidate = Math.max(
    ...(planDrawn ? [series[series.length - 1].value] : []),
    ...(vis.band && highSeries ? [highSeries[highSeries.length - 1].value] : []),
    ...(others.map((o) => o.series[o.series.length - 1]?.value ?? 0)),
  );
  const maxV = Math.max(maxCandidate * 1.06, 1);
  const n = series.length;

  const pts = stride(series);
  const xOf = (m: number) => padL + ((m - 1) / (n - 1)) * plotW;
  const yOf = (v: number) => padT + plotH - (v / maxV) * plotH;
  const xi = (i: number) => padL + (i / (pts.length - 1)) * plotW;

  const linePath = pts.map((s, i) => `${i === 0 ? "M" : "L"}${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`).join("");
  const putLinePath = pts.map((s, i) => `${i === 0 ? "M" : "L"}${xi(i).toFixed(1)},${yOf(s.putIn).toFixed(1)}`).join("");
  const growthArea =
    `M${xi(0)},${yOf(pts[0].value)}` +
    pts.map((s, i) => `L${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`).join("") +
    pts
      .slice()
      .reverse()
      .map((s, i) => `L${xi(pts.length - 1 - i).toFixed(1)},${yOf(s.putIn).toFixed(1)}`)
      .join("") +
    "Z";
  const putArea =
    `M${xi(0)},${yOf(pts[0].putIn)}` +
    pts.map((s, i) => `L${xi(i).toFixed(1)},${yOf(s.putIn).toFixed(1)}`).join("") +
    `L${xi(pts.length - 1).toFixed(1)},${yOf(0).toFixed(1)}L${xi(0).toFixed(1)},${yOf(0).toFixed(1)}Z`;

  // The band between the low and the high run.
  let bandPath = "";
  if (lowSeries && highSeries && lowSeries.length > 1 && highSeries.length > 1) {
    const lo = stride(lowSeries);
    const hi = stride(highSeries);
    bandPath =
      `M${padL},${yOf(hi[0].value)}` +
      hi.map((s, i) => `L${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`).join("") +
      lo
        .slice()
        .reverse()
        .map((s, i) => `L${xi(lo.length - 1 - i).toFixed(1)},${yOf(s.value).toFixed(1)}`)
        .join("") +
      "Z";
  }

  // X ticks: about five year marks along the plan.
  const ticks: Array<{ m: number; label: string }> = [];
  const tickCount = Math.min(5, Math.max(2, Math.floor(n / 12)));
  for (let i = 0; i <= tickCount; i++) {
    const m = 1 + Math.round(((n - 1) * i) / tickCount);
    ticks.push({ m, label: yearLabel(locale, isoOfMonth(start, m)) });
  }

  // Milestone markers (only the shown ones land here). The y is clamped
  // into the plot: with v9's visible-only scale, a milestone of a hidden
  // larger plan can sit above the top edge — it hugs the edge instead of
  // vanishing (the value label still tells the number).
  const yInPlot = (y: number) => Math.max(padT + 3, Math.min(padT + plotH, y));
  const milestoneMarks = milestones
    .map((ms) => {
      const at = series[ms.month - 1];
      if (!at) return null;
      return { x: xOf(ms.month), y: yInPlot(yOf(at.value)), label: fmtValue ? fmtValue(ms.threshold) : String(ms.threshold) };
    })
    .filter(Boolean) as Array<{ x: number; y: number; label: string }>;

  const crossX = crossoverMonth !== null ? xOf(crossoverMonth) : null;
  const crossY = crossoverMonth !== null && series[crossoverMonth - 1] ? yInPlot(yOf(series[crossoverMonth - 1].putIn)) : null;
  // Keep the crossover label off the left edge.
  const crossLabelAnchor =
    crossX !== null && crossX < padL + plotW * 0.3 ? "start" : crossX !== null && crossX > padL + plotW * 0.86 ? "end" : "middle";
  const crossLabelX = crossX !== null ? (crossLabelAnchor === "start" ? crossX + 5 : crossLabelAnchor === "end" ? crossX - 5 : crossX) : 0;

  /* The end labels (the lines' right-edge names), laid out without
     collisions: sort by y, then push neighbours apart. */
  interface EndLabel {
    y: number;
    text: string;
    color: string;
    size: number;
    weight: number;
  }
  const endLabels: EndLabel[] = [];
  others.forEach((o, idx) => {
    const oPts = stride(o.series);
    if (oPts.length < 2) return;
    endLabels.push({
      y: yOf(oPts[oPts.length - 1].value),
      text: o.label,
      color: p.textMuted,
      size: 10,
      weight: 400,
    });
    void idx;
  });
  if (labels && vis.band && lowSeries && highSeries && lowSeries.length > 1 && highSeries.length > 1) {
    endLabels.push({ y: yOf(stride(highSeries).slice(-1)[0].value) - 7, text: labels.bandHigh, color: p.textMuted, size: 9.5, weight: 400 });
    endLabels.push({ y: yOf(stride(lowSeries).slice(-1)[0].value) + 7, text: labels.bandLow, color: p.textMuted, size: 9.5, weight: 400 });
  }
  if (labels && (vis.growth || vis.total)) {
    endLabels.push({ y: yOf(pts[pts.length - 1].value), text: labels.value, color: p.valueLine, size: 10.5, weight: 700 });
  }
  if (labels && vis.putIn) {
    endLabels.push({ y: yOf(pts[pts.length - 1].putIn), text: labels.putIn, color: p.textMuted, size: 10, weight: 600 });
  }
  endLabels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) {
    const minGap = 11;
    if (endLabels[i].y - endLabels[i - 1].y < minGap) {
      endLabels[i].y = endLabels[i - 1].y + minGap;
    }
  }
  // Keep the pushed labels inside the plot's vertical bounds.
  for (const l of endLabels) {
    l.y = Math.max(padT + 4, Math.min(padT + plotH - 2, l.y));
  }

  return (
    <div ref={wrapRef}>
      <svg
        dir="ltr"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block"
        role="img"
        aria-label={summary ?? ""}
      >
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={padL + plotW}
            y1={padT + plotH * f}
            y2={padT + plotH * f}
            stroke={p.grid}
            strokeWidth={1}
            strokeDasharray="2 5"
          />
        ))}

        {/* the what-if band (v9: hideable) */}
        {vis.band && bandPath ? <path d={bandPath} fill={p.bandFill} fillOpacity={0.12} /> : null}
        {vis.band && lowSeries && lowSeries.length > 1 ? (
          <path
            d={stride(lowSeries).map((s, i) => `${i === 0 ? "M" : "L"}${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`).join("")}
            fill="none"
            stroke={p.bandEdge}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.7}
          />
        ) : null}
        {vis.band && highSeries && highSeries.length > 1 ? (
          <path
            d={stride(highSeries).map((s, i) => `${i === 0 ? "M" : "L"}${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`).join("")}
            fill="none"
            stroke={p.bandEdge}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.7}
          />
        ) : null}

        {/* thin lines: the other assets and cash */}
        {others.map((o, idx) => {
          const oPts = stride(o.series);
          if (oPts.length < 2) return null;
          const d = oPts
            .map((s, i) => `${i === 0 ? "M" : "L"}${xi(i).toFixed(1)},${yOf(s.value).toFixed(1)}`)
            .join("");
          return (
            <g key={o.label}>
              <path
                d={d}
                fill="none"
                stroke={o.cash ? p.cashLine : p.otherLine}
                strokeWidth={o.cash ? 1.2 : 1.1}
                strokeDasharray={o.cash ? "1 3" : DASHES[(o.dash ?? idx) % DASHES.length]}
              />
            </g>
          );
        })}

        {/* the stacked areas (v9: each layer hideable; the geometry is
            unchanged — the growth area keeps its own lower boundary so
            toggling never reshapes the curves) */}
        {vis.putIn ? <path d={putArea} fill={p.putInFill} fillOpacity={0.16} /> : null}
        {vis.growth ? <path d={growthArea} fill={p.growthFill} fillOpacity={0.22} /> : null}
        {vis.putIn ? <path d={putLinePath} fill="none" stroke={p.putInLine} strokeWidth={1.4} /> : null}
        {vis.total ? <path d={linePath} fill="none" stroke={p.valueLine} strokeWidth={2} strokeLinejoin="round" /> : null}

        {/* every end label, collision-free */}
        {endLabels.map((l, i) => (
          <text
            key={`${l.text}-${i}`}
            x={padL + plotW + 5}
            y={l.y}
            fontSize={l.size}
            fontWeight={l.weight}
            fill={l.color}
            dominantBaseline="middle"
          >
            {l.text}
          </text>
        ))}

        {/* the crossover mark */}
        {crossX !== null && crossY !== null && labels ? (
          <g>
            <line x1={crossX} x2={crossX} y1={padT + 14} y2={padT + plotH} stroke={p.crossover} strokeWidth={1} strokeDasharray="4 4" opacity={0.8} />
            <circle cx={crossX} cy={crossY} r={3.5} fill="none" stroke={p.crossover} strokeWidth={1.6} />
            <text x={crossLabelX} y={padT + 8} fontSize={9.5} fill={p.crossover} textAnchor={crossLabelAnchor}>
              {labels.crossover}
            </text>
          </g>
        ) : null}

        {/* milestone markers */}
        {milestoneMarks.map((mk, i) => (
          <g key={i}>
            <circle cx={mk.x} cy={mk.y} r={2.6} fill={p.milestone} />
            <text x={mk.x} y={mk.y - 7} fontSize={9} fill={p.milestone} textAnchor="middle">
              {mk.label}
            </text>
          </g>
        ))}

        {/* x axis */}
        <line x1={padL} x2={padL + plotW} y1={padT + plotH} y2={padT + plotH} stroke={p.grid} strokeWidth={1} />
        {ticks.map((t, i) => (
          <text
            key={i}
            x={xOf(t.m)}
            y={H - 7}
            fontSize={10}
            fill={p.text}
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
          >
            {t.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
