/**
 * The ingest orchestration surface (2026-10-21 data-integrity round) — what
 * the Worker cron rungs (apps/api/src/insights-ingest-cron.ts), the GitHub
 * Actions runner and the manual runner scripts consume: ONE shared
 * orchestration so the venues can never drift apart.
 *
 * Platform-free (AGENTS.md rule 2): web-standard fetch only, no node:* —
 * the Worker bundles this module directly.
 */

export {
  runInsightsUpdate,
  runInsightsHistoryPhase,
  runInsightsRung2Phase,
  runInsightsRung4Phase,
  runInsightsCreditPhase,
  writeAllHistoriesInline,
  historyPhaseIds,
  SEED_IDS,
  INSIGHTS_STAGE_KEY,
  putStage,
  readStage,
  CARRY_FORWARD_IDS,
} from './run';
export type {
  IngestRunOptions,
  IngestRunResult,
  HistoryPhaseOptions,
  HistoryPhaseResult,
  InlineHistoryResult,
  Rung2PhaseOptions,
  Rung2PhaseResult,
  Rung4PhaseOptions,
  Rung4PhaseResult,
  CreditPhaseOptions,
  CreditPhaseResult,
} from './run';

export { KvInsightsStore } from './kv-store';
export type { KVLike } from './kv-store';

export { HIDDEN_PUBLIC_IDS, CALENDAR, CHINA_PMI, MANUAL_EXPIRES, POLICY_DECISIONS } from './data';
