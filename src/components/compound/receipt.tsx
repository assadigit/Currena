"use client";

/**
 * Compound Wealth — the spending receipt (v10, spec §5.5 / feature spec
 * §3–§5).
 *
 * One paper card that makes the leak visible: an itemised list of the
 * small auto-renewing costs, the combined monthly and yearly total
 * (exact to the cent — a receipt is an exact ledger), and one
 * invested-instead projection — the SAME engine at the page's current
 * plan assumptions on the leak money (normalizeToMonthly +
 * receiptProjection in maths.ts; the engine itself is untouched).
 * Store-nothing: reload resets to the three examples. The paper keeps a
 * small fixed light palette in BOTH themes (a receipt is paper; the A4
 * card's ink-safe precedent). Alignment is always by layout (flex with
 * dotted leaders), never by font metrics — robust in both scripts.
 * Calm: no animation, no hover states beyond focus visibility.
 */

import * as React from "react";
import {
  RECEIPT_AMOUNT_MAX,
  RECEIPT_EXAMPLES,
  RECEIPT_HORIZONS,
  RECEIPT_HORIZON_DEFAULT,
  RECEIPT_LABEL_MAX,
  RECEIPT_PALETTE,
  formatMoney,
  normalizeToMonthly,
  receiptProjection,
  splitFinal,
  type AssetFigures,
  type Cadence,
  type PlanInput,
} from "@/lib/compound/maths";
import type { CompoundCopy, Locale } from "@/lib/compound/content";
import { ShareDonut, type ShareBarCopy } from "@/components/compound/bars";

/** The receipt's own copy block (content.ts). */
type ReceiptCopy = CompoundCopy["en"]["tool"]["receipt"];

/** One line on the paper (client state only — nothing is stored). */
interface ReceiptItem {
  id: number;
  label: string;
  amount: number;
  cadence: Cadence;
}

/* =================================================================== *
 * Small helpers (the page's own rules, mirrored here so the receipt   *
 * stays self-contained — nothing in app.tsx moves)                     *
 * =================================================================== */

/** Persian and Arabic digits → ASCII, the Persian decimal separator
 *  folded in (the page's own normalizeDigits rule). */
function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/^0+(?=\d)/, "");
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
/** ASCII digits → Persian digits (display only). */
function toFaDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]).replace(/\./g, "٫");
}

