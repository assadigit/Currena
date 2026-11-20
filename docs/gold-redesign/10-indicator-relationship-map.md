# Gold Page Redesign — Session 3: Indicator Relationship Map

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 3 of 9 — the conventional-relationship record set + the relationship-explorer taxonomy (master plan §5.5).
**Consumers:** each indicator record's `relationships` field (09) links here by id; Session 6's relationship explorer renders this record set; Session 4 designs its visual grammar.
**Sources of truth for classification:** the engine's own polarity table (`gold-score.ts` — which relationships the meter actually votes on), the shipped mechanism copy (the on-ramp's five-driver education, the decomposition card, the correlation companion's pre-registered windows), the repo's measured evidence (`docs/insights/BACKTEST-GOLD.md` — the no-edge record; the honest-record footer's sign-agreement stats), and standard mainstream financial-literature framing kept deliberately generic (no external claims beyond what the page's own data and widely known history support).

---

## 1. Why this document exists

The owner asked Currena to explain the **conventional relationships** that help a visitor understand why gold reacts to conditions — while never claiming that every correlation is established or causal (master plan §5.5). This document is the researched record set: each meaningful connection, its proposed mechanism, its evidence class, its typical direction, its exceptions and regime dependence, and a short fa/en explanation. It is also the honesty filter: relationships the data cannot support are recorded as **excluded** with reasons, not silently included.

---

## 2. The evidence-class taxonomy (the explorer's grammar)

Every record carries exactly one primary class plus flags. Session 6 renders the classes distinctly (color/shape/label), and the copy never blurs them.

| Class | Code | Definition | Copy discipline |
|---|---|---|---|
| **Economic mechanism** | **M** | An identified, economically reasoned channel through which A affects B (opportunity cost, pricing currency, physical demand). Mechanisms explain *why* a pattern should exist; they do not prove it operates at all times. | "The channel works through…", "the mechanism is…" — never "therefore A will move B". |
| **Observed correlation** | **C** | A historically documented association, without full causal identification. | "have tended to move together/opposite", "historically associated" — never "causes". |
| **Conditional relationship** | **X** | A relationship whose direction or strength depends on regime, horizon or accompanying conditions — including documented break episodes. | "depends on…", "in this regime…", "the documented breaks are…". X may flag an M or C record; it is also the class of break-pattern records. |
| **Causal claim with evidence** | **K** | A specific causal statement supported by direct evidence. Deliberately rare here; assigned only where the page's own sources document the mechanism AND its realization (e.g. the post-2022 official-sector shift, documented by the IMF/WGC reporting the page cites). | Must name the evidence; otherwise downgrade to M or C. |

