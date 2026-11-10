import { LABEL_CLASS } from "./styles";

interface SegmentedControlProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className={LABEL_CLASS}>{label}</span> : null}
      <div role="radiogroup" aria-label={label} className="flex h-8 rounded-md bg-zinc-100 p-0.5">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option.value)}
              className={`flex-1 cursor-pointer rounded-[5px] px-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 ${
                checked ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
