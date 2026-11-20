# Persian copy round 91 — GUX S5 M1 the gold content module + the five-group label finals (S3-D4)

**Session:** S5 of the Gold UX Redesign program, milestone M1 — the content
foundation (2026-11-20) · **Scope:** (1) the gold indicator content
module's fa strings, entering runtime sources for the first time: the
EAGER brief map (`apps/web/src/features/gold/content/gold-content-brief-fa.ts`,
37 voters × plainLabel + defaultCopy) and the LAZY deep map
(`gold-content-deep-fa.ts`, all 52 records — 37 voters + 11 context + 4
licence-blocked — × the full 09 field set); (2) the five-group label
finals (S3-D4, 08 §5.1): the five lane titles + five one-line intros,
changed in BOTH fa homes (pd.gold.* in `fa.ts` and
`signals.goldScore.laneNames` / `signals.balance.laneIntro` in
`insights-copy-fa.ts` — byte-identical mirrors, enforced by the
gold-copy pin) · **Manifest:** 8,484 → 9,140 entries (656 new, all
`processed` under this round; the 20 changed label/intro keys updated in
place).

## The wording decisions (reviewed in-context against 09 + the terminology glossary)

1. **NO re-authoring — byte-faithful transcription.** Every fa string in
   the module is transcribed verbatim from
   `docs/gold-redesign/09-indicator-explanations-fa-en.md` (Session 3's
   authored records, S3-D3), which were authored to the workflow's
   standards: native voice (not translation-ese), no em dashes, the
   corpus's established glossary terms («بازده واقعی» · «حباب» ·
   «پوزیشن» · «سربه‌سر» · «صرف سررسید»), ZWNJ نیم‌فاصله and Persian
   digits in static text. The 09 records remain the content of record;
   this round only admits them into the runtime manifest discipline
   (08 §6.3's own contract: the round happens when the strings enter the
   dictionaries).
2. **The five-group label finals (S3-D4, 08 §5.1)** — the lane
   vocabulary the meter's five lanes are introduced by:
   «نرخ بهره و هزینهٔ استقراض» · «دلار آمریکا» · «تنش و عدم قطعیت
   بازار» · «تورم و انتظارات تورمی» · «پوزیشن معامله‌گران و
   جریان‌ها», each with its one-line intro («پولِ نشسته چه بازدهی
   می‌دهد؛ وقتی بهرهٔ واقعی بالا برود، طلا رقیبی سرسخت پیدا می‌کند.»
   and the four siblings). Cautious-voiced («معمولاً» · «می‌تواند»), no
   good/bad framing, no em dashes; the EN halves may carry em dashes (EN
   is allowed). Applied to BOTH fa homes; the en mirrors changed in the
   same edit (not manifest-tracked — en is parity-only).
3. **The locale-neutral measurement values are duplicated, not
   forked.** unit · referencePeriod · firingRule · source and the
   relations R-ids ride the fa deep file with the identical values as
   the en file (09's measurement lines are locale-neutral); the
   `gold-content.test.ts` sync pin enforces they never drift. The same
   holds for the blocked quartet's EN-sourced passages
   (whatItWouldShow · blockedReason · ownerLever — 09 authored no fa
   versions; only the fa label and the fa «چرا برای طلا مهم است»
   summary are fa-authored), carried verbatim so the audit's en↔fa
   key-parity check holds; the shipped fa runtime home of the blocked
   notes stays the pd.gold.blocked* copy (the publication-notes tail).
4. **09's authoring Notes lines are excluded by instruction** — they
   are authoring notes (placement drift warnings, cross-page homes),
   not runtime copy; they stay in the doc.
5. **The module's structural pins** (gold-content.test.ts): 37/37
   brief key parity en↔fa, 52/52 deep key parity, the analogy on
   exactly the nine records 09 authored one for, no empty strings,
   every voter id present in the engine's GOLD_LANE_VOTERS (never
   invented, never renamed), the four blocked records present. The
   audit's two new translation-parity pairs (goldBriefEn↔goldBriefFa ·
   goldDeepEn↔goldDeepFa) enforce the key-set mirror at gate time.
6. **Not consumed yet** — the module is the M3/M4 wiring's content
   source; nothing imports it at M1 (the bundle check recorded zero
   content chunks), so no visitor-facing surface changed beyond the
   five lane titles + intros (their surfaces: the lane meter's headers,
   the Signals ledger rows, the balance weights' accessible names, the
   Iran bridge's Chain-2 close link).

## The reviewed keys

- **The changed 20** (both fa homes each): `pd.gold.laneBorrowingCosts`
  · `laneDollar` · `laneStress` · `laneInflation` · `laneFlows` and the
  five `laneIntro*` siblings (fa.ts) + `signals.goldScore.laneNames.*`
  (5) and `signals.balance.laneIntro.*` (5) (insights-copy-fa.ts).
- **The new 656 manifest entries** — the content module's fa slots:
  `<voter-id>.plainLabel` / `.defaultCopy` (37, from the brief file —
  the deep file's identical values ride the same ids) plus the deep
  tier's `.techName` (48 — 09's «...» technical names) · `.unit` ·
  `.referencePeriod` · `.firingRule` (the 37 voters' fire rules) ·
  `.source` · `.whatWhy` (48) · `.rises` / `.falls` (48) · `.analogy`
  (9) · `.visualReading` (48) · `.relations.N` (the R-ids) and the
  blocked quartet's `.whatItWouldShow` · `.whyItMatters` ·
  `.blockedReason` · `.ownerLever` (fa-authored: label + whyItMatters).

The terminology reference: `docs/localization/persian-terminology.md` —
the S3 content-system section (S3-D6, recorded before this round
specifically so the round has its reference: the five driver-group
labels, the explanation-register anchors «معمولاً بر طلا فشار می‌آورد» /
«معمولاً از طلا حمایت می‌کند» / «از نظر تاریخی», and the records'
recurring vocabulary). The five-group label table there is exactly what
this round shipped.

## M2 addendum — the LaneBar condition words + the AsOfChip freshness vocabulary (17 entries)

The same round's second wave (GUX-S5 M2, the primitives): the ten
per-lane condition words + the compact split word (11 §5.3 — the
LaneBar's state vocabulary: «آرامش / فشرده» borrowing · «تحت فشار /
قوی» dollar · «تشدید / آرام» stress · «داغ / خنک» inflation · «آرام /
شلوغ» flows · «مختلط ({supports}·{pressures})» split) and the six
AsOfChip freshness words (11 §6.4 — «تا {time}» · «تازه» · «با تأخیر»
· «کهنه» · «در انتظار» · «آخرین تازه‌سازی موفق», the cache phrase
reusing the shipped pricesAsOfLastSuccessful wording verbatim). The
condition words are authored per 08 §5.1's five pairs (relief/tight ·
strong/stress · elevated/calm · hot/cool · calm/elevated) with
«آرامش» pinned from 11 §5.3's own example; the rest follow the
corpus's established register (تازه‌سازی، تأخیر، در انتظار). The
terminology additions are mirrored in persian-terminology.md.
