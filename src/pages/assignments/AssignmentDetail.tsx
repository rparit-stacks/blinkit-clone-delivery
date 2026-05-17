import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAssignment, updateAssignmentStatus } from "../../api/deliveryApi";
import {
  ArrowLeft, Phone, Package, CreditCard, Navigation,
  CheckCircle, Loader2, User, Store, IndianRupee
} from "lucide-react";
import { toast } from "sonner";
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

const NEXT_STATUS: Record<string, { label: string; status: string; primary: boolean }[]> = {
  ASSIGNED:   [
    { label: "Accept Order",    status: "ACCEPTED",    primary: true },
    { label: "Reject",          status: "REJECTED",    primary: false },
  ],
  ACCEPTED:   [{ label: "Mark Picked Up",    status: "PICKED_UP",   primary: true }],
  PICKED_UP:  [{ label: "I'm On The Way",    status: "ON_THE_WAY",  primary: true }],
  ON_THE_WAY: [{ label: "Mark as Delivered", status: "DELIVERED",   primary: true }],
};

const STATUS_STEPS = ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
const STEP_LABELS  = ["Assigned", "Accepted", "Picked Up", "On the way", "Delivered"];

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
      toast.success(`Status: ${data.status.replace(/_/g, " ")}`);
      if (data.status === "DELIVERED") {
        toast.success("Delivery complete! Earnings credited 🎉", { duration: 4000 });
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openMaps = (address: string, label: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
    toast.info(`Opening ${label} in Maps`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-5">
        <div className="h-10 w-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <p className="text-slate-500">Assignment not found</p>
        <button
          type="button"
          onClick={() => navigate("/assignments")}
          className="mt-4 rounded-2xl px-6 py-3 font-semibold text-orange-600"
        >
          Back to orders
        </button>
      </div>
    );
  }

  const nextActions = NEXT_STATUS[assignment.status] ?? [];
  const currentStepIdx = STATUS_STEPS.indexOf(assignment.status);
  const parseAddr = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  const delivAddr = parseAddr(assignment.deliveryAddress);
  const sm = STATUS_META[assignment.status] ?? STATUS_META.ASSIGNED;
  const isFinal = ["DELIVERED", "CANCELLED", "REJECTED"].includes(assignment.status);

  return (
    <div className="min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200/70 bg-white/97 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate("/assignments")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors active:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate">{assignment.displayId}</p>
          <p className="text-xs text-slate-400 truncate">{assignment.orderSummary}</p>
        </div>
        <span className={clsx(
          "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold",
          sm.bg, sm.text
        )}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", sm.dot)} />
          {sm.label}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3 px-4 py-4" style={{
        paddingBottom: nextActions.length > 0 || assignment.status === "DELIVERED"
          ? "calc(8rem + env(safe-area-inset-bottom))"
          : "calc(6rem + env(safe-area-inset-bottom))"
      }}>

        {/* Progress stepper */}
        {!isFinal || assignment.status === "DELIVERED" ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Progress</p>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                    i < currentStepIdx
                      ? "bg-orange-500 text-white"
                      : i === currentStepIdx
                      ? "bg-orange-500 text-white shadow-md shadow-orange-400/40 ring-3 ring-orange-100"
                      : "bg-slate-100 text-slate-400"
                  )}>
                    {i < currentStepIdx ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={clsx(
                      "mx-1 h-0.5 flex-1 rounded-full transition-all",
                      i < currentStepIdx ? "bg-orange-400" : "bg-slate-100"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between">
              {STEP_LABELS.map((label, i) => (
                <p key={label} className={clsx(
                  "flex-1 text-center text-[9px] font-medium leading-tight",
                  i <= currentStepIdx ? "text-orange-600" : "text-slate-400"
                )}>
                  {label}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {/* Earning card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Your Earning</p>
              <p className="text-3xl font-bold text-white">₹{(assignment.deliveryFee / 100).toFixed(0)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20">
              <IndianRupee className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{assignment.paymentMode?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Order total: ₹{(assignment.orderTotal / 100).toFixed(0)}</span>
              {assignment.paid
                ? <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Paid</span>
                : <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">Collect ₹{(assignment.orderTotal / 100).toFixed(0)}</span>
              }
            </div>
          </div>
        </div>

        {/* Pickup */}
        <LocationCard
          type="pickup"
          title={assignment.sellerStoreName || "Seller Store"}
          address={assignment.pickupAddress || "Pickup address on file"}
          phone={assignment.sellerPhone}
          onNavigate={() => openMaps(assignment.pickupAddress || assignment.sellerStoreName, "Pickup")}
        />

        {/* Delivery */}
        <LocationCard
          type="delivery"
          title={assignment.customerName || "Customer"}
          address={delivAddr
            ? [delivAddr.addressLine, delivAddr.city, delivAddr.state, delivAddr.pincode].filter(Boolean).join(", ")
            : assignment.deliveryAddress || "Delivery address on file"
          }
          phone={assignment.customerPhone || delivAddr?.phone}
          onNavigate={() => {
            const addr = delivAddr
              ? [delivAddr.addressLine, delivAddr.city, delivAddr.pincode].filter(Boolean).join(" ")
              : assignment.deliveryAddress;
            openMaps(addr || "delivery", "Customer");
          }}
        />

        {/* Order details */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Details</p>
          </div>
          <div className="space-y-2.5">
            <DetailRow label="Order ID" value={assignment.displayId} />
            <DetailRow label="Summary" value={assignment.orderSummary} />
            <DetailRow label="Assigned" value={assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"} />
            {assignment.pickedUpAt && <DetailRow label="Picked Up" value={new Date(assignment.pickedUpAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />}
            {assignment.deliveredAt && <DetailRow label="Delivered" value={new Date(assignment.deliveredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />}
            {assignment.notes && <DetailRow label="Notes" value={assignment.notes} />}
          </div>
        </div>
      </div>

      {/* Action bar */}
      {nextActions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/97 backdrop-blur-xl lg:left-[260px]"
          style={{ padding: "0.75rem 1rem", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", paddingTop: "0.75rem" }}>
          <div className="mx-auto flex max-w-lg gap-2.5">
            {nextActions.map(action => (
              <button
                key={action.status}
                type="button"
                onClick={() => statusMut.mutate(action.status)}
                disabled={statusMut.isPending}
                className={clsx(
                  "flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60",
                  action.primary
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                )}
              >
                {statusMut.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle className="h-4 w-4" />
                }
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {assignment.status === "DELIVERED" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-green-200 bg-green-50/97 backdrop-blur-xl lg:left-[260px]"
          style={{ padding: "0.875rem 1rem", paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle className="h-5 w-5" />
            Delivery Complete — Earnings Credited
          </div>
        </div>
      )}
    </div>
  );
}

function LocationCard({
  type, title, address, phone, onNavigate
}: {
  type: "pickup" | "delivery"; title: string; address: string; phone?: string; onNavigate: () => void;
}) {
  const isPickup = type === "pickup";
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={clsx(
          "flex h-8 w-8 items-center justify-center rounded-xl",
          isPickup ? "bg-emerald-100" : "bg-orange-100"
        )}>
          {isPickup
            ? <Store className="h-4 w-4 text-emerald-600" />
            : <User className="h-4 w-4 text-orange-600" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isPickup ? "Pickup from" : "Deliver to"}
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{address}</p>
      {phone && <p className="text-xs text-slate-400 mb-3">{phone}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNavigate}
          className={clsx(
            "flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors active:opacity-80",
            isPickup
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
          )}
        >
          <Navigation className="h-4 w-4" />
          Open in Maps
        </button>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
