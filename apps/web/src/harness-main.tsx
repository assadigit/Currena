/**
 * harness-main.tsx — TEMPORARY verification harness (untracked, never
 * shipped): mounts the real BalanceCard with the real copy + fixture
 * readings so the 8 acceptance renders (light/dark × en/fa × 1280/375)
 * can be captured in a browser. Scenario data mirrors the spec pack's
 * reference page ("now": real yields 2.78% pressures, gold US$4,166 near
 * its 10-year high fading −5.31% in 30 days).
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionState, SignalReading } from '@currena/insights';
import { insightsCopyEn } from './i18n/insights-copy-en';
import { insightsCopyFa } from './i18n/insights-copy-fa';
import { BalanceCard } from './components/insights/signals/BalanceCard';
import './index.css';

const NOW = Date.parse('2026-10-27T12:00:00Z');

const reading = (id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading => ({
  id,
  value: 1,
  asOf: '2026-10-24',
  status: 'normal',
  sourceName: 'FRED',
  updatedAt: '2026-10-27T11:48:00Z',
  ...fields,
});

const READINGS: IndicatorReading[] = [
  reading('real-yield-10y', { value: 2.78, percentile10y: 0.88 }),
  reading('breakeven-5y5y', { value: 2.31, percentile10y: 0.7 }),
  reading('stress-stlfsi', { value: -0.42, percentile10y: 0.4 }),
  reading('nfci', { value: -0.05 }),
  reading('dollar-basket', { value: 104.2, percentile10y: 0.6 }),
  reading('china-pmi', { value: 51.2, percentile10y: 0.5 }),
  reading('copper-gold', { value: 0.00019 }),
  reading('gold-usd', { value: 4166, percentile10y: 0.94, change30d: -5.31 }),
  reading('silver-usd', { value: 57.12, percentile10y: 0.96, change30d: -12.76 }),
];

const DRIVER_INPUTS: Record<string, IndicatorId[]> = {
  'real-yield': ['real-yield-10y'],
  expectations: ['breakeven-5y5y'],
  stress: ['stress-stlfsi', 'nfci'],
  dollar: ['dollar-basket'],
  industrial: ['china-pmi', 'copper-gold'],
};

const signalOf = (metal: 'gold' | 'silver', states: Record<string, SignalConditionState>): SignalReading => ({
  metal,
  priceId: metal === 'gold' ? 'gold-usd' : 'silver-usd',
  conditions: (Object.keys(DRIVER_INPUTS) as (keyof typeof DRIVER_INPUTS)[])
    .filter((key) => metal === 'silver' || key !== 'industrial')
    .map((key) => ({ key, state: states[key] ?? 'unknown', inputs: DRIVER_INPUTS[key]! })),
  metCount: 0,
  lean: null,
  position: null,
  speed: null,
});

const SCENARIOS: Record<string, Record<string, SignalConditionState>> = {
  now: { 'real-yield': 'against', expectations: 'neutral', stress: 'neutral', dollar: 'unknown' },
  three: { 'real-yield': 'against', expectations: 'neutral', stress: 'neutral', dollar: 'against' },
  balanced: { 'real-yield': 'against', expectations: 'supportive', stress: 'supportive', dollar: 'against' },
  supportive: { 'real-yield': 'neutral', expectations: 'supportive', stress: 'supportive', dollar: 'neutral' },
};

function Harness() {
  const [lang, setLang] = useState<'en' | 'fa'>('en');
  const [dark, setDark] = useState(false);
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>('now');
  const states = SCENARIOS[scenario]!;
  return (
    <div
      className={dark ? 'dark' : ''}
      style={{ background: 'var(--color-currena-bg-light)', minHeight: '100vh', padding: 16 }}
      ref={(el) => {
        if (el) {
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
          document.documentElement.classList.toggle('dark', dark);
        }
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {(['en', 'fa'] as const).map((l) => (
          <button key={l} data-h-lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
            {l === 'en' ? 'English' : 'Farsi'}
          </button>
        ))}
        {(['light', 'dark'] as const).map((m) => (
          <button key={m} data-h-theme={m} aria-pressed={dark === (m === 'dark')} onClick={() => setDark(m === 'dark')}>
            {m}
          </button>
        ))}
        {Object.keys(SCENARIOS).map((s) => (
          <button key={s} data-h-sc={s} aria-pressed={scenario === s} onClick={() => setScenario(s as keyof typeof SCENARIOS)}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <BalanceCard
          gold={signalOf('gold', states)}
          silver={signalOf('silver', { ...states, industrial: 'supportive' })}
          readings={READINGS}
          copy={lang === 'fa' ? insightsCopyFa : insightsCopyEn}
          numberLocale={lang === 'fa' ? 'fa-IR' : 'en-US'}
          now={NOW}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
