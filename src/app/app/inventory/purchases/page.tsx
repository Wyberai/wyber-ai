"use client";

import { useEffect, useState } from "react";
import type { PurchaseOrder } from "@/lib/sap-client";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "Open":                 { bg: "#eff6ff", text: "#1d4ed8" },
  "In Transit":           { bg: "#f0fdf4", text: "#16a34a" },
  "Partially Delivered":  { bg: "#fffbeb", text: "#d97706" },
  "Closed":               { bg: "#f8fafc", text: "#64748b" },
};

type BlockState = Record<string, "blocked" | "overridden" | null>;

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockState, setBlockState] = useState<BlockState>({});
  const [filter, setFilter] = useState<"all" | "duplicates">("all");

  useEffect(() => {
    fetch("/api/inventory/purchases")
      .then(r => r.json())
      .then(d => { setOrders(d.orders); setLoading(false); });
  }, []);

  function block(poNumber: string) {
    setBlockState(s => ({ ...s, [poNumber]: "blocked" }));
  }
  function override(poNumber: string) {
    setBlockState(s => ({ ...s, [poNumber]: "overridden" }));
  }

  const displayed = filter === "duplicates" ? orders.filter(o => o.duplicate) : orders;
  const totalExposure = orders.filter(o => o.duplicate && blockState[o.poNumber] !== "blocked").reduce((a, o) => a + o.netPrice, 0);
  const savings = orders.filter(o => o.duplicate && blockState[o.poNumber] === "blocked").reduce((a, o) => a + o.netPrice, 0);

  const fmtINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Purchase Orders</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Duplicate detection active · Plant 1010</p>
      </div>

      {/* Duplicate summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", borderTop: "3px solid #dc2626" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" }}>Duplicate POs</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>{orders.filter(o => o.duplicate).length}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Flagged for review</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", borderTop: "3px solid #f59e0b" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" }}>At-Risk Exposure</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#d97706" }}>{fmtINR(totalExposure)}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Potential excess spend</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", borderTop: "3px solid #16a34a" }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500, marginBottom: 6, textTransform: "uppercase" }}>Blocked / Saved</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{fmtINR(savings)}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>From blocked orders</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {(["all", "duplicates"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: filter === f ? "#0070f2" : "#fff",
            color: filter === f ? "#fff" : "#475569",
            borderColor: filter === f ? "#0070f2" : "#e2e8f0",
          }}>
            {f === "all" ? `All POs (${orders.length})` : `⚠ Duplicates (${orders.filter(o => o.duplicate).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>Loading from SAP...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayed.map(order => {
            const state = blockState[order.poNumber];
            const isDup = Boolean(order.duplicate);
            return (
              <div key={order.poNumber} style={{
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${isDup && !state ? "#fed7aa" : state === "blocked" ? "#bbf7d0" : "#e2e8f0"}`,
                borderLeft: isDup ? `4px solid ${state === "blocked" ? "#22c55e" : state === "overridden" ? "#94a3b8" : "#f97316"}` : "4px solid transparent",
                padding: "18px 20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                opacity: state === "blocked" ? 0.7 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>PO {order.poNumber}</span>
                      <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, ...STATUS_STYLE[order.status] }}>
                        {order.status}
                      </span>
                      {isDup && (
                        <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: state === "blocked" ? "#f0fdf4" : state === "overridden" ? "#f8fafc" : "#fff7ed",
                          color: state === "blocked" ? "#16a34a" : state === "overridden" ? "#64748b" : "#9a3412",
                        }}>
                          {state === "blocked" ? "✓ Blocked" : state === "overridden" ? "Override Approved" : "⚠ Duplicate Flag"}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#374151", fontSize: 13 }}>{order.description} ({order.material})</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                      {order.vendor} · {order.quantity} {order.unit} · Delivery: {order.deliveryDate}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: isDup && !state ? "#dc2626" : "#0f172a" }}>
                      {fmtINR(order.netPrice)}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Created: {order.createdAt}</div>
                  </div>
                </div>

                {/* Duplicate reasoning */}
                {isDup && order.duplicate && (
                  <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: state === "blocked" ? "#f0fdf4" : "#fff7ed", border: `1px solid ${state === "blocked" ? "#bbf7d0" : "#fed7aa"}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: state === "blocked" ? "#166534" : "#9a3412", marginBottom: 4 }}>
                      AI Analysis — Duplicate of PO {order.duplicate.of}
                    </div>
                    <div style={{ fontSize: 12, color: state === "blocked" ? "#166534" : "#78350f" }}>{order.duplicate.reason}</div>

                    {!state && (
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button
                          onClick={() => block(order.poNumber)}
                          style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600 }}
                        >
                          Block PO
                        </button>
                        <button
                          onClick={() => override(order.poNumber)}
                          style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "#fff", color: "#374151", fontSize: 13 }}
                        >
                          Override — Approve Anyway
                        </button>
                      </div>
                    )}
                    {state === "blocked" && (
                      <div style={{ marginTop: 10, color: "#16a34a", fontWeight: 600, fontSize: 13 }}>✓ This PO is blocked — procurement team notified.</div>
                    )}
                    {state === "overridden" && (
                      <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>Override recorded. PO will proceed to approval workflow.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
