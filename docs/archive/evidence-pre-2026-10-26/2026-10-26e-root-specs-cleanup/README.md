# 2026-10-26e — the root spec-file cleanup deploy (worker 26c23d91)

Docs-only round (commit `057cd20`, the work order's exact message
`chore(docs): organize misplaced specification files`):
`economic-indicators-ui-spec.md` → `docs/insights/` and
`REMAINING_WORK.md` → `docs/`, both R100 byte-identical renames; the
README pointer + the verification-notes header updated; CHANGELOG
§2026-10-26e + D-34 recorded. The deploy is runtime-identical to the
2026-10-26d deployment (the deploy uploaded NO updated assets; both
served chunks are sha256-identical to the 26d live verification:
`index-DJK_gsXg.js` 8f2ba133… / `Insights-CH3Xq64v.js` 1872ef4f…).

Live captures (agent-browser, fresh profile, currena.ir, post-deploy,
zero console + zero page errors in every combo):

- `live-26e-en-desktop.png` — EN desktop 1366: home renders.
- `live-26e-mobile-390.png` — EN mobile 390: scrollWidth 390 =
  innerWidth 390 (zero horizontal overflow).
- `live-26e-fa-desktop.png` — fa RTL desktop: «کورنا، مبدل ارز»,
  `dir=rtl` / `lang=fa`.
- `live-26e-fa-insights.png` — fa `#/insights` (the moved spec's
  page): «شاخص‌های اقتصادی» + section headings render, scrollWidth
  1366 = innerWidth 1366.

Gates on `057cd20`: typecheck 6/6 · 1,536 tests green (web 564) ·
lint 0 errors / 15 accepted advisories · copy:audit clean · build OK ·
budgets held (entry 295.29/88.81; Insights 635.91/152.00).
