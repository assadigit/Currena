"use client";

/**
 * تبدیل گروهی ارزها — a pocket of several currencies, counted
 * together into one. Each line is a currency and an amount; the live
 * board converts every line, and the total lands in the target
 * currency (toman by default — the question the pocket usually asks).
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  AddButton,
  FieldRow,
  NumberField,
  Picker,
  RemoveButton,
  ResultLine,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { convertAmount, findFx, useRates, type FxRow } from "@/lib/tools/rates";
import { fmtMoney } from "@/lib/tools/fmt";

interface Line {
  id: number;
  code: string;
  amount: number;
}

export default function BatchTool() {
  return (
    <ToolPage tool="batch-converter">
      {(locale) => <BatchBody locale={locale} />}
    </ToolPage>
  );
}

function BatchBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.batch;

  const { snap, state } = useRates();
  const [target, setTarget] = React.useState("IRR");
  const [lines, setLines] = React.useState<Line[]>([
    { id: 1, code: "USD", amount: 100 },
    { id: 2, code: "EUR", amount: 100 },
  ]);
  const seq = React.useRef(3);

  const options = (snap?.rates ?? []).map((r) => ({
    value: r.code,
    label: `${currencyName(copy, locale, r.code)}${r.code === "IRR" ? "" : ` · ${r.symbol ?? r.code}`}`,
  }));
  const safeOptions = options.length ? options : [{ value: "USD", label: "USD" }];

  const to = findFx(snap, target);
  const unit = target === "IRR" ? copy.common.toman : target;
  const digits = target === "IRR" ? 0 : 2;

  const converted = lines.map((l) => {
    const from = findFx(snap, l.code);
    const value = from && to ? convertAmount(l.amount, from, to) : NaN;
    return { ...l, value };
  });
  const anyNaN = converted.some((c) => !Number.isFinite(c.value));
  const total = anyNaN
    ? NaN
    : converted.reduce((a, c) => a + (Number.isFinite(c.value) ? c.value : 0), 0);

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "تبدیل گروهی ارزها" : "Batch Currency Conversion"}
        promise={t.promise}
      />

      <SectionCard>
        <div className="divide-y divide-[var(--color-border)]/60">
          <FieldRow label={t.targetLabel} id="bc-target">
            <Picker
              id="bc-target"
              value={target}
              options={safeOptions}
              onChange={setTarget}
              ariaLabel={t.targetLabel}
            />
          </FieldRow>
        </div>

        {/* the lines */}
        <div className="mt-4">
          <p className="m-0 mb-2 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
            {t.rowLabel} — {t.countLine.replace("{n}", fmtMoney(lines.length, locale, 0))}
          </p>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-currena-bg-light)] px-3 py-2"
              >
                <Picker
                  id={`bc-code-${l.id}`}
                  value={l.code}
                  options={safeOptions}
                  onChange={(v) =>
                    setLines((ls) => ls.map((q) => (q.id === l.id ? { ...q, code: v } : q)))
                  }
                  ariaLabel={copy.common.currencyLabel}
                />
                <NumberField
                  id={`bc-amt-${l.id}`}
                  value={l.amount}
                  onCommit={(v) =>
                    setLines((ls) => ls.map((q) => (q.id === l.id ? { ...q, amount: v } : q)))
                  }
                  locale={locale}
                  decimals
                  ariaLabel={copy.common.amount}
                  clampRange={[0, 1_000_000_000, 0.01]}
                />
                <span className="ms-auto text-[12.5px] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
                  {Number.isFinite(converted[i]?.value)
                    ? fmtMoney(converted[i].value, locale, digits)
                    : "—"}{" "}
                  {unit}
                </span>
                {lines.length > 1 ? (
                  <RemoveButton
                    label={`${copy.common.remove} ${l.code}`}
                    onClick={() => setLines((ls) => ls.filter((q) => q.id !== l.id))}
                    id={`bc-rm-${l.id}`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <AddButton
              label={t.addRow}
              onClick={() => {
                setLines((ls) => [...ls, { id: seq.current, code: "AED", amount: 100 }]);
                seq.current += 1;
              }}
              id="bc-add"
            />
          </div>
        </div>

        {/* the total */}
        <div className="mt-4">
          {lines.length === 0 ? (
            <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {t.empty}
            </p>
          ) : (
            <ResultLine
              caption={`${t.totalLabel} — ${t.countLine.replace("{n}", fmtMoney(lines.length, locale, 0))}`}
              value={`${Number.isFinite(total) ? fmtMoney(total, locale, digits) : "—"} ${unit}`}
              sub={
                state === "loading"
                  ? copy.common.liveWaiting
                  : state === "error"
                    ? copy.common.liveFailed
                    : undefined
              }
            />
          )}
        </div>

        <p className="mt-3 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {copy.converter.basisNote}
          {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
        </p>
      </SectionCard>
    </>
  );
}
