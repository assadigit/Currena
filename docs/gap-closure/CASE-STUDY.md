# Currena Insights — the gap-closure case study

**Written 2026-11-03 at the close of the six-session gap-closure program
(S1→S6, 37 milestones). Factual throughout: every number below is
reproducible from the repository (the registry, the pin tests, the
evidence folders) and nothing is claimed that was not verified.**

## The problem

The owner wanted a page that gives a reliable, bilingual (English +
Farsi) feel for world economic health — US-centred, Australia in depth,
other regions only as far as they explain the world — **without needing
to read the news**. A 2026-10-31 gap analysis of the existing Insights
page found 37 milestones' worth of holes: who actually holds and trades
US government debt; credit and funding stress; fiscal and Treasury
supply; real-time growth signals; geopolitics and supply chains;
Australian macro depth and an Australian markets board; the New Zealand
link, China's property/steel complex, and the de-dollarization story.
The page also had an honesty problem the analysis surfaced first: stale
Australian voters presented as current.

The constraint set was unforgiving and chosen deliberately: the
**Cloudflare free tier** (1,000 KV writes/day, 50 subrequests per cron
invocation, **five cron triggers total on the account**), a
**licence-clean source policy** (every source's terms read and quoted
verbatim before first fetch; blocked or unclear terms mean the source is
never fetched, never worked around), and a rule that **nothing existing
is ever removed** (G-3) and **nothing new is scored until it has earned
a vote** (G-5).

## The design principles

1. **Honesty before coverage.** A reading that cannot be computed shows
   "Can't tell right now" — never a stale number dressed as fresh, never
   a silent zero. Every card carries its own data date, update time and
   source link. The 2026-11-02 KV write-cap exhaustion is visible in the
   record exactly as it happened: the cards showed the honest pending
   face until the designed bootstrap healed them.
2. **Plain language, two languages.** Layer 1 asks twelve questions in
   house vocabulary ("Are the giants carrying the market?"). The Farsi
   is a first-class translation with its own terminology dictionary, its
   own copy-audit tooling (6,597 manifest entries, 75 review rounds),
   Persian digits, RTL layout, and a no-advice wording rule enforced by
   test (no "buy/sell/hold" in any string, either language).
3. **Shadow-mode scoring.** Gauges answer questions by counting member
   votes, but a new indicator never votes until a measured evaluation
   says its warning state actually precedes the outcome its gauge is
   about. For three years of sessions that meant **48 voters, unchanged,
   while 59 new indicators landed as context rows** — live values, plain
   readings, no verdict power.
4. **Provider-exact numbers.** Nothing is computed that the provider did
   not publish: the 70-city home-price aggregate was rejected because
   the NBS publishes per-city tables only (a mean would be our
   calculation, not theirs). Parsers fail closed on every identity
   dimension — a layout change reads as a loud error, never as "no
   data".

## The constraints in practice

- **The cron ceiling.** Five cron triggers per account, already spent:
  one minute-cron on the API worker (every rung gates inside it by
  UTC hour:minute — the 04:10 main ingest, 04:20 rung-2, the 04:25/
  04:27 history phases, 04:30/04:35 rungs 3-4, the hourly narrator and
  prices turns) and four on the markets worker. A new cadence never
  means a new cron — the COFER quarterly rides a Saturday gate inside
  the existing rung-2.
- **The KV budget.** ~89 writes/day typical against the 1,000 cap; the
  writes are read-compared (only changed keys are written) and the
  account hit the cap exactly once in the program's history — recorded,
  root-caused, and designed around (the bootstrap heals a capped day by
  itself).
