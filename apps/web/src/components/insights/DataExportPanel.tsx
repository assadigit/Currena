/**
 * DataExportPanel — the format-choice rows of the one-file "download all
 * data" export (owner request, 2026-10-16). LAZY: this module (and its
 * icons) load only when the owner first opens the export menu — the
 * Insights page chunk carries only the trigger button (DataExportMenu).
 *
 * v3 UI_SPEC §10 (2026-10-20, UI-51, PH6-C): the panel is OWNER-ONLY — the
 * header renders DataExportMenu solely when the owner surface is unlocked
 * (private-mode session or the verified owner cookie), so every row here
 * is an owner row. The four CLIENT formats stay unchanged (MD / TXT / CSV /
 * XLSX, built by full-export.ts at download time); the fifth row is the
 * SERVER export — GET /api/insights/export?format=md, the full audit export
 * with the E-23 columns (level / ownerAccepts / enabled / published /
 * source URL / licence). Its failure is loud and actionable: an inline
 * error line with the panel staying open for a retry.
 *
 * Every row clears the 44px touch-target floor (2026-10-16 quirk-pass
 * standard; UI-53).
 */

import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Server, Table2 } from 'lucide-react';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { ExportFormat } from './full-export';
import { clampPanelToViewport } from '../../lib/clamp-panel';

const FORMAT_ITEMS: readonly { format: ExportFormat; key: 'exportFormatMd' | 'exportFormatTxt' | 'exportFormatCsv' | 'exportFormatXlsx' }[] = [
  { format: 'md', key: 'exportFormatMd' },
  { format: 'txt', key: 'exportFormatTxt' },
  { format: 'csv', key: 'exportFormatCsv' },
  { format: 'xlsx', key: 'exportFormatXlsx' },
];

/** Pull the server's own filename out of Content-Disposition, if present. */
function filenameFromDisposition(header: string | null): string | null {
  if (header === null) return null;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? null;
}

export default function DataExportPanel({
  copy,
  onPick,
  onDone,
}: {
  copy: InsightsCopy;
  /** The CLIENT format builders (full-export.ts), unchanged. */
  onPick: (format: ExportFormat) => void;
  /** Closes the menu and returns focus to its button (the panel calls it
   * after a completed download — client pick or successful server fetch). */
  onDone: () => void;
}) {
  // The panel anchors `end-0`, which flips side with the writing direction
  // and can slide off-screen at 375 px (the 2026-10-16 Tools-panel finding)
  // — clamp it inside the viewport once mounted.
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (panelRef.current) clampPanelToViewport(panelRef.current);
  }, []);

  // v3 UI-51: the SERVER export (GET /api/insights/export?format=md, the
  // E-23 audit columns). Pending shows on the row; failure keeps the panel
  // open with the actionable retry message (aria-live announces it).
  const [serverState, setServerState] = useState<'idle' | 'pending' | 'failed'>('idle');
  const pickServerExport = (): void => {
    if (serverState === 'pending') return;
    setServerState('pending');
    void fetch('/api/insights/export?format=md')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const { downloadBlob } = await import('../../lib/download');
        const filename =
          filenameFromDisposition(res.headers.get('Content-Disposition')) ?? `currena-insights-export-${new Date().toISOString().slice(0, 10)}.md`;
        downloadBlob(blob, filename);
        setServerState('idle');
        onDone();
      })
      .catch(() => {
        // 401/403 (session gone), 404 (route not wired yet — Phase 9) or a
        // network failure: say so and stay open for a retry.
        setServerState('failed');
      });
  };

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
            className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3 text-[length:var(--type-label)] font-semibold text-currena-dark transition-colors hover:border-currena-blue/40 hover:bg-currena-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:border-white/15 dark:bg-[#1A222E] dark:text-currena-dark dark:hover:border-currena-blue/40"
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
        {/* v3 UI-51: the server-built full audit export (E-23 columns:
         * level / ownerAccepts / enabled / published / source URL /
         * licence) — a plain GET so the owner session cookie rides along. */}
        <div className="mt-1 border-t border-[var(--color-border)] pt-2">
          <button
            type="button"
            onClick={pickServerExport}
            disabled={serverState === 'pending'}
            className="insights-focusable inline-flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-[10px] border border-currena-blue/40 bg-currena-blue/10 px-3 text-start text-[length:var(--type-label)] font-semibold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/20 disabled:cursor-wait disabled:opacity-60"
          >
            <Server aria-hidden size={17} strokeWidth={1.9} className="shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span>{copy.ui.exportServerLabel}</span>
              <span className="text-[length:var(--type-caption)] font-normal text-[var(--color-text-tertiary)]">
                {copy.ui.exportServerNote}
              </span>
            </span>
          </button>
          {serverState === 'failed' ? (
            <p role="alert" className="m-0 mt-1.5 text-[0.7rem] font-semibold text-[var(--color-status-alert)]">
              {copy.ui.exportServerFailed}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
