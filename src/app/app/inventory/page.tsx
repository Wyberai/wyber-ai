"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OverviewKPIs } from "@/lib/sap-client";

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#fff1f2", text: "#dc2626", border: "#fecaca" },
  low:      { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  healthy:  { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  overstock:{ bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
};

function KPICard({ label, value, sub, color, href }: {
  label: string; value: string | number; sub?: string; color?: string; href?: string;
}) {
  const inner = (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      padding: "20px 24px",
      border: `1px solid #e2e8f0`,
      borderTop: color ? `3px solid ${color}` : `3px solid #0070f2`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      cursor: href ? "pointer" : "default",
      transition: "box-shadow 0.15s",
    }}
    onMouseEnter={e => href && ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
    onMouseLeave={e => href && ((e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}
    >
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#0f172a", fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

function Alert({ status, material, days, action }: { status: string; material: string; days: number; action: string }) {
  const s = STATUS_COLOR[status] ?? STATUS_COLOR.healthy;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: 8,
      background: s.bg, border: `1px solid ${s.border}`,
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.text, flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 600, color: s.text, fontSize: 13 }}>{material}</span>
          <span style={{ color: "#475569", fontSize: 13 }}> — {days.toFixed(1)} days of cover remaining</span>
        </div>
      </div>
      <span style={{ color: "#64748b", fontSize: 12, background: "#f8fafc", padding: "3px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>{action}</span>
    </div>
  );
}

export default function OverviewPage() {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);

  useEffect(() => {
    fetch("/api/inventory/overview")
      .then(r => r.json())
      .then(d => setKpis(d.kpis));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  if (!kpis) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading data from SAP...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Inventory Overview</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Plant 1010 · Real-time SAP data · 10 Aug 2026</p>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <KPICard label="Total Materials" value={kpis.totalMaterials} sub="Tracked in Plant 1010" href="/app/inventory/stock" />
        <KPICard label="Critical Stock" value={kpis.criticalCount} sub="< 3 days of cover" color="#dc2626" href="/app/inventory/stock" />
        <KPICard label="Low Stock" value={kpis.lowCount} sub="Below reorder point" color="#d97706" href="/app/inventory/stock" />
        <KPICard label="Overstock Items" value={kpis.overstockCount} sub="Capital tied up" color="#1d4ed8" href="/app/inventory/stock" />
        <KPICard label="Open POs" value={kpis.openPOs} sub="Active purchase orders" href="/app/inventory/purchases" />
        <KPICard label="Duplicate POs" value={kpis.duplicatePOs} sub="Flagged for review" color="#dc2626" href="/app/inventory/purchases" />
        <KPICard label="Total Stock Value" value={fmt(kpis.totalStockValue)} sub="Across all categories" />
        <KPICard label="AI Alerts" value={kpis.aiRecommendations + kpis.wasteAlerts} sub="Recommendations pending" color="#7c3aed" href="/app/inventory/recommendations" />
      </div>

      {/* Two-column lower section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Critical alerts */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>🚨 Critical Alerts</h2>
            <Link href="/app/inventory/stock" style={{ color: "#0070f2", fontSize: 12, textDecoration: "none" }}>View all →</Link>
          </div>
          <Alert status="critical" material="RM-3015 Copper Wire 4mm" days={2.9} action="PO in transit Aug 12" />
          <Alert status="critical" material="RM-1042 Aluminium Sheet 2mm" days={4.9} action="PO due Aug 15" />
          <Alert status="low" material="RM-2088 Steel Rod Ø12mm" days={10.2} action="PO open – monitor" />
          <Alert status="low" material="RM-5520 PVC Insulation Tape" days={12.5} action="Reorder recommended" />
        </div>

        {/* Duplicate PO flags */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>⚠️ Duplicate POs Detected</h2>
            <Link href="/app/inventory/purchases" style={{ color: "#0070f2", fontSize: 12, textDecoration: "none" }}>Review →</Link>
          </div>
          {[
            { po: "4500018843", material: "RM-1042 Aluminium Sheet", amount: "₹18.6L", risk: "Excess cover: 76+ days" },
            { po: "4500018700", material: "PM-0441 HDPE Granules", amount: "₹20L", risk: "Combined: 4.2 months stock" },
          ].map(d => (
            <div key={d.po} style={{ padding: "12px 14px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#92400e", fontSize: 13 }}>PO {d.po}</div>
                  <div style={{ color: "#78350f", fontSize: 12, marginTop: 2 }}>{d.material}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 14 }}>{d.amount}</div>
                  <div style={{ color: "#b45309", fontSize: 11, marginTop: 2 }}>{d.risk}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>Potential savings: ₹38.6L</span>
            <span style={{ color: "#4ade80", fontSize: 13 }}> if both cancelled</span>
          </div>
        </div>

        {/* Stock category breakdown */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>📦 Stock by Category</h2>
          {[
            { label: "Finished Goods", value: 3.99, total: 4.87, color: "#0070f2" },
            { label: "Raw Materials", value: 1.45, total: 4.87, color: "#7c3aed" },
            { label: "Packaging Materials", value: 0.54, total: 4.87, color: "#059669" },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>₹{row.value}Cr</span>
              </div>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(row.value / row.total) * 100}%`, background: row.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>⚡ Quick Actions</h2>
          {[
            { label: "Ask AI about stock levels", href: "/app/inventory/assistant", color: "#7c3aed", bg: "#faf5ff" },
            { label: "Review & block duplicate POs", href: "/app/inventory/purchases", color: "#dc2626", bg: "#fff1f2" },
            { label: "Download stock report (CSV)", href: "/app/inventory/reports", color: "#0070f2", bg: "#eff6ff" },
            { label: "View AI reorder recommendations", href: "/app/inventory/recommendations", color: "#059669", bg: "#f0fdf4" },
          ].map(action => (
            <Link key={action.href} href={action.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 8, marginBottom: 8,
              background: action.bg, border: `1px solid ${action.color}22`,
              textDecoration: "none",
            }}>
              <span style={{ color: action.color, fontWeight: 500, fontSize: 13 }}>{action.label}</span>
              <span style={{ color: action.color, fontSize: 16 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
