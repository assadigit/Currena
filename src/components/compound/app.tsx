"use client";

/**
 * Compound Wealth — the tool page (spec §5).
 *
 * The quiet default view: the country chips, the headline answer (future
 * money beside today's money, the lower band figure always shown), the
 * three controls, the chart, the three tiles, the milestones, and the two
 * buttons. Everything else lives behind "More options". English and Farsi
 * (RTL, Persian digits, Jalali dates, LTR chart axes). Nothing is stored:
 * no localStorage writes, no cookies, no server writes, no numbers in the
 * URL — reload resets everything.
 */

import * as React from "react";
import {
  AMOUNT_CHIPS,
  DEFAULT_COUNTRY,
  DEFAULT_MONTHLY,
  DEFAULT_YEARLY_COST,
  DEFAULT_YEARS,
  INCREASE_MAX,
  INCREASE_MIN,
  INFLATION_MAX,
  INFLATION_MIN,
  MILESTONES_ON_PAGE,
  PERCENT_CHIPS,
  PERCENT_STEP,
  SALARY_PERIOD_DEFAULT,
  SHARE_DEFAULT,
  SHARE_MAX,
  SHARE_MIN,
  WHAT_IF_MAX,
  WHAT_IF_MIN,
  WHAT_IF_POINTS,
  YEAR_CHIPS,
  YEARLY_COST_MAX,
  YEARLY_COST_MIN,
  YEARS_MAX,
  YEARS_MIN,
  addMonths,
  clamp,
  clampDates,
  computeCompound,
  figuresAreStale,
  formatMoney,
  monthlyAmountFrom,
  monthlySalaryFrom,
  monthsBetween,
  shareFromAmount,
  thisMonth,
  whatIfCash,
  whatIfLaterStart,
  whatIfSmallChange,
  yearsOfSalary,
  type Country,
  type PlanInput,
  type RateMode,
  type SalaryPeriod,
} from "@/lib/compound/maths";
import {
  COUNTRY_ROWS,
  FIGURES_CHECKED_ON,
  assetById,
  assetChips,
  cashRow,
  defaultInflation,
  figuresOf,
  latestInflation,
  measuredLine,
} from "@/lib/compound/figures";
import { COPY, type Locale } from "@/lib/compound/content";
import { ToolsBreadcrumb, ToolsFooter, ToolsHeader, useSiteLocale } from "@/components/compound/chrome";
import { GrowthChart, type OtherLine } from "@/components/compound/chart";
import { A4PrintCard, PhoneCard } from "@/components/compound/cards";

/* =================================================================== *
 * Small helpers                                                       *
 * =================================================================== */

/** Persian and Arabic digits → ASCII, leading zeros collapsed, the
 *  Persian decimal separator folded in. */
function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/^0+(?=\d)/, "");
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
/** ASCII digits → Persian digits (and the decimal separator), for display. */
function toFaDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]).replace(/\./g, "٫");
}

/** Round an amount the way the page speaks (about-level precision). */
function roundMoney(v: number): number {
  const a = Math.abs(v);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  if (a >= 10_000) return Math.round(v / 100) * 100;
  if (a >= 1_000) return Math.round(v / 10) * 10;
  return Math.round(v);
}

/** "March 2031" / «اسفند ۱۴۰۹» from a YYYY-MM. */
function monthYearLabel(ym: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${ym}-01T00:00:00Z`));
  } catch {
    return ym;
  }
}

/** The month of a 1-based plan month index, as YYYY-MM. */
function isoOfMonth(startYm: string, m: number): string {
  const [y, mo] = startYm.split("-").map(Number);
  const total = y * 12 + (mo - 1) + (m - 1);
  return `${String(Math.floor(total / 12)).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const pctSign = (locale: Locale) => (locale === "fa" ? "٪" : "%");

/** A percent always with one decimal ("3.0" / «۳٫۰») — the way the
 *  salary live line speaks it (spec §5.1.1: "That is 2.0%…"). */
function pct1(v: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(v * 100);
  } catch {
    return (v * 100).toFixed(1);
  }
}

/** A labelled number box that survives typing (the house pattern). */
function NumberField({
  value,
  onCommit,
  locale,
  suffix,
  id,
  ariaLabel,
  clampRange,
  decimals = false,
  className,
  dataCw,
}: {
  value: number;
  onCommit: (v: number) => void;
  locale: Locale;
  suffix?: string;
  id: string;
  ariaLabel: string;
  clampRange?: [number, number, number];
  decimals?: boolean;
  className?: string;
  dataCw?: string;
}) {
  const [text, setText] = React.useState<string>(() => String(value));
  React.useEffect(() => {
    if (Number(text) !== value) setText(String(value));
  }, [value]);
  const handle = (raw: string) => {
    const norm = normalizeDigits(raw).replace(decimals ? /[^\d.]/g : /\D/g, "");
    setText(norm);
    if (norm !== "") {
      const n = Number(norm);
      if (Number.isFinite(n)) {
        onCommit(clampRange ? clamp(n, clampRange[0], clampRange[1], clampRange[2]) : n);
      }
    }
  };
  return (
    <span className={`relative inline-flex items-center ${className ?? ""}`}>
      <input
        id={id}
        inputMode={decimals ? "decimal" : "numeric"}
        type="text"
        dir="ltr"
        value={locale === "fa" ? toFaDigits(text) : text}
        onChange={(e) => handle(e.target.value)}
        onBlur={() => {
          if (text === "" || !Number.isFinite(Number(text))) setText(String(value));
        }}
        aria-label={ariaLabel}
        data-cw={dataCw}
        className="h-10 w-[5.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-center text-[14.5px] font-bold tabular-nums text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[11px] font-semibold text-[var(--color-text-tertiary)]">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

/** W7: the salary box — a free-text money field that may stay empty
 *  (the placeholder shows an example, never a prefilled value), with the
 *  small per year | per month switch. The parent owns the text; every
 *  keystroke updates the live line and the plan. */
function SalaryBox({
  value,
  onChange,
  locale,
  placeholder,
  label,
  period,
  onPeriod,
  perYear,
  salaryPerMonth,
  salaryPeriodLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  locale: Locale;
  placeholder: string;
  label: string;
  period: SalaryPeriod;
  onPeriod: (p: SalaryPeriod) => void;
  perYear: string;
  salaryPerMonth: string;
  salaryPeriodLabel: string;
}) {
  const handle = (raw: string) => {
    const norm = normalizeDigits(raw).replace(/[^\d.]/g, "");
    onChange(norm);
  };
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-currena-bg-light)] px-2.5 py-2" data-cw="salary-box">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <label htmlFor="cw-salary" className="text-[12px] font-bold text-[var(--color-text-secondary)]">
          {label}
        </label>
        <span className="flex items-center gap-1" role="group" aria-label={salaryPeriodLabel} data-cw="salary-period">
          <Chip active={period === "year"} onClick={() => onPeriod("year")} dataCw="salary-period-year">
            {perYear}
          </Chip>
          <Chip active={period === "month"} onClick={() => onPeriod("month")} dataCw="salary-period-month">
            {salaryPerMonth}
          </Chip>
        </span>
      </div>
      <input
        id="cw-salary"
        inputMode="decimal"
        type="text"
        dir="ltr"
        value={locale === "fa" ? toFaDigits(value) : value}
        placeholder={placeholder}
        onChange={(e) => handle(e.target.value)}
        aria-label={label}
        data-cw="salary-input"
        className="mt-1.5 h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-start text-[14.5px] font-bold tabular-nums text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] transition-shadow placeholder:font-normal placeholder:text-[var(--color-text-tertiary)] focus-visible:ring-2"
      />
    </div>
  );
}

