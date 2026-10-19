# Evidence — the prices board cards re-drawn from the owner's sketch (2026-10-17)

The owner's five-point directive (picture beside unit name and price; daily/
weekly/monthly/quarterly percentages; descriptions and verdict; more meta
facts and percentages as bullet points; very small update-time text) shipped
as one rebuilt `PricesBoard` tile anatomy plus the new `price-stats.ts`
derivation module.

## Files

- `en-desktop-prices.png` — EN 1440: the four tiles (icon top-right beside
  price+name, 4 change rows, Description+verdict, bullets, tiny as-of).
- `en-mobile-gold.png` — EN 375: same anatomy, no overflow.
- `fa-desktop-prices.png` — fa RTL 1440: mirrored (icon top-left), unit under
  the digits, «تا»-joined 52-week range, توضیحات + بالا verdict.
- `fa-mobile-gold.png` — fa 375: same anatomy, no overflow.
- `fa-conditions-strip.png` — regression spot-check: the metals analysis
  chips (Tasks 15–17) untouched.
- `measurements.txt` — deployed version, chunk sha256, geometry numbers,
  interaction + console results.

## Production facts at capture time

- Deploy: currena-api `0652db45-3fc2-418f-87c2-bb06caa51e5c`
- Chunk: `Insights-E8NrMws9.js` sha256 `f3a0d27c…` local == served
- SW purge before verification (Task 17 lesson); loaded chunk confirmed.
- `/api/insights` → 32 readings; gold-aud honestly absent (no A$ bullet).
