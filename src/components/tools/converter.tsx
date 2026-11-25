"use client";

/**
 * مبدل ارز — the tools-native currency converter: live free-market
 * rates, any two currencies through the toman (the snapshot's own
 * direction: foreign units per toman), with the rate and its inverse
 * stated and the source line carried honestly.
 */

import * as React from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  Chip,
  NumberField,
  Picker,
  ResultLine,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import {
  convertAmount,
  findFx,
  useRates,
  type FxRow,
} from "@/lib/tools/rates";
import { fmtMoney, fmtRate } from "@/lib/tools/fmt";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "IRR";
const QUICK = [10, 50, 100, 500, 1000];

export default function ConverterTool() {
  return (
    <ToolPage tool="currency-converter">
      {(locale) => <ConverterBody locale={locale} />}
    </ToolPage>
  );
}

function ConverterBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.converter;

  const { snap, state } = useRates();
  const [fromCode, setFromCode] = React.useState(DEFAULT_FROM);
  const [toCode, setToCode] = React.useState(DEFAULT_TO);
  const [amount, setAmount] = React.useState(100);

  const from = findFx(snap, fromCode);
  const to = findFx(snap, toCode);
  const both = from && to && from.code !== to.code;
  const converted = both ? convertAmount(amount, from as FxRow, to as FxRow) : NaN;

  const options = (snap?.rates ?? []).map((r) => ({
    value: r.code,
    label: `${currencyName(copy, locale, r.code)}${r.code === "IRR" ? "" : ` · ${r.symbol ?? r.code}`}`,
  }));
  const safeOptions = options.length ? options : [{ value: fromCode, label: fromCode }];

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const direct = both ? convertAmount(1, from as FxRow, to as FxRow) : NaN;
  const inverse = both ? convertAmount(1, to as FxRow, from as FxRow) : NaN;
  const moneyDigits = toCode === "IRR" ? 0 : 2;

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "مبدل ارز" : "Currency Converter"}
        promise={t.promise}
      />

      <SectionCard>
        <p className="m-0 mb-1.5 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
          {t.amountLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <NumberField
            id="cv-amount"
            value={amount}
            onCommit={setAmount}
            locale={locale}
            decimals
            big
            ariaLabel={t.amountLabel}
            clampRange={[0, 1_000_000_000, 0.01]}
          />
          <Picker
            id="cv-from"
            value={fromCode}
            options={safeOptions}
            onChange={setFromCode}
            ariaLabel={`${copy.common.from} ${copy.common.currencyLabel}`}
          />
          <button
            type="button"
            id="cv-swap"
            onClick={swap}
            aria-label={copy.common.swap}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.05] active:scale-95"
          >
            <ArrowLeftRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <Picker
            id="cv-to"
            value={toCode}
            options={safeOptions}
            onChange={setToCode}
            ariaLabel={`${copy.common.to} ${copy.common.currencyLabel}`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label={t.quickAmounts}>
          <span className="me-1 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
            {t.quickAmounts}:
          </span>
          {QUICK.map((q) => (
            <Chip key={q} active={amount === q} onClick={() => setAmount(q)}>
              {fmtMoney(q, locale, 0)}
            </Chip>
          ))}
        </div>

        <div className="mt-4">
          {state === "loading" ? (
            <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {copy.common.liveWaiting}
            </p>
          ) : !both ? (
            <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {t.needBoth}
            </p>
          ) : (
            <ResultLine
              caption={`${fmtMoney(amount, locale, 2)} ${currencyName(copy, locale, fromCode)} ${copy.common.to} ${currencyName(copy, locale, toCode)} — ${t.resultLabel}`}
              value={`${fmtMoney(converted, locale, moneyDigits)} ${toCode === "IRR" ? copy.common.unitToman : toCode}`}
              sub={
                `${t.rateLine.replace("{from}", fromCode).replace("{rate}", fmtRate(direct, locale)).replace("{to}", toCode)} · ` +
                t.inverseLine.replace("{to}", toCode).replace("{rate}", fmtRate(inverse, locale)).replace("{from}", fromCode)
              }
            />
          )}
        </div>

        <p className="mt-3 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.basisNote}
          {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
        </p>
      </SectionCard>
    </>
  );
}
