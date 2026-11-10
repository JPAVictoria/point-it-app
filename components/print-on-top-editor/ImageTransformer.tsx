import { PointerEvent as ReactPointerEvent } from "react";
import { ImageFrame, LengthUnit } from "@/lib/print-on-top/types";
import { resizeFrame, ResizeHandle } from "@/lib/print-on-top/image-frame";
import { formatDimensions } from "@/lib/print-on-top/units";

interface ImageTransformerProps {
  frame: ImageFrame;
  scale: number;
  unit: LengthUnit;
  onChange: (frame: ImageFrame) => void;
}

const HANDLES: { id: ResizeHandle; left: string; top: string; cursor: string }[] = [
  { id: "nw", left: "0%", top: "0%", cursor: "nwse-resize" },
  { id: "n", left: "50%", top: "0%", cursor: "ns-resize" },
  { id: "ne", left: "100%", top: "0%", cursor: "nesw-resize" },
  { id: "e", left: "100%", top: "50%", cursor: "ew-resize" },
  { id: "se", left: "100%", top: "100%", cursor: "nwse-resize" },
  { id: "s", left: "50%", top: "100%", cursor: "ns-resize" },
  { id: "sw", left: "0%", top: "100%", cursor: "nesw-resize" },
  { id: "w", left: "0%", top: "50%", cursor: "ew-resize" },
];

/**
 * Canva-style move/resize box drawn over the background image. Corner
 * handles scale proportionally (hold Shift to resize freely); edge handles
 * stretch one side. Reports every intermediate frame through `onChange`.
 */
export function ImageTransformer({ frame, scale, unit, onChange }: ImageTransformerProps) {
  function startDrag(
    e: ReactPointerEvent<HTMLElement>,
    compute: (dxPt: number, dyPt: number, shiftKey: boolean) => ImageFrame
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const originX = e.clientX;
    const originY = e.clientY;

    let moved = false;

    function handleMove(ev: PointerEvent) {
      moved = true;
      onChange(compute((ev.clientX - originX) / scale, (ev.clientY - originY) / scale, ev.shiftKey));
    }
    function swallowClick(ev: MouseEvent) {
      ev.stopPropagation();
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      // A drag that ends off the image would otherwise fire a click on the
      // page, which finishes the adjustment. Swallow that one click.
      if (moved) {
        window.addEventListener("click", swallowClick, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", swallowClick, { capture: true }), 0);
      }
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      data-image-transformer
      className="absolute z-20 outline-2 outline-blue-500 outline-solid"
      style={{
        left: frame.x * scale,
        top: frame.y * scale,
        width: frame.width * scale,
        height: frame.height * scale,
        cursor: "move",
        touchAction: "none",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) =>
        startDrag(e, (dx, dy) => ({ ...frame, x: frame.x + dx, y: frame.y + dy }))
      }
    >
      {HANDLES.map((handle) => {
        const isCorner = handle.id.length === 2;
        const isVerticalEdge = handle.id === "e" || handle.id === "w";
        const sizeClass = isCorner ? "h-3.5 w-3.5 rounded-full" : isVerticalEdge ? "h-6 w-2 rounded-full" : "h-2 w-6 rounded-full";
        return (
          <div
            key={handle.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 border border-zinc-300 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform hover:scale-125 ${sizeClass}`}
            style={{ left: handle.left, top: handle.top, cursor: handle.cursor }}
            onPointerDown={(e) =>
              startDrag(e, (dx, dy, shiftKey) => resizeFrame(frame, handle.id, dx, dy, !shiftKey))
            }
          />
        );
      })}

      <div className="pointer-events-none absolute top-full left-1/2 mt-3 -translate-x-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-white tabular-nums shadow-md">
        {formatDimensions(frame.width, frame.height, unit)}
      </div>
    </div>
  );
}
