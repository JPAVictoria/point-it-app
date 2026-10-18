import { LengthUnit } from "@/lib/print-on-top/types";
import { toPoints } from "@/lib/print-on-top/units";

const RULER_THICKNESS = 20;

interface RulerProps {
  orientation: "horizontal" | "vertical";
  lengthPt: number;
  scale: number;
  unit: LengthUnit;
}

export function Ruler({ orientation, lengthPt, scale, unit }: RulerProps) {
  const unitPt = toPoints(1, unit);
  const tickCount = Math.ceil(lengthPt / unitPt);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i);

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className="relative shrink-0 bg-zinc-100 text-zinc-500"
      style={{
        width: isHorizontal ? lengthPt * scale : RULER_THICKNESS,
        height: isHorizontal ? RULER_THICKNESS : lengthPt * scale,
      }}
    >
      {ticks.map((tick) => {
        const offset = tick * unitPt * scale;
        return (
          <div
            key={tick}
            className="absolute border-zinc-400 text-[9px] leading-none"
            style={
              isHorizontal
                ? { left: offset, top: 0, borderLeftWidth: 1, height: "100%", paddingLeft: 2 }
                : { top: offset, left: 0, borderTopWidth: 1, width: "100%", paddingTop: 1 }
            }
          >
            {tick}
          </div>
        );
      })}
    </div>
  );
}
