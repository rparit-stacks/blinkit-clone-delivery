import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, fetchAssignments } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import {
  Bike, Package, CheckCircle, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-indigo-100 text-indigo-700",
  PICKED_UP: "bg-purple-100 text-purple-700",
  ON_THE_WAY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

const paise = (n: number) => `₹${(n / 100).toFixed(2)}`;

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
  const recent = allAssignments.slice(0, 5);

  const isPending = partner?.status === "PENDING";
  const isBlocked = partner?.status === "BLOCKED";

  if (isPending || isBlocked) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          isPending ? "bg-yellow-100" : "bg-red-100"
        )}>
          <AlertCircle className={clsx("w-8 h-8", isPending ? "text-yellow-500" : "text-red-500")} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {isPending ? "Account Pending Approval" : "Account Blocked"}
        </h2>
        <p className="text-slate-500 text-sm max-w-xs">
          {isPending
            ? "Your registration is under review. You will be notified once approved by the admin."
            : "Your account has been blocked. Please contact support for assistance."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
          <h1 className="text-xl font-bold text-slate-900">{partner?.name?.split(" ")[0] ?? "Partner"} 👋</h1>
        </div>
        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          partner?.online ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
        )}>
          <div className={clsx("w-1.5 h-1.5 rounded-full", partner?.online ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
          {partner?.online ? "Online" : "Offline"}
        </div>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Package}
            label="Active Deliveries"
            value={String(stats?.activeDeliveries ?? active.length)}
            color="orange"
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
            label="Today's Earnings"
            value={paise(stats?.earningsTodayPaise ?? 0)}
            color="blue"
          />
          <StatCard
            icon={Wallet}
            label="Wallet Balance"
            value={paise(stats?.walletBalancePaise ?? 0)}
            color="purple"
            onClick={() => navigate("/wallet")}
          />
        </div>
      )}

      {/* Active deliveries */}
      {active.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm">Active Deliveries</h2>
            <button onClick={() => navigate("/assignments")} className="text-orange-500 text-xs font-semibold">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {active.map(a => (
              <AssignmentCard key={a.id} a={a} onClick={() => navigate(`/assignments/${a.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm">Recent Orders</h2>
            <button onClick={() => navigate("/assignments")} className="text-orange-500 text-xs font-semibold">
              See all
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {recent.map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/assignments/${a.id}`)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.displayId}</p>
                  <p className="text-xs text-slate-500 truncate">{a.orderSummary}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full", STATUS_COLORS[a.status])}>
                    {a.status.replace("_", " ")}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">₹{(a.deliveryFee / 100).toFixed(0)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && recent.length === 0 && !statsLoading && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No deliveries yet</p>
          <p className="text-slate-400 text-sm mt-1">Go online to start receiving orders</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, onClick
}: {
  icon: typeof Package; label: string; value: string; color: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
  };
  return (
    <button
      onClick={onClick}
      className={clsx(
        "bg-white rounded-2xl border border-slate-100 p-4 text-left w-full",
        onClick && "hover:shadow-md transition-shadow cursor-pointer"
      )}
    >
      <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    </button>
  );
}

function AssignmentCard({ a, onClick }: { a: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-left shadow-lg shadow-orange-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-bold">{a.displayId}</p>
          <p className="text-orange-200 text-xs mt-0.5">{a.orderSummary}</p>
        </div>
        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          {a.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-orange-100 text-xs truncate max-w-[70%]">
          Deliver to: {a.customerName || "Customer"}
        </p>
        <div className="flex items-center gap-1 text-white">
          <span className="text-sm font-bold">₹{(a.deliveryFee / 100).toFixed(0)}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}
