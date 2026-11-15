# features/gold/

The `/gold` domain — twenty-two files when Phase 3 (M8) lands them: `GoldPage`, `GoldHero`, `GoldSeats`, `GoldPositions`, `GoldBalanceClassic`, `GoldContext`, `gold-tiles`, `gold-backtest-core` and their tests (copy-pin, frozen scenarios, backtest), plus the `components/` subfolder carrying `Signals.tsx` and `signals/` (verdict, BalanceScale, BalanceWeight, MergedCard, icons). Boundary note (deviation D1): `gold-score.ts` stays in the engine's `shared/` — its 37 lane voters span five domains — so this folder owns the gold presentation, never the shared voter table.
