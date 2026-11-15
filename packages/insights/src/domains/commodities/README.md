# domains/commodities/

The commodities domain's adapters: `eia` (the wti/brent/natgas spot workbooks), `eia-stocks` (crude stocks + SPR + production), `portwatch` (the five chokepoint transit series), `fng` (crypto fear&greed) and `bitstamp` (btc-usd OHLC). Boundary note (D2): the `prices/` live-price job and the `goldapi` adapter are engine-shared — the gold hero overlay, the commodities live cards and the global ribbon all consume the serve-time merge — so they live in `shared/prices/` and `shared/adapters/` instead of here.