**Standing rules (from the master plan §5.5, operationalized):**
1. No universal one-way claims — every record carries its exceptions.
2. Correlation is not causation; mechanism is not proof of operation; neither is prediction.
3. Regime dependence is flagged explicitly (X), with the named break episodes.
4. Historical visualization only where data coverage supports it (the correlation companion's pre-registered 52-week window is the in-repo precedent; other relationships get no chart unless Session 4/6 verifies coverage).
5. The meter's own measured record (no directional edge in the 37-voter table; sign-agreements 46.8/42.2/32.7% at 5/20/60 trading days) is the honesty anchor: this map explains the *conventional thinking the meter encodes*, and the meter's own page says the thinking has no measured forecasting edge.

---

## 3. The relationship records

Format: **id — A ↔ B** · class · typical direction (for gold) · exceptions/regime flags · in-repo evidence · EN one-liner · FA one-liner.

### The core macro relationships

**R-01 — Real yields ↔ gold** · **M** (mechanism: opportunity cost) · flag **X** (regime-dependent; 2022+ weakening) · typical: rising real yields pressure gold, falling support it. · Evidence: the engine's first voter (`real-yield-10y`, polarity −1, the "textbook driver"); the correlation companion's dual-axis + 52-week rolling correlation (pre-registered windows printed); the on-ramp's driver-1 (the 2022 break named); BACKTEST-GOLD's no-edge record. · EN: "Gold pays no yield, so high real returns on bonds are its classic rival — a mechanism, not a law: since 2022 the pattern weakened visibly as the marginal buyer changed." · FA: «طلا بهره نمی‌پردازد؛ بازده واقعی بالای اوراق، رقیب کلاسیک آن است. این یک سازوکار است نه قانون: از ۲۰۲۲ این الگو به‌وضوح ضعیف شده چون خریدارِ مرزی عوض شده است.»

**R-02 — The US dollar ↔ gold** · **M** (pricing currency) · flag **X** (two documented breaks) · typical: a stronger dollar weighs on gold; a weaker one lifts it. Exceptions: (1) in market stress both are bid together (flight-to-safety), (2) in de-dollarization episodes both rise. · Evidence: the dollar lane's seven voters; the on-ramp's driver-3 (both breaks named); the dollar-gold-oil linkage card's inverse structure. · EN: "Gold is priced in dollars, so dollar strength usually weighs on the ounce — except in the two documented break patterns: stress bids and reserve-diversification bids." · FA: «طلا به دلار قیمت می‌خورد؛ قدرت دلار معمولاً بر اونس فشار می‌آورد، جز در دو الگوی مستندشدهٔ شکست: خریدِ هم‌زمان در تنش و خریدِ تنوع‌بخشی ذخایر.»

**R-03 — Nominal yield = real + breakeven (the decomposition identity)** · **M** (accounting identity, always true by construction) · This is the map's structural anchor: a nominal-yield move means different things for gold depending on which leg drives it (real → R-01 pressure; breakeven → R-08 hedge demand; premium → R-04). · Evidence: the yield-decomposition card (same-asOf identity, three named configurations, the 2022 gilt exception); the seats 3.2/3.1/3.29/3.19/3.31. · EN: "A yield rise is not one story but three: which piece moved — real, expected inflation, or the premium — decides what it usually means for gold." · FA: «رشد بازده یک روایت ندارد، سه روایت دارد: کدام قطعه حرکت کرده، واقعی، تورمِ مورد انتظار یا صرف، تعیین می‌کند برای طلا معمولاً چه معنایی دارد.»

**R-04 — Term premium ↔ gold** · **C** (observed association) + **M** (fear-compensation channel) · typical: a rising premium has historically supported, not hurt, gold (the debasement configuration). Exception: inside funding stress a premium spike can first hit gold through margin/liquidity spirals (the 2022 gilt episode's analog). · Evidence: `term-premium-10y` (polarity +1, the engine's own inverted-yield reading); the decomposition card's premium education block. · EN: "When long yields rise because investors demand fear-and-supply compensation, history has sided with gold — except in the first, liquidity-driven phase of a stress spike." · FA: «وقتی بازدهٔ بلندمدت به‌خاطر مطالبهٔ جبرانِ ترس و عرضه بالا می‌رود، تاریخ همسوی طلا بوده است؛ جز در فاز نخستِ جهش‌های تنشی که نقدینگی حاکم است.»

**R-05 — Financial stress ↔ gold** · **M** (safe-haven demand) · flag **X** (two-phase pattern) · typical: elevated stress feeds gold's haven bid. Exceptions: the panic phase can sell gold to raise cash (2008's first weeks; the episode records carry the two-phase story); equity-specific fear can be absorbed by the dollar instead. · Evidence: the stress lane's voters (STLFSI, NFCI, VIX, EBP, bank-stress); the episode records 2008/2020; the on-ramp's driver-5. · EN: "Frightened money historically runs to gold — but the first hours of a true panic can sell it for cash, and the haven usually arrives after policy responds." · FA: «پولِ ترسانده از نظر تاریخی به طلا پناه می‌برد؛ اما نخستین ساعات یک هراس واقعی می‌تواند آن را برای نقدینگی بفروشد و پناه‌گاه معمولاً پس از پاسخ سیاستی می‌رسد.»

**R-06 — The gold/silver ratio ↔ monetary fear** · **C** (observed) · typical: a ratio high in its history marks fear-over-growth phases (1991, 2008, 2020). Caveat: silver's industrial cycle contaminates the read (a solar-demand boom can compress the ratio without any fear change). · Evidence: the `gold-silver` seat (polarity +1, "a high ratio IS the monetary-stress read" — the engine's own framing). · EN: "When gold pulls far ahead of silver, markets are paying up for pure monetary metal — a fear gauge built from the metals themselves, with silver's industrial cycle as its known noise." · FA: «وقتی طلا از نقره خیلی جلو می‌زند، بازار برای فلز پولیِ خالص هزینه می‌کند؛ سنجهٔ ترسی از دل خود فلزات، با چرخهٔ صنعتی نقره به‌عنوان نوفهٔ شناخته‌شده‌اش.»

