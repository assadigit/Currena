# Research tooling (W4 / the figures refresh)

The scripts in this folder are the doors used to read the published sources
on 2026-11-26 (see docs/compound-tests/figures-research-2026-11-26.md for
what was read and what was blocked). Not part of the app.

- `fetch.ts <url> [filter]` — page-reader fetch (the z-ai SDK door).
- `pw-fetch.ts <url> [filter]` — a real-browser fetch with readable text.
- `links.ts <url> <regex>` — list matching links on a page.
- `download.ts <url> <out>` — browser download (FRED CSV, ABS XLSX).
- `w7-verify.ts`, `inv-check.ts`, `incr-debug.ts`, `us-debug.ts`,
  `layout360.ts` — the one-off verification probes from the v6 build
  (the percent calculator walkthrough, the control inventory, the
  deferred-increase debug, the US tiles, the 360px layout measure).
