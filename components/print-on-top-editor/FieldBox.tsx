import { PointerEvent as ReactPointerEvent, useRef } from "react";
import { TextField } from "@/lib/print-on-top/types";

interface FieldBoxProps {
  field: TextField;
  scale: number;
  pageWidthPt: number;
  pageHeightPt: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
}

const FONT_CSS_FAMILY: Record<string, string> = {
  Helvetica: "Helvetica, Arial, sans-serif",
  Times: "'Times New Roman', Times, serif",
  Courier: "'Courier New', Courier, monospace",
};

function cssFontFamily(fontFamily: string): string {
  if (fontFamily.startsWith("Times")) return FONT_CSS_FAMILY.Times;
  if (fontFamily.startsWith("Courier")) return FONT_CSS_FAMILY.Courier;
  return FONT_CSS_FAMILY.Helvetica;
}

function cssFontWeight(fontFamily: string): string {
  return fontFamily.includes("Bold") ? "bold" : "normal";
}

function cssFontStyle(fontFamily: string): string {
  return fontFamily.includes("Oblique") || fontFamily.includes("Italic") ? "italic" : "normal";
}

export function FieldBox({
  field,
  scale,
  pageWidthPt,
  pageHeightPt,
  selected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: FieldBoxProps) {
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; fieldX: number; fieldY: number } | null>(
    null
  );

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragOrigin.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };
    onDragStart();
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    const dxPt = (e.clientX - dragOrigin.current.pointerX) / scale;
    const dyPt = (e.clientY - dragOrigin.current.pointerY) / scale;

    const maxX = Math.max(0, pageWidthPt - 4);
    const maxY = Math.max(0, pageHeightPt - 4);
    const nextX = Math.min(Math.max(dragOrigin.current.fieldX + dxPt, 0), maxX);
    const nextY = Math.min(Math.max(dragOrigin.current.fieldY + dyPt, 0), maxY);

    onDragMove(nextX, nextY);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragOrigin.current = null;
    onDragEnd();
  }

  if (!field.enabled) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        left: field.x * scale,
        top: field.y * scale,
        minWidth: (field.maxWidth ?? 20) * scale,
        maxWidth: field.maxWidth ? field.maxWidth * scale : undefined,
        fontSize: field.fontSize * scale,
        fontFamily: cssFontFamily(field.fontFamily),
        fontWeight: cssFontWeight(field.fontFamily),
        fontStyle: cssFontStyle(field.fontFamily),
        textAlign: field.alignment,
        lineHeight: 1.15,
        cursor: "grab",
        touchAction: "none",
        whiteSpace: field.maxWidth ? "pre-wrap" : "pre",
        userSelect: "none",
      }}
      className={`border px-0.5 ${
        selected ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:border-zinc-400"
      }`}
    >
      {field.sampleValue || field.label}
    </div>
  );
}