**R-07 — Geopolitical/policy risk ↔ gold** · **C** (event-driven association) · typical: escalation fear bids gold; the premium often fades within days to weeks when consequences don't materialize (the two-phase event pattern). Policy uncertainty (EPU) behaves similarly with a domestic-rules flavor. · Evidence: `gpr-daily`, `epu-us` seats. · EN: "War and policy fear usually bid gold first and ask questions later — much of the event premium historically fades when the feared outcome doesn't arrive." · FA: «ترس از جنگ و سیاست معمولاً نخست طلا می‌خرد و بعد می‌پرسد؛ بخش بزرگی از صرفِ رخداد به‌طور تاریخی فروکش می‌کند وقتی پیامدِ ترسیده‌شده نمی‌رسد.»

**R-08 — Inflation ↔ gold** · **M at long horizons / X at short horizons** · typical: over decades gold tracks purchasing power (the real-gold-price record); over quarters the policy response dominates — hot inflation that brings tight policy can pressure gold through R-01 (2021–22 the canonical example). The cleanest single summary is the realized-vs-expected gap closing through hawkish policy (pressure) or lost credibility (support). · Evidence: the inflation lane's ten voters; the on-ramp's driver-2 (this exact nuance); the real-gold-price card. · EN: "Gold's inflation hedge is earned over decades, not weeks: what matters quarter-to-quarter is how the Fed responds, which is why real rates are the better short-horizon guide." · FA: «پوشش تورمی طلا در دهه‌ها ساخته می‌شود نه چند هفته؛ در افق فصلی واکنش فدرال رزرو مهم است و به همین دلیل بازده واقعی راهنمای بهتری برای کوتاه‌مدت است.»

