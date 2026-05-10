import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { deliveryRegister } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import { Bike, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const VEHICLE_TYPES = ["BIKE", "SCOOTER", "CYCLE", "CAR"];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "",
    vehicleType: "BIKE", vehicleNumber: "",
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: () => deliveryRegister(form),
    onSuccess: (data) => {
      login(data);
      navigate("/dashboard", { replace: true });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const step1Valid = form.name && form.phone.length === 10 && form.password.length >= 6;
  const step2Valid = form.vehicleType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Become a Delivery Partner</h1>
          <p className="text-white/50 text-sm mt-1">Step {step} of 2</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={clsx(
              "flex-1 h-1.5 rounded-full transition-all",
              s <= step ? "bg-orange-500" : "bg-white/20"
            )} />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-bold text-slate-900">Personal Details</h2>
              {[
                { key: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
                { key: "phone", label: "Mobile Number", placeholder: "10-digit number", type: "tel" },
                { key: "email", label: "Email (optional)", placeholder: "your@email.com", type: "email" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={f(key as keyof typeof form)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={f("password")}
                    placeholder="Min 6 characters"
                    className="w-full pr-10 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Next: Vehicle Details
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold text-slate-900">Vehicle Details</h2>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button
                      key={v}
                      onClick={() => setForm(f => ({ ...f, vehicleType: v }))}
                      className={clsx(
                        "py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                        form.vehicleType === v
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Vehicle Number (optional)</label>
                <input
                  type="text"
                  value={form.vehicleNumber}
                  onChange={f("vehicleNumber")}
                  placeholder="e.g. UK07AB1234"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Your account will be reviewed by admin before activation. You can still log in and update your profile.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={() => mut.mutate()}
                  disabled={mut.isPending || !step2Valid}
                  className="flex-1 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register
                </button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
