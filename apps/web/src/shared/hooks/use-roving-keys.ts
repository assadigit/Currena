/**
 * useRovingKeys — WAI-ARIA roving-tabindex keyboard navigation for the
 * app's segmented controls (the "tablist" and "radiogroup" patterns,
 * audit WS-3 #1/#2): Arrow keys plus Home/End move focus among the
 * rendered items and report the index back; the CALLER decides what
 * moving means (tabs activate their tab, radio groups select on move —
 * both are the APG's automatic-activation reading for these controls).
 *
 * Direction follows the writing direction: in RTL the HORIZONTAL arrows
 * reverse (APG Tabs / Radio Group patterns both specify this), while
 * Up/Down keep their meaning. Roving tabindex itself is the caller's
 * markup: exactly ONE item carries tabIndex={0} (the active one), the
 * rest −1, so Tab jumps past the whole group and arrows walk inside it.
 */

import { useCallback, useEffect, useRef, type KeyboardEventHandler, type RefObject } from 'react';

const ROVING_KEYS: ReadonlySet<string> = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

export interface RovingKeysOptions {
  /** Selector matching the roving items inside the container (e.g. '[role="tab"]'). */
  selector: string;
  /** The currently active item's index (focus lands there when arrows start cold). */
  activeIndex: number;
  /** Called with the index the user moved to (activate / select as designed). */
  onMove: (index: number) => void;
  /** True in RTL — swaps the horizontal arrows' meanings. */
  rtl: boolean;
}

export function useRovingKeys(options: RovingKeysOptions): {
  /** The tablist/radiogroup container's ref (assign to its `ref` prop). */
  containerRef: RefObject<HTMLDivElement | null>;
  onKeyDown: KeyboardEventHandler;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { selector, activeIndex, rtl, onMove } = options;
  // `onMove` and the search config arrive as fresh values every render; the
  // handler must see the CURRENT ones (a stale onMove would move focus to
  // the old tab), so the "latest ref" indirection below keeps identity
  // stable for the DOM while always calling the latest closure. Synced in
  // a dep-less effect (runs after every render — the house pattern).
  const onMoveRef = useRef(onMove);
  const configRef = useRef({ selector, activeIndex, rtl });
  useEffect(() => {
    onMoveRef.current = onMove;
    configRef.current = { selector, activeIndex, rtl };
  });

  const onKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      const { selector, activeIndex, rtl } = configRef.current;
      if (!ROVING_KEYS.has(e.key)) return;
      const container = containerRef.current;
      if (container === null) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
      if (items.length === 0) return;
      e.preventDefault();
      const activeElement = document.activeElement;
      const current = activeElement instanceof HTMLElement ? items.indexOf(activeElement) : -1;
      const total = items.length;
      // Cold start (focus entered the group via Tab): arrows act from the
      // ACTIVE item, not index 0 — the roving tabindex put focus there, but
      // this guards programmatic focus too.
      let next = current === -1 ? Math.max(0, Math.min(activeIndex, total - 1)) : current;
      const forward = rtl ? -1 : 1;
      switch (e.key) {
        case 'ArrowRight':
          next = (next + forward + total) % total;
          break;
        case 'ArrowLeft':
          next = (next - forward + total) % total;
          break;
        case 'ArrowDown':
          next = (next + 1) % total;
          break;
        case 'ArrowUp':
          next = (next - 1 + total) % total;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
      }
      onMoveRef.current(next);
      items[next]?.focus();
    },
    [],
  );

  return { containerRef, onKeyDown };
}
