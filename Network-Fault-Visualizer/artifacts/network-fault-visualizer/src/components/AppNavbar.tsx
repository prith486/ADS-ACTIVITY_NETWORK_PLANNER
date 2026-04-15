import { Link, useLocation } from "wouter";
import { Activity, Binary, Compass, FileText, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
  { href: "/about", label: "About", icon: FileText },
  { href: "/flowchart", label: "Flowchart", icon: LayoutGrid },
  { href: "/algorithm", label: "Algorithm", icon: Binary },
  { href: "/design", label: "Design", icon: Compass },
  { href: "/simulator", label: "Simulator", icon: Activity },
];

export default function AppNavbar() {
  const [location] = useLocation();

  const isActive = (href: string): boolean => {
    if (href === "/about") {
      return location === "/" || location === "/about";
    }
    return location === href;
  };

  return (
    <header
      style={{
        height: 66,
        borderBottom: "1px solid rgba(0, 212, 255, 0.25)",
        background:
          "linear-gradient(180deg, rgba(8, 14, 28, 0.96) 0%, rgba(4, 8, 18, 0.96) 100%)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#00d4ff",
            boxShadow: "0 0 16px #00d4ff",
          }}
        />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.4 }}>Network Fault Planner</div>
          <div style={{ fontSize: 11, opacity: 0.55 }}>ADS FA-2 Interactive Report</div>
        </div>
      </div>

      <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}>
              <button
                type="button"
                style={{
                  border: active
                    ? "1px solid rgba(0, 212, 255, 0.75)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  background: active
                    ? "linear-gradient(135deg, rgba(0, 212, 255, 0.22), rgba(0, 212, 255, 0.08))"
                    : "rgba(255, 255, 255, 0.04)",
                  color: active ? "#dbf8ff" : "rgba(255, 255, 255, 0.8)",
                  borderRadius: 999,
                  height: 36,
                  padding: "0 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
