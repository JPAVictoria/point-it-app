import { useEffect, useState } from "react";
import { FieldPosition, LayoutConfig } from "@/lib/print-on-top/types";
import { exportFieldPositionsToJson } from "@/lib/print-on-top/export";
import { computeFieldPositions } from "@/lib/print-on-top/pdf-renderer";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Icon } from "./ui/Icon";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  layout: LayoutConfig;
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
      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        Each field&apos;s text with x / y in PDF points (bottom-left origin, baseline) — the values{" "}
        <code className="font-mono text-[11px] text-zinc-700">page.drawText</code> expects.
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <pre className="max-h-80 overflow-auto bg-zinc-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-zinc-700">
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

export function ExportDialog({ open, onClose, layout }: ExportDialogProps) {
  return (
    <Dialog
      title="Export JSON"
      open={open}
      onClose={onClose}
      widthClassName="max-w-lg"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {open ? <ExportSection layout={layout} /> : null}
    </Dialog>
  );
}
