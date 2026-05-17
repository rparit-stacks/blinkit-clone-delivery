import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  loading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary";
  buttonType?: "button" | "submit" | "reset";
};

export default function AuthButton({
  loading,
  children,
  variant = "primary",
  className = "",
  disabled,
  buttonType = "button",
  ...props
}: Props) {
  const base =
    variant === "primary"
      ? "bg-orange-500 text-white shadow-[0_8px_24px_-6px_rgba(234,88,12,0.5)] active:bg-orange-600"
      : "border border-slate-200 bg-white text-slate-700 active:bg-slate-50";

  return (
    <button
      type={buttonType}
      disabled={disabled || loading}
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${base} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
