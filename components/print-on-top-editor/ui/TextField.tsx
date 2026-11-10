import { useId } from "react";
import { CONTROL_CLASS, LABEL_CLASS } from "./styles";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  autoFocus?: boolean;
}

export function TextField({ label, value, onChange, placeholder, mono, autoFocus }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        className={`${CONTROL_CLASS} ${mono ? "font-mono text-[12px]" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
