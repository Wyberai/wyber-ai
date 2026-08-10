"use client";

import { useEffect, useState } from "react";
import type { MaterialStock } from "@/lib/inventory-data";
import { DEMO_MATERIALS } from "@/lib/inventory-data";

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  critical: { label: "Critical",  bg: "#fff1f2", text: "#dc2626", dot: "#dc2626" },
  low:      { label: "Low Stock", bg: "#fffbeb", text: "#d97706", dot: "#f59e0b" },
  healthy:  { label: "Healthy",   bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  overstock:{ label: "Overstock", bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  dead:     { label: "Dead Stock",bg: "#f8fafc", text: "#64748b", dot: "#94a3b8" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.healthy;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, background: s.bg, color: s.text, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

function CoverBar({ days, max = 60 }: { days: number; max?: number }) {
  const pct = Math.min(100, (days / max) * 100);
  const color = days < 5 ? "#ef4444" : days < 15 ? "#f59e0b" : days > 45 ? "#8b5cf6" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 72, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{days === 9999 ? "∞" : days.toFixed(1)}d</span>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

const FILTERS = ["All", "Critical", "Low Stock", "Healthy", "Overstock", "Slow Moving", "Dead Stock"];

export default function StockPage() {
  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"stock" | "opening">("stock");
  const [sortBy, setSortBy] = useState<"material" | "cover" | "value">("cover");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch("/api/inventory/materials")
      .then(r => r.json())
      .then(d => setMaterials(d.materials ?? DEMO_MATERIALS));
  }, []);

  const filtered = materials
    .filter(m => {
      if (filter === "Critical") return m.status === "critical";
      if (filter === "Low Stock") return m.status === "low";
      if (filter === "Healthy") return m.status === "healthy";
      if (filter === "Overstock") return m.status === "overstock";
      if (filter === "Slow Moving") return m.slowMoving;
      if (filter === "Dead Stock") return m.deadStock;
      return true;
    })
    .filter(m => !search || m.material.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "cover") return a.daysOfCover - b.daysOfCover;
      if (sortBy === "value") return b.stockValue - a.stockValue;
      return a.material.localeCompare(b.material);
    });

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Inventory Monitor</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{materials.length} materials tracked · Plant 1010</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {(["stock", "opening"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0070f2" : "#e2e8f0", background: tab === t ? "#0070f2" : "#fff", color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", flex: isMobile ? "1 1 auto" : undefined }}>
            {t === "stock" ? "📦 Stock Levels" : "📊 Opening/Closing Stock"}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <>
          {/* Filters + search */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Search material..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "7px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, minWidth: 200 }} />
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: filter === f ? "#0070f2" : "#e2e8f0", background: filter === f ? "#eff6ff" : "#fff", color: filter === f ? "#0070f2" : "#64748b", fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: "pointer" }}>
                {f}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Sort:</span>
              {(["cover", "material", "value"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid", borderColor: sortBy === s ? "#0070f2" : "#e2e8f0", background: sortBy === s ? "#eff6ff" : "#fff", color: sortBy === s ? "#0070f2" : "#64748b", fontSize: 11, cursor: "pointer", textTransform: "capitalize" }}>
                  {s === "cover" ? "Days Cover" : s === "value" ? "Value" : "Material ID"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Material", "Description", "Category / WH", "Unrestricted", "Blocked / QI", "Daily Use", "Days Cover", "Reorder Point", "Stock Value", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0", display: isMobile && (h === "Blocked / QI" || h === "Reorder Point") ? "none" : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.material} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a" }}>{m.material}</td>
                    <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 180 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.description}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: 4, fontSize: 10, fontWeight: 600, color: "#475569" }}>{m.category}</span>
                        <span style={{ padding: "2px 6px", background: "#eff6ff", borderRadius: 4, fontSize: 10, color: "#0070f2" }}>{m.warehouse}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: m.status === "critical" ? "#dc2626" : "#0f172a" }}>
                      {m.unrestricted.toLocaleString("en-IN")} {m.unit}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12, display: isMobile ? "none" : undefined }}>
                      {m.blocked > 0 ? `${m.blocked} blk` : "—"}{m.qualityInspection > 0 ? ` / ${m.qualityInspection} QI` : ""}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.dailyConsumption}/{m.unit.toLowerCase()}</td>
                    <td style={{ padding: "10px 14px" }}><CoverBar days={m.daysOfCover} /></td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12, display: isMobile ? "none" : undefined }}>
                      {m.reorderPoint} {m.unit}
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Safety: {m.safetyStock}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{fmt(m.stockValue)}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No materials match this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "opening" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflowX: "auto" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Opening vs Closing Stock — August 2026</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Received = Goods Receipts (MT 101) · Issued = Goods Issues (MT 261, 201, 601)</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Material", "Description", "Opening Stock", "Received", "Issued", "Closing Stock", "Net Change", "Last Movement"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => {
                const net = m.received - m.issued;
                return (
                  <tr key={m.material} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a" }}>{m.material}</td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>{m.description.slice(0, 28)}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.openingStock.toLocaleString("en-IN")} {m.unit}</td>
                    <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: 600 }}>+{m.received.toLocaleString("en-IN")} {m.unit}</td>
                    <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: 600 }}>−{m.issued.toLocaleString("en-IN")} {m.unit}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a" }}>{m.unrestricted.toLocaleString("en-IN")} {m.unit}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: net >= 0 ? "#16a34a" : "#dc2626" }}>
                      {net >= 0 ? "+" : ""}{net.toFixed(1)} {m.unit}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#94a3b8" }}>
                      {new Date(m.lastMovementDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
