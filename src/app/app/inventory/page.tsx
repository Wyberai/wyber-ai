"use client";

import { useEffect, useState } from "react";

interface KPIs {
  totalMaterials: number; criticalCount: number; lowCount: number;
  overstockCount: number; deadStockCount: number; slowMovingCount: number;
  openPOs: number; duplicatePOs: number; totalStockValue: number;
  openingStockValue: number; closingStockValue: number;
  wasteAlerts: number; aiRecommendations: number; healthScore: number;
  currency: string; live: boolean;
}

function fmt(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Good" : score >= 50 ? "Fair" : "At Risk";
  const r = 36, cx = 44, cy = 44;
  const circum = 2 * Math.PI * r;
  const filled = (score / 100) * circum;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circum - filled}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <div>
        <div style={{ fontWeight: 700, fontSize: 20, color }}>{label}</div>
        <div style={{ color: "#64748b", fontSize: 12 }}>Inventory Health Score</div>
        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>out of 100 points</div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, color = "#0070f2", alert = false }:
  { label: string; value: string; sub?: string; color?: string; alert?: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: alert ? `1.5px solid ${color}` : "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: alert ? color : "#0f172a", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const ALERTS = [
  { mat: "RM-1042", desc: "Aluminium Sheet 2mm", msg: "4.9 days of cover remaining — Production Line B at 23% overconsumption", sev: "critical" },
  { mat: "RM-3015", desc: "Copper Wire 4mm", msg: "2.9 days of cover — PO-18791 in transit, escalate vendor delivery urgently", sev: "critical" },
  { mat: "RM-5520", desc: "PVC Insulation Tape", msg: "12.5 days of cover. Consumption 60% above plan — investigate scrap rate", sev: "high" },
  { mat: "SP-0145", desc: "V-Belt A-42", msg: "Zero movement since Mar 2026. ₹54,000 blocked as dead stock — review for write-off", sev: "info" },
];

const DUP_POS = [
  { po: "4500018843", mat: "Aluminium Sheet 2mm", vendor: "Nalco Trading", value: "₹18.6L", reason: "PO-18842 already covers needs through Sept 2026" },
  { po: "4500018700", mat: "HDPE Granules", vendor: "RIL Channel", value: "₹20.0L", reason: "PO-18680 (80 MT) being delivered covers Nov 2026" },
];

const CAT_DATA = [
  { label: "Raw Materials (WH-01)", value: 3990000, pct: 72 },
  { label: "Finished Goods (WH-03)", value: 39850000, pct: 85 },
  { label: "Packaging & Spares (WH-02)", value: 5040000, pct: 58 },
];

export default function InventoryOverview() {
  const [kpis, setKpis] = useState<Partial<KPIs>>({});

  useEffect(() => {
    fetch("/api/inventory/overview").then(r => r.json()).then(d => setKpis(d.kpis || {}));
  }, []);

  const health = kpis.healthScore ?? 62;
  const totalValue = kpis.totalStockValue ?? 48880500;
  const opening = 39200000;
  const closing = totalValue;
  const movement = closing - opening;

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Inventory Overview</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Plant 1010 — Hyderabad Manufacturing · August 2026</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ padding: "6px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            🔴 {kpis.criticalCount ?? 2} Critical
          </span>
          <span style={{ padding: "6px 14px", background: "#fef3c7", color: "#d97706", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            ⚠️ {kpis.duplicatePOs ?? 2} Duplicate POs
          </span>
        </div>
      </div>

      {/* Health + Stock Value row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <HealthGauge score={health} />
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { l: "Critical", v: kpis.criticalCount ?? 2, c: "#ef4444" },
              { l: "Low Stock", v: kpis.lowCount ?? 2, c: "#f59e0b" },
              { l: "Overstock", v: kpis.overstockCount ?? 3, c: "#8b5cf6" },
              { l: "Dead Stock", v: kpis.deadStockCount ?? 1, c: "#94a3b8" },
            ].map(x => (
              <div key={x.l} style={{ padding: "4px 10px", background: x.c + "18", borderRadius: 6, fontSize: 11, color: x.c, fontWeight: 600 }}>
                {x.l}: {x.v}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Total Stock Value (Aug 2026)</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>{fmt(closing)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Opening Stock (Aug 1)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{fmt(opening)}</div>
            </div>
            <div style={{ background: movement >= 0 ? "#dcfce7" : "#fee2e2", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Net Movement (Aug)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: movement >= 0 ? "#16a34a" : "#dc2626" }}>
                {movement >= 0 ? "+" : ""}{fmt(Math.abs(movement))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <KPICard label="Total Materials Tracked" value={String(kpis.totalMaterials ?? 12)} sub="across 3 warehouses" color="#0070f2" />
        <KPICard label="Open Purchase Orders" value={String(kpis.openPOs ?? 6)} sub="4 pending delivery" color="#8b5cf6" />
        <KPICard label="AI Recommendations" value={String(kpis.aiRecommendations ?? 5)} sub="3 require action today" color="#059669" />
        <KPICard label="Duplicate PO Exposure" value="₹38.6L" sub="2 POs can be blocked now" color="#ef4444" alert />
        <KPICard label="Slow-Moving Stock" value={String(kpis.slowMovingCount ?? 1)} sub="SP-0088 — 56 days no movement" color="#f59e0b" alert />
        <KPICard label="Dead Stock Value" value="₹54,000" sub="SP-0145 V-Belt — since Mar 2026" color="#94a3b8" />
        <KPICard label="Waste / Scrap Alerts" value={String(kpis.wasteAlerts ?? 2)} sub="RM-1042 & RM-5520 excess" color="#ef4444" />
        <KPICard label="Materials at Risk" value={String((kpis.criticalCount ?? 2) + (kpis.lowCount ?? 2))} sub="critical + low combined" color="#ef4444" alert />
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #fecaca" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>🚨 Active Alerts</div>
            <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>4 alerts</span>
          </div>
          {ALERTS.map((a, i) => (
            <div key={i} style={{ padding: "10px 12px", background: a.sev === "critical" ? "#fef2f2" : a.sev === "high" ? "#fffbeb" : "#f8fafc", borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${a.sev === "critical" ? "#ef4444" : a.sev === "high" ? "#f59e0b" : "#94a3b8"}` }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{a.mat}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{a.desc}</span>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{a.msg}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #fde8a1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>⚠️ Duplicate Purchase Orders</div>
            <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>₹38.6L at risk</span>
          </div>
          {DUP_POS.map((d, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 8, marginBottom: 8, borderLeft: "3px solid #f59e0b" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>PO {d.po}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>{d.value} exposure</span>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{d.mat} · {d.vendor}</div>
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>AI: {d.reason}</div>
            </div>
          ))}
          <div style={{ padding: "10px 14px", background: "#fefce8", borderRadius: 8, borderLeft: "3px solid #eab308", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#713f12", fontWeight: 600 }}>Total Savings Available</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>₹38.6L</span>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>Stock Value by Category & Warehouse</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {CAT_DATA.map(c => (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmt(c.value)}</span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${c.pct}%`, height: "100%", background: "linear-gradient(90deg,#0070f2,#00a4e0)", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.pct}% of capacity utilized</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