/** A cents-exact number word ("34.97" / «۳۴٫۹۷»); never NaN. */
function centsNumber(v: number, locale: Locale): string {
  const n = Number.isFinite(v) ? v : 0;
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

/** A money string exact to the cent, for sentences, aria-labels and
 *  announcements (bidi-safe inside running text): "A$13.99" / «۱۳٫۹۹
 *  دلار استرالیا». */
function centsText(v: number, locale: Locale, symbol: string, word: string): string {
  const n = centsNumber(v, locale);
  return locale === "fa" ? `${n} ${word}`.trim() : `${symbol}${n}`;
}

/** The projection sentence's rounding (spec §4): nearest 100 with
 *  "about" — the headline's own register (magnitude-aware above 100k so
 *  huge numbers stay honest). 5,981.7 → 6,000; 4,551.6 → 4,600. */
function sentenceRound(v: number): number {
  const a = Math.abs(Number.isFinite(v) ? v : 0);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  return Math.round(v / 100) * 100;
}

/** The from-line's rounding (spec §4): the tiles' own rounding
 *  (roundMoney's rule — whole under 1,000, then nearest 10/100/1,000 by
 *  magnitude). 4,196.4 → 4,200; 1,785.3 → 1,790. */
function tileRound(v: number): number {
  const a = Math.abs(Number.isFinite(v) ? v : 0);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  if (a >= 10_000) return Math.round(v / 100) * 100;
  if (a >= 1_000) return Math.round(v / 10) * 10;
  return Math.round(v);
}

/** The decorative bottom barcode's fixed bar widths (pure divs,
 *  aria-hidden; deterministic — no random at render time). */
const BARCODE_WIDTHS = [3, 1, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 4, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1];

/* =================================================================== *
 * The component                                                        *
 * =================================================================== */

export interface SpendingReceiptProps {
  locale: Locale;
  copy: ReceiptCopy;
  /** The page's current plan — the projection rides its assumptions. */
  plan: PlanInput;
  /** The current asset's measured figures. */
  figures: AssetFigures;
  /** The current asset's own label, for the assumption line. */
  assetLabel: string;
  /** EN's currency symbol (A$ / $). */
  currencySymbol: string;
  /** fa's currency word (دلار استرالیا). */
  currencyWord: string;
  /** The page's own never-invests sentence (the engine's honest edge). */
  neverInvests: string;
  /** The page's own clamp message (validation follows the page's rule). */
  clampMessage: string;
  /** The share bar's "<1%" word (shared vocabulary with the tiles). */
  underOne: string;
  /** The chart's own two labels (the split bar's sr sentence). */
  barLabels: { putIn: string; growth: string };
}

export function SpendingReceipt({
  locale,
  copy,
  plan,
  figures,
  assetLabel,
  currencySymbol,
  currencyWord,
  neverInvests,
  clampMessage,
  underOne,
  barLabels,
}: SpendingReceiptProps) {
  const P = RECEIPT_PALETTE;
  /** EN: the mono stack; fa: the site's own Persian font. */
  const monoClass = "[font-family:ui-monospace,SFMono-Regular,Menlo,monospace]";

  /* --- the state (store-nothing: reload resets everything) --- */
  const [items, setItems] = React.useState<ReceiptItem[]>(() =>
    RECEIPT_EXAMPLES.map((e, i) => ({
      id: i + 1,
      label: locale === "fa" ? e.labelFa : e.label,
      amount: e.amount,
      cadence: e.cadence,
    })),
  );
  const [nextId, setNextId] = React.useState(RECEIPT_EXAMPLES.length + 1);
  const [labelText, setLabelText] = React.useState("");
  const [amountText, setAmountText] = React.useState("");
  const [cadence, setCadence] = React.useState<Cadence>("monthly");
  const [horizon, setHorizon] = React.useState<number>(RECEIPT_HORIZON_DEFAULT);
  const [armed, setArmed] = React.useState(false); // the clear's two-step guard
  const [note, setNote] = React.useState(""); // the one small plain message
  const [announcement, setAnnouncement] = React.useState(""); // the polite live region
  const [guideOpen, setGuideOpen] = React.useState(false); // v10.1: the how-to-use modal
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const addRef = React.useRef<HTMLButtonElement | null>(null);
  const guideButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const guideCloseRef = React.useRef<HTMLButtonElement | null>(null);
  const guidePanelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* --- v10.1: the guide modal's keyboard behaviour — Escape closes,
     Tab stays inside the dialog (a small honest trap), and focus
     returns to the guide button on close. --- */
  React.useEffect(() => {
    if (!guideOpen) return;
    guideCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setGuideOpen(false);
        guideButtonRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && guidePanelRef.current) {
        const focusable = [...guidePanelRef.current.querySelectorAll<HTMLElement>("button")];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  const closeGuide = () => {
    setGuideOpen(false);
    guideButtonRef.current?.focus();
  };

  /* --- the derived world (the same engine, on the leak money) --- */
  const totalOf = (list: ReceiptItem[]) => list.reduce((n, it) => n + normalizeToMonthly(it.amount, it.cadence), 0);
  const monthlyTotal = totalOf(items);
  const yearlyTotal = monthlyTotal * 12;
  const hasTotal = items.length > 0 && monthlyTotal > 0;
  const projection = React.useMemo(
    () => (hasTotal ? receiptProjection(plan, monthlyTotal, horizon, figures) : null),
    [hasTotal, plan, monthlyTotal, horizon, figures],
  );
  const split =
    projection && !projection.neverInvests
      ? splitFinal(projection.finalValue, projection.totalPutIn)
      : null;
  /** True while the current items are still exactly the three examples.
   *  Locale-invariant by design: the items are created with the arrival
   *  locale's labels, so after a mid-session language toggle the labels
   *  keep their original language while the paper around them switches —
   *  the items are still untouched, so the hint and the examples tag must
   *  stay (found on the live fa walk; compared against BOTH languages'
   *  labels, the amounts and the cadences). */
  const examplesUntouched =
    items.length === RECEIPT_EXAMPLES.length &&
    items.every(
      (it, i) =>
        (it.label === RECEIPT_EXAMPLES[i].label || it.label === RECEIPT_EXAMPLES[i].labelFa) &&
        it.amount === RECEIPT_EXAMPLES[i].amount &&
        it.cadence === RECEIPT_EXAMPLES[i].cadence,
    );

  const cents = (v: number) => centsText(v, locale, currencySymbol, currencyWord);
  const whole = (v: number) =>
    locale === "fa"
      ? `${formatMoney(Math.round(Number.isFinite(v) ? v : 0), locale)} ${currencyWord}`.trim()
      : `${currencySymbol}${formatMoney(Math.round(Number.isFinite(v) ? v : 0), locale)}`;
  const nWord = (n: number) => formatMoney(n, locale);

  /* --- the visible money bits: the page's own tiles pattern (the
     number in its own ltr span, then fa's currency word beside it) --- */
  const renderCents = (v: number) =>
    locale === "fa" ? (
      <>
        <span className="tabular-nums" dir="ltr">
          {centsNumber(v, locale)}
        </span>{" "}
        <span className="text-[11px] font-semibold" style={{ color: P.muted }}>
          {currencyWord}
        </span>
      </>
    ) : (
      <span className="tabular-nums" dir="ltr">
        {currencySymbol}
        {centsNumber(v, locale)}
      </span>
    );

  /* --- add / remove / clear --- */
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(normalizeDigits(amountText).replace(/[^\d.]/g, ""));
    if (amountText === "" || !Number.isFinite(parsed) || parsed <= 0) {
      setNote(clampMessage); // reject with one small plain message, never an error state
      return;
    }
    let amount = Math.round(parsed * 100) / 100; // a receipt is exact to the cent
    if (amount > RECEIPT_AMOUNT_MAX) {
      amount = RECEIPT_AMOUNT_MAX;
      setNote(clampMessage);
    } else {
      setNote("");
    }
    const label =
      labelText.trim().slice(0, RECEIPT_LABEL_MAX) ||
      copy.defaultItemLabel.replace("{n}", nWord(nextId));
    const item: ReceiptItem = { id: nextId, label, amount, cadence };
    const nextItems = [...items, item];
    setItems(nextItems);
    setNextId((n) => n + 1);
    setLabelText("");
    setAmountText("");
    setAnnouncement(
      copy.announceAdd.replace("{item}", label).replace("{total}", cents(totalOf(nextItems))),
    );
  };

  const removeItem = (id: number) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const nextItems = items.filter((it) => it.id !== id);
    setItems(nextItems);
    setNote("");
    setAnnouncement(
      copy.announceRemove.replace("{item}", item.label).replace("{total}", cents(totalOf(nextItems))),
    );
    // After removing the last focusable row, focus returns to Add.
    if (nextItems.length === 0) addRef.current?.focus();
  };

  const clearAll = () => {
    if (!armed) {
      setArmed(true); // first tap: re-word for 4 seconds, no confirm() dialog
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmed(false);
    setItems([]);
    setNote("");
    setAnnouncement(copy.announceClear.replace("{hint}", copy.emptyHint));
    // The clear button unmounts with the last row — keep the keyboard
    // flow: focus returns to Add, exactly as after removing the last row.
    addRef.current?.focus();
  };

  /* --- the sr-only mirror (the v6 chart-summary pattern) --- */
  const srParts = (() => {
    const dot = copy.srSummary.indexOf(". ");
    return dot === -1
      ? { first: copy.srSummary, second: "" }
      : { first: copy.srSummary.slice(0, dot + 1), second: copy.srSummary.slice(dot + 2) };
  })();
  const srText = !hasTotal
    ? null
    : projection && projection.neverInvests
      ? srParts.first
          .replace("{n}", nWord(items.length))
          .replace("{monthly}", cents(monthlyTotal))
          .replace("{yearly}", cents(yearlyTotal)) + ` ${neverInvests}`
      : copy.srSummary
          .replace("{n}", nWord(items.length))
          .replace("{monthly}", cents(monthlyTotal))
          .replace("{yearly}", cents(yearlyTotal))
          .replace("{years}", nWord(horizon))
          .replace("{final}", whole(sentenceRound(projection!.finalValue)))
          .replace("{putIn}", whole(tileRound(projection!.totalPutIn)))
          .replace("{growth}", whole(tileRound(projection!.growth)));

  /* --- the projection's visible words --- */
  const sentence = projection
    ? copy.projectionSentence
        .replace("{amount}", cents(monthlyTotal))
        .replace("{years}", nWord(horizon))
        .replace("{final}", whole(sentenceRound(projection.finalValue)))
        .replace("{today}", whole(sentenceRound(projection.finalValueToday)))
    : "";
  const fromLine = projection
    ? copy.fromLine
        .replace("{putIn}", whole(tileRound(projection.totalPutIn)))
        .replace("{growth}", whole(tileRound(projection.growth)))
    : "";
  const assumption = copy.assumption.replace("{asset}", assetLabel);

  /** The receipt's ShareBar copy: only sr and underOne are used by the
   *  text-free phone variant (bar + aria-label, no visible key line). */
  const barCopy: ShareBarCopy = { caption: copy.barSr, sr: copy.barSr, hiddenLine: "", underOne };

  const inputCls =
    "h-10 w-full rounded-lg border px-2.5 text-[13.5px] font-bold tabular-nums outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2";

  return (
    <div
      data-cw="receipt-paper"
      className="rounded-lg border p-3.5 shadow-[0_2px_10px_rgba(38,51,61,0.13)] sm:p-4"
      style={{ background: P.paper, borderColor: P.rule, color: P.ink }}
    >
      <div className={monoClass}>
        {/* The header line — the section's own word, no fake date; the
            v10.1 guide button rides its end edge (the paper's own
            answer to "how do I use this?"). A spacer keeps the title
            optically centred; the flex row makes crowding impossible. */}
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="w-11 shrink-0" />
          <p
            data-cw="receipt-header"
            className="m-0 min-w-0 flex-1 text-center text-[13px] font-bold uppercase"
            style={{ color: P.ink, letterSpacing: locale === "fa" ? 0 : "0.08em" }}
          >
            {copy.heading}
          </p>
          <button
            type="button"
            ref={guideButtonRef}
            onClick={() => setGuideOpen(true)}
            aria-haspopup="dialog"
            aria-label={copy.guideTitle}
            data-cw="receipt-guide-open"
            className="shrink-0 rounded-full px-2 py-[2px] text-[9.5px] font-bold outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
            style={{ color: P.muted, boxShadow: `inset 0 0 0 1.5px ${P.rule}` }}
          >
            {copy.guideLabel}
          </button>
        </div>

        {/* The add form — compact, on the paper; Enter submits. */}
        <form data-cw="receipt-form" onSubmit={addItem} noValidate className="mt-2.5 flex flex-wrap items-end gap-1.5">
          <span className="flex min-w-[8.5rem] flex-1 flex-col gap-0.5">
            <label htmlFor="cw-receipt-what" className="text-[10.5px] font-bold" style={{ color: P.muted }}>
              {copy.formLabel}
            </label>
            <input
              id="cw-receipt-what"
              type="text"
              dir="auto"
              value={labelText}
              maxLength={RECEIPT_LABEL_MAX}
              onChange={(e) => setLabelText(e.target.value)}
              aria-label={copy.formLabel}
              data-cw="receipt-what"
              className={`${inputCls} font-semibold`}
              style={{ background: P.paper, borderColor: P.rule, color: P.ink }}
            />
          </span>
          <span className="flex w-[6.5rem] flex-col gap-0.5">
            <label htmlFor="cw-receipt-price" className="text-[10.5px] font-bold" style={{ color: P.muted }}>
              {copy.priceLabel}
            </label>
            <input
              id="cw-receipt-price"
              type="text"
              dir="ltr"
              inputMode="decimal"
              value={locale === "fa" ? toFaDigits(amountText) : amountText}
              onChange={(e) => {
                setAmountText(normalizeDigits(e.target.value).replace(/[^\d.]/g, ""));
                setNote("");
              }}
              aria-label={copy.priceLabel}
              data-cw="receipt-price"
              className={inputCls}
              style={{ background: P.paper, borderColor: P.rule, color: P.ink }}
            />
          </span>
          <span className="flex w-[7.5rem] flex-col gap-0.5">
            <label htmlFor="cw-receipt-cadence" className="text-[10.5px] font-bold" style={{ color: P.muted }}>
              {copy.cadenceLabel}
            </label>
            <select
              id="cw-receipt-cadence"
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              aria-label={copy.cadenceLabel}
              data-cw="receipt-cadence"
              className={inputCls}
              style={{ background: P.paper, borderColor: P.rule, color: P.ink }}
            >
              {(Object.keys(copy.cadences) as Cadence[]).map((c) => (
                <option key={c} value={c}>
                  {copy.cadences[c]}
                </option>
              ))}
            </select>
          </span>
          <button
            ref={addRef}
            type="submit"
            data-cw="receipt-add"
            className="min-h-[40px] min-w-[64px] rounded-lg px-3 text-[13.5px] font-bold transition-transform active:scale-95"
            style={{ background: P.ink, color: P.paper }}
          >
            {copy.addLabel}
          </button>
        </form>
        {note ? (
          <p data-cw="receipt-note" className="mt-1 mb-0 text-[11px] leading-snug" style={{ color: P.muted }}>
            {note}
          </p>
        ) : null}

        {/* The one-line hint while the three examples are untouched. */}
        {examplesUntouched ? (
          <p data-cw="receipt-hint" className="mt-1.5 mb-0 text-[11px] leading-snug" style={{ color: P.muted }}>
            {copy.hint}
          </p>
        ) : null}

        {/* v10.1: the examples tag — one small centred line directly
            above the three prefilled rows, with dotted flanks in the
            paper's own rule colour. It marks the rows as examples
            WITHOUT costing any row width (a per-row pill would force
            the labels to wrap at 360px — measured), and it retires
            with the first change, exactly like the hint. */}
        {examplesUntouched ? (
          <p
            data-cw="receipt-examples-tag"
            className="mt-2 mb-0 flex items-center gap-2 text-[9.5px] font-bold uppercase leading-none"
            style={{ color: P.muted, letterSpacing: locale === "fa" ? 0 : "0.1em" }}
          >
            <span aria-hidden="true" className="h-px min-w-[10px] flex-1 border-t border-dotted" style={{ borderColor: P.rule }} />
            <span className="shrink-0">{copy.examplesTag}</span>
            <span aria-hidden="true" className="h-px min-w-[10px] flex-1 border-t border-dotted" style={{ borderColor: P.rule }} />
          </p>
        ) : null}

        {/* The itemised lines: label · dotted leader · price + cadence · ×.
            Alignment is by layout (flex), so fa/RTL mirrors itself. */}
        <ul data-cw="receipt-lines" className="mt-2 mb-0 list-none space-y-0.5 p-0">
          {items.map((it) => (
            <li key={it.id} data-cw="receipt-item" className="flex items-baseline gap-1.5">
              <span className="min-w-0 max-w-[56%] text-[13px] font-semibold leading-snug break-words">
                {it.label}
              </span>
              <span
                aria-hidden="true"
                className="mx-0.5 min-w-[10px] flex-1 border-b-2 border-dotted"
                style={{ borderColor: P.rule }}
              />
              <span className="whitespace-nowrap text-[13px] font-bold">{renderCents(it.amount)}</span>
              {/* The cadence word right-aligns at a common edge (before
                  the ×) — receipt-style — and its auto width leaves the
                  long example labels one line even at 360px (measured). */}
              <span
                className="w-auto shrink-0 whitespace-nowrap text-end text-[11.5px] font-semibold"
                style={{ color: P.muted }}
              >
                {copy.cadences[it.cadence]}
              </span>
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                aria-label={copy.removeAria
                  .replace("{item}", it.label)
                  .replace("{price}", cents(it.amount))
                  .replace("{cadence}", copy.cadences[it.cadence])}
                data-cw="receipt-remove"
                className="ms-0.5 grid h-11 w-11 shrink-0 place-items-center self-center rounded-full text-[16px] font-bold leading-none outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
                style={{ color: P.muted }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            data-cw="receipt-clear"
            className="mt-1.5 min-h-[33px] rounded-full px-3 text-[11.5px] font-bold outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
            style={{ color: P.muted }}
          >
            {armed ? copy.clearConfirm : copy.clearAll}
          </button>
        ) : null}

        {/* A dashed rule, then the totals (monthly primary, yearly secondary). */}
        <div className="mt-2.5 border-t-2 border-dashed" style={{ borderColor: P.rule }} />
        <div className="mt-2 space-y-0.5">
          <p
            data-cw="receipt-total-monthly"
            className="m-0 flex items-baseline justify-between gap-2 text-[14.5px] font-extrabold"
          >
            <span>{copy.totalMonthly}</span>
            <span>{renderCents(monthlyTotal)}</span>
          </p>
          <p
            data-cw="receipt-total-yearly"
            className="m-0 flex items-baseline justify-between gap-2 text-[13px] font-semibold"
            style={{ color: P.muted }}
          >
            <span>{copy.totalYearly}</span>
            <span>{renderCents(yearlyTotal)}</span>
          </p>
        </div>

        {/* A dashed rule, then the projection (or the plain hint when
            there is nothing to project — the paper always stays). */}
        <div className="mt-2.5 border-t-2 border-dashed" style={{ borderColor: P.rule }} />
        <div data-cw="receipt-projection" className="mt-2">
          {!hasTotal ? (
            <p data-cw="receipt-empty" className="m-0 text-[13px] leading-relaxed" style={{ color: P.muted }}>
              {copy.emptyHint}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p
                  data-cw="receipt-projection-title"
                  className="m-0 text-[12px] font-bold uppercase"
                  style={{ color: P.muted, letterSpacing: locale === "fa" ? 0 : "0.08em" }}
                >
                  {copy.projectionTitle}
                </p>
                <span className="flex gap-1" role="group" aria-label={copy.horizonLabel} data-cw="receipt-horizons">
                  {RECEIPT_HORIZONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setHorizon(y)}
                      aria-pressed={horizon === y}
                      data-cw={`receipt-horizon-${y}`}
                      className="min-h-[28px] rounded-full px-2.5 text-[11.5px] font-bold transition-transform active:scale-95"
                      style={
                        horizon === y
                          ? { background: P.ink, color: P.paper }
                          : { color: P.muted, boxShadow: `inset 0 0 0 1.5px ${P.rule}` }
                      }
                    >
                      {nWord(y)}
                    </button>
                  ))}
                </span>
              </div>
              {projection && projection.neverInvests ? (
                <p data-cw="receipt-never-invests" className="mt-1.5 mb-0 text-[13px] leading-relaxed" style={{ color: P.muted }}>
                  {neverInvests}
                </p>
              ) : (
                <>
                  <p data-cw="receipt-sentence" className="mt-1.5 mb-0 text-[13.5px] font-bold leading-relaxed">
                    {sentence}
                  </p>
                  <p
                    data-cw="receipt-fromline"
                    className="mt-1 mb-0 text-[12.5px] font-semibold leading-relaxed"
                    style={{ color: P.muted }}
                  >
                    {fromLine}
                  </p>
                  {/* v10.1: the share donut on the future values (the
                      honest edge and "<1%" inherited; no visible key
                      line — the from-line already names both parts in
                      money). Drawn in the paper's own ink and gold. */}
                  <div data-cw="receipt-donut" className="mt-2 flex justify-center">
                    <ShareDonut
                      split={split}
                      locale={locale}
                      labels={barLabels}
                      copy={barCopy}
                      variant="phone"
                      size={56}
                      colors={{ putIn: P.ink, growth: P.gold }}
                    />
                  </div>
                </>
              )}
              <p
                data-cw="receipt-assumption"
                className="mt-1.5 mb-0 text-[11.5px] leading-snug"
                style={{ color: P.muted }}
              >
                {assumption}
              </p>
            </>
          )}
        </div>

        {/* The footer: the one strong zinger, the receipt's thanks, and
            the decorative barcode (pure divs, aria-hidden). */}
        <p data-cw="receipt-zinger" className="mt-3 mb-0 text-center text-[13px] font-bold leading-relaxed">
          {copy.zinger}
        </p>
        <p data-cw="receipt-thanks" className="mt-1.5 mb-0 text-center text-[11.5px]" style={{ color: P.muted }}>
          {copy.thanks}
        </p>
        <div
          data-cw="receipt-barcode"
          aria-hidden="true"
          className="mt-2 flex h-8 items-stretch justify-center gap-[2px]"
        >
          {BARCODE_WIDTHS.map((w, i) => (
            <span key={i} className="block" style={{ width: w * 2, background: P.ink }} />
          ))}
        </div>

        {/* v10.1 — the how-to-use guide modal (the paper's own overlay,
            following the phone card's own dialog pattern: aria-modal, a
            labelled dialog, Escape and the backdrop close it, focus comes
            to the close button and returns to the guide button). Inside
            the paper's font wrapper, so fa keeps the site's own Persian
            face via :lang(fa). */}
        {guideOpen ? (
          <div
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4"
            dir={locale === "fa" ? "rtl" : "ltr"}
            lang={locale}
            role="dialog"
            aria-modal="true"
            aria-label={copy.guideTitle}
            data-cw="receipt-guide"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeGuide();
            }}
          >
            <div
              ref={guidePanelRef}
              className="w-full max-w-[340px] rounded-lg border p-4 shadow-[0_10px_40px_rgba(20,28,34,0.35)]"
              style={{ background: P.paper, borderColor: P.rule, color: P.ink }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  data-cw="receipt-guide-title"
                  className="m-0 text-[13.5px] font-extrabold"
                  style={{ color: P.ink, letterSpacing: locale === "fa" ? 0 : "0.04em" }}
                >
                  {copy.guideTitle}
                </p>
                <button
                  type="button"
                  ref={guideCloseRef}
                  onClick={closeGuide}
                  aria-label={copy.guideClose}
                  data-cw="receipt-guide-close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold leading-none outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
                  style={{ color: P.muted }}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              <ol className="mt-2.5 mb-0 list-decimal space-y-1.5 ps-5 text-[12.5px] leading-relaxed">
                {copy.guideSteps.map((s, i) => (
                  <li key={i} data-cw="receipt-guide-step" style={{ color: P.ink }}>
                    {s}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={closeGuide}
                data-cw="receipt-guide-done"
                className="mt-3 min-h-[38px] w-full rounded-lg px-3 text-[13px] font-bold transition-transform active:scale-95"
                style={{ background: P.ink, color: P.paper }}
              >
                {copy.guideDone}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* The polite live region (add / remove / clear, always with the total). */}
      <p aria-live="polite" data-cw="receipt-live" className="sr-only m-0">
        {announcement}
      </p>
      {/* The sr-only mirror of the whole paper (the v6 chart-summary pattern). */}
      <p data-cw="receipt-sr" className="sr-only m-0">
        {srText}
      </p>
    </div>
  );
}
