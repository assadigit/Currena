# Persian copy round 53 — the Gold Program panels (S2.1)

**Date:** 2026-10-31 · **Scope:** 74 flagged fa strings — 73 dictionary
strings in `apps/web/src/i18n/insights-copy-fa.ts` (`signals.goldScore.*`
(55) and `signals.goldModelVsReality.*` (18), the two gold panels' copy
that moved from the `@currena/insights` package into the web
repositories) plus one hardcoded technical glyph (the U+066A percent
sign in ModelVsRealityPanel.tsx — the PriceDetails.tsx precedent).

**Basis:** the owner's 2026-10-31 review of the deployed S2 panels —
"I saw them, but there are two problems: 1. they're only latin, while must
be bilingual. 2. it's placed on the wrong section of the site … it must
place here: برآیند عوامل مؤثر بر قیمت طلا" — plus this session's
translation round. The copy follows `persian-terminology.md` and reuses
the site's established vocabulary wherever a concept already had a name
(see the decisions below). Rendering in the real UI context is asserted
by `apps/web/src/components/insights/signals/gold-panels.test.tsx` (fa
locale, Persian digits, RTL-safe bdi isolation) and was eyeballed live on
currena.ir in both locales after the S2.1 deploy.

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| Tailwind / headwind (the score's direction) | باد موافق / باد مخالف | The EN metaphor kept as the established Persian idiom; the 5-step labels reuse it (باد موافق قوی …). «متعادل» for *balanced* matches the balance's own verdict word (`signals.balance.verdictBalanced`). |
| No read (nothing firing) | فعلاً قابل ارزیابی نیست | The site's fixed vocabulary (`trayUnread`, `conditionState.unknown`, the balance's `verdictNone`). |
| The four lanes | هزینهٔ استقراض · دلار · تنش بازار · تورم | New lane «هزینهٔ استقراض» (borrowing costs — broader than «نرخ بهره»: includes curves/spreads); the other three reuse the balance's condition names verbatim. |
| Lane readings | گران/ارزان (borrowing) · قوی/تحت فشار (dollar) · بالا/آرام (stress) · داغ/خنک (inflation) · مختلط · قابل ارزیابی نیست | Plain-language pairs (I15: ساده و مردمی); «مختلط» matches `verdictStateNames.mixed`; unreadable matches the fixed vocabulary. |
| Firing | فعال | «{firing} مورد از {total} عامل فعال است» — counts in Persian digits via Intl fa-IR. |
| Voter names | compact forms of the indicator cards' fa names | e.g. «بازده واقعی اوراق قرضه» (signals condition name), «شاخص دلار», «دلار در برابر ین ژاپن», «شاخص ترس بازار», «پوزیشن معامله‌گران طلا»; tickers stay Latin in parentheses where the site already does so (CPI, PCE, HICP). |
| Evidence words | رو به افزایش / رو به کاهش / در بالای دامنهٔ ده‌ساله / در پایین دامنهٔ ده‌ساله | Echoes the footing-row band vocabulary («جایگاه قیمت در بازه ده‌ساله»). |
| Model vs reality | مدل در برابر واقعیت | The comparison's name; the question keeps the hedged site voice. |
| Chips | هم‌خوان: … / واگرا: … | No em dashes in fa (the glossary's rule) — the EN em-dash separator becomes «:». «به نفع طلا / به ضرر طلا» reuse the balance's verdict words. |
| Explainer joiners | ؛ and ، | The EN em dashes become Persian semicolons/commas per the glossary. |
| Percent sign | ٪ (with fa-IR digits) | The panel renders `٪` in fa and `%` in EN; the value itself stays in a `bdi dir="ltr"`. The glyph is triaged as a technical character (the PriceDetails.tsx round-52 precedent). |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts` (shape
   type-checked against `InsightsCopy`).
2. `pnpm copy:audit` flagged all 74 fa strings as NEW.
3. Reviewed against the glossary + the existing dictionary (DIVERGENT
   advisory read; «قابل ارزیابی نیست»/«خنثی»/«متعادل» intentionally reuse
   the site's fixed words).
4. This document written as the round's record; the manifest updated with
   `pnpm copy:audit:update --status processed --round round-53
   --reference persian-copy-round-53-gold-panels.md`.
5. `pnpm copy:audit` exits 0.
