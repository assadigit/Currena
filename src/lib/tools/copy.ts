/**
 * The tools family's bilingual copy (EN + fa), Currena's own voice —
 * the compound tool's content.ts discipline restated for this family:
 * short calm sentences, plain words, one stronger sentence at the
 * result; Farsi mirrors the English meaning in the site's formal-calm
 * register, with Persian digits and Jalali dates applied at render
 * time (never baked into these strings).
 */

import type { Locale } from "@/lib/compound/content";

export type { Locale };

/* =================================================================== *
 * The shape                                                            *
 * =================================================================== */

export interface ToolsCopy {
  dir: "ltr" | "rtl";
  nav: {
    site: string;
    tagline: string;
    tools: string;
    langToggle: string;
    backToTools: string;
    home: string;
  };
  footer: { rights: string; disclaimer: string };
  index: {
    title: string;
    promise: string;
    eyebrow: string;
    open: string;
    externalKicker: string;
    externalName: string;
    externalLine: string;
    externalCta: string;
  };
  common: {
    rate: string;
    amount: string;
    total: string;
    date: string;
    print: string;
    add: string;
    remove: string;
    refresh: string;
    refreshing: string;
    source: string;
    toman: string;
    unitToman: string;
    perUnit: string;
    name: string;
    note: string;
    from: string;
    to: string;
    swap: string;
    or: string;
    about: string;
    high: string;
    low: string;
    lastUpdate: string;
    autoRefresh: string;
    liveWaiting: string;
    liveFailed: string;
    seeAll: string;
    reset: string;
    sample: string;
    perPerson: string;
    people: string;
    currencyLabel: string;
    tomanPerUnit: string;
    formula: string;
    basis: string;
  };
  currencies: Record<string, { en: string; fa: string }>;
  goldRows: Record<string, { en: string; fa: string }>;
  converter: {
    promise: string;
    amountLabel: string;
    resultLabel: string;
    rateLine: string;
    inverseLine: string;
    quickAmounts: string;
    basisNote: string;
    needBoth: string;
  };
  board: {
    promise: string;
    fxTitle: string;
    goldTitle: string;
    fxNote: string;
    goldNote: string;
    ounceUsd: string;
    waiting: string;
  };
  excalc: {
    promise: string;
    modeSell: string;
    modeSellLine: string;
    modeBuy: string;
    modeBuyLine: string;
    rateLabel: string;
    rateHint: string;
    marginLabel: string;
    marginHint: string;
    quoteLabel: string;
    totalLabel: string;
    profitLabel: string;
    strong: string;
    basisNote: string;
  };
  receipt: {
    promise: string;
    shopLabel: string;
    shopPh: string;
    noLabel: string;
    dateLabel: string;
    sideSell: string;
    sideBuy: string;
    sideLabel: string;
    customerLabel: string;
    customerPh: string;
    feeLabel: string;
    rateLabel: string;
    noteLabel: string;
    notePh: string;
    preview: string;
    printedBy: string;
    payable: string;
    gross: string;
    feeWord: string;
    footerLine: string;
    needShop: string;
    disclaimerLine: string;
  };
  dang: {
    promise: string;
    modeEqual: string;
    modeWeighted: string;
    totalLabel: string;
    weightLabel: string;
    weightHint: string;
    addPerson: string;
    personDefault: string;
    shareOf: string;
    headline: string;
    strong: string;
    rounding: string;
    formulaEqual: string;
    formulaWeighted: string;
    sumLine: string;
  };
  settle: {
    promise: string;
    payerLabel: string;
    expenseLabel: string;
    addExpense: string;
    personDefault: string;
    balancesTitle: string;
    transfersTitle: string;
    owes: string;
    isOwed: string;
    square: string;
    transferLine: string;
    none: string;
    totalPaid: string;
    perHead: string;
  };
  batch: {
    promise: string;
    targetLabel: string;
    rowLabel: string;
    addRow: string;
    lineLabel: string;
    totalLabel: string;
    countLine: string;
    empty: string;
  };
  goldHub: {
    promise: string;
    navValue: string;
    navUnits: string;
    navKarat: string;
    navBoard: string;
    valueTitle: string;
    valuePromise: string;
    weightLabel: string;
    karatLabel: string;
    metalValue: string;
    buyFold: string;
    wageLabel: string;
    profitLabel: string;
    vatLabel: string;
    invoiceTotal: string;
    invoiceMetal: string;
    invoiceWage: string;
    invoiceProfit: string;
    invoiceVat: string;
    invoiceNote: string;
    unitsTitle: string;
    unitsPromise: string;
    mesghalLabel: string;
    gramLabel: string;
    basis17: string;
    basis18: string;
    g17Line: string;
    g18Line: string;
    value18Line: string;
    mesghalLive: string;
    karatTitle: string;
    karatPromise: string;
    fromKarat: string;
    toKarat: string;
    equivLabel: string;
    valueLine: string;
    boardTitle: string;
    boardNote: string;
    deskLink: string;
    deskLine: string;
    basisNote: string;
  };
}

