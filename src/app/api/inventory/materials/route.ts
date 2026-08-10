import { NextResponse } from "next/server";
import { getMaterialStock, isLive } from "@/lib/sap-client";

export async function GET() {
  const materials = await getMaterialStock();
  return NextResponse.json({ materials, live: isLive() });
}
