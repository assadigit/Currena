/**
 * @vitest-environment jsdom
 *
 * Sparkline.test.tsx — pins the HONEST AMPLITUDE domain padding (owner
 * report 2026-10-16: a sub-percent re-quote wiggle rendered as a violent
 * full-height sawtooth, "like a placeholder or buggy").
 *
 * The drawn polyline must stay inside the padded domain for calm series
 * (relative range < 2.5% of the level renders within a proportional band,
 * never touching the plot edges) and keep the full swing for series that
 * genuinely moved ≥ the padding threshold.
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sparkline } from './Sparkline';

afterEach(cleanup);

/** All y coordinates from the stroke path's `d` (M/L pairs, viewBox px). */
function pathYs(container: HTMLElement): number[] {
  const paths = container.querySelectorAll('path[fill="none"]');
  const d = paths[0]?.getAttribute('d') ?? '';
  return [...d.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((m) => Number(m[2]));
}

const W = 132;
const H = 40;

describe('Sparkline — honest amplitude (domain padding)', () => {
  it('a sub-percent wiggle renders as a calm band, never the full plot height', () => {
    // The production shape: 40 points alternating between two levels
    // 0.375% apart around 267,900 (TGJU re-quote noise, 2026-10-16).
    const pts = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 266_888 : 267_882));
    const { container } = render(<Sparkline points={pts} width={W} height={H} ariaLabel="test" />);
    const ys = pathYs(container);
    expect(ys.length).toBe(40);
    const swing = Math.max(...ys) - Math.min(...ys);
    // Unpadded min-max normalization would fill the plot (swing ≈ 32 of a
    // 40px viewBox with pad 4). Padded at 2.5% of level, the 0.375% wiggle
    // renders at ~15% of the inner height.
    expect(swing).toBeLessThan(H * 0.3);
    // And the line never touches the padded plot edges (pad = 4).
    expect(Math.min(...ys)).toBeGreaterThan(H * 0.15);
    expect(Math.max(...ys)).toBeLessThan(H * 0.85);
  });

  it('a genuine ≥2.5% move still fills the plot (padding never flattens real trends)', () => {
    // ~9.5% relative range — way above the 2.5% pad: full inner swing.
    const pts = [100, 102, 104, 106, 108, 109.5];
    const { container } = render(<Sparkline points={pts} width={W} height={H} ariaLabel="test" />);
    const ys = pathYs(container);
    const swing = Math.max(...ys) - Math.min(...ys);
    // Full inner-height fill (pad 4 each side; endpoints land ON the edges).
    expect(swing).toBeGreaterThan(H * 0.75);
    expect(Math.min(...ys)).toBeLessThan(H * 0.15);
    expect(Math.max(...ys)).toBeGreaterThan(H * 0.85);
  });

  it('the gentle multi-day trend with small noise renders visibly (not pinned flat)', () => {
    // 240 gens: real −3.1% drift + a/b noise — the trend must stay visible.
    const pts = Array.from({ length: 240 }, (_, i) => (i % 2 === 0 ? 100 : 100.375) + i * 0.0129);
    const { container } = render(<Sparkline points={pts} width={W} height={H} ariaLabel="test" />);
    const ys = pathYs(container);
    const swing = Math.max(...ys) - Math.min(...ys);
    expect(swing).toBeGreaterThan(H * 0.5); // drift dominates the padded domain
  });
});
