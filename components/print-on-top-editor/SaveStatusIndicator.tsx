import { SaveStatus } from "./useAutosave";

const LABELS: Record<SaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  retrying: "Offline – retrying",
  conflict: "Changed elsewhere",
  failed: "Not saved",
};

const DOT_CLASSES: Record<SaveStatus, string> = {
  saved: "bg-emerald-500",
  unsaved: "bg-zinc-300",
  saving: "bg-zinc-400 animate-pulse",
  retrying: "bg-amber-500",
  conflict: "bg-red-500",
  failed: "bg-red-500",
};

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-zinc-400">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[status]}`} />
      {LABELS[status]}
    </span>
  );
}
