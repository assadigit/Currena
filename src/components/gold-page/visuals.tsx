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
      ? "—"
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
}

/** The neutral sparkline (never tinted by direction; direction rides the signed delta beside it). */
export function Sparkline({ values, width = 300, height = 64, color = "var(--color-accent-gold-strong)", endDot = true, fill = false, ariaLabel }: SparkProps) {
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
  if (!pts) return <svg dir="ltr" width={width} height={height} aria-hidden="true" />;
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD = `${d}L${pts[pts.length - 1][0].toFixed(1)},${height}L2,${height}Z`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg dir="ltr" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={ariaLabel} role={ariaLabel ? "img" : undefined} aria-hidden={ariaLabel ? undefined : "true"}>
      {fill ? <path d={areaD} fill={color} opacity={0.12} /> : null}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      {endDot ? <circle cx={ex} cy={ey} r={3} fill={color} /> : null}
    </svg>
  );
}

/** A tiny inline spark for dashboard rows. */
export function MiniSpark({ values, color = "var(--color-text-tertiary)" }: { values: readonly number[]; color?: string }) {
  return <Sparkline values={values} width={64} height={18} color={color} endDot={false} />;
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
  if (v === null || !Number.isFinite(v)) return <bdi className="type-caption text-[var(--color-text-tertiary)]" aria-hidden={ariaHidden}>—</bdi>;
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

const DEG_OF_NET: Record<number, number> = { 0: 0, 1: 4, 2: 8, 3: 10, 4: 10, 5: 10 };

/**
 * The assay-office drawing: tapered beam on a brass column, bowl pans
 * hung plumb, one segmented-rim disc weight per lane, the not-leaning
 * tray below. The beam settles to the tilt over 650 ms (guarded by
 * prefers-reduced-motion).
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
  sideLabels: { for: string; against: string; noneFor: string; noneAgainst: string };
  locale: Locale;
  trayTitle: string;
  trayNote: string;
  fmt: Fmt;
}) {
  const forLanes = readings.filter((l) => l.side === "for");
  const againstLanes = readings.filter((l) => l.side === "against");
  const neutralLanes = readings.filter((l) => l.side === "neutral" || l.side === "unread");
  const net = forLanes.length - againstLanes.length;
  const tilt = (DEG_OF_NET[Math.abs(net)] ?? 10) * (net > 0 ? 1 : net < 0 ? -1 : 0);

  const W = 340;
  const H = 230;
  const pivotX = 170;
  const pivotY = 54;
  const arm = 118; // half-beam length
  const hang = 58; // hanger length

  const [settled, setSettled] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const rad = (settled ? tilt : 0) * (Math.PI / 180);
  const endL = { x: pivotX - arm * Math.cos(rad), y: pivotY + arm * Math.sin(rad) };
  const endR = { x: pivotX + arm * Math.cos(rad), y: pivotY + arm * Math.sin(rad) };
  const panW = 128;
  const panH = 84;
  const panL = { x: endL.x, y: endL.y + hang + panH / 2 - 6 };
  const panR = { x: endR.x, y: endR.y + hang + panH / 2 - 6 };

  const beamStyle: React.CSSProperties = {
    transform: `rotate(${settled ? tilt : 0}deg)`,
    transformOrigin: `${pivotX}px ${pivotY}px`,
    transition: "transform 650ms cubic-bezier(0.23,1,0.32,1)",
  };
  const panStyle = (pan: { x: number; y: number }): React.CSSProperties => ({
    transform: `translateY(${settled ? pan.y - (pivotY + hang + panH / 2 - 6) : 0}px)`,
    transition: "transform 650ms cubic-bezier(0.23,1,0.32,1)",
  });

  const disc = (lane: (typeof LANES)[number], key: string, cx: number, cy: number, r: number, tone: "for" | "against") => {
    const segs = 8;
    const arc = 2 * Math.PI * r;
    return (
      <g key={key}>
        <circle cx={cx} cy={cy} r={r} fill="url(#balDiscFace)" stroke={tone === "for" ? "var(--color-status-normal)" : "var(--color-status-alert)"} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bal-brass-ink)" strokeWidth={1} strokeDasharray={`${arc / segs / 2} ${arc / segs / 2}`} opacity={0.35} />
        <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--bal-brass-ink)">
          {fmt.num(LANES.indexOf(lane) + 1)}
        </text>
      </g>
    );
  };

  const panBowl = (cx: number, cy: number, tone: "for" | "against") => (
    <g>
      <path
        d={`M${cx - panW / 2},${cy - panH / 2 + 8} L${cx + panW / 2},${cy - panH / 2 + 8} L${cx + panW / 2 - 14},${cy + panH / 2} Q${cx},${cy + panH / 2 + 12} ${cx - panW / 2 + 14},${cy + panH / 2} Z`}
        fill={tone === "for" ? "color-mix(in srgb, var(--color-status-normal) 8%, transparent)" : "color-mix(in srgb, var(--color-status-alert) 8%, transparent)"}
        stroke={tone === "for" ? "var(--color-status-normal)" : "var(--color-status-alert)"}
        strokeWidth={1.2}
        opacity={0.95}
      />
      <rect x={cx - panW / 2 + 8} y={cy + panH / 2 + 1} width={panW - 16} height={5} rx={2.5} fill="var(--bal-brass-mid)" />
    </g>
  );

  return (
    <div data-balance-visual data-size="s" className="relative w-full" role="img" aria-label={`${sideLabels.againside ?? ""}`}>
      <div className="bal-glow" />
      <svg dir="ltr" viewBox={`0 0 ${W} ${H}`} className="bal-stage mx-auto block h-auto w-full max-w-[420px]" aria-hidden="true">
        <defs>
          <linearGradient id="balBeamFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--bal-brass-lo)" />
            <stop offset="0.5" stopColor="var(--bal-brass-hi)" />
            <stop offset="1" stopColor="var(--bal-brass-lo)" />
          </linearGradient>
          <linearGradient id="balDiscFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--bal-brass-hi)" />
            <stop offset="1" stopColor="var(--bal-brass-mid)" />
          </linearGradient>
          <linearGradient id="balColumnFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--bal-brass-lo)" />
            <stop offset="0.45" stopColor="var(--bal-brass-hi)" />
            <stop offset="1" stopColor="var(--bal-brass-lo)" />
          </linearGradient>
        </defs>

        {/* the column + base */}
        <rect x={pivotX - 5} y={pivotY} width={10} height={H - pivotY - 26} fill="url(#balColumnFace)" />
        <path d={`M${pivotX - 30},${H - 14} L${pivotX + 30},${H - 14} L${pivotX + 20},${H - 26} L${pivotX - 20},${H - 26} Z`} fill="url(#balBeamFace)" />

        {/* the dial under the pivot */}
        <path d={`M${pivotX - 26},${pivotY + 16} A26,26 0 0 1 ${pivotX + 26},${pivotY + 16}`} fill="none" stroke="var(--bal-stone-lo)" strokeWidth={1} />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (-80 + i * 20) * (Math.PI / 180);
          const x1 = pivotX + Math.sin(a) * 22;
          const y1 = pivotY + 22 - Math.cos(a) * 0; // arc under pivot
          const x2 = pivotX + Math.sin(a) * 26;
          const y2 = pivotY + 26;
          return <line key={i} x1={x1} y1={y1 + 4} x2={x2} y2={y2} stroke="var(--bal-stone-lo)" strokeWidth={1} />;
        })}

        {/* the beam (animated to the tilt) */}
        <g style={beamStyle}>
          <path d={`M${pivotX - arm},${pivotY - 4} L${pivotX + arm},${pivotY - 3} L${pivotX + arm},${pivotY + 4} L${pivotX - arm},${pivotY + 6} Z`} fill="url(#balBeamFace)" />
          <circle cx={pivotX} cy={pivotY} r={7} fill="var(--bal-brass-mid)" stroke="var(--bal-brass-lo)" strokeWidth={1.5} />
        </g>

        {/* the pans, hung plumb */}
        <g style={panStyle(panL)}>
          <line x1={endL.x} y1={endL.y} x2={panL.x} y2={panL.y - panH / 2 + 8} stroke="var(--bal-brass-lo)" strokeWidth={1} />
          {panBowl(panL.x, panL.y, "for")}
          {forLanes.length > 0 ? (
            <g>
              {forLanes.map((l, i) => disc(l.lane, l.lane, panL.x - 30 + i * 30, panL.y + 2, 12, "for"))}
            </g>
          ) : null}
          <text x={panL.x} y={panL.y - panH / 2 - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-chip-ink-normal)">
            {locale === "en" ? "FOR" : "نفع"}
          </text>
        </g>
        <g style={panStyle(panR)}>
          <line x1={endR.x} y1={endR.y} x2={panR.x} y2={panR.y - panH / 2 + 8} stroke="var(--bal-brass-lo)" strokeWidth={1} />
          {panBowl(panR.x, panR.y, "against")}
          {againstLanes.length > 0 ? (
            <g>
              {againstLanes.map((l, i) => disc(l.lane, l.lane, panR.x - 30 + i * 30, panR.y + 2, 12, "against"))}
            </g>
          ) : null}
          <text x={panR.x} y={panR.y - panH / 2 - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-chip-ink-attention)">
            {locale === "en" ? "AGAINST" : "ضد"}
          </text>
        </g>
      </svg>

      {/* the verdict + the not-leaning tray (HTML for real text) */}
      <p className="m-0 mt-2 text-center type-caption font-semibold" style={{ color: verdict === "against" ? "var(--color-chip-ink-attention)" : verdict === "for" ? "var(--color-chip-ink-normal)" : "var(--color-text-secondary)" }}>
        {verdict === "against" ? sideLabels.against : verdict === "for" ? sideLabels.forWord : ""}
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
 * The seats grid — 37 dials at a glance (the stadium view)
 * ------------------------------------------------------------------ */

export function SeatsGrid({ readings, locale, fmt }: { readings: readonly LaneReading[]; locale: Locale; fmt: Fmt }) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
      {readings.map((r) => (
        <div key={r.lane} className="flex min-w-[140px] flex-col gap-1">
          <span className="type-caption font-semibold text-[var(--color-text-tertiary)]">
            {LANE_CONTENT[r.lane].label[locale === "en" ? 0 : 1]}
          </span>
          <div className="flex flex-wrap gap-[5px]">
            {r.members.map((m) => {
              const ink = STATE_INK[m.state];
              return (
                <span
                  key={m.id}
                  title={undefined}
                  className="flex h-[13px] w-[13px] items-center justify-center rounded-full text-[7px] font-bold"
                  style={
                    m.state === "unread"
                      ? { border: "1.5px dotted var(--color-text-tertiary)" }
                      : { background: ink.chip, color: "var(--color-surface)" }
                  }
                  aria-hidden="true"
                >
                  {m.state === "supports" ? "▲" : m.state === "pressures" ? "▼" : ""}
                </span>
              );
            })}
          </div>
        </div>
      ))}
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
