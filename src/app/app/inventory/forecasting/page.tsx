"use client";

import { useState, useMemo, useEffect } from "react";
import { DEMO_MATERIALS, generateForecast, DEMO_POS } from "@/lib/inventory-data";

const PENDING: Record<string, { qty: number; date: string }> = {
  "RM-1042": { qty: 40, date: "2026-08-15" },
  "RM-3015": { qty: 20, date: "2026-08-12" },
  "RM-2088": { qty: 60, date: "2026-08-20" },
};

const COLORS: Record<string, string> = {
  "critical": "#ef4444", "low": "#f59e0b", "healthy": "#22c55e", "overstock": "#8b5cf6", "dead": "#94a3b8",
};

function ForecastChart({ forecast30, material, reorderPoint, currentStock, pendingQty, pendingDate }:
  { forecast30: { date: string; projectedStock: number; lowerBound: number; upperBound: number }[]; material: string; reorderPoint: number; currentStock: number; pendingQty?: number; pendingDate?: string }) {

  const all = [currentStock, ...forecast30.map(p => p.upperBound)];
  const maxV = Math.max(...all, reorderPoint * 1.2);
  const W = 520, H = 180, PAD = { t: 16, r: 20, b: 32, l: 50 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const pts = [{ x: 0, proj: currentStock, lo: currentStock, hi: currentStock }, ...forecast30.map((p, i) => ({ x: i + 1, proj: p.projectedStock, lo: p.lowerBound, hi: p.upperBound }))];
  const X = (i: number) => PAD.l + (i / (pts.length - 1)) * cW;
  const Y = (v: number) => PAD.t + cH - (v / maxV) * cH;
  const reorderY = Y(reorderPoint);
  const pathMain = pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(p.proj).toFixed(1)}`).join(" ");
  const pathArea = [
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(p.hi).toFixed(1)}`).join(" "),
    [...pts].reverse().map((p, i, a) => `${i === 0 ? "L" : "L"}${X(a.length - 1 - i).toFixed(1)},${Y(p.lo).toFixed(1)}`).join(" "),
    "Z"
  ].join(" ");

  const firstZero = pts.findIndex(p => p.proj <= 0);
  const pendingIdx = pendingDate ? pts.findIndex((_, i) => {
    if (i === 0) return false;
    const d = forecast30[i - 1]?.date;
    return d && d >= pendingDate;
  }) : -1;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + cH * (1 - t)} y2={PAD.t + cH * (1 - t)} stroke="#f1f5f9" strokeWidth={1} />
      ))}
      {/* Reorder point line */}
      <line x1={PAD.l} x2={W - PAD.r} y1={reorderY} y2={reorderY} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3" />
      <text x={W - PAD.r + 4} y={reorderY + 4} fontSize={9} fill="#d97706">ROP</text>
      {/* Confidence band */}
      <path d={pathArea} fill="#0070f218" />
      {/* Projected line */}
      <path d={pathMain} fill="none" stroke="#0070f2" strokeWidth={2} />
      {/* Pending delivery marker */}
      {pendingIdx > 0 && (
        <>
          <line x1={X(pendingIdx)} x2={X(pendingIdx)} y1={PAD.t} y2={PAD.t + cH} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4,3" />
          <text x={X(pendingIdx)} y={PAD.t - 4} fontSize={9} fill="#16a34a" textAnchor="middle">+{pendingQty} delivery</text>
        </>
      )}
      {/* Stock-out marker */}
      {firstZero > 0 && (
        <circle cx={X(firstZero)} cy={Y(0)} r={5} fill="#ef4444" />
      )}
      {/* Y axis labels */}
      {[0, 0.5, 1].map(t => (
        <text key={t} x={PAD.l - 6} y={PAD.t + cH * (1 - t) + 4} fontSize={9} fill="#94a3b8" textAnchor="end">
          {(maxV * t).toFixed(0)}
        </text>
      ))}
      {/* X axis labels */}
      {[0, 7, 14, 21, 28].map(d => (
        <text key={d} x={X(d)} y={H - 4} fontSize={9} fill="#94a3b8" textAnchor="middle">+{d}d</text>
      ))}
    </svg>
  );
}

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState<30 | 60>(30);
  const [selected, setSelected] = useState("RM-1042");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const forecasts = useMemo(() => {
    return DEMO_MATERIALS.filter(m => m.dailyConsumption > 0).map(m => generateForecast(m, PENDING[m.material]));
  }, []);

  const sel = forecasts.find(f => f.material === selected) ?? forecasts[0];
  const sevColor = (mat: string) => {
    const m = DEMO_MATERIALS.find(x => x.material === mat);
    return COLORS[m?.status ?? "healthy"];
  };

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Inventory Forecasting</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>AI-projected stock levels · consumption trends · reorder predictions</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {([30, 60] as const).map(h => (
            <button key={h} onClick={() => setHorizon(h)} style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid", borderColor: horizon === h ? "#0070f2" : "#e2e8f0", background: horizon === h ? "#0070f2" : "#fff", color: horizon === h ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", flex: isMobile ? "1" : undefined }}>
              {h}-day view
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 20 }}>
        {/* Material selector */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px", border: "1.5px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>Materials</div>
          {forecasts.map(f => {
            const urgent = f.projectedStockOut && new Date(f.projectedStockOut) <= new Date("2026-08-20");
            return (
              <button key={f.material} onClick={() => setSelected(f.material)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, marginBottom: 4, border: `1.5px solid ${selected === f.material ? "#0070f2" : "transparent"}`, background: selected === f.material ? "#eff6ff" : "transparent", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{f.material}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor(f.material), flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.description.slice(0, 28)}</div>
                {f.projectedStockOut && (
                  <div style={{ fontSize: 10, color: urgent ? "#dc2626" : "#d97706", marginTop: 2, fontWeight: 600 }}>
                    Stock-out: {f.projectedStockOut}
                  </div>
                )}
                {!f.projectedStockOut && f.projectedReorderDate && (
                  <div style={{ fontSize: 10, color: "#8b5cf6", marginTop: 2 }}>Reorder: {f.projectedReorderDate}</div>
                )}
                {!f.projectedStockOut && !f.projectedReorderDate && (
                  <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>✓ 60+ days cover</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main forecast panel */}
        <div>
          {sel && (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { l: "Current Stock", v: `${sel.currentStock} ${sel.unit}`, c: "#0070f2" },
                  { l: "Daily Consumption", v: `${sel.dailyConsumption} ${sel.unit}/day`, c: "#8b5cf6" },
                  { l: sel.projectedStockOut ? "⚠ Stock-Out Date" : "Reorder By", v: sel.projectedStockOut ?? sel.projectedReorderDate ?? "60+ days", c: sel.projectedStockOut ? "#ef4444" : "#f59e0b" },
                  { l: "Pending Delivery", v: PENDING[sel.material] ? `${PENDING[sel.material].qty} ${sel.unit} on ${PENDING[sel.material].date}` : "None", c: "#22c55e" },
                ].map(x => (
                  <div key={x.l} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{x.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0", marginBottom: 16, overflowX: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{sel.material} — {sel.description}</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "#94a3b8" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 2, background: "#0070f2", display: "inline-block" }} />Projected Stock</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 8, background: "#0070f218", display: "inline-block", borderRadius: 2 }} />Confidence Band</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 2, background: "#f59e0b", display: "inline-block", borderStyle: "dashed" }} />Reorder Point</span>
                  {PENDING[sel.material] && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 20, height: 2, background: "#22c55e", display: "inline-block" }} />Expected Delivery</span>}
                </div>
                <ForecastChart
                  forecast30={horizon === 30 ? sel.forecast30 : sel.forecast60}
                  material={sel.material}
                  reorderPoint={sel.reorderPoint}
                  currentStock={sel.currentStock}
                  pendingQty={PENDING[sel.material]?.qty}
                  pendingDate={PENDING[sel.material]?.date}
                />
              </div>

              {/* AI recommendation */}
              <div style={{ background: sel.projectedStockOut ? "#fef2f2" : "#f0fdf4", borderRadius: 12, padding: "16px 20px", border: `1.5px solid ${sel.projectedStockOut ? "#fecaca" : "#bbf7d0"}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: sel.projectedStockOut ? "#dc2626" : "#15803d", marginBottom: 6 }}>
                  🤖 AI Recommendation
                </div>
                <div style={{ fontSize: 14, color: sel.projectedStockOut ? "#991b1b" : "#166534" }}>{sel.recommendation}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Safety Stock: {sel.safetyStock} {sel.unit} · Lead Time: {sel.leadTimeDays} days · Reorder Point: {sel.reorderPoint} {sel.unit}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* All materials forecast table */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #e2e8f0", marginTop: 20, overflowX: "auto" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>30-Day Forecast Summary — All Materials</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Material", "Description", "Current Stock", "Daily Use", "Days Cover", "Reorder Date", "Stock-Out Risk", "Action Required"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f, i) => {
              const m = DEMO_MATERIALS.find(x => x.material === f.material);
              const cover = f.dailyConsumption > 0 ? Math.round(f.currentStock / f.dailyConsumption) : 9999;
              const risk = f.projectedStockOut ? "HIGH" : cover < 15 ? "MEDIUM" : "LOW";
              const riskColor = risk === "HIGH" ? "#ef4444" : risk === "MEDIUM" ? "#f59e0b" : "#22c55e";
              return (
                <tr key={f.material} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{f.material}</td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>{f.description.slice(0, 25)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{f.currentStock} {f.unit}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{f.dailyConsumption} {f.unit}/d</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: cover < 5 ? "#ef4444" : cover < 15 ? "#f59e0b" : "#22c55e" }}>{cover === 9999 ? "∞" : cover} days</td>
                  <td style={{ padding: "10px 12px", color: "#8b5cf6", fontSize: 12 }}>{f.projectedReorderDate ?? (f.projectedStockOut ? "OVERDUE" : "—")}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 5, background: riskColor + "18", color: riskColor, fontWeight: 600, fontSize: 11 }}>{risk}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>
                    {f.projectedStockOut ? "Place emergency order" : f.projectedReorderDate ? "Schedule reorder" : "Monitor"}
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
