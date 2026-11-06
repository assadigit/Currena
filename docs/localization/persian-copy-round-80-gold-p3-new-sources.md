# Persian copy round 80 — the GF-P3 new free sources (2026-11-06)

**The GF-P3 session (GF-S9, 2026-11-06)** of the gold meter gap-fill program
landed seven new gold-meter indicators: four FRED-sourced voter-candidates
(R2 `real-yield-5y` · D2 `dollar-broad` · D9 `dollar-eme` · S9 `bank-stress`)
+ three WGC/official-flows context cards (F3 `wgc-etf-holdings` · F4
`wgc-cb-demand` · F13 `official-gold-demand`). Each carries the full
`IndicatorCopyEntry` shape (name · oneLiner · lines.{highRising,highEasing,
typical,low} · whatItIs · whyItMatters · tendedToMean · cantTell · forYou)
in both EN and FA — 77 new Persian strings total (7 ids × 11 fields).

**The discipline (D-GF-3, no forecasting):** the voter cards describe
**conditions/mechanisms** with hedged language ("usually tightens
conditions", "tends to pressure"); the context cards are state-descriptive
with no voting-pressure lines, each explicitly disclaiming price direction
in `cantTell` ("voting in no gauge", "say nothing about price direction").
`bank-stress` never mentions gold (the `nfci`/`stress-stlfsi` precedent —
polarity is applied in `definitions.ts`, not user copy). The FA copy is
natural Persian (not machine-translated), Persian digits throughout, ZWNJ
correct, the terminology glossary respected.

**Triage:** all 77 strings reviewed + approved this round (copy:audit clean
save the manifest triage recorded here). The reference for the manifest's
`--reference` field: this file.
