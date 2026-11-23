/**
 * The relationship explorer's record module — ported verbatim from the
 * upstream Currena monorepo (apps/web/src/features/gold/gold-relationships.ts,
 * commit e45397b, GUX-S6 M1 / docs/gold-redesign/10 §3): the 24 included
 * relationship records of the indicator-relationship map, byte-faithful
 * (the one-liners are the records' own EN/FA text).
 *
 * The evidence-class taxonomy (10 §2): M mechanism · C observed
 * correlation · X conditional · K causal-with-evidence. `xFlag` carries
 * the regime/break flag SEPARATELY from the primary class; `blocked`
 * marks the legend-only edges (a blocked edge never renders as a
 * charted edge — a drawn edge would imply charted evidence).
 *
 * Locale-neutral by construction: the one-liners ride per-locale fields
 * (en/fa authored with the records themselves).
 */

/** The evidence classes (10 §2's taxonomy). */
export type RelationshipClass = 'M' | 'C' | 'X' | 'K';

/** One relationship record (10 §3, transcribed). */
export interface GoldRelationshipRecord {
  /** The R-id (10 §3's own; R-17/R-18 are retired-reserved, never used). */
  id: string;
  /** The A-side concept (an indicator id, a lane id, or a named concept). */
  from: string;
  /** The B-side concept. */
  to: string;
  /** The primary evidence class. */
  class: RelationshipClass;
  /** The X regime/break flag (10 §2: X may flag an M or C record). */
  xFlag: boolean;
  /** True when the record's charting is blocked (data/licence) — the
   * legend-only row, never a canvas edge (12 §5.2). */
  blocked: boolean;
  /** The EN one-liner — the edge label's FULL text (10 §5's copy rule). */
  en: string;
  /** The FA one-liner (10 §3's own authored copy). */
  fa: string;
}

