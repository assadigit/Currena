# World currencies — provider data check (build step 0)

**Run:** 2026-10-13T03:52:33.321Z · spec §11 step 0 · committed as the step-0 acceptance artifact.

## The 10 pairs, both providers side by side

The crosses (AUD/JPY, EUR/JPY, EUR/CHF, EUR/GBP) are computed from each provider's own USD-side quotes — exactly what the production engine does (compute.ts derives crosses in code; a provider is never asked for a cross).

| Pair | Frankfurter (ECB) | Yahoo Finance | Agreement |
|---|---|---|---|
| eurusd | 1.1181 · 2026-10-12 | 1.1176 · 2026-10-13 | exact |
| usdjpy | 158.6000 · 2026-10-12 | 158.2950 · 2026-10-13 | within 0.19% |
| gbpusd | 1.3235 · 2026-10-12 | 1.3219 · 2026-10-13 | within 0.13% |
| usdchf | 0.8328 · 2026-10-12 | 0.8332 · 2026-10-13 | exact |
| usdcny | 6.6928 · 2026-10-12 | 6.6952 · 2026-10-13 | exact |
| audusd | 0.6974 · 2026-10-12 | 0.6961 · 2026-10-13 | within 0.18% |
| audjpy | 110.6074 · 2026-10-12 | 110.1949 · 2026-10-13 | within 0.37% |
| eurjpy | 177.3315 · 2026-10-12 | 176.9054 · 2026-10-13 | within 0.24% |
| eurchf | 0.9312 · 2026-10-12 | 0.9311 · 2026-10-13 | exact |
| audcny | 4.6676 · 2026-10-12 | 4.6608 · 2026-10-13 | within 0.15% |

**Summary:** 10 of 10 pairs answered by both providers; 10 agree within the 0.5% validation rule (V5).

## The raw currency quotes (Frankfurter, the production primary)

EUR: 0.8944 · JPY: 158.6000 · GBP: 0.7556 · CHF: 0.8328 · CNY: 6.6928 · AUD: 1.4339 · CAD: 1.4262 · SEK: 10.0139

## Provider roles in production

- **Frankfurter v1 (primary):** ONE whole-currency timeseries call per run covers all 8 quote currencies; the frozen ECB-only API the spec pinned.
- **Yahoo Finance (fallback):** 8 chart calls, used only when the primary fails or a >5% one-day move needs a second voice (V5 — both providers must agree within 0.5% before a big move is believed).

## KV usage (§5 rule 9 — to be recorded after one week live)

`insights:fx:v1` went live 2026-10-13. The job's write-only-if-changed gate (content hash, never generatedAt) targets ≤1 write/day, zero on unchanged days. To be recorded at the one-week mark (2026-10-20).
