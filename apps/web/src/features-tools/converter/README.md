# features-tools/converter/

The `/converter` founding page — `Converter.tsx` + the `converter/` children (ConvertForm, PairChips, QuickTools, FailureCard, RetryCountdown, AlertsSectionRow, shared), the converter-owned components (AlertsDialog, AmountInput, LiveRateLine, Odometer, RateDeltaChip, ResultPopup — deviation D5: ResultPopup is converter's, not infrastructure's, its sole importer being Converter) and `lib/recent-pairs`. The rate-alerts store and the LED boards it reuses stay shared (`shared/lib/alerts`, `features-tools/live-rates`).
