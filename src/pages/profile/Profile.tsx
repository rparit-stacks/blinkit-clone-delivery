import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, uploadFile, resolveMediaUrl } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import {
  User, Phone, Mail, Bike, CreditCard, Shield, CheckCircle,
  AlertCircle, Clock, Edit3, Loader2, Save, X,
  FileText, Upload, CheckCircle2, Image, Star
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const VEHICLE_TYPES = ["BIKE", "SCOOTER", "CYCLE", "CAR"];
type DocKey = "idProofUrl" | "licenseUrl" | "vehicleImageUrl" | "profileImage";

const DOC_FIELDS: { key: DocKey; label: string; desc: string; required: boolean }[] = [
  { key: "profileImage",    label: "Profile Photo",  desc: "Clear front-facing photo",   required: true },
  { key: "idProofUrl",      label: "ID Proof",       desc: "Aadhaar / Voter ID / Passport", required: true },
  { key: "licenseUrl",      label: "Driving License", desc: "Valid driving license",      required: true },
  { key: "vehicleImageUrl", label: "Vehicle Photo",  desc: "Vehicle with number plate",  required: false },
];

export default function Profile() {
  const { updatePartnerInfo } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<DocKey | null>(null);
  const fileRefs = useRef<Partial<Record<DocKey, HTMLInputElement | null>>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["delivery", "profile"],
    queryFn: fetchProfile,
  });

  const updateMut = useMutation({
    mutationFn: () => updateProfile(form as Parameters<typeof updateProfile>[0]),
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
      name: profile?.name || "", email: profile?.email || "",
      vehicleType: profile?.vehicleType || "BIKE", vehicleNumber: profile?.vehicleNumber || "",
      bankAccountNumber: profile?.bankAccountNumber || "", bankIfsc: profile?.bankIfsc || "",
      bankAccountHolderName: profile?.bankAccountHolderName || "", bankName: profile?.bankName || "",
      upiId: profile?.upiId || "",
    });
    setEditing(true);
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleDocUpload = async (key: DocKey, file: File) => {
    setUploadingDoc(key);
    try {
      const url = await uploadFile(file, "delivery-docs");
      await updateProfile({ [key]: url } as Parameters<typeof updateProfile>[0]);
      qc.invalidateQueries({ queryKey: ["delivery", "profile"] });
      toast.success("Document uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingDoc(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
        {[0,1,2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  const statusConfig = {
    APPROVED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", label: "Account Active", sub: "Approved — you can go online to receive deliveries." },
    PENDING:  { icon: Clock,       color: "text-amber-600", bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-400",  label: "Pending Review",  sub: "Upload all required KYC documents for faster approval." },
    BLOCKED:  { icon: AlertCircle, color: "text-red-600",   bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-500",   label: "Account Blocked", sub: "Your account is blocked. Contact support." },
  };
  const sc = statusConfig[profile?.status ?? "PENDING"];
  const uploadedDocCount = DOC_FIELDS.filter(d => !!(profile as Record<string, unknown> | undefined)?.[d.key]).length;
  const missingRequired = DOC_FIELDS.filter(d => d.required && !(profile as Record<string, unknown> | undefined)?.[d.key]);
  const initial = profile?.name?.charAt(0).toUpperCase() ?? "D";

  return (
    <div>
      {/* Profile hero */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-5 pb-6 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(251,146,60,0.10),transparent)]" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile?.profileImage ? (
                <img
                  src={resolveMediaUrl(profile.profileImage)}
                  alt={profile?.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-2xl font-bold text-white shadow-lg shadow-orange-900/30">
                  {initial}
                </div>
              )}
              {/* Upload dot */}
              <button
                type="button"
                onClick={() => fileRefs.current.profileImage?.click()}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-md"
              >
                <Upload className="h-3 w-3" />
              </button>
              <input
                type="file" accept="image/*" className="hidden"
                ref={el => { fileRefs.current.profileImage = el; }}
                onChange={e => { const file = e.target.files?.[0]; if (file) handleDocUpload("profileImage", file); e.target.value = ""; }}
              />
            </div>

            <div>
              <p className="text-lg font-bold text-white">{profile?.name ?? "—"}</p>
              <p className="text-sm text-slate-400">{profile?.phone}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {(profile?.rating ?? 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <Star className="h-2.5 w-2.5" /> {profile!.rating.toFixed(1)}
                  </span>
                )}
                <span className="text-[10px] font-medium text-slate-500">{profile?.totalDeliveries ?? 0} deliveries</span>
              </div>
            </div>
          </div>

          {/* Edit / Save button */}
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60"
              >
                {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 pb-6">
        {/* Status banner */}
        <div className={clsx("flex items-start gap-3 rounded-2xl border p-4", sc.bg, sc.border)}>
          <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", sc.bg)}>
            <sc.icon className={clsx("h-4 w-4", sc.color)} />
          </div>
          <div>
            <p className={clsx("text-sm font-bold", sc.color)}>{sc.label}</p>
            <p className={clsx("text-xs mt-0.5", sc.color, "opacity-80")}>{sc.sub}</p>
          </div>
        </div>

        {/* KYC alert */}
        {profile?.status === "PENDING" && missingRequired.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Missing Documents</p>
              <p className="text-xs text-amber-700 mt-0.5">{missingRequired.map(d => d.label).join(", ")}</p>
            </div>
          </div>
        )}

        {/* Personal info */}
        <SectionCard title="Personal Info" icon={User}>
          {editing ? (
            <div className="space-y-3">
              <FormField label="Full Name">
                <input type="text" value={form.name || ""} onChange={f("name")} className={inputCls} placeholder="Your name" />
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email || ""} onChange={f("email")} className={inputCls} placeholder="email@example.com" />
              </FormField>
            </div>
          ) : (
            <div className="space-y-2.5">
              <InfoRow icon={User}  label="Name"  value={profile?.name || "—"} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || "—"} />
              <InfoRow icon={Mail}  label="Email" value={profile?.email || "—"} />
            </div>
          )}
        </SectionCard>

        {/* Vehicle */}
        <SectionCard title="Vehicle Details" icon={Bike}>
          {editing ? (
            <div className="space-y-3">
              <FormField label="Vehicle Type">
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, vehicleType: v }))}
                      className={clsx(
                        "rounded-xl py-2.5 text-sm font-semibold border transition-all",
                        form.vehicleType === v ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-600"
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Vehicle Number">
                <input type="text" value={form.vehicleNumber || ""} onChange={f("vehicleNumber")} className={clsx(inputCls, "uppercase")} placeholder="e.g. UK07AB1234" />
              </FormField>
            </div>
          ) : (
            <div className="space-y-2.5">
              <InfoRow icon={Bike}     label="Type"   value={profile?.vehicleType || "—"} />
              <InfoRow icon={FileText} label="Number" value={profile?.vehicleNumber || "—"} />
            </div>
          )}
        </SectionCard>

        {/* Payment */}
        <SectionCard title="Payment Details" icon={CreditCard}>
          {editing ? (
            <div className="space-y-3">
              {[
                { key: "bankAccountHolderName", label: "Account Holder", placeholder: "As per bank" },
                { key: "bankAccountNumber",     label: "Account Number", placeholder: "Account number" },
                { key: "bankIfsc",              label: "IFSC Code",      placeholder: "HDFC0001234" },
                { key: "bankName",              label: "Bank Name",      placeholder: "e.g. HDFC Bank" },
                { key: "upiId",                 label: "UPI ID (optional)", placeholder: "name@upi" },
              ].map(({ key, label, placeholder }) => (
                <FormField key={key} label={label}>
                  <input type="text" value={form[key] || ""} onChange={f(key)} className={inputCls} placeholder={placeholder} />
                </FormField>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              <InfoRow icon={User}     label="Holder"  value={profile?.bankAccountHolderName || "Not set"} />
              <InfoRow icon={CreditCard} label="Account" value={profile?.bankAccountNumber ? `···${profile.bankAccountNumber.slice(-4)}` : "Not set"} />
              <InfoRow icon={FileText} label="IFSC"    value={profile?.bankIfsc || "Not set"} />
              <InfoRow icon={FileText} label="Bank"    value={profile?.bankName || "Not set"} />
              {profile?.upiId && <InfoRow icon={Phone} label="UPI" value={profile.upiId} />}
            </div>
          )}
        </SectionCard>

        {/* KYC documents */}
        <SectionCard
          title="KYC Documents"
          icon={Shield}
          right={<span className="text-xs font-medium text-slate-500">{uploadedDocCount}/{DOC_FIELDS.length} uploaded</span>}
        >
          <div className="space-y-2.5">
            {DOC_FIELDS.map(({ key, label, desc, required }) => {
              const url = (profile as Record<string, unknown> | undefined)?.[key] as string | undefined;
              const isUploading = uploadingDoc === key;
              if (key === "profileImage") return null; // Handled in avatar
              return (
                <div key={key} className={clsx(
                  "flex items-center gap-3 rounded-xl border p-3 transition-all",
                  url ? "border-green-200 bg-green-50" : required ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                )}>
                  <div className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    url ? "bg-green-100" : "bg-slate-100"
                  )}>
                    {url
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <FileText className={clsx("h-4 w-4", required ? "text-amber-500" : "text-slate-400")} />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      {required && !url && (
                        <span className="rounded bg-red-50 px-1 py-0.5 text-[9px] font-bold text-red-500">REQ</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{url ? "Uploaded ✓" : desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {url && (
                      <a href={resolveMediaUrl(url)} target="_blank" rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <Image className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileRefs.current[key]?.click()}
                      className={clsx(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                        url ? "bg-slate-100 text-slate-600" : "bg-orange-500 text-white hover:bg-orange-600"
                      )}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {isUploading ? "..." : url ? "Replace" : "Upload"}
                    </button>
                    <input
                      type="file" accept="image/*,application/pdf" className="hidden"
                      ref={el => { fileRefs.current[key] = el; }}
                      onChange={e => { const file = e.target.files?.[0]; if (file) handleDocUpload(key, file); e.target.value = ""; }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="rounded-2xl bg-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Member since {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
              : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">ID: {profile?.id?.slice(0, 16) ?? "—"}…</p>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white";

function SectionCard({ title, icon: Icon, children, right }: {
  title: string; icon: typeof User; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{title}</p>
        </div>
        {right}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
