import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleOnline, fetchProfile } from "../api/deliveryApi";
import {
  LayoutDashboard,
  Package,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Bike,
  Power,
  Bell,
  ChevronRight,
} from "lucide-react";
import { fetchNotifications, getUnreadCount } from "../lib/notificationsApi";
import clsx from "clsx";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/assignments", icon: Package, label: "Orders" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const { partner, logout, updatePartnerInfo } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["delivery", "profile"],
    queryFn: fetchProfile,
    initialData: partner as never,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: notifItems = [] } = useQuery({
    queryKey: ["delivery", "notifications"],
    queryFn: () => fetchNotifications(),
    staleTime: 60_000,
    refetchInterval: 90_000,
  });
  const unread = getUnreadCount(notifItems);

  const toggleMut = useMutation({
    mutationFn: toggleOnline,
    onSuccess: (data) => {
      updatePartnerInfo({ online: data.online });
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
      toast.success(data.online ? "You are now online" : "You are now offline");
    },
  });

  const isOnline = profile?.online ?? partner?.online ?? false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand header */}
      <div className="px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/40">
            <Bike className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-tight">Nainitore</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Delivery Partner</p>
          </div>
        </div>
      </div>

      {/* Online toggle */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => toggleMut.mutate()}
          disabled={toggleMut.isPending}
          className={clsx(
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98]",
            isOnline
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100 shadow-inner"
              : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/8 hover:text-slate-200"
          )}
        >
          <span className="flex items-center gap-2.5">
            <span className={clsx(
              "h-2 w-2 rounded-full",
              isOnline ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" : "bg-slate-600"
            )} />
            {isOnline ? "Receiving orders" : "Tap to go online"}
          </span>
          <Power className="h-4 w-4 opacity-60" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-slate-900 shadow-md shadow-black/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                <span className="flex-1">{label}</span>
                {label === "Alerts" && unread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-40" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Account status */}
      {(profile?.status ?? partner?.status) && (
        <div className="px-4 pb-2">
          {(() => {
            const st = profile?.status ?? partner?.status ?? "";
            const isApproved = st === "APPROVED";
            const isPending = st === "PENDING";
            return (
              <div className={clsx(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider",
                isApproved ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : isPending ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                  : "border-red-500/25 bg-red-500/10 text-red-300"
              )}>
                <span className={clsx(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  isApproved ? "bg-emerald-400" : isPending ? "bg-amber-400" : "bg-red-400"
                )} />
                {isApproved ? "Account active" : isPending ? "Pending approval" : "Blocked"}
              </div>
            );
          })()}
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-white/8 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-md">
            {partner?.name?.charAt(0).toUpperCase() ?? "D"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{partner?.name}</p>
            <p className="truncate text-[11px] text-slate-500">{partner?.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-slate-100 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="relative hidden w-[260px] shrink-0 flex-col border-r border-slate-800/60 bg-[#0d1117] lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(251,191,36,0.08),transparent)]" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[min(85vw,280px)] flex-col bg-[#0d1117] shadow-2xl shadow-black/50">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-xl lg:hidden"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          {/* Brand center */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-sm">
              <Bike className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">Delivery</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </NavLink>
            <button
              type="button"
              onClick={() => toggleMut.mutate()}
              disabled={toggleMut.isPending}
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all",
                isOnline
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              <span className="flex items-center gap-1">
                <span className={clsx("h-1.5 w-1.5 rounded-full", isOnline ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
                {isOnline ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex min-h-0 flex-1 flex-col lg:rounded-tl-3xl lg:border-l lg:border-t lg:border-slate-200/60 lg:bg-slate-50">
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-10">
            <div className="mx-auto w-full max-w-lg xl:max-w-2xl">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Bottom nav bar — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-slate-200/80 bg-white/97 backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors relative",
                  isActive ? "text-orange-600" : "text-slate-400"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-orange-500" />
                  )}
                  <span className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    isActive ? "bg-orange-50" : ""
                  )}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 1.75} />
                    {label === "Alerts" && unread > 0 && (
                      <span className="absolute top-2 ml-2 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] font-semibold tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
