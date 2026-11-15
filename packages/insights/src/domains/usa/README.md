# domains/usa/

The USA domain's engine: the `tic/` subfolder (the whole TIC board job — compute, job, model, parse, store) plus the adapters `treasury` (the nominal/real curve CSVs), `auctions` (Treasury FiscalData), `credit` (ebp + ofr-fsi), `rstar` (the NY Fed HLW), `cleveland` (the CPI nowcast), `sp500-breadth` (the RSP/SPY proxy) and `uom` (Michigan expectations). Boundary note (D9): `fred.ts` stays engine-shared — its 66 series span five domains (brent/wti/natgas → commodities, bund/gilt/italy → europe, jgb/boj/nz-10y → asia, DTWEXBGS/EMEGS → currencies, JPNASSETS → global-liquidity).
