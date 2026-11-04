#!/usr/bin/env bash
# ga-s1-fred-verify.sh — GA-S1 (gold meter audit) read-only source verification.
# Keyless: uses FRED's public fredgraph.csv endpoint (the same route the repo's
# ingest reads). No key, no writes. Prints per-series: HTTP status, first/last
# observation dates, point count. Evidence for 02-REFERENCE-TAXONOMY.md v1.
# Usage: bash packages/insights/scripts/ga-s1-fred-verify.sh
set -u
SERIES=(
  DFII10 DFII5 DFII2 DFII7 DFII20 DFII30
  DFEDTARU DFEDTARL DFF DGS2 DGS10 DGS30 T10Y2Y
  T5YIFR T5YIE T10YIE
  CPIAUCSL CPILFESL PCEPILFE MICH UMCSENT M2SL
  MEDCPIM158SFRBCLE MEDCPIM158SFRBCML STICKCPIM158SFRBATL STICKCPIM158SFRBCLE
  VIXCLS BAMLH0A0HYM2 BAMLC0A0CM NFCI STLFSI4 STLFSI2
  DTWEXBGS DTWEXAFEGS DTWEXEMEGS DTWEXB
  GFDEGDQ188S WSEFINTL1 MTSDS133FMS WALCL WRESBAL SOFR IORB RRPONTSYD WTREGEN
  DISCBORR WBTFL WLCR RRPONTSYAWARD
)
for id in "${SERIES[@]}"; do
  code=$(curl -s -o "/tmp/fred_${id}.csv" -w "%{http_code}" --max-time 30 \
    "https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}")
  if [ "$code" != "200" ]; then
    printf "%-22s HTTP %s (absent/blocked)\n" "$id" "$code"
    continue
  fi
  n=$(grep -c '^[0-9]' "/tmp/fred_${id}.csv" 2>/dev/null || echo 0)
  first=$(grep -o '^[0-9-]*' "/tmp/fred_${id}.csv" | sed -n '2p')
  last=$(grep -o '^[0-9-]*' "/tmp/fred_${id}.csv" | tail -1)
  printf "%-22s HTTP %s  rows=%-6s first=%-12s last=%s\n" "$id" "$code" "$n" "$first" "$last"
done
