"use client";

/**
 * The Tehran board — the live instrument rows the previous gold page's
 * Iran bridge carried (upstream `GoldIranBridge`'s board, restored):
 * every Tehran instrument's market price beside its computed حباب
 * premium, the parity line naming the toman-per-ounce, and the melt
 * method — all reproducible from the stated formula.
 *
 * Serves from the desk's own /api/gold/rates route (the server-side
 * proxy over the still-live currena-api /api/rates snapshot); the
 * premiums are computed client-side through the pure coin-premium
 * engine (ported verbatim) — the route serves data, never arithmetic.
 * Fail-closed: a missing leg renders the honest unavailable line; a
 * missing parity leg still shows the market's own quotes.
 */

import * as React from "react";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, faDigits } from "@/components/gold-page/visuals";
import {
  BRIDGE_INSTRUMENT_NAMES,
  coinPremium,
  COIN_SPECS,
  dollarTomanOf,
  type GoldQuote,
} from "@/lib/gold-page/coin-premium";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

interface RatesRow {
  code?: string;
  rate?: number;
}

interface RatesPayload {
  base?: string;
  source?: string;
  fetchedAt?: string;
  gold?: GoldQuote[];
  rates?: RatesRow[];
}

type BridgeT = {
  boardTitle: string;
  boardHeadPrice: string;
  boardHeadPremium: string;
  boardPremiumShort: string;
  boardDiscountShort: string;
  boardMillionToman: string;
  boardToman: string;
  boardParityOunce: string;
  boardNoParity: string;
  boardSnapshotNote: string;
  boardUnavailable: string;
};

export function BridgeBoard({
  rates,
  t,
  fmt,
  locale,
}: {
  rates: RatesPayload | null;
  t: BridgeT;
  fmt: Fmt;
  locale: Locale;
}) {
  const gold = rates?.gold ?? [];
  const dollarToman = React.useMemo(() => {
    const usd = rates?.rates?.find((r) => r.code === "USD");
    return dollarTomanOf(usd?.rate);
  }, [rates]);
  const premium = React.useMemo(() => coinPremium(gold, dollarToman), [gold, dollarToman]);
  const rowById = React.useMemo(() => new Map(premium.rows.map((r) => [r.id, r])), [premium]);

  if (rates === null) {
    return (
      <div className="mt-3 flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
        <h4 className="m-0 type-label font-bold text-[var(--color-bridge-accent)]">{t.boardTitle}</h4>
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.boardUnavailable}</p>
      </div>
    );
  }

  const toman = (v: number): string =>
    v >= 1_000_000
      ? t.boardMillionToman.replace("{v}", fmt.num(v / 1_000_000, v >= 10_000_000 ? 2 : 3))
      : `${fmt.num(v, 0)} ${t.boardToman}`;

  const snapshotTime =
    rates.fetchedAt !== undefined && rates.fetchedAt !== null
      ? (() => {
          try {
            return new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            }).format(new Date(rates.fetchedAt));
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
      {/* the board's own header — the Emami-style gold coin beside the
          live title, the Tehran market's own emblem */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2">
          <img
            src={`${deskBasePath}/emami-coin.png`}
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] shrink-0 rounded-full object-cover ring-1 ring-[var(--color-bridge-accent)]/40"
            loading="lazy"
            decoding="async"
          />
          <h4 className="m-0 type-label font-bold text-[var(--color-bridge-accent)]">{t.boardTitle}</h4>
        </span>
        {snapshotTime !== null ? (
          <span className="type-caption text-[var(--color-text-tertiary)]">
            {t.boardSnapshotNote.replace("{time}", locale === "fa" ? faDigits(snapshotTime) : snapshotTime)}
          </span>
        ) : null}
      </div>

      {/* The parity line — the toman-per-ounce named at point of use. */}
      {premium.ounceUsd !== null && premium.dollarToman !== null && premium.tomanPerOunce !== null ? (
        <p className="m-0 type-caption font-semibold text-[var(--color-text-primary)]">
          <bdi>
            {t.boardParityOunce
              .replace("{ounce}", fmt.num(premium.ounceUsd, 2))
              .replace("{dollar}", fmt.num(premium.dollarToman, 0))
              .replace("{perOunce}", fmt.num(premium.tomanPerOunce, 0))}
          </bdi>
        </p>
      ) : (
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.boardNoParity}</p>
      )}

      {/* The board rows — the coin family, then the weights. */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse type-caption">
          <thead>
            <tr className="text-[var(--color-text-tertiary)]">
              <th scope="col" className="px-1 py-1 text-start font-bold">{locale === "en" ? "Instrument" : "ابزار"}</th>
              <th scope="col" className="px-1 py-1 text-end font-bold">{t.boardHeadPrice}</th>
              <th scope="col" className="px-1 py-1 text-end font-bold">{t.boardHeadPremium}</th>
            </tr>
          </thead>
          <tbody>
            {COIN_SPECS.map((spec) => {
              const row = rowById.get(spec.id);
              const name = BRIDGE_INSTRUMENT_NAMES[spec.id]?.[lan(locale)] ?? spec.id;
              return (
                <tr key={spec.id} className="border-t border-[var(--color-border)]">
                  <td className="px-1 py-1.5 font-semibold text-[var(--color-text-primary)]">
                    <bdi>{name}</bdi>
                  </td>
                  <td className="px-1 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                    {/* the money cell follows the reader's own direction
                        (the owner's catch): an LTR bdi flips «میلیون تومان»
                        into «تومان میلیون»; fa renders RTL so the phrase
                        reads whole — the number, then its unit, in order */}
                    <bdi dir={locale === "fa" ? "rtl" : "ltr"} className="whitespace-nowrap">{row !== undefined ? toman(row.marketToman) : "·"}</bdi>
                  </td>
                  {/* the premium column, QUIET (batch L, task 10): the
                      owner's call — the حباب is visual noise at full
                      ink; tertiary at 65% opacity, no bold, the sign
                      itself (+/−) carries the direction */}
                  <td className="px-1 py-1.5 text-end tabular-nums text-[var(--color-text-tertiary)]/65">
                    {row !== undefined ? (
                      <bdi dir={locale === "fa" ? "rtl" : "ltr"} className="whitespace-nowrap">
                        {(row.premiumPct >= 0
                          ? t.boardPremiumShort
                          : t.boardDiscountShort
                        ).replace("{v}", `${row.premiumPct >= 0 ? "+" : "−"}${fmt.num(Math.abs(row.premiumPct), 1)}%`)}
                      </bdi>
                    ) : (
                      "·"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The rates leg's fetcher (fail-closed — null when it does not arrive). */
export async function fetchRates(): Promise<RatesPayload | null> {
  try {
    const res = await fetch(`${deskBasePath}/api/gold/rates`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RatesPayload;
  } catch {
    return null;
  }
}

export type { RatesPayload };
