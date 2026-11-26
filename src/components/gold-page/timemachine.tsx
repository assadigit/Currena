"use client";

/**
 * The time machine — the Zone C Advanced control the previous gold page
 * carried (upstream `GoldTimeMachine`, GPE R31 / F12), restored: a
 * date-parameterized, READINGS-ONLY meter view. The picked day's beam,
 * lane counts and lane readings under the THEN-CURRENT versioned voter
 * table — the ONLY historical-meter surface; the 2016+ era boundary is
 * never crossed (the picker's own min + the route's own rejection).
 *
 * Collapsed on desktop AND 390 (the daily reader pays nothing); one tap
 * expands the control. The verdict + lane words reuse the page's own
 * balance vocabulary — never a parallel dictionary. Provenance states
 * whether the row is a backfill reconstruction or the day's own live
 * snapshot. Display-only: no meter membership, no voter, no forecast.
 */

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Locale, LaneId } from "@/lib/gold-page/content";
import { LANE_CONTENT } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta } from "@/components/gold-page/visuals";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/** The meter-era bound — the wire contract's own constant. */
const ERA_START = "2016-11-01";

/* the what-if windows — 1 week / 1 month / 3 months / 6 months / 1 year /
   5 years, the table's own rows (day and YTD never join it) */
const IF_WINDOWS = ["7D", "30D", "3M", "6M", "1Y", "5Y"] as const;
type IfWindow = (typeof IF_WINDOWS)[number];

/** The trend leg's own payload (from /api/gold/trend?range=all). */
interface TrendPoint {
  d: string;
  v: number;
}
interface TrendWindowPayload {
  range: string;
  asOf: string;
  spot: number;
  points: TrendPoint[];
  chgPct: number | null;
}

