/**
 * DataExportPanel — the format-choice rows of the one-file "download all
 * data" export (owner request, 2026-10-16). LAZY: this module (and its
 * icons) load only when the owner first opens the export menu — the
 * Insights page chunk carries only the trigger button (DataExportMenu).
 *
 * Four formats: Markdown (.md), plain text (.txt), CSV (.csv) and the
 * Excel workbook (.xlsx). The builders live in full-export.ts (also
 * lazily imported, at download time). Every row clears the 44px
 * touch-target floor (2026-10-16 quirk-pass standard).
 */

import { useEffect, useRef } from 'react';
import { FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { ExportFormat } from './full-export';
import { clampPanelToViewport } from '../../lib/clamp-panel';

const FORMAT_ITEMS: readonly { format: ExportFormat; key: 'exportFormatMd' | 'exportFormatTxt' | 'exportFormatCsv' | 'exportFormatXlsx' }[] = [
  { format: 'md', key: 'exportFormatMd' },
  { format: 'txt', key: 'exportFormatTxt' },
  { format: 'csv', key: 'exportFormatCsv' },
  { format: 'xlsx', key: 'exportFormatXlsx' },
];

export default function DataExportPanel({
  copy,
  onPick,
}: {
  copy: InsightsCopy;
  onPick: (format: ExportFormat) => void;
}) {
  // The panel anchors `end-0`, which flips side with the writing direction
  // and can slide off-screen at 375 px (the 2026-10-16 Tools-panel finding)
  // — clamp it inside the viewport once mounted.
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (panelRef.current) clampPanelToViewport(panelRef.current);
  }, []);

  return (
    <div
      id="insights-export-panel"
      className="absolute end-0 z-40 mt-2 flex w-[min(92vw,340px)] flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-border)]"
      role="group"
      aria-label={copy.ui.exportAllTitle}
      ref={panelRef}
    >
      <div>
        <p className="m-0 text-[length:var(--type-label)] font-bold">{copy.ui.exportAllTitle}</p>
        <p className="m-0 mt-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {copy.ui.exportAllNote}
        </p>
      </div>
      <div role="group" aria-label={copy.ui.exportAllTitle} className="flex flex-col gap-1.5">
        {FORMAT_ITEMS.map(({ format, key }) => (
          <button
            key={format}
            type="button"
            onClick={() => onPick(format)}
            className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3 text-[length:var(--type-label)] font-semibold text-currena-dark transition-colors hover:border-[var(--color-text-secondary)]/40 hover:bg-currena-muted/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)] dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark dark:hover:border-[var(--color-text-secondary)]/40"
          >
            {format === 'xlsx' ? (
              <FileSpreadsheet aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
            ) : format === 'csv' ? (
              <Table2 aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
            ) : (
              <FileText aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
            )}
            {copy.ui[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
