# 2026-10-16 full-export evidence

The owner's one-file "download all data" export (MD / TXT / CSV / XLSX)
— feature record in CHANGELOG §2026-10-16, deploy record in
docs/DEPLOY.md, verification numbers below.

## Local verification (dev harness: vite + read-only production forwarder)

- **Downloads fire for all four formats** (en, desktop): MD 17,395 B
  `text/markdown`; TXT 16,778 B `text/plain`; CSV 17,729 B `text/csv`;
  XLSX 77,366 B with the spreadsheet MIME — filenames all
  `currena-insights-full-<snapshot-date>.<ext>`.
- **File contents inspected, not assumed**: the MD opens with the title,
  the meta bullets (subtitle, data-as-of, prices-updated, rule version)
  and a `## Where things stand` verdict table fed by the live snapshot;
  the CSV's first line is the stable 26-column header and every row is
  section-tagged with ASCII numbers; the XLSX starts with the ZIP magic
  (PK) and carries one sheet per section.
- **fa locale**: Persian button/panel labels, RTL, fa XLSX downloads
  (84,569 B — Persian names are longer); values stay ASCII in every
  locale.
- **Off-screen popover bug found + fixed** (see the clamp commit): the
  Tools panel slid 75 px off-screen at 375 px EN, and the new export
  panel did the mirrored thing in fa. Both now clamp inside the
  viewport: EN 375 px Tools 8..353, export 8..348; fa 375 px export
  27..367, Tools 22..367. No horizontal page overflow anywhere.

## Production verification (currena.ir, post-deploy `30f647f6`)

- The button renders on the live site; the XLSX downloads from
  production (77,366 B, byte-identical size to the local run against
  the same snapshot); the panel clamps inside the viewport at 375 px
  (8..348); zero page errors and zero console messages on fresh loads,
  both viewports.

## Files

- `export-menu-en-light-desktop.png` — the open format panel, EN, 1440 px
- `export-menu-fa-desktop.png` — the open format panel, fa RTL
- `export-menu-fa-dark-mobile.png` — fa dark 375 px, panel open
- `export-menu-en-light-mobile-prod.png` — production 375 px, panel open
