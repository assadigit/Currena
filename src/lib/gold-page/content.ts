/**
 * The Currena gold page — content module (bilingual EN + fa).
 *
 * The copy is ported from the Currena site's own reviewed dictionaries
 * (apps/web/src/shared/i18n/{en,fa}.ts + insights-copy-{en,fa}.ts) — the
 * page speaks Currena's own language in both locales, never a parallel
 * vocabulary. The 37-voter table mirrors the engine's own frozen table
 * (GOLD_LANE_VOTERS) with the recorded reading states of the meter's
 * record snapshot; the mechanism sentences are the content atlas's own
 * (gold-content-brief-{en,fa}.ts), byte-faithful.
 */

export type Locale = "en" | "fa";

export type LaneId = "borrowing-costs" | "dollar" | "stress" | "inflation" | "flows";

export type SeatState = "supports" | "pressures" | "steady" | "unread";
export type Evidence = "rising" | "falling" | "high" | "low" | null;
export type WhyUnread = "upstream-stopped" | "upstream-gap" | "pipeline-lag" | "rule-driven";

/** One of the 37 voter seats, with its recorded reading state. */
export interface SeatDef {
  id: string;
  lane: LaneId;
  polarity: -1 | 1;
  state: SeatState;
  evidence: Evidence;
  whyUnread?: WhyUnread;
}

/** The five lanes, fixed order. */
export const LANES: readonly LaneId[] = [
  "borrowing-costs",
  "dollar",
  "stress",
  "inflation",
  "flows",
];

/**
 * The 37-voter table — the engine's frozen memberships (polarity) with
 * the meter's recorded reading states as of the record snapshot
 * (2026-11-21: the balance read 1 lane for · 3 against · 1 not leaning,
 * "conditions moderately pressure gold").
 */
