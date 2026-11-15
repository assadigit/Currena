# shared/i18n/

The dictionaries: `index.ts` (the i18n hook, 80 importers), `en.ts`/`fa.ts` (the app copy) and `insights-copy-en.ts`/`insights-copy-fa.ts` (the insights corpus, read by 40+ components across every domain). These files are gate-referenced machinery: the Persian-copy audit's SOURCES list, the narrator-vocabulary generator and the selfcheck GHA import them by path, so those paths update in the same commit as the Phase 2 move (risk R7), and every user-facing fa string stays fingerprinted in the manifest per the copy workflow. Created empty in M1; the files arrive in Phase 2.
