import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssignments } from "../../api/deliveryApi";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Clock, ChevronRight } from "lucide-react";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  ACCEPTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  PICKED_UP: "bg-purple-100 text-purple-700 border-purple-200",
  ON_THE_WAY: "bg-orange-100 text-orange-700 border-orange-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
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
    ACTIVE: assignments.filter(a => ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status)).length,
    DELIVERED: assignments.filter(a => a.status === "DELIVERED").length,
    ALL: assignments.length,
  };

  return (
    <div className="min-h-full">
      <div className="px-5 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
          {(["ACTIVE", "DELIVERED", "ALL"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors",
                tab === t
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No {tab.toLowerCase()} orders</p>
            <p className="text-slate-400 text-sm mt-1">
              {tab === "ACTIVE" ? "Go online to receive new deliveries" : "Completed deliveries will appear here"}
            </p>
          </div>
        ) : (
          filtered.map(a => (
            <button
              key={a.id}
              onClick={() => navigate(`/assignments/${a.id}`)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{a.displayId}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.orderSummary}</p>
                  </div>
                  <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0", STATUS_COLORS[a.status])}>
                    {a.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{a.sellerStoreName || "Seller Store"}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 truncate">
                      {a.customerName ? `${a.customerName}` : "Customer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>·</span>
                    <span className={clsx(
                      "font-medium",
                      a.paymentMode === "cod" ? "text-orange-600" : "text-green-600"
                    )}>
                      {a.paymentMode?.toUpperCase()} {a.paid ? "✓" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-900">
                    <span className="font-bold text-sm">₹{(a.deliveryFee / 100).toFixed(0)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
