/**
 * DataExportMenu — the one-click "download all data" export (owner request,
 * 2026-10-16): a download button beside the Tools disclosure in the page
 * header. One click opens the format choice; one click on a format builds
 * the file and starts the download.
 *
 * The format-choice PANEL (DataExportPanel) and the builders (full-export)
 * are lazily imported — the first when the menu opens, the second at
 * download time — so the Insights page chunk carries only this small
 * trigger button.
 *
 * Same disclosure discipline as ToolsMenu: aria-expanded + aria-controls,
 * closes on Escape (focus returns to the button) and on outside click.
 * The button clears the 44px touch-target floor (2026-10-16 quirk-pass
 * standard).
 */

import { Suspense, lazy, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { ExportFormat } from './full-export';

const DataExportPanel = lazy(() => import('./DataExportPanel'));

export function DataExportMenu({
  copy,
  open,
  onOpenChange,
  buttonRef,
  onPick,
}: {
  copy: InsightsCopy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onPick: (format: ExportFormat) => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Escape closes and returns focus to the button; outside click closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      onOpenChange(false);
      buttonRef.current?.focus();
    };
    const onClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open, onOpenChange, buttonRef]);

  return (
    <div className="no-print relative" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="insights-export-panel"
        aria-haspopup="true"
        onClick={() => onOpenChange(!open)}
        className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-currena-blue/40 bg-currena-blue/15 px-4 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25"
      >
        <Download aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
        {copy.ui.exportAllLabel}
      </button>

      {open ? (
        <Suspense fallback={null}>
          <DataExportPanel
            copy={copy}
            onPick={(format) => {
              onOpenChange(false);
              buttonRef.current?.focus();
              onPick(format);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
