import {
  Cpu,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getAbsoluteApiBaseUrl } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/links", label: "My Links", icon: Link2 },
  { to: "/dashboard/architecture", label: "Architecture", icon: Cpu }
];

function SidebarLink({ item, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      end={item.end}
      to={item.to}
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-accent/10 text-accent shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]"
          : "text-secondary hover:bg-white/5 hover:text-ink"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-muted")} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function BottomNavLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      end={item.end}
      to={item.to}
      className={({ isActive }) => cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all",
        isActive
          ? "bg-accent/10 text-accent"
          : "text-secondary hover:text-ink"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function ServiceStatusPill({ statusLabel, statusTone, statusDot, animated }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase", statusTone)}>
      <span className="relative flex h-2 w-2">
        {animated ? <span className="absolute inset-0 rounded-full bg-current opacity-40 animate-ping" /> : null}
        <span className={cn("relative h-2 w-2 rounded-full", statusDot)} />
      </span>
      {statusLabel}
    </div>
  );
}

function DashboardContentFallback() {
  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <Skeleton className="h-32 rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [serviceHealthy, setServiceHealthy] = useState(true);
  
  const initials = useMemo(() => {
    const source = user?.name || user?.email || "PK";
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("");
  }, [user?.email, user?.name]);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => {
      setNetworkOnline(false);
      setServiceHealthy(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!networkOnline) return;

    let active = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(new URL("health", getAbsoluteApiBaseUrl()).toString(), {
          method: "GET",
          cache: "no-store"
        });
        if (active) setServiceHealthy(response.ok);
      } catch (_error) {
        if (active) setServiceHealthy(false);
      }
    };

    void checkHealth();
    const intervalId = window.setInterval(checkHealth, 30000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, [networkOnline]);

  const statusLabel = !networkOnline ? "Offline" : serviceHealthy ? "Healthy" : "Down";
  const statusTone = !networkOnline
    ? "border-warning/20 bg-warning/5 text-warning"
    : serviceHealthy
      ? "border-accent/20 bg-accent/5 text-accent"
      : "border-danger/20 bg-danger/5 text-danger";
  const statusDot = !networkOnline ? "bg-warning" : serviceHealthy ? "bg-accent" : "bg-danger";

  return (
    <div className="min-h-screen bg-base text-ink selection:bg-accent/20 selection:text-accent">
      {/* Header */}
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-white/[0.05]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark className="h-8" />

          <div className="hidden items-center gap-6 lg:flex">
            <ServiceStatusPill
              statusLabel={statusLabel}
              statusTone={statusTone}
              statusDot={statusDot}
              animated={serviceHealthy && networkOnline}
            />
            <div className="h-8 w-[1px] bg-white/[0.05]" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-ink">{user?.name || "Member"}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-accent/20">
                {initials || "PK"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-secondary transition hover:bg-white/10 hover:text-ink lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="animate-sheet-in absolute inset-x-0 top-16 glass border-b border-white/[0.05] p-6">
            <div className="space-y-1">
              {navItems.map((item) => <SidebarLink key={item.to} item={item} onClick={() => setMenuOpen(false)} />)}
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <Button type="button" variant="ghost" className="w-full justify-start rounded-xl hover:bg-danger/10 hover:text-danger" icon={LogOut} onClick={logout}>
                Log out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Layout */}
      <div className="mx-auto flex max-w-[1400px] px-4 pt-16 sm:px-6">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 flex-col py-10 lg:flex">
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => <SidebarLink key={item.to} item={item} />)}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/[0.05]">
             <Button 
               type="button" 
               variant="ghost" 
               className="w-full justify-start rounded-xl text-muted hover:bg-danger/10 hover:text-danger transition-colors" 
               icon={LogOut} 
               onClick={logout}
             >
              Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 pt-10 lg:pl-12">
          <div className="animate-page-in">
            <Suspense fallback={<DashboardContentFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed inset-x-4 bottom-4 z-40 glass rounded-2xl border border-white/[0.05] p-1.5 shadow-2xl lg:hidden">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => <BottomNavLink key={item.to} item={item} />)}
        </div>
      </nav>
    </div>
  );
}
