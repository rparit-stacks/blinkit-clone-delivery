import clsx from "clsx";

type Step = { id: number; label: string };

export default function StepDots({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
                current > s.id && "bg-green-500 text-white",
                current === s.id && "bg-orange-500 text-white",
                current < s.id && "bg-slate-200 text-slate-500"
              )}
            >
              {current > s.id ? "✓" : s.id}
            </div>
            <span
              className={clsx(
                "text-[10px] font-medium",
                current >= s.id ? "text-slate-700" : "text-slate-400"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={clsx("mb-4 h-0.5 w-6 rounded-full", current > s.id ? "bg-green-400" : "bg-slate-200")}
            />
          )}
        </div>
      ))}
    </div>
  );
}
