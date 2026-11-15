# features/usa/

The `/usa` domain — fifteen files when Phase 3 (M3) lands them: `UsaPage`, `UsaTierCards`, `UsaTicSection`, `UsaVerdictStrip` (the D-30 verdict strip), `usa-tiles`, `usa-backtest-core`, `usa-tic-copy`, `lib/tic` (the TIC snapshot client) and their tests (copy-pin, tiles, TicSection). Documented cross-domain edge (overlap N1): `usa-backtest-core` is also the universal backtest harness every other domain's `-backtest-core` imports — it keeps its name and stays here (no rename: the bundle-budget gate and the pd-* scripts match basenames).
