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

function HeroGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 56, cx = 70, cy = 70;
  const circum = 2 * Math.PI * r;
  const filled = (score / 100) * circum;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circum - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={800} fill={color}>{score}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={500} fill="rgba(255,255,255,0.55)">out of 100</text>
    </svg>
  );
}

function SectionHeader({ title, badge, badgeColor = "#0070f2" }: { title: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 3, height: 20, background: badgeColor, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      {badge && (
        <span style={{ padding: "3px 10px", background: badgeColor + "18", color: badgeColor, borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  alert?: boolean;
  icon: string;
}

function KPICard({ label, value, sub, color = "#0070f2", alert = false, icon }: KPICardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "20px 22px",
        border: alert ? `1.5px solid ${color}30` : "1.5px solid #e2e8f0",
        boxShadow: hovered
          ? `0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.07)`
          : "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8, paddingRight: 52 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: alert ? color : "#0f172a", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, paddingRight: 52 }}>{sub}</div>}
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
  { label: "Raw Materials", sub: "WH-01", value: 3990000, pct: 72, color: "#0070f2" },
  { label: "Finished Goods", sub: "WH-03", value: 39850000, pct: 85, color: "#7c3aed" },
  { label: "Packaging & Spares", sub: "WH-02", value: 5040000, pct: 58, color: "#0891b2" },
];

const PRIORITY_ACTIONS = [
  { icon: "🚨", text: "RM-3015 stock-out in 2.9 days", action: "Emergency PO", actionColor: "#dc2626", bg: "#fef2f2", border: "#fecaca", textColor: "#991b1b" },
  { icon: "🚨", text: "RM-1042 stock-out in 4.9 days", action: "View Forecast", actionColor: "#dc2626", bg: "#fef2f2", border: "#fecaca", textColor: "#991b1b" },
  { icon: "⚠️", text: "₹38.6L in duplicate POs pending block", action: "Review", actionColor: "#d97706", bg: "#fffbeb", border: "#fde68a", textColor: "#92400e" },
];

const HEALTH_DEDUCTIONS = [
  { label: "Critical Stock", pct: 30, color: "#ef4444" },
  { label: "Duplicates", pct: 15, color: "#f59e0b" },
  { label: "Slow-Moving", pct: 8, color: "#94a3b8" },
  { label: "Waste Alerts", pct: 6, color: "#fb923c" },
];

export default function InventoryOverview() {
  const [kpis, setKpis] = useState<Partial<KPIs>>({});

  useEffect(() => {
    fetch("/api/inventory/overview").then(r => r.json()).then(d => setKpis(d.kpis || {}));
  }, []);

  const health = kpis.healthScore ?? 41;
  const totalValue = kpis.totalStockValue ?? 48880500;
  const opening = 39200000;
  const closing = totalValue;
  const movement = closing - opening;
  const healthColor = health >= 75 ? "#22c55e" : health >= 50 ? "#f59e0b" : "#ef4444";
  const healthLabel = health >= 75 ? "Healthy" : health >= 50 ? "Fair" : "At Risk";

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Page Title */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Inventory Overview</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>IntelliStock · Real-time operations dashboard · August 2026</p>
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

      {/* HERO HEALTH BANNER */}
      <div style={{
        borderRadius: 16,
        background: "linear-gradient(135deg, #0f172a 0%, #1a2332 100%)",
        padding: "32px 36px 0",
        marginBottom: 32,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(15,23,42,0.18)",
        position: "relative",
      }}>
        {/* Subtle grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,1) 31px,rgba(255,255,255,1) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,1) 31px,rgba(255,255,255,1) 32px)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 40, alignItems: "center", position: "relative" }}>
          {/* Left: Text content */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Plant 1010 — Hyderabad Manufacturing
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 12 }}>
              Inventory Health
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, color: healthColor, lineHeight: 1, marginBottom: 10, letterSpacing: "-2px" }}>
              {health}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px",
              background: healthColor + "22",
              border: `1px solid ${healthColor}44`,
              borderRadius: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: healthColor, display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: healthColor }}>
                {healthLabel} — {kpis.criticalCount ?? 2} critical materials require immediate action
              </span>
            </div>

            {/* Health deduction pills */}
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {[
                { l: "Critical", v: kpis.criticalCount ?? 2, c: "#ef4444" },
                { l: "Low Stock", v: kpis.lowCount ?? 2, c: "#f59e0b" },
                { l: "Overstock", v: kpis.overstockCount ?? 3, c: "#8b5cf6" },
                { l: "Dead Stock", v: kpis.deadStockCount ?? 1, c: "#94a3b8" },
              ].map(x => (
                <div key={x.l} style={{ padding: "4px 10px", background: x.c + "22", border: `1px solid ${x.c}33`, borderRadius: 6, fontSize: 11, color: x.c, fontWeight: 600 }}>
                  {x.l}: {x.v}
                </div>
              ))}
            </div>
          </div>

          {/* Center: Gauge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <HeroGauge score={health} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Health Score</div>
          </div>

          {/* Right: Mini stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Opening Stock", value: fmt(opening), icon: "📂", note: "Aug 1, 2026" },
              { label: "Closing Stock", value: fmt(closing), icon: "📊", note: "Aug 10, 2026" },
              { label: "Net Movement", value: (movement >= 0 ? "+" : "") + fmt(Math.abs(movement)), icon: movement >= 0 ? "📈" : "📉", note: "this month", valueColor: movement >= 0 ? "#4ade80" : "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: (s as { valueColor?: string }).valueColor ?? "rgba(255,255,255,0.92)", letterSpacing: "-0.5px" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip — health breakdown bar */}
        <div style={{ marginTop: 28, marginLeft: -36, marginRight: -36, height: 6, display: "flex" }}>
          {HEALTH_DEDUCTIONS.map((d, i) => (
            <div key={i} style={{ flex: d.pct, background: d.color, opacity: 0.85 }} title={`${d.label}: -${d.pct}pts`} />
          ))}
          <div style={{ flex: 100 - HEALTH_DEDUCTIONS.reduce((a, b) => a + b.pct, 0), background: "#22c55e", opacity: 0.5 }} />
        </div>
      </div>

      {/* PRIORITY ACTIONS STRIP */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Today's Priority Actions" badge="3 urgent" badgeColor="#dc2626" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PRIORITY_ACTIONS.map((p, i) => (
            <div key={i} style={{
              background: p.bg,
              border: `1.5px solid ${p.border}`,
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.textColor, lineHeight: 1.4 }}>{p.text}</div>
              </div>
              <button style={{
                flexShrink: 0,
                padding: "6px 12px",
                background: p.actionColor,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
                {p.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KPI GRID */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Key Performance Indicators" badge="8 metrics" badgeColor="#0070f2" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <KPICard label="Materials Tracked" value={String(kpis.totalMaterials ?? 12)} sub="across 3 warehouses" color="#0070f2" icon="📦" />
          <KPICard label="Critical Stock" value={String(kpis.criticalCount ?? 2)} sub="immediate action needed" color="#dc2626" alert icon="🚨" />
          <KPICard label="AI Recommendations" value={String(kpis.aiRecommendations ?? 5)} sub="3 require action today" color="#7c3aed" icon="✨" />
          <KPICard label="Duplicate PO Exposure" value="₹38.6L" sub="2 POs can be blocked now" color="#d97706" alert icon="⚠️" />
          <KPICard label="Slow-Moving Items" value={String(kpis.slowMovingCount ?? 1)} sub="SP-0088 — 56 days no movement" color="#64748b" icon="🐢" />
          <KPICard label="Dead Stock" value="₹54,000" sub="SP-0145 V-Belt — since Mar 2026" color="#94a3b8" icon="💀" />
          <KPICard label="Waste / Scrap Alerts" value={String(kpis.wasteAlerts ?? 2)} sub="RM-1042 & RM-5520 excess" color="#f59e0b" alert icon="♻️" />
          <KPICard label="At-Risk Count" value={String((kpis.criticalCount ?? 2) + (kpis.lowCount ?? 2))} sub="critical + low combined" color="#ef4444" alert icon="⚡" />
        </div>
      </div>

      {/* ALERTS + DUPLICATE POS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Active Alerts */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1.5px solid #fecaca", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <SectionHeader title="Active Alerts" badge="4 alerts" badgeColor="#dc2626" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ALERTS.map((a, i) => {
              const sevColor = a.sev === "critical" ? "#ef4444" : a.sev === "high" ? "#f59e0b" : "#94a3b8";
              const sevBg = a.sev === "critical" ? "#fef2f2" : a.sev === "high" ? "#fffbeb" : "#f8fafc";
              return (
                <div key={i} style={{
                  padding: "12px 14px",
                  background: sevBg,
                  borderRadius: 10,
                  borderLeft: `3px solid ${sevColor}`,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{a.sev === "critical" ? "🚨" : a.sev === "high" ? "⚠️" : "ℹ️"}</span>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{a.mat}</span>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{a.desc}</span>
                      <span style={{ padding: "2px 7px", background: sevColor + "18", color: sevColor, borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.sev}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{a.msg}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duplicate POs */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1.5px solid #fde68a", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <SectionHeader title="Duplicate Purchase Orders" badge="₹38.6L at risk" badgeColor="#d97706" />

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, padding: "8px 12px", background: "#fef3c7", borderRadius: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>PO / Material</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vendor</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exposure</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DUP_POS.map((d, i) => (
              <div key={i} style={{ padding: "14px 16px", background: "#fffbeb", borderRadius: 10, borderLeft: "3px solid #f59e0b" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>PO {d.po}</span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{d.mat} · {d.vendor}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#dc2626", whiteSpace: "nowrap" }}>{d.value}</span>
                </div>
                <div style={{ fontSize: 11, color: "#92400e", background: "#fef3c7", borderRadius: 5, padding: "4px 8px", marginTop: 6 }}>
                  🤖 AI: {d.reason}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "14px 16px", background: "#fefce8", borderRadius: 10, border: "1.5px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#713f12", fontWeight: 700 }}>Total Savings Available</div>
              <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>Block these POs to free working capital</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", letterSpacing: "-0.5px" }}>₹38.6L</div>
              <button style={{ marginTop: 4, padding: "5px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Block Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", marginBottom: 32 }}>
        <SectionHeader title="Stock Value by Category & Warehouse" badge="3 locations" badgeColor="#0891b2" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {CAT_DATA.map(c => (
            <div key={c.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.sub}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>{fmt(c.value)}</div>
                  <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.pct}% utilized</div>
                </div>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 6, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${c.pct}%`, height: "100%",
                  background: `linear-gradient(90deg, ${c.color}, ${c.color}bb)`,
                  borderRadius: 6,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>0%</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Capacity 100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