- **The subrequest ceiling.** 50 per cron invocation: the main rung
  runs ~47/50 and is closed to additions; the gap-closure work built
  three more rungs with their own budgets (rung-2 ~8–44 depending on
  the day's gates, rung-3 45/50, rung-4 45/50) and an "add an id inside
  an existing request" discipline (the Italy 10-year leg joined the
  Germany mirror's bulk group — zero new fetches for a whole new card).
- **Licences.** 34 register rows: 29 live (each with its terms quoted
  verbatim, its licence level, and its display permission recorded) and
  5 honestly rejected — the ASX rate tracker (terms prohibit scraping),
  CNN Fear & Greed (the endpoint answers "I'm a teapot. You're a bot."),
  the Westpac–Melbourne Institute survey and the NAB survey (awaiting
  owner decisions), and the ICE BofA credit-spread series (FRED's
  copyright-pre-approval tag).

## Before and after

| | 2026-10-31 (before S1) | 2026-11-03 (after S6) |
|---|---|---|
| Indicators | 102 | **161** (+59, all context-only) |
| Scored voters | 48 | 48 (unchanged by design — the promotion proposal below is the owner's pending decision) |
| Question lanes | 8 voting + the prices strip | 8 voting + **3 shadow gauges** (geopolitical fragmentation, Australian activity, Australian external) + the prices strip |
| Markets boards | 1 (16 world indices) | 2 (the world board + **the Australian board: 18 ASX indices + the S&P/NZX 50**) |
| Source register rows | 27 | **34** (29 live incl. 7 new providers: Treasury TIC, NY Fed, IMF PortWatch, Fed Board EBP, OFR, Treasury FiscalData, IMF COFER; 5 rejected with recorded reasons) |
| Public dataset endpoints | 4 | 6 (+ the Treasury-holders composite, + the Australian markets board) |
| Tests | 10,296 | **14,508** |
| Languages | EN + fa (fa partial) | EN + fa (6,597 audited strings; 75 review rounds) |

The headline features the program shipped: the **"Who holds US
government debt"** section (top-20 foreign holders + Australia, 24
months, holdings vs net transactions vs valuation separated); the
**geopolitical fragmentation gauge** (five shipping-chokepoint transits
from the IMF's own PortWatch data, the GSCPI, the Strategic Petroleum
Reserve); the **Australian depth** (eight ABS macro series, an
18-index ASX board, the money-panel housing drivers); and the
**de-dollarization lens** (the IMF COFER dollar share beside the
Treasury flows, the S&P concentration proxy, the Italy–Germany spread).

## Three decisions worth telling

### 1. Separating real selling from price effects (the Treasury table)

When a country's Treasury holdings fall, the news-reading instinct says
"selling". But holdings can fall because the bonds themselves lost
market value. The Treasury-holders section (S2) therefore publishes
three separated series — holdings, **net transactions**, and the
valuation effect — and the copy never conflates them. The same
discipline runs through the whole page: changes are labelled in the
series' own units, "since previous release" vs "30-day" are distinct
labels, and a reader can always see which is which.

### 2. Refusing to score unproven indicators (shadow mode, and the promotion bar)

Every one of the 59 new indicators landed without a vote. At the
program's close (S6-M6.4) a backtest harness — the same discipline the
repo's own gold program used to conclude its 21-voter table had **no
measurable edge** — evaluated 15 shadow candidates against the outcomes
their gauges are about: does the warning state actually precede the
drawdown, the unemployment rise, the inflation surprise? Two cleared
the bar (the Chicago Fed's activity index: 68.5% of its warnings
followed by a unemployment rise within a year, vs a 20.8% base rate;
the Excess Bond Premium: 30.4% vs 16.9% for equity drawdowns). The
other thirteen stayed context — including the honest negatives:
the Shiller CAPE has no measurable 12-month edge (0.84 lift — and it
sits in its decade's top decile today, which would have been a false
alarm), and Suez transit collapses have coincided with *calm* oil, not
shocks (0.35). **The proposal sits with the owner; nothing was promoted
without approval.** The refusal is the feature: a gauge that counts
votes from unproven members is theater.

### 3. Rejecting sources that failed the reliability bar

The record of things we did NOT build is as long as the list of things
we did. The NBS's 70-city home-price release is per-city tables only —
no aggregate, so no `china-home-prices` card (a 70-city mean would be
our own statistic wearing the NBS's name). The RBNZ's own site blocks
the production venue, so the New Zealand short-rate card is named for
the honest mirror it reads (an OECD monthly average, labelled as such)
rather than pretending to be the Official Cash Rate. The ICE BofA
high-yield spread — the textbook credit-stress series — is absent
because FRED's own copyright tag requires pre-approval we do not have;
the Fed Board's Excess Bond Premium and the OFR's stress index (both
public domain) were built instead. Hormuz was rejected because the
provider's own transit series collapses in 2026-03. Each rejection is
recorded with the provider's own evidence, so a future session can
re-check rather than re-guess.

## Where the evidence lives

Every claim above traces to the repository: the registry
(`data/indicators.json`, generated + pin-tested), the licence register
(`docs/insights/LICENCES.md` + `sources.ts`), the verification record
(`docs/gap-closure/VERIFIED-SOURCES.md`), the promotion evaluation
(`docs/gap-closure/PROMOTION-PROPOSAL.md` + `evidence/M6.4/`), and the
screenshot sets (`docs/gap-closure/evidence/M6.1/`, `M6.2/`, `M6.5/` —
22 final-pass shots across 360/768/1200 px in both languages). The
session-by-session log with every commit, deploy and honest failure is
`docs/gap-closure/PROGRESS.md`.

## What is honestly unfinished

- **The push/deploy of the S6-M6.3 code and the three readings'
  landings** — the closing session lost its credentials mid-program;
  the commits are ready and the bootstrap paths are armed (recorded in
  PROGRESS.md's sixth claim note).
- **The owner's pending decisions:** the promotion list (cfnai + ebp),
  the two rebalancing questions, the Westpac-MI/NAB survey acceptance
  flags, and the credential rotation (the top open action item — every
  token pasted into the planning chats must be rotated).
- **The paid-plan ideas:** the Cloudflare paid plan would lift the
  subrequest ceiling; the EODHD paid plan would enable the pre-built
  companies table (both flagged, neither required for the page as it
  stands).