/** One pill chip. */
function Chip({
  active,
  children,
  onClick,
  ariaLabel,
  dataCw,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  dataCw?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      data-cw={dataCw}
      className={`min-h-[33px] shrink-0 rounded-full px-3 text-[12.5px] font-bold transition-all active:scale-95 ${
        active
          ? "bg-[var(--color-currena-blue)] text-white shadow-sm"
          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

/** A collapsible group (the More options + How sections). */
function Fold({
  title,
  children,
  open,
  onToggle,
  dataCw,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  dataCw?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" data-cw={dataCw}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-cw={dataCw ? `${dataCw}-toggle` : undefined}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-start"
      >
        <span className="type-label text-[var(--color-text-primary)]">{title}</span>
        <span
          className={`text-[var(--color-text-tertiary)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open ? <div className="space-y-4 border-t border-[var(--color-border)] px-4 py-4">{children}</div> : null}
    </div>
  );
}

/** One row of a More options group. */
function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <span className="flex flex-col">
        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{label}</span>
        {hint ? <span className="text-[11.5px] leading-snug text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

/* =================================================================== *
 * The page                                                            *
 * =================================================================== */

export default function CompoundWealthApp() {
  const [locale, toggleLang] = useSiteLocale();
  const copy = COPY[locale];
  const t = copy.tool;

  /* --- the state (reload resets everything; nothing is stored) --- */
  const [country, setCountry] = React.useState<Country>(DEFAULT_COUNTRY);
  const [amount, setAmount] = React.useState(DEFAULT_MONTHLY);
  const [assetId, setAssetId] = React.useState<string>(COUNTRY_ROWS[DEFAULT_COUNTRY].defaultAsset);
  const [moneyView, setMoneyView] = React.useState<"future" | "today">("future");
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [laterYears, setLaterYears] = React.useState(5);
  const [cardMenuOpen, setCardMenuOpen] = React.useState(false);
  const [printOpen, setPrintOpen] = React.useState(false);
  const [phoneOpen, setPhoneOpen] = React.useState(false);

  // W7: the percent-of-salary mini calculator, inside the amount group.
  const [amountMode, setAmountMode] = React.useState<"amount" | "share">("amount");
  const [salaryText, setSalaryText] = React.useState("");
  const [salaryPeriod, setSalaryPeriod] = React.useState<SalaryPeriod>(SALARY_PERIOD_DEFAULT);
  const [salaryOpen, setSalaryOpen] = React.useState(false); // Amount mode's link
  const [share, setShare] = React.useState(SHARE_DEFAULT);
  const [pctNote, setPctNote] = React.useState(false); // the one plain clamp message

  // More options
  const [ageText, setAgeText] = React.useState("");
  const [startingText, setStartingText] = React.useState("0");
  const [yearlyCost, setYearlyCost] = React.useState(DEFAULT_YEARLY_COST);
  const [feeText, setFeeText] = React.useState("0");
  const [every, setEvery] = React.useState<1 | 3>(1);
  const [rateMode, setRateMode] = React.useState<RateMode>("average");
  const [customRateText, setCustomRateText] = React.useState("7");
  const [customLowText, setCustomLowText] = React.useState("5");
  const [customHighText, setCustomHighText] = React.useState("9");
  const [inflation, setInflation] = React.useState(() => defaultInflation(DEFAULT_COUNTRY));
  const [increase, setIncrease] = React.useState(0);
  const [whatIfPts, setWhatIfPts] = React.useState(WHAT_IF_POINTS);
  const [startMonth, setStartMonth] = React.useState(thisMonth());
  const [endMonth, setEndMonth] = React.useState(() => addMonths(thisMonth(), DEFAULT_YEARS * 12));
  const [clamped, setClamped] = React.useState(false);
  const [howOpen, setHowOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState<Record<string, boolean>>({});
  const [compareOpen, setCompareOpen] = React.useState(false);

  /* The typed salary, interpreted in its period — 0, letters and empty
     all read as "no salary yet" (nothing is invented). */
  const parsedSalary = salaryText === "" ? null : Number(normalizeDigits(salaryText));
  const salaryNumber =
    parsedSalary !== null && Number.isFinite(parsedSalary) && parsedSalary > 0 ? parsedSalary : null;
  const salaryMonthly = salaryNumber !== null ? monthlySalaryFrom(salaryNumber, salaryPeriod) : null;
  const age = ageText === "" ? null : Number(normalizeDigits(ageText)) || null;
  const startingAmount = Number(normalizeDigits(startingText)) || 0;
  const fee = Number(normalizeDigits(feeText)) || 0;
  const customRate = (Number(normalizeDigits(customRateText)) || 0) / 100;
  const customLow = (Number(normalizeDigits(customLowText)) || 0) / 100;
  const customHigh = (Number(normalizeDigits(customHighText)) || 0) / 100;

  /* --- the derived world --- */
  const rows = COUNTRY_ROWS[country];
  const chips = React.useMemo(() => assetChips(country), [country]);
  const asset = React.useMemo(
    () => assetById(country, assetId) ?? assetById(country, rows.defaultAsset) ?? chips[0],
    [country, assetId, rows.defaultAsset, chips],
  );
  const months = Math.max(1, monthsBetween(startMonth, endMonth));
  const years = Math.round((months / 12) * 10) / 10;

  const plan: PlanInput = React.useMemo(
    () => ({
      monthly: amount,
      salary: salaryMonthly,
      share,
      useShare: amountMode === "share",
      age,
      startingAmount,
      yearlyIncrease: increase,
      yearlyCost,
      feePerPurchase: fee,
      purchaseEveryMonths: every,
      rateMode,
      customRate,
      customLow,
      customHigh,
      inflation,
      whatIfPoints: whatIfPts,
    }),
    [amount, salaryMonthly, share, amountMode, age, startingAmount, increase, yearlyCost, fee, every, rateMode, customRate, customLow, customHigh, inflation, whatIfPts],
  );

  const figures = figuresOf(asset);
  const result = React.useMemo(() => computeCompound(plan, figures, months), [plan, figures, months]);

  const small = React.useMemo(() => whatIfSmallChange(plan, figures, months), [plan, figures, months]);
  const later = React.useMemo(() => whatIfLaterStart(plan, figures, months, laterYears), [plan, figures, months, laterYears]);
  const cashFigures = React.useMemo(() => (cashRow(country) ? figuresOf(cashRow(country)!) : null), [country]);
  const asCash = React.useMemo(
    () => (cashFigures ? whatIfCash(plan, cashFigures, months) : null),
    [plan, cashFigures, months],
  );

  /* The thin lines: the other chips + cash. */
  const otherLines: OtherLine[] = React.useMemo(() => {
    const out: OtherLine[] = [];
    let dash = 1;
    for (const chip of chips) {
      if (chip.id === asset.id) continue;
      if (chip.id === "cash") continue;
      const r = computeCompound(plan, figuresOf(chip), months);
      out.push({
        label: locale === "fa" ? chip.labelFa : chip.labelEn,
        series: r.series,
        dash: dash++,
      });
    }
    if (cashFigures) {
      const r = computeCompound({ ...plan, rateMode: "average" }, cashFigures, months, {
        isCash: true,
      });
      out.push({ label: t.chart.cashLine, series: r.series, cash: true });
    }
    return out;
  }, [chips, asset.id, plan, months, cashFigures, locale, t.chart.cashLine]);

  /* --- money formatting --- */
  const fmt = React.useCallback(
    (v: number) => formatMoney(roundMoney(v), locale),
    [locale],
  );
  const currencyWord = locale === "fa" ? rows.currencyFa : "";
  const currencySymbol = rows.currencyEn;
  /** A money label the way the headline speaks it (A$100 / ۱۰۰ دلار استرالیا). */
  const moneyLabel = React.useCallback(
    (v: number) =>
      locale === "fa"
        ? `${formatMoney(Math.round(v), locale)} ${currencyWord}`.trim()
        : `${currencySymbol}${formatMoney(Math.round(v), locale)}`,
    [locale, currencyWord, currencySymbol],
  );
  const amountLabel = moneyLabel(amount);
  /** The monthly amount the plan invests (share mode with a salary: the
   *  salary × percent, at full precision — rounded only for display). */
  const investedMonthly =
    amountMode === "share" && salaryMonthly !== null ? monthlyAmountFrom(salaryMonthly, share) : amount;

  const shownFinal = moneyView === "today" ? result.finalValueToday : result.finalValue;
  const shownPutIn = moneyView === "today" ? result.totalPutInToday : result.totalPutIn;
  const shownGrowth = shownFinal - shownPutIn;
  const shownMilestones = moneyView === "today" ? result.milestonesToday : result.milestones;
  const pageMilestones = shownMilestones.slice(-MILESTONES_ON_PAGE);

  /* --- the headline sentences --- */
  const headline = React.useMemo(() => {
    /* Share mode with a live salary names the percentage and the amount
     * (§5.1.1); until then the amount headline stands (no empty state). */
    const shareModeLive = amountMode === "share" && salaryMonthly !== null;
    const lead = shareModeLive
      ? t.shareHeadlineLead
          .replace("{share}", `${formatPctLocal(share, locale)}${pctSign(locale)}`)
          .replace("{amount}", moneyLabel(monthlyAmountFrom(salaryMonthly!, share)))
          .replace("{grow}", increase > 0 ? t.shareHeadlineGrow : "")
          .replace("{years}", formatMoney(years, locale, years % 1 === 0 ? 0 : 1))
      : t.headlineParts.lead
          .replace("{amount}", amountLabel)
          .replace("{years}", formatMoney(years, locale, years % 1 === 0 ? 0 : 1));
    const putIn = t.headlineParts.youPutIn.replace("{putIn}", fmt(result.totalPutIn));
    const growTo = t.headlineParts.growTo.replace("{final}", fmt(result.finalValue));
    const today = t.headlineParts.todayMoney.replace("{today}", fmt(result.finalValueToday));
    return locale === "fa"
      ? `${lead} ${putIn} ${growTo} ${today}.`
      : `${lead} ${putIn}, ${growTo} ${today}.`;
  }, [amountMode, salaryMonthly, t, share, locale, years, amountLabel, fmt, result.totalPutIn, result.finalValue, result.finalValueToday, increase, moneyLabel]);

  /* --- country switch resets the country-flavoured state --- */
  const switchCountry = (next: Country) => {
    if (next === country) return;
    setCountry(next);
    setAssetId(COUNTRY_ROWS[next].defaultAsset);
    setInflation(defaultInflation(next));
    // The percent mode's default increase follows the new country's
    // inflation average (§5.1.1); Amount mode stays at 0%.
    setIncrease(amountMode === "share" ? defaultInflation(next) : 0);
  };

  /* --- the money-view switch also updates document.title's locale --- */
  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = copy.dir;
    document.title = locale === "fa" ? `${t.title} · کورنا` : "Compound Wealth · Currena";
  }, [locale, copy.dir, t.title]);

  /* --- the sticky mobile bar: show once the headline scrolls away --- */
  const headlineRef = React.useRef<HTMLDivElement | null>(null);
  const [headlineAway, setHeadlineAway] = React.useState(false);
  React.useEffect(() => {
    const el = headlineRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setHeadlineAway(!entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* --- the date clamps (one plain message) --- */
  const applyDates = (start: string, end: string) => {
    const r = clampDates(start, end);
    setClamped(r.clamped);
    setStartMonth(r.start);
    setEndMonth(r.end);
  };

  const setYears = (y: number) => {
    const safe = clamp(Math.round(y), YEARS_MIN, YEARS_MAX, DEFAULT_YEARS);
    setEndMonth(addMonths(startMonth, safe * 12));
    setClamped(false);
  };

  const yearsChipsActive = (chip: number) => Math.abs(months - chip * 12) < 6;

  /* --- the sources line for the method box --- */
  const sourcesLine = React.useMemo(() => {
    const names = [...new Set([...chips, rows.inflation].map((r) => r.sourceName.split(" via")[0].split(" (")[0]))];
    return t.how.sources
      .replace("{sources}", names.join(locale === "fa" ? "، " : ", "))
      .replace("{date}", monthYearLabel(FIGURES_CHECKED_ON.slice(0, 7), locale));
  }, [chips, rows.inflation, t.how.sources, locale]);

  const stale = figuresAreStale(FIGURES_CHECKED_ON);

  /* --- W3: the latest 12-month inflation for the honesty line --- */
  const latestInfl = React.useMemo(() => latestInflation(country), [country]);

  /* --- W7: the mode switch keeps your place (§5.1.1) ---
   *
   * Amount → % (salary known): the percent = amount ÷ monthly salary,
   * rounded to 0.1. % → Amount (salary known): the amount = the computed
   * monthly amount, rounded to a whole number. Without a salary nothing
   * is invented: each mode keeps its own state.
   * The yearly increase follows the mode's default (the country inflation
   * average in % mode, 0% in Amount mode) — but only once a salary is
   * actually live, so entering % mode without a salary never changes the
   * results (§5.1.1: "the results keep showing the last amount used").
   */
  const switchAmountMode = (mode: "amount" | "share") => {
    if (mode === amountMode) return;
    if (mode === "share") {
      if (salaryMonthly !== null && salaryMonthly > 0) {
        const pct = shareFromAmount(amount, salaryMonthly) * 100;
        setShare(clamp(Math.round(pct * 10) / 10 / 100, SHARE_MIN, SHARE_MAX, SHARE_DEFAULT));
        setIncrease(inflation);
      }
      setAmountMode("share");
      setSalaryOpen(true); // % mode always shows the salary box
    } else {
      setAmountMode("amount");
      setIncrease(0);
    }
  };

  /* While share mode is live, the amount state mirrors the computed
     monthly amount — so if the salary disappears the plan keeps the last
     amount actually used (§5.1.1), and % → Amount keeps the place. */
  React.useEffect(() => {
    if (amountMode === "share" && salaryMonthly !== null && salaryMonthly > 0) {
      const mirror = Math.max(1, Math.round(monthlyAmountFrom(salaryMonthly, share)));
      if (mirror !== amount) setAmount(mirror);
    }
  }, [amountMode, salaryMonthly, share, amount]);

  /* The % mode's default increase arrives with the salary — once. When
     share mode goes live and the increase is still at the amount-mode
     default (0), the country inflation average becomes the default; a
     hand-set increase (including an explicit 0) is never stomped. */
  const salaryArrived = React.useRef(false);
  React.useEffect(() => {
    if (salaryMonthly === null) {
      salaryArrived.current = false;
      return;
    }
    if (
      amountMode === "share" &&
      salaryMonthly > 0 &&
      increase === 0 &&
      !salaryArrived.current
    ) {
      salaryArrived.current = true;
      setIncrease(inflation);
    }
  }, [amountMode, salaryMonthly, increase, inflation]);

  /* --- the salary period switch keeps the same money (§5.1.1) --- */
  const switchSalaryPeriod = (period: SalaryPeriod) => {
    if (period === salaryPeriod) return;
    setSalaryPeriod(period);
    if (salaryNumber !== null) {
      const converted = period === "month" ? salaryNumber / 12 : salaryNumber * 12;
      setSalaryText(String(Math.max(0, Math.round(converted))));
    }
  };

  return (
    <div dir={copy.dir} lang={locale} className="flex min-h-screen flex-col bg-[var(--color-currena-bg-light)]">
      <span id="top" />
      <ToolsHeader copy={copy} locale={locale} onToggleLang={toggleLang} />

      <main id="main-content" className="mx-auto w-full max-w-[560px] flex-1 px-3 py-4 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[800px] lg:px-8">
        <ToolsBreadcrumb copy={copy} locale={locale} />

        {/* 1 — the country chips, then the title block */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="group" aria-label={t.countryLabel} data-cw="country-chips">
          <Chip active={country === "AU"} onClick={() => switchCountry("AU")} dataCw="country-AU">
            {t.countries.AU}
          </Chip>
          <Chip active={country === "US"} onClick={() => switchCountry("US")} dataCw="country-US">
            {t.countries.US}
          </Chip>
        </div>
        <header className="mt-1.5 mb-2">
          <h1 className="text-[1.5rem] font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] lg:text-[1.8rem]">
            {t.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">{t.promise}</p>
        </header>

        {/* 2 — the headline answer */}
        <div ref={headlineRef} data-cw="headline" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[var(--cr-shadow-card)]">
          <p className="m-0 text-[1.05rem] font-bold leading-[1.6] text-[var(--color-text-primary)] sm:text-[1.2rem]">
            {headline}
          </p>
          {result.band ? (
            <p className="mt-1.5 mb-0 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]" data-cw="range-line">
              {t.rangeWorse.replace("{x}", fmt(result.lowFinal ?? result.finalValue))}{" "}
              {t.rangeBetter.replace("{x}", fmt(result.highFinal ?? result.finalValue))}
            </p>
          ) : null}
          <p className="mt-2 mb-0 text-[13px] font-extrabold text-[var(--color-accent-gold-deep)]">{t.strongSentence}</p>
          {result.neverInvests ? (
            <p className="mt-2 mb-0 rounded-xl bg-[var(--color-surface-alert-tint)] px-3 py-2 text-[12.5px] font-semibold text-[var(--color-chip-ink-attention)]">
              {t.whatIf.neverInvests}
            </p>
          ) : null}
          {result.pending > 0 && !result.neverInvests ? (
            <p className="mt-1.5 mb-0 text-[12px] text-[var(--color-text-tertiary)]">
              {t.tiles.notYetInvested.replace("{x}", fmt(result.pending))}
            </p>
          ) : null}
        </div>

        {/* 3 — the three controls */}
        <section aria-label={t.controls.investIn} className="mt-2 space-y-2" data-cw="controls">
          {/* The amount group — with the W7 percent-of-salary mini calculator
              inside it (the switch is part of this group, not a fourth). */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5" data-cw="amount-group">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={amountMode === "share" ? "cw-percent" : "cw-amount"} className="type-label text-[var(--color-text-primary)]">
                {t.controls.perMonth}
              </label>
              {/* The Amount | % of salary switch — a real two-option control
                  (radio semantics, keyboard-usable). */}
              <span
                role="radiogroup"
                aria-label={t.controls.amountSwitchLabel}
                data-cw="amount-mode-switch"
                className="flex items-center gap-0.5 rounded-full bg-[var(--color-currena-bg-light)] p-0.5 ring-1 ring-[var(--color-border)]"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={amountMode === "amount"}
                  onClick={() => switchAmountMode("amount")}
                  data-cw="mode-amount"
                  className={`min-h-[28px] rounded-full px-2.5 text-[11.5px] font-bold transition-all ${
                    amountMode === "amount"
                      ? "bg-[var(--color-currena-blue)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {t.controls.switchAmount}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={amountMode === "share"}
                  onClick={() => switchAmountMode("share")}
                  data-cw="mode-share"
                  className={`min-h-[28px] rounded-full px-2.5 text-[11.5px] font-bold transition-all ${
                    amountMode === "share"
                      ? "bg-[var(--color-currena-blue)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {t.controls.switchShare}
                </button>
              </span>
            </div>

            {amountMode === "amount" ? (
              <>
                <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount((a) => Math.max(1, a - 10))}
                    aria-label={t.controls.decrease}
                    data-cw="amount-minus"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-lg font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform active:scale-90"
                  >
                    −
                  </button>
                  <NumberField
                    id="cw-amount"
                    value={amount}
                    onCommit={(v) => setAmount(Math.max(1, Math.round(v)))}
                    locale={locale}
                    suffix={currencySymbol}
                    ariaLabel={t.controls.perMonth}
                    dataCw="amount-input"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount((a) => a + 10)}
                    aria-label={t.controls.increase}
                    data-cw="amount-plus"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-lg font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform active:scale-90"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {AMOUNT_CHIPS.map((c) => (
                    <Chip key={c} active={amount === c} onClick={() => setAmount(c)} dataCw={`amount-${c}`}>
                      {formatMoney(c, locale)}
                    </Chip>
                  ))}
                </div>
                {/* The optional salary link — the same salary box used
                    everywhere (W7). */}
                {!salaryOpen ? (
                  <button
                    type="button"
                    onClick={() => setSalaryOpen(true)}
                    data-cw="add-salary"
                    className="mt-1.5 text-[11.5px] font-semibold text-[var(--color-currena-blue-deep)] hover:underline"
                  >
                    + {t.controls.addSalary}
                  </button>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    <SalaryBox
                      value={salaryText}
                      onChange={setSalaryText}
                      locale={locale}
                      placeholder={t.controls.salaryPlaceholder}
                      label={t.controls.salaryLabel}
                      period={salaryPeriod}
                      onPeriod={switchSalaryPeriod}
                      perYear={t.controls.perYear}
                      salaryPerMonth={t.controls.salaryPerMonth}
                      salaryPeriodLabel={t.controls.salaryPeriodLabel}
                    />
                  </div>
                )}
                {/* The live line: "That is 3.0% of your salary." (one
                    decimal, as the spec writes it). */}
                {salaryOpen && salaryMonthly !== null && salaryMonthly > 0 ? (
                  <p className="mt-1 mb-0 text-[11.5px] font-semibold text-[var(--color-text-secondary)]" aria-live="polite" data-cw="amount-salary-line">
                    {t.controls.thatIs.replace("{p}", pct1(amount / salaryMonthly, locale))}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.round((share * 100 - PERCENT_STEP) * 10) / 10;
                      setShare(clamp(next / 100, SHARE_MIN, SHARE_MAX, SHARE_DEFAULT));
                      setPctNote(false);
                    }}
                    aria-label={t.controls.decrease}
                    data-cw="percent-minus"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-lg font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform active:scale-90"
                  >
                    −
                  </button>
                  <NumberField
                    id="cw-percent"
                    value={Math.round(share * 1000) / 10}
                    onCommit={(v) => {
                      const clamped = clamp(v, SHARE_MIN * 100, SHARE_MAX * 100, SHARE_DEFAULT * 100);
                      setPctNote(clamped !== v);
                      setShare(clamped / 100);
                    }}
                    locale={locale}
                    suffix={pctSign(locale)}
                    ariaLabel={t.controls.percentLabel}
                    decimals
                    dataCw="percent-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.round((share * 100 + PERCENT_STEP) * 10) / 10;
                      setShare(clamp(next / 100, SHARE_MIN, SHARE_MAX, SHARE_DEFAULT));
                      setPctNote(false);
                    }}
                    aria-label={t.controls.increase}
                    data-cw="percent-plus"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-lg font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform active:scale-90"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {PERCENT_CHIPS.map((c) => (
                    <Chip
                      key={c}
                      active={Math.round(share * 1000) / 10 === c}
                      onClick={() => {
                        setShare(c / 100);
                        setPctNote(false);
                      }}
                      dataCw={`percent-${c}`}
                    >
                      {formatMoney(c, locale)}{pctSign(locale)}
                    </Chip>
                  ))}
                </div>
                {/* The salary box — always visible in % mode (the same box
                    used everywhere, W7). */}
                <div className="mt-2 space-y-1.5">
                  <SalaryBox
                    value={salaryText}
                    onChange={setSalaryText}
                    locale={locale}
                    placeholder={t.controls.salaryPlaceholder}
                    label={t.controls.salaryLabel}
                    period={salaryPeriod}
                    onPeriod={switchSalaryPeriod}
                    perYear={t.controls.perYear}
                    salaryPerMonth={t.controls.salaryPerMonth}
                    salaryPeriodLabel={t.controls.salaryPeriodLabel}
                  />
                  <p className="m-0 text-[11px] leading-snug text-[var(--color-text-tertiary)]">{t.controls.salaryHint}</p>
                </div>
                {/* The live result line — always visible, announced politely. */}
                <p
                  className="mt-1.5 mb-0 rounded-xl bg-[var(--color-currena-soft)] px-3 py-2 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
                  aria-live="polite"
                  data-cw="share-live-line"
                >
                  {salaryMonthly !== null && salaryMonthly > 0
                    ? t.controls.liveLine
                        .replace("{p}", formatPctLocal(share, locale))
                        .replace("{salary}", moneyLabel(salaryNumber!))
                        .replace("{period}", locale === "fa"
                          ? (salaryPeriod === "year" ? t.controls.perYear : t.controls.salaryPerMonth)
                          : (salaryPeriod === "year" ? "a year" : "a month"))
                        .replace("{amount}", moneyLabel(monthlyAmountFrom(salaryMonthly, share)))
                    : t.controls.enterSalary.replace("{p}", formatPctLocal(share, locale))}
                </p>
                {pctNote ? (
                  <p className="mt-1 mb-0 text-[11px] font-semibold text-[var(--color-chip-ink-attention)]" data-cw="percent-note">
                    {t.errors.clampMessage}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="cw-years" className="type-label text-[var(--color-text-primary)]">
                {t.controls.forHowManyYears}
              </label>
              <div className="flex items-center gap-2">
                <NumberField
                  id="cw-years"
                  value={Math.round(months / 12)}
                  onCommit={setYears}
                  locale={locale}
                  suffix={locale === "fa" ? t.controls.years : "yr"}
                  ariaLabel={t.controls.forHowManyYears}
                  clampRange={[YEARS_MIN, YEARS_MAX, DEFAULT_YEARS]}
                  dataCw="years-input"
                />
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {YEAR_CHIPS.map((c) => (
                <Chip key={c} active={yearsChipsActive(c)} onClick={() => setYears(c)} dataCw={`years-${c}`}>
                  {formatMoney(c, locale)}
                </Chip>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
            <span className="type-label text-[var(--color-text-primary)]">{t.controls.investIn}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={t.controls.investIn} data-cw="asset-chips">
              {chips.map((chip) => (
                <Chip
                  key={chip.id}
                  active={chip.id === asset.id}
                  onClick={() => setAssetId(chip.id)}
                  ariaLabel={locale === "fa" ? chip.labelFa : chip.labelEn}
                  dataCw={`asset-${chip.id}`}
                >
                  {locale === "fa" ? chip.labelFa : chip.labelEn}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — the chart */}
        <section className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" aria-label={t.chart.title}>
          <h2 className="sr-only">{t.chart.title}</h2>
          <GrowthChart
            series={result.series}
            lowSeries={result.lowSeries}
            highSeries={result.highSeries}
            others={otherLines}
            milestones={pageMilestones}
            crossoverMonth={result.crossoverMonth}
            locale={locale}
            startYm={startMonth}
            summary={t.chart.summary
              .replace("{years}", formatMoney(years, locale, years % 1 === 0 ? 0 : 1))
              .replace("{putIn}", fmt(result.totalPutIn))
              .replace("{final}", fmt(result.finalValue))
              .replace("{today}", fmt(result.finalValueToday))
              .replace(
                "{crossover}",
                result.crossoverMonth !== null
                  ? monthYearLabel(isoOfMonth(startMonth, result.crossoverMonth), locale)
                  : t.chart.crossoverNever,
              )}
            labels={{
              putIn: t.chart.putInLabel,
              growth: t.chart.growthLabel,
              bandLow: t.chart.bandLowLabel,
              bandHigh: t.chart.bandHighLabel,
              crossover:
                result.crossoverMonth !== null
                  ? `${t.chart.crossoverShort} ${monthYearLabel(isoOfMonth(startMonth, result.crossoverMonth), locale)}`
                  : t.chart.crossoverNever,
            }}
            fmtValue={(v) => formatMoney(v, locale)}
          />
          <p className="mt-1.5 mb-0 text-[11.5px] leading-snug text-[var(--color-text-tertiary)]" data-cw="measured-line">
            {measuredLine(asset, locale)}
          </p>
          {stale ? (
            <p className="mt-1 mb-0 text-[11.5px] font-semibold text-[var(--color-chip-ink-watch)]">{t.how.stale}</p>
          ) : null}
        </section>

        {/* 5 — the three tiles (each with the currency symbol, W6) */}
        <section className="mt-3" aria-label={t.tiles.youCouldHave}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t.tiles.youPutIn, value: shownPutIn, tone: "muted" },
              { label: t.tiles.growthAdded, value: shownGrowth, tone: "gold" },
              { label: t.tiles.youCouldHave, value: shownFinal, tone: "strong" },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`rounded-2xl border p-3 ${
                  tile.tone === "strong"
                    ? "border-[color-mix(in_srgb,var(--color-accent-gold)_45%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-accent-gold)_10%,var(--color-surface))]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              >
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]" style={{ letterSpacing: locale === "fa" ? 0 : undefined }}>
                  {tile.label}
                </div>
                <div
                  className={`mt-1 flex flex-wrap items-baseline gap-x-1 tabular-nums leading-tight ${
                    tile.tone === "gold" ? "text-[var(--color-accent-gold-deep)]" : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {/* W6: the currency symbol sits with the number (A$/ $),
                      exactly like the headline; Farsi keeps its own word
                      convention (the number, then the currency word). */}
                  <span
                    className={locale === "en" ? "text-[clamp(0.8rem,3.4vw,1.05rem)] font-bold" : "hidden"}
                    dir="ltr"
                    aria-hidden={locale === "fa"}
                  >
                    {currencySymbol}
                  </span>
                  <span className="text-[clamp(1.05rem,4.6vw,1.5rem)] font-extrabold" dir="ltr">
                    {fmt(tile.value)}
                  </span>
                  {locale === "fa" ? (
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">{currencyWord}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {/* W3: the inflation caption appears whenever today's money is shown,
              and follows the editable inflation setting. */}
          {moneyView === "today" ? (
            <p className="mt-1.5 mb-0 text-[11.5px] leading-snug text-[var(--color-text-tertiary)]" data-cw="inflation-caption">
              {t.tiles.inflationCaption.replace("{x}", formatPctLocal(inflation, locale))}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center justify-end gap-1" data-cw="money-toggle">
            <Chip active={moneyView === "future"} onClick={() => setMoneyView("future")} dataCw="money-future">
              {t.tiles.futureMoney}
            </Chip>
            <Chip active={moneyView === "today"} onClick={() => setMoneyView("today")} dataCw="money-today">
              {t.tiles.todaysMoney}
            </Chip>
          </div>
        </section>

        {/* 6 — the milestones */}
        <section className="mt-3" aria-label={t.milestones.title}>
          <h2 className="type-kicker mb-1.5 text-[var(--color-text-tertiary)]">{t.milestones.title}</h2>
          {pageMilestones.length === 0 ? (
            <p className="m-0 text-[13px] text-[var(--color-text-secondary)]">{t.milestones.none}</p>
          ) : (
            <ul className="m-0 list-none space-y-1 p-0">
              {pageMilestones.map((ms) => (
                <li key={ms.threshold} className="flex items-baseline gap-1.5 text-[13.5px] text-[var(--color-text-primary)]">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-gold-deep)]" aria-hidden="true" />
                  <span>
                    {t.milestones.line
                      .replace("{amount}", fmt(ms.threshold))
                      .replace("{date}", monthYearLabel(isoOfMonth(startMonth, ms.month), locale))}
                    {age !== null ? ` ${t.milestones.atAge.replace("{n}", formatMoney(age + Math.floor((ms.month - 1) / 12), locale))}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 7 — the two buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            data-cw="more-options"
            className="min-h-[46px] rounded-xl bg-[var(--color-currena-soft)] px-4 text-[14px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform active:scale-95"
          >
            {t.buttons.moreOptions}
          </button>
          <span className="relative">
            <button
              type="button"
              onClick={() => setCardMenuOpen((o) => !o)}
              aria-expanded={cardMenuOpen}
              data-cw="save-card"
              className="min-h-[46px] rounded-xl bg-[var(--color-text-primary)] px-4 text-[14px] font-bold text-[var(--color-surface)] transition-transform active:scale-95"
            >
              {t.buttons.saveAsCard}
            </button>
            {cardMenuOpen ? (
              <span
                className="absolute z-30 mt-1.5 block w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cr-shadow-focal)]"
                style={{ insetInlineStart: 0 }}
                data-cw="card-menu"
              >
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-start text-[13.5px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-currena-soft)]"
                  onClick={() => {
                    setCardMenuOpen(false);
                    setPrintOpen(true);
                  }}
                >
                  {t.print.printOrPdf}
                </button>
                <button
                  type="button"
                  className="block w-full border-t border-[var(--color-border)] px-4 py-3 text-start text-[13.5px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-currena-soft)]"
                  onClick={() => {
                    setCardMenuOpen(false);
                    setPhoneOpen(true);
                  }}
                >
                  {t.print.phoneCard}
                </button>
              </span>
            ) : null}
          </span>
        </div>

        {/* The what-if cards */}
        <section className="mt-5" aria-label={t.whatIf.title}>
          <h2 className="type-kicker mb-2 text-[var(--color-text-tertiary)]">{t.whatIf.title}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {small ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5" data-cw="small-changes">
                <div className="text-[12px] font-bold text-[var(--color-text-tertiary)]">{t.whatIf.smallChanges}</div>
                <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                  {/* W1: money terms in Amount mode, percentage points in %
                      mode — never "1% more" for a 10%-of-the-amount change. */}
                  {small.describedAs === "salary" && small.pctNow !== null ? (
                    <>
                      {!small.hideMore && small.pctUp !== null
                        ? t.whatIf.morePct
                            .replace("{up}", formatPctLocal(small.pctUp, locale))
                            .replace("{now}", formatPctLocal(small.pctNow, locale))
                            .replace("{x}", fmt(small.more))
                        : ""}
                      {!small.hideMore && !small.hideLess && small.pctDown !== null ? " " : ""}
                      {!small.hideLess && small.pctDown !== null
                        ? t.whatIf.lessPct
                            .replace("{down}", formatPctLocal(small.pctDown, locale))
                            .replace("{now}", formatPctLocal(small.pctNow, locale))
                            .replace("{x}", fmt(small.less))
                        : ""}
                    </>
                  ) : (
                    <>
                      {!small.hideMore && small.moneyStep !== null
                        ? t.whatIf.moreMoney
                            .replace("{step}", formatMoney(small.moneyStep, locale))
                            .replace("{x}", fmt(small.more))
                        : ""}
                      {!small.hideMore && !small.hideLess && small.moneyStep !== null ? " " : ""}
                      {!small.hideLess && small.moneyStep !== null
                        ? t.whatIf.lessMoney
                            .replace("{step}", formatMoney(small.moneyStep, locale))
                            .replace("{x}", fmt(small.less))
                        : ""}
                    </>
                  )}
                </p>
                {small.describedAs === "amount" &&
                small.stepShareOfSalary !== null &&
                small.moneyStep !== null &&
                !small.hideMore ? (
                  <p className="mt-1 mb-0 text-[11px] text-[var(--color-text-tertiary)]" data-cw="small-salary-suffix">
                    {t.whatIf.salarySuffix.replace("{p}", formatPctLocal(small.stepShareOfSalary, locale))}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-[var(--color-text-tertiary)]">{t.whatIf.laterLabel}</span>
                <span className="flex gap-1" role="group" aria-label={t.whatIf.laterLabel} data-cw="later-years">
                  {[1, 3, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setLaterYears(y)}
                      aria-pressed={laterYears === y}
                      data-cw={`later-${y}`}
                      className={`min-h-[30px] rounded-full px-2.5 text-[12px] font-bold ${
                        laterYears === y
                          ? "bg-[var(--color-currena-blue)] text-white"
                          : "bg-[var(--color-currena-bg-light)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
                      }`}
                    >
                      {t.whatIf.years[[1, 3, 5].indexOf(y)]}
                    </button>
                  ))}
                </span>
              </div>
              <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                {later !== null
                  ? t.whatIf.later
                      .replace("{n}", formatMoney(laterYears, locale))
                      .replace("{x}", fmt(later))
                  : ""}
              </p>
            </div>
            {asCash !== null ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                <div className="text-[12px] font-bold text-[var(--color-text-tertiary)]">{t.whatIf.cashLabel}</div>
                <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                  {t.whatIf.cash.replace("{x}", fmt(asCash))}
                </p>
              </div>
            ) : null}
            {result.feesShareOfPutIn !== null ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                <div className="text-[12px] font-bold text-[var(--color-text-tertiary)]">{t.moreOptions.costs}</div>
                <p className="mt-1 mb-0 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                  {t.whatIf.costs
                    .replace("{x}", fmt(result.feesPaid))
                    .replace("{pct}", `${formatPctLocal(result.feesShareOfPutIn, locale)}${pctSign(locale)}`)}
                </p>
                {result.feeEatsLargeShare ? (
                  <p className="mt-1 mb-0 text-[11.5px] font-semibold text-[var(--color-chip-ink-watch)]">{t.whatIf.costsHint}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {/* More options — four plain groups, all collapsed by default */}
        {moreOpen ? (
          <section className="mt-4 space-y-2" aria-label={t.moreOptions.title} data-cw="more-options-groups">
            <p className="m-0 text-[11.5px] text-[var(--color-text-tertiary)]">{t.moreOptions.reloadNote}</p>

            <Fold
              title={t.moreOptions.aboutYou}
              open={!!groupOpen.about}
              onToggle={() => setGroupOpen((g) => ({ ...g, about: !g.about }))}
              dataCw="group-about"
            >
              {/* W7: the salary lives in the amount group (§5.3), not here.
                  This note states the % mode's one-line assumption. */}
              {amountMode === "share" ? (
                <p className="m-0 rounded-xl bg-[var(--color-currena-soft)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--color-text-secondary)]" data-cw="share-grow-note">
                  {t.moreOptions.shareGrowNote}
                </p>
              ) : null}
              {salaryMonthly !== null && salaryMonthly > 0 ? (
                <p className="m-0 text-[11.5px] text-[var(--color-text-tertiary)]" data-cw="years-of-salary">
                  {t.moreOptions.yearsOfSalary.replace(
                    "{n}",
                    formatMoney(yearsOfSalary(result.finalValueToday, salaryMonthly), locale, 1),
                  )}
                </p>
              ) : null}
              <FieldRow label={t.moreOptions.ageLabel} hint={t.moreOptions.ageHint}>
                <NumberField
                  id="cw-age"
                  value={age ?? 0}
                  onCommit={(v) => setAgeText(v > 0 ? String(Math.round(v)) : "")}
                  locale={locale}
                  ariaLabel={t.moreOptions.ageLabel}
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.startingLabel} hint={t.moreOptions.startingHint}>
                <NumberField
                  id="cw-starting"
                  value={startingAmount}
                  onCommit={(v) => setStartingText(String(Math.max(0, Math.round(v))))}
                  locale={locale}
                  suffix={currencySymbol}
                  ariaLabel={t.moreOptions.startingLabel}
                />
              </FieldRow>
            </Fold>

            <Fold
              title={t.moreOptions.costs}
              open={!!groupOpen.costs}
              onToggle={() => setGroupOpen((g) => ({ ...g, costs: !g.costs }))}
              dataCw="group-costs"
            >
              <FieldRow label={t.moreOptions.yearlyCostLabel} hint={t.moreOptions.yearlyCostHint}>
                <NumberField
                  id="cw-cost"
                  value={Math.round(yearlyCost * 10000) / 100}
                  onCommit={(v) => setYearlyCost(clamp(v / 100, YEARLY_COST_MIN, YEARLY_COST_MAX, DEFAULT_YEARLY_COST))}
                  locale={locale}
                  suffix={pctSign(locale)}
                  decimals
                  ariaLabel={t.moreOptions.yearlyCostLabel}
                  clampRange={[0, 3, 0.2]}
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.feeLabel} hint={t.moreOptions.feeHint}>
                <NumberField
                  id="cw-fee"
                  value={fee}
                  onCommit={(v) => setFeeText(String(Math.max(0, v)))}
                  locale={locale}
                  suffix={currencySymbol}
                  decimals
                  ariaLabel={t.moreOptions.feeLabel}
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.everyLabel}>
                <span className="flex items-center gap-1" data-cw="every">
                  <Chip active={every === 1} onClick={() => setEvery(1)}>
                    {t.moreOptions.every.m1}
                  </Chip>
                  <Chip active={every === 3} onClick={() => setEvery(3)}>
                    {t.moreOptions.every.m3}
                  </Chip>
                </span>
              </FieldRow>
            </Fold>

            <Fold
              title={t.moreOptions.rates}
              open={!!groupOpen.rates}
              onToggle={() => setGroupOpen((g) => ({ ...g, rates: !g.rates }))}
              dataCw="group-rates"
            >
              <FieldRow label={t.moreOptions.returnMode}>
                <span className="flex flex-wrap items-center gap-1" data-cw="rate-mode">
                  <Chip active={rateMode === "average"} onClick={() => setRateMode("average")}>
                    {t.moreOptions.modeAverage}
                  </Chip>
                  <Chip active={rateMode === "custom-rate"} onClick={() => setRateMode("custom-rate")}>
                    {t.moreOptions.modeCustomRate}
                  </Chip>
                  <Chip active={rateMode === "custom-range"} onClick={() => setRateMode("custom-range")}>
                    {t.moreOptions.modeCustomRange}
                  </Chip>
                </span>
              </FieldRow>
              {rateMode === "custom-rate" ? (
                <FieldRow label={t.moreOptions.customRateLabel}>
                  <NumberField
                    id="cw-crate"
                    value={Math.round(customRate * 1000) / 10}
                    onCommit={(v) => setCustomRateText(String(v))}
                    locale={locale}
                    suffix={pctSign(locale)}
                    decimals
                    ariaLabel={t.moreOptions.customRateLabel}
                    clampRange={[-50, 95, 7]}
                  />
                </FieldRow>
              ) : null}
              {rateMode === "custom-range" ? (
                <>
                  <FieldRow label={t.moreOptions.customLowLabel}>
                    <NumberField
                      id="cw-clow"
                      value={Math.round(customLow * 1000) / 10}
                      onCommit={(v) => setCustomLowText(String(v))}
                      locale={locale}
                      suffix={pctSign(locale)}
                      decimals
                      ariaLabel={t.moreOptions.customLowLabel}
                      clampRange={[-50, 95, 5]}
                    />
                  </FieldRow>
                  <FieldRow label={t.moreOptions.customHighLabel}>
                    <NumberField
                      id="cw-chigh"
                      value={Math.round(customHigh * 1000) / 10}
                      onCommit={(v) => setCustomHighText(String(v))}
                      locale={locale}
                      suffix={pctSign(locale)}
                      decimals
                      ariaLabel={t.moreOptions.customHighLabel}
                      clampRange={[-50, 95, 9]}
                    />
                  </FieldRow>
                </>
              ) : null}
              <FieldRow label={t.moreOptions.inflationLabel} hint={t.moreOptions.inflationHint}>
                <NumberField
                  id="cw-infl"
                  value={Math.round(inflation * 1000) / 10}
                  onCommit={(v) => setInflation(clamp(v / 100, INFLATION_MIN, INFLATION_MAX, 0.025))}
                  locale={locale}
                  suffix={pctSign(locale)}
                  decimals
                  ariaLabel={t.moreOptions.inflationLabel}
                  clampRange={[0, 15, 2.5]}
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.increaseLabel} hint={t.moreOptions.increaseHint}>
                <NumberField
                  id="cw-incr"
                  value={Math.round(increase * 1000) / 10}
                  onCommit={(v) => setIncrease(clamp(v / 100, INCREASE_MIN, INCREASE_MAX, 0))}
                  locale={locale}
                  suffix={pctSign(locale)}
                  decimals
                  ariaLabel={t.moreOptions.increaseLabel}
                  clampRange={[0, 15, 0]}
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.whatIfPointsLabel} hint={t.moreOptions.whatIfPointsHint}>
                <NumberField
                  id="cw-wif"
                  value={whatIfPts}
                  onCommit={(v) => setWhatIfPts(clamp(v, WHAT_IF_MIN, WHAT_IF_MAX, WHAT_IF_POINTS))}
                  locale={locale}
                  decimals
                  ariaLabel={t.moreOptions.whatIfPointsLabel}
                  clampRange={[WHAT_IF_MIN, WHAT_IF_MAX, WHAT_IF_POINTS]}
                />
              </FieldRow>
            </Fold>

            <Fold
              title={t.moreOptions.datesAndCompare}
              open={!!groupOpen.dates}
              onToggle={() => setGroupOpen((g) => ({ ...g, dates: !g.dates }))}
              dataCw="group-dates"
            >
              <FieldRow label={t.moreOptions.startLabel}>
                <input
                  type="month"
                  value={startMonth}
                  min={thisMonth()}
                  onChange={(e) => applyDates(e.target.value || thisMonth(), endMonth)}
                  aria-label={t.moreOptions.startLabel}
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[14px] font-bold text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                />
              </FieldRow>
              <FieldRow label={t.moreOptions.endLabel}>
                <input
                  type="month"
                  value={endMonth}
                  min={addMonths(startMonth, 1)}
                  onChange={(e) => applyDates(startMonth, e.target.value || addMonths(startMonth, 12))}
                  aria-label={t.moreOptions.endLabel}
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[14px] font-bold text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                />
              </FieldRow>
              {clamped ? (
                <p className="m-0 text-[11.5px] font-semibold text-[var(--color-chip-ink-watch)]">{t.moreOptions.datesClamped}</p>
              ) : null}
              <div className="rounded-xl border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setCompareOpen((o) => !o)}
                  aria-expanded={compareOpen}
                  className="flex min-h-[44px] w-full items-center justify-between px-3.5 py-2 text-start text-[13px] font-bold text-[var(--color-text-primary)]"
                  data-cw="compare-toggle"
                >
                  {t.moreOptions.compareTitle}
                  <span aria-hidden="true" className={`transition-transform ${compareOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
                {compareOpen ? (
                  <div className="overflow-x-auto border-t border-[var(--color-border)] px-3.5 py-3 scroll-slim" data-cw="compare-table">
                    <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
                      <thead>
                        <tr className="text-[var(--color-text-tertiary)]">
                          <th className="py-1 pe-2 text-start font-semibold">{t.moreOptions.compareAsset}</th>
                          <th className="py-1 px-2 text-end font-semibold">{t.moreOptions.compareRate}</th>
                          <th className="py-1 px-2 text-end font-semibold">{t.moreOptions.compareFinal}</th>
                          <th className="py-1 px-2 text-end font-semibold">{t.moreOptions.compareLow}</th>
                          <th className="py-1 ps-2 text-end font-semibold">{t.moreOptions.compareHigh}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chips.map((chip) => {
                          const r = computeCompound(plan, figuresOf(chip), months, {
                            isCash: chip.id === "cash",
                          });
                          const isCurrent = chip.id === asset.id;
                          return (
                            <tr key={chip.id} className={isCurrent ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}>
                              <td className="py-1.5 pe-2">{locale === "fa" ? chip.labelFa : chip.labelEn}</td>
                              <td className="py-1.5 px-2 text-end tabular-nums" dir="ltr">
                                {formatPctLocal(r.baselineRate, locale)}
                                {pctSign(locale)}
                              </td>
                              <td className="py-1.5 px-2 text-end tabular-nums" dir="ltr">{fmt(r.finalValue)}</td>
                              <td className="py-1.5 px-2 text-end tabular-nums text-[var(--color-text-tertiary)]" dir="ltr">
                                {r.lowFinal !== null ? fmt(r.lowFinal) : "·"}
                              </td>
                              <td className="py-1.5 ps-2 text-end tabular-nums text-[var(--color-text-tertiary)]" dir="ltr">
                                {r.highFinal !== null ? fmt(r.highFinal) : "·"}
                              </td>
                            </tr>
                          );
                        })}
                        {rateMode === "custom-rate" ? (
                          <tr className="text-[var(--color-text-secondary)]">
                            <td className="py-1.5 pe-2">{t.moreOptions.customWord}</td>
                            <td className="py-1.5 px-2 text-end tabular-nums" dir="ltr">
                              {formatPctLocal(customRate, locale)}
                              {pctSign(locale)}
                            </td>
                            <td className="py-1.5 px-2 text-end tabular-nums" dir="ltr">
                              {fmt(computeCompound({ ...plan }, { r20: null, r30: null }, months).finalValue)}
                            </td>
                            <td className="py-1.5 px-2 text-end">·</td>
                            <td className="py-1.5 ps-2 text-end">·</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </Fold>
          </section>
        ) : null}

        {/* How is this worked out? */}
        <div className="mt-4">
          <Fold title={t.how.title} open={howOpen} onToggle={() => setHowOpen((o) => !o)} dataCw="how">
            <ul className="m-0 list-none space-y-1.5 p-0 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {t.how.method.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-gold-deep)]" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.overlapNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.totalReturnNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.costNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.pendingNote}</p>
            {/* W3: the inflation used for today's money, and the latest
                12-month figure with its source and date. */}
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-secondary)]" data-cw="how-inflation">
              {t.how.inflationLine.replace("{x}", formatPctLocal(inflation, locale))}
            </p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]" data-cw="how-inflation-recent">
              {t.how.inflationRecentLine
                .replace("{y}", formatPctLocal(latestInfl.rate, locale))
                .replace("{source}", latestInfl.sourceName)
                .replace("{date}", locale === "fa" ? latestInfl.labelFa : latestInfl.labelEn)}
            </p>
            {/* W5: the exact index behind each asset, read from the figures
                file so it can never drift from the numbers. */}
            <p className="m-0 mt-1 text-[12px] font-semibold text-[var(--color-text-secondary)]" data-cw="how-indices-title">
              {t.how.indicesTitle}
            </p>
            <ul className="m-0 list-none space-y-0.5 p-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]" data-cw="how-indices">
              {chips.map((chip) => (
                <li key={chip.id} dir="auto">
                  <span className="font-semibold text-[var(--color-text-secondary)]">
                    {locale === "fa" ? chip.labelFa : chip.labelEn}:
                  </span>{" "}
                  {chip.measures}
                </li>
              ))}
              <li dir="auto">
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  {locale === "fa" ? rows.inflation.labelFa : rows.inflation.labelEn}:
                </span>{" "}
                {rows.inflation.measures}
              </li>
            </ul>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.superNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.taxNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.fxNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">{t.how.pastNote}</p>
            <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]" data-cw="sources-line">{sourcesLine}</p>
            {stale ? (
              <p className="m-0 text-[12px] font-semibold text-[var(--color-chip-ink-watch)]">{t.how.stale}</p>
            ) : null}
            <p className="m-0 border-t border-[var(--color-border)] pt-3 text-[12.5px] font-semibold text-[var(--color-text-secondary)]">
              {t.disclaimer}
            </p>
          </Fold>
        </div>
      </main>

      {/* The slim sticky mobile bar */}
      {headlineAway ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur sm:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          data-cw="sticky-bar"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <span className="flex flex-col leading-tight">
              <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                {t.tiles.youCouldHave}
              </span>
              <span className="text-[15px] font-extrabold tabular-nums text-[var(--color-text-primary)]" dir="ltr">
                {fmt(result.finalValue)}
              </span>
            </span>
            <span className="flex flex-col items-end leading-tight">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-tertiary)]">{t.tiles.todaysMoney}</span>
              <span className="text-[13px] font-bold tabular-nums text-[var(--color-text-secondary)]" dir="ltr">
                {fmt(result.finalValueToday)}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      {/* The cards */}
      {printOpen ? (
        <A4PrintCard
          copy={copy}
          locale={locale}
          result={result}
          plan={plan}
          asset={asset}
          months={months}
          startMonth={startMonth}
          money={moneyLabel}
          onClose={() => setPrintOpen(false)}
        />
      ) : null}
      {phoneOpen ? (
        <PhoneCard
          copy={copy}
          locale={locale}
          result={result}
          plan={plan}
          asset={asset}
          months={months}
          startMonth={startMonth}
          money={moneyLabel}
          onClose={() => setPhoneOpen(false)}
        />
      ) : null}

      <ToolsFooter copy={copy} locale={locale} />
    </div>
  );
}

/** Local percent formatter (digits only; the % / ٪ is added by the caller). */
function formatPctLocal(v: number, locale: Locale, digits = 1): string {
  return formatMoney(v * 100, locale, digits);
}
