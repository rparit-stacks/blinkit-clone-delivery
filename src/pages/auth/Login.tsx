import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { deliveryLogin } from "../../api/deliveryApi";
import { useAuth } from "../../context/AuthContext";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "../../components/auth/AuthShell";
import AuthCard from "../../components/auth/AuthCard";
import AuthField from "../../components/auth/AuthField";
import AuthButton from "../../components/auth/AuthButton";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const mut = useMutation({
    mutationFn: () => deliveryLogin(phone.trim(), password),
    onSuccess: (data) => {
      login(data);
      navigate("/dashboard", { replace: true });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const canSubmit = phone.trim().length >= 10 && password.length > 0;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to view deliveries and track your earnings"
      footer={
        <>
          New partner?{" "}
          <Link to="/register" className="font-semibold text-orange-600">
            Create account
          </Link>
        </>
      }
    >
      <AuthCard>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mut.mutate();
          }}
        >
          <AuthField
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit number"
            icon={<Phone className="h-[18px] w-[18px]" />}
          />

          <AuthField
            label="Password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="rounded-lg p-2 text-slate-400 active:bg-slate-100"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            }
          />

          <AuthButton buttonType="submit" loading={mut.isPending} disabled={!canSubmit}>
            Sign in
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
