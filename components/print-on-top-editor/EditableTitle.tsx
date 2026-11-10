import { useState } from "react";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Layout name in the toolbar. Click to rename; Enter or the check button
 * saves, Esc or the x button cancels, clicking away saves. Blank names
 * are rejected and fall back to the previous name.
 */
export function EditableTitle({ value, onChange }: EditableTitleProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function save() {
    if (draft === null) return;
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    setDraft(null);
  }

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(value)}
        className="group flex h-7 max-w-64 min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[13px] font-semibold tracking-tight text-zinc-900 transition-colors hover:bg-zinc-100"
        aria-label={`Rename layout: ${value}`}
      >
        <span className="truncate">{value}</span>
        <Icon name="pencil" size={12} className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-0.5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <input
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setDraft(null);
          }
        }}
        size={Math.max(12, draft.length + 1)}
        maxLength={80}
        aria-label="Layout name"
        className="h-7 max-w-72 rounded-md border border-zinc-300 bg-white px-1.5 text-[13px] font-semibold tracking-tight text-zinc-900 shadow-xs outline-none focus:border-zinc-400 focus:ring-3 focus:ring-zinc-900/5"
      />
      {/* onMouseDown preventDefault keeps the input focused so blur doesn't fire first. */}
      <Button type="submit" variant="ghost" size="icon" className="h-7 w-7" aria-label="Save name" onMouseDown={(e) => e.preventDefault()}>
        <Icon name="check" size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Cancel rename"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setDraft(null)}
      >
        <Icon name="close" size={14} />
      </Button>
    </form>
  );
}