async function fetchTrendAll(): Promise<TrendWindowPayload[]> {
  const res = await fetch(`${deskBasePath}/api/gold/trend?range=all`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The trend API responded with ${res.status}`);
  return res.json() as Promise<TrendWindowPayload[]>;
}

type TmT = {
  title: string;
  subtitle: string;
  eraNote: string;
  pickLabel: string;
  loading: string;
  asOfExact: string;
  asOfBefore: string;
  versionLine: string;
  provenanceBackfill: string;
  provenanceLive: string;
  noRow: string;
  unavailable: string;
  priceTitle: string;
  priceLine: string;
  priceNearest: string;
  priceVsToday: string;
  priceSourceSpot: string;
  priceSourceComex: string;
  priceUnavailable: string;
  ifTitle: string;
  ifNote: string;
  colWindow: string;
  colThen: string;
  colNow: string;
  colPl: string;
  calcTitle: string;
  calcNote: string;
  calcAmountLabel: string;
  calcWorth: string;
  calcProfit: string;
  calcLoss: string;
  calcUncovered: string;
};

/** The balance copy's own verdict words (the hero's vocabulary). */
export interface TmVerdictWords {
  verdictFor: string;
  verdictAgainst: string;
  verdictBalanced: string;
  verdictNone: string;
}

/** The lane words (the page's own laneWord vocabulary). */
export interface TmLaneWord {
  laneWord: Record<LaneId, string>;
}

interface MeterLane {
  lane: string;
  side: "for" | "against" | "neutral" | "unread";
  split: boolean;
  readable: number;
  firing: number;
  supports: number;
  pressures: number;
}

interface MeterRow {
  date: string;
  source: "backfill" | "live" | string;
  tableVersion: string;
  state: "tipped-for" | "tipped-against" | "level" | "none" | string;
  beamAngle: number;
  fullyTipped: boolean;
  net: number;
  readable: number;
  counts: { for: number; against: number; neutral: number; unread: number };
  lanes: MeterLane[];
}

interface MeterResponse {
  v?: number;
  requestedDate?: string;
  row?: MeterRow | null;
}

/** The day-lookup leg's own payload (from /api/gold/daily). */
interface DailyPrice {
  date: string;
  price: number;
  source: "spot-store" | "comex-history";
  todaySpot: number;
  todayAsOf: string;
  span: { from: string; to: string };
}

type QueryState =
  | { kind: "idle" }
  | { kind: "loading"; date: string }
  | { kind: "ready"; response: MeterResponse }
  | { kind: "unavailable"; date: string };

type PriceState =
  | { kind: "idle" }
  | { kind: "loading"; date: string }
  | { kind: "ready"; price: DailyPrice }
  | { kind: "unavailable"; date: string };

const VERDICT_OF: Record<string, keyof TmVerdictWords> = {
  "tipped-for": "verdictFor",
  "tipped-against": "verdictAgainst",
  level: "verdictBalanced",
  none: "verdictNone",
};

const LANES_IN_ORDER: ReadonlyArray<LaneId> = [
  "borrowing-costs",
  "dollar",
  "stress",
  "inflation",
  "flows",
];

export function TimeMachineBand({
  t,
  locale,
  verdictWords,
  laneWord,
  windowNames,
  fmt,
}: {
  t: TmT;
  locale: Locale;
  verdictWords: TmVerdictWords;
  laneWord: Record<LaneId, string>;
  windowNames: Record<IfWindow, string>;
  fmt: Fmt;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState<QueryState>({ kind: "idle" });
  const [price, setPrice] = React.useState<PriceState>({ kind: "idle" });
  const [picked, setPicked] = React.useState<string | null>(null);

  // The picker's own honest bounds: the era start → today.
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  /* the what-if leg — every window's own trend (the price then, the
     price now, the gain or loss), plus the wealth calculator's state */
  const trends = useQuery({
    queryKey: ["currena-gold-trend-ifbought"],
    queryFn: fetchTrendAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const ifRows = React.useMemo(() => {
    if (trends.data === undefined) return [];
    return IF_WINDOWS.map((w) => {
      const row = trends.data.find((x) => x.range === w);
      if (row === undefined || row.points.length < 2) return null;
      const startPrice = row.points[0]!.v;
      if (!Number.isFinite(startPrice) || startPrice <= 0) return null;
      return { window: w, startPrice, spot: row.spot, chgPct: row.chgPct };
    }).filter((r) => r !== null) as Array<{ window: IfWindow; startPrice: number; spot: number; chgPct: number | null }>;
  }, [trends.data]);
  /* the wealth calculator — [x] dollars of gold bought since [window] */
  const [amount, setAmount] = React.useState<number>(100);
  const [since, setSince] = React.useState<IfWindow>("1Y");
  const sinceRow = ifRows.find((r) => r.window === since) ?? null;
  const worth = sinceRow !== null && amount > 0 ? (amount * sinceRow.spot) / sinceRow.startPrice : null;
  const gain = worth !== null ? worth - amount : null;

  /* both legs of the picked day, in parallel: the meter reading AND the
     day's own gold price (≥ 10 years back — the store inside its window,
     the seam-anchored COMEX history before it). */
  const load = React.useCallback(async (date: string) => {
    setPicked(date);
    setQuery({ kind: "loading", date });
    setPrice({ kind: "loading", date });
    void (async () => {
      try {
        const res = await fetch(
          `${deskBasePath}/api/gold/daily?date=${encodeURIComponent(date)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`the daily route responded with ${res.status}`);
        const p = (await res.json()) as DailyPrice;
        setPrice({ kind: "ready", price: p });
      } catch {
        setPrice({ kind: "unavailable", date });
      }
    })();
    try {
      const res = await fetch(
        `${deskBasePath}/api/gold/meter?date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`the meter route responded with ${res.status}`);
      const response = (await res.json()) as MeterResponse;
      setQuery({ kind: "ready", response });
    } catch {
      setQuery({ kind: "unavailable", date });
    }
  }, []);

  const row = query.kind === "ready" ? query.response.row ?? null : null;
  const verdictKey = VERDICT_OF[row?.state ?? ""] ?? null;

  return (
    <section
      id="gold-timemachine"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)] shadow-[var(--cr-shadow-card)] sm:p-4"
      aria-labelledby="gold-timemachine-title"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id="gold-timemachine-title" className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.subtitle}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="gold-timemachine-body"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-transparent px-3.5 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {open ? (locale === "en" ? "hide" : "بستن") : locale === "en" ? "open" : "باز کردن"}
        </button>
      </header>

      {/* THE what-if table — if you'd bought gold: 1 week / 1 month / 3
          months / 6 months / 1 year / 5 years, the price then, the price
          now, and the profit or loss, always visible, nothing to click */}
      <div className="mt-3 flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.ifTitle}</h3>
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.ifNote}</p>
        <div className="min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
          <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption" aria-label={t.ifTitle}>
            <thead>
              <tr className="text-[var(--color-text-tertiary)]">
                <th scope="col" className="px-2.5 py-1.5 text-start font-bold">{t.colWindow}</th>
                <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colThen}</th>
                <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colNow}</th>
                <th scope="col" className="px-2.5 py-1.5 text-end font-bold">{t.colPl}</th>
              </tr>
            </thead>
            <tbody>
              {trends.isLoading || trends.data === undefined ? (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-[var(--color-text-tertiary)]" aria-live="polite">…</td>
                </tr>
              ) : ifRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-[var(--color-text-tertiary)]">{t.calcUncovered}</td>
                </tr>
              ) : (
                ifRows.map((r) => (
                  <tr key={r.window} className="border-t border-[var(--color-border)] first:border-t-0">
                    <th scope="row" className="px-2.5 py-1.5 text-start font-bold text-[var(--color-text-primary)]">
                      {windowNames[r.window]}
                    </th>
                    <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">
                      <bdi dir="ltr">${fmt.num(r.startPrice, 0)}</bdi>
                    </td>
                    <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                      <bdi dir="ltr">${fmt.num(r.spot, 0)}</bdi>
                    </td>
                    <td className="px-2.5 py-1.5 text-end">
                      <SignedDelta v={r.chgPct} fmt={fmt} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* the wealth calculator — bought [x] dollars of gold since
            [1 week / 1 month / ...]: what it is worth now */}
        <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
          <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.calcTitle}</h4>
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.calcAmountLabel}</span>
              <input
                type="number"
                min={0}
                step={10}
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAmount(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                className="w-[7.5rem] min-h-[38px] rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-1.5 type-label tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
              />
            </label>
            <div className="flex flex-col gap-1" role="group" aria-label={t.colWindow}>
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.colWindow}</span>
              <div className="flex flex-wrap gap-1.5">
                {IF_WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={since === w}
                    disabled={ifRows.length > 0 && !ifRows.some((r) => r.window === w)}
                    onClick={() => setSince(w)}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors ${
                      since === w
                        ? "bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
                    }`}
                  >
                    {windowNames[w]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {worth !== null && gain !== null && sinceRow !== null ? (
            <p className="m-0 text-[1.05rem] font-black leading-tight text-[var(--color-text-primary)]">
              {t.calcWorth}:{" "}
              <bdi dir="ltr" className="tabular-nums">${fmt.num(worth, 0)}</bdi>{" "}
              <span
                className="type-label font-black"
                style={{ color: gain >= 0 ? "var(--color-return-up)" : "var(--color-return-down)" }}
              >
                {gain >= 0 ? t.calcProfit : t.calcLoss}{" "}
                <bdi dir="ltr" className="tabular-nums">
                  {gain >= 0 ? "+" : "−"}${fmt.num(Math.abs(gain), 0)} ({gain >= 0 ? "+" : "−"}{fmt.num(Math.abs((sinceRow.spot / sinceRow.startPrice - 1) * 100), 1)}%)
                </bdi>
              </span>
            </p>
          ) : (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.calcUncovered}</p>
          )}
        </div>
      </div>

      {open ? (
        <div id="gold-timemachine-body" className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="gold-timemachine-date" className="type-caption font-semibold text-[var(--color-text-secondary)]">
              {t.pickLabel}
            </label>
            <input
              id="gold-timemachine-date"
              type="date"
              min={ERA_START}
              max={today}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v !== "") void load(v);
              }}
              className="min-h-[36px] rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1 type-label text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
            />
          </div>

          {query.kind === "loading" ? <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.loading}</p> : null}

          {/* the day's own gold price — THE headline answer, big and bold */}
          {price.kind === "loading" ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">…</p>
          ) : null}
          {price.kind === "unavailable" ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.priceUnavailable}</p>
          ) : null}
          {price.kind === "ready" ? (
            <div className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2.5 ring-1 ring-[var(--color-accent-gold)]/40">
              <p className="m-0 text-[1.05rem] font-black leading-tight text-[var(--color-text-primary)] sm:text-[1.15rem]" data-timemachine-price>
                {t.priceTitle}:{" "}
                <bdi dir="ltr" className="tabular-nums">
                  ${fmt.num(price.price.price, 0)}
                </bdi>{" "}
                <span className="type-caption font-bold text-[var(--color-text-secondary)]">/ oz</span>
              </p>
              <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                <bdi>{t.priceLine.replace("{price}", `$${fmt.num(price.price.price, 0)}`)}</bdi>
                {picked !== null && price.price.date !== picked ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <bdi>{t.priceNearest.replace("{date}", fmt.dateWords(picked))}</bdi>
                  </>
                ) : null}
              </p>
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                {price.price.todaySpot > 0 ? (
                  <bdi className="font-bold" style={{ color: price.price.todaySpot >= price.price.price ? "var(--color-return-down)" : "var(--color-return-up)" }}>
                    {t.priceVsToday.replace("{pct}", fmt.pct((price.price.todaySpot / price.price.price - 1) * 100))}
                  </bdi>
                ) : null}
                <span aria-hidden="true"> · </span>
                {price.price.source === "spot-store" ? t.priceSourceSpot : t.priceSourceComex}
                <span aria-hidden="true"> · </span>
                <span>
                  {fmt.dateWords(price.price.span.from)} → {fmt.dateWords(price.price.span.to)}
                </span>
              </p>
            </div>
          ) : null}

          {query.kind === "unavailable" ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
              {t.unavailable.replace("{date}", fmt.dateWords(query.date))}
            </p>
          ) : null}

          {query.kind === "ready" ? (
            row === null ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                {t.noRow.replace("{date}", fmt.dateWords(query.response.requestedDate ?? today))}
              </p>
            ) : (
              <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="m-0 type-label font-bold text-[var(--color-text-primary)]">
                    {query.response.requestedDate === row.date
                      ? t.asOfExact.replace("{date}", fmt.dateWords(row.date))
                      : t.asOfBefore
                          .replace("{row}", fmt.dateWords(row.date))
                          .replace("{picked}", fmt.dateWords(query.response.requestedDate ?? today))}
                  </p>
                  <p className="m-0 type-caption font-bold text-[var(--color-chip-ink-attention)]">
                    {verdictKey !== null ? verdictWords[verdictKey] : verdictWords.verdictNone}
                  </p>
                </div>
                <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                  {t.versionLine.replace("{version}", row.tableVersion)}
                  {" · "}
                  {locale === "en" ? "for" : "موافق"} {fmt.num(row.counts.for, 0)} ·{" "}
                  {locale === "en" ? "against" : "مخالف"} {fmt.num(row.counts.against, 0)} ·{" "}
                  {locale === "en" ? "not leaning" : "بی‌طرف"} {fmt.num(row.counts.neutral, 0)} ·{" "}
                  {locale === "en" ? "unread" : "ناخوانده"} {fmt.num(row.counts.unread, 0)}
                </p>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {row.lanes.map((l) => {
                    const laneId = LANES_IN_ORDER.find((k) => k === l.lane) ?? null;
                    const word =
                      laneId !== null
                        ? l.split
                          ? locale === "en"
                            ? `split ${fmt.num(l.supports, 0)}·${fmt.num(l.pressures, 0)}`
                            : `دوپاره ${fmt.num(l.supports, 0)}·${fmt.num(l.pressures, 0)}`
                          : laneWord[laneId]
                        : l.side;
                    const tone =
                      l.side === "for"
                        ? "text-[var(--color-currena-success)]"
                        : l.side === "against"
                          ? "text-[var(--color-status-alert)]"
                          : "text-[var(--color-text-tertiary)]";
                    return (
                      <li key={l.lane} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 type-caption">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {laneId !== null ? LANE_CONTENT[laneId].label[lan(locale)] : l.lane}
                        </span>
                        <span className={`font-bold ${tone}`}>{word}</span>
                        <span className="text-[var(--color-text-tertiary)]">
                          {fmt.num(l.readable, 0)} {locale === "en" ? "readable" : "خوانا"}
                          {l.firing > 0 ? ` · ${fmt.num(l.firing, 0)} ${locale === "en" ? "firing" : "شلیک‌کننده"}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                  {row.source === "live" ? t.provenanceLive : t.provenanceBackfill}
                </p>
              </div>
            )
          ) : null}

          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            <bdi>{t.eraNote}</bdi>
          </p>
        </div>
      ) : null}
    </section>
  );
}
