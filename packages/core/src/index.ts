/**
 * @currena/core — shared data contracts and pure logic.
 *
 * Phase 0: scaffold only. Phase 3 fills this in:
 *   - zod schemas: Rate, Snapshot, RatesResponse, RatesError, SourceConfig
 *     (mission §4 — the ONLY place these are defined)
 *   - conversion math (single-source-per-conversion rule enforced in code)
 *   - Persian-digit (۰-۹ + Arabic-Indic variants) + Toman/Rial normalizers
 *   - Intl formatters ('fa-IR' | 'en-US')
 *
 * RULES (see /AGENTS.md):
 *   - This package imports NOTHING platform-specific (no Node/Cloudflare APIs).
 *   - All shared data contracts live here. Import, never redefine.
 */
export const CORE_VERSION = '0.1.0';
