"use client";

import { useState, useEffect } from "react";

const AUDIT_LOGS = [
  { id:"log001", ts:"2026-08-10T07:42:00Z", user:"G. Prasad (GM)", role:"Admin", action:"Report Downloaded", category:"report", detail:"Monthly Management Summary — August 2026 (PDF)", status:"success" },
  { id:"log002", ts:"2026-08-10T07:30:00Z", user:"System", role:"System", action:"Critical Alert Sent", category:"alert", detail:"RM-3015 Copper Wire 4mm — 2.9 days cover. Email sent to store.manager + procurement.", status:"success" },
  { id:"log003", ts:"2026-08-10T07:30:00Z", user:"System", role:"System", action:"Critical Alert Sent", category:"alert", detail:"RM-1042 Aluminium Sheet 2mm — 4.9 days cover. Production Line B 23% above plan.", status:"success" },
  { id:"log004", ts:"2026-08-10T07:15:00Z", user:"G. Prasad (GM)", role:"Admin", action:"Dashboard Login", category:"access", detail:"Admin session started — Plant 1010, Hyderabad Manufacturing", status:"success" },
  { id:"log005", ts:"2026-08-09T16:45:00Z", user:"S. Mehta", role:"Procurement", action:"PO Blocked", category:"po", detail:"PO 4500018843 (₹18.6L, Aluminium Sheet, Nalco) blocked on AI recommendation", status:"blocked" },
  { id:"log006", ts:"2026-08-09T16:30:00Z", user:"S. Mehta", role:"Procurement", action:"Recommendation Accepted", category:"recommendation", detail:"Duplicate PO 4500018843 block — ₹18.6L saving confirmed", status:"success" },
  { id:"log007", ts:"2026-08-09T16:00:00Z", user:"System", role:"System", action:"Duplicate PO Flagged", category:"po", detail:"PO 4500018843 auto-detected as duplicate of PO-4500018842 (76 days cover post-delivery)", status:"warning" },
  { id:"log008", ts:"2026-08-09T15:30:00Z", user:"S. Mehta", role:"Procurement", action:"Dashboard Login", category:"access", detail:"Procurement Officer session — reviewing open POs", status:"success" },
  { id:"log009", ts:"2026-08-09T14:00:00Z", user:"System", role:"System", action:"Duplicate PO Flagged", category:"po", detail:"PO 4500018700 (₹20L HDPE Granules, RIL) flagged — PO-18680 already covers needs through Nov 2026", status:"warning" },
  { id:"log010", ts:"2026-08-09T11:15:00Z", user:"R. Venkatesh", role:"Plant Manager", action:"Report Downloaded", category:"report", detail:"Production Consumption Analysis — August 2026 (CSV)", status:"success" },
  { id:"log011", ts:"2026-08-09T10:45:00Z", user:"K. Reddy", role:"Store Manager", action:"Stock Movement Viewed", category:"access", detail:"Movement History for RM-1042, RM-2088, RM-3015 — Aug 1–9", status:"success" },
  { id:"log012", ts:"2026-08-09T09:30:00Z", user:"R. Venkatesh", role:"Plant Manager", action:"Dashboard Login", category:"access", detail:"Plant Manager session — consumption and warehouse review", status:"success" },
  { id:"log013", ts:"2026-08-08T17:00:00Z", user:"K. Reddy", role:"Store Manager", action:"GR Posted (via SAP)", category:"po", detail:"RM-2088 Steel Rod Ø12mm — 42.7 MT received against PO-4500018756 (SAIL Distributors)", status:"success" },
  { id:"log014", ts:"2026-08-08T14:30:00Z", user:"G. Prasad (GM)", role:"Admin", action:"Recommendation Accepted", category:"recommendation", detail:"Emergency PO for RM-3015 Copper Wire 4mm — critical stock, 2.9 days cover", status:"success" },
  { id:"log015", ts:"2026-08-08T09:15:00Z", user:"System", role:"System", action:"SAP Data Sync", category:"system", detail:"Full inventory refresh — 12 materials, 8 POs, 3 warehouses synced from Plant 1010", status:"success" },
  { id:"log016", ts:"2026-08-07T18:00:00Z", user:"System", role:"System", action:"Dead Stock Alert Sent", category:"alert", detail:"SP-0145 V-Belt A-42 (180 EA, ₹54K) — zero movement since March 2026, write-off review triggered", status:"warning" },
  { id:"log017", ts:"2026-08-07T16:45:00Z", user:"G. Prasad (GM)", role:"Admin", action:"Report Downloaded", category:"report", detail:"Inventory Health Summary — July 2026 Management Pack (PDF)", status:"success" },
  { id:"log018", ts:"2026-08-07T14:00:00Z", user:"S. Mehta", role:"Procurement", action:"Recommendation Dismissed", category:"recommendation", detail:"FG-0077 overstock action deferred — coordination with Sales team required first", status:"success" },
  { id:"log019", ts:"2026-08-07T11:30:00Z", user:"R. Venkatesh", role:"Plant Manager", action:"Report Downloaded", category:"report", detail:"Warehouse Utilization Analysis — WH-01, WH-02, WH-03 (CSV)", status:"success" },
  { id:"log020", ts:"2026-08-06T16:00:00Z", user:"K. Reddy", role:"Store Manager", action:"Dashboard Login", category:"access", detail:"Store Manager session — batch tracking review", status:"success" },
  { id:"log021", ts:"2026-08-06T09:00:00Z", user:"System", role:"System", action:"SAP Data Sync", category:"system", detail:"Daily sync completed — all modules updated from SAP ERP Plant 1010", status:"success" },
  { id:"log022", ts:"2026-08-05T17:30:00Z", user:"G. Prasad (GM)", role:"Admin", action:"Recommendation Accepted", category:"recommendation", detail:"Dead stock SP-0145 V-Belt A-42 write-off authorized — ₹54K write-off to Finance", status:"success" },
  { id:"log023", ts:"2026-08-05T15:00:00Z", user:"System", role:"System", action:"GR Notification", category:"system", detail:"PM-0441 HDPE Granules — 80 MT received (Partial) against PO-4500018680 (Reliance Industries)", status:"success" },
  { id:"log024", ts:"2026-08-04T10:00:00Z", user:"S. Mehta", role:"Procurement", action:"PO Flagged for Review", category:"po", detail:"PO 4500018700 (HDPE Granules, RIL) manually flagged pending duplicate check with store team", status:"warning" },
  { id:"log025", ts:"2026-08-03T09:00:00Z", user:"System", role:"System", action:"Monthly Alert Scheduled", category:"system", detail:"Monthly Inventory Summary scheduled for Sep 1, 2026 — recipients: GM, Store Manager, Finance", status:"success" },
];

