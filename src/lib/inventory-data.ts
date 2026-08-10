/**
 * Demo data and pure functions for the inventory dashboard.
 * Safe to import from both server and client components.
 * sap-client.ts re-exports these and adds the live SAP API layer.
 */

export type StockStatus = "critical" | "low" | "healthy" | "overstock" | "dead";

export interface MaterialStock {
  material: string; description: string; plant: string; storageLocation: string;
  warehouse: string; category: "RM" | "PM" | "FG" | "SFG";
  unrestricted: number; qualityInspection: number; blocked: number;
  openingStock: number; received: number; issued: number;
  unit: string; lastUpdated: string; lastMovementDate: string;
  stockValue: number; currency: string;
  reorderPoint: number; safetyStock: number; maxStock: number;
  dailyConsumption: number; daysOfCover: number; leadTimeDays: number;
  status: StockStatus;
  slowMoving: boolean; deadStock: boolean;
}

export interface BatchStock {
  material: string; batchNumber: string; quantity: number; unit: string;
  receivedDate: string; expiryDate: string | null; warehouse: string;
  status: "Available" | "Restricted" | "Expired";
}

export interface StockMovement {
  documentNumber: string; date: string; material: string; description: string;
  movementType: "101" | "201" | "261" | "311" | "601";
  movementDescription: string;
  quantity: number; unit: string; warehouse: string;
  referenceDocument: string; postingUser: string;
}

export interface PurchaseOrder {
  poNumber: string; material: string; description: string; vendor: string;
  plant: string; quantity: number; unit: string; netPrice: number; currency: string;
  deliveryDate: string; createdAt: string;
  status: "Open" | "In Transit" | "Partially Delivered" | "Closed";
  duplicate?: { of: string; reason: string };
}

export interface WarehouseStock {
  warehouseId: string; warehouseName: string; location: string;
  totalMaterials: number; totalValue: number; currency: string;
  utilization: number; materials: { material: string; description: string; qty: number; unit: string; value: number }[];
}

export interface DepartmentConsumption {
  department: string; material: string; description: string; unit: string;
  dailyAvg: number; weeklyTotal: number; monthlyTotal: number; plan: number;
  variance: number; cost: number; currency: string;
}

export interface ForecastPoint {
  date: string; projectedStock: number; lowerBound: number; upperBound: number;
}

export interface MaterialForecast {
  material: string; description: string; unit: string;
  currentStock: number; dailyConsumption: number; reorderPoint: number;
  safetyStock: number; leadTimeDays: number;
  projectedStockOut: string | null; projectedReorderDate: string | null;
  expectedDeliveryStock: number; expectedDeliveryDate: string | null;
  forecast30: ForecastPoint[]; forecast60: ForecastPoint[];
  recommendation: string;
}

export interface EmailAlert {
  id: string; type: "duplicate_po" | "low_stock" | "critical_stock" | "overstock" | "slow_moving" | "dead_stock" | "monthly_summary";
  material?: string; subject: string; triggeredAt: string;
  recipients: string[]; status: "sent" | "pending" | "failed";
  details: string;
}

export interface AlertConfig {
  type: string; label: string; enabled: boolean;
  threshold?: number; thresholdUnit?: string;
  recipients: string[]; frequency: string;
}

