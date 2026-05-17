import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleOnline, fetchProfile } from "../api/deliveryApi";
import {
  Home,
  Package,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Bike,
  Bell,
  ChevronRight,
} from "lucide-react";
import { fetchNotifications, getUnreadCount } from "../lib/notificationsApi";
import clsx from "clsx";
import { toast } from "sonner";

const TABS = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/assignments", icon: Package, label: "Orders" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/profile", icon: User, label: "Me" },
] as const;

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/assignments": { title: "Orders", subtitle: "Active & history" },
  "/wallet": { title: "Wallet", subtitle: "Earnings & payouts" },
  "/notifications": { title: "Alerts", subtitle: "Updates & messages" },
};

function matchRoute(pathname: string) {
  if (pathname.startsWith("/assignments/")) return "stack";
  if (pathname === "/dashboard" || pathname === "/profile") return "immersive";
  if (PAGE_TITLES[pathname]) return "standard";
  return "standard";
}

export default function Layout() {
  const { partner, logout, updatePartnerInfo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const routeKind = matchRoute(location.pathname);
  const isStack = routeKind === "stack";
  const isImmersive = routeKind === "immersive";
  const pageMeta = PAGE_TITLES[location.pathname];

  const openDrawer = useCallback(() => {
    setShowDrawer(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerOpen(true)));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    window.setTimeout(() => setShowDrawer(false), 320);
  }, []);

  useEffect(() => {
    if (!showDrawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDrawer]);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

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
      toast.success(data.online ? "You're online" : "You're offline");
    },
  });

  const isOnline = profile?.online ?? partner?.online ?? false;
  const status = profile?.status ?? partner?.status ?? "";

  const handleLogout = () => {
    closeDrawer();
    logout();
    navigate("/login");
  };

  const OnlineSwitch = ({ large }: { large?: boolean }) => (
    <button
      type="button"
      role="switch"
      aria-checked={isOnline}
      disabled={toggleMut.isPending}
      onClick={() => toggleMut.mutate()}
      className={clsx(
        "online-switch",
        isOnline ? "online-switch--on" : "online-switch--off",
        large && "online-switch--lg"
      )}
    >
      <span className="online-switch__thumb" />
    </button>
  );

  return (
    <div className="min-h-dvh bg-[#0a0a0c] lg:flex lg:items-start lg:justify-center lg:py-4">
      <div className="app-frame">
        {!isStack && !isImmersive && pageMeta && (
          <header className="app-topbar">
            <div className="app-topbar__inner">
              <button type="button" className="app-icon-btn" onClick={openDrawer} aria-label="Menu">
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>
              <div className="min-w-0 flex-1 px-1">
                <h1 className="truncate text-[17px] font-bold tracking-tight text-[#1c1c1e]">
                  {pageMeta.title}
                </h1>
                {pageMeta.subtitle && (
                  <p className="truncate text-[11px] text-[#8e8e93] leading-tight">{pageMeta.subtitle}</p>
                )}
              </div>
              <NavLink to="/notifications" className="app-icon-btn relative" aria-label="Notifications">
                <Bell className="h-[19px] w-[19px]" strokeWidth={1.75} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>
              <OnlineSwitch />
            </div>
          </header>
        )}

        {!isStack && isImmersive && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Menu"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md active:scale-95"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <div className="pointer-events-auto flex items-center gap-2">
              <NavLink
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md active:scale-95"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-0.5 text-[9px] font-bold text-white ring-2 ring-black/20">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </NavLink>
              <button
                type="button"
                onClick={() => toggleMut.mutate()}
                disabled={toggleMut.isPending}
                className={clsx(
                  "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold backdrop-blur-md active:scale-95",
                  isOnline ? "bg-emerald-500/90 text-white" : "bg-black/25 text-white/90"
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    isOnline ? "animate-pulse bg-white" : "bg-white/50"
                  )}
                />
                {isOnline ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}

        <main
          className={clsx(
            "app-main",
            isImmersive && "app-main--immersive",
            isStack && "app-main--stack",
            !isStack && !isImmersive && "app-main--tabs"
          )}
        >
          <Outlet />
        </main>

        {!isStack && (
          <nav className="app-tabbar" aria-label="Main navigation">
            <div className="app-tabbar__row">
              {TABS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/dashboard"}
                  className={({ isActive }) => clsx("app-tab", isActive && "app-tab--active")}
                >
                  {({ isActive }) => (
                    <>
                      <span className="app-tab__icon-wrap">
                        <Icon
                          className="h-[22px] w-[22px]"
                          strokeWidth={isActive ? 2.25 : 1.75}
                          fill={isActive ? "currentColor" : "none"}
                          fillOpacity={isActive ? 0.12 : 0}
                        />
                      </span>
                      <span className="app-tab__label">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        {showDrawer && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className={clsx("drawer-backdrop", drawerOpen && "drawer-backdrop--open")}
              onClick={closeDrawer}
            />
            <aside
              className={clsx("drawer-panel", drawerOpen && "drawer-panel--open")}
              aria-modal
              role="dialog"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div
                  className="flex items-center justify-between px-4 pb-4"
                  style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/40">
                      <Bike className="h-5 w-5 text-white" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-white">Nainital Store</p>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                        Delivery Partner
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 active:bg-white/15"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mx-4 mb-4 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-base font-bold text-white">
                      {partner?.name?.charAt(0).toUpperCase() ?? "D"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{partner?.name}</p>
                      <p className="truncate text-xs text-white/45">{partner?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/[0.08]">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isOnline ? "You're online" : "Go online"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {isOnline ? "Receiving delivery requests" : "Tap to start earning"}
                    </p>
                  </div>
                  <OnlineSwitch large />
                </div>

                <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
                  {[
                    { to: "/dashboard", label: "Home" },
                    { to: "/assignments", label: "Orders" },
                    { to: "/notifications", label: "Alerts", badge: unread },
                    { to: "/wallet", label: "Wallet" },
                    { to: "/profile", label: "Profile" },
                  ].map(({ to, label, badge }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={closeDrawer}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                          isActive
                            ? "bg-orange-500 text-white"
                            : "text-white/70 active:bg-white/[0.06]"
                        )
                      }
                    >
                      <span className="flex-1">{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </NavLink>
                  ))}
                </nav>

                {status && (
                  <div className="px-4 py-2">
                    <div
                      className={clsx(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold",
                        status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : status === "PENDING"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-red-500/15 text-red-300"
                      )}
                    >
                      <span
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          status === "APPROVED"
                            ? "bg-emerald-400"
                            : status === "PENDING"
                              ? "bg-amber-400"
                              : "bg-red-400"
                        )}
                      />
                      {status === "APPROVED"
                        ? "Account active"
                        : status === "PENDING"
                          ? "Pending approval"
                          : "Account blocked"}
                    </div>
                  </div>
                )}

                <div
                  className="border-t border-white/[0.08] px-4 py-4"
                  style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-white/50 active:bg-white/[0.06] active:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
