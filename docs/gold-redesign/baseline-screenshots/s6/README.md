# S6 screenshot set — the relationship explorer + the re-scoped cards (GUX-S6 M6)

20 captures over the visual harness's fixture server (`visual/fixture-server.mjs`, port 4050 — never a live site), the S5 set's own corpus (`gold-projection.json` + `gold-ohlc.json`, unchanged). The playwright project `gux-s6` (`apps/web/visual/gux-s6-screenshots.plw.ts`) scrolls to the explorer's lazy boundary first, then captures.

## The set (20 files)

| Surface | Files |
|---|---|
| `explorer-{viewport}-{locale}-{theme}.png` | 16 — desktop/mobile × en/fa × light/dark: the list (25 rows, the class chips, the X pennants, the legend, the honesty footer) |
| `canvas-{desktop|mobile}-{en|fa}-{light|dark}.png` | 4 — the desktop canvas open (gold hub, the class-grammar edges); mobile captures the list-only explorer (the toggle is hidden below lg BY DESIGN — 12 §5.1's list-first rule) |
| `filter-c-{...}.png` | 4 — the C-class filter active (10 correlation rows) |
| `context-bands-{...}.png` | 4 — the re-scoped context cards (the RatioCards' neutral-ink position bands beside the one-liners) |

## The verification (programmatic)

- All 20 files substantive (size + the non-blank histogram probe — none blank/near-blank).
- Zero console page-errors on every `explorer-*` capture (the full-page error listener).
- The mobile canvas surfaces capture the designed list-only state (the visibility-guarded toggle in the harness — the hidden toggle is the spec's own behavior, not a harness miss).

The owner's own reading: open `explorer-desktop-en-light.png` beside `explorer-desktop-fa-light.png` — the class chips carry the words (M · mechanism…), the X pennants render at full size on the flagged rows, and the honesty footer states the no-edge record; then `canvas-desktop-en-light.png` — gold at the centre, the dashed C edges distinguishable from the solid M edges without color.
