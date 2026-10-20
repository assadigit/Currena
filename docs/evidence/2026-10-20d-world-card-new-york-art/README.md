# Evidence — 2026-10-20d: the World card's photo band (the owner's New York picture)

The owner's directive: "Use this picture, turn it to webP, and use it for
the World container. so both containers aus and world now have picture."
The World (Global) region card's header band now carries the owner's
New York harbour photo (`new-york-bg-fade.jpg` →
`apps/web/public/assets/artwork/new-york-bg-faded.webp`, 18.7 KB) beside
Sydney's band on the Australia card. Deployed on currena-api
`fe94fe99-bf15-4042-8064-53a3bf640222`, SITE_MODE=public.

## Captures (live on currena.ir, 2026-10-20d)

| File | What it shows |
| --- | --- |
| `prod-en-hero-1440.png` | EN desktop — both photo bands: Sydney (Australia, left) + the NYC skyline (World, right) with the Statue of Liberty, Lower Manhattan and the Brooklyn Bridge behind the title/pill/count |
| `prod-fa-hero-1440.png` | fa desktop RTL — the same bands mirrored, Persian title/pill readable over the NYC photo |
| `prod-en-mobile-390.png` | EN mobile 390 — the carousel's Global card with its band; scrollWidth 390 (zero overflow) |

## Verification summary

- `/assets/artwork/new-york-bg-faded.webp` → 200 `image/webp`; the live
  `.ei-hero-art--global` rule carries the new-york URL at `72% 50%`
- Band photo-half detail on the live EN capture: **7.6 (World) vs 4.4
  (Australia)** — the NYC band at least as present as Sydney's
- VLM pass: the NYC skyline "distinctly visible … easily identify it as a
  cityscape"; all title/pill/count text readable EN + fa
- fa RTL band detail 4.8; mobile 390 zero overflow; console + page
  errors zero; `/api/insights` 200 with 32 readings (data surface untouched)
- Local gates: web 698/698 · visual 19/19 · typecheck 6/6 · lint 0
  errors · copy:audit clean · budgets held (no JS change)
