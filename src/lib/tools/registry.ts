/**
 * The tools registry — ONE list of every tool on currena.ir/tools.
 *
 * This is the consolidation seam the owner asked for: the index page,
 * every tool page's shell (breadcrumb, title) and the gold hub's own
 * nav all read from this single list. Adding a tool later = one entry
 * here + one page at its slug; the index, the routing and the chrome
 * follow by themselves.
 *
 * Order in a group = order on the index (the owner's list, kept).
 */

export type ToolGroup = "wealth" | "currency" | "gold" | "together";

export interface ToolEntry {
  /** The public slug under /tools/ (path-based, lower case, hyphens —
   *  spec §3's naming rule). */
  slug: string;
  group: ToolGroup;
  en: { title: string; line: string };
  fa: { title: string; line: string };
}

export const TOOLS: ToolEntry[] = [
  {
    slug: "compound-wealth",
    group: "wealth",
    en: {
      title: "Compound Wealth",
      line: "See what small, steady investing becomes.",
    },
    fa: {
      title: "ثروت مرکب",
      line: "ببینید سرمایه‌گذاریِ کوچک و پیوسته به چه چیزی تبدیل می‌شود.",
    },
  },
  {
    slug: "currency-converter",
    group: "currency",
    en: {
      title: "Currency Converter",
      line: "Live free-market rates, between any two currencies through the toman.",
    },
    fa: {
      title: "مبدل ارز",
      line: "نرخ‌های زندهٔ بازار آزاد، میان هر دو ارز از مسیر تومان.",
    },
  },
  {
    slug: "live-rates",
    group: "currency",
    en: {
      title: "Live Rates Board",
      line: "The whole board — every currency and every gold row, refreshed every minute.",
    },
    fa: {
      title: "تابلوی نرخ‌های لحظه‌ای",
      line: "کل تابلو — همهٔ ارزها و همهٔ ردیف‌های طلا، هر دقیقه تازه.",
    },
  },
  {
    slug: "currency-calculator",
    group: "currency",
    en: {
      title: "Currency Calculator",
      line: "The exchange desk's own maths: quote a rate, take a margin, see the profit.",
    },
    fa: {
      title: "ماشین‌حساب ارزی",
      line: "حساب صرافی: نرخ بده، حاشیه بگیر، سود را ببین.",
    },
  },
  {
    slug: "exchange-receipt",
    group: "currency",
    en: {
      title: "Exchange Receipt",
      line: "Write the deal, print a clean receipt for the customer.",
    },
    fa: {
      title: "رسیدساز ارزی",
      line: "معامله را بنویس، برای مشتری یک رسید تمیز چاپ کن.",
    },
  },
  {
    slug: "batch-converter",
    group: "currency",
    en: {
      title: "Batch Currency Conversion",
      line: "A pocket of several currencies, counted together into one.",
    },
    fa: {
      title: "تبدیل گروهی ارزها",
      line: "چند ارز در جیب، یک‌جا شمرده می‌شود.",
    },
  },
  {
    slug: "gold-calculators",
    group: "gold",
    en: {
      title: "Gold Calculators",
      line: "All the gold tools on one page: value, مثقال, karat — on live prices.",
    },
    fa: {
      title: "محاسبه‌گرهای طلا",
      line: "همهٔ ابزارهای طلا در یک صفحه: ارزش، مثقال، عیار — با نرخ لحظه‌ای.",
    },
  },
  {
    slug: "dang",
    group: "together",
    en: {
      title: "Dang — the Fair Split",
      line: "دنگ کردن: each person's share of a shared amount, equal or weighted.",
    },
    fa: {
      title: "محاسبه دنگ",
      line: "دنگ کردن: سهم هر نفر از یک مبلغ مشترک، مساوی یا به نسبت.",
    },
  },
  {
    slug: "group-settlement",
    group: "together",
    en: {
      title: "Group Settlement",
      line: "Who paid, who owes — the smallest set of transfers that squares everyone.",
    },
    fa: {
      title: "تسویه گروهی",
      line: "چه کسی پرداخت، چه کسی بدهکار است — کمترین انتقال‌ها برای صفر شدن حساب‌ها.",
    },
  },
];

/** The groups, in index order, with their bilingual kickers. */
export const TOOL_GROUPS: Array<{
  id: ToolGroup;
  en: string;
  fa: string;
}> = [
  { id: "wealth", en: "Wealth", fa: "ثروت و سرمایه" },
  { id: "currency", en: "Currency", fa: "ارز" },
  { id: "gold", en: "Gold", fa: "طلا" },
  { id: "together", en: "Shared money", fa: "پول مشترک" },
];

export function toolsOfGroup(group: ToolGroup): ToolEntry[] {
  return TOOLS.filter((t) => t.group === group);
}

export function findTool(slug: string): ToolEntry | null {
  return TOOLS.find((t) => t.slug === slug) ?? null;
}
