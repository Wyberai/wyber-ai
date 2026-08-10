import { NextResponse } from "next/server";
import { getPurchaseOrders, isLive } from "@/lib/sap-client";

export async function GET() {
  const orders = await getPurchaseOrders();
  return NextResponse.json({ orders, live: isLive() });
}
