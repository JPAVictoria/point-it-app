"use client";

import { useRef, useState } from "react";
import { BackgroundImage, LayoutConfig, PageSize, TextField as TextFieldModel } from "@/lib/print-on-top/types";
import { createEmptyLayout, createTextField } from "@/lib/print-on-top/factory";
import { clampZoom, computeFitZoom, ZOOM_STEP } from "@/lib/print-on-top/zoom";
import { useLayoutHistory } from "./useLayoutHistory";
import { Toolbar } from "./Toolbar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { PageSizeDialog } from "./PageSizeDialog";
import { PreviewDialog } from "./PreviewDialog";
import { SaveLoadDialog } from "./SaveLoadDialog";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedField = layout.fields.find((f) => f.id === selectedFieldId) ?? null;

  async function handleUploadImage(file: File) {
    try {
      const background = await readImageFile(file);
      setImageError(null);
      history.commit((current) => ({ ...current, background }));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to load image.");
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

  function handleChangePage(patch: Partial<PageSize>) {
    history.commit((current) => ({ ...current, page: { ...current.page, ...patch } }));
  }

  function handleChangeBackgroundFitMode(fitMode: BackgroundImage["fitMode"]) {
    history.commit((current) =>
      current.background
        ? { ...current, background: { ...current.background, fitMode } }
        : current
    );
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
    setZoom(
      computeFitZoom(
        container.clientWidth,
        container.clientHeight,
        layout.page.widthPt,
        layout.page.heightPt
      )
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Toolbar
        layoutName={layout.name}
        hasBackground={layout.background !== null}
        onUploadImage={handleUploadImage}
        onRemoveImage={handleRemoveImage}
        isPlacingField={isPlacingField}
        onToggleAddField={() => setIsPlacingField((v) => !v)}
        hasSelection={selectedField !== null}
        onDeleteSelected={handleDeleteSelected}
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
        onOpenPreview={() => setPreviewOpen(true)}
      />

      {imageError ? (
        <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {imageError}
        </p>
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
          onFieldDragStart={history.beginGesture}
          onFieldDragMove={handleFieldDragMove}
          onFieldDragEnd={history.endGesture}
        />
        <PropertiesPanel
          field={selectedField}
          unit={layout.page.displayUnit}
          onChange={handleFieldPropertyChange}
          onDelete={handleDeleteSelected}
        />
      </div>

      <PageSizeDialog
        open={pageSizeOpen}
        onClose={() => setPageSizeOpen(false)}
        page={layout.page}
        background={layout.background}
        onChangePage={handleChangePage}
        onChangeBackgroundFitMode={handleChangeBackgroundFitMode}
      />

      <SaveLoadDialog
        open={saveLoadOpen}
        onClose={() => setSaveLoadOpen(false)}
        layout={layout}
        onLoad={handleLoadLayout}
        onRename={handleRenameLayout}
      />

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} layout={layout} />
    </div>
  );
}
