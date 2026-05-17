import type { ReactNode } from "react";
import { Bike } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: { label: string; href: string };
};

export default function AuthShell({ title, subtitle, children, footer, backTo }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F8F9FB] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2.75rem,env(safe-area-inset-top))]">
      {backTo && (
        <Link
          to={backTo.href}
          className="mb-6 inline-flex items-center text-sm font-medium text-slate-500 active:text-orange-600"
        >
          ← {backTo.label}
        </Link>
      )}

      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-orange-500 shadow-[0_12px_32px_-8px_rgba(234,88,12,0.45)]">
            <Bike className="h-9 w-9 text-white" strokeWidth={2} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">Naini Delivery</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
        </header>

        <div className="flex-1">{children}</div>

        {footer && <footer className="mt-8 text-center text-[14px] text-slate-500">{footer}</footer>}
      </div>
    </div>
  );
}
