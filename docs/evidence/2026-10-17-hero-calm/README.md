# Evidence — Round 42: the hero verdict cards calm down (2026-10-17)

Local harness: vite dev :3000 + a read-only :8787 forwarder to currena.ir
(real production data). All shots are the hero verdict cards unless noted.

| File | What it shows |
|------|---------------|
| 00-before-en-light-desktop.png | BEFORE — production state (rainbow meters, 64px region art, 60px state art, flat chip row + reason sentence + calm line + visible rule paragraph + open red lines + pink tiles + how-link) |
| 01-after-en-light-desktop.png | AFTER, EN light: 24/28 region mark, 32/40 state art, mono meter, grouped [Stressed]/[Stable] boxes, "?" tips, bounded bullets container, neutral tiles |
| 02-en-rule-tip-open.png | The verdict-rule tip expanded (the rule paragraph lives here now) |
| 03-en-how-tip-open.png | The how-calculated tip expanded: one-sentence answer + "Read the full explainer ↧" (scrolls + expands About) |
| 04-after-fa-light-desktop.png | AFTER, fa light: «پرتنش»/«پایدار» group boxes, RTL bullets, bare count line on Australia (no box when nothing to list) |
| 05-fa-tips-open.png | fa: both tips expanded («مبنای تعیین وضعیت هر حوزه» / «توضیح کامل‌تر») |
| 06-fa-dark-375.png | fa dark 375px: single column, no horizontal overflow (scrollWidth 375) |
| 07-en-dark-375.png | en dark 375px |
| 08-en-dark-desktop.png | en dark desktop: both cards share one height (mt-auto module), tiles neutral |

DOM checks (agent-browser):
- `button[aria-expanded]` ×2 per card — the rule tip and the how tip; focus +
  Enter toggles; panels carry the full texts.
- `[data-gauge-group]` = 3,1 (Global) / 3,1 (Australia); stable-group meters
  carry exactly one `on-1` segment.
- `[data-attention-bullets] > li` = 3 on Global (markets alert, section
  indicator, currency patterns); Australia renders the bare count line.
- `[data-markets-signal="attention"]` click scrolls to `insights-markets`
  (scroll-mt-24 respected).
- "Read the full explainer" click: scrollY 500 → 11367, About body expanded.
- 375px: `document.scrollWidth === 375` (no bleed). Zero page errors, zero
  console errors.
