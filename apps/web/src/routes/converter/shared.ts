/**
 * converter/shared — the route's pure constants and types (Phase: WS-4
 * module split of the former Converter.tsx monolith — zero behavior
 * change, code moved verbatim). The conversion state machine itself
 * stays in the shell: it is the route's core and its hook wiring is
 * behavior-sensitive (the designed patterns D-17 documents).
 */

import type { RoutePath } from '../../router';
import type { TranslationKey } from '../../lib/locale';
import type { RecentPair } from '../../lib/recent-pairs';

/** Mission §8: the fetching state is shown for at least 700ms. */
export const MIN_FETCHING_MS = 700;

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/** One-tap amounts — international vs IRR-appropriate magnitudes. */
export const QUICK_AMOUNTS_INTL: readonly number[] = [10, 50, 100, 500, 1000];
export const QUICK_AMOUNTS_IRR: readonly number[] = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

/** Quick tools (owner wireframe 2026-09-20): the six one-tap shortcuts that
 *  used to live in the desktop sidebar rail — now a full-width homepage
 *  section below the LED boards. */
export const TOOLS: readonly { path: RoutePath; emoji: string; labelKey: TranslationKey }[] = [
  { path: '/calculator', emoji: '🧮', labelKey: 'nav.calculator' },
  { path: '/batch', emoji: '🛒', labelKey: 'nav.batchConverter' },
  { path: '/receipt', emoji: '📄', labelKey: 'nav.receiptGenerator' },
  { path: '/splitter', emoji: '💰', labelKey: 'nav.expenseSplitter' },
  { path: '/settle', emoji: '👥', labelKey: 'nav.splitSettle' },
  { path: '/history', emoji: '📜', labelKey: 'nav.history' },
];

/** I11 — first-run pair suggestions until the first conversion exists.
 *  All IRR-side (TGJU open-market — the app's core use case), matching the
 *  default USD→IRR direction so the chips read as "this is what people do". */
export const POPULAR_PAIRS: readonly RecentPair[] = [
  { from: 'USD', to: 'IRR' },
  { from: 'EUR', to: 'IRR' },
  { from: 'GBP', to: 'IRR' },
  { from: 'AED', to: 'IRR' },
  { from: 'TRY', to: 'IRR' },
];

/** The I12 failure card's shape (title + honest kind-aware lines). */
export interface ConvertFailure {
  title: string;
  lines: string[];
}
