import { ChangeEvent, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { formatShortcut, useIsMac } from "./shortcuts";
import { LogoMark } from "./ui/LogoMark";
import { EditableTitle } from "./EditableTitle";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { SaveStatus } from "./useAutosave";

interface ToolbarProps {
  layoutName: string;
  onRenameLayout: (name: string) => void;
  saveStatus: SaveStatus;
  /** 0–1 while an image is uploading, otherwise null. */
  uploadProgress: number | null;
  pageLabel: string;
  hasBackground: boolean;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  isEditingImage: boolean;
  onAdjustImage: () => void;
  isPlacingField: boolean;
  onToggleAddField: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  onOpenPageSize: () => void;
  onOpenExport: () => void;
  isPreparingPrint: boolean;
  onPrintPreview: () => void;
  onOpenShortcuts: () => void;
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-zinc-200" />;
}

export function Toolbar({
  layoutName,
  onRenameLayout,
  saveStatus,
  uploadProgress,
  pageLabel,
  hasBackground,
  onUploadImage,
  onRemoveImage,
  isEditingImage,
  onAdjustImage,
  isPlacingField,
  onToggleAddField,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onOpenPageSize,
  onOpenExport,
  isPreparingPrint,
  onPrintPreview,
  onOpenShortcuts,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMac = useIsMac();
  const hint = (label: string, keys: string[]) => `${label}  ${formatShortcut(keys, isMac)}`;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUploadImage(file);
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-3">
      <Link
        href="/compilation"
        className="group flex h-8 shrink-0 items-center gap-1.5 rounded-md pr-2 pl-1 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Icon name="chevronLeft" size={14} className="text-zinc-400 group-hover:text-zinc-700" />
        <LogoMark size={22} />
        Compilation
      </Link>

      <Divider />

      <div className="mr-2 flex min-w-0 items-center gap-2">
        <EditableTitle value={layoutName} onChange={onRenameLayout} />
        <SaveStatusIndicator status={saveStatus} />
      </div>

      <Divider />

      <Button
        variant="ghost"
        disabled={isEditingImage || uploadProgress !== null}
        onClick={() => fileInputRef.current?.click()}
      >
        <Icon name="image" size={15} />
        {uploadProgress !== null
          ? `Uploading ${Math.round(uploadProgress * 100)}%`
          : hasBackground
            ? "Replace image"
            : "Upload image"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
      {hasBackground ? (
        <>
          <Button variant="ghost" active={isEditingImage} onClick={onAdjustImage}>
            <Icon name="crop" size={15} />
            Adjust image
          </Button>
          <Button
            variant="ghost-danger"
            size="icon"
            tooltip="Remove image"
            disabled={isEditingImage}
            onClick={onRemoveImage}
          >
            <Icon name="trash" size={15} />
          </Button>
        </>
      ) : null}

      <Button
        variant="ghost"
        active={isPlacingField}
        disabled={isEditingImage}
        tooltip={hint("Add text", ["T"])}
        onClick={onToggleAddField}
      >
        <Icon name="plus" size={15} />
        Add text
      </Button>

      <Divider />

      <Button variant="ghost" size="icon" tooltip={hint("Undo", ["mod", "Z"])} disabled={!canUndo || isEditingImage} onClick={onUndo}>
        <Icon name="undo" size={15} />
      </Button>
      <Button variant="ghost" size="icon" tooltip={hint("Redo", ["mod", "shift", "Z"])} disabled={!canRedo || isEditingImage} onClick={onRedo}>
        <Icon name="redo" size={15} />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center rounded-md border border-zinc-200 bg-white shadow-xs">
        <Button variant="ghost" size="icon" tooltip={hint("Zoom out", ["mod", "−"])} className="h-7 w-7 rounded-r-none" onClick={onZoomOut}>
          <Icon name="minus" size={14} />
        </Button>
        <Button
          variant="ghost"
          tooltip="Reset to 100%"
          className="h-7 w-14 justify-center rounded-none px-0 font-mono text-[11px] tabular-nums"
          onClick={onZoomReset}
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button variant="ghost" size="icon" tooltip={hint("Zoom in", ["mod", "+"])} className="h-7 w-7 rounded-none" onClick={onZoomIn}>
          <Icon name="plus" size={14} />
        </Button>
        <div className="h-4 w-px bg-zinc-200" />
        <Button variant="ghost" size="icon" tooltip={hint("Fit to screen", ["mod", "0"])} className="h-7 w-7 rounded-l-none" onClick={onZoomFit}>
          <Icon name="fit" size={14} />
        </Button>
      </div>

      <Divider />

      <Button variant="ghost" onClick={onOpenPageSize}>
        <Icon name="page" size={15} />
        <span className="max-w-48 truncate">{pageLabel}</span>
      </Button>
      <Button variant="ghost" onClick={onOpenExport}>
        <Icon name="download" size={15} />
        Export
      </Button>
      <Button variant="ghost" size="icon" tooltip={hint("Keyboard shortcuts", ["?"])} onClick={onOpenShortcuts}>
        <Icon name="keyboard" size={15} />
      </Button>
      <Button
        variant="primary"
        className="ml-1"
        tooltip={hint("Opens the print dialog", ["mod", "P"])}
        disabled={isPreparingPrint || isEditingImage}
        onClick={onPrintPreview}
      >
        <Icon name="eye" size={15} />
        {isPreparingPrint ? "Preparing…" : "Preview PDF"}
      </Button>
    </header>
  );
}
