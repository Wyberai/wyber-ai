/**
 * SAP OData client — server-side only.
 * All types and demo data live in inventory-data.ts (safe to import in client components).
 * This file adds the SAP API layer using Node.js Buffer for Basic Auth.
 */

export type {
  StockStatus, MaterialStock, BatchStock, StockMovement, PurchaseOrder,
  WarehouseStock, DepartmentConsumption, ForecastPoint, MaterialForecast,
  EmailAlert, AlertConfig, OverviewKPIs,
} from "@/lib/inventory-data";

export {
  DEMO_MATERIALS, DEMO_BATCHES, DEMO_MOVEMENTS, DEMO_POS,
  DEMO_WAREHOUSES, DEMO_DEPT_CONSUMPTION, DEMO_ALERTS, DEMO_ALERT_CONFIGS,
  computeHealthScore, computeKPIs, generateForecast,
} from "@/lib/inventory-data";

import {
  type MaterialStock, type PurchaseOrder, type OverviewKPIs,
  DEMO_MATERIALS, DEMO_POS, computeKPIs,
} from "@/lib/inventory-data";

const SAP_BASE_URL = process.env.SAP_BASE_URL?.replace(/\/$/, "") ?? "";
const SAP_USERNAME = process.env.SAP_USERNAME ?? "";
const SAP_PASSWORD = process.env.SAP_PASSWORD ?? "";
const SAP_CLIENT  = process.env.SAP_CLIENT ?? "100";

export const isLive = () => Boolean(SAP_BASE_URL && SAP_USERNAME && SAP_PASSWORD);

function authHeader() {
  const creds = Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${creds}` };
}

async function sapFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SAP_BASE_URL}${path}`);
  url.searchParams.set("$format", "json");
  url.searchParams.set("sap-client", SAP_CLIENT);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { ...authHeader(), "Accept": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`SAP ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getMaterialStock(): Promise<MaterialStock[]> {
  if (!isLive()) return DEMO_MATERIALS;
  try {
    const data = await sapFetch<{ d: { results: Record<string, unknown>[] } }>(
      "/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod",
      { "$select": "Material,Plant,StorageLocation,MatlWrhsStkQtyInMatlBaseUnit,MaterialBaseUnit", "$top": "200" }
    );
    return data.d.results.map((r): MaterialStock => {
      const qty = parseFloat(String(r["MatlWrhsStkQtyInMatlBaseUnit"] ?? 0));
      const daily = 10;
      const reorder = 50;
      return {
        material: String(r["Material"]), description: String(r["Material"]),
        plant: String(r["Plant"]), storageLocation: String(r["StorageLocation"] ?? ""),
        warehouse: "WH-01", category: "RM",
        unrestricted: qty, qualityInspection: 0, blocked: 0,
        openingStock: qty * 1.2, received: 0, issued: qty * 0.4,
        unit: String(r["MaterialBaseUnit"] ?? "EA"),
        lastUpdated: new Date().toISOString(), lastMovementDate: new Date().toISOString(),
        stockValue: qty * 60000, currency: "INR",
        reorderPoint: reorder, safetyStock: 25, maxStock: 300,
        dailyConsumption: daily, daysOfCover: qty / daily,
        leadTimeDays: 7,
        status: qty < 20 ? "critical" : qty < reorder ? "low" : qty > 500 ? "overstock" : "healthy",
        slowMoving: false, deadStock: false,
      };
    });
  } catch { return DEMO_MATERIALS; }
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (!isLive()) return DEMO_POS;
  try {
    const data = await sapFetch<{ d: { results: Record<string, unknown>[] } }>(
      "/sap/opu/odata/sap/API_PURCHASEORDER_2/A_PurchaseOrder",
      { "$select": "PurchaseOrder,Material,Plant,OrderQuantity,NetPriceAmount,DocumentCurrency,SupplierName,PurchaseOrderDate,ScheduleLineDeliveryDate", "$top": "100", "$filter": "PurchaseOrderCategory eq 'F'" }
    );
    return data.d.results.map((r): PurchaseOrder => ({
      poNumber: String(r["PurchaseOrder"]), material: String(r["Material"] ?? ""),
      description: String(r["Material"] ?? ""), vendor: String(r["SupplierName"] ?? ""),
      plant: String(r["Plant"] ?? ""),
      quantity: parseFloat(String(r["OrderQuantity"] ?? 0)), unit: "EA",
      netPrice: parseFloat(String(r["NetPriceAmount"] ?? 0)),
      currency: String(r["DocumentCurrency"] ?? "INR"),
      deliveryDate: String(r["ScheduleLineDeliveryDate"] ?? ""),
      createdAt: String(r["PurchaseOrderDate"] ?? ""), status: "Open",
    }));
  } catch { return DEMO_POS; }
}

export async function getOverviewKPIs(): Promise<OverviewKPIs> {
  const [materials, pos] = await Promise.all([getMaterialStock(), getPurchaseOrders()]);
  return computeKPIs(materials, pos);
}
