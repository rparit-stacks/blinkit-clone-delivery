import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, fetchAssignments } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import {
  Bike, Package, CheckCircle, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ASSIGNED:   { bg: "bg-blue-100",   text: "text-blue-700",   label: "Assigned" },
  ACCEPTED:   { bg: "bg-indigo-100", text: "text-indigo-700", label: "Accepted" },
  PICKED_UP:  { bg: "bg-purple-100", text: "text-purple-700", label: "Picked Up" },
  ON_THE_WAY: { bg: "bg-orange-100", text: "text-orange-700", label: "On the way" },
  DELIVERED:  { bg: "bg-green-100",  text: "text-green-700",  label: "Delivered" },
  CANCELLED:  { bg: "bg-red-100",    text: "text-red-700",    label: "Cancelled" },
  REJECTED:   { bg: "bg-red-100",    text: "text-red-700",    label: "Rejected" },
};

const paise = (n: number) => `₹${(n / 100).toFixed(0)}`;
const paiseDecimal = (n: number) => `₹${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { partner } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["delivery", "dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["delivery", "assignments"],
    queryFn: () => fetchAssignments(),
    refetchInterval: 30_000,
  });

  const active = allAssignments.filter(a =>
    ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status)
  );
  const recent = allAssignments.filter(a => a.status === "DELIVERED").slice(0, 4);

  const isPending = partner?.status === "PENDING";
  const isBlocked = partner?.status === "BLOCKED";

  if (isPending || isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className={clsx(
          "mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl ring-4 ring-white",
          isPending ? "bg-amber-100 shadow-amber-200/60" : "bg-red-100 shadow-red-200/60"
        )}>
          <AlertCircle className={clsx("h-10 w-10", isPending ? "text-amber-500" : "text-red-500")} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {isPending ? "Pending Approval" : "Account Blocked"}
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          {isPending
            ? "Your registration is under review. You'll be notified once approved."
            : "Your account is blocked. Please contact support."}
        </p>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = partner?.name?.split(" ")[0] ?? "Partner";

  return (
    <div className="min-h-full pb-2">
      {/* Hero header */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 pb-8"
        style={{ paddingTop: "max(3.25rem, calc(env(safe-area-inset-top) + 2.75rem))" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(251,146,60,0.15),transparent)]" />
        <div className="relative">
          <p className="text-sm text-slate-400">{greeting},</p>
          <h1 className="mt-0.5 text-2xl font-bold text-white">{firstName} 👋</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold
            border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            style={{ display: partner?.online ? undefined : "none" }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Online — receiving orders
          </div>
          {!partner?.online && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-600/60 bg-slate-700/40 px-3 py-1 text-xs font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Offline
            </div>
          )}
        </div>
      </div>

      {/* Stats grid — floated up over hero */}
      <div className="px-4 -mt-4">
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Package}
              label="Active Orders"
              value={String(stats?.activeDeliveries ?? active.length)}
              color="orange"
              trend={active.length > 0 ? "Live" : undefined}
              onClick={() => navigate("/assignments")}
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={String(stats?.completedDeliveries ?? 0)}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="Today's Earning"
              value={paise(stats?.earningsTodayPaise ?? 0)}
              color="blue"
            />
            <StatCard
              icon={Wallet}
              label="Wallet"
              value={paiseDecimal(stats?.walletBalancePaise ?? 0)}
              color="purple"
              onClick={() => navigate("/wallet")}
            />
          </div>
        )}
      </div>

      <div className="space-y-5 px-4 pt-5">
        {/* Active deliveries */}
        {active.length > 0 && (
          <section>
            <SectionHeader title="Active deliveries" count={active.length} onSeeAll={() => navigate("/assignments")} />
            <div className="space-y-2.5">
              {active.map(a => (
                <ActiveOrderCard key={a.id} a={a} onClick={() => navigate(`/assignments/${a.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Recent deliveries */}
        {recent.length > 0 && (
          <section>
            <SectionHeader title="Recent orders" onSeeAll={() => navigate("/assignments")} />
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              {recent.map((a, idx) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(`/assignments/${a.id}`)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100",
                    idx < recent.length - 1 && "border-b border-slate-100"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <Bike className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{a.displayId}</p>
                    <p className="text-xs text-slate-500 truncate">{a.orderSummary}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">₹{(a.deliveryFee / 100).toFixed(0)}</p>
                    <span className={clsx(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      STATUS_COLORS[a.status]?.bg, STATUS_COLORS[a.status]?.text
                    )}>
                      {STATUS_COLORS[a.status]?.label ?? a.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {active.length === 0 && recent.length === 0 && !statsLoading && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Clock className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No deliveries yet</p>
            <p className="mt-1 text-sm text-slate-400">Go online to start receiving orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, count, onSeeAll }: { title: string; count?: number; onSeeAll?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {count !== undefined && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">
            {count}
          </span>
        )}
      </div>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-orange-600 active:opacity-70">
          See all
        </button>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, onClick, trend
}: {
  icon: typeof Package; label: string; value: string; color: string; onClick?: () => void; trend?: string;
}) {
  const palette: Record<string, { icon: string; trend: string; border: string }> = {
    orange: { icon: "bg-orange-100 text-orange-600", trend: "bg-orange-600 text-white", border: "hover:border-orange-200" },
    green:  { icon: "bg-green-100 text-green-600",   trend: "bg-green-600 text-white",  border: "hover:border-green-200" },
    blue:   { icon: "bg-blue-100 text-blue-600",     trend: "bg-blue-600 text-white",   border: "hover:border-blue-200" },
    purple: { icon: "bg-purple-100 text-purple-600", trend: "bg-purple-600 text-white", border: "hover:border-purple-200" },
  };
  const p = palette[color] ?? palette.orange;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all",
        onClick && `cursor-pointer active:scale-[0.98] ${p.border} hover:shadow-md`
      )}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", p.icon)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {trend && (
          <span className={clsx("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1", p.trend)}>
            <Zap className="h-2.5 w-2.5" /> {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
    </button>
  );
}

function ActiveOrderCard({ a, onClick }: { a: any; onClick: () => void }) {
  const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.ASSIGNED;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-4 text-left shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <p className="font-bold text-white text-[15px]">{a.displayId}</p>
          <p className="text-orange-200 text-xs mt-0.5 truncate max-w-[200px]">{a.orderSummary}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white">
          {sc.label}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-white/15 pt-2.5">
        <p className="text-orange-100 text-xs truncate max-w-[65%]">
          {a.customerName || "Customer"}
        </p>
        <div className="flex items-center gap-1 text-white">
          <span className="text-sm font-bold">₹{(a.deliveryFee / 100).toFixed(0)}</span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </div>
      </div>
    </button>
  );
}
