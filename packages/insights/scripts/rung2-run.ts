/**
 * Rung-2 manual phase runner — gap-closure S6-M6.2 (2026-11-02).
 *
 * Runs the PRODUCTION rung-2 phase (runInsightsRung2Phase — the venues
 * cannot drift) against the live store through the Cloudflare REST API
 * (RestInsightsStore), with an explicit fetch plan. This is the landing
 * lever for a post-deploy family whose stage entry does not exist yet:
 * the S6-M6.2 China pair landed its histories via `nbs-backfill --write`,
 * so the Node inline plan's history-based bootstrap will NOT arm, and the
 * Worker venue's own 04:20 UTC phase can be up to a day away — this
 * runner executes the identical phase immediately (the markets-au-run
 * "Path B" pattern, applied to the insights snapshot family).
 *
 * Flags (plan gates — at least one required, else the runner refuses):
 *   --nbs         the NBS dedicated releases (china-property-investment +
 *                 china-steel-output; 1 index page + 2 release pages)
 *   --nz          the NZ monthly mirrors (OECD short rate + FRED NZ 10y)
 *   --monthly     the monthly trio (OECD CLI + GPR + EPU + TPU + GSCPI)
 *   --mof         the MOF daily file
 *   --eia         the weekly EIA pages (Saturday gate family)
 *   --cftc        the weekly CFTC COT file
 *   --gpr-daily   the GPR daily export
 *   --cofer       the IMF COFER USD reserve share (gap-closure S6-M6.3;
 *                 the post-cap/landing lever for the quarterly card)
 *   --breadth     the S&P 500 breadth ratio pair (RSP + SPY)
 *   --bootstrap   ignore the flags: derive the plan from the stored
 *                 histories exactly like the Node inline build does
 *                 (first-of-month/Saturday/window gates + missing-history
 *                 bootstrap)
 *
 * Environment: CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID ·
 * INSIGHTS_KV_NAMESPACE_ID (the RATES namespace).
 *
 * Manual:
 *   pnpm --filter @currena/insights rung2-run --nbs
 */

import { runInsightsRung2Phase } from '../src/ingest/run';
import { RestInsightsStore } from '../src/store';
import { HIDDEN_PUBLIC_IDS } from '../src/ingest/data';
import { RUNG2_IDS, rung2FetchPlanFor } from '../src/adapters/rung2';
import type { InsightsStore } from '../src/store';
import type { Rung2FetchPlan } from '../src/adapters/rung2';

const args = process.argv.slice(2);

const flag = (name: string): boolean => args.includes(`--${name}`);

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!apiToken || !accountId || !namespaceId) {
  console.error(
    '\n[rung2-run] FATAL: needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID in the environment.',
  );
  process.exit(1);
}

const store: InsightsStore = new RestInsightsStore({ apiToken, accountId, namespaceId });

async function main(): Promise<void> {
  let plan: Rung2FetchPlan;
  if (flag('bootstrap')) {
    // The Node inline build's own rule: a missing (or poisoned) stored
    // history arms the bootstrap — identical to scripts/ingest.ts.
    const missing = new Set<string>();
    for (const id of RUNG2_IDS) {
      try {
        const stored = await store.getHistory(id);
        if (stored === undefined) missing.add(id);
      } catch {
        missing.add(id);
      }
    }
    plan = rung2FetchPlanFor(new Date(), missing);
    console.log(`[rung2-run] bootstrap plan (missing: ${[...missing].join(', ') || 'none'})`);
  } else {
    plan = {
      mof: flag('mof'),
      eiaWeekly: flag('eia'),
      cftcWeekly: flag('cftc'),
      monthly: flag('monthly'),
      gprDaily: flag('gpr-daily'),
      nzMonthly: flag('nz'),
      nbsMonthly: flag('nbs'),
      coferQuarterly: flag('cofer'),
      breadthDaily: flag('breadth'),
      uomMonthly: flag('uom'),
      sgeDaily: flag('sge'),
      clevelandNowcast: flag('cleveland'),
      liquidityMonthly: flag('liquidity'),
      sgeMonthly: flag('sge-monthly'),
      bazgMonthly: flag('bazg'),
      rstarQuarterly: flag('rstar'),
      equitiesDaily: flag('equities'),
    };
    const armed = Object.values(plan).some(Boolean);
    if (!armed) {
      console.error(
        '[rung2-run] FATAL: no plan gate armed — pass at least one of --nbs --nz --monthly --mof --eia --cftc --gpr-daily --cofer --breadth --uom --sge --cleveland --liquidity --sge-monthly --bazg --rstar --equities (or --bootstrap).',
      );
      process.exit(1);
    }
  }
  console.log(
    `[rung2-run] plan — mof=${plan.mof} eiaWeekly=${plan.eiaWeekly} cftcWeekly=${plan.cftcWeekly} monthly=${plan.monthly} gprDaily=${plan.gprDaily} nzMonthly=${plan.nzMonthly} nbsMonthly=${plan.nbsMonthly} coferQuarterly=${plan.coferQuarterly} breadthDaily=${plan.breadthDaily}`,
  );

  const result = await runInsightsRung2Phase({
    store,
    // The Node venue has no RATES binding: the stage read/write is a
    // Worker-venue hand-off (the histories here are already written, and
    // tomorrow's 04:20 phase re-derives its own stage anyway).
    stageKv: undefined,
    mode: 'manual',
    hiddenPublicIds: HIDDEN_PUBLIC_IDS,
    plan,
  });

  const fetched = Object.keys(result.series).join(', ') || 'none';
  console.log(`\n[rung2-run] phase complete — patched=${result.patched} · series: ${fetched}`);
  if (!result.patched) {
    console.log('[rung2-run] nothing patched (see the phase log above).');
    process.exitCode = 1;
  }
}

void main();
