export function ProgressBar({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="w-full">
      <div className="flex items-end justify-between text-xs text-muted">
        {labels.map((label, i) => {
          const active = i + 1 <= step;
          const current = i + 1 === step;
          return (
            <div
              key={label}
              className={`flex flex-1 flex-col items-start gap-1 ${
                i === labels.length - 1 ? "items-end" : ""
              }`}
            >
              <span
                className={`text-[11px] font-medium uppercase tracking-widest ${
                  current ? "text-accent" : active ? "text-ink" : "text-muted"
                }`}
              >
                {`0${i + 1}`.slice(-2)} · {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const active = i + 1 <= step;
          return (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
                active ? "bg-ink" : "bg-rule"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
