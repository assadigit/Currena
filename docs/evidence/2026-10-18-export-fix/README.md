# Evidence — 2026-10-18b: the CSV and XLSX exports open correctly in Excel

Owner report: "The xlsx and csv outputs are incomplete and not working.
md and txt works." — feature commit `ca991e7`, deployed currena-api
`be5c0121` from HEAD `ca991e7`.

## Forensics (before the fix)

Repro built all four formats from REAL production data through the
app's own builders (en + fa):

- CSV strict RFC-4180 parse-back: 116 rows × 26 cols, every section +
  all 51 readings → the builders were complete; "incomplete" was
  Excel-side (the sparse 26-slot matrix + mojibake from BOM-less UTF-8
  on fa-Windows).
- XLSX: `unzip -t` clean, every XML part well-formed, openpyxl read
  all 10 sheets/131 rows — with the warning "Workbook contains no
  default style" (the strict-viewer repair-or-refuse class).

## After the fix (these artifacts)

- `full-fa.csv` / `full-en.csv` — UTF-8 **with BOM**, one dense block
  per section (title + meta floor, heading, the section's own header,
  its rows). fa sample row: `gold-usd,قیمت طلا، هر اونس,,4194.6,…`
- `full-fa.xlsx` / `full-en.xlsx` — hardened package: docProps
  core/app, named "Normal" style, per-sheet `<dimension>` + `<cols>`
  width 22, `xml:space` on `<t>`, plain-decimal `<v>`, and the fa
  workbook's sheets open right-to-left. openpyxl now reads with ZERO
  warnings. Deterministic bytes preserved.

## In-browser + production verification

- `browser-export-panel.png` — the harness (vite :3000 over prod data),
  the export panel with all four format rows.
- All four format buttons clicked through the real UI — zero page /
  console errors (the new `.catch` never fired).
- Production (currena.ir, after the one-reload SW cycle): CSV + XLSX
  clicked zero-error; the deployed chunks (`full-export-zgApEZWy.js`,
  `xlsx-writer-DzSEJ58r.js`) probed in-page — every hardening live.
- `prod-fa-export-panel.png` — production fa export panel;
  `prod-fa-375.png` — 375 px, scrollWidth === 375.
