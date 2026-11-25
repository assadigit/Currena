"use client";

/**
 * تابلوی نرخ‌های لحظه‌ای — the whole board: every currency row in
 * toman-per-unit with its own day range, and every gold row (the
 * bazaar's daily rows in toman; the global ounce in USD). Refreshed
 * every minute through the shared hook; the honest states render as
 * themselves.
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import { PillButton, SectionCard } from "@/components/tools/atoms";
import { TOOLS_COPY, currencyName, goldRowLabel } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import { findGold, useRates, type GoldRow } from "@/lib/tools/rates";
import { fmtDateTime, fmtMoney } from "@/lib/tools/fmt";

const GOLD_ORDER = [
  "gold-mesghal",
  "gold-24k",
  "gold-18k",
  "gold-used",
  "coin-emami",
  "coin-bahar",
  "coin-half",
  "coin-quarter",
  "coin-gram",
  "gold-ounce",
];

export default function LiveRatesTool() {
  return (
    <ToolPage tool="live-rates">
      {(locale) => <BoardBody locale={locale} />}
    </ToolPage>
  );
}

function BoardBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.board;
  const { snap, state, fetchedAt, refresh } = useRates();
  const [busy, setBusy] = React.useState(false);

  const stamp = fetchedAt
    ? `${copy.common.lastUpdate}: ${fmtDateTime(fetchedAt, locale, {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : copy.common.refreshing;

  const onRefresh = () => {
    setBusy(true);
    refresh();
    window.setTimeout(() => setBusy(false), 800);
  };

  const fxRows = snap?.rates ?? [];
  const goldRows = GOLD_ORDER.map((id) => findGold(snap, id)).filter(
    (g): g is GoldRow => g !== null,
  );

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "تابلوی نرخ‌های لحظه‌ای" : "Live Rates Board"}
        promise={t.promise}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12px] font-semibold text-[var(--color-text-secondary)]">
          {copy.common.autoRefresh} · {stamp}
        </p>
        <PillButton label={busy ? copy.common.refreshing : copy.common.refresh} onClick={onRefresh} id="board-refresh" />
      </div>

      {state === "loading" ? (
        <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-text-secondary)]">
          {copy.common.liveWaiting}
        </p>
      ) : state === "error" && fxRows.length === 0 ? (
        <p className="m-0 rounded-2xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[13px] font-semibold text-[var(--color-currena-warning-deep)]">
          {copy.common.liveFailed}
        </p>
      ) : (
        <>
          {/* ------------------------------------------------ currencies */}
          <SectionCard className="mb-3">
            <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {t.fxTitle}
            </h2>
            <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.fxNote}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[13px]">
                <thead>
                  <tr className="type-caption text-[var(--color-text-tertiary)]">
                    <th scope="col" className="px-2 py-1.5 text-start font-bold">
                      {copy.common.currencyLabel}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.tomanPerUnit}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.high}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.low}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fxRows.map((r) => (
                    <tr
                      key={r.code}
                      className="border-t border-[var(--color-border)]/60 tabular-nums"
                    >
                      <td className="px-2 py-2 text-start font-bold text-[var(--color-text-primary)]">
                        {currencyName(copy, locale, r.code)}
                        <span className="ms-1.5 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                          {r.symbol ?? r.code}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-end font-extrabold text-[var(--color-currena-blue-deep)]">
                        {fmtMoney(r.rate > 0 ? Math.round(1 / r.rate) : 0, locale, 0)}
                      </td>
                      <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                        {fmtMoney(r.dayHigh ?? 0, locale, 0)}
                      </td>
                      <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                        {fmtMoney(r.dayLow ?? 0, locale, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ------------------------------------------------------- gold */}
          <SectionCard>
            <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
              {t.goldTitle}
            </h2>
            <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.goldNote}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[13px]">
                <thead>
                  <tr className="type-caption text-[var(--color-text-tertiary)]">
                    <th scope="col" className="px-2 py-1.5 text-start font-bold">
                      {t.goldTitle}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.rate}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.high}
                    </th>
                    <th scope="col" className="px-2 py-1.5 text-end font-bold">
                      {copy.common.low}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {goldRows.map((g) => (
                    <tr
                      key={g.id}
                      className="border-t border-[var(--color-border)]/60 tabular-nums"
                    >
                      <td className="px-2 py-2 text-start font-bold text-[var(--color-text-primary)]">
                        {goldRowLabel(copy, locale, g.id)}
                      </td>
                      <td className="px-2 py-2 text-end font-extrabold text-[var(--color-currena-blue-deep)]">
                        {fmtMoney(g.price, locale, g.unit === "USD" ? 2 : 0)}
                        <span className="ms-1 text-[10.5px] font-semibold text-[var(--color-text-tertiary)]">
                          {g.unit === "USD" ? t.ounceUsd : copy.common.toman}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                        {fmtMoney(g.dayHigh ?? 0, locale, 0)}
                      </td>
                      <td className="px-2 py-2 text-end text-[var(--color-text-secondary)]">
                        {fmtMoney(g.dayLow ?? 0, locale, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {goldRows.some((g) => g.marketAt) ? (
              <p className="mt-2 mb-0 text-[11px] text-[var(--color-text-tertiary)]">
                {copy.common.lastUpdate}:{" "}
                {fmtDateTime(
                  goldRows.find((g) => g.marketAt)?.marketAt ?? "",
                  locale,
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </p>
            ) : null}
          </SectionCard>
        </>
      )}

      <p className="mt-3 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
        {copy.converter.basisNote}
        {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
      </p>
    </>
  );
}
