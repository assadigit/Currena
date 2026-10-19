# Currena Insights: Rules

These rules apply to every task in this package. If another file disagrees with this one, this one wins, except for `AGENT_RUNBOOK.md` on the order of work.

---

## 1. Owner decisions (recorded 2026-10-17, do not ask again)

| ID | Decision |
|---|---|
| D-1 | Currena is a **public, non-commercial** website. It is not monetised, and not planned to be in the mid-term. The owner uses the information for his own financial decisions. |
| D-2 | The page **stays public**. The owner accepts the legal risk of showing third-party data on it. |
| D-3 | The owner will **not ask providers for permission** (Cboe, Shiller, Melbourne Institute, ASX, CNN and others) and will **not pay for data**. |
| D-4 | The owner still wants practical risk kept as low as possible. The mitigations in section 3 are therefore required. |

The owner's acceptance is recorded in `RISK_REGISTER.md`. The agent never changes an acceptance flag for a new source on its own.

---

## 2. Source risk levels

Every data source gets a level in `RISK_REGISTER.md` and in the registry. The agent assigns the level from the provider's own terms (quoted in the register), never from memory.

| Level | Meaning | Examples | Treatment |
|---|---|---|---|
| **L0** | Public display clearly allowed (open licence, public domain, or a free API whose terms allow it with attribution). | RBA tables (CC BY, with attribution), ABS (CC BY 4.0), US government series on FRED without a copyright notice, Alternative.me (attribution) | Use. Show the required attribution. |
| **L1** | Probably fine for a non-commercial public site, but the terms are not explicit or need checking. | ECB reference rates via Frankfurter, World Bank | Use after the terms check. Record the lines read. |
| **L2** | Terms restrict public display, redistribution or automated access, or are unclear or unknown, **and the owner has accepted the risk**. | EODHD on a personal plan, Yahoo Finance, gold-api.com, Cboe VIX via FRED (copyright series), Shiller CAPE data | Use only if `owner_accepts = true` for that source. Show attribution. Apply every mitigation in section 3. Provide the kill switch. |
| **L3** | Terms **explicitly prohibit** automated access or reuse, `robots.txt` disallows the path, the source needs a login or payment, or the site blocks the request. | To be decided per source by the agent | **Never used.** Link out only. Only the owner can override, by editing `RISK_REGISTER.md` himself, and an override never covers circumvention (rule 4.3). |

Sources already live on 15 October 2026 (EODHD, Yahoo Finance, gold-api.com, Cboe VIX via FRED) are L2 and are covered by the owner's acceptance in D-2. New L2 sources start with `owner_accepts = false`. The agent builds them, leaves them disabled, and lists them in the report so the owner can flip the flag.

---

## 3. Mitigations required while the page is public

- [ ] **M-1 Attribution** next to every value from a source that requires or expects it. Show "Source: [publisher]" and a link. Never imply endorsement by the publisher.
- [ ] **M-2 Minimum data.** Public endpoints return only what the visible page needs (current value, the points of the visible chart, status). No bulk history endpoint for L2 sources. No full-series download for L2 sources.
- [ ] **M-3 Export tool is owner-only.** The "full export" feature must require the owner's token. It is not available to visitors.
- [ ] **M-4 Rate limiting** on every data endpoint, to stop bulk copying.
- [ ] **M-5 Panic switch.** A single setting `ACCESS_MODE = public | private` (default `public`). Setting it to `private` (or the environment variable `PANIC_PRIVATE=true`) makes every Insights data endpoint require login within one refresh cycle. Build and test this. It lets the owner react within minutes if a provider objects.
- [ ] **M-6 Per-source kill switch.** Each source has `enabled` in the registry. Setting it to false removes its cards on the next refresh.
- [ ] **M-7 Contact line.** "About this data" has a contact address or form for data owners to ask for removal. Use the owner's existing contact method on Currena; if none exists, record that in the report.
- [ ] **M-8 No advice.** All text follows the wording rules in section 5. The page says "General information only. Not financial advice." near the hero and in "About this data".
- [ ] **M-9 Terms record.** `LICENCES.md` keeps, for every source, the terms lines quoted, the date read, the level, and the attribution text.

