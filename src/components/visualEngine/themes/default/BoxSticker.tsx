import type { BoxStickerProps } from "../types";

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

/**
 * Default sticker: sharp rectangle with stroke + fill from `ResolvedBoxSpec`.
 */
export function DefaultBoxSticker({ box }: BoxStickerProps) {
  const lines = getTextLines(box.text);
  const textX = box.x + box.padding;
  const textY = box.y + box.padding;

  return (
    <>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={0}
        ry={0}
        fill={box.fill}
        stroke={box.stroke}
        strokeWidth={box.strokeWidth}
      />
      {lines.length ? (
        <text
          x={textX}
          y={textY}
          fill={box.textColor}
          fontSize={box.fontSize}
          fontWeight={box.fontWeight}
          textAnchor={box.textAnchor ?? "start"}
        >
          {lines.map((line, index) => (
            <tspan
              key={`${box.id}-line-${index}`}
              x={textX}
              dy={index === 0 ? 0 : box.lineHeight}
            >
              {line}
            </tspan>
          ))}
        </text>
      ) : null}
    </>
  );
}
