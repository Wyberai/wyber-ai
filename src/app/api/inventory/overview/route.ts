import { NextResponse } from "next/server";
import { getOverviewKPIs, isLive } from "@/lib/sap-client";

export async function GET() {
  const [kpis] = await Promise.all([getOverviewKPIs()]);
  return NextResponse.json({ kpis, live: isLive() });
}
