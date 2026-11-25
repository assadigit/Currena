"use client";

/**
 * ماشین‌حساب ارزی — the exchange desk's own maths. Two sides (the desk
 * sells to the customer / buys from the customer), one base rate
 * (prefilled from the live board, editable), one margin percent. The
 * quote, the toman total and the desk's own margin come out — and the
 * margin is stated, never hidden.
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  Chip,
  FieldRow,
  NumberField,
  Picker,
  ResultLine,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { findFx, tomanPerUnit, useRates } from "@/lib/tools/rates";
import { fmtMoney, fmtPct } from "@/lib/tools/fmt";

type Side = "sell" | "buy";
const MARGINS = [0, 0.5, 1, 2, 3];

export default function CurrencyCalcTool() {
  return (
    <ToolPage tool="currency-calculator">
      {(locale) => <ExCalcBody locale={locale} />}
    </ToolPage>
  );
}

function ExCalcBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.excalc;

  const { snap, state } = useRates();
  const [side, setSide] = React.useState<Side>("sell");
  const [code, setCode] = React.useState("USD");
  const [rateText, setRateText] = React.useState<number>(0); // toman per unit
  const [rateTouched, setRateTouched] = React.useState(false);
  const [margin, setMargin] = React.useState(1);
  const [amount, setAmount] = React.useState(100);

  // Prefill from the live board, once; the desk's own edits stand.
  const live = findFx(snap, code);
  React.useEffect(() => {
    if (!rateTouched && live) {
      const p = tomanPerUnit(live);
      if (Number.isFinite(p) && p > 0) setRateText(Math.round(p));
    }
  }, [live, rateTouched]);

  const options = (snap?.rates ?? [])
    .filter((r) => r.code !== "IRR")
    .map((r) => ({
      value: r.code,
      label: `${currencyName(copy, locale, r.code)} · ${r.symbol ?? r.code}`,
    }));
  const safeOptions = options.length ? options : [{ value: code, label: code }];

  const rate = rateText > 0 ? rateText : 0;
  const quote = side === "sell" ? rate * (1 + margin / 100) : rate * (1 - margin / 100);
  const total = amount * quote;
  const profit = (amount * rate * margin) / 100;
  const ratePerUnit = live ? tomanPerUnit(live) : NaN;

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "ماشین‌حساب ارزی" : "Currency Calculator"}
        promise={t.promise}
      />

      <SectionCard>
        {/* the two sides */}
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={copy.common.basis}>
          <Chip active={side === "sell"} onClick={() => setSide("sell")}>
            {t.modeSell}
          </Chip>
          <Chip active={side === "buy"} onClick={() => setSide("buy")}>
            {t.modeBuy}
          </Chip>
        </div>
        <p className="m-0 mb-4 text-[12.5px] text-[var(--color-text-secondary)]">
          {side === "sell" ? t.modeSellLine : t.modeBuyLine}
        </p>

        <div className="divide-y divide-[var(--color-border)]/60">
          <FieldRow label={copy.common.currencyLabel} id="xc-code">
            <Picker
              id="xc-code"
              value={code}
              options={safeOptions}
              onChange={(v) => {
                setCode(v);
                setRateTouched(false);
              }}
              ariaLabel={copy.common.currencyLabel}
            />
          </FieldRow>

          <FieldRow label={t.rateLabel} id="xc-rate" hint={t.rateHint}>
            <NumberField
              id="xc-rate"
              value={rateText}
              onCommit={(v) => {
                setRateText(v);
                setRateTouched(true);
              }}
              locale={locale}
              decimals={false}
              ariaLabel={t.rateLabel}
              clampRange={[0, 100_000_000, 1]}
            />
            {Number.isFinite(ratePerUnit) && ratePerUnit > 0 ? (
              <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                {copy.common.source}: {fmtMoney(Math.round(ratePerUnit), locale, 0)}
              </span>
            ) : null}
          </FieldRow>

          <FieldRow label={t.marginLabel} id="xc-margin" hint={t.marginHint}>
            {MARGINS.map((m) => (
              <Chip
                key={m}
                active={margin === m}
                onClick={() => setMargin(m)}
              >
                {fmtPct(m, locale, 1)}
              </Chip>
            ))}
            <NumberField
              id="xc-margin"
              value={margin}
              onCommit={setMargin}
              locale={locale}
              decimals
              suffix={locale === "fa" ? "٪" : "%"}
              ariaLabel={t.marginLabel}
              clampRange={[0, 20, 0.1]}
            />
          </FieldRow>

          <FieldRow label={`${copy.common.amount} (${code})`} id="xc-amount">
            <NumberField
              id="xc-amount"
              value={amount}
              onCommit={setAmount}
              locale={locale}
              decimals
              ariaLabel={copy.common.amount}
              clampRange={[0, 1_000_000_000, 0.01]}
            />
          </FieldRow>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <ResultLine
            caption={t.quoteLabel}
            value={`${fmtMoney(quote, locale, 0)} ${copy.common.toman}`}
            sub={`${copy.common.tomanPerUnit}`}
          />
          <ResultLine
            caption={t.totalLabel}
            value={`${fmtMoney(total, locale, 0)} ${copy.common.toman}`}
          />
          <ResultLine
            caption={t.profitLabel}
            value={`${fmtMoney(profit, locale, 0)} ${copy.common.toman}`}
          />
        </div>

        <p className="mt-3 mb-0 text-[12.5px] font-semibold text-[var(--color-text-secondary)]">
          {t.strong}
        </p>
        <p className="mt-1.5 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.basisNote}
          {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
        </p>
      </SectionCard>
    </>
  );
}
