"use client";

import { useEffect, useState } from "react";
import type { MaterialStock } from "@/lib/sap-client";

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: "Critical",  bg: "#fff1f2", text: "#dc2626", dot: "#dc2626" },
  low:      { label: "Low Stock", bg: "#fffbeb", text: "#d97706", dot: "#f59e0b" },
  healthy:  { label: "Healthy",   bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  overstock:{ label: "Overstock", bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
};

function StatusBadge({ s }: { s: string }) {
  const c = STATUS[s] ?? STATUS.healthy;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 20, background: c.bg, fontSize: 11, fontWeight: 600, color: c.text }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />
      {c.label}
    </span>
  );
}

function CoverBar({ days, max = 60 }: { days: number; max?: number }) {
  const pct = Math.min((days / max) * 100, 100);
  const color = days < 5 ? "#dc2626" : days < 15 ? "#f59e0b" : days > 45 ? "#3b82f6" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{days.toFixed(1)}d</span>
    </div>
  );
}

export default function InventoryPage() {
  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [filter, setFilter] = useState<"all" | "critical" | "low" | "overstock">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/materials")
      .then(r => r.json())
      .then(d => { setMaterials(d.materials); setLoading(false); });
  }, []);

  const displayed = materials.filter(m => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.material.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number, unit: string) => `${n.toLocaleString("en-IN")} ${unit}`;
  const fmtVal = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Inventory Monitor</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Real-time stock levels per material · Plant 1010</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search material or description..."
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
            fontSize: 13, background: "#fff", outline: "none", width: 260,
          }}
        />
        {(["all", "critical", "low", "overstock"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: filter === f ? "#0070f2" : "#fff",
              color: filter === f ? "#fff" : "#475569",
              borderColor: filter === f ? "#0070f2" : "#e2e8f0",
            }}
          >
            {f === "all" ? "All" : STATUS[f]?.label ?? f}
            {" "}({f === "all" ? materials.length : materials.filter(m => m.status === f).length})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>Loading from SAP...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Material", "Description", "Plant/SLoc", "Unrestricted", "Days Cover", "Reorder Pt", "Stock Value", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((m, i) => (
                <tr key={m.material} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{m.material}</td>
                  <td style={{ padding: "13px 16px", color: "#374151", fontSize: 13, maxWidth: 200 }}>{m.description}</td>
                  <td style={{ padding: "13px 16px", color: "#64748b", fontSize: 12 }}>{m.plant} / {m.storageLocation}</td>
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{fmt(m.unrestricted, m.unit)}</td>
                  <td style={{ padding: "13px 16px", minWidth: 140 }}><CoverBar days={m.daysOfCover} /></td>
                  <td style={{ padding: "13px 16px", color: "#64748b", fontSize: 13 }}>{m.reorderPoint} {m.unit}</td>
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{fmtVal(m.stockValue)}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge s={m.status} /></td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No materials match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
