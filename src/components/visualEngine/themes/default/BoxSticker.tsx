import MathTextLines from "@/components/visualEngine/MathTextLines";
import type { BoxStickerProps } from "../types";

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

/**
 * Default sticker: sharp rectangle with stroke + fill from `ResolvedBoxSpec`.
 */
export function DefaultBoxSticker({ box, mathMode, mathSkin }: BoxStickerProps) {
  const lines = getTextLines(box.text);
  const textX = box.x + box.padding;
  const textY = box.y + box.padding;
  const textWidth = box.width - box.padding * 2;

  return (
    <>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={box.radius}
        ry={box.radius}
        fill={box.fill}
        stroke={box.stroke}
        strokeWidth={box.strokeWidth}
      />
      {lines.length ? (
        <MathTextLines
          lines={lines}
          x={textX}
          y={textY}
          lineHeight={box.lineHeight}
          fontSize={box.fontSize}
          textColor={box.textColor}
          fontWeight={box.fontWeight}
          textAnchor={box.textAnchor ?? "start"}
          mathMode={mathMode}
          mathSkin={mathMode ? mathSkin : undefined}
          maxWidth={textWidth}
        />
      ) : null}
    </>
  );
}
