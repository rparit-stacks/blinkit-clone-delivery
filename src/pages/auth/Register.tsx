import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  deliveryRegister, uploadFile, updateProfile, resolveMediaUrl,
  deliverySendOtp, deliveryVerifyOtp,
} from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import {
  Bike, Loader2, Eye, EyeOff, Shield, User, FileText,
  Upload, CheckCircle2, AlertCircle, Image, Mail, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import AuthShell from "../../components/auth/AuthShell";
import AuthCard from "../../components/auth/AuthCard";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";
import StepDots from "../../components/auth/StepDots";

const VEHICLE_TYPES = [
  { value: "BIKE", label: "Bike", icon: "🏍️" },
  { value: "SCOOTER", label: "Scooter", icon: "🛵" },
  { value: "CYCLE", label: "Cycle", icon: "🚲" },
  { value: "CAR", label: "Car", icon: "🚗" },
];

type DocKey = "idProofUrl" | "licenseUrl" | "vehicleImageUrl" | "profileImage";

const DOC_FIELDS: { key: DocKey; label: string; desc: string; required: boolean }[] = [
  { key: "profileImage", label: "Profile Photo", desc: "Clear front-facing photo", required: true },
  { key: "idProofUrl", label: "ID Proof", desc: "Aadhaar / Voter ID / Passport", required: true },
  { key: "licenseUrl", label: "Driving License", desc: "Valid driving license", required: true },
  { key: "vehicleImageUrl", label: "Vehicle Photo", desc: "Photo of your vehicle with number plate", required: false },
];

const STEPS = [
  { id: 1, label: "You" },
  { id: 2, label: "Vehicle" },
  { id: 3, label: "KYC" },
];

interface FormState {
  name: string; phone: string; email: string; password: string;
  vehicleType: string; vehicleNumber: string;
}

interface Draft {
  form: FormState;
  step: number;
  emailVerified: boolean;
  verifiedEmail: string;
  docs: Partial<Record<DocKey, string>>;
}

const STORAGE_KEY = "delivery_register_draft";

function emptyForm(): FormState {
  return { name: "", phone: "", email: "", password: "", vehicleType: "BIKE", vehicleNumber: "" };
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { form: emptyForm(), step: 1, emailVerified: false, verifiedEmail: "", docs: {} };
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const initial = loadDraft();
  const [emailVerified, setEmailVerified] = useState(initial.emailVerified);
  const [otpEmail, setOtpEmail] = useState(initial.verifiedEmail || initial.form.email || "");
  const [otpValue, setOtpValue] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const [step, setStep] = useState(initial.step);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState<FormState>(initial.form);
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>(initial.docs ?? {});
  const [uploadingDoc, setUploadingDoc] = useState<DocKey | null>(null);
  const fileRefs = useRef<Partial<Record<DocKey, HTMLInputElement | null>>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      form, step, emailVerified, verifiedEmail: otpEmail, docs,
    }));
  }, [form, step, emailVerified, otpEmail, docs]);

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const sendOtpMut = useMutation({
    mutationFn: () => deliverySendOtp(otpEmail),
    onSuccess: (data) => {
      setOtpSent(true);
      if (data.otp) setDevOtp(data.otp);
      toast.success("OTP sent to " + otpEmail);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const verifyOtpMut = useMutation({
    mutationFn: () => deliveryVerifyOtp(otpEmail, otpValue),
    onSuccess: () => {
      setEmailVerified(true);
      setForm(prev => ({ ...prev, email: otpEmail }));
      toast.success("Email verified!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const registerMut = useMutation({
    mutationFn: () => deliveryRegister(form),
    onSuccess: (data) => {
      login(data);
      setStep(3);
      toast.success("Account created! Now upload your documents.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleFileSelect = async (key: DocKey, file: File) => {
    setUploadingDoc(key);
    try {
      const url = await uploadFile(file, "delivery-docs");
      await updateProfile({ [key]: url });
      setDocs(d => ({ ...d, [key]: url }));
      toast.success("Uploaded successfully");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const requiredDocs = DOC_FIELDS.filter(d => d.required);
  const allRequiredUploaded = requiredDocs.every(d => docs[d.key]);

  const handleFinish = () => {
    if (!allRequiredUploaded) {
      const missing = requiredDocs.filter(d => !docs[d.key]).map(d => d.label).join(", ");
      toast.error(`Please upload: ${missing}`);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Registration complete! Awaiting admin approval.");
    navigate("/dashboard", { replace: true });
  };

  const step1Valid = form.name && form.phone.length === 10 && form.password.length >= 6;
  const step2Valid = !!form.vehicleType;

  return (
    <AuthShell
      title={emailVerified ? "Partner registration" : "Verify email"}
      subtitle={
        emailVerified
          ? "Complete your profile for admin approval"
          : "We'll send a code to confirm your email"
      }
      backTo={!emailVerified ? { label: "Sign in", href: "/login" } : undefined}
      footer={
        !emailVerified ? (
          <>
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-orange-600">
              Sign in
            </Link>
          </>
        ) : undefined
      }
    >
      {emailVerified && <StepDots steps={STEPS} current={step} />}

      <AuthCard>

          {/* OTP Verification Screen */}
          {!emailVerified && (
            <div className="space-y-5">
              {devOtp && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
                  Dev OTP: <strong className="text-lg tracking-widest">{devOtp}</strong>
                </div>
              )}

              <AuthField
                label="Email address"
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="you@email.com"
                disabled={otpSent}
                icon={<Mail className="h-[18px] w-[18px]" />}
              />

              {!otpSent ? (
                <AuthButton
                  onClick={() => sendOtpMut.mutate()}
                  loading={sendOtpMut.isPending}
                  disabled={!otpEmail.includes("@")}
                >
                  Send code
                </AuthButton>
              ) : (
                <div className="space-y-4">
                  <AuthField
                    label="6-digit code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="text-center tracking-[0.35em]"
                    icon={<KeyRound className="h-[18px] w-[18px]" />}
                  />
                  <AuthButton
                    onClick={() => verifyOtpMut.mutate()}
                    loading={verifyOtpMut.isPending}
                    disabled={otpValue.length !== 6}
                  >
                    Verify & continue
                  </AuthButton>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue("");
                      setDevOtp(null);
                      sendOtpMut.reset();
                    }}
                    className="w-full py-2 text-sm font-medium text-slate-500 active:text-orange-600"
                  >
                    Change email
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Personal */}
          {emailVerified && step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h2 className="font-bold text-slate-900">Personal Details</h2>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Full Name *</label>
                <input type="text" value={form.name} onChange={f("name")} placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mobile Number *</label>
                <input type="tel" value={form.phone} onChange={f("phone")} placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email</label>
                <div className="relative">
                  <input type="email" value={form.email} readOnly
                    className="w-full px-3.5 py-2.5 border border-green-300 rounded-xl text-sm bg-green-50 pr-28 text-slate-700" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={f("password")} placeholder="Min 6 characters"
                    className="w-full pr-10 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
                Next: Vehicle Details
              </button>
            </div>
          )}

          {/* Step 2: Vehicle */}
          {emailVerified && step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Bike className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h2 className="font-bold text-slate-900">Vehicle Details</h2>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Vehicle Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v.value} onClick={() => setForm(prev => ({ ...prev, vehicleType: v.value }))}
                      className={clsx(
                        "py-3 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2",
                        form.vehicleType === v.value
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                      )}>
                      <span className="text-base">{v.icon}</span> {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Vehicle Number</label>
                <input type="text" value={form.vehicleNumber} onChange={f("vehicleNumber")} placeholder="e.g. UK07AB1234"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    You will upload your documents in the next step. Admin reviews documents before activating your account.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  Back
                </button>
                <button onClick={() => registerMut.mutate()} disabled={registerMut.isPending || !step2Valid}
                  className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {registerMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {emailVerified && step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-900">KYC Documents</h2>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  Upload clear photos or scans. Any file format accepted. <strong>Required</strong> documents must be submitted before admin approval.
                </p>
              </div>

              <div className="space-y-2.5">
                {DOC_FIELDS.map(({ key, label, desc, required }) => {
                  const uploaded = docs[key];
                  const isUploading = uploadingDoc === key;
                  return (
                    <div key={key} className={clsx(
                      "rounded-xl border p-3 transition-all",
                      uploaded ? "border-green-300 bg-green-50" : required ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {uploaded
                            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            : <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                          }
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              {label}
                              {required && !uploaded && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{uploaded ? "Uploaded" : desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {uploaded && (
                            <a href={resolveMediaUrl(uploaded)} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline">
                              <Image className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileRefs.current[key]?.click()}
                            className={clsx(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                              uploaded ? "bg-green-100 text-green-700" : "bg-orange-500 text-white hover:bg-orange-600"
                            )}
                          >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {isUploading ? "..." : uploaded ? "Replace" : "Upload"}
                          </button>
                          <input
                            type="file"
                            accept="*/*"
                            className="hidden"
                            ref={el => { fileRefs.current[key] = el; }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(key, file);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Progress</span>
                  <span className="text-slate-500">{Object.keys(docs).length}/{DOC_FIELDS.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(Object.keys(docs).length / DOC_FIELDS.length) * 100}%` }} />
                </div>
              </div>

              <button onClick={handleFinish} disabled={!allRequiredUploaded || !!uploadingDoc}
                className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
                Submit Application
              </button>
              {!allRequiredUploaded && (
                <p className="text-center text-xs text-amber-600">
                  Upload all required documents to continue
                </p>
              )}
            </div>
          )}
      </AuthCard>
    </AuthShell>
  );
}
