"use client";

import { useState, useEffect } from "react";
import { DEMO_DEPT_CONSUMPTION } from "@/lib/inventory-data";

const CONSUMPTION_DATA = [
  {
    material: "RM-1042", description: "Aluminium Sheet 2mm", unit: "MT",
    plan:   [3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.1,3.1,3.1,3.1,3.1,3.1,3.1,3.5,3.8,3.9,3.9,3.9,4.0,4.1,4.0,3.9,3.8],
    actual: [3.0,3.1,3.0,2.9,3.1,3.0,3.0,3.2,3.1,3.0,3.1,3.0,2.8,3.1,3.2,3.1,3.0,3.1,3.0,3.2,4.1,4.5,4.8,4.7,4.6,4.8,4.9,4.8,4.7,4.8],
    anomaly: "23% excess from Aug 3 — new cutting program higher scrap rate (Line B)",
    anomalyDays: [20,21,22,23,24,25,26,27,28,29],
  },
  {
    material: "RM-2088", description: "Steel Rod Ø12mm", unit: "MT",
    plan:   [4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0],
    actual: [4.1,4.0,4.0,3.9,4.0,4.0,4.1,4.0,4.0,3.9,4.0,4.1,4.0,4.0,4.0,4.1,4.0,4.0,4.0,4.1,4.2,4.1,4.3,4.2,4.2,4.3,4.2,4.1,4.2,4.2],
    anomaly: null, anomalyDays: [],
  },
  {
    material: "RM-3015", description: "Copper Wire 4mm", unit: "MT",
    plan:   [2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8],
    actual: [2.5,2.4,2.6,2.5,2.5,2.6,2.4,2.5,2.5,2.5,2.6,2.5,2.5,2.5,2.6,2.5,2.5,2.5,2.6,2.5,2.8,2.8,2.9,2.8,2.8,2.9,2.9,2.8,2.8,2.8],
    anomaly: null, anomalyDays: [],
  },
  {
    material: "PM-0441", description: "HDPE Granules", unit: "MT",
    plan:   [5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.0,5.5,5.5,5.5,5.5,5.5,5.5,5.5,5.5,5.5,5.5],
    actual: [4.9,5.0,5.1,5.0,5.0,4.9,5.0,5.1,5.0,5.0,5.1,5.0,5.0,4.9,5.0,5.0,5.1,5.0,5.0,5.1,5.5,5.6,5.6,5.5,5.5,5.6,5.5,5.5,5.6,5.6],
    anomaly: null, anomalyDays: [],
  },
  {
    material: "RM-5520", description: "PVC Insulation Tape", unit: "EA",
    plan:   [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,12,12,12,12,12,12,12,12,12,12],
    actual: [8,9,8,9,9,8,8,9,9,9,10,10,11,12,14,15,16,17,18,18,20,22,22,21,20,21,22,21,20,20],
    anomaly: "Tape consumption tracking at 60% above plan — suspected bulk breakage/waste on assembly floor",
    anomalyDays: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29],
  },
];

const DEMO_WASTAGE = [
  { material:"RM-1042", description:"Aluminium Sheet 2mm", unit:"MT", line:"Line B", planned:117, actual:144, wasteQty:27, wastePercent:23.1, target:2.0, wasteCost:1620000, cause:"New CNC cutting program — higher edge trimming loss" },
  { material:"RM-5520", description:"PVC Insulation Tape", unit:"EA", line:"Line A", planned:300, actual:540, wasteQty:240, wastePercent:80.0, target:5.0, wasteCost:12000, cause:"Bulk breakage/improper storage on assembly floor" },
  { material:"RM-2088", description:"Steel Rod Ø12mm", unit:"MT", line:"Line A", planned:60, actual:63, wasteQty:3, wastePercent:5.0, target:2.0, wasteCost:180000, cause:"Cut-off tolerance overrun — above target but manageable" },
  { material:"PM-0441", description:"HDPE Granules", unit:"MT", line:"Line A", planned:90, actual:96, wasteQty:6, wastePercent:6.7, target:3.0, wasteCost:120000, cause:"Runner/sprue waste from injection moulding startup" },
  { material:"RM-3015", description:"Copper Wire 4mm", unit:"MT", line:"Quality", planned:6, actual:5.6, wasteQty:-0.4, wastePercent:-6.7, target:1.0, wasteCost:0, cause:"Process improvement in wire termination — UNDER target" },
];

