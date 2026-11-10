import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "ghost-danger";
type Size = "sm" | "md" | "icon";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
  secondary: "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-xs",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  "ghost-danger": "bg-transparent text-zinc-500 hover:bg-red-50 hover:text-red-600",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-[13px]",
  icon: "h-8 w-8 justify-center",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
  /** Shown as a hover tooltip below the button; also used as the accessible label for icon-only buttons. */
  tooltip?: string;
}

export function Button({
  variant = "secondary",
  size = "md",
  active,
  tooltip,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={size === "icon" ? tooltip : undefined}
      aria-pressed={active}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${active ? "bg-zinc-900! text-white! hover:bg-zinc-800!" : ""} ${className}`}
      {...props}
    />
  );

  if (!tooltip) return button;

  return (
    <span className="group/tooltip relative inline-flex">
      {button}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-40 mt-1.5 -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity delay-0 group-hover/tooltip:opacity-100 group-hover/tooltip:delay-300"
      >
        {tooltip}
      </span>
    </span>
  );
}
