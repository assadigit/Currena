/**
 * World currencies — the fx data check (spec build step 0).
 *
 * Calls BOTH providers for the eight quote currencies (the 10 pairs are
 * derived in code, so the pair table below computes the crosses from the
 * USD-side quotes), prints the latest value of each pair from each provider
 * side by side, and writes docs/specs/insights-world-currencies-data-check.md
 * (the committed step-0 artifact the spec's finish line asks for).
 *
 * This is a MANUAL script (like markets-data-check): it hits live providers
 * by design, is never part of the test suite, and writes NOTHING to KV.
 *
 * Run:  pnpm --filter @currena/insights fx-data-check
 */

import { writeFileSync } from 'node:fs';
import { fetchFrankfurterQuotes, fetchYahooQuotes, type FxQuoteSet } from '../src/fx/providers';
import { FX_QUOTE_CURRENCIES } from '../src/fx/providers';
import { FX_PAIRS, FX_HISTORY_DAYS } from '../src/fx/definitions';
import type { FxPairId } from '@currena/core';

const repoRoot = new URL('../../../', import.meta.url);
const outPath = new URL('./docs/specs/insights-world-currencies-data-check.md', repoRoot);

const from = new Date(Date.now() - (FX_HISTORY_DAYS + 10) * 86_400_000).toISOString().slice(0, 10);

console.log(`# fx data check — fetching both providers since ${from}`);
const [frankfurter, yahoo] = await Promise.all([
  fetchFrankfurterQuotes({ from }).then((r) => r.quotes).catch((err) => {
    console.error(`FRANKFURTER FAILED: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }),
  fetchYahooQuotes().then((r) => r.quotes).catch((err) => {
    console.error(`YAHOO FAILED: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }),
]);

/** The latest quote a provider served for a currency. */
const lastOf = (quotes: FxQuoteSet | undefined, ccy: keyof FxQuoteSet) => {
  const list = quotes?.[ccy];
  return list === undefined || list.length === 0 ? undefined : list[list.length - 1]!;
};

/** One pair's latest value from a quote set (the production derivations). */
function pairValue(quotes: FxQuoteSet | undefined, id: FxPairId): { value: number; date: string } | undefined {
  if (quotes === undefined) return undefined;
  const usd = (ccy: string) => lastOf(quotes, ccy as keyof FxQuoteSet);
  switch (id) {
    case 'usdjpy': {
      const q = usd('JPY');
      return q && { value: q.value, date: q.date };
    }
    case 'usdchf': {
      const q = usd('CHF');
      return q && { value: q.value, date: q.date };
    }
    case 'usdcny': {
      const q = usd('CNY');
      return q && { value: q.value, date: q.date };
    }
    case 'eurusd': {
      const q = usd('EUR');
      return q && q.value > 0 ? { value: 1 / q.value, date: q.date } : undefined;
    }
    case 'gbpusd': {
      const q = usd('GBP');
      return q && q.value > 0 ? { value: 1 / q.value, date: q.date } : undefined;
    }
    case 'audusd': {
      const q = usd('AUD');
      return q && q.value > 0 ? { value: 1 / q.value, date: q.date } : undefined;
    }
    case 'audjpy': {
      const jpy = usd('JPY');
      const aud = usd('AUD');
      return jpy && aud && aud.value > 0 ? { value: jpy.value / aud.value, date: jpy.date } : undefined;
    }
    case 'eurjpy': {
      const jpy = usd('JPY');
      const eur = usd('EUR');
      return jpy && eur && eur.value > 0 ? { value: jpy.value / eur.value, date: jpy.date } : undefined;
    }
    case 'eurchf': {
      const chf = usd('CHF');
      const eur = usd('EUR');
      return chf && eur && eur.value > 0 ? { value: chf.value / eur.value, date: chf.date } : undefined;
    }
    case 'audcny': {
      const cny = usd('CNY');
      const aud = usd('AUD');
      return cny && aud && aud.value > 0 ? { value: cny.value / aud.value, date: cny.date } : undefined;
    }
    default:
      return undefined;
  }
}

const rows: string[] = ['| Pair | Frankfurter (ECB) | Yahoo Finance | Agreement |', '|---|---|---|---|'];
let both = 0;
let agree = 0;
for (const pair of FX_PAIRS) {
  const f = pairValue(frankfurter, pair.id);
  const y = pairValue(yahoo, pair.id);
  const fmt = (v: { value: number; date: string } | undefined): string =>
    v === undefined ? '—' : `${v.value.toFixed(4)} · ${v.date}`;
  let verdict = '—';
  if (f !== undefined && y !== undefined) {
    both++;
    const diffPct = Math.abs((f.value - y.value) / y.value) * 100;
    if (diffPct <= 0.5) {
      agree++;
      verdict = diffPct <= 0.05 ? 'exact' : `within ${diffPct.toFixed(2)}%`;
    } else {
      verdict = `⚠ ${diffPct.toFixed(2)}% apart`;
    }
  }
  rows.push(`| ${pair.id} | ${fmt(f)} | ${fmt(y)} | ${verdict} |`);
}

const currenciesRow = FX_QUOTE_CURRENCIES.map((ccy) => {
  const f = lastOf(frankfurter, ccy);
  return `${ccy}: ${f ? f.value.toFixed(4) : '—'}`;
}).join(' · ');

const md = `# World currencies — provider data check (build step 0)

**Run:** ${new Date().toISOString()} · spec §11 step 0 · committed as the step-0 acceptance artifact.

## The 10 pairs, both providers side by side

The crosses (AUD/JPY, EUR/JPY, EUR/CHF, EUR/GBP) are computed from each provider's own USD-side quotes — exactly what the production engine does (compute.ts derives crosses in code; a provider is never asked for a cross).

${rows.join('\n')}

**Summary:** ${both} of 10 pairs answered by both providers; ${agree} agree within the 0.5% validation rule (V5).

## The raw currency quotes (Frankfurter, the production primary)

${currenciesRow}

## Provider roles in production

- **Frankfurter v1 (primary):** ONE whole-currency timeseries call per run covers all 8 quote currencies; the frozen ECB-only API the spec pinned.
- **Yahoo Finance (fallback):** 8 chart calls, used only when the primary fails or a >5% one-day move needs a second voice (V5 — both providers must agree within 0.5% before a big move is believed).
`;

writeFileSync(outPath, md);
console.log(rows.join('\n'));
console.log(`\nBoth providers answered ${both}/10 · within-0.5% ${agree}`);
console.log(`Written: ${outPath.pathname}`);
