"use client";

/**
 * The comparison band — gold against the alternatives, five years.
 *
 * The owner's chart: the 10-year real yield, silver, Bitcoin and the
 * S&P 500, one line each, from today back up to five years — with gold
 * itself for reference. Every line is indexed to 100 at the window's
 * start so one chart holds them all; the real yield is a rate, not an
 * asset, so its line rides its own honest right axis at the true %
 * level. Each line can be toggled off and on (gold against the S&P
 * alone, or any subset), the lines ride a heavier stroke than the
 * house default, and the window's own scorecard — each item's start,
 * now and change in one table — sits under the chart because graphs
 * are hard to read numbers from. Served from /api/gold/compare (the
 * desk's own stitched gold window + the public Yahoo/FRED legs,
 * weekly sampled), fail-closed: legs that did not arrive are absent.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, TraceChart, type TraceSeriesDef } from "@/components/gold-page/visuals";
import type { ComparePayload } from "@/lib/gold-page/compare";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

type CmpT = {
  eyebrow: string;
  title: string;
  subtitle: string;
  windowLabel: string;
  ranges: Record<"3M" | "6M" | "YTD" | "1Y" | "3Y" | "5Y", string>;
  bestLine: string;
  worstLine: string;
  bestLossLine: string;
  worstLossLine: string;
  assets: { gold: string; silver: string; btc: string; spx: string; realYield: string };
  toggleLabel: string;
  tableTitle: string;
  colAsset: string;
  colStart: string;
  colEnd: string;
  colChange: string;
  unitPp: string;
  unavailable: string;
};

type LineId = "gold" | "silver" | "btc" | "spx" | "realYield";

/** The display order + the token colour of every line. */
const LINE_ORDER: ReadonlyArray<{ id: LineId; color: string; dashed?: boolean }> = [
  { id: "gold", color: "var(--color-accent-gold-strong)" },
  { id: "realYield", color: "var(--color-status-context)", dashed: true },
  { id: "silver", color: "var(--color-text-secondary)" },
  { id: "btc", color: "var(--color-currena-blue)" },
  { id: "spx", color: "var(--color-chip-ink-context)" },
];

type WindowKey = "3M" | "6M" | "YTD" | "1Y" | "3Y" | "5Y";
/* the chips' own order — the YTD (since the start of the Gregorian year)
   sits between 6 months and 1 year, everywhere the windows are listed */
const WINDOW_ORDER: ReadonlyArray<WindowKey> = ["3M", "6M", "YTD", "1Y", "3Y", "5Y"];
/* the window's own span, in months — 3 and 6 ride alongside the years; the
   YTD window cuts at the first day of the Gregorian year instead */
const WINDOW_MONTHS: Record<Exclude<WindowKey, "YTD">, number> = { "3M": 3, "6M": 6, "1Y": 12, "3Y": 36, "5Y": 60 };
/** The cutoff instant — `months` back from the series' own last point, or
 *  the first day of the last point's Gregorian year for the YTD window. */
function cutoffOf(lastDate: string, w: WindowKey): number {
  if (w === "YTD") {
    const year = Number(lastDate.slice(0, 4));
    return Date.parse(`${year}-01-01T00:00:00Z`);
  }
  return Date.parse(`${lastDate}T00:00:00Z`) - (WINDOW_MONTHS[w] * 365.25 / 12) * 86_400_000;
}

