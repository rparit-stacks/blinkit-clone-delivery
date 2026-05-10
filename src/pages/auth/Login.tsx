import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { deliveryLogin } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import { Bike, Phone, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const mut = useMutation({
    mutationFn: () => deliveryLogin(phone, password),
    onSuccess: (data) => {
      login(data);
      navigate("/dashboard", { replace: true });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Delivery Partner</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && mut.mutate()}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !phone || !password}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>

          <p className="text-center text-sm text-slate-500">
            New partner?{" "}
            <Link to="/register" className="text-orange-500 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
