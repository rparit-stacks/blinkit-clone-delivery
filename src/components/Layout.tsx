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
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-orange-900/50">
            <Bike className="h-6 w-6 text-white" strokeWidth={2.25} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d1117] bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold tracking-tight text-white leading-tight">Nainital Store</p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-widest">Delivery Partner</p>
          </div>
        </div>
      </div>

      {/* Online toggle */}
      <div className="mx-4 mb-4">
        <button
          type="button"
          onClick={() => toggleMut.mutate()}
          disabled={toggleMut.isPending}
          className={clsx(
            "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98] border",
            isOnline
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 text-emerald-100"
              : "border-white/[0.07] bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200"
          )}
        >
          <span className="flex items-center gap-2.5">
            <span className={clsx(
              "h-2.5 w-2.5 rounded-full shadow",
              isOnline
                ? "animate-pulse bg-emerald-400 shadow-emerald-400/60"
                : "bg-slate-600"
            )} />
            <span>{isOnline ? "Online — receiving orders" : "Offline — tap to go online"}</span>
          </span>
          <Power className={clsx("h-4 w-4 shrink-0", isOnline ? "text-emerald-400" : "opacity-30")} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                  isActive ? "bg-white/20" : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                )}>
                  <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                <span className="flex-1 font-semibold">{label}</span>
                {label === "Alerts" && unread > 0 && (
                  <span className={clsx(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    isActive ? "bg-white text-orange-600" : "bg-red-500 text-white"
                  )}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Account status pill */}
      {(profile?.status ?? partner?.status) && (
        <div className="px-4 py-3">
          {(() => {
            const st = profile?.status ?? partner?.status ?? "";
            const isApproved = st === "APPROVED";
            const isPending = st === "PENDING";
            return (
              <div className={clsx(
                "flex items-center gap-2 rounded-xl border px-3 py-2",
                isApproved ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : isPending ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              )}>
                <span className={clsx(
                  "h-2 w-2 shrink-0 rounded-full",
                  isApproved ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    : isPending ? "bg-amber-400"
                    : "bg-red-400"
                )} />
                <span className="text-[11px] font-semibold tracking-wide">
                  {isApproved ? "Account active" : isPending ? "Pending approval" : "Account blocked"}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-white/[0.07] px-4 py-4">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-600 text-sm font-extrabold text-white shadow-lg shadow-orange-900/30 ring-2 ring-white/10">
            {partner?.name?.charAt(0).toUpperCase() ?? "D"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{partner?.name}</p>
            <p className="truncate text-[11px] text-slate-500 mt-0.5">{partner?.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-white/[0.05] hover:text-red-400"
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
      <aside className="relative hidden w-[264px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0d12] lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(251,146,60,0.10),transparent)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0a0d12] to-transparent" />
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
          <aside className="relative flex h-full w-[min(85vw,280px)] flex-col bg-[#0a0d12] shadow-2xl shadow-black/60">
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
        <header
          className="sticky top-0 z-30 shrink-0 border-b border-slate-100 bg-white lg:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3">
            {/* Menu button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-colors active:bg-slate-100"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-md shadow-orange-200">
                <Bike className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[14px] font-extrabold tracking-tight text-slate-900 leading-none">Nainital Store</p>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-none mt-0.5">Delivery</p>
              </div>
            </div>

            {/* Right: bell + online pill */}
            <div className="flex items-center gap-1.5">
              <NavLink
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors active:bg-slate-100"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none ring-1 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={() => toggleMut.mutate()}
                disabled={toggleMut.isPending}
                className={clsx(
                  "flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition-all active:scale-[0.96]",
                  isOnline
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                )}
              >
                <span className={clsx(
                  "h-2 w-2 rounded-full",
                  isOnline ? "animate-pulse bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" : "bg-slate-300"
                )} />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </button>
            </div>
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
