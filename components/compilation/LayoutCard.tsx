"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutSummary } from "@/lib/print-on-top/types";
import { findPreset } from "@/lib/print-on-top/paper-sizes";
import { formatDimensions } from "@/lib/print-on-top/units";
import { deleteLayoutAction, duplicateLayoutAction } from "@/app/actions/layouts";
import { Button } from "@/components/print-on-top-editor/ui/Button";
import { ConfirmDialog } from "@/components/print-on-top-editor/ui/ConfirmDialog";
import { Icon } from "@/components/print-on-top-editor/ui/Icon";
import { useAuthorName } from "./AuthorName";
import { LayoutThumbnail } from "./LayoutThumbnail";
import { RelativeTime } from "./RelativeTime";

export function LayoutCard({ layout }: { layout: LayoutSummary }) {
  const router = useRouter();
  const { requestAuthorName } = useAuthorName();
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { widthPt, heightPt, displayUnit } = layout.page;
  const pageLabel = findPreset(widthPt, heightPt)?.name ?? formatDimensions(widthPt, heightPt, displayUnit);
  const fieldCount = layout.fields.length;

  async function handleDuplicate() {
    const choice = await requestAuthorName();
    if (!choice.proceed) return;
    setBusy("duplicate");
    setError(null);
    const result = await duplicateLayoutAction(layout.id, choice.name);
    if (result.ok) {
      router.push(`/layouts/${result.data.id}`);
      return;
    }
    setError(result.error);
    setBusy(null);
  }

  async function handleDelete() {
    setConfirmDelete(false);
    setBusy("delete");
    setError(null);
    const result = await deleteLayoutAction(layout.id);
    // On success the action revalidates /compilation and this card disappears.
    if (!result.ok) setError(result.error);
    setBusy(null);
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg hover:shadow-zinc-900/5 ${busy === "delete" ? "opacity-50" : ""}`}
    >
      <Link href={`/layouts/${layout.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20">
        <LayoutThumbnail layout={layout} />
        <div className="flex flex-col gap-1 border-t border-zinc-100 px-3.5 py-3">
          <h2 className="truncate text-[13px] font-semibold tracking-tight text-zinc-900">{layout.name}</h2>
          <p className="truncate text-[11px] text-zinc-500">
            {pageLabel} · {fieldCount} field{fieldCount === 1 ? "" : "s"}
          </p>
          <p className="flex items-center gap-1 truncate text-[11px] text-zinc-400">
            {layout.authorName ? (
              <>
                <span className="truncate font-medium text-zinc-600">{layout.authorName}</span>
                <span>·</span>
              </>
            ) : null}
            <RelativeTime iso={layout.updatedAt} />
          </p>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
        </div>
      </Link>

      <div className="absolute top-2 right-2 flex gap-1 rounded-lg bg-white/90 p-0.5 opacity-0 shadow-sm ring-1 ring-zinc-900/5 backdrop-blur transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          tooltip="Duplicate"
          disabled={busy !== null}
          onClick={handleDuplicate}
        >
          <Icon name="copy" size={14} />
        </Button>
        <Button
          variant="ghost-danger"
          size="icon"
          className="h-7 w-7"
          tooltip="Delete"
          disabled={busy !== null}
          onClick={() => setConfirmDelete(true)}
        >
          <Icon name="trash" size={14} />
        </Button>
      </div>

      {busy === "duplicate" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-zinc-600">
          Duplicating…
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete layout?"
        message={
          <>
            <span className="font-medium text-zinc-900">{layout.name}</span> will be removed from the Compilation for
            everyone.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </article>
  );
}
