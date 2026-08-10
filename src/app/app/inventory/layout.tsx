"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/app/inventory",              label: "Overview",          icon: "⬛" },
  { href: "/app/inventory/stock",        label: "Inventory Monitor", icon: "📦" },
  { href: "/app/inventory/consumption",  label: "Consumption",       icon: "📈" },
  { href: "/app/inventory/purchases",    label: "Purchase Orders",   icon: "📋" },
  { href: "/app/inventory/recommendations", label: "AI Recommendations", icon: "✨" },
  { href: "/app/inventory/assistant",    label: "AI Assistant",      icon: "💬" },
  { href: "/app/inventory/reports",      label: "Reports",           icon: "📊" },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: "#f0f2f5" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        background: "linear-gradient(180deg, #1a2332 0%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 50,
      }}>
        {/* Logo area */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #0070f2, #00a4e0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff",
            }}>
              I
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>IntelliStock</div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>AI Inventory Intelligence</div>
              </div>
            )}
          </div>
        </div>

        {/* Connection status */}
        {sidebarOpen && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(255,165,0,0.12)", borderRadius: 6, border: "1px solid rgba(255,165,0,0.2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
              <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 500 }}>Demo Mode</span>
            </div>
            <div style={{ color: "#475569", fontSize: 10, marginTop: 6, padding: "0 2px" }}>
              Set SAP_BASE_URL to connect live
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ padding: "8px 8px", flex: 1 }}>
          {NAV.map(item => {
            const active = item.href === "/app/inventory"
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: sidebarOpen ? "9px 10px" : "9px 14px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                background: active ? "rgba(0,112,242,0.18)" : "transparent",
                borderLeft: active ? "3px solid #0070f2" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 17, flexShrink: 0, width: 22, textAlign: "center" }}>{item.icon}</span>
                {sidebarOpen && (
                  <span style={{
                    color: active ? "#60a5fa" : "#94a3b8",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              width: "100%", padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.06)", color: "#64748b", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-end" : "center",
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>Plant:</span>
            <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 13 }}>1010 — Hyderabad Manufacturing</span>
            <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 600 }}>DEMO DATA</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Last sync: 10 Aug 2026, 06:30 IST</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0070f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600 }}>
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
