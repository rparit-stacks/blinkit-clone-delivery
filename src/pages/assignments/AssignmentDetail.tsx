import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAssignment, updateAssignmentStatus } from "../../api/deliveryApi";
import {
  ArrowLeft, Phone, Package, CreditCard, Navigation,
  CheckCircle, Loader2, User, Store, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
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

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }[]> = {
  ASSIGNED: [
    { label: "Accept Order", status: "ACCEPTED", color: "bg-blue-600 text-white" },
    { label: "Reject", status: "REJECTED", color: "bg-red-50 text-red-600 border border-red-200" },
  ],
  ACCEPTED: [
    { label: "Mark Picked Up", status: "PICKED_UP", color: "bg-purple-600 text-white" },
  ],
  PICKED_UP: [
    { label: "I'm On The Way", status: "ON_THE_WAY", color: "bg-orange-500 text-white" },
  ],
  ON_THE_WAY: [
    { label: "Mark as Delivered", status: "DELIVERED", color: "bg-green-600 text-white" },
  ],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

const STATUS_STEPS = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["delivery", "assignment", id],
    queryFn: () => fetchAssignment(id!),
    refetchInterval: 15_000,
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => updateAssignmentStatus(id!, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["delivery", "assignment", id] });
      qc.invalidateQueries({ queryKey: ["delivery", "assignments"] });
      qc.invalidateQueries({ queryKey: ["delivery", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["delivery", "wallet"] });
      toast.success(`Status updated to ${data.status.replace("_", " ")}`);
      if (data.status === "DELIVERED") {
        toast.success("Delivery complete! Earnings credited to wallet 🎉", { duration: 4000 });
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openMaps = (address: string, label: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
    toast.info(`Opening ${label} in Google Maps`);
  };

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 bg-slate-100 rounded-xl animate-pulse w-1/3" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-5 text-center py-20">
        <p className="text-slate-500">Assignment not found</p>
        <button onClick={() => navigate("/assignments")} className="mt-4 text-orange-500 font-semibold">
          ← Back to Orders
        </button>
      </div>
    );
  }

  const nextActions = NEXT_STATUS[assignment.status] ?? [];
  const currentStepIdx = STATUS_STEPS.indexOf(assignment.status);
  const parseAddr = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  const delivAddr = parseAddr(assignment.deliveryAddress);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate("/assignments")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-900">{assignment.displayId}</p>
          <p className="text-xs text-slate-500">{assignment.orderSummary}</p>
        </div>
        <span className={clsx("text-[10px] font-bold px-2.5 py-1.5 rounded-full", STATUS_COLORS[assignment.status])}>
          {assignment.status.replace("_", " ")}
        </span>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Progress tracker */}
        {!["CANCELLED", "REJECTED"].includes(assignment.status) && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Delivery Progress</p>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    i <= currentStepIdx ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {i < currentStepIdx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={clsx(
                      "flex-1 h-0.5 mx-1",
                      i < currentStepIdx ? "bg-orange-500" : "bg-slate-100"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {STATUS_STEPS.map(step => (
                <p key={step} className="text-[9px] text-slate-500 text-center" style={{ flex: 1 }}>
                  {step.replace("_", " ")}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Earnings card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-xs font-medium">Your Earning</p>
              <p className="text-2xl font-bold">₹{(assignment.deliveryFee / 100).toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-200 text-xs">Order Total</p>
              <p className="text-white font-semibold">₹{(assignment.orderTotal / 100).toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
            <CreditCard className="w-4 h-4 text-orange-200" />
            <span className="text-sm font-medium">
              {assignment.paymentMode?.toUpperCase()}
              {assignment.paid
                ? <span className="ml-2 bg-green-500/30 text-green-200 text-[10px] px-2 py-0.5 rounded-full">Paid</span>
                : <span className="ml-2 bg-red-500/30 text-red-200 text-[10px] px-2 py-0.5 rounded-full">Collect ₹{(assignment.orderTotal / 100).toFixed(0)}</span>
              }
            </span>
          </div>
        </div>

        {/* Pickup location */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-green-600" />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pickup — {assignment.sellerStoreName}</p>
          </div>
          <p className="text-sm text-slate-600 mb-3">{assignment.pickupAddress || "Pickup address on file"}</p>
          <div className="flex gap-2">
            <button
              onClick={() => openMaps(assignment.pickupAddress || assignment.sellerStoreName, "Pickup Location")}
              className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Open Pickup in Maps
            </button>
            {assignment.sellerPhone && (
              <a
                href={`tel:${assignment.sellerPhone}`}
                className="w-11 h-11 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-slate-700" />
              </a>
            )}
          </div>
        </div>

        {/* Delivery location */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Deliver To — {assignment.customerName || "Customer"}
            </p>
          </div>
          <p className="text-sm text-slate-600 mb-1">
            {delivAddr
              ? [delivAddr.addressLine, delivAddr.city, delivAddr.state, delivAddr.pincode].filter(Boolean).join(", ")
              : assignment.deliveryAddress || "Delivery address on file"
            }
          </p>
          {delivAddr?.phone && (
            <p className="text-xs text-slate-500 mb-3">{delivAddr.phone}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const addr = delivAddr
                  ? [delivAddr.addressLine, delivAddr.city, delivAddr.pincode].filter(Boolean).join(" ")
                  : assignment.deliveryAddress;
                openMaps(addr || "delivery", "Delivery Location");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Open Delivery in Maps
            </button>
            {(assignment.customerPhone || delivAddr?.phone) && (
              <a
                href={`tel:${assignment.customerPhone || delivAddr?.phone}`}
                className="w-11 h-11 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-slate-700" />
              </a>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Order Details
          </p>
          <div className="space-y-2 text-sm">
            <Row label="Order ID" value={assignment.displayId} />
            <Row label="Summary" value={assignment.orderSummary} />
            <Row label="Assigned" value={assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : "—"} />
            {assignment.pickedUpAt && <Row label="Picked Up" value={new Date(assignment.pickedUpAt).toLocaleString()} />}
            {assignment.deliveredAt && <Row label="Delivered" value={new Date(assignment.deliveredAt).toLocaleString()} />}
            {assignment.notes && <Row label="Notes" value={assignment.notes} />}
          </div>
        </div>
      </div>

      {/* Fixed action buttons */}
      {nextActions.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 p-4 z-30">
          <div className="flex gap-3 max-w-lg mx-auto">
            {nextActions.map(action => (
              <button
                key={action.status}
                onClick={() => statusMut.mutate(action.status)}
                disabled={statusMut.isPending}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60",
                  action.color
                )}
              >
                {statusMut.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : action.status === "DELIVERED"
                    ? <TrendingUp className="w-4 h-4" />
                    : <CheckCircle className="w-4 h-4" />
                }
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {assignment.status === "DELIVERED" && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 bg-green-50 border-t border-green-200 p-4 z-30">
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Delivery Completed — Earnings Credited
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