/** The 24 included records in 10 §3's own order. */
export const GOLD_RELATIONSHIPS: readonly GoldRelationshipRecord[] = [
  {
    id: 'R-01',
    from: 'real-yield-10y',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: 'Gold pays no yield, so high real returns on bonds are its classic rival — a mechanism, not a law: since 2022 the pattern weakened visibly as the marginal buyer changed.',
    fa: 'طلا بهره نمی‌پردازد؛ بازده واقعی بالای اوراق، رقیب کلاسیک آن است. این یک سازوکار است نه قانون: از ۲۰۲۲ این الگو به‌وضوح ضعیف شده چون خریدارِ مرزی عوض شده است.',
  },
  {
    id: 'R-02',
    from: 'dollar-basket',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: 'Gold is priced in dollars, so dollar strength usually weighs on the ounce — except in the two documented break patterns: stress bids and reserve-diversification bids.',
    fa: 'طلا به دلار قیمت می‌خورد؛ قدرت دلار معمولاً بر اونس فشار می‌آورد، جز در دو الگوی مستندشدهٔ شکست: خریدِ هم‌زمان در تنش و خریدِ تنوع‌بخشی ذخایر.',
  },
  {
    id: 'R-03',
    from: 'us10y',
    to: 'gold',
    class: 'M',
    xFlag: false,
    blocked: false,
    en: 'A yield rise is not one story but three: which piece moved — real, expected inflation, or the premium — decides what it usually means for gold.',
    fa: 'رشد بازده یک روایت ندارد، سه روایت دارد: کدام قطعه حرکت کرده، واقعی، تورمِ مورد انتظار یا صرف، تعیین می‌کند برای طلا معمولاً چه معنایی دارد.',
  },
  {
    id: 'R-04',
    from: 'term-premium-10y',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'When long yields rise because investors demand fear-and-supply compensation, history has sided with gold — except in the first, liquidity-driven phase of a stress spike.',
    fa: 'وقتی بازدهٔ بلندمدت به‌خاطر مطالبهٔ جبرانِ ترس و عرضه بالا می‌رود، تاریخ همسوی طلا بوده است؛ جز در فاز نخستِ جهش‌های تنشی که نقدینگی حاکم است.',
  },
  {
    id: 'R-05',
    from: 'stress-stlfsi',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: "Frightened money historically runs to gold — but the first hours of a true panic can sell it for cash, and the haven usually arrives after policy responds.",
    fa: 'پولِ ترسانده از نظر تاریخی به طلا پناه می‌برد؛ اما نخستین ساعات یک هراس واقعی می‌تواند آن را برای نقدینگی بفروشد و پناه‌گاه معمولاً پس از پاسخ سیاستی می‌رسد.',
  },
  {
    id: 'R-06',
    from: 'gold-silver',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'When gold pulls far ahead of silver, markets are paying up for pure monetary metal — a fear gauge built from the metals themselves, with silver\u2019s industrial cycle as its known noise.',
    fa: 'وقتی طلا از نقره خیلی جلو می‌زند، بازار برای فلز پولیِ خالص هزینه می‌کند؛ سنجهٔ ترسی از دل خود فلزات، با چرخهٔ صنعتی نقره به‌عنوان نوفهٔ شناخته‌شده‌اش.',
  },
  {
    id: 'R-07',
    from: 'gpr-daily',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'War and policy fear usually bid gold first and ask questions later — much of the event premium historically fades when the feared outcome doesn\u2019t arrive.',
    fa: 'ترس از جنگ و سیاست معمولاً نخست طلا می‌خرد و بعد می‌پرسد؛ بخش بزرگی از صرفِ رخداد به‌طور تاریخی فروکش می‌کند وقتی پیامدِ ترسیده‌شده نمی‌رسد.',
  },
  {
    id: 'R-08',
    from: 'inflation',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: "Gold's inflation hedge is earned over decades, not weeks: what matters quarter-to-quarter is how the Fed responds, which is why real rates are the better short-horizon guide.",
    fa: 'پوشش تورمی طلا در دهه‌ها ساخته می‌شود نه چند هفته؛ در افق فصلی واکنش فدرال رزرو مهم است و به همین دلیل بازده واقعی راهنمای بهتری برای کوتاه‌مدت است.',
  },
  {
    id: 'R-09',
    from: 'wgc-cb-demand',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: "Central-bank buying roughly doubled after 2022's reserve freeze — a documented demand shift that raised gold's floor; how price-insensitive it truly is remains debated, and it is no guarantee in every dip.",
    fa: 'خرید بانک‌های مرکزی پس از انجماد ذخایر ۲۰۲۲ تقریباً دو برابر شد؛ جابه‌جاییِ تقاضای مستندی که کفِ طلا را بالا برد. چقدر به قیمت بی‌اعتناست محل بحث است و در هر افت کوچکی پشتیبانی تضمینی نیست.',
  },
  {
    id: 'R-10',
    from: 'm2-us',
    to: 'gold',
    class: 'C',
    xFlag: true,
    blocked: false,
    en: 'More money and bigger deficits are the decades-scale argument for gold — an association that is honest at long horizons and weak at short ones.',
    fa: 'پولِ بیشتر و کسری بزرگ‌تر، استدلالِ دهه‌مقیاس برای طلاست؛ همبستگی‌ای که در افق بلند صادقانه است و در کوتاه‌مدت ضعیف.',
  },
  {
    id: 'R-11',
    from: 'cftc-gold-positioning',
    to: 'gold',
    class: 'C',
    xFlag: true,
    blocked: false,
    en: "Speculators' books are the market's fuel gauge: at the extremes they mark fragile crowds, in the middle they say almost nothing — fuel, not a driver.",
    fa: 'دفتر سفته‌بازان سوخت‌سنج بازار است: در انتهای دامنه ازدحامِ شکننده را علامت می‌زند و در میانه تقریباً هیچ نمی‌گوید؛ سوخت است نه محرک.',
  },
  {
    id: 'R-12',
    from: 'usdjpy',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: "The yen funds the world's carry trades: its calm rise eases gold's pressure, its violent surges mark the stress moments when everything, briefly, gets sold.",
    fa: 'ین، معامله‌های کَری جهان را تأمین مالی می‌کند: رشد آرامش فشار طلا را کم می‌کند و جهش‌های شدیدش لحظه‌های تنش‌اند که همه‌چیز، لحظه‌ای، فروخته می‌شود.',
  },
  {
    id: 'R-13',
    from: 'usd-reserve-share',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: "When the world's official sector concentrates in dollars, gold's structural bid is quiet; when it diversifies, gold's structural story begins.",
    fa: 'وقتی بخش رسمی جهان بر دلار متمرکز می‌شود، تقاضای ساختاری طلا ساکت است؛ وقتی تنوع می‌بخشد، روایت ساختاری طلا آغاز می‌شود.',
  },
  {
    id: 'R-14',
    from: 'borrowing-costs',
    to: 'dollar-basket',
    class: 'M',
    xFlag: false,
    blocked: false,
    en: 'Money flows toward better-paid currencies: relative rate paths drive the dollar, and the dollar is one of gold\u2019s two great macro levers.',
    fa: 'پول به سمت ارزهای بهتر پرداخت‌کننده می‌رود: مسیر نسبی نرخ‌ها دلار را می‌راند و دلار یکی از دو اهرم بزرگ کلان طلاست.',
  },
  {
    id: 'R-15',
    from: 'fed-expectations',
    to: 'gold',
    class: 'M',
    xFlag: true,
    blocked: false,
    en: 'Gold trades the expected path, not the setting: the surprise, not the move, is what usually shifts it.',
    fa: 'طلا مسیرِ مورد انتظار را معامله می‌کند نه تنظیم فعلی را: غافلگیری است که معمولاً آن را جابه‌جا می‌کند، نه خودِ حرکت.',
  },
  {
    id: 'R-16',
    from: 'gold-aud',
    to: 'gold',
    class: 'M',
    xFlag: false,
    blocked: false,
    en: 'Before calling a gold move global, price it in another currency — part of every dollar-price move is just the dollar.',
    fa: 'پیش از جهانی خواندن یک حرکت طلا، آن را به ارزی دیگر قیمت بزنید؛ بخشی از هر حرکتِ دلاری، خودِ دلار است.',
  },
  {
    id: 'R-19',
    from: 'gold-btc',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'The oldest and newest stores of value trade their own referendum — correlated in narrative-driven stretches, uncorrelated in most others.',
    fa: 'کهنه‌ترین و جدیدترین خزانه‌های ارزش، همه‌پرسیِ خودشان را برگزار می‌کنند؛ در دوره‌های روایت‌محور همبسته و در بیشتر دوره‌ها ناهمبسته.',
  },
  {
    id: 'R-20',
    from: 'gold-oil-ratio',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'Gold, oil and platinum share the inflation tide; their ratios cancel it out and leave the relative story behind.',
    fa: 'طلا، نفت و پلاتین جزر و مد تورمی را مشترک دارند؛ نسبت‌هایشان آن را حذف می‌کند و روایت نسبی را باقی می‌گذارد.',
  },
  {
    id: 'R-21',
    from: 'copper-gold',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: "Copper bets on construction and factories; gold bets on fear — their ratio is the world's growth-versus-protection mood in one number.",
    fa: 'مس بر ساخت‌وساز و کارخانه شرط می‌بندد و طلا بر ترس؛ نسبتشان، حال‌وهوای رشد-در-برابر-حفاظتِ جهان در یک عدد است.',
  },
  {
    id: 'R-22',
    from: 'dollar-basket',
    to: 'gold',
    class: 'X',
    xFlag: true,
    blocked: false,
    en: 'In a true panic the dollar itself is the haven: gold and the dollar rise together until the panic finds its policy answer.',
    fa: 'در هراس واقعی، خود دلار پناه‌گاه است: طلا و دلار با هم بالا می‌روند تا وقتی هراس پاسخ سیاستی‌اش را پیدا کند.',
  },
  {
    id: 'R-23',
    from: 'gold-equities-ratio',
    to: 'gold',
    class: 'C',
    xFlag: true,
    blocked: false,
    en: 'Stocks and gold split the risk appetite between them — sometimes opposite, sometimes together, depending on what the market is afraid of.',
    fa: 'سهام و طلا اشتها به ریسک را میان خود تقسیم می‌کنند؛ گاهی مقابل هم، گاهی هم‌سو، بسته به اینکه بازار از چه چیزی می‌ترسد.',
  },
  {
    id: 'R-24',
    from: 'inflation',
    to: 'gold',
    class: 'M',
    xFlag: false,
    blocked: false,
    en: "When the world's delivery chains strain, goods prices tend to feel it later — and gold feels it only after that, if the inflation sticks.",
    fa: 'وقتی زنجیره‌های تأمین جهان کشیده می‌شوند، قیمت کالاها بعدتر آن را حس می‌کنند و طلا فقط پس از آن، اگر تورم بماند.',
  },
  {
    id: 'R-25',
    from: 'michigan-1y-expectations',
    to: 'gold',
    class: 'C',
    xFlag: false,
    blocked: false,
    en: 'Households feel inflation at the pump before markets price it in bonds — when the two expectations families disagree, the inflation story itself is contested.',
    fa: 'خانوارها تورم را در پمپ بنزین حس می‌کنند پیش از آنکه بازار در اوراقش قیمت بگذارد؛ وقتی دو خانوادهٔ انتظارات با هم هم‌نظر نباشند، خودِ روایت تورم محل نزاع است.',
  },
  {
    id: 'R-26',
    from: 'wgc-etf-holdings',
    to: 'gold',
    class: 'M',
    xFlag: false,
    blocked: true,
    en: 'Gold ETFs make the haven trade visible daily — inflows bid, outflows release — but this page cannot yet show that data under its licensing rules.',
    fa: 'صندوق‌های طلای ETF معاملهٔ پناه‌گاهی را هر روز مرئی می‌کنند؛ ورودی قیمت را بالا می‌برد و خروجی عرضه اضافه می‌کند؛ اما این صفحه تحت قواعد مجوزش هنوز نمی‌تواند این داده را نشان دهد.',
  },
  {
    id: 'R-27',
    from: 'shanghai-gold-premium',
    to: 'gold',
    class: 'M',
    xFlag: false,
    blocked: false,
    en: 'Physical gold travels to wherever it earns a premium — the flows follow the gaps with a lag, and they explain where the metal went, not why the price moved today.',
    fa: 'طلای فیزیکی به جایی می‌رود که صرف می‌دهد؛ جریان‌ها با تأخیر دنبال شکاف‌ها می‌آیند و توضیح می‌دهند فلز به کجا رفت، نه اینکه قیمت امروز چرا حرکت کرد.',
  },
];

