# OPEN-ITEMS — what stays open after this build

Everything in the 05-ACCEPTANCE checklists is closed; these are the
items that need a human or a live deployment to finish.

1. **The 05 §F human test** (by design the owner's): show the card to 5
   people for 5 seconds each — "Is it good or bad for gold right now,
   and how sure is it?" Target: 4 of 5 answer both parts. The build
   cannot run this.

2. **A live render on production data.** The card was verified against
   fixture data through the real component, copy and CSS (the 8
   screenshots + the integration test through the real `evaluateSignal`),
   but not on the deployed Worker's live /insights feed. Deploy the
   branch and eyeball currena.ir once — especially the beam settle
   animation's feel on real numbers and the "Updated … · {n} sources"
   count with the real source mix.

3. **Pixel-diff harness (optional).** The reference comparison was done
   as a same-state screenshot pair + a visual pass (BUILD-REPORT
   §Screenshots), not an automated pixel-diff. If you want a permanent
   visual-regression gate, add Playwright with the reference page as a
   baseline — it was deliberately NOT added here (acceptance E.2: no
   new runtime dependency).

4. **The retired presentation's features.** The VerdictStrip (7-state
   outlook chips with the metals' trend charts) and the C12
   gold-high-with-high-real-yields note were part of the replaced
   presentation and are gone from the expanded card, per the spec's
   final anatomy (ASSUMPTIONS §1). The 7-state vocabulary itself still
   lives in the collapsed summary line and the data export. If you want
   either feature back in a future round, the copy and `outlookOf` are
   still in place to build on.

5. **Flip thresholds.** Only two drivers can ever produce a flip line
   today (inflation expectations below 2.4%, market stress below 0) —
   the only concrete thresholds the existing indicator config defines.
   Real yields, the dollar basket and industrial demand are percentile-
   or change-based, so they never qualify. Adding thresholds for them
   would be inventing config (spec 03 forbids it) — an owner decision,
   not a build item.
