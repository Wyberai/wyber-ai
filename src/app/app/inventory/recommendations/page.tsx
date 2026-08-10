"use client";

import { useState } from "react";

type Priority = "Urgent" | "High" | "Medium" | "Low";

interface Recommendation {
  id: string;
  material: string;
  description: string;
  action: string;
  priority: Priority;
  reason: string;
  quantity: string;
  estimatedCost: string;
  impact: string;
  deadline: string;
  accepted: boolean | null;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    material: "RM-3015",
    description: "Copper Wire 4mm",
    action: "Expedite In-Transit PO 4500018791",
    priority: "Urgent",
    reason: "2.9 days of cover remaining. Production lines C and D will halt without this material by Aug 13.",
    quantity: "20 MT in transit",
    estimatedCost: "₹18.0L (already committed)",
    impact: "Avoids ₹12L/day production line stoppage",
    deadline: "Aug 12",
    accepted: null,
  },
  {
    id: "r2",
    material: "RM-5520",
    description: "PVC Insulation Tape (20m roll)",
    action: "Place reorder — 500 EA",
    priority: "High",
    reason: "12.5 days of cover. Safety stock will be breached by Aug 22. Consumption running 18% above plan due to batch rework.",
    quantity: "500 EA recommended",
    estimatedCost: "~₹25,000",
    impact: "Prevents stockout before Sep delivery window",
    deadline: "Aug 14",
    accepted: null,
  },
  {
    id: "r3",
    material: "RM-1042",
    description: "Aluminium Sheet 2mm",
    action: "Monitor PO 4500018842 delivery closely",
    priority: "High",
    reason: "4.9 days of cover. PO for 40 MT is due Aug 15 — any delay would trigger a production stoppage.",
    quantity: "40 MT on order",
    estimatedCost: "₹24.0L (already committed)",
    impact: "Confirm delivery date with Hindalco today",
    deadline: "Aug 15",
    accepted: null,
  },
  {
    id: "r4",
    material: "FG-0077",
    description: "Motor Assembly 5HP (OEM-A)",
    action: "Pause procurement — dispatch overstock first",
    priority: "Medium",
    reason: "620 EA in stock (34.4 days cover) vs. 15-day target. ₹1.55Cr in working capital tied up in finished goods.",
    quantity: "No new orders for 6 weeks",
    estimatedCost: "₹0 — prevents ₹1.55Cr over-investment",
    impact: "Frees ₹1.55Cr working capital",
    deadline: "Aug 30",
    accepted: null,
  },
  {
    id: "r5",
    material: "FG-0211",
    description: "Control Panel (IP54, 3-phase)",
    action: "Expedite sales dispatch — overstock clearance",
    priority: "Medium",
    reason: "487 EA (34.8 days cover). Work with sales team to prioritize dispatch of pending orders.",
    quantity: "Target: dispatch 100 EA by Aug 31",
    estimatedCost: "₹0 — accelerates cash collection",
    impact: "₹2.4Cr potential early cash collection",
    deadline: "Aug 31",
    accepted: null,
  },
];

const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; border: string }> = {
  Urgent: { bg: "#fff1f2", text: "#dc2626", border: "#fecaca" },
  High:   { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  Medium: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Low:    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>(RECOMMENDATIONS);

  const accept = (id: string) => setRecs(r => r.map(x => x.id === id ? { ...x, accepted: true } : x));
  const dismiss = (id: string) => setRecs(r => r.map(x => x.id === id ? { ...x, accepted: false } : x));

  const pending = recs.filter(r => r.accepted === null).length;
  const accepted = recs.filter(r => r.accepted === true).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>AI Recommendations</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Generated from SAP data · Updated daily at 06:30 IST</p>
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Review", value: pending, color: "#d97706", bg: "#fffbeb" },
          { label: "Accepted", value: accepted, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Dismissed", value: recs.filter(r => r.accepted === false).length, color: "#64748b", bg: "#f8fafc" },
        ].map(s => (
          <div key={s.label} style={{ padding: "12px 20px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recommendation cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {recs.map(rec => {
          const ps = PRIORITY_STYLE[rec.priority];
          const accepted = rec.accepted;
          return (
            <div key={rec.id} style={{
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${accepted === true ? "#bbf7d0" : accepted === false ? "#e2e8f0" : ps.border}`,
              borderLeft: `4px solid ${accepted === true ? "#22c55e" : accepted === false ? "#94a3b8" : ps.text}`,
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              opacity: accepted === false ? 0.55 : 1,
              transition: "opacity 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>
                      {rec.priority}
                    </span>
                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{rec.material}</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>— {rec.description}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, marginBottom: 6 }}>{rec.action}</div>
                  <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{rec.reason}</div>

                  <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Quantity", value: rec.quantity },
                      { label: "Est. Cost", value: rec.estimatedCost },
                      { label: "Impact", value: rec.impact },
                      { label: "Deadline", value: rec.deadline },
                    ].map(d => (
                      <div key={d.label}>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", marginBottom: 2 }}>{d.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {accepted === null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 20, flexShrink: 0 }}>
                    <button
                      onClick={() => accept(rec.id)}
                      style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600 }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => dismiss(rec.id)}
                      style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "#fff", color: "#64748b", fontSize: 13 }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {accepted === true && (
                  <div style={{ marginLeft: 20, padding: "6px 14px", borderRadius: 8, background: "#f0fdf4", color: "#16a34a", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    ✓ Accepted
                  </div>
                )}
                {accepted === false && (
                  <div style={{ marginLeft: 20, padding: "6px 14px", borderRadius: 8, background: "#f8fafc", color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>
                    Dismissed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
