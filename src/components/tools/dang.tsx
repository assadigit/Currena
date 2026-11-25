"use client";

/**
 * محاسبه دنگ — «دنگ کردن»: the fair split of a shared amount. Equal
 * mode is the common convention (each share = the whole ÷ the number
 * of people); weighted mode carries the same whole by per-person
 * weights. Shares are rounded for reading, with the exact figure beside
 * each one — nothing hidden, nothing invented.
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  AddButton,
  Chip,
  FieldRow,
  NumberField,
  Picker,
  RemoveButton,
  ResultLine,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { findFx, useRates } from "@/lib/tools/rates";
import { dangEqual, dangWeighted } from "@/lib/tools/engines";
import { fmtMoney } from "@/lib/tools/fmt";

type Mode = "equal" | "weighted";

interface Person {
  id: number;
  name: string;
  weight: number;
}

export default function DangTool() {
  return (
    <ToolPage tool="dang">
      {(locale) => <DangBody locale={locale} />}
    </ToolPage>
  );
}

function DangBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.dang;

  const { snap } = useRates();
  const [mode, setMode] = React.useState<Mode>("equal");
  const [code, setCode] = React.useState("IRR");
  const [total, setTotal] = React.useState(1_000_000);
  const [people, setPeople] = React.useState<Person[]>([
    { id: 1, name: "", weight: 1 },
    { id: 2, name: "", weight: 1 },
    { id: 3, name: "", weight: 1 },
  ]);
  const seq = React.useRef(4);

  const nameOf = (p: Person, i: number) =>
    p.name.trim() !== "" ? p.name.trim() : t.personDefault.replace("{n}", String(i + 1));

  const options = (snap?.rates ?? []).map((r) => ({
    value: r.code,
    label: `${currencyName(copy, locale, r.code)}${r.code === "IRR" ? "" : ` · ${r.symbol ?? r.code}`}`,
  }));
  const safeOptions = options.length ? options : [{ value: code, label: code }];
  const unit = code === "IRR" ? copy.common.toman : code;

  const shares =
    mode === "equal"
      ? dangEqual(total, people.length)
      : dangWeighted(total, people.map((p) => p.weight));
  const sumRounded = shares.reduce((a, s) => a + s.rounded, 0);
  const digits = code === "IRR" ? 0 : 2;

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "محاسبه دنگ" : "Dang — the Fair Split"}
        promise={t.promise}
      />

      <SectionCard>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={copy.common.basis}>
          <Chip active={mode === "equal"} onClick={() => setMode("equal")}>
            {t.modeEqual}
          </Chip>
          <Chip active={mode === "weighted"} onClick={() => setMode("weighted")}>
            {t.modeWeighted}
          </Chip>
        </div>

        <div className="divide-y divide-[var(--color-border)]/60">
          <FieldRow label={t.totalLabel} id="dg-total">
            <NumberField
              id="dg-total"
              value={total}
              onCommit={setTotal}
              locale={locale}
              decimals
              big
              ariaLabel={t.totalLabel}
              clampRange={[0, 1_000_000_000_000, 100]}
            />
            <Picker
              id="dg-code"
              value={code}
              options={safeOptions}
              onChange={setCode}
              ariaLabel={copy.common.currencyLabel}
            />
          </FieldRow>
        </div>

        {/* the people */}
        <div className="mt-4">
          <p className="m-0 mb-2 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
            {copy.common.people} — {fmtMoney(people.length, locale, 0)}
          </p>
          <div className="space-y-2">
            {people.map((p, i) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-currena-bg-light)] px-3 py-2"
              >
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) =>
                    setPeople((ps) => ps.map((q) => (q.id === p.id ? { ...q, name: e.target.value } : q)))
                  }
                  placeholder={t.personDefault.replace("{n}", String(i + 1))}
                  dir="auto"
                  aria-label={`${copy.common.name} ${i + 1}`}
                  className="h-9 w-[9.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
                />
                {mode === "weighted" ? (
                  <NumberField
                    id={`dg-weight-${p.id}`}
                    value={p.weight}
                    onCommit={(v) =>
                      setPeople((ps) => ps.map((q) => (q.id === p.id ? { ...q, weight: v } : q)))
                    }
                    locale={locale}
                    decimals
                    suffix="×"
                    ariaLabel={`${t.weightLabel} ${nameOf(p, i)}`}
                    clampRange={[0.1, 100, 0.1]}
                  />
                ) : null}
                <span className="ms-auto flex flex-col items-end gap-0.5 leading-tight">
                  <span className="text-[12.5px] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
                    {fmtMoney(shares[i]?.rounded ?? 0, locale, digits)} {unit}
                  </span>
                  {shares[i] && Math.abs(shares[i].exact - shares[i].rounded) > 0.005 ? (
                    <span className="text-[10.5px] font-semibold tabular-nums text-[var(--color-text-tertiary)]">
                      {t.exactHint.replace(
                        "{value}",
                        fmtMoney(shares[i].exact, locale, 2)
                      )}
                    </span>
                  ) : null}
                </span>
                {people.length > 2 ? (
                  <RemoveButton
                    label={`${copy.common.remove} ${nameOf(p, i)}`}
                    onClick={() => setPeople((ps) => ps.filter((q) => q.id !== p.id))}
                    id={`dg-rm-${p.id}`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AddButton
              label={t.addPerson}
              onClick={() => {
                setPeople((ps) => [...ps, { id: seq.current, name: "", weight: 1 }]);
                seq.current += 1;
              }}
              id="dg-add"
            />
            {mode === "weighted" ? (
              <span className="text-[11px] text-[var(--color-text-tertiary)]">{t.weightHint}</span>
            ) : null}
          </div>
        </div>

        {/* the answer */}
        <div className="mt-4">
          <ResultLine
            caption={t.headline
              .replace("{total}", fmtMoney(total, locale, digits))
              .replace("{n}", fmtMoney(people.length, locale, 0))
              .replace("{share}", fmtMoney(shares[0]?.rounded ?? 0, locale, digits))
              .replace("{each}", unit)}
            value={`${fmtMoney(shares[0]?.rounded ?? 0, locale, digits)} ${unit}`}
            sub={t.sumLine
              .replace("{sum}", fmtMoney(sumRounded, locale, digits))
              .replace("{total}", fmtMoney(total, locale, digits))}
          />
        </div>

        <p className="mt-3 mb-0 text-[12.5px] font-semibold text-[var(--color-text-secondary)]">
          {t.strong}
        </p>
        <p className="mt-1.5 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.rounding} ·{" "}
          {mode === "equal" ? t.formulaEqual : t.formulaWeighted}
        </p>
      </SectionCard>
    </>
  );
}
