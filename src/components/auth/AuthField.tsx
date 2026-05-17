import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
};

export default function AuthField({ label, icon, trailing, className = "", ...props }: Props) {
  const pad = icon ? "pl-12" : "pl-4";
  const padR = trailing ? "pr-12" : "pr-4";

  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium text-slate-700">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-2xl border border-slate-200/90 bg-white py-[15px] text-[16px] text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-orange-400 focus:shadow-[0_0_0_4px_rgba(251,146,60,0.12)] ${pad} ${padR} ${className}`}
        />
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </div>
  );
}
