# LICENCES.md — the licence register (v3: RULES.md M-9 / RISK_REGISTER.md)

The machine-readable twins: `packages/insights/src/sources.ts`
(`SOURCE_RISK_REGISTER`: level L0–L3, owner_accepts, the M-6 `enabled` kill
switch, method M1–M5, runtime, terms lines, date read, attribution) and
`packages/insights/src/licences.ts` (the display gate:
`privateOk`/`publicDisplayOk` + the FRED per-series T-16 scan in
`data/fred-copyright.json`). The generator flows both into
`data/indicators.json` + `data/indicator-audit.json`; the T-15/T-26/T-30/T-31
gates enforce them.

**Fail-closed discipline:** `public_display_ok: unknown` is treated as **no**
by the T-15 mode gate — an unverified source can never appear in public mode.
**Panic switch:** `ACCESS_MODE=private` (or `PANIC_PRIVATE=true`) re-arms the
gate on every Insights data endpoint within one refresh cycle (M-5).

Terms were read 2026-10-16 (first licence walk) and re-read 2026-10-20 (the
v3 F-01 pass, plain honest requests, `CurrenaDashboard/1.0 (+…)`). Venue
blocks are recorded, never circumvented (RULES 4.3).

## The register

| Source | Level | Licence (quoted lines + date read) | Required attribution | Private ok | Public display | Terms |
|---|---|---|---|---|---|---|
| FRED, series WITHOUT a copyright notice (28 scanned) | L0 | Licence tag #copyright-public-domain per the T-16 scan (2026-10-16; the 2026-10-24 Wave-1 round added ICSA, RECPROUSM156N, PCEPILFE; the 2026-10-25 M6 Wave-3 round added WALCL, RSAFS, PERMIT, JTSJOL, AHETPI) | "Source: FRED, Federal Reserve Bank of St. Louis" | yes | yes | https://fred.stlouisfed.org/legal/ |
| FRED, series WITH a copyright notice (19 scanned, e.g. VIXCLS © Cboe) | L2 | "Copyrighted: Citation Required" (T-16 scan, 2026-10-16; the 2026-10-24 Wave-1 round added SOFR © NY Fed, UMCSENT/MICH © U. Michigan; the 2026-10-25 M6 Wave-3 round added MORTGAGE30US © Freddie Mac, CFNAI © Chicago Fed, T5YIE). FRED legal page (read verbatim 2026-10-21): this class is display-permitted WITH attribution of the source and acknowledgment the data was obtained from FRED (their example: "Source: BLS via FRED") — the reading's sourceName carries the "publisher via FRED" citation. | "© Cboe, via FRED" (VIX); "New York Fed via FRED" (SOFR); "University of Michigan via FRED" (UMCSENT/MICH); "Freddie Mac via FRED" (MORTGAGE30US); "Chicago Fed via FRED" (CFNAI); "Source: FRED, Federal Reserve Bank of St. Louis" | yes | yes (display-permitted with the "via FRED" citation — FRED legal read 2026-10-21) | https://fred.stlouisfed.org/legal/ |
| FRED, the PRE-APPROVAL class (2 scanned: BAMLH0A0HYM2, BAMLC0A0CM — the ICE BofA indices) | L2 — fail-closed on BOTH gates | "Copyrighted: pre-approval required" (T-16 scan 2026-10-24, D-44): FRED's legal page (read 2026-10-21) puts these series behind the PUBLISHER's written permission, which the owner's acceptance cannot grant. No card, no fetch, no display (private or public) until ICE permission is recorded — the OD-5 hy-oas/ig-oas honest no-go. | — (never displayed) | no (no fetch is wired) | never | https://fred.stlouisfed.org/legal/ |
| Australian Bureau of Statistics | L0 | Owner research 2026-10-16: CC BY 4.0. Re-read 2026-10-20: the copyright URL 404s to a plain fetch (JS-rendered); the site's navigation carries the "Creative commons" item (observed). Verbatim clause to be re-quoted at the quarterly review. | "Source: Australian Bureau of Statistics" | yes | yes | https://www.abs.gov.au/about/copyright-and-disclaimer |
| Reserve Bank of Australia | L0 | Owner research 2026-10-16: CC BY 4.0 for most material; commercial/personal use allowed if no RBA endorsement is implied. Re-read 2026-10-20: rba.gov.au answers 403 to this venue (Akamai — the GHA runner is the verified venue for RBA). Third-party content inside RBA tables needs that third party's consent. | "Source: Reserve Bank of Australia" | yes | yes | https://www.rba.gov.au/copyright/ |
| Bank of England (Bank Rate history page) | L2 | Legal page read 2026-10-25 (quoted verbatim): the Database's data is "subject to the terms of the UK Open Government Licence, allowing and encouraging free and flexible data reuse" — OGL v3.0, the attribution class (like CC BY). Bank Rate is the Bank's own series; only selected third-party-licensed exchange-rate series are excluded from the licence. The M6 Wave-4 probe fix (2026-10-25) rides D-42's OD-8 approval. | "Source: Bank of England (Bank Rate history)" | yes | yes | https://www.bankofengland.co.uk/legal |
| Yahoo Finance (unofficial endpoints) | L2 | No reuse licence offered for the unofficial quote endpoints (2026-10-16) — terms silent on automated reuse; owner accepted 2026-10-17. Every leg fetches with the declared honest UA and fails closed on a refusal (F-09/T-25/T-27). | "Data: Yahoo Finance" | yes | no (owner directive 2026-10-19e lifts the four price tiles only — recorded in the generator, re-confirmed quarterly) | https://finance.yahoo.com/ |
| gold-api.com | L0 | Terms read 2026-10-16: "Commercial use of the API is always permitted, including use in web applications…" (§9); no attribution clause found (shown by choice); "as is", no accuracy warranty (§5–6); may change without notice (§11). | "Data: gold-api.com" | yes | yes | https://gold-api.com/terms |
| World Bank (Commodity Markets "Pink Sheet") | L1 | Terms-of-use URL 404 to a plain fetch; the Data Catalog licence page presented a bot-check wall ("Just a moment…", 2026-10-20) — recorded blocked, not circumvented. CC BY 4.0 remains expected-not-quoted → fail closed publicly. | "Source: World Bank" | yes | unknown → treated as no | https://www.worldbank.org/en/about/legal/terms-of-use |
| Frankfurter (ECB reference rates) | L1 | frankfurter.dev/license (2026-10-20, HTTP 200): code is MIT; the ECB's own Terms link resolves to the ECB disclaimer — quoted: "Our goal is to keep this information timely and accurate. However, the ECB accepts no responsibility or liability whatsoever with regard to the material on this website… the euro foreign exchange reference rates and other price information published on this website are based on sources which the ECB considers to be reliable, the ECB accepts no responsibility or liability for any loss…". No reuse prohibition found; the explicit reuse-permission clause still unquoted → fail closed publicly until then. | "Source: European Central Bank (reference rates via Frankfurter)" | yes | unknown → treated as no | https://frankfurter.dev/license/ |
| ECB Data Portal | L1 | The Data Portal terms page is JS-rendered (not quoted, 2026-10-16); the ECB site disclaimer (2026-10-20, quoted above) neither prohibits nor grants reuse → fail closed publicly. | "Source: European Central Bank" | yes | unknown → treated as no | https://data.ecb.europa.eu/ |
| EODHD (world stock markets) | L2 | Personal plan (2026-10-16): covers the owner's own dashboard; serving to others is redistribution. Owner accepted 2026-10-17. | "Data: EODHD" | yes | no | https://eodhd.com/ |
| Bitstamp (BTC history cross-check) | L1 | Public API; site terms not quoted in a plain fetch (2026-10-16) → private cross-check only. | "Source: Bitstamp" | yes | unknown → treated as no | https://www.bitstamp.net/ |
| Alternative.me (Crypto Fear and Greed) | L0 | "…may be displayed freely when attribution is given right next to the display of the data" (read 2026-10-16). | "Source: Alternative.me Crypto Fear and Greed Index" | yes | yes | https://alternative.me/crypto/fear-and-greed-index/ |
| China NBS (English press releases) | L1 | NBS Terms of Service (read 2026-10-26, stats.gov.cn/english/nbs/200701/t20070104_59236.html): "Welcome to reprint or quote the contents of this website" with the attribution line, and Section III Use of data item 1: "You are allowed to download and use the statistical data on this website." — the publisher's own affirmative permissions for attributed quotation + download; conditions kept (good-faith quoting, no distortion — values verbatim, attribution on the cards). Supersedes the M1-era "no prohibition found" display reading. | "Source: National Bureau of Statistics of China" | yes | yes (2026-10-23 D-42/OD-2 china-pmi; 2026-10-26 M7 the automated fetch + china-cpi) | https://www.stats.gov.cn/english/nbs/200701/t20070104_59236.html |
| Robert Shiller (Yale) dataset | L2 | Open academic data, attribution expected, no formal reuse terms found (2026-10-16). Owner accepted 2026-10-23 (D-42/OD-1): displayed with the attribution card, every download archived (FS-06), values shown verbatim (never recomputed). Terms re-read 2026-10-23. | "Data: Robert Shiller, Yale" | yes | yes (2026-10-23, D-42/OD-1) | https://shillerdata.com/ |
| U.S. Treasury TIC (SLT tables) | L0 | US government work — public domain (17 U.S.C. § 105); read 2026-10-31 (gap-closure S2-M2.1). The SLT tables (`slt_table5.txt`, `slt_table3.txt` on ticdata.treasury.gov) are Treasury's own published data; Table 3's footer carries the custody caveat (quoted verbatim in `sources.ts` `us-tic`). Machine twin: provider `tic`. | "Source: U.S. Department of the Treasury, Treasury International Capital (TIC) System" | yes | yes | https://home.treasury.gov/data/treasury-international-capital-tic-system |
| Federal Reserve Board (FEDS Notes EBP file) | L0 | US government work — public domain (17 U.S.C. § 105); read 2026-11-01 (gap-closure S3-M3.3). The EBP file (`ebp_csv.csv` on federalreserve.gov) is the Board's own published research data (the FEDS Notes excess-bond-premium model); the site carries the "An official website of the United States Government" banner and the CSV carries no copyright notice. Machine twin: provider `frb`. | "Source: Board of Governors of the Federal Reserve System" | yes | yes | https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv |
| U.S. Treasury OFR (OFR FSI file) | L0 | US government work — public domain (17 U.S.C. § 105); read 2026-11-01 (gap-closure S3-M3.3). The OFR is a bureau of the U.S. Treasury; the file (`financial-stress-index/data/fsi.csv`, DISCOVERED in M3.1 from the FSI page's own `fsi-indicator.js`) was read from the provider's own response: 10 documented columns, daily 2000-01-03 → 2026-10-28. Machine twin: provider `ofr`. | "Source: Office of Financial Research, U.S. Department of the Treasury" | yes | yes | https://www.financialresearch.gov/financial-stress-index/ |
| U.S. Treasury FiscalData (auctions_query API) | L0 | US government work — public domain (17 U.S.C. § 105); read 2026-11-01 (gap-closure S3-M3.5). The FiscalData API is Treasury's own public data service; the auctions_query dataset is the published Treasury-auction record. VENUE: the host is BLOCKED from Cloudflare Worker egress (timeout ×3 in the S1-M1.1 probe; a normal client gets 200 JSON in <1 s — 3.6 s / 803 KB measured 2026-11-01), so the GHA/Node venue is the ONLY production fetcher. Machine twin: provider `fiscaldata`. | "Source: U.S. Department of the Treasury, FiscalData" | yes | yes | https://api.fiscaldata.treasury.gov/ |

| CNN Fear & Greed | L3 — blocked | FS-01 discovery (2026-10-20): robots.txt does not disallow the page path but disallows /terms (terms unreadable honestly); the reported JSON endpoint answered HTTP 418 "I'm a teapot. You're a bot." to one honest request — BLOCKED. Never fetched; link out only (RULES 4.3). | "Source: CNN" | — | never (a block is a block; no override covers circumvention) | https://edition.cnn.com/markets/fear-and-greed |
| ASX RBA Rate Tracker | L3 — terms prohibit | FS-02 discovery (2026-10-20): the Terms of use prohibit verbatim "use any spider, screen scraper, robot, other similar software or device, or other similar process, to use or access the Site in any way whatsoever, including monitoring, downloading or copying any content on the Site" and redistribution "except as expressly provided for in these terms… or with ASX's prior written consent". Never fetched; link out only. | "Source: ASX" | — | never | https://www.asx.com.au/content/asx/home/legals/terms-of-use.html |
| Westpac–Melbourne Institute | L2 | Monthly press release public; automated-reuse terms not confirmed (2026-10-16) → M5 manual entry with expiry (F-24–F-27). NEW — disabled until the owner accepts. | "Source: Westpac–Melbourne Institute" | yes | no | https://www.melbourneinstitute.com/ |
| Currena engine (plain arithmetic from the sources above) | worst of legs | Own computation — inherits the upstream sources' terms; the E-01/LR-02 worst-leg walk decides every derived card. | — | yes | worst of legs | — |

## The page's own attribution surfaces (LR-04)

- Every card's details panel names its source ("Source: …" with a link); the
  v3 UI-20 meta row puts the source link on the card face (Phase 6).
- "About this data" lists every source with its attribution text (M-1).
- The full export carries the licence column per indicator, plus level,
  owner_accepts and enabled (E-23 v3).

## Rules this register enforces

1. Yahoo Finance (unofficial endpoints) — L2 under the owner's recorded
   acceptance; honest UA only; a refusal is a block and fails closed
   (E-01/LR-02, T-15, T-25, T-27). The 2026-10-19e owner directive lifts the
   public-display bar for exactly the four price tiles (brent, gold-usd,
   silver-usd, btc-usd) — NOT a terms re-verification; re-confirmed quarterly.
2. gold-api.com — commercial use permitted per their quoted §9 (L0);
   re-read at the quarterly review.
3. FRED series with a copyright notice — three classes since the 2026-10-21
   legal read + the 2026-10-24 scan: citation-required (© Cboe, NY Fed, U.
   Michigan…) display publicly WITH the "publisher via FRED" citation
   (T-16/licences.ts); the pre-approval class (the ICE BofA indices,
   D-44) fail-closes on both gates — no fetch, no display, private or
   public, until the publisher's permission is recorded.
4. ECB / World Bank / Frankfurter / Bitstamp — the reuse clauses could not
   be quoted in a plain fetch (JS-rendered or bot-checked; recorded 2026-10-20)
   → `unknown`, fail closed in public mode until read.
5. EODHD — personal plan, owner only; the world boards never go public as-is.
