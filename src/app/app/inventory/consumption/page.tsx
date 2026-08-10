"use client";

import { useState } from "react";

const CONSUMPTION_DATA = [
  {
    material: "RM-1042", description: "Aluminium Sheet 2mm", unit: "MT",
    plan: [3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.5, 3.8, 3.9, 3.9, 3.9, 4.0, 4.1, 4.0, 3.9, 3.8],
    actual:[3.0, 3.1, 3.0, 2.9, 3.1, 3.0, 3.0, 3.2, 3.1, 3.0, 3.1, 3.0, 2.8, 3.1, 3.2, 3.1, 3.0, 3.1, 3.0, 3.2, 4.1, 4.5, 4.8, 4.7, 4.6, 4.8, 4.9, 4.8, 4.7, 4.8],
    anomaly: "23% excess from Aug 3 — new cutting program higher scrap rate (Line B)",
    anomalyStart: 20,
  },
  {
    material: "RM-3015", description: "Copper Wire 4mm", unit: "MT",
    plan: [2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8],
    actual:[2.7, 2.8, 2.9, 2.8, 2.7, 2.8, 2.8, 2.9, 2.8, 2.7, 2.8, 2.8, 2.9, 2.8, 2.7, 2.8, 2.8, 2.8, 2.9, 2.8, 2.8, 2.7, 2.8, 2.8, 2.9, 2.8, 2.7, 2.8, 2.8, 2.9],
    anomaly: null,
    anomalyStart: -1,
  },
  {
    material: "RM-5520", description: "PVC Insulation Tape", unit: "EA",
    plan: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    actual:[10, 10,  9, 10, 10, 11, 10, 10, 11, 10, 10,  9, 10, 10, 11, 10, 18, 19, 17, 18, 17, 18, 19, 18, 17, 18, 18, 17, 18, 19],
    anomaly: "18% excess from Aug 16 — packaging rework for Batch 2026-B14 (quality hold)",
    anomalyStart: 16,
  },
];

function SparkLine({ plan, actual, anomalyStart }: { plan: number[]; actual: number[]; anomalyStart: number }) {
  const all = [...plan, ...actual];
  const maxV = Math.max(...all) * 1.1;
  const minV = Math.min(...all) * 0.9;
  const W = 320, H = 80, PAD = 8;

  const xScale = (i: number) => PAD + (i / (plan.length - 1)) * (W - PAD * 2);
  const yScale = (v: number) => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2);

  const toPath = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80 }}>
      {anomalyStart > 0 && (
        <rect
          x={xScale(anomalyStart)} y={PAD}
          width={W - PAD - xScale(anomalyStart)} height={H - PAD * 2}
          fill="#fff7ed" opacity={0.8}
        />
      )}
      <path d={toPath(plan)} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" />
      <path d={toPath(actual)} fill="none" stroke="#0070f2" strokeWidth={2} />
      {actual.map((v, i) => (
        v > plan[i] * 1.1 ? (
          <circle key={i} cx={xScale(i)} cy={yScale(v)} r={3} fill="#dc2626" />
        ) : null
      ))}
    </svg>
  );
}

export default function ConsumptionPage() {
  const [selected, setSelected] = useState(0);
  const mat = CONSUMPTION_DATA[selected];
  const today = CONSUMPTION_DATA.map(m => m.actual[m.actual.length - 1]);
  const planToday = CONSUMPTION_DATA.map(m => m.plan[m.plan.length - 1]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Consumption Analysis</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>30-day plan vs. actual · Anomaly detection active</p>
      </div>

      {/* Waste alert banner */}
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: "#9a3412", fontSize: 14 }}>2 consumption anomalies detected this month</div>
          <div style={{ color: "#78350f", fontSize: 13, marginTop: 2 }}>Estimated excess material cost: <strong>₹4.2L</strong> — RM-1042 (Line B cutting scrap) + RM-5520 (Batch 2026-B14 rework)</div>
        </div>
      </div>

      {/* Material selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {CONSUMPTION_DATA.map((m, i) => (
          <button
            key={m.material}
            onClick={() => setSelected(i)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 500,
              background: selected === i ? "#0070f2" : "#fff",
              color: selected === i ? "#fff" : "#475569",
              borderColor: selected === i ? "#0070f2" : "#e2e8f0",
              position: "relative",
            }}
          >
            {m.material}
            {m.anomaly && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "#dc2626", border: "2px solid #fff" }} />
            )}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>{mat.material} — {mat.description}</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Daily consumption ({mat.unit}) · Last 30 days</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 20, height: 2, background: "#94a3b8", display: "inline-block" }} />
              <span style={{ color: "#64748b" }}>Plan</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 20, height: 2, background: "#0070f2", display: "inline-block" }} />
              <span style={{ color: "#64748b" }}>Actual</span>
            </span>
            {mat.anomaly && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                <span style={{ color: "#64748b" }}>Anomaly</span>
              </span>
            )}
          </div>
        </div>
        <SparkLine plan={mat.plan} actual={mat.actual} anomalyStart={mat.anomalyStart} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Jul 12</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Aug 10</span>
        </div>
        {mat.anomaly && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <span style={{ fontWeight: 600, color: "#9a3412", fontSize: 13 }}>⚠️ Anomaly: </span>
            <span style={{ color: "#78350f", fontSize: 13 }}>{mat.anomaly}</span>
          </div>
        )}
      </div>

      {/* Summary table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Material", "Avg Daily Plan", "Avg Daily Actual", "Variance", "MTD Excess Cost", "Alert"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONSUMPTION_DATA.map((m, i) => {
              const avgPlan = m.plan.reduce((a, v) => a + v, 0) / m.plan.length;
              const avgActual = m.actual.reduce((a, v) => a + v, 0) / m.actual.length;
              const variance = ((avgActual - avgPlan) / avgPlan) * 100;
              const excessCost = m.anomaly ? (i === 0 ? 280000 : 42000) : 0;
              return (
                <tr key={m.material} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{m.material}</td>
                  <td style={{ padding: "13px 16px", color: "#374151", fontSize: 13 }}>{avgPlan.toFixed(1)} {m.unit}</td>
                  <td style={{ padding: "13px 16px", color: "#374151", fontSize: 13 }}>{avgActual.toFixed(1)} {m.unit}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: variance > 5 ? "#dc2626" : variance < -5 ? "#0070f2" : "#16a34a" }}>
                    {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
                  </td>
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: excessCost > 0 ? "#dc2626" : "#16a34a", fontSize: 13 }}>
                    {excessCost > 0 ? `₹${(excessCost / 100000).toFixed(1)}L excess` : "On plan"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {m.anomaly ? (
                      <span style={{ padding: "2px 10px", borderRadius: 20, background: "#fff1f2", color: "#dc2626", fontSize: 11, fontWeight: 600 }}>⚠ Alert</span>
                    ) : (
                      <span style={{ padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600 }}>✓ Normal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
