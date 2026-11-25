/**
 * The live rates seam for every tool that needs a price — ONE fetch,
 * many tools (the consolidation the owner asked for).
 *
 * The data is the desk's own /api/gold/rates route (src/app/api/gold/
 * rates/route.ts): the currena-api /api/rates snapshot passed through
 * server-side, memory-cached five minutes upstream. The client hook
 * below polls it every 60 seconds and renders fail-closed honest
 * states — a tool that cannot read the board says so, never guesses
 * (the legs.ts discipline).
 *
 * Rates are quoted "foreign units per 1 toman" (snapshot.base IRR with
 * unit TOMAN): 1 USD = 1/rate toman. Gold rows are toman (the global
 * ounce in USD).
 */

import * as React from "react";
import { deskBasePath } from "@/lib/utils";

/* =================================================================== *
 * The snapshot's shape (the /api/gold/rates contract)                  *
 * =================================================================== */

export interface FxRow {
  code: string;
  name: string;
  /** Foreign units per 1 toman (IRR's own row: 1 — the toman itself). */
  rate: number;
  dayHigh?: number;
  dayLow?: number;
  symbol?: string;
}

export interface GoldRow {
  id: string;
  unit: "TOMAN" | "USD";
  price: number;
  dayHigh?: number;
  dayLow?: number;
  changePct?: number;
  marketAt?: string;
}

export interface RatesSnapshot {
  base?: string;
  source?: string;
  fetchedAt?: string;
  rates?: FxRow[];
  gold?: GoldRow[];
}

/* =================================================================== *
 * Pure helpers (unit-tested in tests/tools-maths.test.ts)             *
 * =================================================================== */

/** Convert an amount between two currencies through their toman rates. */
export function convertAmount(amount: number, from: FxRow, to: FxRow): number {
  if (!Number.isFinite(amount) || !from.rate || !to.rate) return NaN;
  return (amount * to.rate) / from.rate;
}

/** Toman per one unit of a currency (the board's natural direction). */
export function tomanPerUnit(row: FxRow): number {
  return row.rate > 0 ? 1 / row.rate : NaN;
}

/** Find a currency row by code (case-insensitive; "IRR"/"TOMAN" both
 *  resolve to the toman base row). */
export function findFx(snap: RatesSnapshot | null, code: string): FxRow | null {
  const list = snap?.rates ?? [];
  const wanted = code.toUpperCase();
  const row = list.find((r) => r.code.toUpperCase() === wanted);
  if (row) return row;
  if (wanted === "TOMAN") {
    return list.find((r) => r.code.toUpperCase() === "IRR") ?? null;
  }
  return null;
}

/** Find a gold row by id. */
export function findGold(snap: RatesSnapshot | null, id: string): GoldRow | null {
  return (snap?.gold ?? []).find((g) => g.id === id) ?? null;
}

/** The live per-gram price of a karat: 24k and 18k come from their own
 *  rows; every other karat is derived from the 24k row at purity ratio
 *  (the market's own rule — weight × karat ÷ 24). */
export function gramPriceForKarat(snap: RatesSnapshot | null, karat: number): number | null {
  if (karat === 24) {
    const g24 = findGold(snap, "gold-24k");
    return g24?.price ?? null;
  }
  if (karat === 18) {
    const g18 = findGold(snap, "gold-18k");
    if (g18?.price) return g18.price;
  }
  const g24 = findGold(snap, "gold-24k");
  if (!g24?.price) return null;
  return (g24.price * karat) / 24;
}

/* =================================================================== *
 * The client hook                                                      *
 * =================================================================== */

export type RatesState = "loading" | "live" | "error";

export interface UseRates {
  snap: RatesSnapshot | null;
  state: RatesState;
  /** The snapshot's own fetch stamp (server-side, 5-min upstream cache). */
  fetchedAt: string | null;
  refresh: () => void;
}

const POLL_MS = 60_000;

export function useRates(): UseRates {
  const [snap, setSnap] = React.useState<RatesSnapshot | null>(null);
  const [state, setState] = React.useState<RatesState>("loading");

  const load = React.useCallback(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${deskBasePath}/api/gold/rates`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as RatesSnapshot;
        if (!alive) return;
        if (!Array.isArray(data?.rates) || !Array.isArray(data?.gold)) throw new Error("shape");
        setSnap(data);
        setState("live");
      } catch {
        if (!alive) return;
        setState((prev) => (prev === "live" ? prev : "error"));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const cancel = load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancel();
      window.clearInterval(timer);
    };
  }, [load]);

  return {
    snap,
    state,
    fetchedAt: snap?.fetchedAt ?? null,
    refresh: () => load(),
  };
}
