/**
 * NBS China property/steel backfill — gap-closure S6-M6.2 (2026-11-02).
 *
 * One-off history seeder for `china-property-investment` +
 * `china-steel-output`: walks the NBS English press-release index back
 * over the given months, fetches every monthly release pair (the same
 * dedicated releases the rung-2 21st-25th window gate reads), parses them
 * with the PRODUCTION parsers (adapters/nbs.ts — the venues cannot
 * drift), and writes the two `insights:hist:*` keys through the
 * Cloudflare REST API (the markets-au-run Path-B pattern).
 *
 * Why: each NBS release carries only its own month, and the rung's window
 * gate lands one point per month going forward — the committed backfill
 * gives the two cards real history for trends from day one (the china-cpi
 * committed-seed discipline, KV-native this time).
 *
 * Modes:
 *   default   walk + parse + report only (no writes)
 *   --write   also write the two history keys via the Cloudflare REST API
 *   --months N  how many months back to walk (default 16)
 *
 * Environment (with --write):
 *   CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · INSIGHTS_KV_NAMESPACE_ID
 *
 * Manual:
 *   pnpm --filter @currena/insights nbs-backfill
 *   pnpm --filter @currena/insights nbs-backfill --write
 */

import {
  latestIndustrialProductionRelease,
  latestRealEstateRelease,
  parseNbsPressIndex,
  parseNbsIndustrialProductionRelease,
  parseNbsRealEstateRelease,
  type NbsReleaseLink,
} from '../src/adapters/nbs';
import { buildHistoryFile, historyToSeries } from '../src/adapters/snapshot';
import type { SeriesPoint } from '../src/series';

const args = process.argv.slice(2);
const write = args.includes('--write');
const monthsArg = args.find((a) => a.startsWith('--months='));
const months = monthsArg !== undefined ? Number(monthsArg.slice(9)) : 16;

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.INSIGHTS_KV_NAMESPACE_ID ?? '4627ac33a4b148ff9fc2189266b1890e';

if (write && (!API_TOKEN || !ACCOUNT_ID || !NAMESPACE_ID)) {
  console.error('\n[nbs-backfill] FATAL: --write needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID.');
  process.exit(1);
}

