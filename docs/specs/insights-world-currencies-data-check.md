# World currencies — provider data check (build step 0)

**Run:** 2026-10-21T11:50:56.760Z · spec §11 step 0 · committed as the step-0 acceptance artifact.

## The 10 pairs, both providers side by side

The crosses (AUD/JPY, EUR/JPY, EUR/CHF, EUR/GBP) are computed from each provider's own USD-side quotes — exactly what the production engine does (compute.ts derives crosses in code; a provider is never asked for a cross).

| Pair | Frankfurter (ECB) | Yahoo Finance | Agreement |
|---|---|---|---|
| eurusd | 1.1215 · 2026-10-20 | 1.1236 · 2026-10-21 | within 0.19% |
| usdjpy | 158.1300 · 2026-10-20 | 157.9450 · 2026-10-21 | within 0.12% |
| gbpusd | 1.3347 · 2026-10-20 | 1.3400 · 2026-10-21 | within 0.40% |
| usdchf | 0.8236 · 2026-10-20 | 0.8244 · 2026-10-21 | within 0.10% |
| usdcny | 6.6780 · 2026-10-20 | 6.6644 · 2026-10-21 | within 0.20% |
| audusd | 0.6985 · 2026-10-20 | 0.7034 · 2026-10-21 | ⚠ 0.71% apart |
| audjpy | 110.4491 · 2026-10-20 | 111.1037 · 2026-10-21 | ⚠ 0.59% apart |
| eurjpy | 177.3434 · 2026-10-20 | 177.4663 · 2026-10-21 | within 0.07% |
| eurchf | 0.9237 · 2026-10-20 | 0.9263 · 2026-10-21 | within 0.28% |
| audcny | 4.6644 · 2026-10-20 | 4.6880 · 2026-10-21 | ⚠ 0.50% apart |

**Summary:** 10 of 10 pairs answered by both providers; 7 agree within the 0.5% validation rule (V5).

## The raw currency quotes (Frankfurter, the production primary)

EUR: 0.8917 · JPY: 158.1300 · GBP: 0.7492 · CHF: 0.8236 · CNY: 6.6780 · AUD: 1.4317 · CAD: 1.4051 · SEK: 9.9180

## Provider roles in production

- **Frankfurter v1 (primary):** ONE whole-currency timeseries call per run covers all 8 quote currencies; the frozen ECB-only API the spec pinned.
- **Yahoo Finance (fallback):** 8 chart calls, used only when the primary fails or a >5% one-day move needs a second voice (V5 — both providers must agree within 0.5% before a big move is believed).