function SparkLine({ plan, actual, anomalyDays, height = 80, width = 340 }: {
  plan: number[]; actual: number[]; anomalyDays: number[]; height?: number; width?: number;
}) {
  const all = [...plan, ...actual];
  const maxV = Math.max(...all) * 1.1;
  const minV = Math.min(...all) * 0.9;
  const range = maxV - minV || 1;
  const n = plan.length;
  const PAD = { t: 8, r: 8, b: 16, l: 8 };
  const cW = width - PAD.l - PAD.r;
  const cH = height - PAD.t - PAD.b;
  const X = (i: number) => PAD.l + (i / (n - 1)) * cW;
  const Y = (v: number) => PAD.t + cH - ((v - minV) / range) * cH;
  const planPath = plan.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const actualPath = actual.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height}>
      <path d={planPath} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4,2" />
      <path d={actualPath} fill="none" stroke="#0070f2" strokeWidth={2} />
      {anomalyDays.map(d => (
        <circle key={d} cx={X(d)} cy={Y(actual[d] ?? 0)} r={3} fill="#ef4444" />
      ))}
    </svg>
  );
}

export default function ConsumptionPage() {
  const [selected, setSelected] = useState("RM-1042");
  const [tab, setTab] = useState<"daily" | "dept" | "production" | "wastage">("daily");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sel = CONSUMPTION_DATA.find(m => m.material === selected) ?? CONSUMPTION_DATA[0];
  const totalPlan = sel.plan.reduce((a, v) => a + v, 0);
  const totalActual = sel.actual.reduce((a, v) => a + v, 0);
  const variance = ((totalActual - totalPlan) / totalPlan * 100);

  const depts = DEMO_DEPT_CONSUMPTION.filter(d => d.material === selected);

  const PROD_DATA = [
    { line: "Production Line A", materials: DEMO_DEPT_CONSUMPTION.filter(d => d.department === "Production Line A") },
    { line: "Production Line B", materials: DEMO_DEPT_CONSUMPTION.filter(d => d.department === "Production Line B") },
    { line: "Maintenance",       materials: DEMO_DEPT_CONSUMPTION.filter(d => d.department === "Maintenance") },
    { line: "Quality",           materials: DEMO_DEPT_CONSUMPTION.filter(d => d.department === "Quality") },
    { line: "Dispatch",          materials: DEMO_DEPT_CONSUMPTION.filter(d => d.department === "Dispatch") },
  ].filter(p => p.materials.length > 0);

  // Wastage summary
  const totalWasteCost = DEMO_WASTAGE.reduce((a, w) => a + w.wasteCost, 0);
  const worstScrap = [...DEMO_WASTAGE].sort((a, b) => b.wastePercent - a.wastePercent)[0];
  const withinTarget = DEMO_WASTAGE.filter(w => w.wastePercent <= w.target).length;
  const materialsWithWaste = DEMO_WASTAGE.filter(w => w.wasteQty > 0).length;
  const actionRequired = DEMO_WASTAGE.filter(w => w.wastePercent > 0 && w.wastePercent > 2 * w.target);

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Consumption Analysis</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>30-day trend · department breakdown · production vs material</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {(["daily", "dept", "production", "wastage"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0070f2" : "#e2e8f0", background: tab === t ? "#0070f2" : "#fff", color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t === "daily" ? "📈 Daily Trend" : t === "dept" ? "🏢 Department-Wise" : t === "production" ? "⚙️ Production Analysis" : "♻️ Wastage Analysis"}
          </button>
        ))}
      </div>

      {tab === "daily" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: 20 }}>
          {/* Material list */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>Materials</div>
            {CONSUMPTION_DATA.map(m => (
              <button key={m.material} onClick={() => setSelected(m.material)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, marginBottom: 4, border: `1.5px solid ${selected === m.material ? "#0070f2" : "transparent"}`, background: selected === m.material ? "#eff6ff" : "transparent", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{m.material}</span>
                  {m.anomaly && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{m.description.slice(0, 22)}</div>
              </button>
            ))}
          </div>

          {/* Chart area */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { l: "30-day Plan", v: `${totalPlan.toFixed(1)} ${sel.unit}`, c: "#64748b" },
                { l: "30-day Actual", v: `${totalActual.toFixed(1)} ${sel.unit}`, c: Math.abs(variance) > 10 ? "#ef4444" : "#0070f2" },
                { l: "Variance", v: `${variance >= 0 ? "+" : ""}${variance.toFixed(1)}%`, c: variance > 5 ? "#ef4444" : variance < -5 ? "#f59e0b" : "#22c55e" },
              ].map(x => (
                <div key={x.l} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{x.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{sel.material} — {sel.description} (Aug 2026)</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "#94a3b8" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 2, background: "#cbd5e1", display: "inline-block", borderStyle: "dashed" }} />Plan</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 2, background: "#0070f2", display: "inline-block" }} />Actual</span>
                {sel.anomaly && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />Anomaly</span>}
              </div>
              <SparkLine plan={sel.plan} actual={sel.actual} anomalyDays={sel.anomalyDays} height={120} width={isMobile ? 260 : 520} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#94a3b8" }}>
                <span>Aug 1</span><span>Aug 8</span><span>Aug 15</span><span>Aug 22</span><span>Aug 30</span>
              </div>
            </div>

            {sel.anomaly && (
              <div style={{ background: "#fef2f2", borderRadius: 10, padding: "14px 18px", border: "1.5px solid #fecaca" }}>
                <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 4, fontSize: 13 }}>🔴 Anomaly Detected</div>
                <div style={{ color: "#991b1b", fontSize: 13 }}>{sel.anomaly}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button style={{ padding: "5px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Investigate</button>
                  <button style={{ padding: "5px 12px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Mark as Expected</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "dept" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflowX: "auto" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Department-Wise Consumption (Aug 2026)</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Department", "Material", "Daily Avg", "Weekly Total", "Monthly Total", "Plan", "Variance", "Cost", "Trend"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_DEPT_CONSUMPTION.map((d, i) => {
                const varColor = d.variance > 10 ? "#ef4444" : d.variance < -5 ? "#f59e0b" : "#22c55e";
                return (
                  <tr key={`${d.department}-${d.material}`} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{d.department}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#0070f2" }}>{d.material}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.description.slice(0, 20)}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{d.dailyAvg} {d.unit}</td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>{d.weeklyTotal} {d.unit}</td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>{d.monthlyTotal} {d.unit}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{d.plan} {d.unit}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 5, background: varColor + "18", color: varColor, fontWeight: 700, fontSize: 11 }}>
                        {d.variance >= 0 ? "+" : ""}{d.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>₹{(d.cost / 100000).toFixed(1)}L</td>
                    <td style={{ padding: "10px 14px" }}>
                      <svg width={50} height={20}>
                        <polyline points={[0,15,10,10,20,12,30,8,40,6,50,4].join(" ")} fill="none" stroke={d.variance > 5 ? "#ef4444" : "#22c55e"} strokeWidth={1.5} />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "production" && (
        <div>
          <div style={{ background: "#eff6ff", borderRadius: 10, padding: "12px 16px", border: "1px solid #bfdbfe", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1d4ed8" }}>Production vs Material Usage Analysis — Material consumed per production order</div>
            <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>Compare standard BOM qty vs actual material pulled per work order to identify excess usage or process inefficiencies</div>
          </div>
          {PROD_DATA.map(p => (
            <div key={p.line} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12 }}>{p.line}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
                {p.materials.map(m => (
                  <div key={m.material} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#0070f2" }}>{m.material}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{m.description.slice(0, 22)}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Actual</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{m.monthlyTotal} {m.unit}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Planned</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#64748b" }}>{m.plan} {m.unit}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ background: "#e2e8f0", borderRadius: 3, height: 5, flex: 1, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (m.monthlyTotal / m.plan) * 100)}%`, height: "100%", background: m.variance > 10 ? "#ef4444" : m.variance > 0 ? "#f59e0b" : "#22c55e" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: m.variance > 5 ? "#ef4444" : "#22c55e" }}>{m.variance >= 0 ? "+" : ""}{m.variance.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "wastage" && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Total Waste This Month", v: `${materialsWithWaste} Materials`, sub: "with positive waste", c: "#ef4444" },
              { l: "Waste Cost (₹)", v: `₹${(totalWasteCost / 100000).toFixed(1)}L`, sub: "total cost this month", c: "#dc2626" },
              { l: "Worst Scrap Rate", v: worstScrap.material, sub: `${worstScrap.wastePercent}% (target ${worstScrap.target}%)`, c: "#f59e0b" },
              { l: "Materials Within Target", v: `${withinTarget} / ${DEMO_WASTAGE.length}`, sub: "meeting scrap target", c: "#22c55e" },
            ].map(x => (
              <div key={x.l} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: x.c }}>{x.v}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{x.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>Actual Scrap Rate vs Target Rate</div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 14, height: 10, background: "#ef4444", borderRadius: 2, display: "inline-block" }} />Over Target
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 14, height: 10, background: "#22c55e", borderRadius: 2, display: "inline-block" }} />Within Target
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 20, borderTop: "1.5px dashed #94a3b8", display: "inline-block" }} />Target Rate
              </span>
            </div>
            <svg width="100%" viewBox="0 0 580 290" style={{ display: "block" }}>
              {[0,10,20,30,40,50,60,70,80,90].map(t => {
                const tx = 155 + (t / 90) * 390;
                return (
                  <g key={t}>
                    <line x1={tx} y1={18} x2={tx} y2={272} stroke="#e2e8f0" strokeWidth={1} />
                    <text x={tx} y={13} textAnchor="middle" fontSize={9} fill="#94a3b8">{t}%</text>
                  </g>
                );
              })}
              {DEMO_WASTAGE.map((w, i) => {
                const cy = 42 + i * 50;
                const isOver = w.wastePercent > w.target;
                const barColor = isOver ? "#ef4444" : "#22c55e";
                const barW = (Math.max(0, w.wastePercent) / 90) * 390;
                const targetX = 155 + (w.target / 90) * 390;
                return (
                  <g key={w.material}>
                    <text x={149} y={cy + 5} textAnchor="end" fontSize={11} fontWeight="bold" fill="#0070f2">{w.material}</text>
                    <text x={149} y={cy + 18} textAnchor="end" fontSize={9} fill="#94a3b8">{w.line}</text>
                    <rect x={155} y={cy - 9} width={390} height={18} fill="#f1f5f9" rx={4} />
                    <rect x={155} y={cy - 9} width={Math.max(2, barW)} height={18} fill={barColor} rx={4} fillOpacity={0.85} />
                    <line x1={targetX} y1={cy - 13} x2={targetX} y2={cy + 13} stroke="#64748b" strokeWidth={1.5} strokeDasharray="3,2" />
                    {w.wastePercent >= 0 ? (
                      <text x={155 + barW + 5} y={cy + 5} fontSize={11} fontWeight="bold" fill={barColor}>{w.wastePercent}%</text>
                    ) : (
                      <text x={161} y={cy + 5} fontSize={11} fontWeight="bold" fill="#22c55e">{w.wastePercent}% ↓</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detailed Table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Wastage Detail — Aug 2026</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Material", "Description", "Line", "Planned", "Actual", "Waste Qty", "Scrap Rate", "Target", "Cost Impact", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_WASTAGE.map((w, i) => {
                    const isOver = w.wastePercent > w.target;
                    const is2x = w.wastePercent > 0 && w.wastePercent > 2 * w.target;
                    const statusColor = !isOver ? "#22c55e" : is2x ? "#ef4444" : "#f59e0b";
                    const statusLabel = !isOver ? "Within Target" : is2x ? "Action Required" : "Over Target";
                    return (
                      <tr key={w.material} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0070f2" }}>{w.material}</td>
                        <td style={{ padding: "10px 12px", color: "#374151" }}>{w.description}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{w.line}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{w.planned} {w.unit}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{w.actual} {w.unit}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: w.wasteQty > 0 ? "#ef4444" : "#22c55e" }}>{w.wasteQty > 0 ? "+" : ""}{w.wasteQty} {w.unit}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: isOver ? "#ef4444" : "#22c55e" }}>{w.wastePercent}%</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{w.target}%</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: w.wasteCost > 0 ? "#dc2626" : "#22c55e" }}>
                          {w.wasteCost > 0 ? `₹${(w.wasteCost / 100000).toFixed(1)}L` : "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: 5, background: statusColor + "18", color: statusColor, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Required Banner */}
          {actionRequired.length > 0 && (
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: "16px 20px", border: "1.5px solid #fecaca" }}>
              <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 14, marginBottom: 10 }}>
                🚨 Action Required — {actionRequired.length} Material{actionRequired.length !== 1 ? "s" : ""} More Than 2× Over Scrap Target
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {actionRequired.map(w => (
                  <div key={w.material} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #fecaca", flex: "1 1 220px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>{w.material} — {w.description}</div>
                    <div style={{ fontSize: 12, color: "#991b1b", margin: "4px 0" }}>
                      {w.wastePercent}% vs target {w.target}%&nbsp;
                      <span style={{ fontWeight: 700 }}>({(w.wastePercent / w.target).toFixed(1)}× over target)</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{w.cause}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
