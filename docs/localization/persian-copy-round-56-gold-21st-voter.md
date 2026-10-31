# Persian copy round 56 — the 21st voter's name (Session 6 / the D-5 promotion)

**Date:** 2026-10-31 · **Scope:** 1 flagged fa string in
`apps/web/src/i18n/insights-copy-fa.ts` — the gold tailwind panel's
firing-driver list gains the promoted 21st voter's compact name
(`signals.goldScore.voterNames['breakeven-tilt']`, 1 string). The EN
dictionary gains the same key ("Inflation tilt"); the EN side is not
manifest-tracked, the fa side is.

**Basis:** the owner's D-5 decision (Session 5, decided-YES — "we can
have 21"; implementation Session 6, `docs/insights/GOLD_BACKTEST_SPEC.md`
decision log + `docs/insights/GOLD_SCORE_SPEC.md` §2.1): the
`breakeven-tilt` series (T5YIFR − T5YIE) is promoted to the 21st gold
voter, in the inflation lane, polarity +1, level-leg only — exactly the
variant S4's B4 measured. The driver list the panel renders must name
it, in both locales, through the same reviewed-copy path as every other
insights string.

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The voter's compact name | شیب انتظارات تورمی | The compact form of the card's own round-54 name «شیب انتظارات تورمی بازار» — the round-53 convention for this list is compacted card names (e.g. «تنش در بازارهای پول آمریکا» → the list's own row), so the driver list drops «بازار» and keeps the established «شیب» + «انتظارات تورمی» pair; no new coinage. |
| شیب (tilt/slope) | شیب | Established in round-54 (the card name + the lane-phrase copy); the geometric metaphor already read and reviewed. |
| No digits, no tickers | (none) | The name carries neither — nothing to transliterate; the Latin series ids never render to users. |

## Compliance

- No em dash; no Latin tokens; ZWNJ hygiene (شیب انتظارات تورمی needs
  none — all regular spaces); Persian digits: none required (no numbers).
- The dictionary-coverage test (`gold-panels.test.tsx`) enforces the
  exact-match rule: `voterNames` keys ≡ the engine's 21-voter table ids,
  both locales — the new key is the only way the promoted table passes.

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same key).
2. `pnpm copy:audit` flagged the 1 fa string as NEW.
3. Reviewed against the glossary + the round-53/54 gold-panel
   vocabulary (the name reuses «شیب» and «انتظارات تورمی» verbatim).
4. This document written as the round's record; the manifest updated
   with `pnpm copy:audit:update --status processed --round round-56
   --reference persian-copy-round-56-gold-21st-voter.md`.
5. `pnpm copy:audit` exits 0.
