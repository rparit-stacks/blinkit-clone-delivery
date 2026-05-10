import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import {
  User, Phone, Mail, Bike, CreditCard, FileText, CheckCircle,
  AlertCircle, Clock, Edit3, Loader2, Save, X
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const VEHICLE_TYPES = ["BIKE", "SCOOTER", "CYCLE", "CAR"];

export default function Profile() {
  const { updatePartnerInfo } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["delivery", "profile"],
    queryFn: fetchProfile,
  });

  const updateMut = useMutation({
    mutationFn: () => updateProfile(form as any),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
      updatePartnerInfo({ name: data.name, online: data.online });
      toast.success("Profile updated");
      setEditing(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const startEdit = () => {
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
      vehicleType: profile?.vehicleType || "BIKE",
      vehicleNumber: profile?.vehicleNumber || "",
      bankAccountNumber: profile?.bankAccountNumber || "",
      bankIfsc: profile?.bankIfsc || "",
      bankAccountHolderName: profile?.bankAccountHolderName || "",
      bankName: profile?.bankName || "",
      upiId: profile?.upiId || "",
    });
    setEditing(true);
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const statusConfig = {
    APPROVED: { icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", text: "text-green-800", dot: "bg-green-500", label: "Account Active" },
    PENDING: { icon: Clock, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", dot: "bg-yellow-400", label: "Pending Approval" },
    BLOCKED: { icon: AlertCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500", label: "Account Blocked" },
  };
  const sc = statusConfig[profile?.status ?? "PENDING"];

  return (
    <div className="min-h-full">
      <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your account</p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Status banner */}
        <div className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl border", sc.bg, sc.border)}>
          <div className={clsx("w-2.5 h-2.5 rounded-full", sc.dot)} />
          <sc.icon className={clsx("w-4 h-4", sc.text)} />
          <p className={clsx("text-sm font-semibold", sc.text)}>{sc.label}</p>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full bg-white/60", sc.text)}>
              {profile?.totalDeliveries ?? 0} deliveries
            </span>
            {profile && profile.rating > 0 && (
              <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full bg-white/60", sc.text)}>
                ⭐ {profile.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Personal info */}
        <Section title="Personal Information" icon={User}>
          {editing ? (
            <div className="space-y-3">
              <Field label="Full Name">
                <input type="text" value={form.name || ""} onChange={f("name")}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email || ""} onChange={f("email")}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={profile?.name || "—"} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || "—"} />
              <InfoRow icon={Mail} label="Email" value={profile?.email || "—"} />
            </div>
          )}
        </Section>

        {/* Vehicle */}
        <Section title="Vehicle Details" icon={Bike}>
          {editing ? (
            <div className="space-y-3">
              <Field label="Vehicle Type">
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button
                      key={v}
                      onClick={() => setForm(f => ({ ...f, vehicleType: v }))}
                      className={clsx(
                        "py-2 rounded-xl text-sm font-semibold border transition-colors",
                        form.vehicleType === v ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Vehicle Number">
                <input type="text" value={form.vehicleNumber || ""} onChange={f("vehicleNumber")}
                  placeholder="e.g. UK07AB1234"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase" />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={Bike} label="Type" value={profile?.vehicleType || "—"} />
              <InfoRow icon={FileText} label="Number" value={profile?.vehicleNumber || "—"} />
            </div>
          )}
        </Section>

        {/* Bank details */}
        <Section title="Payment Details" icon={CreditCard}>
          {editing ? (
            <div className="space-y-3">
              {[
                { key: "bankAccountHolderName", label: "Account Holder Name", placeholder: "As per bank" },
                { key: "bankAccountNumber", label: "Account Number", placeholder: "Account number" },
                { key: "bankIfsc", label: "IFSC Code", placeholder: "HDFC0001234" },
                { key: "bankName", label: "Bank Name", placeholder: "e.g. HDFC Bank" },
                { key: "upiId", label: "UPI ID (optional)", placeholder: "name@upi" },
              ].map(({ key, label, placeholder }) => (
                <Field key={key} label={label}>
                  <input type="text" value={form[key] || ""} onChange={f(key)} placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </Field>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={User} label="Holder" value={profile?.bankAccountHolderName || "Not set"} />
              <InfoRow icon={CreditCard} label="Account" value={profile?.bankAccountNumber ? `···${profile.bankAccountNumber.slice(-4)}` : "Not set"} />
              <InfoRow icon={FileText} label="IFSC" value={profile?.bankIfsc || "Not set"} />
              <InfoRow icon={FileText} label="Bank" value={profile?.bankName || "Not set"} />
              {profile?.upiId && <InfoRow icon={Phone} label="UPI" value={profile.upiId} />}
            </div>
          )}
        </Section>

        {/* Account info */}
        <div className="bg-slate-100 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—"}</p>
          <p className="text-xs text-slate-500 mt-0.5">ID: {profile?.id?.slice(0, 16) ?? "—"}…</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
        <Icon className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
