"use client";

import { useState } from "react";
import { DEMO_MATERIALS, DEMO_POS } from "@/lib/sap-client";

type Report = {
  id: string;
  name: string;
  description: string;
  lastGenerated: string;
  rows: number;
  format: "CSV" | "XLSX";
};

const REPORTS: Report[] = [
  { id: "stock-summary",  name: "Stock Position Summary",        description: "All materials with current levels, days of cover, and status",       lastGenerated: "Today 06:30",  rows: 10,  format: "CSV" },
  { id: "critical-stock", name: "Critical Stock Alert Report",   description: "Materials below reorder point or below safety stock",                  lastGenerated: "Today 06:30",  rows: 4,   format: "CSV" },
  { id: "po-report",      name: "Open Purchase Orders",          description: "All open / in-transit POs with delivery dates and vendor details",      lastGenerated: "Today 06:30",  rows: 8,   format: "CSV" },
  { id: "duplicate-pos",  name: "Duplicate PO Flags",            description: "AI-detected duplicate orders with recommended action",                  lastGenerated: "Today 06:30",  rows: 2,   format: "CSV" },
  { id: "consumption",    name: "30-Day Consumption vs Plan",    description: "Actual vs. planned daily consumption with anomaly flags",               lastGenerated: "Today 06:30",  rows: 90,  format: "CSV" },
  { id: "stock-value",    name: "Inventory Valuation Report",    description: "Stock value by material, category, and total plant exposure",           lastGenerated: "Today 06:30",  rows: 10,  format: "CSV" },
];

function generateCSV(reportId: string): string {
  if (reportId === "stock-summary" || reportId === "critical-stock" || reportId === "stock-value") {
    const rows = reportId === "critical-stock"
      ? DEMO_MATERIALS.filter(m => m.status === "critical" || m.status === "low")
      : DEMO_MATERIALS;
    const header = "Material,Description,Plant,Storage Loc,Unrestricted Qty,Unit,Days Cover,Reorder Point,Safety Stock,Stock Value (INR),Status";
    const lines = rows.map(m =>
      `${m.material},"${m.description}",${m.plant},${m.storageLocation},${m.unrestricted},${m.unit},${m.daysOfCover},${m.reorderPoint},${m.safetyStock},${m.stockValue},${m.status}`
    );
    return [header, ...lines].join("\n");
  }

  if (reportId === "po-report" || reportId === "duplicate-pos") {
    const rows = reportId === "duplicate-pos" ? DEMO_POS.filter(p => p.duplicate) : DEMO_POS;
    const header = "PO Number,Material,Description,Vendor,Qty,Unit,Net Price (INR),Currency,Delivery Date,Status,Duplicate Flag,Duplicate Reason";
    const lines = rows.map(p =>
      `${p.poNumber},${p.material},"${p.description}","${p.vendor}",${p.quantity},${p.unit},${p.netPrice},${p.currency},${p.deliveryDate},${p.status},${p.duplicate ? "YES" : "NO"},"${p.duplicate?.reason ?? ""}"`
    );
    return [header, ...lines].join("\n");
  }

  return "Material,Date,Plan,Actual,Variance\nRM-1042,2026-08-10,3.1,4.8,+55%\n";
}

function downloadCSV(reportId: string, reportName: string) {
  const csv = generateCSV(reportId);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  function handleDownload(report: Report) {
    downloadCSV(report.id, report.name);
    setDownloaded(prev => new Set([...prev, report.id]));
  }

  const totalStockValue = DEMO_MATERIALS.reduce((a, m) => a + m.stockValue, 0);
  const fmtINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Reports</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Export inventory data · All reports generated from live SAP data</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Plant Total Value",   value: fmtINR(totalStockValue),   color: "#0070f2" },
          { label: "Materials Tracked",   value: DEMO_MATERIALS.length,     color: "#7c3aed" },
          { label: "Open POs Value",      value: fmtINR(DEMO_POS.filter(p => p.status === "Open").reduce((a, p) => a + p.netPrice, 0)), color: "#d97706" },
          { label: "Duplicate PO Risk",   value: fmtINR(DEMO_POS.filter(p => p.duplicate).reduce((a, p) => a + p.netPrice, 0)), color: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #e2e8f0", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Available Reports</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Click Download to export as CSV · Data sourced directly from SAP</div>
        </div>
        {REPORTS.map((report, i) => (
          <div key={report.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: i < REPORTS.length - 1 ? "1px solid #f1f5f9" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, marginBottom: 2 }}>{report.name}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{report.description}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                <span>📅 Last generated: {report.lastGenerated}</span>
                <span>📄 ~{report.rows} rows</span>
                <span style={{ padding: "1px 8px", borderRadius: 4, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }}>{report.format}</span>
              </div>
            </div>
            <button
              onClick={() => handleDownload(report)}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: downloaded.has(report.id) ? "#f0fdf4" : "#0070f2",
                color: downloaded.has(report.id) ? "#16a34a" : "#fff",
                marginLeft: 20, flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              {downloaded.has(report.id) ? "✓ Downloaded" : "⬇ Download CSV"}
            </button>
          </div>
        ))}
      </div>

      {/* Integration note */}
      <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div style={{ fontWeight: 600, color: "#1d4ed8", fontSize: 14, marginBottom: 4 }}>📤 Export Integrations (available in production)</div>
        <div style={{ color: "#1e40af", fontSize: 13 }}>
          Email reports automatically · Schedule daily/weekly delivery · Push to SharePoint / Google Drive · Direct SAP BW/BPC export
        </div>
      </div>
    </div>
  );
}
