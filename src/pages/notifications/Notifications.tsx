import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, CheckCheck, Package, Wallet, User, Megaphone,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Gift,
  Star, ShieldCheck, ShieldAlert, Info, Bike
} from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getNotifCategory,
  type NotificationItem,
  type NotificationType,
} from "../../lib/notificationsApi";
import { resolveNotificationPath } from "../../lib/notificationNavigation";
import clsx from "clsx";

// ─── Icon & colour mapping per notification type ──────────────────────────────

type IconMeta = { icon: typeof Bell; bg: string; text: string };

const TYPE_META: Record<string, IconMeta> = {
  // Order / delivery
  DELIVERY_ASSIGNED:        { icon: Bike,          bg: "bg-orange-100", text: "text-orange-600" },
  DELIVERY_ACCEPTED:        { icon: CheckCircle,   bg: "bg-blue-100",   text: "text-blue-600" },
  DELIVERY_STATUS:          { icon: Bike,          bg: "bg-indigo-100", text: "text-indigo-600" },
  DELIVERY_STATUS_SELF:     { icon: Bike,          bg: "bg-indigo-100", text: "text-indigo-600" },
  DELIVERY_MISSED:          { icon: AlertTriangle, bg: "bg-red-100",    text: "text-red-600" },
  DELIVERY_REJECTED:        { icon: XCircle,       bg: "bg-red-100",    text: "text-red-600" },
  DELIVERY_PICKUP_REMINDER: { icon: Bike,          bg: "bg-amber-100",  text: "text-amber-600" },

  // Wallet / earnings
  EARNING_CREDITED:    { icon: TrendingUp,    bg: "bg-green-100",  text: "text-green-600" },
  WALLET_CREDIT:       { icon: TrendingUp,    bg: "bg-green-100",  text: "text-green-600" },
  WALLET_DEBIT:        { icon: Wallet,        bg: "bg-red-100",    text: "text-red-600" },
  WITHDRAWAL_APPROVED: { icon: CheckCircle,   bg: "bg-green-100",  text: "text-green-600" },
  WITHDRAWAL_REJECTED: { icon: XCircle,       bg: "bg-red-100",    text: "text-red-600" },
  PENALTY_ISSUED:      { icon: AlertTriangle, bg: "bg-red-100",    text: "text-red-600" },
  INCENTIVE_REWARDED:  { icon: Gift,          bg: "bg-purple-100", text: "text-purple-600" },

  // Account / verification
  WELCOME:              { icon: Star,         bg: "bg-amber-100",  text: "text-amber-600" },
  LOGIN:                { icon: User,         bg: "bg-slate-100",  text: "text-slate-600" },
  DELIVERY_APPROVED:    { icon: CheckCircle,  bg: "bg-green-100",  text: "text-green-600" },
  DELIVERY_BLOCKED:     { icon: ShieldAlert,  bg: "bg-red-100",    text: "text-red-600" },
  DELIVERY_UNBLOCKED:   { icon: ShieldCheck,  bg: "bg-green-100",  text: "text-green-600" },
  KYC_VERIFIED:         { icon: ShieldCheck,  bg: "bg-green-100",  text: "text-green-600" },
  KYC_REJECTED:         { icon: ShieldAlert,  bg: "bg-red-100",    text: "text-red-600" },
  WARNING_ISSUED:       { icon: AlertTriangle,bg: "bg-amber-100",  text: "text-amber-600" },

  // Announcements
  ADMIN_ANNOUNCEMENT:  { icon: Megaphone, bg: "bg-blue-100",   text: "text-blue-600" },
  ADMIN_MESSAGE:       { icon: Megaphone, bg: "bg-blue-100",   text: "text-blue-600" },
};

function getTypeMeta(type?: NotificationType | string): IconMeta {
  if (type && TYPE_META[type]) return TYPE_META[type];
  return { icon: Bell, bg: "bg-slate-100", text: "text-slate-500" };
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type Tab = "all" | "order" | "wallet" | "account";

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "all",     label: "All",     icon: Bell },
  { id: "order",   label: "Orders",  icon: Package },
  { id: "wallet",  label: "Wallet",  icon: Wallet },
  { id: "account", label: "Account", icon: User },
];

export default function Notifications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["delivery", "notifications"],
    queryFn: () => fetchNotifications(60),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery", "notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery", "notifications"] }),
  });

  const filtered = items.filter((n) => {
    if (tab === "all") return true;
    return getNotifCategory(n.type) === tab;
  });

  const unread      = items.filter((n) => !n.read).length;
  const unreadInTab = filtered.filter((n) => !n.read).length;

  const handleClick = (n: NotificationItem) => {
    if (!n.read) markOne.mutate(n.id);
    const path = resolveNotificationPath({
      type:              n.type,
      relatedEntityKind: n.relatedEntityKind,
      relatedEntityId:   n.relatedEntityId,
    });
    if (path !== "/notifications") navigate(path);
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/97 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100 active:opacity-70 disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Tab filter */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => {
            const tabUnread = id === "all"
              ? unread
              : items.filter((n) => !n.read && getNotifCategory(n.type) === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={clsx(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  tab === id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {tabUnread > 0 && (
                  <span className={clsx(
                    "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold",
                    tab === id ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"
                  )}>
                    {tabUnread > 99 ? "99+" : tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-2.5">
        {isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))
        )}

        {isError && (
          <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 py-10 text-center">
            <Info className="mb-2 h-6 w-6 text-red-500" />
            <p className="text-sm font-semibold text-red-700">Failed to load notifications</p>
            <p className="mt-1 text-xs text-red-500">
              {error instanceof Error ? error.message : "Please try again"}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Bell className="h-7 w-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700">
              {tab === "all" ? "No notifications yet" : `No ${tab} notifications`}
            </p>
            <p className="mt-1 text-sm text-slate-400">You're all caught up!</p>
          </div>
        )}

        {!isLoading && !isError && filtered.map((n) => (
          <NotifCard key={n.id} item={n} onClick={() => handleClick(n)} />
        ))}

        {/* Unread in other tabs hint */}
        {tab !== "all" && unread > unreadInTab && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setTab("all")}
              className="text-xs font-semibold text-orange-600"
            >
              +{unread - unreadInTab} unread in other categories — View all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const meta = getTypeMeta(item.type);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border text-left shadow-sm transition-all active:scale-[0.99]",
        !item.read
          ? "border-orange-200/70 bg-white ring-1 ring-orange-100"
          : "border-slate-200/70 bg-white"
      )}
    >
      {/* Unread top bar */}
      {!item.read && (
        <div className="h-0.5 w-full rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-400" />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon or image */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className={clsx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
            meta.bg
          )}>
            <Icon className={clsx("h-4 w-4", meta.text)} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={clsx(
              "text-sm leading-snug",
              !item.read ? "font-bold text-slate-900" : "font-semibold text-slate-800"
            )}>
              {item.title}
            </p>
            {!item.read && (
              <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-orange-500" />
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {item.message}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-[10px] font-medium text-slate-400">{item.time}</p>
            {item.type && (
              <span className={clsx(
                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                meta.bg, meta.text
              )}>
                {item.type.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
