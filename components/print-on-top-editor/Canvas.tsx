import Image from "next/image";
import { MouseEvent as ReactMouseEvent, RefObject, useState } from "react";
import { ImageFrame, LayoutConfig } from "@/lib/print-on-top/types";
import { fromPoints, roundForUnit } from "@/lib/print-on-top/units";
import { resolveImageFrame } from "@/lib/print-on-top/image-frame";
import { FieldBox } from "./FieldBox";
import { ImageTransformer } from "./ImageTransformer";
import { Ruler, RULER_THICKNESS } from "./Ruler";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

interface CanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  layout: LayoutConfig;
  /** Displayable URL for the layout's reference image; null if it couldn't be loaded. */
  imageSrc: string | null;
  zoom: number;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  isPlacingField: boolean;
  onPlaceField: (xPt: number, yPt: number) => void;
  onCancelPlacing: () => void;
  isEditingImage: boolean;
  onStartImageEdit: () => void;
  onImageFrameChange: (frame: ImageFrame) => void;
  onImageFit: (mode: "contain" | "stretch") => void;
  onImageEditCancel: () => void;
  onImageEditDone: () => void;
  onImageDelete: () => void;
  onFieldDragStart: () => void;
  onFieldDragMove: (id: string, xPt: number, yPt: number) => void;
  onFieldDragEnd: () => void;
}

function isInsideFrame(frame: ImageFrame, xPt: number, yPt: number): boolean {
  return xPt >= frame.x && xPt <= frame.x + frame.width && yPt >= frame.y && yPt <= frame.y + frame.height;
}

