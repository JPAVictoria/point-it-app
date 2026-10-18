import { ChangeEvent, useRef } from "react";
import { Button } from "./ui/Button";

interface ToolbarProps {
  layoutName: string;
  hasBackground: boolean;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  isPlacingField: boolean;
  onToggleAddField: () => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
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
  onOpenSaveLoad: () => void;
  onOpenPreview: () => void;
}

export function Toolbar({
  layoutName,
  hasBackground,
  onUploadImage,
  onRemoveImage,
  isPlacingField,
  onToggleAddField,
  hasSelection,
  onDeleteSelected,
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
  onOpenSaveLoad,
  onOpenPreview,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUploadImage(file);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
      <span className="mr-2 text-sm font-semibold text-zinc-900">{layoutName}</span>

      <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
        <Button onClick={() => fileInputRef.current?.click()}>
          {hasBackground ? "Replace image" : "Upload image"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
        {hasBackground ? (
          <Button variant="ghost" onClick={onRemoveImage}>
            Remove image
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
        <Button active={isPlacingField} onClick={onToggleAddField}>
          {isPlacingField ? "Click page to place…" : "Add text"}
        </Button>
        <Button variant="danger" disabled={!hasSelection} onClick={onDeleteSelected}>
          Delete field
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
        <Button disabled={!canUndo} onClick={onUndo}>
          Undo
        </Button>
        <Button disabled={!canRedo} onClick={onRedo}>
          Redo
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
        <Button onClick={onZoomOut}>−</Button>
        <span className="w-12 text-center text-xs text-zinc-500">{Math.round(zoom * 100)}%</span>
        <Button onClick={onZoomIn}>+</Button>
        <Button onClick={onZoomReset}>100%</Button>
        <Button onClick={onZoomFit}>Fit</Button>
      </div>

      <div className="flex items-center gap-1">
        <Button onClick={onOpenPageSize}>Page size</Button>
        <Button onClick={onOpenSaveLoad}>Save / Load</Button>
        <Button variant="primary" onClick={onOpenPreview}>
          Preview PDF
        </Button>
      </div>
    </div>
  );
}
