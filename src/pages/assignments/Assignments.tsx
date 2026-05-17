import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssignments } from "../../api/deliveryApi";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Clock, ChevronRight, Bike } from "lucide-react";
import clsx from "clsx";

const STATUS_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ASSIGNED:   { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Assigned" },
  ACCEPTED:   { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "Accepted" },
  PICKED_UP:  { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", label: "Picked Up" },
  ON_THE_WAY: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "On the way" },
  DELIVERED:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Delivered" },
  CANCELLED:  { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Cancelled" },
  REJECTED:   { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Rejected" },
};

type Tab = "ACTIVE" | "DELIVERED" | "ALL";

export default function Assignments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("ACTIVE");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["delivery", "assignments"],
    queryFn: () => fetchAssignments(),
    refetchInterval: 20_000,
  });

  const filtered = assignments.filter(a => {
    if (tab === "ACTIVE") return ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status);
    if (tab === "DELIVERED") return a.status === "DELIVERED";
    return true;
  });

  const counts = {
    ACTIVE:    assignments.filter(a => ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status)).length,
    DELIVERED: assignments.filter(a => a.status === "DELIVERED").length,
    ALL:       assignments.length,
  };

  return (
    <div className="min-h-full">
      {/* Sticky header + tabs */}
      <div className="sticky top-0 z-10 bg-white/97 backdrop-blur-xl border-b border-slate-200/70">
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">Your assignments and history</p>
        </div>

        {/* Segment control */}
        <div className="px-4 pb-3">
          <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
            {(["ACTIVE", "DELIVERED", "ALL"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={clsx(
                  "flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all",
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                )}
              >
                {t === "ACTIVE" ? "Active" : t === "DELIVERED" ? "Done" : "All"}
                {" "}
                <span className={clsx(
                  "tabular-nums text-[10px]",
                  tab === t ? "text-orange-600" : "text-slate-400"
                )}>
                  ({counts[t]})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-2.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm mt-2">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-7 w-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700">No {tab === "ACTIVE" ? "active" : tab === "DELIVERED" ? "completed" : ""} orders</p>
            <p className="mt-1 text-sm text-slate-400">
              {tab === "ACTIVE" ? "Go online to receive deliveries" : "Completed deliveries appear here"}
            </p>
          </div>
        ) : (
          filtered.map(a => <OrderCard key={a.id} a={a} onClick={() => navigate(`/assignments/${a.id}`)} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ a, onClick }: { a: any; onClick: () => void }) {
  const sm = STATUS_META[a.status] ?? STATUS_META.ASSIGNED;
  const isActive = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border bg-white text-left shadow-sm transition-all active:scale-[0.98] overflow-hidden",
        isActive ? "border-orange-200/60 shadow-orange-100/60" : "border-slate-200/70"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-amber-400" />
      )}

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              isActive ? "bg-orange-100" : "bg-slate-100"
            )}>
              <Bike className={clsx("h-4 w-4", isActive ? "text-orange-600" : "text-slate-500")} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-[15px]">{a.displayId}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{a.orderSummary}</p>
            </div>
          </div>
          <span className={clsx(
            "shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
            sm.bg, sm.text
          )}>
            <span className={clsx("h-1.5 w-1.5 rounded-full", sm.dot)} />
            {sm.label}
          </span>
        </div>

        {/* Addresses */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-600 truncate">{a.sellerStoreName || "Seller Store"}</p>
          </div>
          <div className="ml-2 h-3 border-l border-dashed border-slate-200" />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
            <p className="text-xs text-slate-600 truncate">{a.customerName || "Customer"}</p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className={clsx(
              "font-semibold px-1.5 py-0.5 rounded text-[10px]",
              a.paymentMode === "cod" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
            )}>
              {a.paymentMode?.toUpperCase()} {a.paid ? "✓" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-900">₹{(a.deliveryFee / 100).toFixed(0)}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </button>
  );
}
