import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleOnline, fetchProfile } from "../api/deliveryApi";
import {
  LayoutDashboard, Package, Wallet, User, LogOut,
  Menu, X, ChevronRight, Bike, Power
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/assignments", icon: Package, label: "Orders" },
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
    initialData: partner as any,
  });

  const toggleMut = useMutation({
    mutationFn: toggleOnline,
    onSuccess: (data) => {
      updatePartnerInfo({ online: data.online });
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
      toast.success(data.online ? "You are now Online" : "You are now Offline");
    },
  });

  const isOnline = profile?.online ?? partner?.online ?? false;

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {partner?.name ?? "Delivery Partner"}
            </p>
            <p className="text-white/40 text-[10px]">Delivery Dashboard</p>
          </div>
        </div>
      </div>

      {/* Online toggle */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => toggleMut.mutate()}
          disabled={toggleMut.isPending}
          className={clsx(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
            isOnline
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={clsx("w-2 h-2 rounded-full", isOnline ? "bg-green-400 animate-pulse" : "bg-white/30")} />
            {isOnline ? "Online" : "Offline"}
          </div>
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status badge */}
      {partner?.status && (
        <div className="px-4 pb-2">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
            partner.status === "APPROVED" ? "bg-green-500/20 text-green-300" :
            partner.status === "PENDING" ? "bg-yellow-500/20 text-yellow-300" :
            "bg-red-500/20 text-red-300"
          )}>
            <div className={clsx("w-2 h-2 rounded-full", partner.status === "APPROVED" ? "bg-green-400" : partner.status === "PENDING" ? "bg-yellow-400" : "bg-red-400")} />
            {partner.status === "APPROVED" ? "Active" : partner.status === "PENDING" ? "Pending Approval" : "Blocked"}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center shrink-0">
            <span className="text-orange-400 font-bold text-xs">
              {partner?.name?.charAt(0).toUpperCase() ?? "D"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{partner?.name}</p>
            <p className="text-white/40 text-[10px] truncate">{partner?.phone}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-slate-900 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Delivery</span>
          </div>
          {/* Online toggle on mobile header */}
          <button
            onClick={() => toggleMut.mutate()}
            disabled={toggleMut.isPending}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            )}
          >
            <div className={clsx("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
            {isOnline ? "Online" : "Offline"}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center bg-white border-t border-slate-200 z-40">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-orange-500" : "text-slate-400"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
