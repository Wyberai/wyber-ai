"use client";

import { useState } from "react";
import { DEMO_MATERIALS, DEMO_POS, DEMO_MOVEMENTS, DEMO_DEPT_CONSUMPTION, DEMO_WAREHOUSES } from "@/lib/inventory-data";

function fmt(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const BOM = "﻿";
  const lines = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))];
  const blob = new Blob([BOM + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(title: string, content: string) {
  const html = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;font-size:12px}h1{font-size:18px;margin-bottom:4px}p{color:#666;margin:0 0 16px}table{border-collapse:collapse;width:100%}th{background:#f1f5f9;padding:8px;text-align:left;border:1px solid #e2e8f0;font-size:11px}td{padding:8px;border:1px solid #e2e8f0}.watermark{position:fixed;bottom:16px;right:16px;opacity:0.3;font-size:11px}</style></head><body><h1>IntelliStock — ${title}</h1><p>Plant 1010 · Hyderabad Manufacturing · Generated: 10 Aug 2026 · Prepared by WyberAI</p>${content}<div class='watermark'>CONFIDENTIAL — Do Not Distribute</div></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
}

const REPORTS = [
  {
    id: "stock-summary",
    name: "Stock Summary Report",
    description: "Complete stock levels for all materials — unrestricted, blocked, QI stock, value, and cover days",
    icon: "📦",
    category: "Inventory",
    lastGenerated: "10 Aug 2026, 06:30",
    generate: () => {
      const headers = ["Material", "Description", "Category", "Warehouse", "Unrestricted", "Blocked", "QI Stock", "Unit", "Daily Consumption", "Days Cover", "Reorder Point", "Safety Stock", "Stock Value INR", "Status"];
      const rows = DEMO_MATERIALS.map(m => [m.material, m.description, m.category, m.warehouse, String(m.unrestricted), String(m.blocked), String(m.qualityInspection), m.unit, String(m.dailyConsumption), m.daysOfCover.toFixed(1), String(m.reorderPoint), String(m.safetyStock), String(m.stockValue), m.status]);
      return { headers, rows, filename: "stock-summary-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_MATERIALS.map(m => `<tr><td>${m.material}</td><td>${m.description}</td><td>${m.unrestricted} ${m.unit}</td><td>${m.daysOfCover.toFixed(1)}d</td><td>${fmt(m.stockValue)}</td><td style="color:${m.status==='critical'?'#dc2626':m.status==='low'?'#d97706':'#16a34a'}">${m.status}</td></tr>`).join("");
      return { title: "Stock Summary Report", content: `<table><thead><tr><th>Material</th><th>Description</th><th>Stock</th><th>Days Cover</th><th>Value</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "opening-closing",
    name: "Opening/Closing Stock Register",
    description: "Month-wise opening stock, receipts, issues, and closing balance for all materials",
    icon: "📊",
    category: "Inventory",
    lastGenerated: "10 Aug 2026, 06:30",
    generate: () => {
      const headers = ["Material", "Description", "Unit", "Opening Stock", "Goods Receipts", "Goods Issues", "Closing Stock", "Net Movement", "Opening Value INR", "Closing Value INR"];
      const rows = DEMO_MATERIALS.map(m => {
        const oV = m.openingStock * (m.stockValue / m.unrestricted || 0);
        return [m.material, m.description, m.unit, String(m.openingStock), String(m.received), String(m.issued), String(m.unrestricted), String(m.received - m.issued), Math.round(oV).toFixed(0), String(m.stockValue)];
      });
      return { headers, rows, filename: "opening-closing-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_MATERIALS.map(m => `<tr><td>${m.material}</td><td>${m.description}</td><td>${m.openingStock} ${m.unit}</td><td style="color:#16a34a">+${m.received}</td><td style="color:#dc2626">-${m.issued}</td><td><strong>${m.unrestricted}</strong></td></tr>`).join("");
      return { title: "Opening/Closing Stock Register", content: `<table><thead><tr><th>Material</th><th>Description</th><th>Opening</th><th>Receipts</th><th>Issues</th><th>Closing</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "po-analysis",
    name: "Purchase Order Analysis",
    description: "All POs with duplicate detection, savings opportunities, and delivery status",
    icon: "📋",
    category: "Procurement",
    lastGenerated: "10 Aug 2026, 08:15",
    generate: () => {
      const headers = ["PO Number", "Material", "Description", "Vendor", "Quantity", "Unit", "Net Price INR", "Delivery Date", "Status", "Duplicate Flag", "Duplicate Of", "Savings Opportunity"];
      const rows = DEMO_POS.map(p => [p.poNumber, p.material, p.description, p.vendor, String(p.quantity), p.unit, String(p.netPrice), p.deliveryDate, p.status, p.duplicate ? "YES" : "NO", p.duplicate?.of ?? "", p.duplicate ? String(p.netPrice) : "0"]);
      return { headers, rows, filename: "po-analysis-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_POS.map(p => `<tr><td>${p.poNumber}</td><td>${p.material}</td><td>${p.vendor}</td><td>${fmt(p.netPrice)}</td><td>${p.deliveryDate}</td><td style="color:${p.duplicate?'#dc2626':'#16a34a'}">${p.duplicate?'DUPLICATE':'OK'}</td></tr>`).join("");
      return { title: "Purchase Order Analysis", content: `<table><thead><tr><th>PO Number</th><th>Material</th><th>Vendor</th><th>Value</th><th>Delivery</th><th>Flag</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "consumption",
    name: "Consumption Analysis Report",
    description: "Material-wise consumption trends, plan vs actual, department breakdown, anomaly detection",
    icon: "📈",
    category: "Consumption",
    lastGenerated: "10 Aug 2026, 06:30",
    generate: () => {
      const headers = ["Department", "Material", "Description", "Unit", "Daily Avg", "Weekly Total", "Monthly Total", "Plan", "Variance %", "Cost INR"];
      const rows = DEMO_DEPT_CONSUMPTION.map(d => [d.department, d.material, d.description, d.unit, String(d.dailyAvg), String(d.weeklyTotal), String(d.monthlyTotal), String(d.plan), d.variance.toFixed(1), String(d.cost)]);
      return { headers, rows, filename: "consumption-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_DEPT_CONSUMPTION.map(d => `<tr><td>${d.department}</td><td>${d.material}</td><td>${d.monthlyTotal} ${d.unit}</td><td>${d.plan} ${d.unit}</td><td style="color:${d.variance>5?'#dc2626':d.variance<-5?'#d97706':'#16a34a'}">${d.variance>=0?'+':''}${d.variance.toFixed(1)}%</td></tr>`).join("");
      return { title: "Consumption Analysis Report", content: `<table><thead><tr><th>Department</th><th>Material</th><th>Actual</th><th>Plan</th><th>Variance</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "movement-history",
    name: "Goods Movement History",
    description: "All GR, GI, and STO movements with document numbers, dates, and references",
    icon: "🔄",
    category: "Movements",
    lastGenerated: "10 Aug 2026, 09:00",
    generate: () => {
      const headers = ["Document No", "Date", "Material", "Description", "Movement Type", "Description", "Quantity", "Unit", "Warehouse", "Reference Doc", "Posted By"];
      const rows = DEMO_MOVEMENTS.map(m => [m.documentNumber, new Date(m.date).toLocaleDateString("en-IN"), m.material, m.description, m.movementType, m.movementDescription, String(m.quantity), m.unit, m.warehouse, m.referenceDocument, m.postingUser]);
      return { headers, rows, filename: "movements-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_MOVEMENTS.map(m => `<tr><td>${m.documentNumber}</td><td>${m.material}</td><td style="color:${m.movementType==='101'?'#16a34a':'#dc2626'}">${m.quantity>0?'+':''}${m.quantity} ${m.unit}</td><td>${m.movementDescription}</td><td style="font-size:10px">${m.referenceDocument}</td></tr>`).join("");
      return { title: "Goods Movement History", content: `<table><thead><tr><th>Document</th><th>Material</th><th>Qty</th><th>Movement</th><th>Reference</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "inventory-aging",
    name: "Inventory Aging Report",
    description: "How long materials have been sitting — identifies slow-moving and dead stock by age bracket",
    icon: "⏱️",
    category: "Inventory",
    lastGenerated: "10 Aug 2026, 06:30",
    generate: () => {
      const headers = ["Material", "Description", "Last Movement Date", "Days Since Movement", "Current Stock", "Unit", "Stock Value INR", "Age Bracket", "Recommendation"];
      const rows = DEMO_MATERIALS.map(m => {
        const days = Math.floor((new Date("2026-08-10").getTime() - new Date(m.lastMovementDate).getTime()) / 86400000);
        const bracket = days <= 7 ? "0-7 days (Active)" : days <= 30 ? "8-30 days (Recent)" : days <= 60 ? "31-60 days (Monitor)" : days <= 90 ? "61-90 days (Slow)" : "90+ days (Dead)";
        const rec = days > 90 ? "Write-off review" : days > 60 ? "Investigate usage" : days > 30 ? "Monitor" : "Active";
        return [m.material, m.description, new Date(m.lastMovementDate).toLocaleDateString("en-IN"), String(days), String(m.unrestricted), m.unit, String(m.stockValue), bracket, rec];
      });
      return { headers, rows, filename: "inventory-aging-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_MATERIALS.map(m => {
        const days = Math.floor((new Date("2026-08-10").getTime() - new Date(m.lastMovementDate).getTime()) / 86400000);
        const bracket = days <= 7 ? "0-7d Active" : days <= 30 ? "8-30d Recent" : days <= 60 ? "31-60d Monitor" : "60+ Slow/Dead";
        const color = days <= 7 ? "#16a34a" : days <= 30 ? "#0070f2" : days <= 60 ? "#d97706" : "#dc2626";
        return `<tr><td>${m.material}</td><td>${m.description}</td><td>${days}d</td><td style="color:${color}">${bracket}</td><td>${fmt(m.stockValue)}</td></tr>`;
      }).join("");
      return { title: "Inventory Aging Report", content: `<table><thead><tr><th>Material</th><th>Description</th><th>Days Since Movement</th><th>Age Bracket</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "warehouse",
    name: "Warehouse Analysis Report",
    description: "Stock by warehouse, utilization rates, and material distribution across storage locations",
    icon: "🏭",
    category: "Warehouse",
    lastGenerated: "10 Aug 2026, 06:30",
    generate: () => {
      const headers = ["Warehouse ID", "Warehouse Name", "Material", "Description", "Quantity", "Unit", "Stock Value INR", "% of Warehouse Value"];
      const rows: string[][] = [];
      DEMO_WAREHOUSES.forEach(wh => {
        wh.materials.forEach(m => {
          rows.push([wh.warehouseId, wh.warehouseName, m.material, m.description, String(m.qty), m.unit, String(m.value), (m.value / wh.totalValue * 100).toFixed(1)]);
        });
      });
      return { headers, rows, filename: "warehouse-analysis-aug2026.csv" };
    },
    generatePDF: () => {
      const rows = DEMO_WAREHOUSES.flatMap(wh =>
        wh.materials.map(m => `<tr><td>${wh.warehouseId} — ${wh.warehouseName}</td><td>${m.material}</td><td>${m.qty} ${m.unit}</td><td>${fmt(m.value)}</td></tr>`)
      ).join("");
      return { title: "Warehouse Analysis Report", content: `<table><thead><tr><th>Warehouse</th><th>Material</th><th>Quantity</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>` };
    },
  },
  {
    id: "monthly-summary",
    name: "Monthly Management Summary",
    description: "Executive summary — KPIs, savings, risks, AI insights, and action items for management review",
    icon: "📋",
    category: "Management",
    lastGenerated: "08 Aug 2026",
    generate: () => {
      const totalValue = DEMO_MATERIALS.reduce((a, m) => a + m.stockValue, 0);
      const critical = DEMO_MATERIALS.filter(m => m.status === "critical");
      const dupSavings = DEMO_POS.filter(p => p.duplicate).reduce((a, p) => a + p.netPrice, 0);
      const headers = ["Metric", "Value", "Status", "Action"];
      const rows = [
        ["Total Inventory Value", fmt(totalValue), "Active", "Monitor"],
        ["Critical Stock Items", String(critical.length), "URGENT", "Immediate PO required"],
        ["Duplicate PO Savings", fmt(dupSavings), "Action Required", "Block identified POs"],
        ["Dead Stock Value", "₹54,000", "Review Required", "Initiate write-off"],
        ["Inventory Health Score", "62/100", "Fair", "Address critical items"],
      ];
      return { headers, rows, filename: "monthly-summary-aug2026.csv" };
    },
    generatePDF: () => {
      const totalValue = DEMO_MATERIALS.reduce((a, m) => a + m.stockValue, 0);
      const content = `<h2>Executive Summary — August 2026</h2><table><tr><th>KPI</th><th>Value</th><th>Status</th></tr><tr><td>Total Stock Value</td><td>${fmt(totalValue)}</td><td>Active</td></tr><tr><td>Critical Stock Items</td><td>2 materials</td><td style="color:#dc2626">URGENT</td></tr><tr><td>Duplicate PO Savings</td><td>₹38.6L</td><td style="color:#d97706">Action Required</td></tr><tr><td>Inventory Health Score</td><td>62/100</td><td style="color:#d97706">Fair</td></tr><tr><td>AI Recommendations</td><td>8 active</td><td>Review required</td></tr></table><h3>Key Alerts</h3><p>• RM-1042 Aluminium: 4.9 days cover — order placed, delivery Aug 15<br>• RM-3015 Copper Wire: 2.9 days cover — expedite PO-18791<br>• 2 duplicate POs blocked saving ₹38.6L<br>• SP-0145 V-Belt: dead stock since Mar 2026, write-off pending</p>`;
      return { title: "Monthly Management Summary", content };
    },
  },
];

const CATS = ["All", "Inventory", "Procurement", "Consumption", "Movements", "Warehouse", "Management"];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("All");

  const filtered = REPORTS.filter(r => catFilter === "All" || r.category === catFilter);

  const handleExport = async (report: typeof REPORTS[0], format: "csv" | "pdf") => {
    setGenerating(`${report.id}-${format}`);
    await new Promise(r => setTimeout(r, 500));
    try {
      if (format === "csv") {
        const { headers, rows, filename } = report.generate();
        downloadCSV(filename, rows, headers);
      } else {
        const { title, content } = report.generatePDF();
        downloadPDF(title, content);
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Reports</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{REPORTS.length} reports available · CSV and PDF export · Auto-generated from live SAP data</p>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: catFilter === c ? "#0070f2" : "#e2e8f0", background: catFilter === c ? "#0070f2" : "#fff", color: catFilter === c ? "#fff" : "#64748b", fontSize: 12, fontWeight: catFilter === c ? 700 : 400, cursor: "pointer" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {filtered.map(report => {
          const csvKey = `${report.id}-csv`;
          const pdfKey = `${report.id}-pdf`;
          return (
            <div key={report.id} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{report.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{report.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{report.description}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span style={{ padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 10, color: "#475569" }}>{report.category}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Last: {report.lastGenerated}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => handleExport(report, "csv")} disabled={!!generating} style={{ flex: 1, padding: "8px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: generating === csvKey ? "#f8fafc" : "#fff", color: "#0070f2", fontSize: 12, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {generating === csvKey ? "⏳ Generating..." : "⬇ Export CSV"}
                </button>
                <button onClick={() => handleExport(report, "pdf")} disabled={!!generating} style={{ flex: 1, padding: "8px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: generating === pdfKey ? "#f8fafc" : "#fff", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {generating === pdfKey ? "⏳ Generating..." : "📄 Export PDF"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: "14px 20px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", fontSize: 13, color: "#1d4ed8" }}>
        💡 <strong>Tip:</strong> CSV exports open directly in Microsoft Excel. PDF exports generate a print-ready report with the WyberAI watermark. In live mode (SAP connected), all reports reflect real-time data from SAP S/4HANA.
      </div>
    </div>
  );
}
