"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const NAV = [
  { href: "/app/inventory",                 label: "Overview",           icon: "▣",  roles: ["admin","plant_manager","procurement","store_manager"] },
  { href: "/app/inventory/stock",           label: "Inventory Monitor",  icon: "📦", roles: ["admin","plant_manager","procurement","store_manager"] },
  { href: "/app/inventory/consumption",     label: "Consumption",        icon: "📈", roles: ["admin","plant_manager"] },
  { href: "/app/inventory/purchases",       label: "Purchase Orders",    icon: "📋", roles: ["admin","procurement"] },
  { href: "/app/inventory/forecasting",     label: "Forecasting",        icon: "🔮", roles: ["admin","plant_manager"] },
  { href: "/app/inventory/warehouse",       label: "Warehouse View",     icon: "🏭", roles: ["admin","plant_manager","store_manager"] },
  { href: "/app/inventory/alerts",          label: "Email Alerts",       icon: "🔔", roles: ["admin","procurement","store_manager"] },
  { href: "/app/inventory/recommendations", label: "AI Recommendations", icon: "✨", roles: ["admin","procurement"] },
  { href: "/app/inventory/assistant",       label: "AI Assistant",       icon: "💬", roles: ["admin","plant_manager"] },
  { href: "/app/inventory/reports",         label: "Reports",            icon: "📊", roles: ["admin","plant_manager","procurement","store_manager"] },
  { href: "/app/inventory/audit",           label: "Audit Logs",         icon: "🗒️", roles: ["admin"] },
];

const VALID_TOKENS = ["guru2026", "rohit2026"];

type RoleKey = "admin" | "plant_manager" | "procurement" | "store_manager";

const ROLE_META: Record<RoleKey, { label: string; color: string; name: string; icon: string; title: string }> = {
  admin:         { label: "General Manager",     color: "#7c3aed", name: "G. Prasad",    icon: "👤", title: "Admin" },
  plant_manager: { label: "Plant Manager",        color: "#0070f2", name: "R. Venkatesh", icon: "🏭", title: "Plant Manager" },
  procurement:   { label: "Procurement Officer",  color: "#d97706", name: "S. Mehta",     icon: "📋", title: "Procurement Officer" },
  store_manager: { label: "Store Manager",        color: "#16a34a", name: "K. Reddy",     icon: "🗄️", title: "Store Manager" },
};

const ROLE_CARDS: { key: RoleKey; desc: string }[] = [
  { key: "admin",         desc: "Full access to all modules" },
  { key: "plant_manager", desc: "Operations & production view" },
  { key: "procurement",   desc: "Purchasing & supplier access" },
  { key: "store_manager", desc: "Warehouse & stock tracking" },
];

function getInitials(name: string) {
  return name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
}

function InventoryLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [inputToken, setInputToken] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleKey>("admin");
  const [role, setRole] = useState<RoleKey>("admin");
  const [userName, setUserName] = useState("G. Prasad");

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const urlToken = searchParams.get("access");
    if (urlToken && VALID_TOKENS.includes(urlToken)) {
      sessionStorage.setItem("inv_demo_ok", "1");
      const storedRole = (sessionStorage.getItem("inv_role") as RoleKey) || "admin";
      const storedUser = sessionStorage.getItem("inv_user") || ROLE_META[storedRole].name;
      setRole(storedRole);
      setUserName(storedUser);
      setAuthorized(true);
      return;
    }
    if (sessionStorage.getItem("inv_demo_ok") === "1") {
      const storedRole = (sessionStorage.getItem("inv_role") as RoleKey) || "admin";
      const storedUser = sessionStorage.getItem("inv_user") || ROLE_META[storedRole].name;
      setRole(storedRole);
      setUserName(storedUser);
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [searchParams]);

  const handleAuth = () => {
    if (VALID_TOKENS.includes(inputToken)) {
      sessionStorage.setItem("inv_demo_ok", "1");
      sessionStorage.setItem("inv_role", selectedRole);
      sessionStorage.setItem("inv_user", ROLE_META[selectedRole].name);
      setRole(selectedRole);
      setUserName(ROLE_META[selectedRole].name);
      setAuthorized(true);
    } else {
      setError("Invalid access code. Please contact WyberAI.");
    }
  };

  if (authorized === null) return null;

  /* ── Lock screen ── */
  if (!authorized) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        padding: isMobile ? "16px" : "24px 16px",
      }}>
        <div style={{ maxWidth: isMobile ? "95%" : 680, width: "100%" }}>

          {/* Branding */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg,#0070f2,#00a4e0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, margin: "0 auto 14px",
            }}>🔒</div>
            <div style={{ fontWeight: 800, fontSize: 26, color: "#fff", letterSpacing: "-0.5px" }}>IntelliStock</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 5 }}>
              AI Inventory Intelligence — Confidential Demo
            </div>
          </div>

          {/* Form card */}
          <div style={{
            background: "#fff", borderRadius: 18,
            padding: isMobile ? "24px 24px 20px" : "36px 36px 28px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
          }}>

            {/* Access code */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Access Code
              </div>
              <input
                type="password"
                value={inputToken}
                onChange={e => { setInputToken(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
                placeholder="Enter your demo access code"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: error ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                  borderRadius: 9, fontSize: 14, outline: "none",
                  boxSizing: "border-box", color: "#0f172a",
                  transition: "border-color 0.15s",
                }}
              />
              {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
            </div>

            {/* Role selector — 2 cols on mobile, 2 cols on desktop */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Select Your Role
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
                gap: isMobile ? 8 : 10,
              }}>
                {ROLE_CARDS.map(({ key, desc }) => {
                  const meta = ROLE_META[key];
                  const isSelected = selectedRole === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedRole(key)}
                      style={{
                        padding: isMobile ? "10px 10px 8px" : "14px 14px 12px",
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${meta.color}` : "2px solid #e2e8f0",
                        cursor: "pointer",
                        background: isSelected ? `${meta.color}08` : "#fafafa",
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 18, height: 18, borderRadius: "50%",
                          background: meta.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 10, fontWeight: 700,
                        }}>✓</div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: isMobile ? 15 : 18 }}>{meta.icon}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px",
                          borderRadius: 5, background: `${meta.color}18`,
                          color: meta.color,
                        }}>{meta.title}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: "#1e293b", marginBottom: 2 }}>{meta.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.3 }}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleAuth}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg,#0070f2,#0050d0)",
                color: "#fff", border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Access Dashboard
            </button>

            <div style={{ textAlign: "center", marginTop: 18, color: "#94a3b8", fontSize: 11 }}>
              Prepared by WyberAI · Confidential · Do not distribute
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Authorized shell ── */
  const roleMeta = ROLE_META[role] ?? ROLE_META.admin;
  const visibleNav = NAV.filter(item => item.roles.includes(role));

  /* ── Sidebar content (shared between desktop sticky and mobile drawer) ── */
  const sidebarContent = (inDrawer: boolean) => (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg,#0070f2,#00a4e0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#fff",
          }}>I</div>
          {(inDrawer || sidebarOpen) && (
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>IntelliStock</div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>AI Inventory Intelligence</div>
            </div>
          )}
          {/* Close button inside mobile drawer */}
          {inDrawer && (
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#94a3b8", fontSize: 20, lineHeight: 1,
                padding: "4px", minWidth: 32, minHeight: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Close menu"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Demo mode badge */}
      {(inDrawer || sidebarOpen) && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(255,165,0,0.12)", borderRadius: 6, border: "1px solid rgba(255,165,0,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
            <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 500 }}>Demo Mode</span>
          </div>
          <div style={{ color: "#475569", fontSize: 10, marginTop: 6, padding: "0 2px" }}>Set SAP_BASE_URL to connect live SAP</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: "8px 8px", flex: 1, overflowY: "auto" }}>
        {visibleNav.map(item => {
          const active = item.href === "/app/inventory" ? pathname === item.href : pathname.startsWith(item.href);
          const showLabel = inDrawer || sidebarOpen;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => inDrawer && setDrawerOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: showLabel ? "9px 10px" : "9px 14px",
                borderRadius: 8, marginBottom: 2, textDecoration: "none",
                background: active ? "rgba(0,112,242,0.18)" : "transparent",
                borderLeft: active ? "3px solid #0070f2" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0, width: 22, textAlign: "center" }}>{item.icon}</span>
              {showLabel && (
                <span style={{ color: active ? "#60a5fa" : "#94a3b8", fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info strip */}
      {(inDrawer || sidebarOpen) && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: roleMeta.color, flexShrink: 0 }} />
            <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </span>
          </div>
          <div style={{ marginTop: 5, marginLeft: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
              background: `${roleMeta.color}22`, color: roleMeta.color, whiteSpace: "nowrap",
            }}>{roleMeta.label}</span>
          </div>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      {!inDrawer && (
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              width: "100%", padding: "8px", borderRadius: 8,
              border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.06)", color: "#64748b",
              fontSize: 16, display: "flex", alignItems: "center",
              justifyContent: sidebarOpen ? "flex-end" : "center",
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      )}
    </>
  );

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", background: "#f0f2f5" }}>

        {/* Sticky mobile header */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "0 12px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40, flexShrink: 0,
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "#374151", fontSize: 20, lineHeight: 1,
              minWidth: 32, minHeight: 32, padding: "4px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Plant label — abbreviated */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", flex: 1, textAlign: "center", padding: "0 8px" }}>
            Plant 1010
          </div>

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: roleMeta.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(userName)}
          </div>
        </header>

        {/* Dark backdrop */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 99,
            }}
          />
        )}

        {/* Mobile drawer */}
        <aside style={{
          position: "fixed",
          left: drawerOpen ? 0 : -280,
          width: 280,
          top: 0,
          height: "100vh",
          zIndex: 100,
          transition: "left 0.25s ease",
          background: "linear-gradient(180deg,#1a2332 0%,#0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          {sidebarContent(true)}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    );
  }

  /* ── Desktop layout ── */
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", background: "#f0f2f5" }}>

      {/* Desktop sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        background: "linear-gradient(180deg,#1a2332 0%,#0f172a 100%)",
        display: "flex", flexDirection: "column", transition: "width 0.2s ease",
        flexShrink: 0, position: "sticky", top: 0, height: "100vh",
        overflowY: "auto", overflowX: "hidden", zIndex: 50,
      }}>
        {sidebarContent(false)}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "0 24px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>Plant:</span>
            <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 13 }}>1010 — Hyderabad Manufacturing</span>
            <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 600 }}>DEMO DATA</span>
            <span style={{ padding: "2px 8px", borderRadius: 4, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 600 }}>CONFIDENTIAL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Last sync: 10 Aug 2026, 06:30 IST</span>
            {/* Role-coloured avatar + name/role */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: roleMeta.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(userName)}
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{roleMeta.label}</div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <InventoryLayoutInner>{children}</InventoryLayoutInner>
    </Suspense>
  );
}