/** Fetch text with a polite pause (the portwatch discipline: the host 400s rapid successive queries). */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': 'currena-insights/1.0 (+https://currena.ir)' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** The index page URLs: page 1 = PressRelease/, page N = index_{N-1}.html. */
function indexPageUrl(page: number): string {
  return page === 1
    ? 'https://www.stats.gov.cn/english/PressRelease/'
    : `https://www.stats.gov.cn/english/PressRelease/index_${page - 1}.html`;
}

const MONTHS: Readonly<Record<string, number>> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

/** (year, month) from a release title, for sorting + the depth cutoff —
 *  covers all the verified title forms (the 2026 "from January to <Month>
 *  (in) <Year>", the 2025 "for January-<Month> <Year>", the annual
 *  "for <Year>" and the industrial "Operation in <Month> <Year>"). */
function titleMonth(title: string): { year: number; month: number } | undefined {
  const re = /(?:from January to ([A-Z][a-z]+) (?:in )?|for January-([A-Z][a-z]+) |for |Operation in )([A-Z][a-z]+ )?(\d{4})$/;
  const m = re.exec(title);
  if (m === null) return undefined;
  const monthName = m[1] ?? m[2] ?? m[3]?.trim() ?? 'December';
  const month = MONTHS[monthName];
  const year = Number(m[4]);
  return month === undefined || !Number.isFinite(year) ? undefined : { year, month };
}

async function main(): Promise<void> {
  console.log(`[nbs-backfill] walking the NBS English press-release index (${months} months back)…`);

  // 1. Walk the index pages until both series' releases stop appearing or
  //    the depth is well past the target.
  const realEstateLinks = new Map<string, NbsReleaseLink>();
  const industrialLinks = new Map<string, NbsReleaseLink>();
  let emptyPages = 0;
  for (let page = 1; page <= 20 && emptyPages < 3; page++) {
    const url = indexPageUrl(page);
    let html: string;
    try {
      html = await fetchText(url);
    } catch (err) {
      console.error(`[nbs-backfill] index page ${page} failed: ${(err as Error).message} — stopping the walk`);
      break;
    }
    const links = parseNbsPressIndex(html, 'https://www.stats.gov.cn/english/PressRelease/');
    const re = latestRealEstateRelease(links);
    const ip = latestIndustrialProductionRelease(links);
    const before = realEstateLinks.size + industrialLinks.size;
    if (re !== undefined) realEstateLinks.set(re.title, re);
    if (ip !== undefined) industrialLinks.set(ip.title, ip);
    const gained = realEstateLinks.size + industrialLinks.size - before;
    console.log(`  index page ${page}: ${links.length} releases — real-estate ${re?.title ?? '—'} · industrial ${ip?.title ?? '—'}`);
    if (gained === 0) emptyPages++;
    await sleep(1_500);
  }

  // 2. Depth cutoff: keep releases within the target months of "now".
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  const inWindow = (l: NbsReleaseLink): boolean => {
    const tm = titleMonth(l.title);
    return tm !== undefined && Date.UTC(tm.year, tm.month, 1) >= cutoff.getTime();
  };
  const reSorted = [...realEstateLinks.values()].filter(inWindow).sort((a, b) => a.title.localeCompare(b.title));
  const ipSorted = [...industrialLinks.values()].filter(inWindow).sort((a, b) => a.title.localeCompare(b.title));
  console.log(`[nbs-backfill] ${reSorted.length} real-estate + ${ipSorted.length} industrial-production releases in the window`);

  // 3. Fetch + parse each release with the PRODUCTION parsers.
  const property: SeriesPoint[] = [];
  const steel: SeriesPoint[] = [];
  const failures: string[] = [];
  for (const l of reSorted) {
    try {
      const pts = parseNbsRealEstateRelease(await fetchText(l.url));
      property.push(...pts);
      console.log(`  ✅ property ${l.title} → ${pts[0]!.date} ${pts[0]!.value}`);
    } catch (err) {
      failures.push(`property ${l.title}: ${(err as Error).message}`);
      console.error(`  ❌ property ${l.title}: ${(err as Error).message}`);
    }
    await sleep(1_200);
  }
  for (const l of ipSorted) {
    try {
      const pts = parseNbsIndustrialProductionRelease(await fetchText(l.url));
      steel.push(...pts);
      console.log(`  ✅ steel ${l.title} → ${pts[0]!.date} ${pts[0]!.value}`);
    } catch (err) {
      failures.push(`steel ${l.title}: ${(err as Error).message}`);
      console.error(`  ❌ steel ${l.title}: ${(err as Error).message}`);
    }
    await sleep(1_200);
  }
  property.sort((a, b) => (a.date < b.date ? -1 : 1));
  steel.sort((a, b) => (a.date < b.date ? -1 : 1));
  console.log(`\n[nbs-backfill] china-property-investment: ${property.length} points (${property[0]?.date} → ${property.at(-1)?.date})`);
  console.log(`[nbs-backfill] china-steel-output: ${steel.length} points (${steel[0]?.date} → ${steel.at(-1)?.date})`);
  if (failures.length > 0) console.warn(`[nbs-backfill] ${failures.length} parse failures (recorded above)`);

  // 4. Build the history files (the exact production shape) + verify round-trips.
  const writes: Array<{ id: 'china-property-investment' | 'china-steel-output'; series: SeriesPoint[] }> = [
    { id: 'china-property-investment', series: property },
    { id: 'china-steel-output', series: steel },
  ];
  for (const w of writes) {
    const history = buildHistoryFile(w.id, w.series);
    if (history === undefined) {
      console.error(`[nbs-backfill] ${w.id}: fewer than 2 points — nothing to write`);
      continue;
    }
    const roundTrip = historyToSeries(history);
    // the round-trip must preserve the endpoints exactly (the downsample
    // may stride interior points; the last point is always the latest obs)
    if (roundTrip.at(-1)?.date !== w.series.at(-1)?.date || roundTrip.at(-1)?.value !== w.series.at(-1)?.value) {
      console.error(`[nbs-backfill] ${w.id}: round-trip endpoint mismatch — refusing to write`);
      continue;
    }
    console.log(`  ${w.id}: ${history.points.length} stored points (${roundTrip[0]?.date} → ${roundTrip.at(-1)?.date})`);
    if (write && API_TOKEN !== undefined && ACCOUNT_ID !== undefined) {
      const body = JSON.stringify(history);
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/insights:hist:${w.id}`,
        {
          method: 'PUT',
          headers: { authorization: `Bearer ${API_TOKEN}`, 'content-type': 'application/json' },
          body,
        },
      );
      const json = (await res.json()) as { success?: boolean; errors?: unknown };
      if (!res.ok || json.success !== true) {
        console.error(`  ❌ ${w.id}: KV write failed — ${JSON.stringify(json.errors)}`);
      } else {
        console.log(`  ✍ insights:hist:${w.id} written`);
      }
      await sleep(600);
    }
  }

  // 5. The evidence file for the milestone record.
  const evidence = {
    walkedOn: new Date().toISOString(),
    monthsTarget: months,
    realEstateReleases: reSorted.map((l) => ({ title: l.title, published: l.published, url: l.url })),
    industrialProductionReleases: ipSorted.map((l) => ({ title: l.title, published: l.published, url: l.url })),
    parseFailures: failures,
    chinaPropertyInvestment: property,
    chinaSteelOutput: steel,
  };
  console.log(JSON.stringify(evidence, null, 2));
  if (!write) console.log('\n[nbs-backfill] DRY RUN — no KV writes.');
}

void main();
