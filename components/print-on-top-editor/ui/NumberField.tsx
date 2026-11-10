import { KeyboardEvent, useId, useState } from "react";
import { CONTROL_CLASS, LABEL_CLASS } from "./styles";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Amount ArrowUp/ArrowDown changes the value by (Shift multiplies by 10). */
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/**
 * Text input that edits a number without the browser's native spinner.
 * Keeps its own text so partial input like "1." or "-" survives typing,
 * and resyncs whenever the value changes from outside.
 */
export function NumberField({ label, value, onChange, step = 1, min, max, suffix }: NumberFieldProps) {
  const id = useId();
  const display = Number.isFinite(value) ? String(value) : "0";
  const [text, setText] = useState(display);
  const [syncedDisplay, setSyncedDisplay] = useState(display);

  if (display !== syncedDisplay) {
    setSyncedDisplay(display);
    if (Number(text) !== value) setText(display);
  }

  function handleChange(raw: string) {
    setText(raw);
    const parsed = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const delta = (e.key === "ArrowUp" ? step : -step) * (e.shiftKey ? 10 : 1);
    const decimals = (String(step).split(".")[1] ?? "").length;
    const next = clamp(Number((value + delta).toFixed(decimals)), min, max);
    setText(String(next));
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={`${CONTROL_CLASS} font-mono text-[12px] tabular-nums ${suffix ? "pr-9" : ""}`}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setText(display)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-zinc-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
