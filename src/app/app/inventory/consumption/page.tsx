"use client";

import { useState } from "react";
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
  const [tab, setTab] = useState<"daily" | "dept" | "production">("daily");

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

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Consumption Analysis</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>30-day trend · department breakdown · production vs material</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["daily", "dept", "production"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0070f2" : "#e2e8f0", background: tab === t ? "#0070f2" : "#fff", color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t === "daily" ? "📈 Daily Trend" : t === "dept" ? "🏢 Department-Wise" : "⚙️ Production Analysis"}
          </button>
        ))}
      </div>

      {tab === "daily" && (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
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
              <SparkLine plan={sel.plan} actual={sel.actual} anomalyDays={sel.anomalyDays} height={120} width={520} />
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
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
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
    </div>
  );
}
