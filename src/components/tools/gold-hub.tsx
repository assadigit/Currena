"use client";

/**
 * محاسبه‌گرهای طلا — the gold hub: ALL the gold tools imported onto
 * one dedicated page (the owner's instruction), on live prices. Four
 * sections, one in-page nav, the bazaar's own constants stated on the
 * page: value (with the shop-invoice fold), mesghal ↔ grams, karat
 * conversion, and today's board — with the desk one link away.
 */

import * as React from "react";
import { ToolIntro, ToolPage } from "@/components/tools/shell";
import {
  Chip,
  FieldRow,
  Fold,
  NumberField,
  SectionCard,
} from "@/components/tools/atoms";
import { TOOLS_COPY, goldRowLabel } from "@/lib/tools/copy";
import type { Locale } from "@/lib/compound/content";
import {
  findGold,
  gramPriceForKarat,
  useRates,
} from "@/lib/tools/rates";
import {
  goldValue,
  jewelleryInvoice,
  karatConvert,
  mesghalToGram,
} from "@/lib/tools/engines";
import { fmtMoney } from "@/lib/tools/fmt";

const KARATS = [24, 22, 18, 14, 12];
const BOARD_ROWS = [
  "gold-mesghal",
  "gold-24k",
  "gold-18k",
  "coin-emami",
  "coin-bahar",
  "coin-half",
  "coin-quarter",
  "coin-gram",
  "gold-ounce",
];

export default function GoldHubTool() {
  return (
    <ToolPage tool="gold-calculators" wide>
      {(locale) => <GoldHubBody locale={locale} />}
    </ToolPage>
  );
}

