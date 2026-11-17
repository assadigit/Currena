/**
 * @vitest-environment jsdom
 *
 * GoldPositions.test.tsx — GPE R03 (wave 0): the CFTC cards' change line
 * names its window (GPE-S2-09) and the bar honours each metric's true
 * domain (GPE-S2-10, the #10 clamp rider).
 *
 * What is pinned:
 *   - GPE-S2-09: the change line renders the window word ("30-day
 *     change" / «تغییر ۳۰ روزه») beside the signed value — the section
 *     speaks the WEEKLY CFTC report, so the unlabeled points parsed as
 *     week-over-week.
 *   - GPE-S2-10: the trader-positioning card (net/OI, domain [−100,
 *     +100]) renders the SIGNED bar — the −100/+100 end labels, the
 *     centre zero tick, and a fill that grows FROM THE CENTRE so a
 *     net-short reading keeps its sign (the old clamp pinned it at 0%
 *     and hid it). The gross-long card (a genuine 0–100 share) keeps
 *     its 0–100 bar.
 *   - The value text always shows the TRUE number, negative included.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { IndicatorReading } from '@currena/core';
import { GoldPositions } from './GoldPositions';
import { useI18n } from '../../shared/lib/locale';

function reading(id: string, partial: Partial<IndicatorReading>): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: null,
    asOf: '2026-11-03',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    ...partial,
  } as IndicatorReading;
}

/** The locale rides the app's module-level store (no provider) — this
 * probe flips it through the public API; every store subscriber
 * (GoldPositions included) re-renders on the change. */
function LocaleProbe({ locale }: { locale: 'en' | 'fa' }): null {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

function renderAt(locale: 'en' | 'fa', readings: readonly IndicatorReading[]) {
  return render(
    <>
      <LocaleProbe locale={locale} />
      <GoldPositions readings={readings} />
    </>,
  );
}

afterEach(() => {
  cleanup();
});

describe('GoldPositions (GPE R03)', () => {
  const net = reading('cftc-gold-positioning', { value: 44.98, change30d: -8.8 });
  const gross = reading('cftc-gold-gross-long', { value: 55.25, change30d: -2.0 });

  it('the change line names its 30-day window (GPE-S2-09) — EN', () => {
    const { container } = renderAt('en', [net, gross]);
    const windowWord = container.querySelector('[data-position-change-window]');
    expect(windowWord?.textContent).toBe('30-day change');
    // The signed value renders beside it, minus and all.
    expect(windowWord?.previousElementSibling?.textContent).toContain('−8.8 pts');
  });

  it('the change line names its 30-day window (GPE-S2-09) — FA', async () => {
    const { container } = renderAt('fa', [net, gross]);
    await waitFor(() => {
      expect(container.querySelector('[data-position-change-window]')?.textContent).toBe('تغییر ۳۰ روزه');
    });
  });

  it('the net/OI card renders the SIGNED ±100 bar (GPE-S2-10)', () => {
    const { container } = renderAt('en', [net, gross]);
    const card = container.querySelector('[data-gold-position-card="cftc-gold-positioning"]');
    expect(card?.getAttribute('data-position-bar-domain')).toBe('signed');
    // The centre zero tick exists (the signed track's reference).
    expect(card?.querySelector('.absolute.inset-y-0.left-1\\/2')).not.toBeNull();
    // +44.98 on a −100..+100 track: the marker sits past the centre
    // (72.49%), the fill spans the centre→marker stretch (22.49%).
    const marker = card?.querySelectorAll('div[style*="left:"]')[1] as HTMLElement | undefined;
    expect(marker?.style.left).toBe('72.49%');
    const fill = card?.querySelector('div.absolute.inset-y-0.rounded-full') as HTMLElement | undefined;
    expect(fill?.style.left).toBe('50%');
    expect(fill?.style.width).toBe('22.49%');
    // The end labels name both extremes.
    expect(card?.textContent).toContain('-100%');
    expect(card?.textContent).toContain('+100%');
  });

  it('a net-short reading keeps its sign — the fill extends LEFT of centre, value text shows the true number', () => {
    const short = reading('cftc-gold-positioning', { value: -32.5, change30d: -4.2 });
    const { container } = renderAt('en', [short]);
    const card = container.querySelector('[data-gold-position-card="cftc-gold-positioning"]');
    // −32.5 on a −100..+100 track: marker at 33.75%, fill from 33.75% to
    // 50% (width 16.25%) — the OLD clamp would have pinned the bar at 0%.
    const marker = card?.querySelectorAll('div[style*="left:"]')[1] as HTMLElement | undefined;
    expect(marker?.style.left).toBe('33.75%');
    const fill = card?.querySelector('div.absolute.inset-y-0.rounded-full') as HTMLElement | undefined;
    expect(fill?.style.left).toBe('33.75%');
    expect(fill?.style.width).toBe('16.25%');
    // The value text carries the true negative number.
    expect(card?.textContent).toContain('-32.5%');
  });

  it('the gross-long card keeps its genuine 0–100 share bar (GPE-S2-10)', () => {
    const { container } = renderAt('en', [net, gross]);
    const card = container.querySelector('[data-gold-position-card="cftc-gold-gross-long"]');
    expect(card?.getAttribute('data-position-bar-domain')).toBe('share');
    // No centre tick on the 0–100 track; the fill anchors at the left end.
    expect(card?.querySelector('.absolute.inset-y-0.left-1\\/2')).toBeNull();
    const fill = card?.querySelector('div.absolute.inset-y-0.rounded-full') as HTMLElement | undefined;
    expect(fill?.style.left).toBe('0%');
    expect(fill?.style.width).toBe('55.25%');
    expect(card?.textContent).toContain('0%');
    expect(card?.textContent).toContain('100%');
  });

  it('renders nothing when no positioning readings carry values (fail-closed)', () => {
    const { container } = renderAt('en', [reading('cftc-gold-positioning', { status: 'unavailable' })]);
    expect(container.querySelector('[data-gold-positions]')).toBeNull();
  });
});
