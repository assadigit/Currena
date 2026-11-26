"use client";

/**
 * The coin budget machine — the owner's own ask: "with this money, how
 * many full Emami coins can I buy?" One coherent Tehran snapshot answers it:
 * the picked currency's own free-market rate (the TGJU board's own row,
 * toman per unit) converts the money to toman, the Emami coin's own
 * market price divides it — and the same money at the coin's melt value
 * rides beside it, so the حباب premium is visible in the answer itself.
 *
 * The compute is the pure coin-premium engine over the page's own rates
 * leg (fail-closed: no quote, no machine — the honest unavailable line,
 * never a guess). Every basis named at point of use; display-only, no
 * advice, and never a suggestion to buy a coin.
 */

import * as React from "react";
import { Coins } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { type Fmt } from "@/components/gold-page/visuals";
import { sanitizeAmountText } from "@/components/gold-page/calculator";
import { coinPremium, dollarTomanOf, type GoldQuote } from "@/lib/gold-page/coin-premium";
import { deskBasePath } from "@/lib/utils";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/** The TGJU board's own FX rows the machine offers — the owner's own
 *  six, and only the six (batch L, task 11): the dollar and the toman
 *  first — the two that matter most — then the euro, the pound, the
 *  Australian and the Canadian dollar. */
const CURRENCY_ORDER = ["usd", "irr", "eur", "gbp", "aud", "cad"] as const;

/** The chips' own names — [code, EN, fa]; unknown codes fall back to
 *  their own code (never a guess). */
const CURRENCY_NAMES: Record<string, [string, string]> = {
  usd: ["US dollar", "دلار آمریکا"],
  irr: ["Iranian toman", "تومان"],
  eur: ["Euro", "یورو"],
  gbp: ["British pound", "پوند"],
  aud: ["Australian dollar", "دلار استرالیا"],
  cad: ["Canadian dollar", "دلار کانادا"],
};

type CoinBuyerT = {
  title: string;
  subtitle: string;
  amountLabel: string;
  currencyLabel: string;
  coinsWord: string;
  wholeWord: string;
  fractionWord: string;
  tomanLine: string;
  perCoinLine: string;
  meltLine: string;
  unavailable: string;
  /** the blank-amount prompt — the answer box's own gentle stand-in
   *  (the machine never unmounts, the owner's bug report) */
  enterAmountLine: string;
  millionToman: string;
  billionToman: string;
  tomanWord: string;
};

interface RatesRow {
  code?: string;
  rate?: number;
  name?: string;
}

interface RatesPayload {
  fetchedAt?: string;
  gold?: GoldQuote[];
  rates?: RatesRow[];
}

/** Money in toman — the site's own M/bn convention. */
function tomanText(v: number, t: CoinBuyerT, fmt: Fmt): string {
  if (v >= 1e9) return t.billionToman.replace("{v}", fmt.num(v / 1e9, 2));
  if (v >= 1e6) return t.millionToman.replace("{v}", fmt.num(v / 1e6, 1));
  return `${fmt.num(v, 0)} ${t.tomanWord}`;
}

