import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  UserCheck,
  Wrench,
  Users,
  ListChecks,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/listings", label: "Listings", icon: Home },
  { to: "/viewings", label: "Viewings", icon: CalendarDays },
  { to: "/agents", label: "Agents", icon: UserCheck },
  { to: "/vendors", label: "Vendors", icon: Wrench },
  { to: "/users", label: "Users", icon: Users },
  { to: "/waitlist", label: "Waitlist", icon: ListChecks },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-bg relative">
      <div className="bg-decor" />

      {/* ─── Desktop sidebar ─── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 glass-dark text-white",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="font-heading font-extrabold tracking-tight text-lg">
              Property<span className="text-[hsl(142,71%,55%)]">Loop</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-200",
                  collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                  isActive
                    ? "bg-[hsl(160,25%,20%)] text-white"
                    : "text-white/55 hover:text-white hover:bg-white/5",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive && "text-[hsl(142,71%,55%)]",
                    )}
                  />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div
            className={cn(
              "flex items-center gap-3 mb-3",
              collapsed && "justify-center mb-2",
            )}
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(142,71%,45%)]/20 flex items-center justify-center text-white text-sm font-bold border border-white/10">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-white/40 text-[11px] truncate">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm",
            )}
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] glass-dark text-white flex flex-col lg:hidden">
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
              <div className="font-heading font-extrabold tracking-tight text-lg">
                Property<span className="text-[hsl(142,71%,55%)]">Loop</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      isActive
                        ? "bg-[hsl(160,25%,20%)] text-white"
                        : "text-white/55 hover:text-white hover:bg-white/5",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0",
                          isActive && "text-[hsl(142,71%,55%)]",
                        )}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ─── Main ─── */}
      <div className="flex-1 min-w-0 relative z-10">
        <header className="sticky top-0 z-30 glass-strong border-b border-white/40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/60 border border-white/40 flex items-center justify-center text-primary-dark hover:bg-primary hover:text-white transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-heading font-bold text-primary-dark text-base">
                Admin Console
              </h1>
              <p className="text-text-subtle text-[11px]">Platform operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold border-2 border-white shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
