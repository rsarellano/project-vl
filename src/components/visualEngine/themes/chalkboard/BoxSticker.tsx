import MathTextLines from "@/components/visualEngine/MathTextLines";
import type { BoxStickerProps } from "../types";
import { CHALKBOARD_TOKENS as T } from "./tokens";

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

/** Chalk-outline step card on a green board. */
export function ChalkboardBoxSticker({
  box,
  boxIndex,
  isAnswer,
  mathMode,
  mathSkin,
}: BoxStickerProps) {
  const stroke = isAnswer ? T.answerStroke : T.stepStroke;
  const fill = isAnswer ? T.answerFill : T.stepFill;
  const bodyColor = isAnswer ? T.chalkGold : T.chalkWhite;
  const filterId = isAnswer ? T.filterChalkSoftId : undefined;

  const stepLabel = isAnswer ? "Answer" : `Step ${boxIndex + 1}`;
  const lines = getTextLines(box.text);

  const labelY = box.y + 20;
  const bodyStartY = box.y + box.padding + 14;
  const bodyX = box.x + box.padding;
  const rx = 14;

  return (
    <>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={rx}
        ry={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={isAnswer ? 2.5 : 2}
        strokeDasharray={isAnswer ? undefined : "1 0"}
        filter={filterId ? `url(#${filterId})` : undefined}
      />

      <text
        x={box.x + box.padding}
        y={labelY}
        fill={T.chalkDim}
        fontSize={12}
        fontFamily={T.chalkFont}
        fontWeight={400}
      >
        {stepLabel}
      </text>

      <line
        x1={box.x + box.padding}
        y1={labelY + 8}
        x2={box.x + box.width - box.padding}
        y2={labelY + 8}
        stroke={stroke}
        strokeWidth={1}
        opacity={0.45}
        strokeDasharray="4 3"
      />

      {lines.length ? (
        <MathTextLines
          lines={lines}
          x={bodyX}
          y={bodyStartY}
          lineHeight={box.lineHeight}
          fontSize={box.fontSize}
          textColor={bodyColor}
          fontFamily={T.chalkFont}
          mathMode={mathMode}
          mathChalk={mathMode}
          mathSkin={mathMode ? mathSkin : undefined}
          maxWidth={box.width - box.padding * 2}
        />
      ) : null}
    </>
  );
}