export interface OverviewKPIs {
  totalMaterials: number; criticalCount: number; lowCount: number;
  overstockCount: number; deadStockCount: number; slowMovingCount: number;
  openPOs: number; duplicatePOs: number;
  totalStockValue: number; currency: string;
  openingStockValue: number; closingStockValue: number;
  wasteAlerts: number; aiRecommendations: number;
  healthScore: number;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_MATERIALS: MaterialStock[] = [
  { material:"RM-1042", description:"Aluminium Sheet 2mm (IS 737)", plant:"1010", storageLocation:"0001", warehouse:"WH-01", category:"RM", unrestricted:15.3, qualityInspection:0, blocked:0, openingStock:62.4, received:40, issued:87.1, unit:"MT", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-10T05:15:00Z", stockValue:918000, currency:"INR", reorderPoint:50, safetyStock:20, maxStock:200, dailyConsumption:3.1, daysOfCover:4.9, leadTimeDays:7, status:"critical", slowMoving:false, deadStock:false },
  { material:"RM-2088", description:"Steel Rod Ø12mm (IS 1786)", plant:"1010", storageLocation:"0001", warehouse:"WH-01", category:"RM", unrestricted:42.7, qualityInspection:5.0, blocked:0, openingStock:48.0, received:60, issued:65.3, unit:"MT", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-09T14:20:00Z", stockValue:2562000, currency:"INR", reorderPoint:60, safetyStock:25, maxStock:250, dailyConsumption:4.2, daysOfCover:10.2, leadTimeDays:10, status:"low", slowMoving:false, deadStock:false },
  { material:"RM-3015", description:"Copper Wire 4mm (IEC 60228)", plant:"1010", storageLocation:"0002", warehouse:"WH-01", category:"RM", unrestricted:8.1, qualityInspection:0, blocked:1.2, openingStock:22.0, received:0, issued:13.9, unit:"MT", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-10T07:00:00Z", stockValue:729000, currency:"INR", reorderPoint:30, safetyStock:10, maxStock:80, dailyConsumption:2.8, daysOfCover:2.9, leadTimeDays:5, status:"critical", slowMoving:false, deadStock:false },
  { material:"PM-0441", description:"HDPE Granules (Reliance M24)", plant:"1010", storageLocation:"0003", warehouse:"WH-02", category:"PM", unrestricted:234.0, qualityInspection:0, blocked:0, openingStock:180.0, received:160, issued:106, unit:"MT", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-09T11:00:00Z", stockValue:4680000, currency:"INR", reorderPoint:80, safetyStock:30, maxStock:400, dailyConsumption:5.6, daysOfCover:41.8, leadTimeDays:14, status:"healthy", slowMoving:false, deadStock:false },
  { material:"PM-0892", description:"Cardboard Box 600×400×300", plant:"1010", storageLocation:"0003", warehouse:"WH-02", category:"PM", unrestricted:12400, qualityInspection:0, blocked:0, openingStock:10000, received:8000, issued:5600, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-10T06:00:00Z", stockValue:744000, currency:"INR", reorderPoint:5000, safetyStock:2000, maxStock:20000, dailyConsumption:320, daysOfCover:38.8, leadTimeDays:7, status:"healthy", slowMoving:false, deadStock:false },
  { material:"PM-1130", description:"Lubricant Oil ISO VG 68 (200L)", plant:"1010", storageLocation:"0001", warehouse:"WH-01", category:"PM", unrestricted:38, qualityInspection:0, blocked:0, openingStock:30, received:20, issued:12, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-08T09:00:00Z", stockValue:570000, currency:"INR", reorderPoint:20, safetyStock:8, maxStock:80, dailyConsumption:0.8, daysOfCover:47.5, leadTimeDays:5, status:"healthy", slowMoving:false, deadStock:false },
  { material:"FG-0077", description:"Motor Assembly 5HP (OEM-A)", plant:"1010", storageLocation:"0010", warehouse:"WH-03", category:"FG", unrestricted:620, qualityInspection:40, blocked:0, openingStock:520, received:180, issued:80, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-07T16:30:00Z", stockValue:15500000, currency:"INR", reorderPoint:150, safetyStock:50, maxStock:400, dailyConsumption:18, daysOfCover:34.4, leadTimeDays:21, status:"overstock", slowMoving:false, deadStock:false },
  { material:"FG-0211", description:"Control Panel (IP54, 3-phase)", plant:"1010", storageLocation:"0010", warehouse:"WH-03", category:"FG", unrestricted:487, qualityInspection:0, blocked:12, openingStock:440, received:120, issued:73, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-06T11:00:00Z", stockValue:24350000, currency:"INR", reorderPoint:100, safetyStock:40, maxStock:300, dailyConsumption:14, daysOfCover:34.8, leadTimeDays:30, status:"overstock", slowMoving:false, deadStock:false },
  { material:"RM-4401", description:"Silicon Rubber Seal (2m strip)", plant:"1010", storageLocation:"0002", warehouse:"WH-01", category:"RM", unrestricted:2800, qualityInspection:0, blocked:0, openingStock:3200, received:500, issued:900, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-10T07:30:00Z", stockValue:336000, currency:"INR", reorderPoint:800, safetyStock:400, maxStock:5000, dailyConsumption:95, daysOfCover:29.5, leadTimeDays:4, status:"healthy", slowMoving:false, deadStock:false },
  { material:"RM-5520", description:"PVC Insulation Tape (20m roll)", plant:"1010", storageLocation:"0002", warehouse:"WH-01", category:"RM", unrestricted:150, qualityInspection:0, blocked:0, openingStock:350, received:0, issued:200, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-08-09T15:00:00Z", stockValue:7500, currency:"INR", reorderPoint:200, safetyStock:80, maxStock:600, dailyConsumption:12, daysOfCover:12.5, leadTimeDays:3, status:"low", slowMoving:false, deadStock:false },
  { material:"SP-0088", description:"Bearing 6205-2RS (NSK)", plant:"1010", storageLocation:"0004", warehouse:"WH-02", category:"RM", unrestricted:840, qualityInspection:0, blocked:0, openingStock:860, received:0, issued:20, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-06-15T10:00:00Z", stockValue:252000, currency:"INR", reorderPoint:200, safetyStock:100, maxStock:1000, dailyConsumption:0.3, daysOfCover:2800, leadTimeDays:14, status:"overstock", slowMoving:true, deadStock:false },
  { material:"SP-0145", description:"V-Belt A-42 (Gates)", plant:"1010", storageLocation:"0004", warehouse:"WH-02", category:"RM", unrestricted:180, qualityInspection:0, blocked:0, openingStock:180, received:0, issued:0, unit:"EA", lastUpdated:"2026-08-10T06:30:00Z", lastMovementDate:"2026-03-01T08:00:00Z", stockValue:54000, currency:"INR", reorderPoint:50, safetyStock:20, maxStock:200, dailyConsumption:0, daysOfCover:9999, leadTimeDays:7, status:"overstock", slowMoving:true, deadStock:true },
];

export const DEMO_BATCHES: BatchStock[] = [
  { material:"RM-1042", batchNumber:"AL-2026-042", quantity:12.0, unit:"MT", receivedDate:"2026-07-01", expiryDate:null, warehouse:"WH-01", status:"Available" },
  { material:"RM-1042", batchNumber:"AL-2026-058", quantity:3.3, unit:"MT", receivedDate:"2026-07-28", expiryDate:null, warehouse:"WH-01", status:"Available" },
  { material:"RM-3015", batchNumber:"CW-2026-019", quantity:8.1, unit:"MT", receivedDate:"2026-07-15", expiryDate:null, warehouse:"WH-01", status:"Available" },
  { material:"PM-0441", batchNumber:"HD-2026-031", quantity:94.0, unit:"MT", receivedDate:"2026-07-20", expiryDate:"2027-07-20", warehouse:"WH-02", status:"Available" },
  { material:"PM-0441", batchNumber:"HD-2026-040", quantity:140.0, unit:"MT", receivedDate:"2026-08-05", expiryDate:"2027-08-05", warehouse:"WH-02", status:"Available" },
  { material:"PM-0892", batchNumber:"CB-2026-088", quantity:12400, unit:"EA", receivedDate:"2026-07-18", expiryDate:null, warehouse:"WH-02", status:"Available" },
  { material:"SP-0145", batchNumber:"VB-2025-012", quantity:180, unit:"EA", receivedDate:"2025-12-15", expiryDate:null, warehouse:"WH-02", status:"Restricted" },
  { material:"RM-2088", batchNumber:"SR-2026-022", quantity:42.7, unit:"MT", receivedDate:"2026-07-08", expiryDate:null, warehouse:"WH-01", status:"Available" },
];

export const DEMO_MOVEMENTS: StockMovement[] = [
  { documentNumber:"5000031042", date:"2026-08-10T07:30:00Z", material:"RM-4401", description:"Silicon Rubber Seal", movementType:"261", movementDescription:"GI to Production Order", quantity:-95, unit:"EA", warehouse:"WH-01", referenceDocument:"PRD-1000245", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031041", date:"2026-08-10T06:00:00Z", material:"PM-0892", description:"Cardboard Box", movementType:"261", movementDescription:"GI to Production Order", quantity:-320, unit:"EA", warehouse:"WH-02", referenceDocument:"PRD-1000244", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031040", date:"2026-08-10T05:15:00Z", material:"RM-1042", description:"Aluminium Sheet 2mm", movementType:"261", movementDescription:"GI to Production Order", quantity:-3.1, unit:"MT", warehouse:"WH-01", referenceDocument:"PRD-1000243", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031035", date:"2026-08-09T15:00:00Z", material:"RM-5520", description:"PVC Insulation Tape", movementType:"261", movementDescription:"GI to Production Order", quantity:-18, unit:"EA", warehouse:"WH-01", referenceDocument:"PRD-1000242", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031030", date:"2026-08-09T14:20:00Z", material:"RM-2088", description:"Steel Rod Ø12mm", movementType:"261", movementDescription:"GI to Production Order", quantity:-4.2, unit:"MT", warehouse:"WH-01", referenceDocument:"PRD-1000241", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031021", date:"2026-08-09T11:00:00Z", material:"PM-0441", description:"HDPE Granules", movementType:"261", movementDescription:"GI to Production Order", quantity:-5.6, unit:"MT", warehouse:"WH-02", referenceDocument:"PRD-1000240", postingUser:"PROD.CTRL" },
  { documentNumber:"4900018756R", date:"2026-08-08T14:00:00Z", material:"RM-2088", description:"Steel Rod Ø12mm", movementType:"101", movementDescription:"GR against Purchase Order", quantity:42.7, unit:"MT", warehouse:"WH-01", referenceDocument:"PO-4500018756", postingUser:"STORE.MGR" },
  { documentNumber:"5000031015", date:"2026-08-08T09:00:00Z", material:"PM-1130", description:"Lubricant Oil", movementType:"201", movementDescription:"GI to Cost Center (Maintenance)", quantity:-0.8, unit:"EA", warehouse:"WH-01", referenceDocument:"MAINT-CC-4100", postingUser:"MAINT.ENG" },
  { documentNumber:"5000031010", date:"2026-08-07T16:30:00Z", material:"FG-0077", description:"Motor Assembly 5HP", movementType:"601", movementDescription:"GI for Sales Delivery", quantity:-18, unit:"EA", warehouse:"WH-03", referenceDocument:"DEL-80012345", postingUser:"DISPATCH" },
  { documentNumber:"5000031008", date:"2026-08-07T11:00:00Z", material:"RM-1042", description:"Aluminium Sheet 2mm", movementType:"261", movementDescription:"GI to Production Order", quantity:-4.8, unit:"MT", warehouse:"WH-01", referenceDocument:"PRD-1000238", postingUser:"PROD.CTRL" },
  { documentNumber:"5000031001", date:"2026-08-06T15:30:00Z", material:"FG-0211", description:"Control Panel", movementType:"601", movementDescription:"GI for Sales Delivery", quantity:-14, unit:"EA", warehouse:"WH-03", referenceDocument:"DEL-80012340", postingUser:"DISPATCH" },
  { documentNumber:"4900018791R", date:"2026-08-05T10:00:00Z", material:"PM-0441", description:"HDPE Granules", movementType:"101", movementDescription:"GR against Purchase Order (Partial)", quantity:80, unit:"MT", warehouse:"WH-02", referenceDocument:"PO-4500018680", postingUser:"STORE.MGR" },
];

export const DEMO_POS: PurchaseOrder[] = [
  { poNumber:"4500018842", material:"RM-1042", description:"Aluminium Sheet 2mm", vendor:"M/s Hindalco Industries", plant:"1010", quantity:40, unit:"MT", netPrice:2400000, currency:"INR", deliveryDate:"2026-08-15", createdAt:"2026-08-01", status:"Open" },
  { poNumber:"4500018843", material:"RM-1042", description:"Aluminium Sheet 2mm", vendor:"M/s Nalco Trading Co.", plant:"1010", quantity:30, unit:"MT", netPrice:1860000, currency:"INR", deliveryDate:"2026-08-18", createdAt:"2026-08-03", status:"Open", duplicate:{ of:"4500018842", reason:"76 days of cover already on hand after PO-18842 delivery — combined stock would exceed 100 days" } },
  { poNumber:"4500018791", material:"RM-3015", description:"Copper Wire 4mm", vendor:"Hindusthan Copper Ltd.", plant:"1010", quantity:20, unit:"MT", netPrice:1800000, currency:"INR", deliveryDate:"2026-08-12", createdAt:"2026-07-28", status:"In Transit" },
  { poNumber:"4500018756", material:"RM-2088", description:"Steel Rod Ø12mm", vendor:"SAIL Distributors Pvt. Ltd.", plant:"1010", quantity:60, unit:"MT", netPrice:3600000, currency:"INR", deliveryDate:"2026-08-20", createdAt:"2026-07-25", status:"Open" },
  { poNumber:"4500018700", material:"PM-0441", description:"HDPE Granules", vendor:"Reliance Industries Ltd.", plant:"1010", quantity:100, unit:"MT", netPrice:2000000, currency:"INR", deliveryDate:"2026-09-01", createdAt:"2026-07-20", status:"Open", duplicate:{ of:"4500018680", reason:"Prior PO-18680 for same material already covers needs through Nov 2026; combined would be 4.2 months excess" } },
  { poNumber:"4500018680", material:"PM-0441", description:"HDPE Granules", vendor:"RIL Channel Partner — Hyderabad", plant:"1010", quantity:80, unit:"MT", netPrice:1600000, currency:"INR", deliveryDate:"2026-08-25", createdAt:"2026-07-15", status:"Partially Delivered" },
  { poNumber:"4500018620", material:"PM-1130", description:"Lubricant Oil ISO VG 68", vendor:"Castrol India Ltd.", plant:"1010", quantity:20, unit:"EA", netPrice:300000, currency:"INR", deliveryDate:"2026-08-22", createdAt:"2026-07-10", status:"Open" },
  { poNumber:"4500018501", material:"PM-0892", description:"Cardboard Box 600×400×300", vendor:"IndoPack Solutions", plant:"1010", quantity:10000, unit:"EA", netPrice:600000, currency:"INR", deliveryDate:"2026-08-28", createdAt:"2026-07-05", status:"Partially Delivered" },
];

export const DEMO_WAREHOUSES: WarehouseStock[] = [
  {
    warehouseId:"WH-01", warehouseName:"Raw Materials Store", location:"Building A, Ground Floor",
    totalMaterials:6, totalValue:4622500, currency:"INR", utilization:72,
    materials:[
      { material:"RM-1042", description:"Aluminium Sheet 2mm", qty:15.3, unit:"MT", value:918000 },
      { material:"RM-2088", description:"Steel Rod Ø12mm", qty:42.7, unit:"MT", value:2562000 },
      { material:"RM-3015", description:"Copper Wire 4mm", qty:8.1, unit:"MT", value:729000 },
      { material:"PM-1130", description:"Lubricant Oil ISO VG 68", qty:38, unit:"EA", value:570000 },
      { material:"RM-4401", description:"Silicon Rubber Seal", qty:2800, unit:"EA", value:336000 },
      { material:"RM-5520", description:"PVC Insulation Tape", qty:150, unit:"EA", value:7500 },
    ]
  },
  {
    warehouseId:"WH-02", warehouseName:"Packaging & Spares Store", location:"Building B, Ground Floor",
    totalMaterials:4, totalValue:5730000, currency:"INR", utilization:58,
    materials:[
      { material:"PM-0441", description:"HDPE Granules", qty:234, unit:"MT", value:4680000 },
      { material:"PM-0892", description:"Cardboard Box", qty:12400, unit:"EA", value:744000 },
      { material:"SP-0088", description:"Bearing 6205-2RS", qty:840, unit:"EA", value:252000 },
      { material:"SP-0145", description:"V-Belt A-42", qty:180, unit:"EA", value:54000 },
    ]
  },
  {
    warehouseId:"WH-03", warehouseName:"Finished Goods Store", location:"Building C, First Floor",
    totalMaterials:2, totalValue:39850000, currency:"INR", utilization:85,
    materials:[
      { material:"FG-0077", description:"Motor Assembly 5HP", qty:620, unit:"EA", value:15500000 },
      { material:"FG-0211", description:"Control Panel IP54", qty:487, unit:"EA", value:24350000 },
    ]
  },
];

export const DEMO_DEPT_CONSUMPTION: DepartmentConsumption[] = [
  { department:"Production Line A", material:"RM-2088", description:"Steel Rod Ø12mm", unit:"MT", dailyAvg:2.1, weeklyTotal:14.7, monthlyTotal:63, plan:60, variance:5, cost:3780000, currency:"INR" },
  { department:"Production Line A", material:"PM-0441", description:"HDPE Granules", unit:"MT", dailyAvg:3.2, weeklyTotal:22.4, monthlyTotal:96, plan:90, variance:6.7, cost:1920000, currency:"INR" },
  { department:"Production Line B", material:"RM-1042", description:"Aluminium Sheet 2mm", unit:"MT", dailyAvg:4.8, weeklyTotal:33.6, monthlyTotal:144, plan:117, variance:23.1, cost:8640000, currency:"INR" },
  { department:"Production Line B", material:"RM-2088", description:"Steel Rod Ø12mm", unit:"MT", dailyAvg:2.1, weeklyTotal:14.7, monthlyTotal:63, plan:60, variance:5, cost:3780000, currency:"INR" },
  { department:"Maintenance", material:"PM-1130", description:"Lubricant Oil", unit:"EA", dailyAvg:0.8, weeklyTotal:5.6, monthlyTotal:12, plan:12, variance:0, cost:180000, currency:"INR" },
  { department:"Quality", material:"RM-3015", description:"Copper Wire 4mm", unit:"MT", dailyAvg:0.2, weeklyTotal:1.4, monthlyTotal:5.6, plan:6, variance:-6.7, cost:504000, currency:"INR" },
  { department:"Dispatch", material:"PM-0892", description:"Cardboard Box", unit:"EA", dailyAvg:320, weeklyTotal:2240, monthlyTotal:9600, plan:9000, variance:6.7, cost:576000, currency:"INR" },
  { department:"Production Line A", material:"RM-5520", description:"PVC Insulation Tape", unit:"EA", dailyAvg:18, weeklyTotal:126, monthlyTotal:540, plan:300, variance:80, cost:27000, currency:"INR" },
];

export const DEMO_ALERTS: EmailAlert[] = [
  { id:"a1", type:"critical_stock", material:"RM-3015", subject:"🚨 CRITICAL: Copper Wire 4mm — 2.9 days of cover", triggeredAt:"2026-08-10T06:31:00Z", recipients:["store.manager@company.com","procurement@company.com"], status:"sent", details:"RM-3015 Copper Wire 4mm has only 8.1 MT remaining (2.9 days at current consumption). PO-4500018791 is in transit. Escalate delivery with vendor immediately." },
  { id:"a2", type:"critical_stock", material:"RM-1042", subject:"🚨 CRITICAL: Aluminium Sheet 2mm — 4.9 days of cover", triggeredAt:"2026-08-10T06:31:00Z", recipients:["store.manager@company.com","procurement@company.com"], status:"sent", details:"RM-1042 Aluminium Sheet 2mm has 15.3 MT remaining. Production Line B running 23% above plan consumption. Delivery from Hindalco due Aug 15." },
  { id:"a3", type:"duplicate_po", material:"RM-1042", subject:"⚠️ Duplicate PO Detected — PO 4500018843 blocks ₹18.6L", triggeredAt:"2026-08-09T14:00:00Z", recipients:["procurement@company.com","finance@company.com"], status:"sent", details:"AI analysis: PO 4500018843 (30 MT Aluminium from Nalco) would create 76+ days of cover when combined with PO 4500018842 already confirmed. Recommend blocking PO 4500018843." },
  { id:"a4", type:"duplicate_po", material:"PM-0441", subject:"⚠️ Duplicate PO Detected — PO 4500018700 blocks ₹20L", triggeredAt:"2026-08-09T14:00:00Z", recipients:["procurement@company.com","finance@company.com"], status:"sent", details:"AI analysis: PO 4500018700 (100 MT HDPE from RIL) redundant with PO 4500018680 currently being delivered. Combined stock would last through Nov 2026." },
  { id:"a5", type:"overstock", material:"FG-0077", subject:"📦 Overstock Alert — Motor Assembly 5HP: 34 days cover (target: 15)", triggeredAt:"2026-08-08T06:30:00Z", recipients:["store.manager@company.com","sales@company.com"], status:"sent", details:"FG-0077 Motor Assembly 5HP has 620 units (₹1.55Cr). Target cover is 15 days; current cover is 34.4 days." },
  { id:"a6", type:"slow_moving", material:"SP-0088", subject:"🐢 Slow-Moving Stock — Bearing 6205-2RS: No movement since Jun 15", triggeredAt:"2026-08-07T06:30:00Z", recipients:["store.manager@company.com"], status:"sent", details:"SP-0088 Bearing 6205-2RS (840 EA, ₹2.52L) has had no goods movement since June 15." },
  { id:"a7", type:"dead_stock", material:"SP-0145", subject:"💀 Dead Stock Identified — V-Belt A-42: Zero movement since Mar 2026", triggeredAt:"2026-08-07T06:30:00Z", recipients:["store.manager@company.com","finance@company.com"], status:"sent", details:"SP-0145 V-Belt A-42 (180 EA, ₹54,000) has had zero movement since March 2026. Recommend write-off review or return to vendor." },
];

export const DEMO_ALERT_CONFIGS: AlertConfig[] = [
  { type:"critical_stock", label:"Critical Stock Alert", enabled:true, threshold:5, thresholdUnit:"days of cover", recipients:["store.manager@company.com","procurement@company.com"], frequency:"Real-time (immediate)" },
  { type:"low_stock", label:"Low Stock Alert", enabled:true, threshold:15, thresholdUnit:"days of cover", recipients:["store.manager@company.com"], frequency:"Daily at 7:00 AM" },
  { type:"duplicate_po", label:"Duplicate Purchase Order", enabled:true, recipients:["procurement@company.com","finance@company.com"], frequency:"Real-time (immediate)" },
  { type:"overstock", label:"Overstock Alert", enabled:true, threshold:25, thresholdUnit:"days of cover", recipients:["store.manager@company.com","sales@company.com"], frequency:"Daily at 7:00 AM" },
  { type:"slow_moving", label:"Slow-Moving Inventory", enabled:true, threshold:60, thresholdUnit:"days no movement", recipients:["store.manager@company.com"], frequency:"Weekly on Monday" },
  { type:"dead_stock", label:"Dead Stock Alert", enabled:true, threshold:90, thresholdUnit:"days no movement", recipients:["store.manager@company.com","finance@company.com"], frequency:"Monthly on 1st" },
  { type:"monthly_summary", label:"Monthly Inventory Summary", enabled:true, recipients:["gm@company.com","store.manager@company.com","finance@company.com"], frequency:"Monthly on 1st at 8:00 AM" },
];

// ─── Pure Utility Functions ──────────────────────────────────────────────────

export function computeHealthScore(materials: MaterialStock[], pos: PurchaseOrder[]): number {
  let score = 100;
  score -= materials.filter(m => m.status === "critical").length * 10;
  score -= materials.filter(m => m.status === "low").length * 4;
  score -= materials.filter(m => m.status === "overstock").length * 3;
  score -= materials.filter(m => m.deadStock).length * 5;
  score -= materials.filter(m => m.slowMoving && !m.deadStock).length * 2;
  score -= pos.filter(p => p.duplicate).length * 6;
  return Math.max(0, Math.min(100, score));
}

export function computeKPIs(materials: MaterialStock[], pos: PurchaseOrder[]): OverviewKPIs {
  return {
    totalMaterials: materials.length,
    criticalCount: materials.filter(m => m.status === "critical").length,
    lowCount: materials.filter(m => m.status === "low").length,
    overstockCount: materials.filter(m => m.status === "overstock").length,
    deadStockCount: materials.filter(m => m.deadStock).length,
    slowMovingCount: materials.filter(m => m.slowMoving && !m.deadStock).length,
    openPOs: pos.filter(p => p.status === "Open" || p.status === "In Transit").length,
    duplicatePOs: pos.filter(p => p.duplicate).length,
    totalStockValue: materials.reduce((a, m) => a + m.stockValue, 0),
    currency: "INR",
    openingStockValue: materials.reduce((a, m) => a + (m.openingStock * (m.stockValue / (m.unrestricted || 1))), 0),
    closingStockValue: materials.reduce((a, m) => a + m.stockValue, 0),
    wasteAlerts: 2,
    aiRecommendations: 5,
    healthScore: computeHealthScore(materials, pos),
  };
}

export function generateForecast(material: MaterialStock, pendingDelivery?: { qty: number; date: string }): MaterialForecast {
  const today = new Date("2026-08-10");
  let stock = material.unrestricted;
  const points30: ForecastPoint[] = [];
  const points60: ForecastPoint[] = [];
  let stockOutDate: string | null = null;
  let reorderDate: string | null = null;

  for (let d = 1; d <= 60; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    if (pendingDelivery && dateStr === pendingDelivery.date) {
      stock += pendingDelivery.qty;
    }

    stock = Math.max(0, stock - material.dailyConsumption);
    const noise = material.dailyConsumption * 0.1;

    const point: ForecastPoint = {
      date: dateStr,
      projectedStock: Math.round(stock * 10) / 10,
      lowerBound: Math.max(0, Math.round((stock - noise * d * 0.3) * 10) / 10),
      upperBound: Math.round((stock + noise * d * 0.3) * 10) / 10,
    };

    if (d <= 30) points30.push(point);
    points60.push(point);

    if (!stockOutDate && stock <= 0) stockOutDate = dateStr;
    if (!reorderDate && stock <= material.reorderPoint && stock > 0) reorderDate = dateStr;
  }

  const rec = stockOutDate
    ? `URGENT: Stock-out predicted by ${stockOutDate}. Place emergency order immediately.`
    : reorderDate
    ? `Reorder by ${reorderDate} to maintain ${material.leadTimeDays}-day lead time.`
    : `Stock sufficient for 60+ days. Monitor per schedule.`;

  return {
    material: material.material, description: material.description, unit: material.unit,
    currentStock: material.unrestricted, dailyConsumption: material.dailyConsumption,
    reorderPoint: material.reorderPoint, safetyStock: material.safetyStock,
    leadTimeDays: material.leadTimeDays,
    projectedStockOut: stockOutDate,
    projectedReorderDate: reorderDate,
    expectedDeliveryStock: pendingDelivery?.qty ?? 0,
    expectedDeliveryDate: pendingDelivery?.date ?? null,
    forecast30: points30, forecast60: points60, recommendation: rec,
  };
}
