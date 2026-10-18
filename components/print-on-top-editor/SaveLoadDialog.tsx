import { ChangeEvent, useRef, useState } from "react";
import { LayoutConfig } from "@/lib/print-on-top/types";
import {
  deleteLayoutLocally,
  exportLayoutToJson,
  importLayoutFromJson,
  listLocalLayouts,
  saveLayoutLocally,
} from "@/lib/print-on-top/storage";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { TextField } from "./ui/TextField";

interface SaveLoadDialogProps {
  open: boolean;
  onClose: () => void;
  layout: LayoutConfig;
  onLoad: (layout: LayoutConfig) => void;
  onRename: (name: string) => void;
}

/** Mounted fresh each time the dialog opens, so the saved-layouts list is read once at mount. */
function SaveLoadContent({
  onClose,
  layout,
  onLoad,
  onRename,
}: Omit<SaveLoadDialogProps, "open">) {
  const [savedLayouts, setSavedLayouts] = useState<LayoutConfig[]>(() => listLocalLayouts());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    setSavedLayouts(listLocalLayouts());
  }

  function handleSave() {
    saveLayoutLocally({ ...layout, updatedAt: new Date().toISOString() });
    refresh();
  }

  function handleDelete(id: string) {
    deleteLayoutLocally(id);
    refresh();
  }

  function handleExport() {
    const json = exportLayoutToJson(layout);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layout.name.replace(/[^a-z0-9-_]+/gi, "_") || "layout"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    file
      .text()
      .then((text) => {
        const imported = importLayoutFromJson(text);
        onLoad(imported);
        setError(null);
        onClose();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not import file."));
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField label="Layout name" value={layout.name} onChange={onRename} />

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleSave}>
          Save to browser
        </Button>
        <Button onClick={handleExport}>Export JSON</Button>
        <Button onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div>
        <h3 className="mb-1 text-xs font-semibold text-zinc-500">Saved in this browser</h3>
        {savedLayouts.length === 0 ? (
          <p className="text-xs text-zinc-400">No layouts saved yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {savedLayouts.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded border border-zinc-200 px-2 py-1.5 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-800">{l.name}</span>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(l.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => {
                      onLoad(l);
                      onClose();
                    }}
                  >
                    Load
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(l.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SaveLoadDialog({ open, onClose, layout, onLoad, onRename }: SaveLoadDialogProps) {
  return (
    <Dialog title="Save / load layout" open={open} onClose={onClose}>
      {open ? (
        <SaveLoadContent layout={layout} onClose={onClose} onLoad={onLoad} onRename={onRename} />
      ) : null}
    </Dialog>
  );
}
