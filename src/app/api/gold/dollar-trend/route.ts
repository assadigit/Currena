import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureObservations } from "@/lib/gold/sources/eodhd";
import {
  DOLLAR_FREE_TABLE,
  RACE_START_JY,
  goldAnnualForJy,
  type DollarTrendPayload,
} from "@/lib/gold-page/dollar-trend";
import { LAST_COMPLETE_YEAR } from "@/lib/gold-page/longview";

/**
 * GET /api/gold/dollar-trend — «روند نرخ طلا در برابر دلار»'s own data
 * leg: the ۱۳۵۷-to-today race between gold and the dollar in Iran,
 * both marked in toman.
 *
 * THE DATA PLANE (all bases named in the payload, each labelled at
 * point of use on the card):
 *
 *   dollar  ۱۳۵۷→۱۳۸۹  the cited static free-market table (Wikipedia
 *                      fa, cross-checked against jamaran — see the
 *                      lib module's own citation block)
 *           ۱۳۹۰→today  TGJU price_dollar_rl daily rows pivoted to
 *                      Jalali year-ends (the last row before each
 *                      Farvardin ۱ — TGJU's own Jalali column is the
 *                      authority; rial ÷ 10 = toman)
 *   gold18  ۱۳۵۷→۱۳۹۱  parity-derived: GOLD_ANNUAL × the same dollar
 *                      leg ÷ 31.1034768 × 0.75 («برآورد برابری»,
 *                      never a market price)
 *           ۱۳۹۲→today  TGJU geram18 daily rows, same year-end pivot
 *                      («بازار تهران»)
 *   goldUsd ۱۳۵۷→…     the GOLD_ANNUAL slice (each Jalali year reads
 *                      the Gregorian year it starts in) + the running
 *                      year at the desk's own live spot — one number
 *                      with the desk, never two
 *
 * Where both exist (the ۱۳۹۰ overlap) the live TGJU row wins over
 * the static table — the house's live-over-backfill rule. Fail-closed
 * per leg: a TGJU leg that fails is absent, never zero — the static
 * layer always serves and the live tail simply ends where the data
 * ends. Memory-cached 5 minutes. The route serves data, never
 * arithmetic — the page computes the race, the winners, the
 * decoupling, the sync and the premium arc client-side through the
 * pure engine.
 */

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 20_000;

/** TGJU's free-market dollar (the Tehran board's own source). */
const TGJU_DOLLAR_URL =
  "https://api.tgju.org/v1/market/indicator/summary-table-data/price_dollar_rl?lang=fa&formated=1&responseType=full";

/** TGJU's 18-عیار gold gram — the Tehran market's own quote. */
const TGJU_GERAM18_URL =
  "https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?lang=fa&formated=1&responseType=full";

/** The geram18 era's first Jalali year (its daily rows start
 *  2013-07-22 = Mordad ۱۳۹۲; its first year-end is ۱۳۹۲'s own) — the
 *  parity era ends one year earlier. Data-driven: if the live leg
 *  ever arrives with earlier history, the era boundary follows the
 *  data, never this constant alone. */
const GERAM18_FIRST_JY = 1392;

interface LegEntry {
  at: number;
  value: unknown;
}

const globalForTrend = globalThis as unknown as {
  __currenaDollarTrend?: LegEntry;
};
const trendCache: LegEntry | undefined = globalForTrend.__currenaDollarTrend;
globalForTrend.__currenaDollarTrend = trendCache;

interface TgjuResponse {
  data?: unknown;
}

/** One leg's pivoted answer: the year-end rows + the newest row. */
interface PivotedLeg {
  /** Year-end closes per COMPLETE Jalali year (jy < the running
   *  year), oldest first — the last daily row before each Farvardin ۱
   *  (TGJU's own Jalali column does the labelling; off-by-one
   *  boundary days are harmless by this rule). */
  yearEnds: { jy: number; toman: number; date: string }[];
  /** The leg's newest daily row (the running year's own live value). */
  newest: { jy: number; toman: number; date: string } | null;
}

/** Fetch one TGJU indicator and pivot its daily rows to Jalali
 *  year-ends (toman). Null when the leg cannot be read — never a
 *  guess. */
async function fetchTgjuLeg(url: string): Promise<PivotedLeg | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as TgjuResponse;
    const rows = json.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    // Each row: [open, low, high, close, change, change%, "YYYY/MM/DD",
    // "JJJJ/MM/DD"] — the daily rows run NEWEST-FIRST. TGJU quotes
    // RIAL: ÷ 10 = toman.
    const byJy = new Map<number, { jy: number; toman: number; date: string }>();
    let newest: { jy: number; toman: number; date: string } | null = null;
    // walk oldest → newest so each Jalali year's LAST row wins its key
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (!Array.isArray(r)) continue;
      const closeRaw = r[3];
      const dateRaw = r[6];
      const jalaliRaw = r[7];
      if (typeof closeRaw !== "string" || typeof dateRaw !== "string" || typeof jalaliRaw !== "string") continue;
      const close = Number(closeRaw.replace(/,/g, ""));
      const jy = Number(jalaliRaw.split("/")[0]);
      const date = dateRaw.replace(/\//g, "-");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (!Number.isFinite(close) || close <= 0 || !Number.isInteger(jy) || jy < 1300 || jy > 1500) continue;
      const toman = close / 10;
      newest = { jy, toman, date };
      byJy.set(jy, newest);
    }
    if (newest === null || byJy.size === 0) return null;
    const runningJy = newest.jy;
    const yearEnds = [...byJy.entries()]
      .filter(([jy]) => jy < runningJy)
      .map(([jy, v]) => ({ jy, toman: v.toman, date: v.date }))
      .sort((a, b) => a.jy - b.jy);
    return { yearEnds, newest };
  } catch {
    return null;
  }
}