/* =================================================================== *
 * English                                                              *
 * =================================================================== */

const EN: ToolsCopy = {
  dir: "ltr",
  nav: {
    site: "Currena",
    tagline: "Currency intelligence",
    tools: "Tools",
    langToggle: "فا",
    backToTools: "Tools",
    home: "Home",
  },
  footer: {
    rights: "Currena · tools",
    disclaimer:
      "Rates are the free market's own quotes, read as they come; a descriptive tool, not advice.",
  },
  index: {
    title: "Tools",
    promise: "Small, quiet tools for money questions.",
    eyebrow: "Currena tools",
    open: "Open",
    externalKicker: "From the main site",
    externalName: "Currency Converter",
    externalLine: "Live rates and the Iranian toman converter.",
    externalCta: "Open on currena.ir",
  },
  common: {
    rate: "Rate",
    amount: "Amount",
    total: "Total",
    date: "Date",
    print: "Print",
    add: "Add",
    remove: "Remove",
    refresh: "Refresh",
    refreshing: "Reading…",
    source: "Source",
    toman: "toman",
    unitToman: "Toman",
    perUnit: "per unit",
    name: "Name",
    note: "Note",
    from: "From",
    to: "to",
    swap: "Swap",
    or: "or",
    about: "about",
    high: "High",
    low: "Low",
    lastUpdate: "Last read",
    autoRefresh: "Auto, every minute",
    liveWaiting: "Reading the board…",
    liveFailed: "The board could not be read yet. Nothing is guessed here — try again shortly.",
    seeAll: "See all",
    reset: "Reset",
    sample: "Sample",
    perPerson: "per person",
    people: "people",
    currencyLabel: "Currency",
    tomanPerUnit: "toman per unit",
    formula: "Formula",
    basis: "Basis",
  },
  currencies: {
    IRR: { en: "Iranian toman", fa: "تومان" },
    USD: { en: "US dollar", fa: "دلار آمریکا" },
    EUR: { en: "Euro", fa: "یورو" },
    GBP: { en: "British pound", fa: "پوند انگلیس" },
    AUD: { en: "Australian dollar", fa: "دلار استرالیا" },
    CAD: { en: "Canadian dollar", fa: "دلار کانادا" },
    AED: { en: "UAE dirham", fa: "درهم امارات" },
    CNY: { en: "Chinese yuan", fa: "یوان چین" },
    NZD: { en: "New Zealand dollar", fa: "دلار نیوزیلند" },
    TRY: { en: "Turkish lira", fa: "لیر ترکیه" },
    CHF: { en: "Swiss franc", fa: "فرانک سوئیس" },
    JPY: { en: "Japanese yen", fa: "ین ژاپن" },
    KRW: { en: "South Korean won", fa: "وون کره جنوبی" },
    MYR: { en: "Malaysian ringgit", fa: "رینگیت مالزی" },
    IDR: { en: "Indonesian rupiah", fa: "روپیه اندونزی" },
    PHP: { en: "Philippine peso", fa: "پزو فیلیپین" },
    VND: { en: "Vietnamese dong", fa: "دونگ ویتنام" },
  },
  goldRows: {
    "gold-ounce": { en: "Global ounce (USD)", fa: "اونس جهانی طلا (دلار)" },
    "gold-18k": { en: "Gram, 18k", fa: "گرم طلای ۱۸ عیار" },
    "gold-24k": { en: "Gram, 24k", fa: "گرم طلای ۲۴ عیار" },
    "gold-used": { en: "Used gold (melted)", fa: "طلای آب‌شده" },
    "gold-mesghal": { en: "Mesghal (the quote)", fa: "مظنه (مثقال طلا)" },
    "coin-emami": { en: "Emami coin", fa: "سکهٔ امامی" },
    "coin-bahar": { en: "Bahar Azadi coin", fa: "سکهٔ بهار آزادی" },
    "coin-half": { en: "Half coin", fa: "نیم‌سکه" },
    "coin-quarter": { en: "Quarter coin", fa: "ربع‌سکه" },
    "coin-gram": { en: "One-gram coin", fa: "سکهٔ یک‌گرمی" },
  },
  converter: {
    promise: "Live free-market rates, between any two currencies through the toman.",
    amountLabel: "Amount",
    resultLabel: "You get",
    rateLine: "1 {from} = {rate} {to}",
    inverseLine: "1 {to} = {rate} {from}",
    quickAmounts: "Quick amounts",
    basisNote: "Free-market quotes (tgju), read through currena.ir — refreshed every minute.",
    needBoth: "Pick two currencies to convert between them.",
  },
  board: {
    promise: "The whole board — every currency and every gold row, refreshed every minute.",
    fxTitle: "Currencies",
    goldTitle: "Gold",
    fxNote: "The free-market board in toman per unit — the row's own day range beside it.",
    goldNote: "The bazaar's daily rows in toman; the global ounce in USD.",
    ounceUsd: "USD",
    waiting: "Reading the board…",
  },
  excalc: {
    promise: "The exchange desk's own maths: quote a rate, take a margin, see the profit.",
    modeSell: "Sell to customer",
    modeSellLine: "The desk sells foreign currency; the customer pays toman.",
    modeBuy: "Buy from customer",
    modeBuyLine: "The desk buys foreign currency; the customer receives toman.",
    rateLabel: "Your base rate (toman per unit)",
    rateHint: "Prefilled from the live board — it is yours to change.",
    marginLabel: "Margin",
    marginHint: "How much above (selling) or below (buying) your base rate you quote.",
    quoteLabel: "Customer's rate",
    totalLabel: "Customer pays / receives",
    profitLabel: "Your margin on this deal",
    strong: "The margin is the desk's own earning — state it, never hide it.",
    basisNote: "Arithmetic on the rate you entered; the live board only prefills it.",
  },
  receipt: {
    promise: "Write the deal, print a clean receipt for the customer.",
    shopLabel: "Exchanger",
    shopPh: "e.g. Currena Exchange — main branch",
    noLabel: "Receipt no.",
    dateLabel: "Date",
    sideSell: "Sold to customer",
    sideBuy: "Bought from customer",
    sideLabel: "Type",
    customerLabel: "Customer",
    customerPh: "Optional",
    feeLabel: "Fee (toman)",
    rateLabel: "Rate (toman per unit)",
    noteLabel: "Note",
    notePh: "Optional",
    preview: "Receipt",
    printedBy: "Printed with Currena tools — currena.ir/tools",
    payable: "Payable",
    gross: "Gross",
    feeWord: "Fee",
    footerLine: "This receipt was issued by the exchanger named above.",
    needShop: "Write the exchanger's name for the receipt's head.",
    disclaimerLine: "A plain record of the deal as entered; keep your copy.",
  },
  dang: {
    promise: "دنگ کردن: each person's share of a shared amount, equal or weighted.",
    modeEqual: "Equal split",
    modeWeighted: "Weighted",
    totalLabel: "Total amount",
    weightLabel: "Weight",
    weightHint: "How many shares of the whole this person carries (1 = one share).",
    addPerson: "Add person",
    personDefault: "Person {n}",
    shareOf: "{name}'s share",
    headline: "The whole is divided: {total} among {n} — {share} {each}.",
    strong: "The split covers the whole; nothing is left over and nothing is invented.",
    rounding: "Shares are rounded for reading; the exact split is shown beside each share.",
    formulaEqual: "Each share = the whole ÷ the number of people",
    formulaWeighted: "Each share = the whole × the person's weight ÷ the sum of weights",
    sumLine: "Shares together: {sum} (the whole: {total})",
  },
  settle: {
    promise: "Who paid, who owes — the smallest set of transfers that squares everyone.",
    payerLabel: "Paid by",
    expenseLabel: "Expense",
    addExpense: "Add expense",
    personDefault: "Person {n}",
    balancesTitle: "Where everyone stands",
    transfersTitle: "The settlement",
    owes: "owes",
    isOwed: "is owed",
    square: "square",
    transferLine: "{from} pays {to}",
    none: "Nothing to settle — everyone is square.",
    totalPaid: "Paid altogether",
    perHead: "Per head",
  },
  batch: {
    promise: "A pocket of several currencies, counted together into one.",
    targetLabel: "Count everything in",
    rowLabel: "Holdings",
    addRow: "Add a currency",
    lineLabel: "{code} {amount} → {value}",
    totalLabel: "Together",
    countLine: "{n} line(s)",
    empty: "Add at least one line.",
  },
  goldHub: {
    promise: "All the gold tools on one page: value, مثقال, karat — on live prices.",
    navValue: "Value",
    navUnits: "Mesghal",
    navKarat: "Karat",
    navBoard: "Today's board",
    valueTitle: "What is the gold worth?",
    valuePromise: "Weight and karat, priced on the live board.",
    weightLabel: "Weight (grams)",
    karatLabel: "Karat",
    metalValue: "Metal value",
    buyFold: "Buying from a shop (wage, profit, VAT)",
    wageLabel: "Making charge %",
    profitLabel: "Seller's profit %",
    vatLabel: "VAT %",
    invoiceTotal: "Invoice total",
    invoiceMetal: "Metal",
    invoiceWage: "Making charge",
    invoiceProfit: "Seller's profit",
    invoiceVat: "VAT",
    invoiceNote:
      "The market's own rule: VAT applies to the making charge and the profit, never to the metal.",
    unitsTitle: "Mesghal ↔ grams",
    unitsPromise: "The bazaar's مثقال, carried between its two bases.",
    mesghalLabel: "Mesghal",
    gramLabel: "Grams",
    basis17: "17k (the quote)",
    basis18: "18k basis",
    g17Line: "{m} mesghal = {g} grams on the 17k basis (the quote's own weight).",
    g18Line: "The same gold as 18k: {g} grams — the weight the gram prices speak in.",
    value18Line: "This much 18k-basis gold is worth about {v} toman at the live gram price.",
    mesghalLive: "The live mesghal (the quote): {p} toman.",
    karatTitle: "Karat conversion",
    karatPromise: "The same gold, restated at another karat — weight × this karat ÷ that karat.",
    fromKarat: "From karat",
    toKarat: "To karat",
    equivLabel: "Equivalent weight",
    valueLine: "Worth about {v} toman at the live price of that karat.",
    boardTitle: "Today's gold board",
    boardNote: "The bazaar's own rows, read live; the full board is one link away.",
    deskLink: "currena.ir/gold",
    deskLine: "The whole gold desk — briefing, forces, scenarios — lives on the main gold page.",
    basisNote: "Each karat's price comes from the live board: 24k and 18k from their own rows, every other karat from the 24k row at purity ratio.",
  },
};

