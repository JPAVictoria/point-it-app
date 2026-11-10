import { LengthUnit } from "@/lib/print-on-top/types";
import { toPoints } from "@/lib/print-on-top/units";

export const RULER_THICKNESS = 18;

interface TickScale {
  /** Distance between labelled ticks, in points. */
  majorPt: number;
  /** Minor ticks per major interval. */
  subdivisions: number;
  /** Every Nth minor tick is drawn a little longer. */
  midEvery: number;
  /** Label for the Nth major tick. */
  label: (index: number) => string;
}

const TICK_SCALES: Record<LengthUnit, TickScale> = {
  in: { majorPt: toPoints(1, "in"), subdivisions: 8, midEvery: 4, label: (i) => String(i) },
  cm: { majorPt: toPoints(1, "cm"), subdivisions: 10, midEvery: 5, label: (i) => String(i) },
  mm: { majorPt: toPoints(10, "mm"), subdivisions: 10, midEvery: 5, label: (i) => String(i * 10) },
  pt: { majorPt: 72, subdivisions: 8, midEvery: 4, label: (i) => String(i * 72) },
};

/** Minor ticks closer than this many screen pixels are skipped to avoid a solid smear. */
const MIN_TICK_SPACING_PX = 4;

interface RulerProps {
  orientation: "horizontal" | "vertical";
  lengthPt: number;
  scale: number;
  unit: LengthUnit;
  /** Optional highlighted position in points, e.g. the selected field's x or y. */
  markerPt?: number;
}

export function Ruler({ orientation, lengthPt, scale, unit, markerPt }: RulerProps) {
  const { majorPt, subdivisions, midEvery, label } = TICK_SCALES[unit];
  const minorPt = majorPt / subdivisions;
  const lengthPx = lengthPt * scale;
  const isHorizontal = orientation === "horizontal";

  const showMinor = minorPt * scale >= MIN_TICK_SPACING_PX;
  const showMid = minorPt * midEvery * scale >= MIN_TICK_SPACING_PX;

  const ticks: { pos: number; size: number; label?: string }[] = [];
  const count = Math.floor(lengthPt / minorPt + 1e-6);
  for (let i = 0; i <= count; i++) {
    const pos = i * minorPt * scale;
    if (i % subdivisions === 0) {
      ticks.push({ pos, size: RULER_THICKNESS, label: label(i / subdivisions) });
    } else if (i % midEvery === 0 && showMid) {
      ticks.push({ pos, size: 7 });
    } else if (showMinor) {
      ticks.push({ pos, size: 4 });
    }
  }

  const width = isHorizontal ? lengthPx : RULER_THICKNESS;
  const height = isHorizontal ? RULER_THICKNESS : lengthPx;

  return (
    <svg
      width={width}
      height={height}
      className="block shrink-0 bg-white text-zinc-300 select-none"
      aria-hidden="true"
    >
      {ticks.map(({ pos, size, label: text }) => {
        // Snap to half pixels so 1px strokes stay crisp.
        const p = Math.round(pos) + 0.5;
        return isHorizontal ? (
          <g key={pos}>
            <line x1={p} x2={p} y1={RULER_THICKNESS - size} y2={RULER_THICKNESS} stroke="currentColor" />
            {text !== undefined && pos > 0 ? (
              <text x={p + 3} y={9} className="fill-zinc-400 font-mono text-[9px]">
                {text}
              </text>
            ) : null}
          </g>
        ) : (
          <g key={pos}>
            <line y1={p} y2={p} x1={RULER_THICKNESS - size} x2={RULER_THICKNESS} stroke="currentColor" />
            {text !== undefined && pos > 0 ? (
              <text x={3} y={p + 10} className="fill-zinc-400 font-mono text-[9px]">
                {text}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Edge that meets the page. */}
      {isHorizontal ? (
        <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} className="stroke-zinc-200" />
      ) : (
        <line y1={0} y2={height} x1={width - 0.5} x2={width - 0.5} className="stroke-zinc-200" />
      )}

      {markerPt !== undefined ? (
        isHorizontal ? (
          <line
            x1={markerPt * scale}
            x2={markerPt * scale}
            y1={0}
            y2={height}
            className="stroke-blue-500"
            strokeWidth={1.5}
          />
        ) : (
          <line
            y1={markerPt * scale}
            y2={markerPt * scale}
            x1={0}
            x2={width}
            className="stroke-blue-500"
            strokeWidth={1.5}
          />
        )
      ) : null}
    </svg>
  );
}
