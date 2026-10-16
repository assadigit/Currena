# LICENCES.md — the licence register (Step 3 §2.3 LR-01…LR-04)

The machine-readable register is `packages/insights/src/licences.ts` (one
`SourceLicence` per provider); FRED series are overridden per series by the
T-16 copyright scan (`data/fred-copyright.json`). The per-indicator verdicts
(worst upstream leg — defect E-01/LR-02) live in `data/indicator-audit.json`,
generated with the registry. This file is the human-readable twin; the date
each term was checked is in the register itself and below.

**Fail-closed discipline:** `public_display_ok: unknown` is treated as **no**
by the T-15 mode gate — an unverified source can never appear in public mode.
`private_ok` is yes for every entry (the page is private-first; the owner's
own use under each source's personal-use terms).

## The register

| Source | Licence | Required attribution | Private ok | Public display | Checked | Terms |
|---|---|---|---|---|---|---|
| FRED (Federal Reserve Bank of St. Louis) | Varies by series (FRED license tags) | `Source: FRED, Federal Reserve Bank of St. Louis` | yes | unknown | 2026-10-16 | https://fred.stlouisfed.org/legal/ |
| Australian Bureau of Statistics | CC BY 4.0 | `Source: Australian Bureau of Statistics` | yes | yes | 2026-10-16 | https://www.abs.gov.au/about/copyright-and-disclaimer |
| Reserve Bank of Australia | CC BY 4.0 (RBA terms for statistical tables) | `Source: Reserve Bank of Australia` | yes | yes | 2026-10-16 | https://www.rba.gov.au/copyright/ |
| Yahoo Finance (unofficial endpoints) | No reuse licence offered (unofficial endpoints) | — | yes | no | 2026-10-16 | https://finance.yahoo.com/ |
| gold-api.com | Free API — commercial use permitted (their ToS) | — | yes | yes | 2026-10-16 | https://gold-api.com/terms |
| World Bank (Commodity Markets "Pink Sheet") | Unknown (CC BY 4.0 expected, not quoted) | `Source: World Bank` | yes | unknown | 2026-10-16 | https://www.worldbank.org/en/about/legal/terms-of-use |
| Frankfurter (ECB reference rates) | ECB terms via the Frankfurter project (MIT code) | `Source: European Central Bank (reference rates via Frankfurter)` | yes | unknown | 2026-10-16 | https://frankfurter.dev/license/ |
| ECB Data Portal | ECB Data Portal terms (not verbatim-verified) | `Source: European Central Bank` | yes | unknown | 2026-10-16 | https://data.ecb.europa.eu/ |
| Manual entries (China NBS and others) | Publisher terms vary; entered by hand | `Source: National Bureau of Statistics of China` | yes | no | 2026-10-16 | — |
| EODHD (world stock markets) | Personal plan — owner only | — | yes | no | 2026-10-16 | https://eodhd.com/ |
| Bitstamp (BTC history gap-fill) | Public API; display terms not verbatim-verified | `Source: Bitstamp` | yes | unknown | 2026-10-16 | https://www.bitstamp.net/ |
| Alternative.me (Crypto Fear and Greed) | Free API — attribution next to the data | `Source: Alternative.me Crypto Fear and Greed Index` | yes | yes | 2026-10-16 | https://alternative.me/crypto/fear-and-greed-index/ |
| Robert Shiller (Yale) dataset | Open academic data — attribution; no formal reuse terms | `Source: Robert Shiller, Irrational Exuberance data (econ.yale.edu/~shiller)` | yes | no | 2026-10-16 | http://www.econ.yale.edu/~shiller/data.htm |
| Currena engine (plain arithmetic from the sources above) | Own computation — inherits the upstream sources’ terms | — | yes | unknown | 2026-10-16 | — |

## How each term was checked (the evidence trail)

- **FRED (Federal Reserve Bank of St. Louis)** — FRED carries a machine-readable license tag per series (fred.stlouisfed.org/legal/#copyright-<category>) — scanned 2026-10-16, records in data/fred-copyright.json; public-domain series may be public, citation-required series are private-only.
- **Australian Bureau of Statistics** — Step 3 spec §2.3 (owner research): CC BY 4.0, attribution kept; abs.gov.au copyright page carries a Creative Commons menu item (JS-heavy page, verbatim quote not captured — recorded, re-check at the quarterly licence review).
- **Reserve Bank of Australia** — Step 3 spec §2.3 (owner research): CC BY 4.0 for most material; commercial/personal use allowed if RBA endorsement is not implied. Third-party content INSIDE RBA tables needs that third party’s consent — re-check each table’s source notes at the quarterly review.
- **Yahoo Finance (unofficial endpoints)** — Yahoo offers no API terms for these unofficial quote endpoints; Step 3 §2.3 and defect E-01 classify them owner-only personal use. Never shown in public mode (T-15).
- **gold-api.com** — gold-api.com/terms read 2026-10-16: "Commercial use of the API is always permitted, including use in web applications…" (§9); no attribution clause found; service "as is", no accuracy warranty (§5–6); terms may change without notice (§11) — re-check at the quarterly review. (Closes defect E-02’s "terms unconfirmed".)
- **World Bank (Commodity Markets "Pink Sheet")** — World Bank Open Data terms are commonly CC BY 4.0, but the licence page could not be quoted verbatim on 2026-10-16 (JS-rendered) — marked unknown, fail closed in public mode until read in a browser.
- **Frankfurter (ECB reference rates)** — frankfurter.dev/license links the ECB disclaimer for the DATA; the ECB’s display terms could not be quoted verbatim on 2026-10-16 (JS-rendered pages) — unknown, fail closed in public mode until read in a browser. Attribution shown regardless.
- **ECB Data Portal** — The ECB Data Portal terms page is JS-rendered; the reuse clause could not be quoted on 2026-10-16 — unknown, fail closed in public mode until read in a browser.
- **Manual entries (China NBS and others)** — Manual entries carry no provider feed; defect E-08 requires entered_on/expiry bookkeeping. Public display blocked until each publisher’s reuse terms are read and recorded.
- **EODHD (world stock markets)** — Step 3 §2.3: personal plan covers owner-only dashboards; serving to others is redistribution. Never shown in public mode unless a display licence is bought.
- **Bitstamp (BTC history gap-fill)** — Public BTC/USD history endpoint; the site terms could not be quoted verbatim on 2026-10-16 — unknown, fail closed in public mode.
- **Alternative.me (Crypto Fear and Greed)** — alternative.me states the index may be displayed freely when "attribution is given right next to the display of the data" (read 2026-10-16). Attribution renders beside the card.
- **Robert Shiller (Yale) dataset** — Step 3 §2.3: open academic data, no formal commercial terms found — private mode only, archive every download (L1-14).
- **Currena engine (plain arithmetic from the sources above)** — Derived indicators (ratios, gaps, baskets, conversions) compute from the registered sources; their public-mode eligibility is the WORST of the legs (T-15 walks the inputs).

## The page's own attribution surfaces (LR-04)

- Every card's details panel names its source ("Source: …" with a link).
- "About this data" lists every source with its attribution text.
- The full export carries a Licence column per indicator (defect E-23).

## Rules this register enforces

1. Yahoo Finance (unofficial endpoints) — owner-only personal use; every use
   flagged `private_only`; never shown in public mode (E-01/LR-02, T-15).
2. gold-api.com — commercial use permitted per their terms §9 (read and
   quoted 2026-10-16; re-check at the quarterly review).
3. FRED series with a copyright notice (e.g. VIXCLS, Cboe data) — private
   mode only; public display needs the owner's written permission (P-5).
4. ECB / World Bank / Frankfurter / Bitstamp — terms pages could not be
   quoted verbatim on 2026-10-16 (JS-rendered) → `unknown`, fail closed in
   public mode until read in a browser.
5. EODHD — personal plan, owner only; the world-markets board can never go
   public as-is (the boards are entirely EODHD/Yahoo-backed).

