interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      <span className="flex flex-col">
        <span className="text-[13px] font-medium text-zinc-800">{label}</span>
        {description ? <span className="text-[11px] text-zinc-400">{description}</span> : null}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-zinc-900" : "bg-zinc-200 group-hover:bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
    </button>
  );
}