---

## 4. Hard rules for the agent

### 4.1 Working
1. Work on your own. Do not ask questions. If something is ambiguous, choose the safest option, write the choice in the report, and continue.
2. Work on the branch `insights-rebuild`. Commit at the end of every phase. **Never deploy to production. Never push to the main branch.** Deploy only to a preview address if one exists.
3. Never print, log or commit secrets. Keep them in Cloudflare secrets or ignored local files. Never expose them to the browser.
4. Do not change anything outside the Insights feature unless a spec item requires it. Currena's other pages (converter, rates, matches) must not change.

### 4.2 Truth
1. Never invent a series ID, table name, URL, number, threshold, endpoint or licence term. Confirm each in the provider's own documentation or response. If you cannot (for example no network), mark it "not verified" and show "can't tell right now" or hide the card.
2. Never state a figure from memory as current.
3. Wrong or stale data must never look current. Stale, failed, duplicate or unverified inputs produce a stale tag or "can't tell right now", never a verdict.

### 4.3 Fetching (summary of `SCRAPING_SPEC.md`)
1. Use only the method ladder in `SCRAPING_SPEC.md`.
2. **Never circumvent a block.** No proxies, rotating IPs, spoofed browser identities, stealth or headless-browser evasion, CAPTCHA solving, or reuse of someone's login. A 403, 418, 429, bot-check page or login wall means "blocked", and the source becomes a link-out.
3. Never fetch pages behind a login or payment.
4. One request per source per refresh, a descriptive User-Agent, caching, no retry loops.

### 4.4 Engineering
1. Write tests first. A test for each defect must fail on the baseline fixtures and pass after the fix.
2. Stay inside the free Cloudflare limits. Combine history into few large KV keys. Split work across scheduled runs if one run would exceed the outside-request limit. Keep the existing refresh times (09:13 and 22:13 UTC). Report KV reads, KV writes and outside requests per full refresh.
3. Tick a checkbox only after you have implemented and verified the item. If an item still fails after three honest attempts, record it as blocked and continue.
4. Never leave the branch in a state where tests that passed before now fail.

---

## 5. Wording rules (every sentence shown to users)

- Describe conditions only. No forecasts. No "will", "should", "time to", "expected to".
- No buy, sell or hold language. No "bullish", "bearish", "undervalued", "overvalued", "opportunity".
- No claims about causes in the news ("because of the war"). Causes appear only in the "usual tendency" lines of relationship cards, written as tendencies ("when oil jumps, inflation expectations tend to rise").
- Plain language. A regular person should understand each line without a glossary. Use the words in `GLOSSARY.md`.
- Show what a number measures, who publishes it, and when.

## 6. Data display rules

- Units: percentage points for rates, inflation, yields, spreads, unemployment. % only for prices and indexes.
- Rounding: prices to a sensible precision for the asset; rates to 2 decimals; percentages to 1 decimal.
- Dates: show the **data date** (and the quarter name for quarterly series), the **published date** where it matters (for example the CPI release day), and the **fetched time in UTC**.
- Same-date rule: a spread or ratio uses values of the same date. If dates differ, show both dates and say so.
- Stale ages: daily series 4 days, weekly 10 days, monthly 45 days, quarterly 120 days, manual entry until the next scheduled release.
- Peaks and "highest since" use one stated basis (closing prices) over the full stored history.

## 7. Australia-specific rules

- The owner is not a licensed financial adviser. The page gives general information only. It never says what a person should do with their money.
- The "Know before you buy US shares" box shows only text approved by an Australian tax professional (placed in `docs/insights/approved-text/`). Until then it shows only the exchange-rate and fees lines.
- Show Australian context first wherever a global indicator affects Australia (oil, the US dollar, China, US yields).