function GoldHubBody({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.goldHub;

  const { snap, state } = useRates();

  /* -------------------------------------------------- the in-page nav */
  const nav = [
    { href: "#gold-value", label: t.navValue },
    { href: "#gold-units", label: t.navUnits },
    { href: "#gold-karat", label: t.navKarat },
    { href: "#gold-board", label: t.navBoard },
  ];

  return (
    <>
      <ToolIntro
        eyebrow={copy.index.eyebrow}
        title={locale === "fa" ? "محاسبه‌گرهای طلا" : "Gold Calculators"}
        promise={t.promise}
      />

      <nav
        aria-label={copy.index.title}
        className="mb-3 flex flex-wrap gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--cr-shadow-card)]"
      >
        {nav.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-[12.5px] font-extrabold text-[var(--color-currena-blue-deep)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            {n.label}
          </a>
        ))}
      </nav>

      <ValueSection locale={locale} />
      <UnitsSection locale={locale} />
      <KaratSection locale={locale} />

      {/* ------------------------------------------------- today's board */}
      <SectionCard id="gold-board" className="mb-3">
        <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {t.boardTitle}
        </h2>
        <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.boardNote}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] border-collapse text-[13px]">
            <tbody>
              {BOARD_ROWS.map((id) => {
                const g = findGold(snap, id);
                if (!g) return null;
                return (
                  <tr key={id} className="border-t border-[var(--color-border)]/60 tabular-nums">
                    <td className="px-2 py-2 text-start font-bold text-[var(--color-text-primary)]">
                      {goldRowLabel(copy, locale, id)}
                    </td>
                    <td className="px-2 py-2 text-end font-extrabold text-[var(--color-currena-blue-deep)]">
                      {fmtMoney(g.price, locale, g.unit === "USD" ? 2 : 0)}
                      <span className="ms-1 text-[10.5px] font-semibold text-[var(--color-text-tertiary)]">
                        {g.unit === "USD"
                          ? locale === "fa"
                            ? "دلار"
                            : "USD"
                          : copy.common.toman}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href="/tools/live-rates"
            className="text-[12.5px] font-extrabold text-[var(--color-currena-blue-deep)] hover:underline"
          >
            {locale === "fa" ? "تابلوی کامل نرخ‌ها" : "The full rates board"} ↖
          </a>
          <a
            href="https://currena.ir/gold"
            className="text-[12.5px] font-extrabold text-[var(--color-currena-blue-deep)] hover:underline"
          >
            {t.deskLink}
          </a>
        </div>
        <p className="mt-2 mb-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {t.deskLine}
          {state === "error" ? ` — ${copy.common.liveFailed}` : ""}
        </p>
      </SectionCard>

      <p className="m-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
        {t.basisNote} · {copy.common.basis}: ۱ {locale === "fa" ? "مثقال" : "mesghal"} ={" "}
        {locale === "fa" ? "۴٫۶۰۸۳" : "4.6083"} {locale === "fa" ? "گرم (۱۷ عیار)" : "g (17k)"} ={" "}
        {locale === "fa" ? "۴٫۳۳۱۸" : "4.3318"} {locale === "fa" ? "گرم (مبنای ۱۸ عیار)" : "g (18k basis)"}.
      </p>
    </>
  );
}

/* =================================================================== *
 * Section A — the value                                                *
 * =================================================================== */

function ValueSection({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.goldHub;
  const { snap } = useRates();

  const [karat, setKarat] = React.useState(18);
  const [grams, setGrams] = React.useState(5);
  const [buyOpen, setBuyOpen] = React.useState(false);
  const [wage, setWage] = React.useState(7);
  const [profit, setProfit] = React.useState(7);
  const [vat, setVat] = React.useState(9);

  const perGram = gramPriceForKarat(snap, karat);
  const value = perGram ? goldValue(grams, perGram) : NaN;
  const inv = jewelleryInvoice({
    grams,
    perGram: perGram ?? 0,
    wagePct: wage,
    profitPct: profit,
    vatPct: vat,
  });

  return (
    <SectionCard id="gold-value" className="mb-3">
      <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
        {t.valueTitle}
      </h2>
      <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.valuePromise}</p>

      <div className="divide-y divide-[var(--color-border)]/60">
        <FieldRow label={t.karatLabel} id="gv-karat">
          {KARATS.map((k) => (
            <Chip key={k} active={karat === k} onClick={() => setKarat(k)}>
              {fmtMoney(k, locale, 0)}
            </Chip>
          ))}
        </FieldRow>
        <FieldRow label={t.weightLabel} id="gv-grams">
          <NumberField
            id="gv-grams"
            value={grams}
            onCommit={setGrams}
            locale={locale}
            decimals
            big
            ariaLabel={t.weightLabel}
            clampRange={[0, 100_000, 0.01]}
          />
        </FieldRow>
        <FieldRow label={t.metalValue}>
          <span className="text-[13.5px] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
            {Number.isFinite(value) ? fmtMoney(value, locale, 0) : "—"} {copy.common.toman}
          </span>
        </FieldRow>
      </div>

      {/* the shop invoice fold */}
      <div className="mt-4">
        <Fold
          idPrefix="gv-invoice"
          title={t.buyFold}
          open={buyOpen}
          onToggle={() => setBuyOpen((v) => !v)}
        >
          <div className="divide-y divide-[var(--color-border)]/60">
            <FieldRow label={t.wageLabel} id="gv-wage">
              <NumberField
                id="gv-wage"
                value={wage}
                onCommit={setWage}
                locale={locale}
                decimals
                suffix={locale === "fa" ? "٪" : "%"}
                ariaLabel={t.wageLabel}
                clampRange={[0, 100, 0.1]}
              />
            </FieldRow>
            <FieldRow label={t.profitLabel} id="gv-profit">
              <NumberField
                id="gv-profit"
                value={profit}
                onCommit={setProfit}
                locale={locale}
                decimals
                suffix={locale === "fa" ? "٪" : "%"}
                ariaLabel={t.profitLabel}
                clampRange={[0, 100, 0.1]}
              />
            </FieldRow>
            <FieldRow label={t.vatLabel} id="gv-vat">
              <NumberField
                id="gv-vat"
                value={vat}
                onCommit={setVat}
                locale={locale}
                decimals
                suffix={locale === "fa" ? "٪" : "%"}
                ariaLabel={t.vatLabel}
                clampRange={[0, 25, 0.1]}
              />
            </FieldRow>
          </div>
          <dl className="mt-3 space-y-1.5 rounded-xl bg-[var(--color-currena-bg-light)] px-4 py-3 text-[12.5px]">
            <Inv dt={t.invoiceMetal} dd={`${fmtMoney(inv.metal, locale, 0)} ${copy.common.toman}`} />
            <Inv dt={t.invoiceWage} dd={`${fmtMoney(inv.wage, locale, 0)} ${copy.common.toman}`} />
            <Inv dt={t.invoiceProfit} dd={`${fmtMoney(inv.profit, locale, 0)} ${copy.common.toman}`} />
            <Inv dt={t.invoiceVat} dd={`${fmtMoney(inv.vat, locale, 0)} ${copy.common.toman}`} />
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-dashed border-[var(--color-border)] pt-2">
              <dt className="font-extrabold text-[var(--color-text-primary)]">{t.invoiceTotal}</dt>
              <dd dir="ltr" className="m-0 text-[1.1rem] font-extrabold tabular-nums text-[var(--color-currena-blue-deep)]">
                {fmtMoney(inv.total, locale, 0)} {copy.common.toman}
              </dd>
            </div>
          </dl>
          <p className="mt-2 mb-0 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
            {t.invoiceNote}
          </p>
        </Fold>
      </div>
    </SectionCard>
  );
}

/* =================================================================== *
 * Section B — mesghal ↔ grams                                          *
 * =================================================================== */

function UnitsSection({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.goldHub;
  const { snap } = useRates();

  const [mesghal, setMesghal] = React.useState(1);
  const g17 = mesghalToGram(mesghal, 17);
  const g18 = mesghalToGram(mesghal, 18);

  const gram18 = findGold(snap, "gold-18k")?.price ?? NaN;
  const value18 = Number.isFinite(gram18) ? g18 * gram18 : NaN;
  const liveMesghal = findGold(snap, "gold-mesghal")?.price;

  return (
    <SectionCard id="gold-units" className="mb-3">
      <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
        {t.unitsTitle}
      </h2>
      <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.unitsPromise}</p>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={copy.common.basis}>
        <span className="rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-[12px] font-extrabold text-[var(--color-currena-blue-deep)]">
          {t.basis17}
        </span>
        <span className="text-[11.5px] text-[var(--color-text-tertiary)]">
          {locale === "fa" ? "۴٫۶۰۸۳ گرم" : "4.6083 g"}
        </span>
        <span className="mx-1 text-[var(--color-text-tertiary)]">·</span>
        <span className="rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-[12px] font-extrabold text-[var(--color-currena-blue-deep)]">
          {t.basis18}
        </span>
        <span className="text-[11.5px] text-[var(--color-text-tertiary)]">
          {locale === "fa" ? "۴٫۳۳۱۸ گرم" : "4.3318 g"}
        </span>
      </div>

      <div className="mt-3 divide-y divide-[var(--color-border)]/60">
        <FieldRow label={t.mesghalLabel} id="gu-mesghal">
          <NumberField
            id="gu-mesghal"
            value={mesghal}
            onCommit={setMesghal}
            locale={locale}
            decimals
            big
            ariaLabel={t.mesghalLabel}
            clampRange={[0, 100_000, 0.001]}
          />
        </FieldRow>
      </div>

      <div className="mt-3 space-y-2">
        <Line
          text={t.g17Line
            .replace("{m}", fmtMoney(mesghal, locale, 3))
            .replace("{g}", fmtMoney(g17, locale, 3))}
        />
        <Line
          text={t.g18Line.replace("{g}", fmtMoney(g18, locale, 3))}
        />
        {Number.isFinite(value18) ? (
          <Line
            text={t.value18Line.replace("{v}", fmtMoney(value18, locale, 0))}
            strong
          />
        ) : null}
        {Number.isFinite(liveMesghal ?? NaN) ? (
          <Line text={t.mesghalLive.replace("{p}", fmtMoney(liveMesghal ?? 0, locale, 0))} />
        ) : null}
      </div>
    </SectionCard>
  );
}

/* =================================================================== *
 * Section C — the karat conversion                                      *
 * =================================================================== */

function KaratSection({ locale }: { locale: Locale }) {
  const copy = TOOLS_COPY[locale];
  const t = copy.goldHub;
  const { snap } = useRates();

  const [fromK, setFromK] = React.useState(18);
  const [toK, setToK] = React.useState(24);
  const [weight, setWeight] = React.useState(10);

  const equiv = karatConvert(weight, fromK, toK);
  const perGram = gramPriceForKarat(snap, toK);
  const value = perGram ? equiv * perGram : NaN;

  return (
    <SectionCard id="gold-karat" className="mb-3">
      <h2 className="m-0 mb-1 text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)]">
        {t.karatTitle}
      </h2>
      <p className="m-0 mb-3 text-[12px] text-[var(--color-text-secondary)]">{t.karatPromise}</p>

      <div className="divide-y divide-[var(--color-border)]/60">
        <FieldRow label={t.weightLabel} id="gk-weight">
          <NumberField
            id="gk-weight"
            value={weight}
            onCommit={setWeight}
            locale={locale}
            decimals
            big
            ariaLabel={t.weightLabel}
            clampRange={[0, 100_000, 0.01]}
          />
        </FieldRow>
        <FieldRow label={t.fromKarat} id="gk-from">
          {KARATS.map((k) => (
            <Chip key={`f${k}`} active={fromK === k} onClick={() => setFromK(k)}>
              {fmtMoney(k, locale, 0)}
            </Chip>
          ))}
        </FieldRow>
        <FieldRow label={t.toKarat} id="gk-to">
          {KARATS.map((k) => (
            <Chip key={`t${k}`} active={toK === k} onClick={() => setToK(k)}>
              {fmtMoney(k, locale, 0)}
            </Chip>
          ))}
        </FieldRow>
      </div>

      <div className="mt-3 space-y-2">
        <Line
          text={`${t.equivLabel}: ${fmtMoney(weight, locale, 2)} ${locale === "fa" ? "گرم" : "g"} ${fromK} → ${fmtMoney(equiv, locale, 3)} ${locale === "fa" ? "گرم" : "g"} ${toK}`}
          strong
        />
        {Number.isFinite(value) ? (
          <Line text={t.valueLine.replace("{v}", fmtMoney(value, locale, 0))} />
        ) : null}
      </div>
    </SectionCard>
  );
}

/* =================================================================== *
 * Small rows                                                           *
 * =================================================================== */

function Line({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <p
      className={`m-0 rounded-xl px-4 py-2.5 text-[12.5px] leading-relaxed ${
        strong
          ? "bg-[var(--color-currena-soft)] font-extrabold text-[var(--color-currena-blue-deep)]"
          : "bg-[var(--color-currena-bg-light)] font-semibold text-[var(--color-text-secondary)]"
      }`}
    >
      {text}
    </p>
  );
}

function Inv({ dt, dd }: { dt: string; dd: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-semibold text-[var(--color-text-tertiary)]">{dt}</dt>
      <dd dir="ltr" className="m-0 font-bold tabular-nums text-[var(--color-text-primary)]">
        {dd}
      </dd>
    </div>
  );
}
