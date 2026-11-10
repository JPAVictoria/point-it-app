"use client";

import { useEffect, useRef, useState } from "react";
import {
  BackgroundImage,
  ImageFrame,
  LayoutConfig,
  PageSize,
  TextField as TextFieldModel,
} from "@/lib/print-on-top/types";
import { createEmptyLayout, createTextField, duplicateTextField } from "@/lib/print-on-top/factory";
import { clampZoom, computeFitZoom, ZOOM_STEP } from "@/lib/print-on-top/zoom";
import { findPreset } from "@/lib/print-on-top/paper-sizes";
import { formatDimensions } from "@/lib/print-on-top/units";
import { fitImageFrame } from "@/lib/print-on-top/image-frame";
import { renderLayoutPreview } from "@/lib/print-on-top/pdf-renderer";
import { printPdf } from "@/lib/print-on-top/print-pdf";
import { useLayoutHistory } from "./useLayoutHistory";
import { Toolbar } from "./Toolbar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { PageSizeDialog } from "./PageSizeDialog";
import { SaveLoadDialog } from "./SaveLoadDialog";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { RULER_THICKNESS } from "./Ruler";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { isTypingTarget } from "./shortcuts";

const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Canvas padding (p-10 on each side) plus the ruler, subtracted before fitting the page. */
const CANVAS_CHROME_PX = 80 + RULER_THICKNESS;

function fitZoomFor(container: HTMLElement, pageWidthPt: number, pageHeightPt: number): number {
  return computeFitZoom(
    container.clientWidth - CANVAS_CHROME_PX,
    container.clientHeight - CANVAS_CHROME_PX,
    pageWidthPt,
    pageHeightPt
  );
}

