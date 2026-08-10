"use client";

import { useState, useEffect } from "react";
import { DEMO_MATERIALS, DEMO_POS } from "@/lib/inventory-data";

type Priority = "Urgent" | "High" | "Medium" | "Low";
type ActionState = "pending" | "accepted" | "dismissed";

interface Recommendation {
  id: string; priority: Priority; category: string;
  material: string; description: string; action: string;
  impact: string; savingsINR?: number; riskReduced?: string;
  state: ActionState;
}

const PRI_STYLE: Record<Priority, { bg: string; text: string; border: string }> = {
  Urgent: { bg: "#fee2e2", text: "#dc2626", border: "#fecaca" },
  High:   { bg: "#fef3c7", text: "#d97706", border: "#fde68a" },
  Medium: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Low:    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

function buildRecommendations(): Recommendation[] {
  const recs: Recommendation[] = [];
  const criticals = DEMO_MATERIALS.filter(m => m.status === "critical");
  criticals.forEach(m => {
    recs.push({
      id: `crit-${m.material}`, priority: "Urgent", category: "Critical Stock",
      material: m.material, description: m.description,
      action: `Place emergency PO for ${m.material} — current ${m.unrestricted} ${m.unit} = ${m.daysOfCover.toFixed(1)} days cover. Order minimum ${m.reorderPoint - m.unrestricted + m.safetyStock} ${m.unit} from approved vendor. Flag for expedited delivery within ${m.leadTimeDays} days.`,
      impact: `Production stoppage risk in ${m.daysOfCover.toFixed(1)} days without intervention`,
      riskReduced: `Prevents production line shutdown`,
      state: "pending",
    });
  });
  DEMO_POS.filter(p => p.duplicate).forEach(p => {
    recs.push({
      id: `dup-${p.poNumber}`, priority: "High", category: "Duplicate PO",
      material: p.material, description: p.description,
      action: `Block PO ${p.poNumber} (${p.quantity} ${p.unit} from ${p.vendor}, ₹${(p.netPrice / 100000).toFixed(1)}L). Prior PO ${p.duplicate!.of} already covers requirements. ${p.duplicate!.reason}.`,
      impact: `Saves ₹${(p.netPrice / 100000).toFixed(1)}L in unnecessary procurement`,
      savingsINR: p.netPrice, state: "pending",
    });
  });
  const dead = DEMO_MATERIALS.filter(m => m.deadStock);
  dead.forEach(m => {
    recs.push({
      id: `dead-${m.material}`, priority: "Medium", category: "Dead Stock",
      material: m.material, description: m.description,
      action: `Initiate write-off review for ${m.material} — zero movement since Mar 2026. 180 EA (₹${(m.stockValue / 1000).toFixed(0)}K). Options: (1) Return to vendor if under warranty, (2) Internal transfer to another plant, (3) Write-off and dispose.`,
      impact: `Recovers ₹${(m.stockValue / 1000).toFixed(0)}K from dead inventory`,
      savingsINR: m.stockValue, state: "pending",
    });
  });
  const slow = DEMO_MATERIALS.filter(m => m.slowMoving && !m.deadStock);
  slow.forEach(m => {
    recs.push({
      id: `slow-${m.material}`, priority: "Medium", category: "Slow-Moving Stock",
      material: m.material, description: m.description,
      action: `${m.material} has not moved in 56+ days. At current consumption rate, stock will last 2,800 days (7+ years). Review: (1) Is this still needed on BOM? (2) Can excess be returned to vendor? (3) Stop future procurement.`,
      impact: "Frees warehouse space and reduces holding cost",
      state: "pending",
    });
  });
  const overstock = DEMO_MATERIALS.filter(m => m.status === "overstock" && m.category === "FG");
  overstock.forEach(m => {
    recs.push({
      id: `os-${m.material}`, priority: "Low", category: "Overstock — Finished Goods",
      material: m.material, description: m.description,
      action: `${m.material} at ${m.daysOfCover.toFixed(0)} days cover vs target 15 days. Coordinate with Sales to push ${Math.round((m.unrestricted - 15 * m.dailyConsumption))} units through upcoming campaigns or dealer promotions to normalize inventory.`,
      impact: `Reduces holding cost by ₹${((m.unrestricted - 15 * m.dailyConsumption) * (m.stockValue / m.unrestricted) / 100000).toFixed(1)}L if dispatched`,
      state: "pending",
    });
  });
  recs.push({
    id: "wh-bal-1", priority: "Medium", category: "Warehouse Balancing",
    material: "FG-0077 / FG-0211", description: "WH-03 at 85% Utilization",
    action: "WH-03 (Finished Goods) is at 85% utilization due to overstock. Coordinate with Sales to expedite dispatch of FG-0077 Motor Assembly (620 units, 34 days cover) and FG-0211 Control Panel (487 units, 34 days cover). Target: reduce WH-03 to 65% within 2 weeks to avoid receiving bottleneck.",
    impact: "Frees 20% floor space in WH-03 and reduces holding cost by ₹2.4L/month",
    state: "pending",
  });
  recs.push({
    id: "wh-bal-2", priority: "Low", category: "Warehouse Balancing",
    material: "SP-0088 / SP-0145", description: "Consolidate Spares to WH-01",
    action: "SP-0088 (Bearing 6205-2RS, 840 EA) and SP-0145 (V-Belt A-42, 180 EA) are occupying dedicated floor space in WH-02 (Packaging & Spares). Consolidate both to WH-01 spare parts zone to free WH-02 for active packaging materials. Save 8% WH-02 floor space.",
    impact: "Optimizes WH-02 for faster packaging throughput; improves picker efficiency",
    state: "pending",
  });
  return recs;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>(buildRecommendations);
  const [filter, setFilter] = useState<Priority | "All">("All");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const update = (id: string, state: ActionState) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, state } : r));
  };

  const filtered = recs.filter(r => filter === "All" || r.priority === filter);
  const pending = recs.filter(r => r.state === "pending");
  const accepted = recs.filter(r => r.state === "accepted");
  const totalSavings = recs.filter(r => r.state === "pending" && r.savingsINR).reduce((a, r) => a + (r.savingsINR ?? 0), 0);

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>AI Recommendations</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Generated from live stock, PO, and consumption data · Powered by Ollama (on-premise AI)</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "10px 18px", border: "1.5px solid #e2e8f0", width: isMobile ? "100%" : undefined }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Potential Savings (pending actions)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>₹{(totalSavings / 100000).toFixed(1)}L</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Pending Action", v: pending.length, c: "#0070f2" },
          { l: "Accepted", v: accepted.length, c: "#22c55e" },
          { l: "Urgent", v: recs.filter(r => r.priority === "Urgent").length, c: "#ef4444" },
          { l: "High Priority", v: recs.filter(r => r.priority === "High").length, c: "#d97706" },
        ].map(x => (
          <div key={x.l} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{x.l}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["All", "Urgent", "High", "Medium", "Low"] as const).map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: filter === p ? "#0070f2" : "#e2e8f0", background: filter === p ? "#0070f2" : "#fff", color: filter === p ? "#fff" : "#64748b", fontSize: 12, fontWeight: filter === p ? 700 : 400, cursor: "pointer" }}>
            {p}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center" }}>
          {filtered.length} recommendations
        </span>
      </div>

      {/* Recommendation cards */}
      {filtered.map(rec => {
        const pri = PRI_STYLE[rec.priority];
        const done = rec.state !== "pending";
        return (
          <div key={rec.id} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: `1.5px solid ${done ? "#e2e8f0" : pri.border}`, marginBottom: 12, opacity: done ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ padding: "3px 10px", borderRadius: 6, background: pri.bg, color: pri.text, fontWeight: 700, fontSize: 12 }}>{rec.priority}</span>
                <span style={{ padding: "3px 10px", borderRadius: 6, background: "#f8fafc", color: "#475569", fontWeight: 500, fontSize: 12 }}>{rec.category}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0070f2" }}>{rec.material}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{rec.description.slice(0, 30)}</span>
              </div>
              {rec.savingsINR && (
                <span style={{ fontWeight: 800, color: "#dc2626", fontSize: 15 }}>₹{(rec.savingsINR / 100000).toFixed(1)}L savings</span>
              )}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              <strong>Recommended Action:</strong> {rec.action}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>Impact: </span>{rec.impact}
              </div>
              {!done ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => update(rec.id, "dismissed")} style={{ padding: "6px 16px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                    Dismiss
                  </button>
                  <button onClick={() => update(rec.id, "accepted")} style={{ padding: "6px 16px", border: "none", borderRadius: 8, background: "#0070f2", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    ✓ Accept & Act
                  </button>
                </div>
              ) : (
                <span style={{ padding: "4px 12px", borderRadius: 6, background: rec.state === "accepted" ? "#dcfce7" : "#f1f5f9", color: rec.state === "accepted" ? "#16a34a" : "#64748b", fontSize: 12, fontWeight: 600 }}>
                  {rec.state === "accepted" ? "✓ Accepted" : "Dismissed"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
