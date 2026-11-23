import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";
import type { GoldXauCandle } from "@/lib/gold-page/ta";

/**
 * GET /api/gold/correlation — the correlation companion leg (the Zone K
 * closing panel the previous gold page carried): the dual-axis pair
 * (gold daily closes vs the 10-year real yield, NOT inverted — the
 * reader sees the pre-2022 mirror and the post-2022 divergence with
 * their own eyes) plus the 52-week rolling-correlation strip over
 * weekly Friday closes (levels), computed server-side over the two
 * currena-api legs (one fetch each, cached 5 min, fail-closed 503).
 *
 * The registered windows, verbatim from the upstream engine: the
 * rolling correlation is 52-week Pearson over weekly Friday closes,
 * LEVELS (not returns); the display window is the stored span (the
 * honest S13-D1 posture — the span is named in the payload and it
 * self-widens when the source plan does); the staleness bound is 7
 * calendar days; the 2022 rotation marker is 2022-02-24 (the reserve
 * freeze — the dated fact the chart annotates).
 */

export const dynamic = "force-dynamic";

const CORRELATION_WINDOW_WEEKS = 52;
const CORRELATION_STALE_AFTER_DAYS = 7;
const ROTATION_DATE = "2022-02-24";

interface OhlcSnapshot {
  series?: GoldXauCandle[];
}

interface HistorySnapshot {
  points?: Array<[number, number]>; // [dayNumber, value]
}

function dayOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

function isoOf(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Pearson r over the trailing 52 weekly closes (levels). */
function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += xs[i]!;
    sy += ys[i]!;
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

export async function GET() {
  const [ohlc, hist] = await Promise.all([
    fetchLeg<OhlcSnapshot>("/api/insights/gold-ohlc"),
    fetchLeg<HistorySnapshot>("/api/insights/real-yield-10y/history"),
  ]);
  const bars = Array.isArray(ohlc?.series) ? ohlc!.series! : [];
  const points = Array.isArray(hist?.points) ? hist!.points! : [];
  if (bars.length < 2 || points.length < 2) {
    return NextResponse.json({ error: "The correlation data could not be read yet." }, { status: 503 });
  }

  // The inner join on calendar days (the yield leg's day numbers).
  const yieldByDay = new Map<number, number>();
  for (const p of points) {
    if (Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number") {
      yieldByDay.set(p[0], p[1]);
    }
  }
  const daily: Array<{ date: string; gold: number; yield10y: number }> = [];
  for (const b of bars) {
    const y = yieldByDay.get(dayOf(b.date));
    if (y !== undefined) daily.push({ date: b.date, gold: b.close, yield10y: y });
  }
  if (daily.length < 30) {
    return NextResponse.json({ error: "The correlation window is too short to speak yet." }, { status: 503 });
  }

  // The weekly Friday-close samples (the registered sampling — the last
  // stored day of each ISO week, dated by its own Friday when present).
  const fridays: Array<{ friday: string; gold: number; yield10y: number }> = [];
  let weekStart = -1;
  let lastOfDay: { date: string; gold: number; yield10y: number } | null = null;
  for (const p of daily) {
    const d = dayOf(p.date);
    const ws = d - ((d + 3) % 7); // Monday of the ISO week (UTC)
    if (ws !== weekStart) {
      if (lastOfDay !== null) fridays.push({ friday: lastOfDay.date, gold: lastOfDay.gold, yield10y: lastOfDay.yield10y });
      weekStart = ws;
    }
    lastOfDay = p;
  }
  if (lastOfDay !== null) fridays.push({ friday: lastOfDay.date, gold: lastOfDay.gold, yield10y: lastOfDay.yield10y });

  // The 52-week rolling correlation strip (levels).
  const strip: Array<{ friday: string; r: number }> = [];
  for (let i = CORRELATION_WINDOW_WEEKS - 1; i < fridays.length; i += 1) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let j = i - CORRELATION_WINDOW_WEEKS + 1; j <= i; j += 1) {
      xs.push(fridays[j]!.gold);
      ys.push(fridays[j]!.yield10y);
    }
    const r = pearson(xs, ys);
    if (r !== null) strip.push({ friday: fridays[i]!.friday, r });
  }

  // The staleness check (the universal rider): either leg past its
  // bound fails the whole panel closed.
  const nowDay = dayOf(new Date().toISOString().slice(0, 10));
  const goldAge = nowDay - dayOf(daily[daily.length - 1]!.date);
  const yieldAge = nowDay - dayOf(isoOf(points[points.length - 1]![0]));
  const stale = goldAge > CORRELATION_STALE_AFTER_DAYS || yieldAge > CORRELATION_STALE_AFTER_DAYS;

  return NextResponse.json(
    {
      daily: daily.map((p) => [p.date, p.gold, p.yield10y]),
      strip,
      span: { from: daily[0]!.date, to: daily[daily.length - 1]!.date, days: daily.length, weeks: fridays.length },
      rotation: { date: ROTATION_DATE, inWindow: dayOf(ROTATION_DATE) >= dayOf(daily[0]!.date) },
      stale,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
