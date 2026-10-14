/**
 * settle/Modal — the route's generic modal shell (Phase: WS-4 module split
 * of the former Settle.tsx monolith — zero behavior change, code moved
 * verbatim). Dialog focus discipline (QA audit D-5): focus moves to the
 * title on open, Tab is trapped, Escape closes, focus returns to the
 * opener (captured at mount), body scroll locks.
 */

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '../../lib/locale';
import { useDialogFocus } from '../../components/useDialogFocus';

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  // The opener still holds focus when the modal mounts — capture it for the
  // return-focus discipline (audit D-5). Read once per mount via useRef.
  const openerRef = useRef<HTMLElement | null>(null);
  if (openerRef.current === null) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  // Dialog focus discipline (QA audit D-5): focus moves to the title on
  // open, Tab is trapped, Escape closes, focus returns to the opener, body
  // scroll locks — replacing the Escape-only handling.
  const { containerRef, onKeyDown } = useDialogFocus({
    onClose,
    returnFocusToRef: openerRef,
  });

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[6px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="popup-slide-up max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-[25px] bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.5)] sm:max-w-[520px] dark:bg-[#1A222E]">
        <div className="mb-4 flex items-center justify-between">
          {/* data-dialog-heading: the shared focus discipline lands here on
              open so the announced dialog starts at its title. */}
          <h2 data-dialog-heading tabIndex={-1} className="text-lg font-bold focus:outline-none">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="h-8 w-8 cursor-pointer rounded-full border-0 bg-currena-warning/10 text-xl text-currena-warning transition-all duration-300 hover:rotate-90"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { Modal };
