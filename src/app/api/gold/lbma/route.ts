import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/lbma — the London vault + clearing leg (the Zone K
 * riders the previous gold page carried), reduced to what the cards
 * render: the latest vault stock (gold + silver tonnes, the MoM move,
 * the 124-month spark series) and the latest clearing row — one fetch,
 * cached 5 min, fail-closed 503.
 *
 * The tonnes conversion is exact and disclosed (1 ozt = 31.1034768 g).
 */

export const dynamic = "force-dynamic";

const KOZ_TO_TONNES = 0.0311034768;

interface LbmaSnapshot {
  vault?: { asOf?: string; rows?: Array<{ month: string; goldKoz: number; silverKoz?: number }> };
  clearing?: { asOf?: string; rows?: Array<{ month: string; goldMoz: number; goldValueBn?: number; goldTransfers?: number }> };
}

export async function GET() {
  const snap = await fetchLeg<LbmaSnapshot>("/api/insights/gold-lbma");
  const vaultRows = Array.isArray(snap?.vault?.rows) ? snap!.vault!.rows! : [];
  const clearingRows = Array.isArray(snap?.clearing?.rows) ? snap!.clearing!.rows! : [];
  if (vaultRows.length === 0 || clearingRows.length === 0) {
    return NextResponse.json({ error: "The London vault data could not be read yet." }, { status: 503 });
  }
  const last = vaultRows[vaultRows.length - 1]!;
  const prev = vaultRows[vaultRows.length - 2] ?? null;
  const cLast = clearingRows[clearingRows.length - 1]!;
  return NextResponse.json(
    {
      vault: {
        asOf: snap?.vault?.asOf ?? last.month,
        goldTonnes: Math.round(last.goldKoz * KOZ_TO_TONNES),
        silverTonnes: last.silverKoz !== undefined ? Math.round(last.silverKoz * KOZ_TO_TONNES) : null,
        momPct: prev !== null && prev.goldKoz > 0 ? ((last.goldKoz - prev.goldKoz) / prev.goldKoz) * 100 : null,
        months: vaultRows.map((r) => ({ month: r.month, goldKoz: r.goldKoz })),
      },
      clearing: {
        asOf: snap?.clearing?.asOf ?? cLast.month,
        goldMoz: cLast.goldMoz,
        goldValueBn: cLast.goldValueBn ?? null,
        goldTransfers: cLast.goldTransfers ?? null,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
