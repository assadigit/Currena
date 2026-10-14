/**
 * Odometer — result-number animation (mission §8: "number odometer
 * animation ~800ms"). Counts up with an ease-out cubic; formatting happens
 * at render via the caller's formatter (@currena/core, AGENTS.md rule 5).
 *
 * WCAG 2.3.3 / BACKLOG #34: `prefers-reduced-motion: reduce` skips the
 * count-up entirely — the final value lands immediately (the CSS-keyframed
 * motion elsewhere in the app is already disabled globally under the same
 * media query; this rAF animation was the last motion source that ignored
 * the user preference).
 */

import { useEffect, useRef, useState } from 'react';

interface OdometerProps {
  value: number;
  format: (value: number) => string;
  /** Animation duration in ms (default 800). */
  durationMs?: number;
}

export function Odometer({ value, format, durationMs = 800 }: OdometerProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    // Reduced motion: no count-up — the answer simply IS the result.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      setDisplay(value * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs]);

  return <span className="tabular-nums">{format(display)}</span>;
}
