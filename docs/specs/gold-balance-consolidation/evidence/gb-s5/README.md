# GB-S5 evidence — P3: the Outlook derived from the balance (production)

Captured 2026-11-04 on the deployed build (currena-api `a803f526` @ 100%,
deployment `754dccb6`), fresh contexts, live data. The day's live reading:
the four lanes all quiet — **Balanced / «متعادل» · "0 for · 0 against · 4
not leaning"** — with gold's 30-day move at **−5.19%** (outside the 2%
range bar, so no range evidence). Under the OLD derivation that falling
month was counted as a 5th "footing" condition and the strip said
**Bearish** beside the Balanced balance (D-GB-6's contradiction); under
the lane derivation the strip says **Neutral**, and the −5.19% shows only
as the context pill.

| File | What it shows |
|---|---|
| `flag-en-1280.png` | The flag view EN desktop: the Outlook strip (gold chip NEUTRAL, silver MIXED — its own path) above the redesigned balance (Balanced, the split lane in the tray). |
| `flag-en-1280-outlook-strip.png` | The strip close-up: the gold chip's flat-dash icon + "Signs point to a neutral outlook for gold prices." — the owner's existing sentence, the lane-derived state (VLM-verified: renders cleanly, no clip). |
| `flag-en-360.png` | The flag view EN mobile: zero horizontal overflow, the strip + balance stack cleanly. |
| `flag-fa-1280.png` | The flag view fa desktop (RTL): «متعادل» + the gold chip «نشانه‌ها حاکی از چشم‌اندازی خنثی برای قیمت طلاست.» |
| `flag-fa-360.png` | The flag view fa mobile: zero overflow (the app's pre-existing RTL off-canvas-menu scrollWidth quirk is the GB-S4c note, identical on the default view). |

The default view (checked in the same pass, both locales): the gold chip
still reads the legacy **bearish** sentence (the old footing-driven
derivation — pinned byte-for-byte until the owner-gated flip), the two
panels + legacy chips + legacy subtitle present, no visual-redesign
element anywhere.

The full production matrix (prod-verify.mjs — 8/8, the flag view AND the
default view × EN + fa × 360 + 1280, fresh contexts): **zero console
errors**; the outlook probe reads `neutral` on every flag-view cell and
`bearish` on every default-view cell, exactly as derived.

The collapsed-section check (live): on the flag view, collapsing the
signals section reads the gold takeaway **"Outlook: Neutral"** (the
lane-derived override) beside silver's own "Outlook: Mixed" — AC-3 holds
in every presentation.

Environment note (the GB-S4c pattern, recorded not fixed): the app's
sticky section-tab row sits over scrolled-under content while scrolling —
measured IDENTICALLY on the flag view and the default view (VLM-compared);
pre-existing app chrome, not a balance regression.