export const SEATS: readonly SeatDef[] = [
  // ——— Borrowing costs (7): tight is the classic gold headwind —
  { id: "real-yield-10y", lane: "borrowing-costs", polarity: -1, state: "pressures", evidence: "high" },
  { id: "us10y", lane: "borrowing-costs", polarity: -1, state: "pressures", evidence: "high" },
  { id: "us30y", lane: "borrowing-costs", polarity: -1, state: "steady", evidence: null },
  { id: "fed-target", lane: "borrowing-costs", polarity: -1, state: "steady", evidence: null },
  { id: "fed-expectations", lane: "borrowing-costs", polarity: -1, state: "unread", evidence: null, whyUnread: "upstream-stopped" },
  { id: "ecb-dfr", lane: "borrowing-costs", polarity: -1, state: "steady", evidence: null },
  { id: "real-yield-5y", lane: "borrowing-costs", polarity: -1, state: "pressures", evidence: "high" },
  // ——— The dollar (7): strong is the headwind —
  { id: "dollar-basket", lane: "dollar", polarity: -1, state: "pressures", evidence: "rising" },
  { id: "usdjpy", lane: "dollar", polarity: -1, state: "pressures", evidence: "high" },
  { id: "us-japan-10y-gap", lane: "dollar", polarity: -1, state: "steady", evidence: null },
  { id: "usd-reserve-share", lane: "dollar", polarity: -1, state: "pressures", evidence: "high" },
  { id: "nyfed-custody", lane: "dollar", polarity: -1, state: "unread", evidence: null, whyUnread: "pipeline-lag" },
  { id: "dollar-broad", lane: "dollar", polarity: -1, state: "steady", evidence: null },
  { id: "dollar-eme", lane: "dollar", polarity: -1, state: "steady", evidence: null },
  // ——— Market stress & uncertainty (11): elevated usually supports —
  { id: "stress-stlfsi", lane: "stress", polarity: 1, state: "supports", evidence: "high" },
  { id: "nfci", lane: "stress", polarity: 1, state: "steady", evidence: null },
  { id: "vix", lane: "stress", polarity: 1, state: "supports", evidence: "rising" },
  { id: "gold-silver", lane: "stress", polarity: 1, state: "supports", evidence: "high" },
  { id: "term-premium-10y", lane: "stress", polarity: 1, state: "steady", evidence: null },
  { id: "ebp", lane: "stress", polarity: 1, state: "steady", evidence: null },
  { id: "michigan-sentiment", lane: "stress", polarity: -1, state: "supports", evidence: "low" },
  { id: "gpr-daily", lane: "stress", polarity: 1, state: "steady", evidence: null },
  { id: "epu-us", lane: "stress", polarity: 1, state: "supports", evidence: "high" },
  { id: "sp500-breadth-ratio", lane: "stress", polarity: -1, state: "supports", evidence: "falling" },
  { id: "bank-stress", lane: "stress", polarity: 1, state: "steady", evidence: null },
  // ——— Inflation & expectations (10): running hot usually supports —
  { id: "us-cpi-yoy", lane: "inflation", polarity: 1, state: "supports", evidence: "high" },
  { id: "us-pce-core-yoy", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  { id: "euro-hicp", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  { id: "breakeven-5y5y", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  { id: "breakeven-tilt", lane: "inflation", polarity: 1, state: "pressures", evidence: "falling" },
  { id: "t5yie", lane: "inflation", polarity: 1, state: "pressures", evidence: "falling" },
  { id: "michigan-1y-expectations", lane: "inflation", polarity: 1, state: "unread", evidence: null, whyUnread: "upstream-gap" },
  { id: "m2-us", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  { id: "us-deficit-12m", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  { id: "michigan-5y-expectations", lane: "inflation", polarity: 1, state: "steady", evidence: null },
  // ——— Flows & demand (2): crowded is fragile —
  { id: "cftc-gold-positioning", lane: "flows", polarity: -1, state: "pressures", evidence: "high" },
  { id: "cftc-gold-gross-long", lane: "flows", polarity: -1, state: "pressures", evidence: "high" },
];

export interface LaneReading {
  lane: LaneId;
  side: "for" | "against" | "neutral" | "unread";
  split: boolean;
  supports: number;
  pressures: number;
  steady: number;
  unread: number;
  members: readonly SeatDef[];
}

/** The consolidated five-lane balance (the record snapshot). */
export function laneReadings(): LaneReading[] {
  return LANES.map((lane) => {
    const members = SEATS.filter((s) => s.lane === lane);
    const supports = members.filter((m) => m.state === "supports").length;
    const pressures = members.filter((m) => m.state === "pressures").length;
    const steady = members.filter((m) => m.state === "steady").length;
    const unread = members.filter((m) => m.state === "unread").length;
    const firing = supports + pressures;
    const side: LaneReading["side"] =
      firing === 0
        ? members.every((m) => m.state === "unread")
          ? "unread"
          : "neutral"
        : firing >= 2
          ? supports === pressures
            ? "neutral"
            : pressures > supports
            ? "against"
            : "for"
          : "neutral";
    return { lane, side, split: firing >= 2 && supports === pressures && supports > 0, supports, pressures, steady, unread, members };
  });
}

export interface BalanceModel {
  lanes: LaneReading[];
  counts: { for: number; against: number; neutral: number; unread: number };
  net: number;
  tally: { supports: number; pressures: number; steady: number; unread: number };
}

export function balanceOf(): BalanceModel {
  const lanes = laneReadings();
  const counts = {
    for: lanes.filter((l) => l.side === "for").length,
    against: lanes.filter((l) => l.side === "against").length,
    neutral: lanes.filter((l) => l.side === "neutral").length,
    unread: lanes.filter((l) => l.side === "unread").length,
  };
  const tally = {
    supports: SEATS.filter((s) => s.state === "supports").length,
    pressures: SEATS.filter((s) => s.state === "pressures").length,
    steady: SEATS.filter((s) => s.state === "steady").length,
    unread: SEATS.filter((s) => s.state === "unread").length,
  };
  return { lanes, counts, net: counts.for - counts.against, tally };
}

/* ------------------------------------------------------------------ *
 * The bilingual copy (EN + fa) — Currena's own reviewed wording.
 * ------------------------------------------------------------------ */

export const UI = {
  en: {
    dir: "ltr" as const,
    nav: {
      site: "Currena",
      tagline: "Currency intelligence",
      links: { global: "Global", gold: "Gold", world: "World Markets", currencies: "Currencies", commodities: "Commodities" },
      langToggle: "فا",
      liveTag: "LIVE",
    },
    breadcrumb: { home: "Home", current: "Gold" },
    title: "Gold",
    purpose: "THE gold card — the 37-voter conditions meter plus the complete gold picture.",
    dataAsOf: "Data as of {date}",
    loadingLine: "Reading the gold meter…",
    recordNote: "Conditions record: Nov 21, 2026 · prices live",
    price: {
      eyebrow: "Gold price (ounce)",
      perOunce: "per troy ounce",
      series: "XAUUSD spot · daily closes",
      bars: "{n} bars · {from} → {to}",
      positionDecade: "top {p}% of the last 10 years",
      positionYear: "near the bottom of the past year",
      contextLine: "Gold over the last 30 days: {change}. Shown for context, not counted in the balance.",
      windows: { d7: "7d", d90: "90d", d30: "30-day speed" },
    },
    briefing: {
      eyebrow: "Briefing",
      headline: "Gold: conditions lean against it",
      assessment: "Conditions moderately pressure gold",
      countsLine: "· {for} for · {against} against · {neutral} not leaning",
      notForecast: "this describes current conditions, not a forecast",
      chipMonths: "Next 1–3 months",
      chipMonthsLean: "leans against gold",
      chipWeeks: "Next 1–2 weeks",
      assessmentLine: "Looking at the next 1–3 months: the evidence now leans against gold.",
      assessmentNote:
        "This is an assessment of current conditions, not a forecast. Our own measured test found no reliable link between these conditions and gold's next 1–3 months — the honest word is: no edge.",
      mixedLine: "The evidence is mixed across families.",
      cadenceLine: "rates (daily) · dollar (daily) · stress (mixed weekly) · inflation (monthly) · positioning (weekly)",
      whyTitle: "Why",
      couldChange: "What could change this: a real-yield turn, a dollar break, or a stress spike would re-weigh the balance fast.",
      evidence: "Evidence",
      howItWorks: "How it works",
    },
    balance: {
      eyebrow: "The balance",
      title: "The aggregate of factors affecting the price of gold",
      subtitle:
        "Gold's five main drivers are each read against their usual range and weighed equally. The beam shows today's lean. It is not a forecast.",
      verdictEyebrow: "Today's lean",
      verdictFor: "Leaning for gold",
      verdictAgainst: "Leaning against gold",
      sideFor: "Factors supporting gold's price",
      sideAgainst: "Factors pressuring gold's price",
      trayTitle: "Not leaning",
      trayNote: "weighed, but no clear lean",
      honesty: "Each factor weighs equally. This is a picture of current conditions, not a forecast and not advice.",
      laneWord: {
        "borrowing-costs": "tight",
        dollar: "strong",
        stress: "elevated",
        inflation: "split",
        flows: "crowded",
      } as Record<LaneId, string>,
      tally: "{s} for · {p} against · {st} steady · {u} unread",
      splitTally: "split {s}·{p}",
      fiveForces: "The five forces at a glance",
    },
    forces: {
      eyebrow: "The five forces",
      title: "What pushes gold up — and what pushes it down",
      subtitle: "Five families of drivers, 37 dials in all. Each dial leans with gold or against it; the balance above is their sum.",
      upLabel: "Supports gold",
      downLabel: "Pressures gold",
      seatCount: "{n} voters",
      stateWords: { supports: "supports", pressures: "pressures", steady: "not leaning", unread: "unread" },
      explainerTitle: "Each force, explained",
      explainerSubtitle: "The everyday mechanics behind each family — why it moves gold at all.",
      seeSeats: "See the {lane} seats",
    },
    narrative: {
      eyebrow: "What moved",
      title: "Why gold moved",
      priceFact: "Gold has moved {d30} over the last 30 days and {d90} over the last 90.",
      familyLine: "{lane}: {word} — {s} for, {p} against.",
      caveat: "The balance describes conditions, not price direction.",
    },
    yieldCard: {
      title: "The 10-year yield, decomposed",
      identity: "real {real} + breakeven {be} = nominal {nominal}",
      note: "Which piece moved decides what a yield rise means for gold: real-return growth is the classic threat; breakeven growth is the hedge channel.",
      asOf: "updated {date}",
    },
    signals: {
      eyebrow: "Signals",
      title: "Gold and silver — the verdict strip",
      goldCard: { name: "Gold", outlook: "leans against", trendLabel: "1-year trend", ytd: "Year to date" },
      silverCard: { name: "Silver", ratio: "Gold/silver ratio", note: "fear measured in metal" },
    },
    seats: {
      eyebrow: "The lanes",
      title: "The 37 seats, by lane",
      subtitle: "Every voter, its lean, and the evidence word — the readable dials behind the balance.",
      seatSupports: "Supports gold",
      seatPressures: "Pressures gold",
      seatSteady: "Not leaning",
      seatUnread: "Couldn't be read",
      evidenceRising: "rising",
      evidenceFalling: "falling",
      evidenceHigh: "high in its decade",
      evidenceLow: "low in its decade",
      whyUpstreamStopped: "source stopped publishing",
      whyUpstreamGap: "upstream did not publish the year-ago base month",
      whyPipelineLag: "data published upstream — the next refresh carries it",
      whyRuleDriven: "value current; no decile history for this seat yet",
      tallyLine: "{s} for · {p} against · {st} not leaning · {u} unread",
    },
    outlook: {
      eyebrow: "Outlook",
      title: "Where this could go",
      subtitle: "Plausible paths, labelled with what would have to be true — never probabilities dressed as certainty.",
      weeks: "1–2 weeks",
      months: "1–3 months",
      upside: "Upside",
      base: "Base case",
      downside: "Downside",
      upsideNote: "A stress spike or a real-yield turn re-weighs the balance fast.",
      baseNote: "Conditions keep moderately pressuring; gold drifts with the dollar.",
      downsideNote: "The dollar keeps rising and yields stay high — the squeeze continues.",
      notForecast: "Scenario illustrations, not forecasts.",
    },
    indicators: {
      eyebrow: "At a glance",
      title: "Key indicators — the dashboard",
      subtitle: "The handful of live series behind today's story.",
      realYield: "Real 10y yield",
      dxy: "Dollar index",
      usdjpy: "USD/JPY",
      silver: "Silver",
      goldSilver: "Gold/silver ratio",
      spx: "S&P 500",
      oil: "Oil",
      d30: "30-day",
    },
    bridge: {
      eyebrow: "Regional chapter",
      regionChip: "Regional market · Tehran",
      title: "The Iran bridge",
      subtitle:
        "Tehran gold prices decompose into global gold, the free-market dollar, and the local premium (حباب) — the domestic market's own surcharge over parity.",
      parity: "the parity arithmetic",
      step1: "Global ounce (USD)",
      step2: "× free-market dollar (toman per USD)",
      step3: "= parity (toman per ounce)",
      step4: "+ local premium (حباب)",
      step5: "= Tehran market price",
      methodTitle: "How it is computed",
      method:
        "intrinsic = global ounce × free-market dollar × pure-gold content; the premium is the market price over that intrinsic value. The live Tehran board runs on the Currena site.",
      note: "The global page stays global — this chapter is clearly regional by design.",
    },
    history: {
      eyebrow: "History",
      title: "Gold's big episodes",
      subtitle: "The eras that taught the market gold's lessons — the force families named under each.",
      living: "the living record",
      ifBought: {
        title: "If you'd bought gold",
        subtitle: "What $100 invested on each date would be worth today.",
        worth: "would be worth",
        ago: "{n} ago",
        today: "today",
      },
    },
    takeaway: {
      title: "Key takeaway",
      body:
        "Gold is being pressured by high real yields, a rising dollar, and crowded long positioning; stress and monetary-hedge demand are the counterweights. The balance leans against — conditions, not a forecast.",
      explore: "Explore the five forces",
    },
    footer: {
      honestTitle: "The honest record",
      honestBody:
        "Every verdict on this page is derived from the same recorded readings through the same engine — nothing is double-counted, nothing invented. Dark seats state why they are dark. The balance describes conditions, never a forecast.",
      method: "Method: 37 voters · five lanes · equal weights · min 2 firing per lane vote",
      rights: "Currena · gold intelligence",
      langNote: "EN / fa — bilingual by design",
    },
  },
  fa: {
    dir: "rtl" as const,
    nav: {
      site: "Currena",
      tagline: "دادهٔ بازار، به روشنایی",
      links: { global: "جهانی", gold: "طلا", world: "بازارهای جهان", currencies: "ارزها", commodities: "کالاها" },
      langToggle: "EN",
      liveTag: "زنده",
    },
    breadcrumb: { home: "صفحه اصلی", current: "طلا" },
    title: "طلا",
    purpose: "کارت اصلی طلا — سنجهٔ شرایط ۳۷ رأی‌دهنده به‌همراه تصویر کامل طلا.",
    dataAsOf: "دادهٔ {date}",
    loadingLine: "در حال خواندن سنجهٔ طلا…",
    recordNote: "سابقهٔ شرایط: ۳۰ آبان ۱۴۰۵ · قیمت‌ها زنده",
    price: {
      eyebrow: "قیمت طلا (اونس)",
      perOunce: "هر اونس تروی",
      series: "انس جهانی طلا · قیمت‌های روزانه",
      bars: "{n} کندل · {from} ← {to}",
      positionDecade: "جزو بالاترین {p}٪ ده سال اخیر",
      positionYear: "نزدیک کفِ یک سال گذشته",
      contextLine: "طلا در ۳۰ روز گذشته: {change}. برای زمینه نشان داده می‌شود و در ترازو حساب نمی‌شود.",
      windows: { d7: "۷روز", d90: "۹۰روز", d30: "تغییر ۳۰روزه" },
    },
    briefing: {
      eyebrow: "مرور بازار",
      headline: "طلا: شرایط علیه آن می‌چرخد",
      assessment: "شرایط به‌اندازهٔ متوسط بر طلا فشار می‌آورد",
      countsLine: "· {for} موافق · {against} مخالف · {neutral} بدون گرایش",
      notForecast: "این توصیف شرایط فعلی است، نه پیش‌بینی",
      chipMonths: "۱ تا ۳ ماه آینده",
      chipMonthsLean: "علیه طلا می‌چرخد",
      chipWeeks: "۱ تا ۲ هفتهٔ آینده",
      assessmentLine: "در نگاه به ۱ تا ۳ ماه آینده: شواهد فعلاً علیه طلا می‌چرخند.",
      assessmentNote:
        "این ارزیابیِ شرایط فعلی است، نه پیش‌بینی. آزمون اندازه‌گیری‌شدهٔ خودمان هیچ پیوند قابل‌اتکایی میان این شرایط و ۱ تا ۳ ماه آیندهٔ طلا نیافت؛ واژهٔ صادقانه: مزیت قابل‌اتکایی نیست.",
      mixedLine: "شواهد در میان خانواده‌ها دوپاره است.",
      cadenceLine: "نرخ‌ها (روزانه) · دلار (روزانه) · تنش (هفتگی/مخلوط) · تورم (ماهانه) · پوزیشن (هفتگی)",
      whyTitle: "چرا",
      couldChange: "چه چیزی این را عوض می‌کند: چرخش بازده واقعی، شکست دلار یا جهش تنش، ترازو را سریع بازمی‌سنجد.",
      evidence: "شواهد",
      howItWorks: "چگونه کار می‌کند",
    },
    balance: {
      eyebrow: "ترازو",
      title: "برآیند عوامل مؤثر بر قیمت طلا",
      subtitle:
        "پنج عامل اصلی مؤثر بر طلا هرکدام در برابر محدودهٔ معمولشان خوانده و با وزن برابر سنجیده می‌شوند. ترازو گرایش امروز را نشان می‌دهد و پیش‌بینی نیست.",
      verdictEyebrow: "گرایش امروز",
      verdictFor: "تمایل به نفع طلا",
      verdictAgainst: "تمایل به ضرر طلا",
      sideFor: "عوامل حمایتی از قیمت طلا",
      sideAgainst: "عوامل فشارآور بر قیمت طلا",
      trayTitle: "بدون گرایش",
      trayNote: "سنجیده شد، اما گرایش روشنی نیست",
      honesty: "هر عامل وزن یکسانی دارد. این تصویری از شرایط فعلی است، نه پیش‌بینی و نه توصیه.",
      laneWord: {
        "borrowing-costs": "سخت",
        dollar: "قوی",
        stress: "بالا",
        inflation: "دوپاره",
        flows: "ازدحام",
      } as Record<LaneId, string>,
      tally: "{s} موافق · {p} مخالف · {st} بی‌طرف · {u} ناخوانده",
      splitTally: "دوپاره {s}·{p}",
      fiveForces: "پنج نیرو در یک نگاه",
    },
    forces: {
      eyebrow: "پنج نیرو",
      title: "چه چیزی طلا را بالا می‌برد — و چه چیزی پایین",
      subtitle: "پنج خانوادهٔ عامل، مجموعاً ۳۷ سنجه. هر سنجه با طلا یا علیه آن می‌چرخد؛ ترازوی بالا برآیند آن‌هاست.",
      upLabel: "به نفع طلا",
      downLabel: "علیه طلا",
      seatCount: "{n} رأی‌دهنده",
      stateWords: { supports: "حمایت", pressures: "فشار", steady: "بی‌طرف", unread: "ناخوانده" },
      explainerTitle: "هر نیرو، با زبان ساده",
      explainerSubtitle: "مکانیک روزمرهٔ پشت هر خانواده — چرا اصلاً طلا را حرکت می‌دهد.",
      seeSeats: "کرسی‌های {lane} را ببین",
    },
    narrative: {
      eyebrow: "چه حرکت کرد",
      title: "چرا طلا حرکت کرد",
      priceFact: "طلا در ۳۰ روز گذشته {d30} و در ۹۰ روز گذشته {d90} تغییر کرده است.",
      familyLine: "{lane}: {word} — {s} موافق، {p} مخالف.",
      caveat: "ترازو شرایط را توصیف می‌کند، نه جهت قیمت را.",
    },
    yieldCard: {
      title: "بازدهی ۱۰ ساله، تجزیه‌شده",
      identity: "واقعی {real} + سربه‌سر {be} = اسمی {nominal}",
      note: "اینکه کدام قطعه حرکت کرده معنای افزایش بازدهی را برای طلا تعیین می‌کند: رشدِ واقعی تهدید کلاسیک است؛ رشدِ سربه‌سر کانال سپر تورمی.",
      asOf: "به‌روزرسانی {date}",
    },
    signals: {
      eyebrow: "سیگنال‌ها",
      title: "طلا و نقره — نوار حکم",
      goldCard: { name: "طلا", outlook: "می‌چرخد علیه", trendLabel: "روند یک‌ساله", ytd: "از ابتدای سال" },
      silverCard: { name: "نقره", ratio: "نسبت طلا به نقره", note: "ترسِ اندازه‌گیری‌شده در فلز" },
    },
    seats: {
      eyebrow: "لاین‌ها",
      title: "۳۷ کرسی، به تفکیک لاین",
      subtitle: "هر رأی‌دهنده، گرایشش و واژهٔ شاهد — سنجه‌های خوانا پشت ترازو.",
      seatSupports: "به نفع قیمت طلا",
      seatPressures: "علیه قیمت طلا",
      seatSteady: "بدون گرایش",
      seatUnread: "قابل ارزیابی نبود",
      evidenceRising: "رو به افزایش",
      evidenceFalling: "رو به کاهش",
      evidenceHigh: "در بالای دامنهٔ ده‌ساله",
      evidenceLow: "در پایین دامنهٔ ده‌ساله",
      whyUpstreamStopped: "منبع داده انتشار را متوقف کرده",
      whyUpstreamGap: "ماهِ مبنای سال گذشته بالادست منتشر نشد",
      whyPipelineLag: "داده در منبع منتشر شده؛ تازه‌سازی بعدی می‌آوردش",
      whyRuleDriven: "مقدار به‌روز است؛ تاریخچهٔ ده‌ساله هنوز نیست",
      tallyLine: "{s} موافق · {p} مخالف · {st} بدون گرایش · {u} ناخوانده",
    },
    outlook: {
      eyebrow: "چشم‌انداز",
      title: "این می‌تواند کجا برود",
      subtitle: "مسیرهای موجه، با شرط صدقشان — هرگز احتمالاتِ جامهٔ قطعیت‌پوشیده.",
      weeks: "۱ تا ۲ هفته",
      months: "۱ تا ۳ ماه",
      upside: "بازگشت رو به بالا",
      base: "حالت پایه",
      downside: "بازگشت رو به پایین",
      upsideNote: "جهش تنش یا چرخش بازده واقعی، ترازو را سریع بازمی‌سنجد.",
      baseNote: "شرایط به‌اندازهٔ متوسط فشار می‌آورند؛ طلا با دلار همراه می‌ماند.",
      downsideNote: "دلار بالا بماند و نرخ‌ها سخت — فشار ادامه می‌یابد.",
      notForecast: "تصویرسازی سناریو، نه پیش‌بینی.",
    },
    indicators: {
      eyebrow: "در یک نگاه",
      title: "شاخص‌های کلیدی — داشبورد",
      subtitle: "مجموعهٔ کوچکی از سری‌های زنده پشت روایت امروز.",
      realYield: "بازده واقعی ۱۰ساله",
      dxy: "شاخص دلار",
      usdjpy: "دلار/ین",
      silver: "نقره",
      goldSilver: "نسبت طلا به نقره",
      spx: "اس‌اند‌پی ۵۰۰",
      oil: "نفت",
      d30: "۳۰ روز",
    },
    bridge: {
      eyebrow: "فصل منطقه‌ای",
      regionChip: "بازار منطقه‌ای · تهران",
      title: "پل ایران",
      subtitle:
        "قیمت طلا در تهران به طلاجهانی، دلارِ آزاد و حبابِ محلی تجزیه می‌شود — مابه‌التفاوت بازار داخلی بر سمتِ برابری.",
      parity: "حساب برابری",
      step1: "اونس جهانی (دلار)",
      step2: "× دلار آزاد (تومان بر دلار)",
      step3: "= برابری (تومان بر اونس)",
      step4: "+ حبابِ محلی",
      step5: "= قیمت بازار تهران",
      methodTitle: "چگونه محاسبه می‌شود",
      method:
        "ارزش ذاتی = اونس جهانی × دلار آزاد × عیار خالص؛ حباب، مابه‌التفاوت قیمت بازار بر این ارزش ذاتی است. تختهٔ زندهٔ تهران در سایت Currena می‌چرخد.",
      note: "صفحهٔ جهانی جهانی می‌ماند — این فصل به‌طراحی جدا و منطقه‌ای است.",
    },
    history: {
      eyebrow: "تاریخ",
      title: "قسمت‌های بزرگ طلا",
      subtitle: "دوره‌هایی که درس‌های طلا را به بازار یاد دادند — خانوادهٔ نیروها زیر هر کدام.",
      living: "سابقهٔ زنده",
      ifBought: {
        title: "اگر طلا خریده بودید",
        subtitle: "هر ۱۰۰ دلارِ سرمایه‌گذاری‌شده در هر تاریخ، امروز چه می‌ارزد.",
        worth: "امروز می‌ارزد",
        ago: "{n} پیش",
        today: "امروز",
      },
    },
    takeaway: {
      title: "پیام کلیدی",
      body:
        "طلا زیر فشار بازدهی واقعی بالا، دلارِ رو به رشد و ازدحام پوزیشن‌های خرید است؛ تنش بازار و تقاضای سپر پولی، وزنه‌های مقابل‌اند. ترازو علیه می‌چرخد — شرایط، نه پیش‌بینی.",
      explore: "پنج نیرو را کاوش کن",
    },
    footer: {
      honestTitle: "سابقهٔ صادقانه",
      honestBody:
        "هر حکمی در این صفحه از همان قرائت‌های ثبت‌شده از همان موتور مشتق شده — دوباره‌حساب نیست، چیزی ساخته نشده. کرسی‌های تاریک دلیل تاریک‌بودنشان را می‌گویند. ترازو شرایط را توصیف می‌کند، هرگز پیش‌بینی را.",
      method: "روش: ۳۷ رأی‌دهنده · پنج لاین · وزن برابر · حداقل ۲ شلیک برای رأی لاین",
      rights: "Currena · هوش طلا",
      langNote: "EN / fa — دوزبانه به‌طراحی",
    },
  },
} as const;

/** The per-seat plain labels + mechanism sentences (EN + fa). */
export const SEAT_CONTENT: Record<string, { en: [string, string]; fa: [string, string] }> = {
  "real-yield-10y": {
    en: ["Real yields (inflation-adjusted)", "Bonds that beat inflation are gold's main rival for money — the better they pay, the more a zero-yield ounce costs to hold."],
    fa: ["بازده واقعی ۱۰ساله (خالص از تورم)", "اوراقی که از تورم جلو می‌زنند رقیب اصلی طلا برای پول‌اند؛ هرچه بهتر بپردازند، نگه‌داشتن اونسی که چیزی نمی‌پردازد گران‌تر تمام می‌شود."],
  },
  us10y: {
    en: ["US 10-year Treasury yield", "The 10-year rate anchors what money costs; what a rise is made of — real return, expected inflation, or fear premium — decides its meaning for gold."],
    fa: ["بازده ۱۰ساله آمریکا", "نرخ ۱۰ ساله لنگرگاه هزینهٔ پول است؛ اینکه یک افزایش از چه ساخته شده، یعنی بازده واقعی، تورم مورد انتظار یا صعود ترس، معنای آن را برای طلا تعیین می‌کند."],
  },
  us30y: {
    en: ["US 30-year Treasury yield", "Thirty-year money prices the far future; paid unusually well, it leaves gold's zero yield competing poorly for long-horizon savings."],
    fa: ["بازده ۳۰ساله آمریکا", "پولِ سی‌ساله قیمت آیندهٔ دور را تعیین می‌کند؛ اگر به‌طور غیرمعمول خوب بپردازد، بازدهٔ صفرِ طلا در رقابت برای پس‌انداز بلندمدت ضعیف می‌شود."],
  },
  "fed-target": {
    en: ["The Fed's policy rate", "The Fed's rate is the floor under every dollar rate — high settings make cash a strong rival to a metal that pays nothing."],
    fa: ["نرخ سیاستی فدرال رزرو", "نرخ فدرال رزرو کفِ همهٔ نرخ‌های دلاری است؛ تنظیمات بالا، پولِ نقد را رقیب قوی فلزی می‌کند که چیزی نمی‌پردازد."],
  },
  "fed-expectations": {
    en: ["Where markets see the Fed next", "Gold trades where rates are expected to go, not where they sit — the repricing usually moves it before the Fed does."],
    fa: ["انتظارات بازار از فدرال رزرو", "طلا آنجا معامله می‌شود که انتظار می‌رود نرخ‌ها بروند، نه آنجا که الان هستند؛ بازقیمت‌گذاری معمولاً پیش از فدرال رزرو آن را حرکت می‌دهد."],
  },
  "ecb-dfr": {
    en: ["ECB deposit rate", "Euro rates join the dollar's: when both big blocs pay well, the zero-yield ounce competes against the whole rich world at once."],
    fa: ["نرخ سپردهٔ بانک مرکزی اروپا", "نرخ‌های یورو به دلار می‌پیوندند؛ وقتی هر دو بلوک بزرگ خوب بپردازند، اونسِ بدون بازده یک‌جا با کل جهانِ ثروتمند رقابت می‌کند."],
  },
  "real-yield-5y": {
    en: ["Real yields, 5-year", "The 5-year real yield is where policy expectations bite first — often the earliest clean signal that the real-rate tide is turning."],
    fa: ["بازده واقعی ۵ساله", "بازده واقعی ۵ ساله نخستین جایی است که انتظارات سیاستی اثر می‌گذارند؛ اغلب اولین سیگنال تمیز از برگشتِ جزر و مد نرخ واقعی."],
  },
  "dollar-basket": {
    en: ["The dollar against six big currencies", "Gold is priced in dollars — a stronger dollar makes the same ounce pricier for buyers in every other currency, and demand tends to soften."],
    fa: ["دلار در برابر شش ارز بزرگ", "طلا به دلار قیمت می‌خورد؛ دلار قوی‌تر همان اونس را برای خریداران همهٔ ارزهای دیگر گران‌تر می‌کند و تقاضا معمولاً نرم می‌شود."],
  },
  usdjpy: {
    en: ["Dollar against the yen", "A rising dollar-yen pairs dollar strength with risk appetite; violent yen surges mark carry unwinds, the moments everything gets sold briefly."],
    fa: ["دلار در برابر ین ژاپن", "دلار-ینِ صعودی، قدرت دلار را با اشتها به ریسک همراه می‌کند؛ جهش‌های شدید ین نشان‌گر بازگشایی معامله‌های کری است، لحظه‌هایی که همه‌چیز موقتاً فروخته می‌شود."],
  },
  "us-japan-10y-gap": {
    en: ["US–Japan 10-year yield gap", "The wider the US–Japan yield gap, the stronger the pull into dollar assets — carry-trade fuel that supports the dollar."],
    fa: ["شکاف بازده ۱۰سالهٔ آمریکا و ژاپن", "هرچه شکاف بازده آمریکا و ژاپن بازتر باشد، کشش به دارایی‌های دلاری قوی‌تر است؛ سوختِ معاملهٔ کری که از دلار حمایت می‌کند."],
  },
  "usd-reserve-share": {
    en: ["The dollar's share of world reserves", "When the world's central banks keep concentrating reserves in dollars, gold's structural bid stays quiet; diversification is gold's long-run story."],
    fa: ["سهم دلار از ذخایر ارزی جهان", "وقتی بانک‌های مرکزی جهان ذخایرشان را همچنان بر دلار متمرکز نگه می‌دارند، تقاضای ساختاری طلا ساکت می‌ماند؛ تنوع‌بخشی، روایت بلندمدتِ طلاست."],
  },
  "nyfed-custody": {
    en: ["Foreign official custody at the NY Fed", "Foreign official custody tracks official appetite for dollar assets — when the pile shrinks, the diversification-into-gold story strengthens."],
    fa: ["دارایی‌های رسمی خارجی نزد فدرال رزرو نیویورک", "حساب امانی رسمیِ خارجی‌ها، اشتهای رسمی به دارایی‌های دلاری را نشان می‌دهد؛ وقتی این انبوه کوچک می‌شود، روایتِ تنوع‌بخشی به سمت طلا قوی‌تر می‌شود."],
  },
  "dollar-broad": {
    en: ["The broad trade-weighted dollar", "The broad dollar measures the dollar against the whole trading world — the cleanest single gauge of gold's usual inverse pattern."],
    fa: ["دلار آمریکا (شاخص گسترده)", "دلارِ گسترده، دلار را در برابر کل جهان تجاری می‌سنجد؛ تمیزترین سنجهٔ واحد برای الگوی معمولِ معکوسِ طلا."],
  },
  "dollar-eme": {
    en: ["The dollar vs emerging markets", "Much of the world's physical gold demand lives in emerging markets — dollar strength there squeezes the price-sensitive buyers who set the marginal price."],
    fa: ["دلار آمریکا در برابر اقتصادهای نوظهور", "بخش زیادی از تقاضای فیزیکی طلا در بازارهای نوظهور است؛ قدرت دلار آنجا، خریداران حساس به قیمتی را که قیمت حاشیه‌ای را تعیین می‌کنند تحت فشار می‌گذارد."],
  },
  "stress-stlfsi": {
    en: ["US financial stress index", "When US funding markets tighten, frightened money has historically run toward gold — the safe-haven bid at work."],
    fa: ["شاخص تنش مالی آمریکا (سن‌لویی)", "وقتی بازارهای تأمین مالی آمریکا تنگ می‌شود، پولِ ترسیده به‌طور تاریخی به سمت طلا دویده است؛ همان تقاضای پناهگاهی در کار است."],
  },
  nfci: {
    en: ["US financial conditions index", "A second, wider reading of the same conditions — when both stress gauges agree, the haven signal stands on firmer ground."],
    fa: ["شاخص شرایط مالی آمریکا (شیکاگو)", "قرائتی دوم و گسترده‌تر از همان شرایط؛ وقتی هر دو سنجهٔ تنش هم‌نظر باشند، سیگنال پناهگاه بر زمینِ محکم‌تری می‌ایستد."],
  },
  vix: {
    en: ["The stock market's fear gauge", "The VIX is the price of insurance against stock drops — expensive insurance means fear, and fear usually feeds gold's bid."],
    fa: ["شاخص ترس بازار (VIX)", "VIX قیمتِ بیمه در برابر سقوط سهام است؛ بیمهٔ گران یعنی ترس، و ترس معمولاً تقاضای طلا را تقویت می‌کند."],
  },
  "gold-silver": {
    en: ["The gold-to-silver ratio", "The gold-silver ratio is fear measured in metal: when gold pulls far ahead, markets are paying up for pure monetary shelter."],
    fa: ["نسبت طلا به نقره", "نسبت طلا به نقره، ترسِ اندازه‌گیری‌شده در فلز است؛ وقتی طلا پیش می‌افتد، بازارها برای پناهگاهِ پولیِ خالص گران می‌پردازند."],
  },
  "term-premium-10y": {
    en: ["The 10-year term premium", "Yields rising out of fear and supply worry — not expected policy — have historically sided with gold, not against it."],
    fa: ["صرف سررسید ۱۰سالهٔ آمریکا", "بازده‌هایی که از ترس و نگرانیِ عرضه بالا می‌روند، نه از انتظارِ سیاست، به‌طور تاریخی در کنار طلا بوده‌اند، نه علیه آن."],
  },
  ebp: {
    en: ["Excess bond premium", "The fear-compensation channel: when lenders demand extra for risk beyond the expected path, the debasement hedge gets more expensive."],
    fa: ["صرف اضافی اوراق قرضه", "کانال جبرانِ ترس: وقتی وام‌دهنده برای ریسکِ فراتر از مسیر مورد انتظار صرف می‌خواهد، سپرِ آب‌شدنِ پول گران‌تر می‌شود."],
  },
  "michigan-sentiment": {
    en: ["US consumer mood", "Consumer gloom has traveled with the uncertain times when gold's insurance role gets bought — here, pessimism is the gold-positive side."],
    fa: ["حال و هوای مصرف‌کنندهٔ آمریکا", "بدبینی مصرف‌کننده با دوره‌های نامطمئنی همراه بوده که نقش بیمه‌ای طلا در آن‌ها خریده می‌شود؛ اینجا بدبینی، سمتِ به‌نفعِ طلاست."],
  },
  "gpr-daily": {
    en: ["Geopolitical risk (7-day)", "War and tension headlines have usually bid gold first and asked questions later — much of the event premium fades if the feared outcome never arrives."],
    fa: ["ریسک ژئوپلیتیک (۷روزه)", "تیترهای جنگ و تنش معمولاً اول طلا را بالا برده‌اند و بعد سؤال پرسیده‌اند؛ بخش زیادی از صعودِ رویدادی محو می‌شود اگر پیامدِ ترسیده هرگز از راه نرسد."],
  },
  "epu-us": {
    en: ["US economic policy uncertainty", "Uncertainty about the rules themselves — elections, tariffs, shutdowns — raises the value of an asset that sits outside any single policy regime."],
    fa: ["عدم قطعیت سیاست اقتصادی آمریکا", "عدم قطعیت دربارهٔ خودِ قوانین، یعنی انتخابات، تعرفه‌ها و تعطیلی دولت، ارزش دارایی‌ای را بالا می‌برد که بیرون از هر رژیمِ سیاستی می‌ایستد."],
  },
  "sp500-breadth-ratio": {
    en: ["Stock market breadth", "A rally carried by a handful of giants has historically been fragile — narrowing breadth marks the risk-off phases in which gold's haven demand builds."],
    fa: ["گستردگی بازار سهام آمریکا", "رالی‌ای که بر دوش چند غول حمل شود به‌طور تاریخی شکننده بوده است؛ باریک‌شدن بازه، فازهای فرار از ریسک را نشان می‌دهد که تقاضای پناهگاهی طلا در آن‌ها ساخته می‌شود."],
  },
  "bank-stress": {
    en: ["Bank stress (discount window price)", "The emergency-borrowing rate rarely moves — when it does, banking stress is real, and that has been a strong gold trigger."],
    fa: ["تنش بانکی (قیمت پنجره تنزیل)", "نرخ استقراض اضطراری به‌ندرت حرکت می‌کند؛ وقتی حرکت کند، تنش بانکی واقعی است و این محرکِ قویِ طلا بوده است."],
  },
  "us-cpi-yoy": {
    en: ["US consumer inflation", "Hot consumer inflation feeds gold's hedge demand — but the policy response matters more quarter-to-quarter, which is why real rates guide better at short range."],
    fa: ["تورم مصرف‌کنندهٔ آمریکا", "تورمِ داغ مصرف‌کننده، تقاضای سپرِ طلا را تغذیه می‌کند؛ اما پاسخِ سیاست از فصلی به فصل مهم‌تر است و به همین دلیل بازده واقعی در بازهٔ کوتاه راهنمای بهتری است."],
  },
  "us-pce-core-yoy": {
    en: ["US core inflation (the Fed's gauge)", "Core inflation is the trend the Fed actually targets — hot core keeps policy tight, and the hedge and rates channels can pull gold opposite ways."],
    fa: ["تورم هسته‌ای آمریکا (PCE)", "تورم هسته‌ای روندی است که فدرال رزرو واقعاً هدف می‌گیرد؛ هستهٔ داغ سیاست را سخت نگه می‌دارد و کانال‌های سپر و نرخ می‌توانند طلا را در دو جهت بکشند."],
  },
  "euro-hicp": {
    en: ["Euro-area inflation", "Eurozone inflation drives the ECB and European savers' hedging — the worldwide bid gold answers to is global, not only American."],
    fa: ["تورم منطقهٔ یورو", "تورم منطقهٔ یورو، بانک مرکزی اروپا و سپرسازیِ پس‌اندازکنندگان اروپایی را هدایت می‌کند؛ تقاضای جهانی‌ای که طلا به آن پاسخ می‌دهد فراگیر است، نه فقط آمریکایی."],
  },
  "breakeven-5y5y": {
    en: ["Long-horizon inflation expectations", "The 5y5y is the market's long-run faith in money — when it climbs, the debasement worry underneath gold's structural case is building."],
    fa: ["انتظارات تورمی بلندمدت (۵ تا ۱۰ سال آینده)", "شاخص 5y5y ایمانِ بلندمدتِ بازار به پول است؛ وقتی بالا می‌رود، نگرانیِ آب‌شدنِ پول زیرِ بنای پروندهٔ ساختاری طلا در حال رشد است."],
  },
  "breakeven-tilt": {
    en: ["The tilt of inflation expectations", "A widening tilt means the market is extending inflation into the long run — the difference between a passing scare and a regime shift."],
    fa: ["شیب انتظارات تورمی", "شیبِ بازشونده یعنی بازار تورم را به بلندمدت گسترش می‌دهد؛ تفاوتِ میان یک ترسِ گذرا و یک تغییر رژیم."],
  },
  t5yie: {
    en: ["5-year breakeven inflation", "The 5-year breakeven is the near-term inflation markets price into bonds — when it reprices, the hedge bid has historically followed."],
    fa: ["انتظار تورم ۵سالهٔ آمریکا", "بریک‌ایون ۵ ساله، تورمِ کوتاه‌مدتی است که بازار در قیمت اوراق می‌گنجاند؛ وقتی بازقیمت می‌شود، تقاضای سپر به‌طور تاریخی در پی آن آمده است."],
  },
  "michigan-1y-expectations": {
    en: ["Households' 1-year inflation expectations", "Households feel inflation at the pump before bonds price it — rising household expectations have preceded the market's own repricing."],
    fa: ["تورم مورد انتظار خانوارها (سال آینده)", "خانوارها تورم را در پمپ بنزین احساس می‌کنند، پیش از آنکه اوراق آن را قیمت بگذارند؛ انتظاراتِ بالاروندهٔ خانوارها مقدم بر بازقیمت‌گذاریِ خودِ بازار بوده است."],
  },
  "m2-us": {
    en: ["US money supply growth", "More money chasing the same goods is the decades-scale debasement argument — weak at quarterly range, and read here as one seat among ten."],
    fa: ["حجم پول آمریکا (M2)", "پولِ بیشتر که دنبال همان کالاها می‌گردد، استدلالِ آب‌شدنِ پول در مقیاس دهه‌هاست؛ در بازهٔ فصلی ضعیف است و اینجا یکی از ده صندلی خوانده می‌شود."],
  },
  "us-deficit-12m": {
    en: ["The US federal deficit (12-month)", "Big sustained deficits must be financed somehow — the fiscal leg of the slow argument that erodes currency faith, which gold ends up pricing."],
    fa: ["کسری بودجهٔ فدرال آمریکا (۱۲ماهه)", "کسری‌های بزرگ و پایدار باید جایی تأمین مالی شوند؛ پایهٔ مالیِ استدلالِ کُندی که ایمان به ارز را فرسوده می‌کند و طلا در نهایت آن را قیمت می‌گذارد."],
  },
  "michigan-5y-expectations": {
    en: ["Households' long-run inflation expectations", "The 5–10 year horizon is the regime label households carry — when it shifts, the psychology underneath gold's structural case has moved."],
    fa: ["انتظار تورم خانوارها (۵ تا ۱۰ سال)", "افق ۵ تا ۱۰ ساله، برچسبِ رژیمی است که خانوارها با خود حمل می‌کنند؛ وقتی جابه‌جا شود، روان‌شناسیِ زیرِ بنای پروندهٔ ساختاری طلا حرکت کرده است."],
  },
  "cftc-gold-positioning": {
    en: ["Trader positioning in gold", "Speculators' positioning is fuel, not a driver — at crowded extremes it marks fragile crowds; in the middle it says almost nothing."],
    fa: ["پوزیشن معامله‌گران طلا", "پوزیشنِ سفته‌بازان سوخت است، نه محرک؛ در نقاط ازدحام‌شده، جمعیت‌های شکننده را نشان می‌دهد و در میانه تقریباً چیزی نمی‌گوید."],
  },
  "cftc-gold-gross-long": {
    en: ["Gross long positioning", "Heavy one-sided longs are the fragile configuration — the crowd the net number can hide when both sides are packed."],
    fa: ["پوزیشن خریدِ معامله‌گران طلا", "لانگ‌های یک‌طرفهٔ سنگین، پیکربندیِ شکننده‌اند؛ همان جمعیتی که عددِ خالص می‌تواند وقتی هر دو سمت پر شده باشند پنهانش کند."],
  },
};

/** The lane labels + one-line intros (EN + fa). */
export const LANE_CONTENT: Record<LaneId, { label: [string, string]; intro: [string, string] }> = {
  "borrowing-costs": {
    label: ["Interest rates & borrowing costs", "نرخ بهره و هزینهٔ استقراض"],
    intro: ["What money earns when it is not gold — the rival asset's pull.", "آنچه پول بدونِ طلا به دست می‌آورد — کشش داراییِ رقیب."],
  },
  dollar: {
    label: ["The US dollar", "دلار آمریکا"],
    intro: ["The currency gold is priced in — its strength is the headwind.", "ارزی که طلا به آن قیمت می‌خورد — قدرتش، بادِ رو به عقب است."],
  },
  stress: {
    label: ["Market stress & uncertainty", "تنش و عدم قطعیت بازار"],
    intro: ["Fear and doubt — the safe-haven bid gold answers to.", "ترس و تردید — همان تقاضای پناهگاهی که طلا به آن پاسخ می‌دهد."],
  },
  inflation: {
    label: ["Inflation & inflation expectations", "تورم و انتظارات تورمی"],
    intro: ["The debasement worry — why gold is held as a hedge at all.", "نگرانیِ آب‌شدنِ پول — دلیلِ اصلی که طلا به‌عنوان سپر نگه داشته می‌شود."],
  },
  flows: {
    label: ["Trader positioning & flows", "پوزیشن معامله‌گران و جریان‌ها"],
    intro: ["The crowd's own footprint — fuel, never the engine.", "ردپای خودِ جمعیت — سوخت، هرگز موتور."],
  },
};

/** The episodes (the nine-record launch list, bilingual). */
export const EPISODES: ReadonlyArray<{
  period: string;
  title: [string, string];
  annotation: [string, string];
  family: LaneId;
  price?: [string, string];
}> = [
  {
    period: "1971–73",
    title: ["Bretton Woods ends", "پایان برتون‌ودز"],
    annotation: ["The dollar left gold at $35; two devaluations followed.", "دلار از طلا در ۳۵ دلار جدا شد؛ دو کاهش ارزش در پی آمد."],
    family: "dollar",
    price: ["$35", "۳۵ دلار"],
  },
  {
    period: "1980",
    title: ["The Volcker peak", "اوج ولکر"],
    annotation: ["Gold touched about $850 in January 1980; disinflation then drove a two-decade bear.", "طلا ژانویهٔ ۱۹۸۰ حدود ۸۵۰ دلار را لمس کرد؛ تورم‌زدایی سپس دو دهه بازار نزولی ساخت."],
    family: "borrowing-costs",
    price: ["~$850", "۸۵۰ دلار"],
  },
  {
    period: "1999",
    title: ["Brown's bottom", "کف براون"],
    annotation: ["The U.K. announced sales of half its gold; the price bottomed near $252.", "بریتانیا فروش نیمی از طلایش را اعلام کرد؛ قیمت نزدیک ۲۵۲ دلار کف زد."],
    family: "flows",
    price: ["~$252", "۲۵۲ دلار"],
  },
  {
    period: "2008",
    title: ["The financial crisis", "بحران مالی"],
    annotation: ["Lehman's fall took gold down in the dash-for-cash; the response then lifted it.", "سقوط لیمان طلا را در یورش به نقد پایین برد؛ واکنش بعدی آن را بالا برد."],
    family: "stress",
    price: ["~$1,000", "۱۰۰۰ دلار"],
  },
  {
    period: "2011",
    title: ["The QE-era peak", "سقف دوران تسهیل‌کمی"],
    annotation: ["Gold peaked near $1,920 as QE2 and the euro debt crisis peaked together.", "طلا نزدیک ۱۹۲۰ دلار قله زد؛ همزمان با اوج QE2 و بحران بدهی یورو."],
    family: "inflation",
    price: ["~$1,920", "۱۹۲۰ دلار"],
  },
  {
    period: "2013",
    title: ["The taper tantrum", "خشم کاهش تدریجی"],
    annotation: ["The mere announcement of slower QE took gold down about 28% in 2013.", "صرفِ اعلام کندشدن QE طلا را حدود ۲۸٪ در ۲۰۱۳ پایین برد."],
    family: "borrowing-costs",
  },
  {
    period: "2020",
    title: ["COVID", "کرونا"],
    annotation: ["The pandemic panic and the money-printing response lifted gold to its then-record.", "وحشیِ پاندمی و پاسخِ چاپ پول، طلا را تا رکورد آن روزها بالا برد."],
    family: "stress",
    price: ["~$2,070", "۲۰۷۰ دلار"],
  },
  {
    period: "2022",
    title: ["The inflation surge", "جهش تورم"],
    annotation: ["The fastest hiking cycle in four decades pressured gold all year.", "سریع‌ترین چرخهٔ افزایش نرخ در چهار دهه، تمام سال بر طلا فشار آورد."],
    family: "inflation",
  },
  {
    period: "2024–26",
    title: ["The melt-up and correction", "صعود و اصلاح"],
    annotation: ["Central-bank buying and debasement worry drove the run past $5,000 — then the 2026 real-yield squeeze took a quarter of it back.", "خرید بانک‌های مرکزی و نگرانیِ آب‌شدنِ پول، صعود از ۵٬۰۰۰ دلار را راند — سپس فشار بازده واقعی ۲۰۲۶ یک‌ربعش را پس گرفت."],
    family: "borrowing-costs",
    price: ["$5,400 →", "۵٬۴۰۰ دلار →"],
  },
];

/** Seat name lookup: the compact voter names (EN + fa). */
export const VOTER_NAMES: Record<string, [string, string]> = {
  "real-yield-10y": ["Real yields", "بازده واقعی اوراق قرضه"],
  us10y: ["US 10-year yield", "بازده ۱۰ساله آمریکا"],
  us30y: ["US 30-year yield", "بازده ۳۰ساله آمریکا"],
  "fed-target": ["Fed funds target", "نرخ سیاستی فدرال رزرو"],
  "fed-expectations": ["Fed expectations", "انتظارات بازار از فدرال رزرو"],
  "ecb-dfr": ["ECB deposit rate", "نرخ سپردهٔ بانک مرکزی اروپا"],
  "real-yield-5y": ["Real yield (5y)", "بازده واقعی (۵ساله)"],
  "dollar-basket": ["Dollar basket", "شاخص دلار"],
  usdjpy: ["USD/JPY", "دلار در برابر ین ژاپن"],
  "us-japan-10y-gap": ["US−Japan 10y gap", "شکاف ۱۰ساله آمریکا و ژاپن"],
  "usd-reserve-share": ["USD reserve share", "سهم دلار از ذخایر ارزی"],
  "nyfed-custody": ["Foreign custody at the NY Fed", "دارایی‌های رسمی خارجی نزد فدرال رزرو"],
  "dollar-broad": ["Dollar (broad)", "دلار (گسترده)"],
  "dollar-eme": ["Dollar (EME)", "دلار (کشورهای نوظهور)"],
  "stress-stlfsi": ["STLFSI", "تنش در بازارهای پول آمریکا"],
  nfci: ["NFCI", "شرایط مالی آمریکا"],
  vix: ["VIX", "شاخص ترس بازار"],
  "gold-silver": ["Gold/silver ratio", "نسبت طلا به نقره"],
  "term-premium-10y": ["10-year term premium", "صرف سررسید ۱۰ سالهٔ آمریکا"],
  ebp: ["Excess bond premium", "صرف اضافی اوراق قرضه"],
  "michigan-sentiment": ["US consumer mood", "حال و هوای مصرف‌کنندهٔ آمریکا"],
  "gpr-daily": ["Geopolitical risk (7-day)", "ریسک ژئوپلیتیک (۷روزه)"],
  "epu-us": ["US policy uncertainty", "عدم قطعیت سیاست اقتصادی آمریکا"],
  "sp500-breadth-ratio": ["S&P 500 breadth", "گستردگی بازار سهام آمریکا"],
  "bank-stress": ["Bank stress", "تنش بانکی"],
  "us-cpi-yoy": ["US CPI", "تورم آمریکا (CPI)"],
  "us-pce-core-yoy": ["US core PCE", "تورم هسته‌ای آمریکا (PCE)"],
  "euro-hicp": ["Euro HICP", "تورم منطقهٔ یورو (HICP)"],
  "breakeven-5y5y": ["5y5y breakeven", "انتظارات تورمی ۵ تا ۱۰ ساله"],
  "breakeven-tilt": ["Inflation tilt", "شیب انتظارات تورمی"],
  t5yie: ["5-year breakeven", "انتظار تورم ۵ سالهٔ آمریکا"],
  "michigan-1y-expectations": ["1-year inflation expectations", "تورم مورد انتظار سال آینده"],
  "m2-us": ["US money supply", "حجم پول آمریکا (M2)"],
  "us-deficit-12m": ["US 12-month deficit", "کسری بودجهٔ فدرال آمریکا (۱۲ماهه)"],
  "michigan-5y-expectations": ["5–10y inflation expectations", "انتظار تورم ۵ تا ۱۰ ساله"],
  "cftc-gold-positioning": ["Gold positioning (COT)", "پوزیشن معامله‌گران طلا"],
  "cftc-gold-gross-long": ["Gold long positioning (COT)", "پوزیشن خریدِ معامله‌گران طلا"],
};
