# Persian copy round 82 — the GF-S11 decisions' execution + P4 (2026-11-07)

**The GF-S11 session** of the gold meter gap-fill program (branch
`gf/s11-decisions-and-p4`) landed eleven new indicators — the round-2
decisions' execution + the P4 context additions, all `rule: { kind: 'info' }`
(never votes, the context-first register):

- **I9 (the owner's recorded BUILD answer)**: `cpi-nowcast` (the Cleveland
  Fed's current-month CPI MoM nowcast — the accumulation card) +
  `cpi-surprise` (the realised print minus the final nowcast — the surprise
  object, derived when the BLS print lands).
- **I10** `real-gold-price` (the Jastram real gold price, gold ÷ the CPI
  index, the CPI's own 1982–84 dollar base).
- **X7** `gold-platinum` (the second precious-bloc ratio).
- **I11** `global-liquidity` (the Fed + ECB + BoJ balance-sheet aggregate,
  USD-converted, monthly).
- **F16** `swiss-gold-flow` (the BAZG open-data gold imports, monthly
  tonnes).
- **F15** `sge-gold-withdrawals` (the SGE monthly Data Highlights — the
  class the owner's round-2 answer (e) accepted).
- **X5** `gold-equities-ratio` (GLD ÷ SPY, the rotation gauge).
- **R11** `rstar-us` (the Holston–Laubach–Williams natural-rate estimate).
- **G3** `debt-to-gdp` (FRED GFDEGDQ188S, the structural anchor).
- **F12** `etf-short-interest` (the fail-closed licence verdict — the card
  renders 'awaiting data' honestly until a licence-clean venue appears).

Each carries the full `IndicatorCopyEntry` shape in both EN and FA (11
fields per card — 121 new Persian strings this round).

**The discipline (D-GF-3, no forecasting):** every card is
conditions-descriptive. The two I9 cards state the standing-start maturity
explicitly («انباشت صادقانه از نوامبر ۲۰۲۶ شروع شده… نخستین شگفتی با چاپ
ماهانهٔ بعدی فرود می‌آید و پای صدک‌ها طی حدود دو سال و نیم می‌رسد»); the
nowcast is labelled a model estimate («این برآورد مدل است، نه داده»), never
a promise («هرگز یک وعده نیست»). The `cantTell` of every card carries the
fixed context-card formula («کارتی بافاری است: صرفاً برای اطلاع، در هیچ گیجی
رأی نمی‌دهد»). The F12 card's honest awaiting-data state is stated in its
`cantTell` («در انتظار داده، صادقانه…»). The terminology glossary is
respected: بانک مرکزی (the fixed word), ترازنامه، شاخص، حق‌الامتیاز (the
Shanghai-premium round-81 term), نرخ بهرهٔ طبیعی for r-star, تنگ‌کردن کمّی
(the walcl round-77 term), تسهیل کمّی, دادهٔ باز, تریلیون. Persian digits
throughout (۸۲–۱۹۸۴، ۱۲۰ درصد، ۲۰۲۱ تا ۲۰۲۶), ZWNJ correct
(پیش‌بینی، حق‌الامتیاز، بانک‌های مرکزی), no em dashes, Latin tickers stay
Latin (CPI, GLD/SPY, FRED, H.41, Data Highlights).

**Triage:** all 121 new strings reviewed + approved this round; copy:audit
clean save the manifest triage recorded here. The reference for the
manifest's `--reference` field: this file.
