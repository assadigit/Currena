/**
 * Presentation helpers shared by the desk components.
 * Client-safe: pure functions, no server dependencies.
 */

import type { Sentiment } from "./types";

/** "3,412.50" */
export function fmtPrice(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** "+0.84%" / "-1.20%" */
export function fmtPct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}

/** "+38 bps" / "-12 bps" */
export function fmtBps(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(0)} bps`;
}

/** "Mon, 12 May" */
export function fmtDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Short axis tick: "12 May" */
export function fmtAxisDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "14:05" style time already formatted server-side; kept for symmetry. */
export function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Directional colour class for signed values. */
export function deltaClass(n: number | undefined): string {
  if (n === undefined || Math.abs(n) < 0.005) return "text-muted-foreground";
  return n > 0 ? "text-bull" : "text-bear";
}

export function sentimentClass(s: Sentiment): string {
  if (s === "positive") return "text-bull";
  if (s === "negative") return "text-bear";
  return "text-muted-foreground";
}

export function sentimentBg(s: Sentiment): string {
  if (s === "positive") return "bg-bull";
  if (s === "negative") return "bg-bear";
  return "bg-flat";
}

/** Clamp helper used by gauges. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