const CATEGORIES = [
  { key: "all",            label: "All" },
  { key: "access",         label: "Access" },
  { key: "recommendation", label: "Recommendations" },
  { key: "report",         label: "Reports" },
  { key: "alert",          label: "Alerts" },
  { key: "po",             label: "PO Actions" },
  { key: "system",         label: "System" },
];

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  "Admin":         { bg: "#7c3aed", color: "#fff" },
  "Procurement":   { bg: "#d97706", color: "#fff" },
  "Plant Manager": { bg: "#0070f2", color: "#fff" },
  "Store Manager": { bg: "#16a34a", color: "#fff" },
  "System":        { bg: "#64748b", color: "#fff" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "#dcfce7", color: "#166534", label: "Success" },
  blocked: { bg: "#fef2f2", color: "#b91c1c", label: "Blocked" },
  warning: { bg: "#fefce8", color: "#854d0e", label: "Warning" },
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mon = monthNames[d.getUTCMonth()];
  const hh = String(d.getUTCHours()).padStart(2,"0");
  const mm = String(d.getUTCMinutes()).padStart(2,"0");
  return `${day} ${mon}, ${hh}:${mm} IST`;
}

function exportCSV() {
  const header = ["Timestamp","User","Role","Action","Detail","Status"];
  const rows = AUDIT_LOGS.map(log => [
    formatTs(log.ts),
    log.user,
    log.role,
    log.action,
    `"${log.detail.replace(/"/g,'""')}"`,
    log.status,
  ].join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "intellistock-audit-logs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filtered = activeCategory === "all"
    ? AUDIT_LOGS
    : AUDIT_LOGS.filter(l => l.category === activeCategory);

  const kpiCards = [
    { label: "Total Actions", sub: "this month", value: 47, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
    { label: "PO Blocks", sub: "AI prevented", value: 2, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
    { label: "Reports Downloaded", sub: "", value: 8, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Active Users", sub: "", value: 4, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#0f172a" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Audit Logs</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Full activity trail — user actions, AI decisions, and system events
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 8,
            background: "linear-gradient(135deg,#0070f2,#0050d0)",
            color: "#fff", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, boxShadow: "0 1px 4px rgba(0,112,242,0.25)",
          }}
        >
          <span style={{ fontSize: 15 }}>↓</span> Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {kpiCards.map(card => (
          <div
            key={card.label}
            style={{
              background: card.bg,
              border: `1.5px solid ${card.border}`,
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>
              {card.label}{card.sub ? <span style={{ marginLeft: 4, color: "#94a3b8" }}>({card.sub})</span> : null}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: activeCategory === cat.key ? "1.5px solid #0070f2" : "1.5px solid #e2e8f0",
              background: activeCategory === cat.key ? "#0070f2" : "#fff",
              color: activeCategory === cat.key ? "#fff" : "#475569",
              fontSize: 12,
              fontWeight: activeCategory === cat.key ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {cat.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflowX: "auto" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "160px 140px 130px 200px 100px" : "160px 140px 130px 200px 1fr 100px",
          padding: "10px 16px",
          background: "#f8fafc",
          borderBottom: "1.5px solid #e2e8f0",
          gap: 12,
        }}>
          {["Timestamp","User","Role","Action","Detail","Status"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: isMobile && h === "Detail" ? "none" : undefined }}>
              {h}
            </div>
          ))}
        </div>

        {/* Table rows */}
        {filtered.map((log, idx) => {
          const roleStyle = ROLE_STYLES[log.role] ?? { bg: "#64748b", color: "#fff" };
          const statusStyle = STATUS_STYLES[log.status] ?? STATUS_STYLES.success;
          const isExpanded = expandedRow === log.id;
          const isLast = idx === filtered.length - 1;

          return (
            <div
              key={log.id}
              onClick={() => setExpandedRow(isExpanded ? null : log.id)}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "160px 140px 130px 200px 100px" : "160px 140px 130px 200px 1fr 100px",
                padding: "12px 16px",
                gap: 12,
                borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                cursor: "pointer",
                background: isExpanded ? "#f8fafc" : (idx % 2 === 0 ? "#fff" : "#fafafa"),
                alignItems: "start",
                transition: "background 0.1s",
              }}
            >
              {/* Timestamp */}
              <div style={{ fontSize: 12, color: "#475569", paddingTop: 2, lineHeight: 1.4 }}>
                {formatTs(log.ts)}
              </div>

              {/* User */}
              <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, paddingTop: 2, lineHeight: 1.4 }}>
                {log.user}
              </div>

              {/* Role badge */}
              <div style={{ paddingTop: 2 }}>
                <span style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: roleStyle.bg,
                  color: roleStyle.color,
                  whiteSpace: "nowrap",
                }}>
                  {log.role}
                </span>
              </div>

              {/* Action */}
              <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, paddingTop: 2, lineHeight: 1.4 }}>
                {log.action}
              </div>

              {/* Detail */}
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, paddingTop: 2, display: isMobile ? "none" : undefined }}>
                {isExpanded ? (
                  <span style={{ color: "#334155" }}>{log.detail}</span>
                ) : (
                  <span
                    title={log.detail}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    } as React.CSSProperties}
                  >
                    {log.detail}
                  </span>
                )}
              </div>

              {/* Status badge */}
              <div style={{ paddingTop: 2 }}>
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  whiteSpace: "nowrap",
                }}>
                  {statusStyle.label}
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            No entries match this filter.
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
        Audit data covers Aug 1–10, 2026 · Plant 1010, Hyderabad · Demo mode
      </div>
    </div>
  );
}