function readImageFile(file: File): Promise<BackgroundImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("The selected file is not a readable image."));
      img.onload = () => {
        resolve({
          dataUrl,
          naturalWidthPx: img.naturalWidth,
          naturalHeightPx: img.naturalHeight,
          fitMode: "contain",
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function Editor() {
  const history = useLayoutHistory(createEmptyLayout());
  const { layout } = history;

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isPlacingField, setIsPlacingField] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [saveLoadOpen, setSaveLoadOpen] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"remove-image" | "delete-field" | null>(null);
  /** Layout as it was when "Adjust image" started; restored on Cancel. Non-null while adjusting. */
  const [imageEditSnapshot, setImageEditSnapshot] = useState<LayoutConfig | null>(null);
  const isEditingImage = imageEditSnapshot !== null;

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedField = layout.fields.find((f) => f.id === selectedFieldId) ?? null;
  const { widthPt, heightPt, displayUnit } = layout.page;
  const pageLabel = findPreset(widthPt, heightPt)?.name ?? formatDimensions(widthPt, heightPt, displayUnit);

  // Refit whenever the page dimensions change (first load, apply page size, load layout, undo).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = canvasContainerRef.current;
      if (container) setZoom(fitZoomFor(container, widthPt, heightPt));
    });
    return () => cancelAnimationFrame(frame);
  }, [widthPt, heightPt]);

  function handleStartImageEdit() {
    if (!layout.background || isEditingImage) return;
    setSelectedFieldId(null);
    setIsPlacingField(false);
    history.beginGesture();
    setImageEditSnapshot(layout);
  }

  function handleImageFrameChange(frame: ImageFrame) {
    history.setLive((current) =>
      current.background ? { ...current, background: { ...current.background, frame } } : current
    );
  }

  function handleImageFit(mode: BackgroundImage["fitMode"]) {
    history.setLive((current) =>
      current.background
        ? {
            ...current,
            background: {
              ...current.background,
              frame: fitImageFrame(current.page.widthPt, current.page.heightPt, current.background, mode),
            },
          }
        : current
    );
  }

  /** Commits the whole adjustment as a single undo step. */
  function handleImageEditDone() {
    history.endGesture();
    setImageEditSnapshot(null);
  }

  /** Keeps any adjustment made so far (so Cancel in the confirm leaves it intact), then asks to remove the image. */
  function handleDeleteImageFromEdit() {
    handleImageEditDone();
    setConfirm("remove-image");
  }

  function handleImageEditCancel() {
    if (imageEditSnapshot) history.setLive(() => imageEditSnapshot);
    history.endGesture();
    setImageEditSnapshot(null);
  }

  const anyDialogOpen = pageSizeOpen || saveLoadOpen || shortcutsOpen || confirm !== null;

  /**
   * Canva-style shortcuts. "Mod" accepts both ⌘ (Mac) and Ctrl (Windows).
   * Dialogs handle their own keys, and while typing in an input the browser's
   * native text editing (including its own undo) wins.
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (anyDialogOpen || e.defaultPrevented) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isEditingImage) {
        if (e.key === "Escape") {
          e.preventDefault();
          handleImageEditCancel();
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleImageEditDone();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleDeleteImageFromEdit();
        }
        return;
      }

      if (e.key === "Escape" && isPlacingField) {
        setIsPlacingField(false);
        return;
      }
      if (isTypingTarget(e.target)) return;

      if (mod) {
        if (key === "z") history[e.shiftKey ? "redo" : "undo"]();
        else if (key === "y") history.redo();
        else if (key === "s") setSaveLoadOpen(true);
        else if (key === "p") handlePrintPreview();
        else if (key === "d") handleDuplicateSelected();
        else if (key === "=" || key === "+") setZoom((z) => clampZoom(z + ZOOM_STEP));
        else if (key === "-") setZoom((z) => clampZoom(z - ZOOM_STEP));
        else if (key === "0") handleZoomFit();
        else return;
        e.preventDefault();
        return;
      }
      if (e.altKey) return;

      if (e.key === "Escape") setSelectedFieldId(null);
      else if (e.key === "?") setShortcutsOpen(true);
      else if (key === "t") setIsPlacingField(true);
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedFieldId) setConfirm("delete-field");
      else if (NUDGE_KEYS[e.key] && selectedField) {
        const [dx, dy] = NUDGE_KEYS[e.key];
        const step = e.shiftKey ? 10 : 1;
        handleFieldPropertyChange({
          x: Math.max(0, selectedField.x + dx * step),
          y: Math.max(0, selectedField.y + dy * step),
        });
      } else return;
      e.preventDefault();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  function handleDuplicateSelected() {
    if (!selectedField) return;
    const copy = duplicateTextField(selectedField);
    history.commit((current) => ({ ...current, fields: [...current.fields, copy] }));
    setSelectedFieldId(copy.id);
  }

  async function handleUploadImage(file: File) {
    try {
      const background = await readImageFile(file);
      setError(null);
      history.commit((current) => ({ ...current, background }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image.");
    }
  }

  /** Renders the layout (text only) and opens the browser print dialog, like oboda-app's print-on-tops. */
  async function handlePrintPreview() {
    if (isPreparingPrint) return;
    setIsPreparingPrint(true);
    try {
      printPdf(await renderLayoutPreview(layout));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the PDF.");
    } finally {
      setIsPreparingPrint(false);
    }
  }

  function handleRemoveImage() {
    history.commit((current) => ({ ...current, background: null }));
  }

  function handlePlaceField(xPt: number, yPt: number) {
    const field = createTextField(xPt, yPt);
    history.commit((current) => ({ ...current, fields: [...current.fields, field] }));
    setSelectedFieldId(field.id);
    setIsPlacingField(false);
  }

  function handleDeleteSelected() {
    if (!selectedFieldId) return;
    history.commit((current) => ({
      ...current,
      fields: current.fields.filter((f) => f.id !== selectedFieldId),
    }));
    setSelectedFieldId(null);
  }

  function handleFieldPropertyChange(patch: Partial<TextFieldModel>) {
    if (!selectedFieldId) return;
    history.commit((current) => ({
      ...current,
      fields: current.fields.map((f) => (f.id === selectedFieldId ? { ...f, ...patch } : f)),
    }));
  }

  function handleFieldDragMove(id: string, x: number, y: number) {
    history.setLive((current) => ({
      ...current,
      fields: current.fields.map((f) => (f.id === id ? { ...f, x, y } : f)),
    }));
  }

  function handleApplyPage(page: PageSize, fitMode: BackgroundImage["fitMode"] | null) {
    history.commit((current) => ({
      ...current,
      page,
      // Picking a different fit mode drops any manual adjustment so the choice takes effect.
      background:
        current.background && fitMode
          ? {
              ...current.background,
              fitMode,
              frame: fitMode === current.background.fitMode ? current.background.frame : undefined,
            }
          : current.background,
    }));
  }

  function handleRenameLayout(name: string) {
    history.setLive((current) => ({ ...current, name }));
  }

  function handleLoadLayout(loaded: LayoutConfig) {
    history.replaceAll(loaded);
    setSelectedFieldId(null);
    setIsPlacingField(false);
  }

  function handleZoomFit() {
    const container = canvasContainerRef.current;
    if (!container) return;
    setZoom(fitZoomFor(container, widthPt, heightPt));
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Toolbar
        layoutName={layout.name}
        pageLabel={pageLabel}
        hasBackground={layout.background !== null}
        onUploadImage={handleUploadImage}
        onRemoveImage={() => setConfirm("remove-image")}
        isEditingImage={isEditingImage}
        onAdjustImage={handleStartImageEdit}
        isPlacingField={isPlacingField}
        onToggleAddField={() => setIsPlacingField((v) => !v)}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
        onZoomReset={() => setZoom(1)}
        onZoomFit={handleZoomFit}
        onOpenPageSize={() => setPageSizeOpen(true)}
        onOpenSaveLoad={() => setSaveLoadOpen(true)}
        isPreparingPrint={isPreparingPrint}
        onPrintPreview={handlePrintPreview}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {error ? (
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
          <button
            type="button"
            className="cursor-pointer font-medium hover:underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <Canvas
          containerRef={canvasContainerRef}
          layout={layout}
          zoom={zoom}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          isPlacingField={isPlacingField}
          onPlaceField={handlePlaceField}
          onCancelPlacing={() => setIsPlacingField(false)}
          isEditingImage={isEditingImage}
          onStartImageEdit={handleStartImageEdit}
          onImageFrameChange={handleImageFrameChange}
          onImageFit={handleImageFit}
          onImageEditCancel={handleImageEditCancel}
          onImageEditDone={handleImageEditDone}
          onImageDelete={handleDeleteImageFromEdit}
          onFieldDragStart={history.beginGesture}
          onFieldDragMove={handleFieldDragMove}
          onFieldDragEnd={history.endGesture}
        />
        <PropertiesPanel
          fields={layout.fields}
          selectedField={selectedField}
          unit={displayUnit}
          onSelectField={setSelectedFieldId}
          onChange={handleFieldPropertyChange}
          onDelete={() => setConfirm("delete-field")}
        />
      </div>

      <PageSizeDialog
        open={pageSizeOpen}
        onClose={() => setPageSizeOpen(false)}
        page={layout.page}
        background={layout.background}
        onApply={handleApplyPage}
      />

      <SaveLoadDialog
        open={saveLoadOpen}
        onClose={() => setSaveLoadOpen(false)}
        layout={layout}
        onLoad={handleLoadLayout}
        onRename={handleRenameLayout}
      />

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />


      <ConfirmDialog
        open={confirm === "remove-image"}
        title="Remove reference image?"
        message="Field positions are kept. You can undo this."
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          handleRemoveImage();
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm === "delete-field"}
        title="Delete field?"
        message={
          selectedField ? (
            <>
              <span className="font-medium text-zinc-900">{selectedField.sampleValue || selectedField.label}</span>{" "}
              will be removed from the layout. You can undo this.
            </>
          ) : null
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          handleDeleteSelected();
          setConfirm(null);
        }}
      />
    </div>
  );
}
