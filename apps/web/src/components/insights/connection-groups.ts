/**
 * TM22: connection-id groups — which connections belong on which page.
 *
 * The 10 macroeconomic connections are split across three pages:
 *   - /australia: the 4 AU-specific connections (iron ore → AUD, China
 *     demand → iron ore, RBA rate → home loan → debt, energy → AUD)
 *   - /usa: the 2 USA-domestic connections (oil → breakevens → yields,
 *     supply pressure → US CPI)
 *   - /economic-linkages: the 4 global connections (real yields → gold,
 *     dollar → gold → oil, copper → China PMI, oil → chokepoints)
 */

/** Australia-specific connections — move to /australia. */
export const AU_CONNECTION_IDS: ReadonlySet<string> = new Set([
  'iron-terms-aud',
  'china-demand-iron-ore',
  'rba-loan-debt',
  'energy-terms-aud',
]);

/** USA-domestic connections — move to /usa. */
export const USA_CONNECTION_IDS: ReadonlySet<string> = new Set([
  'oil-expectations-costs',
  'supply-pressure-inflation',
]);

/** Global connections — stay on /economic-linkages. */
export const GLOBAL_CONNECTION_IDS: ReadonlySet<string> = new Set([
  'real-yields-gold',
  'dollar-gold-oil',
  'copper-china-growth',
  'oil-geopolitics-chokepoints',
]);
