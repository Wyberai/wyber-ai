"use client";

import { useState } from "react";
import { DEMO_ALERTS, DEMO_ALERT_CONFIGS, type EmailAlert, type AlertConfig } from "@/lib/inventory-data";

const TYPE_ICONS: Record<string, string> = {
  critical_stock: "🚨", low_stock: "⚠️", duplicate_po: "📋",
  overstock: "📦", slow_moving: "🐢", dead_stock: "💀", monthly_summary: "📊",
};

const TYPE_COLORS: Record<string, string> = {
  critical_stock: "#ef4444", low_stock: "#f59e0b", duplicate_po: "#d97706",
  overstock: "#8b5cf6", slow_moving: "#64748b", dead_stock: "#94a3b8", monthly_summary: "#0070f2",
};

function AlertHistoryCard({ alert }: { alert: EmailAlert }) {
  const [expanded, setExpanded] = useState(false);
  const color = TYPE_COLORS[alert.type] ?? "#64748b";
  const ago = (() => {
    const diff = new Date("2026-08-10T09:00:00Z").getTime() - new Date(alert.triggeredAt).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  })();
  return (
    <div style={{ border: "1.5px solid #e2e8f0", borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, background: "#fff", cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{TYPE_ICONS[alert.type]}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{alert.subject}</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            To: {alert.recipients.join(", ")} · {ago}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ padding: "3px 8px", borderRadius: 5, background: alert.status === "sent" ? "#dcfce7" : "#fee2e2", color: alert.status === "sent" ? "#16a34a" : "#dc2626", fontSize: 11, fontWeight: 600 }}>
            {alert.status === "sent" ? "✓ Sent" : "✗ Failed"}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
          {alert.details}
        </div>
      )}
    </div>
  );
}

function ConfigRow({ cfg, onToggle }: { cfg: AlertConfig; onToggle: () => void }) {
  const color = TYPE_COLORS[cfg.type] ?? "#64748b";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 180px 120px 1fr 80px", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 16 }}>{TYPE_ICONS[cfg.type]}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{cfg.label}</div>
        {cfg.threshold && (
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Trigger: &lt; {cfg.threshold} {cfg.thresholdUnit}</div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#475569" }}>{cfg.frequency}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{cfg.recipients.length} recipients</div>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>{cfg.recipients.join(", ").slice(0, 40)}…</div>
      <button onClick={onToggle} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: cfg.enabled ? "#dcfce7" : "#f1f5f9", color: cfg.enabled ? "#16a34a" : "#94a3b8", fontWeight: 600, fontSize: 12 }}>
        {cfg.enabled ? "Active" : "Paused"}
      </button>
    </div>
  );
}

export default function AlertsPage() {
  const [configs, setConfigs] = useState<AlertConfig[]>(DEMO_ALERT_CONFIGS);
  const [testSent, setTestSent] = useState<string | null>(null);
  const [tab, setTab] = useState<"config" | "history">("config");

  const toggle = (i: number) => {
    setConfigs(prev => prev.map((c, j) => j === i ? { ...c, enabled: !c.enabled } : c));
  };

  const sendTest = (type: string) => {
    setTestSent(type);
    setTimeout(() => setTestSent(null), 3000);
  };

  const sentCount = DEMO_ALERTS.filter(a => a.status === "sent").length;
  const critCount = DEMO_ALERTS.filter(a => a.type === "critical_stock").length;
  const dupCount = DEMO_ALERTS.filter(a => a.type === "duplicate_po").length;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Email Alert System</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Automated email notifications for inventory events · 7 alert types configured</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { l: "Alerts Sent (Aug)", v: String(sentCount), c: "#22c55e" },
          { l: "Critical Stock Alerts", v: String(critCount), c: "#ef4444" },
          { l: "Duplicate PO Alerts", v: String(dupCount), c: "#d97706" },
          { l: "Active Alert Types", v: String(configs.filter(c => c.enabled).length) + "/7", c: "#0070f2" },
        ].map(x => (
          <div key={x.l} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{x.l}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["config", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid", borderColor: tab === t ? "#0070f2" : "#e2e8f0", background: tab === t ? "#0070f2" : "#fff", color: tab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
            {t === "config" ? "⚙️ Alert Configuration" : "📬 Alert History"}
          </button>
        ))}
      </div>

      {tab === "config" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Alert Configuration</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Configure thresholds, recipients, and frequency for each alert type</div>
            </div>
            <button style={{ padding: "8px 16px", background: "#0070f2", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add Recipient
            </button>
          </div>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 180px 120px 1fr 80px", gap: 12, padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 11, color: "#64748b", fontWeight: 700 }}>
            <span />
            <span>Alert Type</span><span>Frequency</span><span>Recipients</span><span>Email Addresses</span><span>Status</span>
          </div>
          {configs.map((cfg, i) => (
            <div key={cfg.type}>
              <ConfigRow cfg={cfg} onToggle={() => toggle(i)} />
              <div style={{ padding: "6px 16px 10px 60px", borderBottom: "1px solid #f8fafc", display: "flex", gap: 8 }}>
                <button onClick={() => sendTest(cfg.type)} style={{ padding: "4px 12px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#475569", fontWeight: 500 }}>
                  {testSent === cfg.type ? "✓ Test sent!" : "Send Test Email"}
                </button>
                <button style={{ padding: "4px 12px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#475569" }}>Edit Recipients</button>
                {cfg.threshold && <button style={{ padding: "4px 12px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#475569" }}>Edit Threshold</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Recent Alert History (Aug 2026)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <select style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
                  <option>All types</option>
                  <option>Critical Stock</option>
                  <option>Duplicate PO</option>
                  <option>Overstock</option>
                </select>
                <button style={{ padding: "6px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#475569" }}>Export Log</button>
              </div>
            </div>
          </div>
          {DEMO_ALERTS.map(a => <AlertHistoryCard key={a.id} alert={a} />)}
          <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", marginTop: 12, border: "1px solid #bfdbfe" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1d4ed8", marginBottom: 4 }}>📊 Monthly Summary — scheduled for Sep 1, 2026 at 8:00 AM</div>
            <div style={{ fontSize: 12, color: "#1e40af" }}>Will include: Total value by category, Opening vs Closing stock, Top consumed materials, PO efficiency metrics, Slow-moving stock report</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Recipients: gm@company.com, store.manager@company.com, finance@company.com</div>
          </div>
        </div>
      )}
    </div>
  );
}