/** The desk's own live gold spot (USD/oz) off the observation store —
 *  the same store /api/gold serves, so the desk's number and this
 *  section's number are one number. Null when the store is empty. */
async function liveSpot(): Promise<number | null> {
  try {
    try {
      await ensureObservations();
    } catch {
      /* a sync failure never breaks the read — the store serves what it holds */
    }
    const row = await db.observation.findFirst({
      where: { dataset: "gold" },
      orderBy: { date: "desc" },
    });
    return row !== null && Number.isFinite(row.close) && row.close > 0 ? row.close : null;
  } catch {
    return null;
  }
}

/** The running Jalali year off the clock (the March-۲۱ approximation —
 *  honest enough for the fail-closed case where TGJU's own Jalali
 *  column, the real authority, did not arrive). */
function clockJalaliYear(): number {
  const now = new Date();
  const gy = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const started = m > 3 || (m === 3 && d >= 21);
  return started ? gy - 621 : gy - 622;
}

export async function GET() {
  const hit = globalForTrend.__currenaDollarTrend;
  if (hit !== undefined && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.value, { headers: { "cache-control": "no-store" } });
  }

  try {
    const [dollarLeg, goldLeg] = await Promise.all([
      fetchTgjuLeg(TGJU_DOLLAR_URL),
      fetchTgjuLeg(TGJU_GERAM18_URL),
    ]);
    const spot = await liveSpot();

    /* the running year: TGJU's newest row's own Jalali year when a leg
       arrived (the two legs share the calendar), else the clock */
    const runningJy = Math.max(
      dollarLeg?.newest?.jy ?? 0,
      goldLeg?.newest?.jy ?? 0,
      clockJalaliYear(),
    );

    /* asOf: TGJU's newest row date (the later of the two legs); null
       when no TGJU leg arrived — the static layer still serves */
    const asOfDates = [dollarLeg?.newest?.date ?? "", goldLeg?.newest?.date ?? ""].filter((s) => s !== "");
    const asOf = asOfDates.length > 0 ? asOfDates.sort().at(-1)! : null;

    /* the dollar leg: the static table where TGJU has no year-end,
       TGJU's actual year-ends everywhere it has them (TGJU wins the
       ۱۳۹۰ overlap — the live-over-backfill rule) */
    const dollarByJy = new Map<number, { jy: number; toman: number; basis: "static" | "tgju" }>();
    for (const row of DOLLAR_FREE_TABLE) {
      dollarByJy.set(row.jy, { jy: row.jy, toman: row.toman, basis: "static" });
    }
    for (const row of dollarLeg?.yearEnds ?? []) {
      dollarByJy.set(row.jy, { jy: row.jy, toman: row.toman, basis: "tgju" });
    }

    /* the gold leg: parity up to the geram18 era's first year − 1,
       then TGJU geram18's actual market year-ends. The era boundary
       follows the data when the live leg carries earlier history. */
    const tgjuGoldJys = (goldLeg?.yearEnds ?? []).map((r) => r.jy);
    const firstTgjuJy = tgjuGoldJys.length > 0 ? Math.min(GERAM18_FIRST_JY, Math.min(...tgjuGoldJys)) : GERAM18_FIRST_JY;
    const goldByJy = new Map<number, { jy: number; toman: number; basis: "parity" | "tgju" }>();
    for (const [jy, dRow] of dollarByJy) {
      if (jy >= firstTgjuJy) continue;
      const usdOz = goldAnnualForJy(jy);
      if (usdOz === null || dRow.toman <= 0) continue;
      const parity = (usdOz * dRow.toman * 0.75) / 31.1034768;
      goldByJy.set(jy, { jy, toman: parity, basis: "parity" });
    }
    for (const row of goldLeg?.yearEnds ?? []) {
      goldByJy.set(row.jy, { jy: row.jy, toman: row.toman, basis: "tgju" });
    }

    /* the global context line: the GOLD_ANNUAL slice — each Jalali
       year reads the Gregorian year it starts in (۱۳۵۷ → 1978); the
       running year rides the live spot, never the embed */
    const goldUsd: { jy: number; usdOz: number }[] = [];
    const lastEmbeddedJy = Math.min(
      runningJy - 1,
      LAST_COMPLETE_YEAR - 621,
    );
    for (let jy = RACE_START_JY; jy <= lastEmbeddedJy; jy++) {
      const usdOz = goldAnnualForJy(jy);
      if (usdOz !== null) goldUsd.push({ jy, usdOz });
    }

    const value: DollarTrendPayload = {
      v: 1,
      asOf,
      dollar: [...dollarByJy.values()].sort((a, b) => a.jy - b.jy),
      gold18: [...goldByJy.values()].sort((a, b) => a.jy - b.jy),
      goldUsd,
      running: {
        jy: runningJy,
        dollarToman: dollarLeg?.newest?.toman ?? null,
        gold18Toman: goldLeg?.newest?.toman ?? null,
        goldUsdOz: spot,
        live: true,
      },
    };

    globalForTrend.__currenaDollarTrend = { at: Date.now(), value };
    return NextResponse.json(value, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500 },
    );
  }
}
