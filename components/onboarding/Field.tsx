import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-widest text-muted">
        {label}
      </span>
      {hint && <span className="mt-1 block text-sm text-ink-600">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-rule bg-paper px-4 py-3 font-display text-lg text-ink placeholder:text-muted/60 focus:border-accent focus:ring-0"
    />
  );
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
              selected
                ? "border-ink bg-ink text-cream-50 shadow-card"
                : "border-rule bg-paper text-ink hover:border-ink/40"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