async function fetchCompareApi(): Promise<ComparePayload> {
  const res = await fetch(`${deskBasePath}/api/gold/compare`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The comparison API responded with ${res.status}`);
  return res.json() as Promise<ComparePayload>;
}

/** Index a series to 100 at its start, sliced to the window's own span. */
function indexTo100(points: ReadonlyArray<{ d: string; v: number }>, w: WindowKey): Array<{ d: string; v: number }> | null {
  const cutoff = cutoffOf(points[points.length - 1]!.d, w);
  const slice = points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
  if (slice.length < 2) return null;
  const base = slice[0]!.v;
  if (!Number.isFinite(base) || base === 0) return null;
  return slice.map((p) => ({ d: p.d, v: (p.v / base) * 100 }));
}

export function CompareBand({ t, locale, fmt }: { t: CmpT; locale: Locale; fmt: Fmt }) {
  const [window, setWindow] = React.useState<WindowKey>("5Y");
  /* which lines ride the chart — every asset on by default, each one
     toggleable (gold against the S&P alone, or any subset) */
  const [enabled, setEnabled] = React.useState<Record<LineId, boolean>>({
    gold: true,
    realYield: true,
    silver: true,
    btc: true,
    spx: true,
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["currena-gold-compare"],
    queryFn: fetchCompareApi,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  /* every ASSET indexed to 100 at the window's start (left axis); the real
     yield rides its own honest right axis at its true % level — a rate is
     not an asset, and the dual axis says so instead of a nonsense index.
     The lines ride a heavier stroke (the owner asked for a little more
     width). */
  const series = React.useMemo(() => {
    if (data === undefined) return [];
    const out: TraceSeriesDef[] = [];
    for (const line of LINE_ORDER) {
      if (!enabled[line.id]) continue;
      const leg = data.legs.find((l) => l.id === line.id);
      if (leg === undefined) continue;
      if (line.id === "realYield") {
        const cutoff = cutoffOf(leg.points[leg.points.length - 1]!.d, window);
        const slice = leg.points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
        if (slice.length < 2) continue;
        out.push({
          label: t.assets[line.id],
          color: line.color,
          points: slice,
          dashed: true,
          lineWidth: 1.9,
          axis: "right",
          format: (v: number) => `${fmt.num(v, 2)}%`,
        });
        continue;
      }
      const indexed = indexTo100(leg.points, window);
      if (indexed === null) continue;
      out.push({ label: t.assets[line.id], color: line.color, points: indexed, dashed: line.dashed, lineWidth: 2.8 });
    }
    return out;
  }, [data, window, enabled, t.assets, fmt]);

  /* the scorecard's own rows — each leg's start level, now level and the
     window's change, read as numbers because graphs are hard to read */
  const rows = React.useMemo(() => {
    if (data === undefined) return [];
    return LINE_ORDER.map((line) => {
      const leg = data.legs.find((l) => l.id === line.id);
      if (leg === undefined) return null;
      const cutoff = cutoffOf(leg.points[leg.points.length - 1]!.d, window);
      const slice = leg.points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
      if (slice.length < 2) return null;
      if (line.id === "realYield") {
        const delta = slice[slice.length - 1]!.v - slice[0]!.v;
        return { line, name: t.assets[line.id], pct: null, start: slice[0]!.v, end: slice[slice.length - 1]!.v, deltaPp: Number.isFinite(delta) ? delta : null };
      }
      const pct = (slice[slice.length - 1]!.v / slice[0]!.v - 1) * 100;
      return { line, name: t.assets[line.id], pct: Number.isFinite(pct) ? pct : null, start: slice[0]!.v, end: slice[slice.length - 1]!.v, deltaPp: null };
    }).filter((r) => r !== null) as Array<{ line: (typeof LINE_ORDER)[number]; name: string; pct: number | null; start: number; end: number; deltaPp: number | null }>;
  }, [data, window, t.assets]);
  /* the window's best and the worst (the assets' own % change; the real
     yield is a rate and never joins the contest) — named, with the
     number, for the one-line summary above the scorecard */
  const extremes = React.useMemo(() => {
    const ranked = rows.filter((r) => r.pct !== null && r.line.id !== "realYield");
    if (ranked.length < 2) return { best: null as string | null, worst: null as string | null, bestId: null as string | null, worstId: null as string | null, bestPct: null as number | null, worstPct: null as number | null };
    const sorted = [...ranked].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
    const best = sorted[sorted.length - 1]!;
    const worst = sorted[0]!;
    return { best: best.name, worst: worst.name, bestId: best.line.id, worstId: worst.line.id, bestPct: best.pct, worstPct: worst.pct };
  }, [rows]);

  return (
    <section id="gold-compare" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the window chips + the line toggles */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={t.windowLabel}>
        {WINDOW_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={window === key}
            onClick={() => setWindow(key)}
            className={`rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${
              window === key
                ? "bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
            }`}
          >
            {t.ranges[key]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={t.toggleLabel}>
        {LINE_ORDER.map((line) => {
          const leg = data?.legs.find((l) => l.id === line.id);
          const on = enabled[line.id];
          return (
            <button
              key={line.id}
              type="button"
              aria-pressed={on}
              disabled={leg === undefined}
              onClick={() => setEnabled((e) => ({ ...e, [line.id]: !e[line.id] }))}
              className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-colors ${
                leg === undefined
                  ? "cursor-default bg-[var(--color-surface)] text-[var(--color-text-tertiary)]/60 ring-1 ring-[var(--color-border)]/60"
                  : on
                    ? "bg-[var(--color-currena-soft)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)]"
              }`}
            >
              <span aria-hidden="true" className={`inline-block h-[3px] w-[14px] rounded-full ${on ? "" : "opacity-30"}`} style={{ background: line.color }} />
              {t.assets[line.id]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">…</p>
      ) : isError || data === undefined || data.legs.length === 0 ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      ) : (
        <>
          <div className="mt-2.5">
            <TraceChart
              series={series}
              height={230}
              baseline={100}
              yFormat={(v) => fmt.num(v, 0)}
              yFormatRight={(v) => `${fmt.num(v, 1)}%`}
              fmt={fmt}
              ariaLabel={t.title}
              hoverNote={(s, v, first) =>
                s.axis === "right" ? null : first > 0 ? fmt.pct((v / first - 1) * 100) : null
              }
            />
          </div>

          {/* the scorecard — the window's gains and losses, in numbers */}
          {rows.length > 0 ? (
            <div className="mt-3">
              <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.tableTitle}</h4>
              {/* THE one-line summary — the window's own best and worst,
                  named, loss-aware: a loss is called a loss (بیشترین ضرر),
                  only a real gain is ever called a gain */}
              {extremes.best !== null && extremes.worst !== null && extremes.bestPct !== null && extremes.worstPct !== null ? (
                <p className="m-0 mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 type-caption font-bold">
                  {extremes.bestPct >= 0 ? (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-up)]/12 px-2.5 py-1 text-[var(--color-return-up)]">
                      {t.bestLine.replace("{name}", extremes.best).replace("{pct}", fmt.pct(extremes.bestPct, 1))}
                    </span>
                  ) : (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-down)]/10 px-2.5 py-1 text-[var(--color-text-secondary)] ring-1 ring-[var(--color-return-down)]/25">
                      {t.bestLossLine.replace("{name}", extremes.best).replace("{pct}", fmt.pct(extremes.bestPct, 1))}
                    </span>
                  )}
                  {extremes.worstPct < 0 ? (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-down)]/12 px-2.5 py-1 text-[var(--color-return-down)]">
                      {t.worstLossLine.replace("{name}", extremes.worst).replace("{pct}", fmt.pct(extremes.worstPct, 1))}
                    </span>
                  ) : (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-2.5 py-1 text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                      {t.worstLine.replace("{name}", extremes.worst).replace("{pct}", fmt.pct(extremes.worstPct, 1))}
                    </span>
                  )}
                </p>
              ) : null}
              <div className="mt-1.5 min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
                <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption">
                  <thead>
                    <tr className="text-[var(--color-text-tertiary)]">
                      <th scope="col" className="px-2 py-1.5 text-start font-bold">{t.colAsset}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colStart}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colEnd}</th>
                      <th scope="col" className="px-2 py-1.5 text-end font-bold">{t.colChange}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isYield = row.line.id === "realYield";
                      const money = row.line.id === "gold" || row.line.id === "silver" || row.line.id === "btc";
                      const fmtLevel = (v: number) =>
                        isYield ? `${fmt.num(v, 2)}%` : money ? `$${fmt.num(v, 2)}` : fmt.num(v, 2);
                      /* the window's own extremes — the best and the worst
                         highlighted with their own backgrounds */
                      const isBest = extremes.bestId === row.line.id;
                      const isWorst = extremes.worstId === row.line.id;
                      return (
                        <tr
                          key={row.line.id}
                          className={`border-t border-[var(--color-border)] ${enabled[row.line.id] ? "" : "opacity-55"}`}
                          style={
                            isBest
                              ? { backgroundColor: "color-mix(in srgb, var(--color-return-up) 12%, transparent)", boxShadow: "inset 2px 0 0 var(--color-return-up)" }
                              : isWorst
                                ? { backgroundColor: "color-mix(in srgb, var(--color-return-down) 12%, transparent)", boxShadow: "inset 2px 0 0 var(--color-return-down)" }
                                : undefined
                          }
                        >
                          <th scope="row" className="px-2 py-1.5 text-start font-bold">
                            <span className="inline-flex items-center gap-1.5">
                              <span aria-hidden="true" className="inline-block h-[3px] w-[14px] rounded-full" style={{ background: row.line.color }} />
                              <span className="text-[var(--color-text-primary)]">{row.name}</span>
                            </span>
                          </th>
                          <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">
                            <bdi dir="ltr">{fmtLevel(row.start)}</bdi>
                          </td>
                          <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                            <bdi dir="ltr">{fmtLevel(row.end)}</bdi>
                          </td>
                          <td className="px-2 py-1.5 text-end">
                            {isYield ? (
                              <bdi
                                dir="ltr"
                                className={`font-bold tabular-nums ${
                                  row.deltaPp !== null && row.deltaPp > 0
                                    ? "text-[var(--color-return-down)]"
                                    : row.deltaPp !== null && row.deltaPp < 0
                                      ? "text-[var(--color-return-up)]"
                                      : "text-[var(--color-text-secondary)]"
                                }`}
                              >
                                {row.deltaPp === null
                                  ? "·"
                                  : `${row.deltaPp > 0 ? "+" : row.deltaPp < 0 ? "−" : ""}${fmt.num(Math.abs(row.deltaPp), 2)} ${t.unitPp}`}
                              </bdi>
                            ) : (
                              <SignedDelta v={row.pct} fmt={fmt} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