/** The class chips' vocabulary (10 §2's copy discipline, one word per
 *  class — always visible on every edge/row, never hue alone). */
export type RelationshipClassWord = 'mechanism' | 'correlation' | 'conditional' | 'documented';

/** The class → its word kind (the dictionary keys live in pd.gold.rel*). */
export const CLASS_WORD: Readonly<Record<RelationshipClass, RelationshipClassWord>> = {
  M: 'mechanism',
  C: 'correlation',
  X: 'conditional',
  K: 'documented',
};

/* ------------------------------------------------------------------ *
 * The force families — the map's own reading level. The 25 records
 * stay verbatim; the map groups them under the six families that own
 * them, each family labelled with its one-line effect on the ounce.
 * ------------------------------------------------------------------ */

/** A readable name for each concept the records connect (EN/FA) — the
 *  raw ids stay in the record's own data, the map speaks words. */
export const CONCEPT_NAMES: Readonly<Record<string, readonly [string, string]>> = {
  gold: ['gold', 'طلا'],
  'real-yield-10y': ['real yields (10y)', 'بازدهٔ واقعی ۱۰ساله'],
  'dollar-basket': ['the dollar', 'دلار'],
  us10y: ['the 10-year yield', 'بازدهٔ ۱۰ساله'],
  'term-premium-10y': ['the term premium', 'صرف سررسید'],
  'stress-stlfsi': ['market stress', 'تنش بازار'],
  'gold-silver': ['the gold/silver ratio', 'نسبت طلا/نقره'],
  'gpr-daily': ['war & policy fear', 'ترس جنگ و سیاست'],
  inflation: ['inflation', 'تورم'],
  'wgc-cb-demand': ['central-bank buying', 'خرید بانک‌های مرکزی'],
  'm2-us': ['money supply', 'حجم پول'],
  'cftc-gold-positioning': ["speculators' positioning", 'پوزیشن سفته‌بازان'],
  usdjpy: ['USD/JPY (the carry trade)', 'دلار/ین (معاملهٔ کَری)'],
  'usd-reserve-share': ["the dollar's reserve share", 'سهم ذخیره‌ای دلار'],
  'borrowing-costs': ['borrowing costs', 'هزینهٔ استقراض'],
  'fed-expectations': ['Fed expectations', 'انتظارات فدرال رزرو'],
  'gold-aud': ['gold in Australian dollars', 'طلا به دلار استرالیا'],
  'gold-btc': ['gold/Bitcoin', 'طلا/بیت‌کوین'],
  'gold-oil-ratio': ['the gold/oil ratio', 'نسبت طلا/نفت'],
  'copper-gold': ['the copper/gold ratio', 'نسبت مس/طلا'],
  'gold-equities-ratio': ['gold vs equities', 'طلا در برابر سهام'],
  'michigan-1y-expectations': ['household inflation hopes', 'انتظارات تورمی خانوار'],
  'wgc-etf-holdings': ['ETF holdings', 'دارایی ETFها'],
  'shanghai-gold-premium': ['the Shanghai premium', 'صرف شانگهای'],
};

