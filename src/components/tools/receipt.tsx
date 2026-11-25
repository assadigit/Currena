"use client";

/**
 * رسیدساز ارزی — write the deal, print a clean receipt. The form is
 * the tool; the preview is the receipt itself (a quiet paper card),
 * and the print path isolates the sheet exactly the way the digest's
 * print does (a body class for the print medium, self-cleaned after).
 */

import * as React from "react";
import { Printer } from "lucide-react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  FieldRow,
  NumberField,
  Picker,
  PillButton,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { findFx, tomanPerUnit, useRates } from "@/lib/tools/rates";
import { receiptTotals, type DealSide } from "@/lib/tools/engines";
import { fmtDateTime, fmtMoney, fmtToday, toFaDigits } from "@/lib/tools/fmt";

export default function ReceiptTool() {
  return (
    <ToolPage tool="exchange-receipt">
      {(locale) => <ReceiptBody locale={locale} />}
    </ToolPage>
  );
}

function ReceiptBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.receipt;

  const { snap, state } = useRates();
  const [side, setSide] = React.useState<DealSide>("sell");
  const [shop, setShop] = React.useState("");
  const [no, setNo] = React.useState(1001);
  const [customer, setCustomer] = React.useState("");
  const [code, setCode] = React.useState("USD");
  const [amount, setAmount] = React.useState(100);
  const [rateText, setRateText] = React.useState(0);
  const [rateTouched, setRateTouched] = React.useState(false);
  const [fee, setFee] = React.useState(0);
  const [note, setNote] = React.useState("");

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

  const totals = receiptTotals(side, amount, rateText > 0 ? rateText : 0, fee);
  const today = fmtToday(locale);
  const nowLabel = fmtDateTime(new Date(), locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const print = () => {
    document.body.classList.add("receipt-printing");
    const clean = () => document.body.classList.remove("receipt-printing");
    window.addEventListener("afterprint", clean, { once: true });
    window.setTimeout(clean, 2000);
    window.print();
  };

  const digits = (v: string) => (locale === "fa" ? toFaDigits(v) : v);

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "رسیدساز ارزی" : "Exchange Receipt"}
        promise={t.promise}
      />

      <SectionCard className="mb-3">
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={copy.common.basis}>
          <PillButton
            label={t.sideSell}
            onClick={() => setSide("sell")}
            id="rc-side-sell"
            tone={side === "sell" ? "accent" : "quiet"}
          />
          <PillButton
            label={t.sideBuy}
            onClick={() => setSide("buy")}
            id="rc-side-buy"
            tone={side === "buy" ? "accent" : "quiet"}
          />
        </div>

        <div className="divide-y divide-[var(--color-border)]/60">
          <FieldRow label={t.shopLabel} id="rc-shop">
            <input
              id="rc-shop"
              type="text"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder={t.shopPh}
              dir="auto"
              className="h-10 w-[15rem] max-w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13.5px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
            />
          </FieldRow>
          <FieldRow label={t.noLabel} id="rc-no">
            <NumberField
              id="rc-no"
              value={no}
              onCommit={setNo}
              locale={locale}
              ariaLabel={t.noLabel}
              clampRange={[1, 9_999_999, 1]}
            />
          </FieldRow>
          <FieldRow label={t.dateLabel}>
            <span className="text-[13.5px] font-bold text-[var(--color-text-primary)]">
              {today}
            </span>
          </FieldRow>
          <FieldRow label={t.customerLabel} id="rc-customer">
            <input
              id="rc-customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={t.customerPh}
              dir="auto"
              className="h-10 w-[13rem] max-w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13.5px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
            />
          </FieldRow>
          <FieldRow label={copy.common.currencyLabel} id="rc-code">
            <Picker
              id="rc-code"
              value={code}
              options={safeOptions}
              onChange={(v) => {
                setCode(v);
                setRateTouched(false);
              }}
              ariaLabel={copy.common.currencyLabel}
            />
          </FieldRow>
          <FieldRow label={`${copy.common.amount} (${code})`} id="rc-amount">
            <NumberField
              id="rc-amount"
              value={amount}
              onCommit={setAmount}
              locale={locale}
              decimals
              ariaLabel={copy.common.amount}
              clampRange={[0, 1_000_000_000, 0.01]}
            />
          </FieldRow>
          <FieldRow label={t.rateLabel} id="rc-rate">
            <NumberField
              id="rc-rate"
              value={rateText}
              onCommit={(v) => {
                setRateText(v);
                setRateTouched(true);
              }}
              locale={locale}
              ariaLabel={t.rateLabel}
              clampRange={[0, 100_000_000, 1]}
            />
          </FieldRow>
          <FieldRow label={t.feeLabel} id="rc-fee">
            <NumberField
              id="rc-fee"
              value={fee}
              onCommit={setFee}
              locale={locale}
              ariaLabel={t.feeLabel}
              clampRange={[0, 1_000_000_000, 100]}
            />
          </FieldRow>
          <FieldRow label={t.noteLabel} id="rc-note">
            <input
              id="rc-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePh}
              dir="auto"
              className="h-10 w-[15rem] max-w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13.5px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
            />
          </FieldRow>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PillButton label={copy.common.print} onClick={print} id="rc-print" tone="accent" />
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)]">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            {t.preview}
          </span>
          {shop.trim() === "" ? (
            <span className="text-[12px] font-semibold text-[var(--color-currena-warning-deep)]">
              {t.needShop}
            </span>
          ) : null}
        </div>
        <p className="mt-2 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.disclaimerLine}
          {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
        </p>
      </SectionCard>

      {/* ------------------------------------------------- the receipt */}
      <div
        id="receipt-sheet"
        dir={copy.dir}
        className="mx-auto w-full max-w-[380px] rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cr-shadow-card)]"
      >
        <div className="text-center">
          <p className="m-0 text-[15.5px] font-extrabold text-[var(--color-text-primary)]">
            {shop.trim() === "" ? "—" : shop}
          </p>
          <p className="m-0 mt-0.5 text-[11px] font-bold text-[var(--color-text-tertiary)]">
            {t.preview} · {nowLabel}
          </p>
          <p className="m-0 mt-2 border-y border-dashed border-[var(--color-border)] py-1.5 text-[12px] font-extrabold tracking-wide text-[var(--color-currena-blue-deep)]">
            {locale === "fa" ? "رسید معاملهٔ ارزی" : "CURRENCY EXCHANGE RECEIPT"}
          </p>
        </div>

        <dl className="mt-3 space-y-1.5 text-[12.5px]">
          <Row dt={t.noLabel} dd={digits(fmtMoney(no, locale, 0))} />
          <Row dt={t.dateLabel} dd={today} />
          <Row dt={t.sideLabel} dd={side === "sell" ? t.sideSell : t.sideBuy} />
          <Row dt={t.customerLabel} dd={customer.trim() === "" ? "—" : customer} />
          <Row
            dt={copy.common.amount}
            dd={`${digits(fmtMoney(amount, locale, 2))} ${code}`}
          />
          <Row
            dt={t.rateLabel.replace(/\s*\(.*\)/, "")}
            dd={`${digits(fmtMoney(rateText, locale, 0))}`}
          />
          <Row dt={t.gross} dd={`${digits(fmtMoney(totals.gross, locale, 0))} ${copy.common.toman}`} />
          <Row dt={t.feeWord} dd={`${digits(fmtMoney(totals.fee, locale, 0))} ${copy.common.toman}`} />
        </dl>

        <div className="mt-3 rounded-xl bg-[var(--color-currena-soft)] px-4 py-3 text-center">
          <p className="m-0 text-[11px] font-bold text-[var(--color-text-tertiary)]">
            {t.payable}
          </p>
          <p dir="ltr" className="m-0 mt-0.5 text-[1.3rem] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
            {digits(fmtMoney(totals.payable, locale, 0))} {copy.common.toman}
          </p>
        </div>

        {note.trim() !== "" ? (
          <p className="mt-3 mb-0 rounded-xl bg-[var(--color-currena-bg-light)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]">
            {note}
          </p>
        ) : null}

        <p className="mt-3 mb-0 text-center text-[10.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.footerLine}
          <br />
          {t.printedBy}
        </p>
      </div>
    </>
  );
}

function Row({ dt, dd }: { dt: string; dd: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 font-semibold text-[var(--color-text-tertiary)]">{dt}</dt>
      <dd dir="auto" className="m-0 text-end font-bold text-[var(--color-text-primary)]">
        {dd}
      </dd>
    </div>
  );
}
