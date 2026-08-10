"use client";

import { useState, useEffect } from "react";
import { DEMO_WAREHOUSES, DEMO_BATCHES, DEMO_MOVEMENTS } from "@/lib/inventory-data";

function fmt(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

function UtilBar({ pct, color = "#0070f2" }: { pct: number; color?: string }) {
  return (
    <div style={{ background: "#e2e8f0", borderRadius: 4, height: 8, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

export default function WarehousePage() {
  const [tab, setTab] = useState<"overview" | "batch" | "movements">("overview");
  const [selectedWH, setSelectedWH] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const totalValue = DEMO_WAREHOUSES.reduce((a, w) => a + w.totalValue, 0);

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Warehouse View</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Material stock by warehouse · Batch tracking · Movement history</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, padding: "10px 18px", border: "1.5px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Total Stock Value</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{fmt(totalValue)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["overview", "batch", "movements"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0070f2" : "#e2e8f0", background: tab === t ? "#0070f2" : "#fff", color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
            {t === "overview" ? "🏭 Warehouse Overview" : t === "batch" ? "🏷️ Batch Tracking" : "📋 Movement History"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Warehouse cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
            {DEMO_WAREHOUSES.map(wh => {
              const utilColor = wh.utilization >= 80 ? "#ef4444" : wh.utilization >= 60 ? "#f59e0b" : "#22c55e";
              return (
                <div key={wh.warehouseId} onClick={() => setSelectedWH(selectedWH === wh.warehouseId ? null : wh.warehouseId)}
                  style={{ background: "#fff", borderRadius: 12, padding: "20px", border: selectedWH === wh.warehouseId ? "1.5px solid #0070f2" : "1.5px solid #e2e8f0", cursor: "pointer", boxShadow: selectedWH === wh.warehouseId ? "0 0 0 3px #0070f218" : "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{wh.warehouseId}</div>
                      <div style={{ fontSize: 13, color: "#475569" }}>{wh.warehouseName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{wh.location}</div>
                    </div>
                    <span style={{ padding: "4px 10px", background: utilColor + "18", color: utilColor, borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
                      {wh.utilization}% full
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <UtilBar pct={wh.utilization} color={utilColor} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Materials</div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>{wh.totalMaterials}</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Stock Value</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{fmt(wh.totalValue)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded warehouse detail */}
          {selectedWH && (() => {
            const wh = DEMO_WAREHOUSES.find(w => w.warehouseId === selectedWH);
            if (!wh) return null;
            return (
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1.5px solid #0070f2", overflowX: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>{wh.warehouseId} — {wh.warehouseName} · Material Detail</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Material", "Description", "Qty on Hand", "Unit", "Stock Value", "% of WH Value"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wh.materials.map((m, i) => (
                      <tr key={m.material} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a" }}>{m.material}</td>
                        <td style={{ padding: "10px 14px", color: "#475569" }}>{m.description}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>{m.qty.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.unit}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{fmt(m.value)}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ background: "#e2e8f0", borderRadius: 3, height: 6, width: 80, overflow: "hidden" }}>
                              <div style={{ width: `${Math.round(m.value / wh.totalValue * 100)}%`, height: "100%", background: "#0070f2" }} />
                            </div>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{Math.round(m.value / wh.totalValue * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {tab === "batch" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflowX: "auto" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Batch-Wise Inventory</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{DEMO_BATCHES.length} active batches across all warehouses</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Material", "Batch Number", "Warehouse", "Qty", "Unit", "Received Date", "Expiry Date", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_BATCHES.map((b, i) => {
                const statusColor = b.status === "Available" ? "#22c55e" : b.status === "Restricted" ? "#f59e0b" : "#ef4444";
                return (
                  <tr key={b.batchNumber} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "#0f172a" }}>{b.material}</td>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#0070f2", fontSize: 12 }}>{b.batchNumber}</td>
                    <td style={{ padding: "10px 16px", color: "#64748b" }}>{b.warehouse}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{b.quantity.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 16px", color: "#94a3b8" }}>{b.unit}</td>
                    <td style={{ padding: "10px 16px", color: "#475569", fontSize: 12 }}>{b.receivedDate}</td>
                    <td style={{ padding: "10px 16px", color: b.expiryDate ? "#475569" : "#94a3b8", fontSize: 12 }}>{b.expiryDate ?? "N/A"}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 5, background: statusColor + "18", color: statusColor, fontWeight: 600, fontSize: 11 }}>{b.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflowX: "auto" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Goods Movement History</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>GR (Goods Receipt) · GI (Goods Issue) · STO (Stock Transfer)</div>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
              {[{ l: "101 GR", c: "#22c55e" }, { l: "201 GI (CC)", c: "#f59e0b" }, { l: "261 GI (Prod)", c: "#0070f2" }, { l: "601 GI (Delivery)", c: "#8b5cf6" }].map(x => (
                <span key={x.l} style={{ padding: "3px 8px", background: x.c + "18", color: x.c, borderRadius: 5, fontWeight: 600 }}>{x.l}</span>
              ))}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Document", "Date & Time", "Material", "Movement Type", "Qty", "Warehouse", "Reference"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_MOVEMENTS.map((m, i) => {
                const mvColor = m.movementType === "101" ? "#22c55e" : m.movementType === "201" ? "#f59e0b" : m.movementType === "601" ? "#8b5cf6" : "#0070f2";
                const isGR = m.movementType === "101";
                return (
                  <tr key={m.documentNumber} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 12, color: "#0070f2" }}>{m.documentNumber}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#475569" }}>{new Date(m.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} {new Date(m.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{m.material}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.description.slice(0, 20)}</div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 5, background: mvColor + "18", color: mvColor, fontWeight: 600, fontSize: 11 }}>{m.movementType} {m.movementDescription.split(" ").slice(0, 2).join(" ")}</span>
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: isGR ? "#16a34a" : "#dc2626" }}>
                      {isGR ? "+" : ""}{m.quantity.toLocaleString("en-IN")} {m.unit}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#64748b", fontSize: 12 }}>{m.warehouse}</td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{m.referenceDocument}</td>
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
