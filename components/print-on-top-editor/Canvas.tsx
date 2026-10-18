import Image from "next/image";
import { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { LayoutConfig } from "@/lib/print-on-top/types";
import { fromPoints } from "@/lib/print-on-top/units";
import { FieldBox } from "./FieldBox";
import { Ruler } from "./Ruler";

interface CanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  layout: LayoutConfig;
  zoom: number;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  isPlacingField: boolean;
  onPlaceField: (xPt: number, yPt: number) => void;
  onFieldDragStart: () => void;
  onFieldDragMove: (id: string, xPt: number, yPt: number) => void;
  onFieldDragEnd: () => void;
}

export function Canvas({
  containerRef,
  layout,
  zoom,
  selectedFieldId,
  onSelectField,
  isPlacingField,
  onPlaceField,
  onFieldDragStart,
  onFieldDragMove,
  onFieldDragEnd,
}: CanvasProps) {
  const { widthPt, heightPt, displayUnit } = layout.page;
  const pageWidthPx = widthPt * zoom;
  const pageHeightPx = heightPt * zoom;

  const selectedField = layout.fields.find((f) => f.id === selectedFieldId) ?? null;

  function handlePageClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (!isPlacingField) {
      onSelectField(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPt = (e.clientX - rect.left) / zoom;
    const yPt = (e.clientY - rect.top) / zoom;
    onPlaceField(xPt, yPt);
  }

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto bg-zinc-200 p-8">
      <div className="inline-flex">
        <div className="flex flex-col">
          <div style={{ width: 20, height: 20 }} className="shrink-0 bg-zinc-100" />
          <Ruler orientation="vertical" lengthPt={heightPt} scale={zoom} unit={displayUnit} />
        </div>
        <div className="flex flex-col">
          <Ruler orientation="horizontal" lengthPt={widthPt} scale={zoom} unit={displayUnit} />
          <div
            onClick={handlePageClick}
            className="relative border border-zinc-400 bg-white shadow-sm"
            style={{
              width: pageWidthPx,
              height: pageHeightPx,
              cursor: isPlacingField ? "crosshair" : "default",
            }}
          >
            {layout.background ? (
              <Image
                src={layout.background.dataUrl}
                alt="Form background reference"
                fill
                unoptimized
                draggable={false}
                className="pointer-events-none select-none"
                style={{
                  objectFit: layout.background.fitMode === "stretch" ? "fill" : "contain",
                }}
              />
            ) : null}

            {layout.fields.map((field) => (
              <FieldBox
                key={field.id}
                field={field}
                scale={zoom}
                pageWidthPt={widthPt}
                pageHeightPt={heightPt}
                selected={field.id === selectedFieldId}
                onSelect={() => onSelectField(field.id)}
                onDragStart={onFieldDragStart}
                onDragMove={(x, y) => onFieldDragMove(field.id, x, y)}
                onDragEnd={onFieldDragEnd}
              />
            ))}

            {selectedField ? (
              <div
                className="pointer-events-none absolute rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white"
                style={{
                  left: selectedField.x * zoom,
                  top: Math.max(0, selectedField.y * zoom - 18),
                }}
              >
                x {fromPoints(selectedField.x, displayUnit).toFixed(2)}
                {displayUnit}, y {fromPoints(selectedField.y, displayUnit).toFixed(2)}
                {displayUnit}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
