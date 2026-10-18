interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
}: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <div className="flex items-center gap-1">
        <input
          type="number"
          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const next = e.target.valueAsNumber;
            onChange(Number.isFinite(next) ? next : 0);
          }}
        />
        {suffix ? <span className="text-xs text-zinc-400">{suffix}</span> : null}
      </div>
    </label>
  );
}
