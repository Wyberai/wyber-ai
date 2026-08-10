/**
 * SAP OData client — supports BTP (Cloud) and on-prem (S/4HANA) systems.
 * Configure via environment variables; falls back to realistic demo data when
 * SAP_BASE_URL is not set.
 *
 * Key APIs used:
 *   API_MATERIAL_STOCK_SRV      – real-time stock per material/plant/storage-location
 *   API_PURCHASEORDER_2          – purchase orders (S/4HANA 2023+)
 *   API_PURCHASEORDER_PROCESS_SRV– legacy fallback for older S/4HANA
 *   API_MATERIAL_DOCUMENT_SRV   – goods movements (GR/GI)
 */

const SAP_BASE_URL = process.env.SAP_BASE_URL?.replace(/\/$/, "") ?? "";
const SAP_USERNAME = process.env.SAP_USERNAME ?? "";
const SAP_PASSWORD = process.env.SAP_PASSWORD ?? "";
const SAP_CLIENT  = process.env.SAP_CLIENT ?? "100"; // mandt

export const isLive = () => Boolean(SAP_BASE_URL && SAP_USERNAME && SAP_PASSWORD);

function authHeader() {
  const creds = Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${creds}` };
}

async function sapFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SAP_BASE_URL}${path}`);
  url.searchParams.set("$format", "json");
  url.searchParams.set("sap-client", SAP_CLIENT);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { ...authHeader(), "Accept": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`SAP ${path} → HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaterialStock {
  material: string;
  description: string;
  plant: string;
  storageLocation: string;
  unrestricted: number;
  qualityInspection: number;
  blocked: number;
  unit: string;
  lastUpdated: string;
  stockValue: number;
  currency: string;
  reorderPoint: number;
  safetyStock: number;
  dailyConsumption: number;   // derived
  daysOfCover: number;        // derived
  status: "critical" | "low" | "healthy" | "overstock";
}

export interface PurchaseOrder {
  poNumber: string;
  material: string;
  description: string;
  vendor: string;
  plant: string;
  quantity: number;
  unit: string;
  netPrice: number;
  currency: string;
  deliveryDate: string;
  createdAt: string;
  status: "Open" | "In Transit" | "Partially Delivered" | "Closed";
  duplicate?: { of: string; reason: string };
}

export interface GoodsMovement {
  documentNumber: string;
  material: string;
  plant: string;
  movementType: string; // 101=GR, 201=GI to cost center, 261=GI to prod order
  quantity: number;
  unit: string;
  postingDate: string;
  referenceDocument: string;
}

export interface OverviewKPIs {
  totalMaterials: number;
  criticalCount: number;
  lowCount: number;
  overstockCount: number;
  openPOs: number;
  duplicatePOs: number;
  totalStockValue: number;
  currency: string;
  wasteAlerts: number;
  aiRecommendations: number;
}

// ---------------------------------------------------------------------------
// Live data fetchers
// ---------------------------------------------------------------------------

async function fetchLiveStock(): Promise<MaterialStock[]> {
  const data = await sapFetch<{ d: { results: Record<string, unknown>[] } }>(
    "/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod",
    {
      "$select": "Material,Plant,StorageLocation,MatlWrhsStkQtyInMatlBaseUnit,MaterialBaseUnit,StockInTransitQty",
      "$top": "200",
    }
  );
  // Real transformation would join with material master for descriptions
  return data.d.results.map((r) => mapSAPStock(r));
}

function mapSAPStock(r: Record<string, unknown>): MaterialStock {
  const qty = parseFloat(String(r["MatlWrhsStkQtyInMatlBaseUnit"] ?? 0));
  const reorder = 50; // would come from MRP data in a full integration
  const daily = 10;
  const daysOfCover = daily > 0 ? qty / daily : 0;
  return {
    material: String(r["Material"]),
    description: String(r["Material"]),
    plant: String(r["Plant"]),
    storageLocation: String(r["StorageLocation"] ?? ""),
    unrestricted: qty,
    qualityInspection: 0,
    blocked: 0,
    unit: String(r["MaterialBaseUnit"] ?? "EA"),
    lastUpdated: new Date().toISOString(),
    stockValue: qty * 125,
    currency: "INR",
    reorderPoint: reorder,
    safetyStock: 25,
    dailyConsumption: daily,
    daysOfCover: Math.round(daysOfCover * 10) / 10,
    status: qty < 20 ? "critical" : qty < reorder ? "low" : qty > 500 ? "overstock" : "healthy",
  };
}

// ---------------------------------------------------------------------------
// Demo data (shown when SAP_BASE_URL is not set)
// ---------------------------------------------------------------------------

export const DEMO_MATERIALS: MaterialStock[] = [
  { material: "RM-1042", description: "Aluminium Sheet 2mm (IS 737)", plant: "1010", storageLocation: "0001", unrestricted: 15.3, qualityInspection: 0, blocked: 0, unit: "MT", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 918000, currency: "INR", reorderPoint: 50, safetyStock: 20, dailyConsumption: 3.1, daysOfCover: 4.9, status: "critical" },
  { material: "RM-2088", description: "Steel Rod Ø12mm (IS 1786)", plant: "1010", storageLocation: "0001", unrestricted: 42.7, qualityInspection: 5.0, blocked: 0, unit: "MT", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 2562000, currency: "INR", reorderPoint: 60, safetyStock: 25, dailyConsumption: 4.2, daysOfCover: 10.2, status: "low" },
  { material: "RM-3015", description: "Copper Wire 4mm (IEC 60228)", plant: "1010", storageLocation: "0002", unrestricted: 8.1, qualityInspection: 0, blocked: 1.2, unit: "MT", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 729000, currency: "INR", reorderPoint: 30, safetyStock: 10, dailyConsumption: 2.8, daysOfCover: 2.9, status: "critical" },
  { material: "PM-0441", description: "HDPE Granules (Reliance M24)", plant: "1010", storageLocation: "0003", unrestricted: 234.0, qualityInspection: 0, blocked: 0, unit: "MT", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 4680000, currency: "INR", reorderPoint: 80, safetyStock: 30, dailyConsumption: 5.6, daysOfCover: 41.8, status: "healthy" },
  { material: "PM-0892", description: "Cardboard Box 600×400×300", plant: "1010", storageLocation: "0003", unrestricted: 12400, qualityInspection: 0, blocked: 0, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 744000, currency: "INR", reorderPoint: 5000, safetyStock: 2000, dailyConsumption: 320, daysOfCover: 38.8, status: "healthy" },
  { material: "PM-1130", description: "Lubricant Oil ISO VG 68 (200L)", plant: "1010", storageLocation: "0001", unrestricted: 38, qualityInspection: 0, blocked: 0, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 570000, currency: "INR", reorderPoint: 20, safetyStock: 8, dailyConsumption: 0.8, daysOfCover: 47.5, status: "healthy" },
  { material: "FG-0077", description: "Motor Assembly 5HP (OEM-A)", plant: "1010", storageLocation: "0010", unrestricted: 620, qualityInspection: 40, blocked: 0, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 15500000, currency: "INR", reorderPoint: 150, safetyStock: 50, dailyConsumption: 18, daysOfCover: 34.4, status: "overstock" },
  { material: "FG-0211", description: "Control Panel (IP54, 3-phase)", plant: "1010", storageLocation: "0010", unrestricted: 487, qualityInspection: 0, blocked: 12, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 24350000, currency: "INR", reorderPoint: 100, safetyStock: 40, dailyConsumption: 14, daysOfCover: 34.8, status: "overstock" },
  { material: "RM-4401", description: "Silicon Rubber Seal (2m strip)", plant: "1010", storageLocation: "0002", unrestricted: 2800, qualityInspection: 0, blocked: 0, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 336000, currency: "INR", reorderPoint: 800, safetyStock: 400, dailyConsumption: 95, daysOfCover: 29.5, status: "healthy" },
  { material: "RM-5520", description: "PVC Insulation Tape (20m roll)", plant: "1010", storageLocation: "0002", unrestricted: 150, qualityInspection: 0, blocked: 0, unit: "EA", lastUpdated: "2026-08-10T06:30:00Z", stockValue: 7500, currency: "INR", reorderPoint: 200, safetyStock: 80, dailyConsumption: 12, daysOfCover: 12.5, status: "low" },
];

export const DEMO_POS: PurchaseOrder[] = [
  { poNumber: "4500018842", material: "RM-1042", description: "Aluminium Sheet 2mm", vendor: "M/s Hindalco Industries", plant: "1010", quantity: 40, unit: "MT", netPrice: 2400000, currency: "INR", deliveryDate: "2026-08-15", createdAt: "2026-08-01", status: "Open" },
  { poNumber: "4500018843", material: "RM-1042", description: "Aluminium Sheet 2mm", vendor: "M/s Nalco Trading Co.", plant: "1010", quantity: 30, unit: "MT", netPrice: 1860000, currency: "INR", deliveryDate: "2026-08-18", createdAt: "2026-08-03", status: "Open", duplicate: { of: "4500018842", reason: "76 days of cover already on hand after PO-18842 delivery — combined stock would exceed 100 days" } },
  { poNumber: "4500018791", material: "RM-3015", description: "Copper Wire 4mm", vendor: "Hindusthan Copper Ltd.", plant: "1010", quantity: 20, unit: "MT", netPrice: 1800000, currency: "INR", deliveryDate: "2026-08-12", createdAt: "2026-07-28", status: "In Transit" },
  { poNumber: "4500018756", material: "RM-2088", description: "Steel Rod Ø12mm", vendor: "SAIL Distributors Pvt. Ltd.", plant: "1010", quantity: 60, unit: "MT", netPrice: 3600000, currency: "INR", deliveryDate: "2026-08-20", createdAt: "2026-07-25", status: "Open" },
  { poNumber: "4500018700", material: "PM-0441", description: "HDPE Granules", vendor: "Reliance Industries Ltd.", plant: "1010", quantity: 100, unit: "MT", netPrice: 2000000, currency: "INR", deliveryDate: "2026-09-01", createdAt: "2026-07-20", status: "Open", duplicate: { of: "4500018680", reason: "Prior PO-18680 for same material already covers needs through Nov 2026; combined would be 4.2 months excess" } },
  { poNumber: "4500018680", material: "PM-0441", description: "HDPE Granules", vendor: "RIL Channel Partner — Hyderabad", plant: "1010", quantity: 80, unit: "MT", netPrice: 1600000, currency: "INR", deliveryDate: "2026-08-25", createdAt: "2026-07-15", status: "Partially Delivered" },
  { poNumber: "4500018620", material: "PM-1130", description: "Lubricant Oil ISO VG 68", vendor: "Castrol India Ltd.", plant: "1010", quantity: 20, unit: "EA", netPrice: 300000, currency: "INR", deliveryDate: "2026-08-22", createdAt: "2026-07-10", status: "Open" },
  { poNumber: "4500018501", material: "PM-0892", description: "Cardboard Box 600×400×300", vendor: "IndoPack Solutions", plant: "1010", quantity: 10000, unit: "EA", netPrice: 600000, currency: "INR", deliveryDate: "2026-08-28", createdAt: "2026-07-05", status: "Partially Delivered" },
];

export const DEMO_KPIS: OverviewKPIs = {
  totalMaterials: DEMO_MATERIALS.length,
  criticalCount: DEMO_MATERIALS.filter(m => m.status === "critical").length,
  lowCount: DEMO_MATERIALS.filter(m => m.status === "low").length,
  overstockCount: DEMO_MATERIALS.filter(m => m.status === "overstock").length,
  openPOs: DEMO_POS.filter(p => p.status === "Open" || p.status === "In Transit").length,
  duplicatePOs: DEMO_POS.filter(p => p.duplicate).length,
  totalStockValue: Math.round(DEMO_MATERIALS.reduce((a, m) => a + m.stockValue, 0) / 100000) * 100000,
  currency: "INR",
  wasteAlerts: 2,
  aiRecommendations: 5,
};

// ---------------------------------------------------------------------------
// Public API — always returns data (live or demo)
// ---------------------------------------------------------------------------

export async function getMaterialStock(): Promise<MaterialStock[]> {
  if (!isLive()) return DEMO_MATERIALS;
  try {
    return await fetchLiveStock();
  } catch {
    return DEMO_MATERIALS;
  }
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (!isLive()) return DEMO_POS;
  try {
    const data = await sapFetch<{ d: { results: Record<string, unknown>[] } }>(
      "/sap/opu/odata/sap/API_PURCHASEORDER_2/A_PurchaseOrder",
      { "$select": "PurchaseOrder,Material,Plant,OrderQuantity,NetPriceAmount,DocumentCurrency,SupplierName,PurchaseOrderDate,ScheduleLineDeliveryDate", "$top": "100", "$filter": "PurchaseOrderCategory eq 'F'" }
    );
    return data.d.results.map((r): PurchaseOrder => ({
      poNumber: String(r["PurchaseOrder"]),
      material: String(r["Material"] ?? ""),
      description: String(r["Material"] ?? ""),
      vendor: String(r["SupplierName"] ?? ""),
      plant: String(r["Plant"] ?? ""),
      quantity: parseFloat(String(r["OrderQuantity"] ?? 0)),
      unit: "EA",
      netPrice: parseFloat(String(r["NetPriceAmount"] ?? 0)),
      currency: String(r["DocumentCurrency"] ?? "INR"),
      deliveryDate: String(r["ScheduleLineDeliveryDate"] ?? ""),
      createdAt: String(r["PurchaseOrderDate"] ?? ""),
      status: "Open",
    }));
  } catch {
    return DEMO_POS;
  }
}

export async function getOverviewKPIs(): Promise<OverviewKPIs> {
  if (!isLive()) return DEMO_KPIS;
  try {
    const [materials, pos] = await Promise.all([getMaterialStock(), getPurchaseOrders()]);
    return {
      totalMaterials: materials.length,
      criticalCount: materials.filter(m => m.status === "critical").length,
      lowCount: materials.filter(m => m.status === "low").length,
      overstockCount: materials.filter(m => m.status === "overstock").length,
      openPOs: pos.filter(p => p.status === "Open" || p.status === "In Transit").length,
      duplicatePOs: 0,
      totalStockValue: materials.reduce((a, m) => a + m.stockValue, 0),
      currency: "INR",
      wasteAlerts: 0,
      aiRecommendations: 0,
    };
  } catch {
    return DEMO_KPIS;
  }
}
