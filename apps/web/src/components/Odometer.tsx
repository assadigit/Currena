/**
 * Odometer — result-number animation (mission §8: "number odometer
 * animation ~800ms"). Counts up with an ease-out cubic; formatting happens
 * at render via the caller's formatter (@currena/core, AGENTS.md rule 5).
 */

import { useEffect, useRef, useState } from 'react';

export interface OdometerProps {
  value: number;
  format: (value: number) => string;
  /** Animation duration in ms (default 800). */
  durationMs?: number;
}

export function Odometer({ value, format, durationMs = 800 }: OdometerProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
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
