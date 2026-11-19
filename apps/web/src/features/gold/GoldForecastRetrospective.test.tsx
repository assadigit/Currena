/**
 * @vitest-environment jsdom
 *
 * GoldForecastRetrospective.test.tsx — GPE R32 / F23 (2026-11-19, S17):
 * the forecast-accuracy retrospective's component tests — the collapsed
 * companion inside Zone M (the takeaway line always visible), the
 * measured record rendered from the static series (the 10-of-16
 * headline, the 2025 miss, the year-by-year table with the disclosed
 * convention), the pending 2026 row (never scored early, the mid-year
 * revision note), the pairing note, and the attribution link.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { GoldForecastRetrospective } from './GoldForecastRetrospective';
import { useI18n } from '../../shared/lib/locale';

/** The locale wrapper (the GoldPositions pattern). */
function renderWithLocale(ui: React.ReactNode): ReturnType<typeof render> {
  function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    const { locale } = useI18n();
    void locale;
    return <>{children}</>;
  }
  return render(ui, { wrapper: Wrapper });
}

describe('GoldForecastRetrospective (the Zone M collapsed companion)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders COLLAPSED with the takeaway line always visible (10 of 16, the mean-abs miss)', () => {
    renderWithLocale(<GoldForecastRetrospective />);
    expect(document.querySelector('[data-gold-forecast-retrospective]')).toBeTruthy();
    expect(document.querySelector('[data-fr-body]')).toBeNull(); // collapsed
    expect(document.querySelector('[data-gold-forecast-retrospective]')?.textContent).toContain('Even the consensus misses');
    expect(document.querySelector('[data-gold-forecast-retrospective]')?.textContent).toContain('10 of 16 years');
    expect(document.querySelector('[data-gold-forecast-retrospective]')?.textContent).toContain('8.1%');
  });

  it('expands on tap: the headline, the 2025 line, the 17-row table + the pending row', async () => {
    renderWithLocale(<GoldForecastRetrospective />);
    await fireEvent.click(document.querySelector('[data-gold-forecast-retrospective] button')!);
    await waitForBody();
    // The headline — the s4/02 §1d numbers rendered as data.
    expect(document.querySelector('[data-fr-headline]')?.textContent).toContain('10');
    expect(document.querySelector('[data-fr-headline]')?.textContent).toContain('−2.1%');
    expect(document.querySelector('[data-fr-headline]')?.textContent).toContain('8.1%');
    // The 2025 line — the biggest miss.
    expect(document.querySelector('[data-fr-2025]')?.textContent).toContain('−20.2%');
    expect(document.querySelector('[data-fr-2025]')?.textContent).toContain('2,736.69');
    // The year-by-year table: 16 scored rows + the pending 2026.
    expect(document.querySelectorAll('[data-fr-year]').length).toBe(16);
    expect(document.querySelector('[data-fr-pending]')?.textContent).toContain('4,741.97');
    expect(document.querySelector('[data-fr-pending]')?.textContent).toContain('in progress');
    // The under-forecast marker rides the rows (10 of them).
    expect(document.querySelectorAll('[data-fr-under="true"]').length).toBe(10);
    // The disclosed convention at point of use.
    expect(document.querySelector('[data-fr-convention]')?.textContent).toContain('(forecast − actual) ÷ actual');
  });

  it('the pending note carries the mid-year revision (LBMA’s own two figures, never reconciled)', async () => {
    renderWithLocale(<GoldForecastRetrospective />);
    await fireEvent.click(document.querySelector('[data-gold-forecast-retrospective] button')!);
    await waitForBody();
    expect(document.querySelector('[data-fr-pending-note]')?.textContent).toContain('4,741.97');
    expect(document.querySelector('[data-fr-pending-note]')?.textContent).toContain('4,604');
    expect(document.querySelector('[data-fr-pending-note]')?.textContent).toContain('never reconciled');
  });

  it('the pairing note + the attribution link render (the honesty device, sourced)', async () => {
    renderWithLocale(<GoldForecastRetrospective />);
    await fireEvent.click(document.querySelector('[data-gold-forecast-retrospective] button')!);
    await waitForBody();
    expect(document.querySelector('[data-fr-pair-note]')?.textContent).toContain('no forecasting edge');
    expect(document.querySelector('[data-fr-source]')?.textContent).toContain('extracted 2026-11-19');
    const link = document.querySelector<HTMLAnchorElement>('[data-fr-source] a');
    expect(link?.href).toContain('lbma.org.uk');
  });
});

function waitForBody(): Promise<void> {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const tick = (): void => {
      if (document.querySelector('[data-fr-body]') !== null) resolve();
      else if (++tries > 20) reject(new Error('body never expanded'));
      else setTimeout(tick, 10);
    };
    tick();
  });
}
