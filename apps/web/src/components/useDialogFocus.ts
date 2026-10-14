/**
 * useDialogFocus — the shared dialog focus discipline, extracted from the
 * DetailsPanel-proven pattern (F5, QA audit D-3/D-4/D-5/D-6 fixes): Escape
 * closes, Tab is trapped inside the dialog, opening moves focus in (the
 * `[data-dialog-heading]` element by default), closing returns focus to the
 * opener, and body scroll is locked while open.
 *
 * Two supported shapes:
 *  - Conditionally-MOUNTED dialogs (default, `active: true`): attach
 *    `containerRef` + `onKeyDown` to the element carrying
 *    `role="dialog" aria-modal="true"` — "mounted = open".
 *  - Persistently-rendered dialogs that toggle visibility: pass
 *    `active` — every discipline effect no-ops while inactive.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseDialogFocusOptions {
  /** Closes the dialog (Escape key and the discipline's contract). */
  onClose: () => void;
  /** The element that opened the dialog — focus returns here on close. */
  returnFocusTo: HTMLElement | null;
  /**
   * Focus target on open; defaults to the `[data-dialog-heading]` element
   * inside the container (give the dialog's heading that data attribute),
   * falling back to the first focusable element.
   */
  initialFocusRef?: Readonly<RefObject<HTMLElement | null>>;
  /** For persistently-rendered dialogs: the discipline applies while true. */
  active?: boolean;
  /** Lock body scroll while open (default true). Drawers pass false. */
  lockScroll?: boolean;
}

export function useDialogFocus(opts: UseDialogFocusOptions) {
  const { onClose, returnFocusTo, initialFocusRef, active = true, lockScroll = true } = opts;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Focus trap + Escape (the DetailsPanel discipline).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = containerRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const list = [...focusables].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose, active],
  );

  useEffect(() => {
    if (!active) return;
    const panel = containerRef.current;
    // Opening: focus the heading (announced by role=dialog), or the chosen
    // element, or the first focusable — something INSIDE must receive focus.
    const focusTarget =
      initialFocusRef?.current ??
      panel?.querySelector<HTMLElement>('[data-dialog-heading]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusTarget?.focus();
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden'; // scroll lock while open
    return () => {
      if (lockScroll) document.body.style.overflow = previousOverflow;
      // Focus returns to the control that opened the dialog.
      if (returnFocusTo && document.contains(returnFocusTo)) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
    // Deliberately NOT re-running on returnFocusTo identity changes: the
    // effect models the dialog's OPEN->CLOSED lifecycle only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { containerRef, onKeyDown };
}
