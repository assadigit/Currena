/**
 * gold-relationships.ts — the relationship-explorer's record module
 * (GUX-S6 M1, 10 §5's contract): the 24 included relationship records
 * of docs/gold-redesign/10-indicator-relationship-map.md §3, transcribed
 * byte-faithful (the one-liners are the records' own EN/FA text — 10 §5's
 * copy rule: the one-liners ARE the edge labels' full text).
 *
 * The evidence-class taxonomy (10 §2): M mechanism · C observed
 * correlation · X conditional · K causal-with-evidence. `xFlag` carries
 * the regime/break flag SEPARATELY from the primary class (the taxonomy
 * allows X to flag an M or C record); `blocked` marks the legend-only
 * edges (12 §5.2: a blocked edge never renders as a canvas edge — a
 * drawn edge would imply charted evidence).
 *
 * The nodes are referenced by the page's own canonical ids where an
 * indicator exists (09's registry), by the lane ids where the record
 * speaks of a lane as a whole, and by the free-form concept labels the
 * records themselves name (gold · the market-structure concepts). The
 * explorer's LIST renders the records in this file's order (the doc's
 * own §3 order: the core macro → the structural/chain → the
 * market-structure families).
 *
 * LOCALE-NEUTRAL by construction: the one-liners ride per-locale fields
 * (en/fa authored in 10 §3); NO new runtime fa string enters the
 * dictionaries through this module (the Persian-copy manifest's S5-D3
 * discipline — the fa text here is 10 §3's own authored copy, the
 * same class of content the deep tier carries).
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
