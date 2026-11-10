import { FormEvent, useEffect, useState } from "react";
import { FieldPosition, LayoutConfig } from "@/lib/print-on-top/types";
import {
  deleteLayoutLocally,
  exportFieldPositionsToJson,
  listLocalLayouts,
  saveLayoutLocally,
} from "@/lib/print-on-top/storage";
import { computeFieldPositions } from "@/lib/print-on-top/pdf-renderer";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Icon } from "./ui/Icon";
import { TextField } from "./ui/TextField";

interface SaveLoadDialogProps {
  open: boolean;
  onClose: () => void;
  layout: LayoutConfig;
  onLoad: (layout: LayoutConfig) => void;
  onRename: (name: string) => void;
}

type PendingAction = { id: string; kind: "load" | "delete" } | null;

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-2.5 flex flex-col gap-0.5">
      <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
      {description ? <p className="text-[11px] leading-snug text-zinc-500">{description}</p> : null}
    </div>
  );
}

function ExportSection({ layout }: { layout: LayoutConfig }) {
  const [positions, setPositions] = useState<FieldPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    computeFieldPositions(layout)
      .then((result) => {
        if (!cancelled) setPositions(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not compute positions.");
      });
    return () => {
      cancelled = true;
    };
  }, [layout]);

  const json = positions ? exportFieldPositionsToJson(positions) : "";

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layout.name.replace(/[^a-z0-9-_]+/gi, "_") || "layout"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(json)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setError("Clipboard access was blocked by the browser."));
  }

  return (
    <section>
      <SectionHeading
        title="Export JSON"
        description="Each field's text with x / y in PDF points (bottom-left origin, baseline) — the values page.drawText expects."
      />
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <pre className="max-h-44 overflow-auto bg-zinc-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-zinc-700">
          {error ? <span className="text-red-600">{error}</span> : positions ? json : "Computing…"}
        </pre>
        <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-2 py-1.5">
          <span className="pl-1 text-[11px] text-zinc-400">
            {positions ? `${positions.length} field${positions.length === 1 ? "" : "s"}` : ""}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={!positions} onClick={handleCopy}>
              <Icon name={copied ? "check" : "copy"} size={13} />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" disabled={!positions} onClick={handleDownload}>
              <Icon name="download" size={13} />
              Download
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mounted fresh each time the dialog opens, so the saved-layouts list and name draft are read once at mount. */
function SaveLoadContent({ layout, onLoad, onRename, onClose }: Omit<SaveLoadDialogProps, "open">) {
  const [savedLayouts, setSavedLayouts] = useState<LayoutConfig[]>(() => listLocalLayouts());
  const [name, setName] = useState(layout.name);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const trimmedName = name.trim();

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!trimmedName) return;
    const updatedAt = new Date().toISOString();
    saveLayoutLocally({ ...layout, name: trimmedName, updatedAt });
    onRename(trimmedName);
    setSavedLayouts(listLocalLayouts());
    setSavedAt(updatedAt);
  }

  function handleConfirm(target: LayoutConfig) {
    if (pending?.kind === "delete") {
      deleteLayoutLocally(target.id);
      setSavedLayouts(listLocalLayouts());
      setPending(null);
      return;
    }
    onLoad(target);
    onClose();
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading title="Save" description="Stored in this browser only." />
        <form onSubmit={handleSave} className="flex items-end gap-2">
          <div className="flex-1">
            <TextField label="Layout name" value={name} onChange={setName} />
          </div>
          <Button type="submit" variant="primary" disabled={!trimmedName}>
            Save
          </Button>
        </form>
        {savedAt ? (
          <p className="animate-fade-in mt-2 flex items-center gap-1 text-[11px] text-emerald-600">
            <Icon name="check" size={12} />
            Saved at {new Date(savedAt).toLocaleTimeString()}
          </p>
        ) : null}
      </section>

      <ExportSection layout={layout} />

      <section>
        <SectionHeading title="Saved layouts" />
        {savedLayouts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">
            No layouts saved yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {savedLayouts.map((l) => {
              const isPending = pending?.id === l.id;
              return (
                <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  {isPending ? (
                    <>
                      <span className="text-xs text-zinc-600">
                        {pending.kind === "delete"
                          ? `Delete “${l.name}”?`
                          : "Replace the current layout? Unsaved changes are lost."}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant={pending.kind === "delete" ? "danger" : "primary"}
                          onClick={() => handleConfirm(l)}
                        >
                          {pending.kind === "delete" ? "Delete" : "Load"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-medium text-zinc-800">{l.name}</span>
                        <span className="text-[11px] text-zinc-400">
                          {l.fields.length} field{l.fields.length === 1 ? "" : "s"} ·{" "}
                          {new Date(l.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" onClick={() => setPending({ id: l.id, kind: "load" })}>
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost-danger"
                          aria-label={`Delete ${l.name}`}
                          onClick={() => setPending({ id: l.id, kind: "delete" })}
                        >
                          <Icon name="trash" size={13} />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function SaveLoadDialog({ open, onClose, layout, onLoad, onRename }: SaveLoadDialogProps) {
  return (
    <Dialog
      title="Layouts"
      open={open}
      onClose={onClose}
      widthClassName="max-w-lg"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {open ? <SaveLoadContent layout={layout} onClose={onClose} onLoad={onLoad} onRename={onRename} /> : null}
    </Dialog>
  );
}
