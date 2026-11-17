/**
 * clamp-panel.ts — keep an absolutely-positioned popover inside the
 * viewport (found 2026-10-16: the Tools panel anchored `end-0` slid
 * 75 px off-screen at 375 px EN, and the export panel did the mirrored
 * thing in fa RTL — the anchor side flips with the writing direction,
 * but the button can end up at either visual edge after the header
 * flex-wrap, so no static anchor is safe).
 *
 * The fix is physical, not directional: measure the open panel once and
 * translate it just enough to clear both viewport edges (8 px margins).
 * A translate keeps the visual anchor relationship otherwise intact and
 * works identically in LTR and RTL. Vertical overflow is clamped the
 * same way (tall panels on short viewports).
 */

/** Shift `panel` so it sits fully inside the viewport (8 px margins). */
export function clampPanelToViewport(panel: HTMLElement, margin = 8): void {
  const rect = panel.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return; // never rendered?
  const overLeft = margin - rect.left;
  const overRight = rect.right - (window.innerWidth - margin);
  const overTop = margin - rect.top;
  const overBottom = rect.bottom - (window.innerHeight - margin);
  const dx = overLeft > 0 ? overLeft : overRight > 0 ? -overRight : 0;
  const dy = overTop > 0 ? overTop : overBottom > 0 ? -overBottom : 0;
  if (dx !== 0 || dy !== 0) {
    const prev = panel.style.transform;
    panel.style.transform = `${prev} translate(${dx}px, ${dy}px)`.trim();
  }
}