**R-09 — Central-bank demand ↔ gold** · **M** (physical demand channel) + **K-flagged evidence** for the post-2022 shift (documented: official-sector buying roughly doubled after the 2022 reserve freeze — the IMF tracker's own episode annotations carry it) · flag **X** (price-insensitivity contested; slow, lumpy, lagged reporting; explains floors over quarters, not every drawdown) · Evidence: the CB-demand module (IMF SDMX tracker, three dated annotations); the on-ramp's driver-4 with its honest limits; the blocked WGC record (5.2). · EN: "Central-bank buying roughly doubled after 2022's reserve freeze — a documented demand shift that raised gold's floor; how price-insensitive it truly is remains debated, and it is no guarantee in every dip." · FA: «خرید بانک‌های مرکزی پس از انجماد ذخایر ۲۰۲۲ تقریباً دو برابر شد؛ جابه‌جاییِ تقاضای مستندی که کفِ طلا را بالا برد. چقدر به قیمت بی‌اعتناست محل بحث است و در هر افت کوچکی پشتیبانی تضمینی نیست.»

**R-10 — Money supply & deficits ↔ gold (the debasement channel)** · **C** (long-horizon association) · flag **X + disputed** · typical: fast money growth and wide deficits associate with gold strength over decades; at quarterly horizons the link is weak and contested as a standalone driver. · Evidence: `m2-us`, `us-deficit-12m` seats (the engine's debasement-channel voters); the real-gold-price record. · EN: "More money and bigger deficits are the decades-scale argument for gold — an association that is honest at long horizons and weak at short ones." · FA: «پولِ بیشتر و کسری بزرگ‌تر، استدلالِ دهه‌مقیاس برای طلاست؛ همبستگی‌ای که در افق بلند صادقانه است و در کوتاه‌مدت ضعیف.»

**R-11 — Positioning ↔ gold** · **C** (contrarian-at-extremes) · flag **X** (in trends, crowded positioning can persist for months) · typical: extreme crowded longs are fragile (squeeze-then-slump); capitulated lows leave rebuild room. Mid-range carries little information. · Evidence: the flows lane's two CFTC seats (polarity −1, the engine's contrarian reading); the on-ramp's positioning-is-fuel note. · EN: "Speculators' books are the market's fuel gauge: at the extremes they mark fragile crowds, in the middle they say almost nothing — fuel, not a driver." · FA: «دفتر سفته‌بازان سوخت‌سنج بازار است: در انتهای دامنه ازدحامِ شکننده را علامت می‌زند و در میانه تقریباً هیچ نمی‌گوید؛ سوخت است نه محرک.»

### The structural/chain relationships

**R-12 — The yen carry ↔ gold** · **M** (funding-currency mechanics) · flag **X** (unwind episodes) · typical: a rising USD/JPY marks dollar strength plus risk appetite (gold's pressure side); violent yen strength marks carry unwinds — stress moments where gold can be sold first for liquidity. · Evidence: `usdjpy`, `us-japan-10y-gap` seats; the episode records' two-phase pattern. · EN: "The yen funds the world's carry trades: its calm rise eases gold's pressure, its violent surges mark the stress moments when everything, briefly, gets sold." · FA: «ین، معامله‌های کَری جهان را تأمین مالی می‌کند: رشد آرامش فشار طلا را کم می‌کند و جهش‌های شدیدش لحظه‌های تنش‌اند که همه‌چیز، لحظه‌ای، فروخته می‌شود.»

**R-13 — Foreign custody & reserve share ↔ dollar-asset demand ↔ gold** · **M** (reserve-manager behavior) · flag **X** (slow, structural) · typical: rising USD reserve share and custody mark official dollar demand (gold's pressure side); falling both mark the diversification story (gold-supportive). Custody-hub caveat applies (hubs hold much that belongs to others). · Evidence: `usd-reserve-share`, `nyfed-custody` seats; the TIC composite's design note. · EN: "When the world's official sector concentrates in dollars, gold's structural bid is quiet; when it diversifies, gold's structural story begins." · FA: «وقتی بخش رسمی جهان بر دلار متمرکز می‌شود، تقاضای ساختاری طلا ساکت است؛ وقتی تنوع می‌بخشد، روایت ساختاری طلا آغاز می‌شود.»

**R-14 — Rate differentials → the dollar → gold** · **M** (capital-flow chain) · typical: relative policy tightness (US vs partners) lifts the dollar, which weighs on gold — the chain the borrowing-costs and dollar lanes read together. · Evidence: the two lanes' joint reading; `us-japan-10y-gap`; `ecb-dfr`. · EN: "Money flows toward better-paid currencies: relative rate paths drive the dollar, and the dollar is one of gold's two great macro levers." · FA: «پول به سمت ارزهای بهتر پرداخت‌کننده می‌رود: مسیر نسبی نرخ‌ها دلار را می‌راند و دلار یکی از دو اهرم بزرگ کلان طلاست.»

**R-15 — Fed expectations ↔ gold** · **M** (via R-01/R-14) · flag **X** ("the market trades the expectation") · typical: hawkish repricing pressures gold, dovish supports — but a fully-priced move is a non-event, and a dovish surprise inside a hiking cycle can lift gold. · Evidence: `fed-expectations`, `fed-target` seats; the on-ramp's driver-1 sentence. · EN: "Gold trades the expected path, not the setting: the surprise, not the move, is what usually shifts it." · FA: «طلا مسیرِ مورد انتظار را معامله می‌کند نه تنظیم فعلی را: غافلگیری است که معمولاً آن را جابه‌جا می‌کند، نه خودِ حرکت.»

**R-16 — Numeraire effects (gold in other currencies)** · **M** (arithmetic, always true) · typical: part of any "gold move" is a currency move; gold can sit at all-time highs in euros or yen while consolidating in dollars (and the page's currency grid exists to check this). · Evidence: the currency-grid module; the gold-aud card; the on-ramp's rule. · EN: "Before calling a gold move global, price it in another currency — part of every dollar-price move is just the dollar." · FA: «پیش از جهانی خواندن یک حرکت طلا، آن را به ارزی دیگر قیمت بزنید؛ بخشی از هر حرکتِ دلاری، خودِ دلار است.»

### The market-structure and comparison relationships

**R-19 — Bitcoin ↔ gold** · **C** (episodic, mostly low) · typical: correlation is episodic — the "digital gold" narrative links them in some regimes and not others; the gold-btc ratio is the running referendum. · Evidence: `gold-btc` card. · EN: "The oldest and newest stores of value trade their own referendum — correlated in narrative-driven stretches, uncorrelated in most others." · FA: «کهنه‌ترین و جدیدترین خزانه‌های ارزش، همه‌پرسیِ خودشان را برگزار می‌کنند؛ در دوره‌های روایت‌محور همبسته و در بیشتر دوره‌ها ناهمبسته.»

**R-20 — The commodity family (oil, platinum) ↔ gold** · **C** (common inflation sensitivity; ratios mean-revert) · typical: all are inflation-sensitive, so their ratios strip the common tide and expose the relative story (energy shock, industrial cycle). Mean reversion of the ratios is a historical tendency, not a rule. · Evidence: `gold-oil-ratio`, `gold-platinum` cards. · EN: "Gold, oil and platinum share the inflation tide; their ratios cancel it out and leave the relative story behind." · FA: «طلا، نفت و پلاتین جزر و مد تورمی را مشترک دارند؛ نسبت‌هایشان آن را حذف می‌کند و روایت نسبی را باقی می‌گذارد.»

**R-21 — Copper/gold ↔ growth expectations** · **C** · typical: the growth metal against the hedge metal compresses the growth/defensive mix; it is the same story the growth-health lane tells elsewhere. · Evidence: `copper-gold` card; the copper-china-growth linkage card. · EN: "Copper bets on construction and factories; gold bets on fear — their ratio is the world's growth-versus-protection mood in one number." · FA: «مس بر ساخت‌وساز و کارخانه شرط می‌بندد و طلا بر ترس؛ نسبتشان، حال‌وهوای رشد-در-برابر-حفاظتِ جهان در یک عدد است.»

**R-22 — The stress-dollar joint bid (the break pattern)** · **X** (a record about an exception) · In flight-to-safety episodes the dollar and gold are bid together, suspending R-02's inverse — the dollar absorbs the haven flow gold would otherwise take. · Evidence: the on-ramp's driver-3 break list; 2008's episode record. · EN: "In a true panic the dollar itself is the haven: gold and the dollar rise together until the panic finds its policy answer." · FA: «در هراس واقعی، خود دلار پناه‌گاه است: طلا و دلار با هم بالا می‌روند تا وقتی هراس پاسخ سیاستی‌اش را پیدا کند.»

**R-23 — Equities ↔ gold** · **C** (risk appetite) · flag **X** (sign switches by regime) · typical: low-to-negative correlation in risk-on decades, positive in fear-of-inflation or debasement regimes; the GLD/SPY ratio marks the long rotation waves. · Evidence: `gold-equities-ratio` card; `sp500-breadth-ratio` seat. · EN: "Stocks and gold split the risk appetite between them — sometimes opposite, sometimes together, depending on what the market is afraid of." · FA: «سهام و طلا اشتها به ریسک را میان خود تقسیم می‌کنند؛ گاهی مقابل هم، گاهی هم‌سو، بسته به اینکه بازار از چه چیزی می‌ترسد.»

**R-24 — Supply-chain pressure → inflation → gold** · **M** (chain with lags) · typical: stretched delivery chains push goods prices with a lag (the GSCPI linkage's own rule); the gold link then runs through R-08 — conditional, lagged, not mechanical. · Evidence: the supply-pressure-inflation linkage card; `us-cpi-yoy`. · EN: "When the world's delivery chains strain, goods prices tend to feel it later — and gold feels it only after that, if the inflation sticks." · FA: «وقتی زنجیره‌های تأمین جهان کشیده می‌شوند، قیمت کالاها بعدتر آن را حس می‌کنند و طلا فقط پس از آن، اگر تورم بماند.»

**R-25 — Household vs market inflation expectations** · **C** (households often lead; anchoring matters) · typical: households price the gas-pump experience before bonds reprice; the 5–10y household anchor is the slow regime label under the market's fast one. Divergence between them is itself a signal of stress in the inflation narrative. · Evidence: the three UoM-family seats; the breakeven family. · EN: "Households feel inflation at the pump before markets price it in bonds — when the two expectations families disagree, the inflation story itself is contested." · FA: «خانوارها تورم را در پمپ بنزین حس می‌کنند پیش از آنکه بازار در اوراقش قیمت بگذارد؛ وقتی دو خانوادهٔ انتظارات با هم هم‌نظر نباشند، خودِ روایت تورم محل نزاع است.»

**R-26 — ETF flows ↔ gold (investment demand)** · **M** (investment-demand channel) · **BLOCKED for data**: no licence-clean in-repo source (5.1) — the relationship is explained conceptually (the on-ramp's two-channels-inside-safe-haven teaching) but never charted or claimed from data until a source exists. · Evidence: the on-ramp's driver-5 copy; the blocked record. · EN: "Gold ETFs make the haven trade visible daily — inflows bid, outflows release — but this page cannot yet show that data under its licensing rules." · FA: «صندوق‌های طلای ETF معاملهٔ پناه‌گاهی را هر روز مرئی می‌کنند؛ ورودی قیمت را بالا می‌برد و خروجی عرضه اضافه می‌کند؛ اما این صفحه تحت قواعد مجوزش هنوز نمی‌تواند این داده را نشان دهد.»

**R-27 — Physical flows ↔ gold (the arbitrage family)** · **M** (physical arbitrage: premiums pull metal) · typical: the Shanghai premium pulls bullion east through the Swiss hub; SGE withdrawals and Swiss imports trace the flow with lags and proxy imperfections. Volume is not price: flows explain where metal went, not what the price did that day. · Evidence: `shanghai-gold-premium`, `sge-gold-withdrawals`, `swiss-gold-flow` cards. · EN: "Physical gold travels to wherever it earns a premium — the flows follow the gaps with a lag, and they explain where the metal went, not why the price moved today." · FA: «طلای فیزیکی به جایی می‌رود که صرف می‌دهد؛ جریان‌ها با تأخیر دنبال شکاف‌ها می‌آیند و توضیح می‌دهند فلز به کجا رفت، نه اینکه قیمت امروز چرا حرکت کرد.»

---

## 4. The coverage matrix (researched / included / excluded / blocked)

Master plan §5.5 requires the matrix. Every conventional relationship a gold-literate visitor might expect was assessed; the table records the verdict and the reason.

| Candidate relationship | Verdict | Reason |
|---|---|---|
| Real yields ↔ gold | **Included** (R-01) | The textbook mechanism; the page's own correlation data supports visualization. |
| Dollar ↔ gold | **Included** (R-02) | Mechanism + the two documented breaks; the meter votes on it. |
| Yield decomposition legs | **Included** (R-03) | The identity the page already teaches. |
| Term premium ↔ gold | **Included** (R-04) | The engine's own inverted reading + the gilt exception. |
| Stress family ↔ gold | **Included** (R-05) | Mechanism + two-phase honesty. |
| Gold/silver ratio ↔ fear | **Included** (R-06) | The engine's stress reading of the ratio. |
| GPR / EPU ↔ gold | **Included** (R-07) | Event-pattern honesty (fade documented). |
| Inflation ↔ gold | **Included** (R-08) | Two-horizon honesty (the on-ramp's own nuance). |
| Central-bank demand ↔ gold | **Included** (R-09) | Documented shift + honest limits; K-evidence for the shift itself. |
| M2 / deficits ↔ gold | **Included** (R-10) | Long-horizon-only honesty; disputed flag carried. |
| CFTC positioning ↔ gold | **Included** (R-11) | Contrarian-at-extremes; fuel-not-driver framing. |
| Carry (yen) ↔ gold | **Included** (R-12) | Mechanism + unwind episodes. |
| Reserve share / custody ↔ gold | **Included** (R-13) | Slow structural channel; custody caveat. |
| Rate-differential chain | **Included** (R-14) | The lanes' joint story. |
| Fed expectations ↔ gold | **Included** (R-15) | Expectation-trading nuance. |
| Numeraire effects | **Included** (R-16) | Arithmetic; the grid exists to check it. |
| BTC ↔ gold | **Included** (R-19) | Episodic-correlation honesty. |
| Commodity ratios | **Included** (R-20) | Common-tide framing. |
| Copper/gold ↔ growth | **Included** (R-21) | The growth/defensive mix. |
| Stress-dollar joint bid | **Included** (R-22) | The break pattern as its own record. |
| Equities ↔ gold | **Included** (R-23) | Sign-switch honesty. |
| Supply chains → inflation → gold | **Included** (R-24) | The linkage card's own lagged rule. |
| Household vs market expectations | **Included** (R-25) | Lead/lag + divergence signal. |
| ETF flows ↔ gold | **Included conceptually / BLOCKED for data** (R-26) | No licence-clean source; never charted until one exists. |
| Physical flows ↔ gold | **Included** (R-27) | Arbitrage mechanism + proxy caveats. |
| "Gold predicts (causes) future inflation" | **Excluded** | A causal claim the data cannot support; the honest long-horizon purchasing-power record is the most that can be said (R-08). |
| "The gold/silver ratio predicts recessions" | **Excluded** | Weak, contested literature; would overclaim beyond the fear-gauge reading (R-06). |
| "GPR spikes predict next-day gold direction" | **Excluded** | Event noise; the documented pattern is bid-then-fade, not next-day direction (R-07 carries the honest version). |
| "M2 growth predicts gold over weeks/months" | **Excluded** | Short-horizon weakness is the recorded finding; kept only in the long-horizon record (R-10). |
| "VIX causes gold moves" | **Excluded** | Causal wording without identification; the safe-haven mechanism (R-05) is the defensible form. |
| "CFTC positioning as a momentum signal" | **Excluded** | The recorded reading is contrarian-at-extremes only (R-11); momentum framing would invert the meter's own polarity. |
| "Central-bank buying guarantees drawdown support" | **Excluded** | The driver-4 honest limits say otherwise (R-09 carries the caveat). |
| LBMA analyst consensus as a gold predictor | **Excluded** | The retrospective's own record: even the consensus misses (10/16 under-forecast; the pending row never scored early). Referenced as the honesty anchor, never a signal. |
| CB-demand price-sensitivity regression | **Blocked** | Needs the WGC/CB datasets (licence/dead source); revisit on the owner levers. |
| PBoC purchases ↔ gold price correlation | **Blocked** | Source dead (5.3); no licence-clean alternative. |
| ETF short interest ↔ gold | **Blocked** | No licence-clean venue (5.4). |

**Counts:** 24 records included (R-01…R-16, R-19…R-27, minus unused ids R-17/R-18 reserved), 8 candidate claims excluded with documented reasons, 3 blocked on data/licence. Ids R-17/R-18 are deliberately reserved (never reused) — two early drafts were merged into R-05/R-22 and the ids retired to avoid dangling references in any future export.

---

## 5. The relationship-explorer record contract (for Session 6)

Each record above is the explorer's dataset. The explorer's implementation (Session 6) renders:

1. **Nodes** — the indicators/concepts, keyed by canonical id (09's registry) plus the five lane groups and gold itself as the hub.
2. **Edges** — one per relationship record: `id`, `from`, `to`, `class` (M/C/X/K), `direction` (the conventional direction, stated in words), `regimeFlags` (the X exceptions), `evidenceBasis` (in-repo data surfaces), `explanationEn/Fa` (the one-liners above), `blocked` (data availability for charting).
3. **Rendering discipline** — class is always visible (shape/label); X flags render as a distinct marker (a "conditions apply" token, never fine print); blocked edges render in the explorer's legend but cannot chart; K records name their evidence inline.
4. **Charting rule** — an edge may draw history only where the page holds the series with documented coverage (today: R-01 via the correlation companion's pre-registered windows; others get no chart until verified).
5. **Copy rule** — the one-liners above are the edge labels' full text; anything longer opens the linked indicator record (the popover/sheet pattern), keeping the map itself scannable.
6. **The honesty footer** — the explorer carries the meter's own measured record (no directional edge; the sign-agreement stats) so no visitor mistakes the map of conventional thinking for a proven system.

---

## 6. Session 3 acceptance walk (this deliverable)

- Conventional relationships mapped with mechanism/correlation/conditional/causal distinguished — §2 taxonomy + per-record classes. ✅
- Regime/time-varying flags — the X flags with named break episodes (2022 real-yield break, stress bids, gilt exception, carry unwinds). ✅
- Weak/disputed links flagged — R-10 (disputed), the excluded list's documented reasons. ✅
- Indicators whose data cannot support a simple directional claim — the blocked records (R-26 + the §4 blocked rows) and the exclusion rows; plus the standing no-edge anchor. ✅
- fa/en one-liners for every included record — present (§3). ✅
- The record set is complete for Session 6's explorer — §5's contract. ✅
