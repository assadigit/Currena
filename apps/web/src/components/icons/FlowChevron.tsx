/**
 * FlowChevron — the small drill-down / swipe-ahead glyph shared by the
 * editorial hero surfaces (2026-10-19 handoff, economic-indicators-
 * editorial-spec.md §8/§10). Directional by reading flow: the
 * .ei-row-chevron class physically mirrors it in RTL (index.css G1 rule —
 * the same flip language as .connection-arrow); flags, meters and subject
 * artwork never mirror. Decorative by contract (aria-hidden): every label
 * it accompanies is complete on its own.
 */

export function FlowChevron({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`ei-row-chevron shrink-0 ${className}`}
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}
