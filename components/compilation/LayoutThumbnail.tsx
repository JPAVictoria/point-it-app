import Image from "next/image";
import { LayoutSummary } from "@/lib/print-on-top/types";
import { resolveImageFrame } from "@/lib/print-on-top/image-frame";
import { cssFontFamily, cssFontStyle, cssFontWeight } from "@/components/print-on-top-editor/FieldBox";

/** Ratio of the thumbnail box (width / height) the page is fitted into. */
const BOX_RATIO = 4 / 3;

function percent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

/**
 * Miniature of a layout: the thumbnail image placed where the editor puts
 * it, with each field's text drawn at its position. Everything is in
 * percentages / container units, so it scales with the card and matches the
 * editor without any JavaScript.
 */
export function LayoutThumbnail({ layout }: { layout: LayoutSummary }) {
  const { widthPt, heightPt } = layout.page;
  const frame = layout.background ? resolveImageFrame(widthPt, heightPt, layout.background) : null;
  const fitsWidth = widthPt / heightPt > BOX_RATIO;

  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 p-4">
      <div
        className="relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/5 [container-type:inline-size]"
        style={{ aspectRatio: `${widthPt} / ${heightPt}`, ...(fitsWidth ? { width: "100%" } : { height: "100%" }) }}
      >
        {frame && layout.thumbnailUrl ? (
          <div
            className="absolute"
            style={{
              left: percent(frame.x, widthPt),
              top: percent(frame.y, heightPt),
              width: percent(frame.width, widthPt),
              height: percent(frame.height, heightPt),
            }}
          >
            <Image src={layout.thumbnailUrl} alt="" fill unoptimized className="object-fill" sizes="320px" />
          </div>
        ) : null}

        {layout.fields
          .filter((f) => f.enabled && (f.sampleValue || f.label))
          .map((field) => (
            <span
              key={field.id}
              className="absolute leading-[1.15] whitespace-pre text-zinc-900"
              style={{
                left: percent(field.x, widthPt),
                top: percent(field.y, heightPt),
                // 100cqw = the page's rendered width, so this scales the font exactly like the page.
                fontSize: `${(field.fontSize / widthPt) * 100}cqw`,
                fontFamily: cssFontFamily(field.fontFamily),
                fontWeight: cssFontWeight(field.fontFamily),
                fontStyle: cssFontStyle(field.fontFamily),
              }}
            >
              {field.sampleValue || field.label}
            </span>
          ))}
      </div>
    </div>
  );
}