/** One force family — the records grouped under the family that owns
 *  them, with its own one-line effect on the ounce. */
export interface ForceFamily {
  id: string;
  icon: 'money' | 'dollar' | 'fear' | 'inflation' | 'buyers' | 'ratios';
  records: readonly string[];
  title: readonly [string, string];
  effect: readonly [string, string];
}

/** The six families — the map's own structure (25 records, all placed). */
export const FORCE_FAMILIES: readonly ForceFamily[] = [
  {
    id: 'cost-of-money',
    icon: 'money',
    records: ['R-01', 'R-03', 'R-04', 'R-15'],
    title: ['The cost of money', 'هزینهٔ پول'],
    effect: [
      "High real yields are gold's classic rival — and the edge has weakened since 2022.",
      'بازدهٔ واقعی بالاتر رقیب کلاسیک طلاست — و این برتری از ۲۰۲۲ ضعیف شده است.',
    ],
  },
  {
    id: 'the-dollar',
    icon: 'dollar',
    records: ['R-02', 'R-12', 'R-13', 'R-14'],
    title: ['The dollar', 'دلار'],
    effect: [
      'Gold is priced in dollars — dollar strength usually leans against the ounce.',
      'طلا به دلار قیمت می‌خورد؛ قدرت دلار معمولاً بر اونس فشار می‌آورد.',
    ],
  },
  {
    id: 'fear-and-stress',
    icon: 'fear',
    records: ['R-05', 'R-07', 'R-22'],
    title: ['Fear & stress', 'ترس و تنش'],
    effect: [
      'Frightened money historically runs to gold — after the first liquidity phase passes.',
      'پولِ ترسانده از نظر تاریخی به طلا پناه می‌برد — پس از گذر از فاز نخستِ نقدینگی.',
    ],
  },
  {
    id: 'inflation-and-money',
    icon: 'inflation',
    records: ['R-08', 'R-10', 'R-24', 'R-25'],
    title: ['Inflation & money', 'تورم و پول'],
    effect: [
      "The decades-scale argument; quarter-to-quarter it rides the Fed's response.",
      'استدلالِ دهه‌مقیاس؛ در افق فصلی به واکنش فدرال رزرو می‌رود.',
    ],
  },
  {
    id: 'the-buyers',
    icon: 'buyers',
    records: ['R-09', 'R-11', 'R-26', 'R-27'],
    title: ['The buyers', 'خریداران'],
    effect: [
      "Who the marginal buyer is — central banks, speculators, ETFs, Shanghai's bid.",
      'خریدارِ مرزی که کدام است — بانک‌های مرکزی، سفته‌بازان، ETFها، خرید شانگهای.',
    ],
  },
  {
    id: 'the-ratios',
    icon: 'ratios',
    records: ['R-06', 'R-16', 'R-19', 'R-20', 'R-21', 'R-23'],
    title: ['The ratios', 'نسبت‌ها'],
    effect: [
      'Gold priced against its siblings — gauges that cancel the shared tide.',
      'طلا در برابر هم‌خانواده‌هایش — سنجه‌هایی که جزر و مد مشترک را حذف می‌کنند.',
    ],
  },
];

/** Resolve one family's records (an unknown id is simply skipped,
 *  honestly — the map never invents a link). */
export function familyRecords(family: ForceFamily): readonly GoldRelationshipRecord[] {
  const byId = new Map(GOLD_RELATIONSHIPS.map((r) => [r.id, r]));
  return family.records.flatMap((id) => {
    const r = byId.get(id);
    return r !== undefined ? [r] : [];
  });
}
