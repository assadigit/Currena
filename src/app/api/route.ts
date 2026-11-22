import { NextResponse } from "next/server";

/** Health check for the AURUM desk services. */
export async function GET() {
  return NextResponse.json({
    service: "aurum-desk",
    layers: { briefing: "S8", visuals: "S9" },
    status: "ok",
    time: new Date().toISOString(),
  });
}
