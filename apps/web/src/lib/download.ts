/**
 * Trigger a browser download for a Blob (BACKLOG #24 — was triplicated in
 * Receipt / BatchConverter; now also the Insights calendar export).
 *
 * Revoking the object URL immediately after the click is safe: the download
 * keeps its reference (legacy behaviour, verified across Chromium/Firefox/
 * WebKit for the PNG/XLSX/CSV exports).
 */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
