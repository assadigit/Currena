/**
 * anchor-scroll.ts — GPE R10 (INF-3, 2026-11-18): the card-level anchor
 * navigation's scroll leg. The seat links carry real `#hash` hrefs (the
 * destination cards' own stable anchors — GPE-S2-18), but the path
 * router's `navigate()` uses `history.pushState`, which does NOT trigger
 * the browser's native hash scroll. This is the Footer→About staged-
 * scroll pattern (ABOUT_SCROLL_TARGET), generalized: the click STAGES
 * the anchor id, the app shell CONSUMES it on the next route commit and
 * scrolls once the destination card is laid out (the destination pages
 * boot from the last-good projection cache — instant on a warm visit;
 * the bounded rAF retry covers the cold fetch).
 *
 * No behavioural side effects on the anchor itself (s7/03 rule 3): the
 * ids are plain destination targets; this module only scrolls to them.
 */

/** The sessionStorage key staging the next route's anchor target. */
export const ANCHOR_SCROLL_TARGET = 'currena:anchor-scroll';

/** Stage an anchor id for the next route's post-mount scroll. */
export function stageAnchorScroll(anchorId: string): void {
  try {
    window.sessionStorage.setItem(ANCHOR_SCROLL_TARGET, anchorId);
  } catch {
    // Private mode: plain navigation, no scroll stage.
  }
}

/**
 * Consume the staged anchor (if any) and scroll to it once it exists.
 * Bounded: ~3 s of rAF retries (the projection cache paints on the first
 * commit; a cold fetch lands well inside the window), then one final
 * attempt — a target that never appears simply never scrolls (fail-soft:
 * the reader is on the right page, at its top).
 */
export function consumeStagedAnchorScroll(): void {
  let target: string | null = null;
  try {
    target = window.sessionStorage.getItem(ANCHOR_SCROLL_TARGET);
    window.sessionStorage.removeItem(ANCHOR_SCROLL_TARGET);
  } catch {
    target = null;
  }
  if (target === null) return;
  const el = () => document.getElementById(target as string);
  const scroll = () => el()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (el() !== null) {
    requestAnimationFrame(scroll);
    return;
  }
  const startedAt = performance.now();
  const retry = (): void => {
    if (el() !== null) {
      el()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (performance.now() - startedAt > 3_000) return; // bounded — give up quietly
    requestAnimationFrame(retry);
  };
  requestAnimationFrame(retry);
}
