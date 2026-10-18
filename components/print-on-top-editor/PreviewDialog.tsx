import { useEffect, useState } from "react";
import { LayoutConfig } from "@/lib/print-on-top/types";
import { renderLayoutPreview } from "@/lib/print-on-top/pdf-renderer";
import { Dialog } from "./ui/Dialog";

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  layout: LayoutConfig;
}

/**
 * Mounted fresh each time the dialog opens (see PreviewDialog below), so its
 * own initial state is always null/loading — no effect-driven reset needed.
 */
function PreviewContent({ layout }: { layout: LayoutConfig }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    renderLayoutPreview(layout)
      .then((bytes) => {
        if (cancelled) return;
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to generate PDF preview.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [layout]);

  return (
    <div className="flex h-[70vh] flex-col gap-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && !url ? <p className="text-sm text-zinc-400">Generating preview…</p> : null}
      {url ? (
        <>
          <iframe title="PDF preview" src={url} className="h-full w-full rounded border border-zinc-200" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-xs font-medium text-blue-600 hover:underline"
          >
            Open in new tab
          </a>
        </>
      ) : null}
    </div>
  );
}

export function PreviewDialog({ open, onClose, layout }: PreviewDialogProps) {
  return (
    <Dialog title="PDF preview" open={open} onClose={onClose} widthClassName="max-w-3xl">
      {open ? <PreviewContent layout={layout} /> : null}
    </Dialog>
  );
}