export function Canvas({
  containerRef,
  layout,
  imageSrc,
  zoom,
  selectedFieldId,
  onSelectField,
  isPlacingField,
  onPlaceField,
  onCancelPlacing,
  isEditingImage,
  onStartImageEdit,
  onImageFrameChange,
  onImageFit,
  onImageEditCancel,
  onImageEditDone,
  onImageDelete,
  onFieldDragStart,
  onFieldDragMove,
  onFieldDragEnd,
}: CanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveringImage, setHoveringImage] = useState(false);
  const { widthPt, heightPt, displayUnit } = layout.page;
  const pageWidthPx = widthPt * zoom;
  const pageHeightPx = heightPt * zoom;

  const selectedField = layout.fields.find((f) => f.id === selectedFieldId) ?? null;
  const imageFrame = layout.background ? resolveImageFrame(widthPt, heightPt, layout.background) : null;
  const frameStyle = imageFrame
    ? {
        left: imageFrame.x * zoom,
        top: imageFrame.y * zoom,
        width: imageFrame.width * zoom,
        height: imageFrame.height * zoom,
      }
    : undefined;

  function handlePageClick(e: ReactMouseEvent<HTMLDivElement>) {
    // Clicks on the image itself are swallowed by the transformer, so this is a click outside it.
    if (isEditingImage) {
      onImageEditDone();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPt = (e.clientX - rect.left) / zoom;
    const yPt = (e.clientY - rect.top) / zoom;
    if (isPlacingField) {
      onPlaceField(xPt, yPt);
      return;
    }
    onSelectField(null);
    // Like Canva: clicking the image selects it and shows its resize handles.
    if (imageFrame && isInsideFrame(imageFrame, xPt, yPt)) onStartImageEdit();
  }

  const isOverImage = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!imageFrame) return false;
    const rect = e.currentTarget.getBoundingClientRect();
    return isInsideFrame(imageFrame, (e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom);
  };

  function formatCoord(pt: number): string {
    return roundForUnit(fromPoints(pt, displayUnit), displayUnit).toString();
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div ref={containerRef} className="absolute inset-0 overflow-auto bg-zinc-100">
        <div className="grid min-h-full min-w-max place-items-center p-10">
          <div
            className="grid"
            style={{ gridTemplateColumns: `${RULER_THICKNESS}px auto`, gridTemplateRows: `${RULER_THICKNESS}px auto` }}
          >
            <div className="border-r border-b border-zinc-200 bg-white" />
            <Ruler
              orientation="horizontal"
              lengthPt={widthPt}
              scale={zoom}
              unit={displayUnit}
              markerPt={selectedField?.x}
            />
            <Ruler
              orientation="vertical"
              lengthPt={heightPt}
              scale={zoom}
              unit={displayUnit}
              markerPt={selectedField?.y}
            />
            <div
              onClick={handlePageClick}
              onMouseMove={(e) => {
                const over = !isPlacingField && !isEditingImage && isOverImage(e);
                if (over !== hoveringImage) setHoveringImage(over);
              }}
              onMouseLeave={() => setHoveringImage(false)}
              className="relative bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_-6px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/5"
              style={{
                width: pageWidthPx,
                height: pageHeightPx,
                cursor: isPlacingField ? "crosshair" : hoveringImage ? "pointer" : "default",
              }}
            >
              {layout.background ? (
                <>
                  {hoveringImage ? (
                    <div
                      className="pointer-events-none absolute z-10 outline-2 outline-blue-400/70 outline-solid"
                      style={frameStyle}
                    />
                  ) : null}
                  {/* While adjusting, show the part of the image that falls outside the page, faded. */}
                  {isEditingImage && imageSrc ? (
                    <div className="pointer-events-none absolute opacity-25" style={frameStyle}>
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        unoptimized
                        draggable={false}
                        className="select-none"
                        style={{ objectFit: "fill" }}
                      />
                    </div>
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute" style={frameStyle}>
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt="Form background reference"
                          fill
                          unoptimized
                          draggable={false}
                          className="select-none"
                          style={{ objectFit: "fill" }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-xs text-zinc-400">
                          Image unavailable — try reloading
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-300">
                  <Icon name="image" size={28} />
                  <span className="text-xs text-zinc-400">Upload a scan of the form to trace over</span>
                </div>
              )}

              <div className={isEditingImage ? "pointer-events-none opacity-40" : undefined}>
                {layout.fields.map((field) => (
                  <FieldBox
                    key={field.id}
                    field={field}
                    scale={zoom}
                    pageWidthPt={widthPt}
                    pageHeightPt={heightPt}
                    selected={field.id === selectedFieldId}
                    onSelect={() => onSelectField(field.id)}
                    onDragStart={() => {
                      setIsDragging(true);
                      onFieldDragStart();
                    }}
                    onDragMove={(x, y) => onFieldDragMove(field.id, x, y)}
                    onDragEnd={() => {
                      setIsDragging(false);
                      onFieldDragEnd();
                    }}
                  />
                ))}
              </div>

              {isEditingImage && imageFrame ? (
                <ImageTransformer
                  frame={imageFrame}
                  scale={zoom}
                  unit={displayUnit}
                  onChange={onImageFrameChange}
                />
              ) : null}

              {isDragging && selectedField ? (
                <div
                  className="pointer-events-none absolute z-10 rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white tabular-nums shadow-md"
                  style={{
                    left: selectedField.x * zoom,
                    top: Math.max(0, selectedField.y * zoom - 22),
                  }}
                >
                  {formatCoord(selectedField.x)}, {formatCoord(selectedField.y)} {displayUnit}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isEditingImage ? (
        <div className="animate-pop-in absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-zinc-200 bg-white py-1.5 pr-1.5 pl-3 text-[13px] whitespace-nowrap text-zinc-700 shadow-lg shadow-zinc-900/10">
          <span className="mr-2 flex items-center gap-2">
            <Icon name="crop" size={14} className="text-zinc-400" />
            Drag to move, handles to resize
            <span className="text-[11px] text-zinc-400">Shift = free resize</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => onImageFit("contain")}>
            Fit page
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onImageFit("stretch")}>
            Fill page
          </Button>
          <Button size="sm" variant="ghost-danger" onClick={onImageDelete}>
            <Icon name="trash" size={13} />
            Delete
          </Button>
          <div className="mx-1 h-4 w-px bg-zinc-200" />
          <Button size="sm" onClick={onImageEditCancel}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={onImageEditDone}>
            Done
          </Button>
        </div>
      ) : null}

      {isPlacingField ? (
        <div className="animate-pop-in absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-200 bg-white py-1.5 pr-1.5 pl-3 text-[13px] text-zinc-700 shadow-lg shadow-zinc-900/10">
          <Icon name="cursor" size={14} className="text-zinc-400" />
          Click on the page to place text
          <Button size="sm" variant="secondary" onClick={onCancelPlacing}>
            Cancel
            <kbd className="font-mono text-[10px] text-zinc-400">Esc</kbd>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
