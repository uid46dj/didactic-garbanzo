interface Props {
  step: number;
  total: number;
  title: string;
  subtitle: string;
}

export default function StepHeader({ step, total, title, subtitle }: Props) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-indigo-500" : "bg-slate-800"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        Step {step} of {total}
      </p>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
