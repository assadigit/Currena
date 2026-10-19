# 2026-10-19 — the v3 merge, live on currena.ir

Deployed: `currena-api` **d50def63-38f6-41a7-9377-bac12c157d1d** (the SPA
assets + the API, SITE_MODE=public) · `currena-markets`
**3f245d75-6693-4fef-a965-97a33fc3b1a4** (both crons re-armed; tonight's
23:30 UTC run backfills `chg1y` — the board serves honest dashes until
then). Merged tree: `f8f55cb` on `main` (= `insights-rebuild`).

## Live-verified 2026-10-19 (production, currena.ir)

- **API smoke**: `/api/status` 200 · `/api/insights` 200 public (32
  readings, displayMode public) · `/api/insights/markets` 200 (16 rows,
  honest `chg1y: null` pre-cron) · `/api/insights/fx` 404 (licence-hidden,
  by design) · `/api/insights/export` 403 `owner_disabled` (the owner
  token secret is not set yet — OWNER_SETUP §2; U-14 accepts 401/403).
- **The v3 hero** renders live: 2 hero cards, the verdict word (Stressed)
  with the v3 anatomy (verdict sentence + reading bar + why-3 + what-next
  + freshness chip).
- **The per-metal balances (UI-45 on the v7 machinery)**: gold AND silver
  each render their own BalanceScale; today's real data is sparse (gold 1
  of 4 readable, silver 1 of 5) so BOTH beams stayed LEVEL with the
  honest refusal — EN: "Not enough readable conditions to weigh", fa:
  «شرایط قابل خواندن برای ترازو کافی نیست» — the v3 UI-40 rule working
  on production data, with the readable-count lines in both locales
  (fa: «۱ مورد از ۴ شرط قابل خواندن است.»).
- **The world-indices briefing** renders with all five lenses
  (Daily/Weekly/Monthly/Quarterly/Yearly) + the wordmarks; the "Show
  full table" disclosure carries the exact UI-27 column set (Market |
  Today | 3 months | From 52-week high | State | Last close, 16 rows)
  with the local-currency note in the table area.
- **fa/RTL**: mirrored layout, Persian digits, silver's own copy
  («برآیند عوامل مؤثر بر قیمت نقره»).
- **390px mobile**: zero overflow across hero, balances, markets (sweep
  clean), no horizontal page scroll.
- **Zero console errors, zero page errors** in every pass.

## Screenshots

- `prod-en-mobile-hero-390.png` — EN mobile, the v3 hero.
- `prod-en-full-mobile-390.png` — EN mobile, full page.
- `prod-en-balances-1600.png` — EN desktop, the per-metal balances.
- `prod-fa-full-1600.png` — fa desktop, full page (RTL).
- `prod-fa-balances-1600.png` — fa desktop, the balances in Persian.