/* =================================================================== *
 * Farsi                                                                *
 * =================================================================== */

const FA: ToolsCopy = {
  dir: "rtl",
  nav: {
    site: "کورنا",
    tagline: "هوش ارزی",
    tools: "ابزارها",
    langToggle: "EN",
    backToTools: "ابزارها",
    home: "خانه",
  },
  footer: {
    rights: "کورنا · ابزارها",
    disclaimer:
      "نرخ‌ها نقل‌قول‌های خود بازار آزاد است، همان‌طور که می‌آید؛ این ابزار توصیف است، نه توصیه.",
  },
  index: {
    title: "ابزارها",
    promise: "ابزارهای کوچک و آرام برای پرسش‌های پول.",
    eyebrow: "ابزارهای کورنا",
    open: "باز کن",
    externalKicker: "از سایت اصلی",
    externalName: "مبدل ارز",
    externalLine: "نرخ‌های زنده و مبدل تومان ایران.",
    externalCta: "باز کردن در currena.ir",
  },
  common: {
    rate: "نرخ",
    amount: "مبلغ",
    total: "مجموع",
    date: "تاریخ",
    print: "چاپ",
    add: "افزودن",
    remove: "حذف",
    refresh: "به‌روزرسانی",
    refreshing: "در حال خواندن…",
    source: "منبع",
    toman: "تومان",
    unitToman: "تومان",
    perUnit: "به ازای هر واحد",
    name: "نام",
    note: "یادداشت",
    from: "از",
    to: "به",
    swap: "جابه‌جایی",
    or: "یا",
    about: "حدود",
    high: "بیشترین",
    low: "کمترین",
    lastUpdate: "آخرین خوانش",
    autoRefresh: "خودکار، هر دقیقه",
    liveWaiting: "در حال خواندن تابلو…",
    liveFailed: "تابلو هنوز خوانده نشد. اینجا چیزی حدس زده نمی‌شود — کمی بعد دوباره امتحان کنید.",
    seeAll: "دیدن همه",
    reset: "از نو",
    sample: "نمونه",
    perPerson: "به ازای هر نفر",
    people: "نفر",
    currencyLabel: "ارز",
    tomanPerUnit: "تومان به ازای هر واحد",
    formula: "فرمول",
    basis: "مبنا",
  },
  currencies: {
    IRR: { en: "Iranian toman", fa: "تومان" },
    USD: { en: "US dollar", fa: "دلار آمریکا" },
    EUR: { en: "Euro", fa: "یورو" },
    GBP: { en: "British pound", fa: "پوند انگلیس" },
    AUD: { en: "Australian dollar", fa: "دلار استرالیا" },
    CAD: { en: "Canadian dollar", fa: "دلار کانادا" },
    AED: { en: "UAE dirham", fa: "درهم امارات" },
    CNY: { en: "Chinese yuan", fa: "یوان چین" },
    NZD: { en: "New Zealand dollar", fa: "دلار نیوزیلند" },
    TRY: { en: "Turkish lira", fa: "لیر ترکیه" },
    CHF: { en: "Swiss franc", fa: "فرانک سوئیس" },
    JPY: { en: "Japanese yen", fa: "ین ژاپن" },
    KRW: { en: "South Korean won", fa: "وون کره جنوبی" },
    MYR: { en: "Malaysian ringgit", fa: "رینگیت مالزی" },
    IDR: { en: "Indonesian rupiah", fa: "روپیه اندونزی" },
    PHP: { en: "Philippine peso", fa: "پزو فیلیپین" },
    VND: { en: "Vietnamese dong", fa: "دونگ ویتنام" },
  },
  goldRows: {
    "gold-ounce": { en: "Global ounce (USD)", fa: "اونس جهانی طلا (دلار)" },
    "gold-18k": { en: "Gram, 18k", fa: "گرم طلای ۱۸ عیار" },
    "gold-24k": { en: "Gram, 24k", fa: "گرم طلای ۲۴ عیار" },
    "gold-used": { en: "Used gold (melted)", fa: "طلای آب‌شده" },
    "gold-mesghal": { en: "Mesghal (the quote)", fa: "مظنه (مثقال طلا)" },
    "coin-emami": { en: "Emami coin", fa: "سکهٔ امامی" },
    "coin-bahar": { en: "Bahar Azadi coin", fa: "سکهٔ بهار آزادی" },
    "coin-half": { en: "Half coin", fa: "نیم‌سکه" },
    "coin-quarter": { en: "Quarter coin", fa: "ربع‌سکه" },
    "coin-gram": { en: "One-gram coin", fa: "سکهٔ یک‌گرمی" },
  },
  converter: {
    promise: "نرخ‌های زندهٔ بازار آزاد، میان هر دو ارز از مسیر تومان.",
    amountLabel: "مبلغ",
    resultLabel: "می‌شود",
    rateLine: "۱ {from} = {rate} {to}",
    inverseLine: "۱ {to} = {rate} {from}",
    quickAmounts: "مبلغ‌های پرکاربرد",
    basisNote: "نرخ‌های بازار آزاد (tgju)، از مسیر currena.ir — هر دقیقه تازه می‌شود.",
    needBoth: "دو ارز را انتخاب کنید تا تبدیل انجام شود.",
  },
  board: {
    promise: "کل تابلو — همهٔ ارزها و همهٔ ردیف‌های طلا، هر دقیقه تازه.",
    fxTitle: "ارزها",
    goldTitle: "طلا",
    fxNote: "تابلوی بازار آزاد به تومان به ازای هر واحد — با بازهٔ روز خودِ ردیف.",
    goldNote: "ردیف‌های روزانهٔ بازار به تومان؛ اونس جهانی به دلار.",
    ounceUsd: "دلار",
    waiting: "در حال خواندن تابلو…",
  },
  excalc: {
    promise: "حساب صرافی: نرخ بده، حاشیه بگیر، سود را ببین.",
    modeSell: "فروش به مشتری",
    modeSellLine: "صرافی ارز می‌فروشد؛ مشتری تومان می‌دهد.",
    modeBuy: "خرید از مشتری",
    modeBuyLine: "صرافی ارز می‌خرد؛ مشتری تومان می‌گیرد.",
    rateLabel: "نرخ پایهٔ شما (تومان به ازای هر واحد)",
    rateHint: "از تابلوی زنده پر می‌شود — و دست شماست که عوضش کنید.",
    marginLabel: "حاشیه",
    marginHint: "چند درصد بالاتر از نرخ پایه (فروش) یا پایین‌تر از آن (خرید) نقل می‌کنید.",
    quoteLabel: "نرخ مشتری",
    totalLabel: "مشتری می‌دهد / می‌گیرد",
    profitLabel: "حاشیهٔ شما در این معامله",
    strong: "حاشیه، درآمد خود صرافی است — می‌گویید، پنهانش نمی‌کنید.",
    basisNote: "محاسبه با نرخِ واردشدهٔ شماست؛ تابلوی زنده فقط پیش‌فرض را پر کرده.",
  },
  receipt: {
    promise: "معامله را بنویس، برای مشتری یک رسید تمیز چاپ کن.",
    shopLabel: "صرافی",
    shopPh: "مثلاً صرافی کورنا — شعبهٔ مرکزی",
    noLabel: "شمارهٔ رسید",
    dateLabel: "تاریخ",
    sideSell: "فروش به مشتری",
    sideBuy: "خرید از مشتری",
    sideLabel: "نوع معامله",
    customerLabel: "مشتری",
    customerPh: "اختیاری",
    feeLabel: "کارمزد (تومان)",
    rateLabel: "نرخ (تومان به ازای هر واحد)",
    noteLabel: "یادداشت",
    notePh: "اختیاری",
    preview: "رسید",
    printedBy: "چاپ‌شده با ابزارهای کورنا — currena.ir/tools",
    payable: "قابل پرداخت",
    gross: "خالص",
    feeWord: "کارمزد",
    footerLine: "این رسید توسط صرافی نام‌بردهٔ بالا صادر شده است.",
    needShop: "نام صرافی را برای سربرگ رسید بنویسید.",
    disclaimerLine: "ثبتِ سادهٔ معاملهٔ واردشده؛ نسخهٔ خودتان را نگه دارید.",
  },
  dang: {
    promise: "دنگ کردن: سهم هر نفر از یک مبلغ مشترک، مساوی یا به نسبت.",
    modeEqual: "تقسیم مساوی",
    modeWeighted: "به نسبت",
    totalLabel: "کل مبلغ",
    weightLabel: "وزن",
    weightHint: "این نفر چند سهم از کل را با خود دارد (۱ = یک سهم).",
    addPerson: "افزودن نفر",
    personDefault: "نفر {n}",
    shareOf: "سهم {name}",
    headline: "کل تقسیم می‌شود: {total} میان {n} نفر — {share} {each}.",
    strong: "تقسیم، همهٔ مبلغ را می‌پوشاند؛ نه چیزی می‌ماند، نه چیزی از خود ساخته می‌شود.",
    rounding: "سهم‌ها برای خواندن گرد شده‌اند؛ رقم دقیق کنار هر سهم نوشته شده است.",
    formulaEqual: "سهم هر نفر = کل ÷ تعداد نفرها",
    formulaWeighted: "سهم هر نفر = کل × وزنِ او ÷ مجموع وزن‌ها",
    sumLine: "جمع سهم‌ها: {sum} (کل: {total})",
  },
  settle: {
    promise: "چه کسی پرداخت، چه کسی بدهکار است — کمترین انتقال‌ها برای صفر شدن حساب‌ها.",
    payerLabel: "پرداخت‌کننده",
    expenseLabel: "هزینه",
    addExpense: "افزودن هزینه",
    personDefault: "نفر {n}",
    balancesTitle: "حساب هر نفر",
    transfersTitle: "تسویه",
    owes: "بدهکار است",
    isOwed: "طلبکار است",
    square: "تسویه",
    transferLine: "{from} به {to} می‌دهد",
    none: "چیزی برای تسویه نیست — حساب همه صفر است.",
    totalPaid: "مجموع پرداخت‌ها",
    perHead: "سهم هر نفر",
  },
  batch: {
    promise: "چند ارز در جیب، یک‌جا شمرده می‌شود.",
    targetLabel: "همه را بشمار به",
    rowLabel: "دارایی‌ها",
    addRow: "افزودن ارز",
    lineLabel: "{code} {amount} ← {value}",
    totalLabel: "مجموع",
    countLine: "{n} ردیف",
    empty: "حداقل یک ردیف اضافه کنید.",
  },
  goldHub: {
    promise: "همهٔ ابزارهای طلا در یک صفحه: ارزش، مثقال، عیار — با نرخ لحظه‌ای.",
    navValue: "ارزش",
    navUnits: "مثقال",
    navKarat: "عیار",
    navBoard: "تابلوی امروز",
    valueTitle: "این طلا چند می‌ارزد؟",
    valuePromise: "وزن و عیار، با نرخ تابلوی زنده.",
    weightLabel: "وزن (گرم)",
    karatLabel: "عیار",
    metalValue: "ارزش فلز",
    buyFold: "خرید از طلافروشی (اجرت، سود، مالیات)",
    wageLabel: "اجرت ساخت ٪",
    profitLabel: "سود فروشنده ٪",
    vatLabel: "مالیات ٪",
    invoiceTotal: "جمع فاکتور",
    invoiceMetal: "فلز",
    invoiceWage: "اجرت",
    invoiceProfit: "سود فروشنده",
    invoiceVat: "مالیات",
    invoiceNote: "قاعدهٔ خود بازار: مالیات به اجرت و سود می‌خورد، نه به فلز.",
    unitsTitle: "مثقال ↔ گرم",
    unitsPromise: "مثقالِ بازار، میان دو مبنای خودش.",
    mesghalLabel: "مثقال",
    gramLabel: "گرم",
    basis17: "۱۷ عیار (مظنه)",
    basis18: "مبنای ۱۸ عیار",
    g17Line: "{m} مثقال = {g} گرم در مبنای ۱۷ عیار (وزنِ خودِ مظنه).",
    g18Line: "همین طلا در مبنای ۱۸ عیار: {g} گرم — وزنی که نرخِ گرم با آن حرف می‌زند.",
    value18Line: "این مقدار طلا در مبنای ۱۸ عیار، با نرخ لحظه‌ای گرم، حدود {v} تومان می‌ارزد.",
    mesghalLive: "مظنهٔ زنده (نرخ مثقال): {p} تومان.",
    karatTitle: "تبدیل عیار",
    karatPromise: "همان طلا، با عیاری دیگر — وزن × عیارِ مبدا ÷ عیارِ مقصد.",
    fromKarat: "از عیار",
    toKarat: "به عیار",
    equivLabel: "وزن معادل",
    valueLine: "با نرخ لحظه‌ایِ همین عیار، حدود {v} تومان می‌ارزد.",
    boardTitle: "تابلوی طلای امروز",
    boardNote: "ردیف‌های خودِ بازار، زنده؛ تابلوی کامل یک پیوند دورتر است.",
    deskLink: "currena.ir/gold",
    deskLine: "کل میز طلا — گزارش، نیروها، سناریوها — در صفحهٔ طلای سایت است.",
    basisNote: "نرخ هر عیار از تابلوی زنده می‌آید: ۲۴ و ۱۸ عیار از ردیف خودشان، بقیه از ردیف ۲۴ عیار به نسبت خلوص.",
  },
};

export const TOOLS_COPY: Record<Locale, ToolsCopy> = { en: EN, fa: FA };

/** A currency's display name in the reader's locale (falls back to code). */
export function currencyName(
  copy: ToolsCopy,
  locale: Locale,
  code: string,
): string {
  const name = copy.currencies[code];
  if (name) return locale === "fa" ? name.fa : name.en;
  return code;
}

/** A gold row's display label in the reader's locale. */
export function goldRowLabel(copy: ToolsCopy, locale: Locale, id: string): string {
  const row = copy.goldRows[id];
  if (row) return locale === "fa" ? row.fa : row.en;
  return id;
}
