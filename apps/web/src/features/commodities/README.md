# features/commodities/

The `/commodities` domain — eight files when Phase 3 (M6) lands them: `CommoditiesPage`, `CommoditiesTierCards` (which renders the shared PricesBoard), `commodities-tiles`, `commodities-backtest-core` and their tests (copy-pin, tiles). Boundary notes: the engine's `prices/` job and the goldapi adapter are engine-shared (D2 — the gold hero overlay, the commodities live cards and the global ribbon all consume the serve-time merge), and the PricesBoard price cluster itself is web-shared (D3), rendered here rather than owned.
