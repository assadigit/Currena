"use client";

/**
 * تسویه گروهی — who paid, who owes. The expenses are entered as paid
 * (payer + amount); every expense is shared equally among everyone, so
 * each person's net is what they paid minus their fair share. The
 * settlement is the smallest set of transfers that squares everyone
 * (the greedy pairing, never more than people − 1 transfers).
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  AddButton,
  FieldRow,
  NumberField,
  Picker,
  PillButton,
  RemoveButton,
  ResultLine,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { useRates } from "@/lib/tools/rates";
import {
  netBalances,
  settleTransfers,
  type Expense,
} from "@/lib/tools/engines";
import { fmtMoney } from "@/lib/tools/fmt";

interface Person {
  id: number;
  name: string;
}

interface ExpenseRow {
  id: number;
  payer: number; // person id
  amount: number;
}

export default function SettleTool() {
  return (
    <ToolPage tool="group-settlement">
      {(locale) => <SettleBody locale={locale} />}
    </ToolPage>
  );
}

function SettleBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.settle;

  const { snap } = useRates();
  const [code, setCode] = React.useState("IRR");
  const [people, setPeople] = React.useState<Person[]>([
    { id: 1, name: "" },
    { id: 2, name: "" },
    { id: 3, name: "" },
  ]);
  const [expenses, setExpenses] = React.useState<ExpenseRow[]>([
    { id: 1, payer: 1, amount: 900_000 },
    { id: 2, payer: 2, amount: 600_000 },
  ]);
  const seqP = React.useRef(4);
  const seqE = React.useRef(3);

  const options = (snap?.rates ?? []).map((r) => ({
    value: r.code,
    label: `${currencyName(copy, locale, r.code)}${r.code === "IRR" ? "" : ` · ${r.symbol ?? r.code}`}`,
  }));
  const safeOptions = options.length ? options : [{ value: code, label: code }];
  const unit = code === "IRR" ? copy.common.toman : code;
  const digits = code === "IRR" ? 0 : 2;

  const indexOf = (id: number) => people.findIndex((p) => p.id === id);
  const nameOf = (p: Person) =>
    p.name.trim() !== ""
      ? p.name.trim()
      : t.personDefault.replace("{n}", String(indexOf(p.id) + 1));

  const nameById = (id: number) => {
    const p = people.find((q) => q.id === id);
    return p ? nameOf(p) : "—";
  };

  const engineExpenses: Expense[] = expenses
    .filter((e) => e.amount > 0 && indexOf(e.payer) >= 0)
    .map((e) => ({ payer: indexOf(e.payer), amount: e.amount }));
  const balances = netBalances(people.length, engineExpenses);
  const transfers = settleTransfers(balances);
  const totalPaid = engineExpenses.reduce((a, e) => a + e.amount, 0);
  const perHead = people.length > 0 ? totalPaid / people.length : 0;

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "تسویه گروهی" : "Group Settlement"}
        promise={t.promise}
      />

      <SectionCard>
        <div className="divide-y divide-[var(--color-border)]/60">
          <FieldRow label={copy.common.currencyLabel} id="st-code">
            <Picker
              id="st-code"
              value={code}
              options={safeOptions}
              onChange={setCode}
              ariaLabel={copy.common.currencyLabel}
            />
          </FieldRow>
          <FieldRow label={t.totalPaid}>
            <span className="text-[13.5px] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
              {fmtMoney(totalPaid, locale, digits)} {unit}
            </span>
          </FieldRow>
          <FieldRow label={t.perHead}>
            <span className="text-[13.5px] font-bold tabular-nums text-[var(--color-text-secondary)]">
              {fmtMoney(perHead, locale, digits)} {unit}
            </span>
          </FieldRow>
        </div>

        {/* the people */}
        <div className="mt-4">
          <p className="m-0 mb-2 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
            {copy.common.people} — {fmtMoney(people.length, locale, 0)}
          </p>
          <div className="space-y-2">
            {people.map((p) => (
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
                  placeholder={t.personDefault.replace("{n}", String(indexOf(p.id) + 1))}
                  dir="auto"
                  aria-label={`${copy.common.name} ${indexOf(p.id) + 1}`}
                  className="h-9 w-[9.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
                />
                <span
                  className={`ms-auto text-[12.5px] font-extrabold tabular-nums ${
                    balances[indexOf(p.id)] > 0.5
                      ? "text-[var(--color-currena-success-deep)]"
                      : balances[indexOf(p.id)] < -0.5
                        ? "text-[var(--color-currena-warning-deep)]"
                        : "text-[var(--color-text-tertiary)]"
                  }`}
                >
                  {balances[indexOf(p.id)] > 0.5
                    ? `+${fmtMoney(balances[indexOf(p.id)], locale, digits)}`
                    : fmtMoney(balances[indexOf(p.id)], locale, digits)}{" "}
                  {unit}
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                  {balances[indexOf(p.id)] > 0.5
                    ? t.isOwed
                    : balances[indexOf(p.id)] < -0.5
                      ? t.owes
                      : t.square}
                </span>
                {people.length > 2 ? (
                  <RemoveButton
                    label={`${copy.common.remove} ${nameOf(p)}`}
                    onClick={() => setPeople((ps) => ps.filter((q) => q.id !== p.id))}
                    id={`st-rm-p-${p.id}`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <AddButton
              label={copy.dang.addPerson}
              onClick={() => {
                setPeople((ps) => [...ps, { id: seqP.current, name: "" }]);
                seqP.current += 1;
              }}
              id="st-add-p"
            />
          </div>
        </div>

        {/* the expenses */}
        <div className="mt-5">
          <p className="m-0 mb-2 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">
            {t.expenseLabel} — {fmtMoney(expenses.length, locale, 0)}
          </p>
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-currena-bg-light)] px-3 py-2"
              >
                <select
                  value={e.payer}
                  onChange={(ev) =>
                    setExpenses((es) =>
                      es.map((q) => (q.id === e.id ? { ...q, payer: Number(ev.target.value) } : q)),
                    )
                  }
                  aria-label={t.payerLabel}
                  className="h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[13px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] focus-visible:ring-2"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {nameOf(p)}
                    </option>
                  ))}
                </select>
                <NumberField
                  id={`st-amt-${e.id}`}
                  value={e.amount}
                  onCommit={(v) =>
                    setExpenses((es) => es.map((q) => (q.id === e.id ? { ...q, amount: v } : q)))
                  }
                  locale={locale}
                  decimals
                  ariaLabel={t.expenseLabel}
                  clampRange={[0, 1_000_000_000_000, 100]}
                />
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">{unit}</span>
                <RemoveButton
                  label={`${copy.common.remove} ${t.expenseLabel}`}
                  onClick={() => setExpenses((es) => es.filter((q) => q.id !== e.id))}
                  id={`st-rm-e-${e.id}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AddButton
              label={t.addExpense}
              onClick={() => {
                setExpenses((es) => [
                  ...es,
                  { id: seqE.current, payer: people[0]?.id ?? 1, amount: 0 },
                ]);
                seqE.current += 1;
              }}
              id="st-add-e"
            />
            <PillButton
              label={copy.common.sample}
              onClick={() => {
                setPeople([
                  { id: 1, name: locale === "fa" ? "آرش" : "Arash" },
                  { id: 2, name: locale === "fa" ? "سارا" : "Sara" },
                  { id: 3, name: locale === "fa" ? "نیما" : "Nima" },
                  { id: 4, name: locale === "fa" ? "ژاله" : "Zhaleh" },
                ]);
                setExpenses([
                  { id: 1, payer: 1, amount: 1_200_000 },
                  { id: 2, payer: 2, amount: 800_000 },
                  { id: 3, payer: 2, amount: 400_000 },
                  { id: 4, payer: 3, amount: 1_600_000 },
                ]);
              }}
              id="st-sample"
            />
            <PillButton
              label={copy.common.reset}
              onClick={() => {
                setPeople([
                  { id: 1, name: "" },
                  { id: 2, name: "" },
                  { id: 3, name: "" },
                ]);
                setExpenses([]);
                seqP.current = 4;
              }}
              id="st-reset"
            />
          </div>
        </div>

        {/* the settlement */}
        <div className="mt-5">
          <h2 className="m-0 mb-2 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {t.transfersTitle}
          </h2>
          {transfers.length === 0 ? (
            <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {t.none}
            </p>
          ) : (
            <div className="space-y-2">
              {transfers.map((tr, i) => (
                <ResultLine
                  key={i}
                  caption={t.transferLine
                    .replace("{from}", nameById(people[tr.from]?.id ?? -1))
                    .replace("{to}", nameById(people[tr.to]?.id ?? -1))}
                  value={`${fmtMoney(tr.amount, locale, digits)} ${unit}`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {copy.dang.formulaEqual} — {copy.common.basis}: {t.perHead.toLowerCase()}:{" "}
          {fmtMoney(perHead, locale, digits)} {unit}.
        </p>
      </SectionCard>
    </>
  );
}
