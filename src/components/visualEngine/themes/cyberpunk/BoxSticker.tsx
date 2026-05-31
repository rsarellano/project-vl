import type { BoxStickerProps } from "../types";
import { CYBERPUNK_TOKENS as T } from "./tokens";

/**
 * Cyberpunk sticker. The visual recipe:
 *
 *   1. Asymmetric clipped panel — top-left and bottom-right corners are
 *      sliced diagonally to suggest a HUD plate rather than a generic card.
 *   2. Dark fill + faint grid overlay reuse the canvas grid pattern, so
 *      the panel reads as "lit area on the same surface".
 *   3. Glowing neon outline. Cyan for step boxes, magenta for the answer
 *      box (stronger blur on the answer box to draw the eye).
 *   4. Two L-shaped corner brackets (top-right + bottom-left) — small
 *      cyberpunk staple, anchors the otherwise-floaty panel.
 *   5. Monospace step label ("// STEP_01") + thin divider line above the
 *      body, evoking a code/console readout.
 *   6. A small filled accent pip in the bottom-right "missing corner"
 *      area, with the same glow as the outline.
 *
 * The sticker reads `box.text`, `box.padding`, `box.fontSize`,
 * `box.lineHeight` from the resolved spec but ignores `box.fill`,
 * `box.stroke`, etc. because the cyberpunk palette is theme-owned.
 */

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

/** Path with top-left and bottom-right corners cut diagonally. */
function buildClippedPanelPath(
  x: number,
  y: number,
  width: number,
  height: number,
  cut: number,
): string {
  return [
    `M ${x + cut} ${y}`,
    `L ${x + width} ${y}`,
    `L ${x + width} ${y + height - cut}`,
    `L ${x + width - cut} ${y + height}`,
    `L ${x} ${y + height}`,
    `L ${x} ${y + cut}`,
    "Z",
  ].join(" ");
}

export function CyberpunkBoxSticker({ box, boxIndex, isAnswer }: BoxStickerProps) {
  const cut = T.cornerCut;
  const path = buildClippedPanelPath(box.x, box.y, box.width, box.height, cut);

  const neon = isAnswer ? T.answerNeon : T.primaryNeon;
  const filterId = isAnswer ? T.filterMagentaId : T.filterCyanId;
  const bodyColor = isAnswer ? T.textAnswer : T.textPrimary;
  const outlineWidth = isAnswer ? 2.5 : 2;

  const stepLabel = isAnswer
    ? "// RESULT"
    : `// STEP_${String(boxIndex + 1).padStart(2, "0")}`;

  const lines = getTextLines(box.text);

  const labelY = box.y + 18;
  const dividerY = labelY + 6;
  const bodyX = box.x + box.padding;
  // Body text needs to clear the step label + divider; first baseline ~y+padding+18.
  const bodyStartY = box.y + box.padding + 18;

  // Bracket geometry (top-right + bottom-left).
  const bracketLen = 14;
  const bracketInset = 8;
  const tr = {
    x1: box.x + box.width - bracketInset,
    y1: box.y + bracketInset,
  };
  const bl = {
    x1: box.x + bracketInset,
    y1: box.y + box.height - bracketInset,
  };

  return (
    <>
      <path d={path} fill={T.canvas} />
      <path d={path} fill={`url(#${T.patternGridId})`} opacity={0.55} />

      <path
        d={path}
        fill="none"
        stroke={neon}
        strokeWidth={outlineWidth}
        strokeLinejoin="miter"
        filter={`url(#${filterId})`}
      />

      <path
        d={`M ${tr.x1 - bracketLen} ${tr.y1} L ${tr.x1} ${tr.y1} L ${tr.x1} ${tr.y1 + bracketLen}`}
        fill="none"
        stroke={neon}
        strokeWidth={1.4}
        opacity={0.85}
      />
      <path
        d={`M ${bl.x1} ${bl.y1 - bracketLen} L ${bl.x1} ${bl.y1} L ${bl.x1 + bracketLen} ${bl.y1}`}
        fill="none"
        stroke={neon}
        strokeWidth={1.4}
        opacity={0.85}
      />

      <text
        x={box.x + cut + 10}
        y={labelY}
        fill={T.textDim}
        fontSize={11}
        fontFamily={T.monoFont}
        fontWeight={500}
        letterSpacing="0.08em"
      >
        {stepLabel}
      </text>
      <line
        x1={box.x + cut + 10}
        y1={dividerY}
        x2={box.x + box.width - cut - 10}
        y2={dividerY}
        stroke={neon}
        strokeWidth={1}
        opacity={0.35}
      />

      {lines.length ? (
        <text
          x={bodyX}
          y={bodyStartY}
          fill={bodyColor}
          fontSize={box.fontSize}
          fontFamily={T.monoFont}
        >
          {lines.map((line, idx) => (
            <tspan
              key={`${box.id}-line-${idx}`}
              x={bodyX}
              dy={idx === 0 ? 0 : box.lineHeight}
            >
              {line}
            </tspan>
          ))}
        </text>
      ) : null}

      <circle
        cx={box.x + box.width - cut + 4}
        cy={box.y + box.height - cut + 4}
        r={3.5}
        fill={neon}
        filter={`url(#${filterId})`}
      />
    </>
  );
}