export function CoinBuyerBand({
  rates,
  t,
  fmt,
  locale,
}: {
  rates: RatesPayload | null;
  t: CoinBuyerT;
  fmt: Fmt;
  locale: Locale;
}) {
  /* the machine's own state — 10,000 of the picked currency (the
     dollar, the first of the owner's six) against the full Emami coin */
  const [amount, setAmount] = React.useState<number>(10000);
  const [amountText, setAmountText] = React.useState<string>("10000");
  React.useEffect(() => {
    if (Number(amountText) === amount) return;
    setAmountText(String(amount));
  }, [amount, amountText]);

  const quotes = rates?.gold ?? [];
  const fxRows = React.useMemo(
    () => (rates?.rates ?? []).filter((r) => typeof r.code === "string" && typeof r.rate === "number" && Number.isFinite(r.rate) && r.rate > 0),
    [rates],
  );
  const codeOf = (r: RatesRow): string => (r.code ?? "").toLowerCase();

  /* the currency set — the ordered codes that actually arrived */
  const available = React.useMemo(() => {
    const have = new Set(fxRows.map(codeOf));
    return CURRENCY_ORDER.filter((c) => have.has(c)) as string[];
  }, [fxRows]);
  const [pick, setPick] = React.useState<string>("usd");
  const currency = available.includes(pick) ? pick : available[0] ?? null;

  /* the parity engine over the same snapshot — the melt leg */
  const dollarToman = React.useMemo(() => {
    const usd = fxRows.find((r) => codeOf(r) === "usd");
    return dollarTomanOf(usd?.rate);
  }, [fxRows]);
  const premium = React.useMemo(() => coinPremium(quotes, dollarToman), [quotes, dollarToman]);
  const emami = premium.rows.find((r) => r.id === "coin-emami") ?? null;
  const emamiQuote = quotes.find((q) => q.id === "coin-emami") ?? null;

  /* the machine's answer — one coherent snapshot, every leg named.
   *  amount<=0 is NOT an error state: the inputs stay mounted (the
   *  owner's 2026-11-26 bug report — clearing the field to type a
   *  second amount unmounted the input mid-typing and it never came
   *  back without a refresh); an empty amount only blanks the ANSWER,
   *  the machine itself never disappears. */
  const legsReady = currency !== null && (() => {
    const row = fxRows.find((r) => codeOf(r) === currency);
    const emamiPrice = emamiQuote?.price;
    return row !== undefined && emamiPrice !== undefined && Number.isFinite(emamiPrice) && emamiPrice > 0;
  })();
  const answer = React.useMemo(() => {
    if (!legsReady || currency === null) return null;
    const row = fxRows.find((r) => codeOf(r) === currency);
    if (row === undefined) return null;
    const emamiPrice = emamiQuote?.price;
    if (emamiPrice === undefined || !Number.isFinite(emamiPrice) || emamiPrice <= 0) return null;
    if (!Number.isFinite(amount) || amount <= 0) return null;
    // the row's own rate is units per toman; its inverse is toman per unit
    const tomanPerUnit = 1 / (row.rate as number);
    const amountToman = amount * tomanPerUnit;
    const coins = amountToman / emamiPrice;
    const meltCoins = emami !== null && emami.intrinsicToman > 0 ? amountToman / emami.intrinsicToman : null;
    return { tomanPerUnit, amountToman, coins, meltCoins };
  }, [legsReady, currency, fxRows, amount, emamiQuote, emami]);

  const nameOf = (code: string): string => CURRENCY_NAMES[code]?.[lan(locale)] ?? code.toUpperCase();

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bridge-accent)]/15 text-[var(--color-bridge-accent)]" aria-hidden="true">
          <Coins className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="m-0 type-label font-bold text-[var(--color-bridge-accent)]">{t.title}</h4>
          <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>
        </div>
      </div>

      {rates === null || !legsReady ? (
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      ) : (
        <>
          {/* the inputs — the money and its currency. Batch M: the
              picked currency's own name rides BESIDE the input as an
              attached segment of one joined group ([دلار آمریکا][field])
              — never a separate hint floating somewhere else; the
              amount's unit is visible at point of use, the owner's
              ask */}
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.amountLabel}</span>
              <span className="flex w-fit items-stretch overflow-hidden rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  dir="ltr"
                  value={amountText}
                  onChange={(e) => {
                    const text = sanitizeAmountText(e.target.value);
                    setAmountText(text);
                    const v = Number(text);
                    setAmount(text === "" || !Number.isFinite(v) ? 0 : Math.max(0, v));
                  }}
                  onBlur={() => {
                    if (amountText === "") {
                      setAmountText("0");
                      setAmount(0);
                    }
                  }}
                  className="w-[8.5rem] min-h-[38px] bg-[var(--color-surface)] px-2.5 py-1.5 type-label tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-currena-blue)]"
                />
                <span className="flex items-center whitespace-nowrap bg-[var(--color-currena-soft)] px-2.5 type-caption font-bold text-[var(--color-text-secondary)]">
                  {currency !== null ? nameOf(currency) : "·"}
                </span>
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.currencyLabel}</span>
              <span className="flex max-w-[16rem] flex-wrap gap-1.5" role="group" aria-label={t.currencyLabel}>
                {available.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={currency === c}
                    onClick={() => setPick(c)}
                    className={`min-h-[32px] rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors ${
                      currency === c
                        ? "bg-[var(--color-bridge-accent)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {nameOf(c)}
                  </button>
                ))}
              </span>
            </label>
          </div>

          {/* the answer — the full coins the money buys, beside the coin
              itself. A blank/zero amount keeps the box alive as its own
              gentle prompt (the owner's bug report: never unmount the
              machine mid-typing), never a vanishing input */}
          {answer === null ? (
            <div className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.enterAmountLine}</p>
            </div>
          ) : (
          <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <img
                src={`${deskBasePath}/emami-coin.png`}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[var(--color-bridge-accent)]/40"
                loading="lazy"
                decoding="async"
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 inline-flex flex-wrap items-baseline gap-x-2">
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-bridge-accent)] sm:text-[1.5rem]">
                    {fmt.num(answer.coins, 2)}
                  </bdi>
                  <bdi className="type-label font-bold text-[var(--color-text-primary)]">{t.coinsWord}</bdi>
                </p>
                <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">
                  <bdi dir={locale === "en" ? "ltr" : "rtl"}>
                    ≈ {fmt.num(Math.floor(answer.coins), 0)} {t.wholeWord}
                    {answer.coins % 1 > 0.005 ? ` + ${fmt.num(answer.coins % 1, 2)} ${t.fractionWord}` : ""}
                  </bdi>
                </p>
              </div>
            </div>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>
                {t.tomanLine
                  .replace("{toman}", tomanText(answer.amountToman, t, fmt))
                  .replace("{n}", fmt.num(amount, 0))}
              </bdi>
            </p>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>
                {t.perCoinLine.replace("{price}", tomanText(emamiQuote?.price ?? 0, t, fmt))}
              </bdi>
            </p>
            {answer.meltCoins !== null ? (
              <p className="m-0 mt-1 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]/65">
                <bdi>
                  {t.meltLine.replace("{n}", fmt.num(answer.meltCoins, 2))}
                </bdi>
              </p>
            ) : null}
          </div>
          )}
        </>
      )}
    </div>
  );
}
