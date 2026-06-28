"use client";

import { canRenderWithSkin } from "@/lib/mathSkins";
import type { MathSkinId } from "@/lib/mathSkins";
import {
  hasMixedProseAndMath,
  parseMathLine,
  renderMathHtml,
  renderMixedMathHtml,
} from "@/lib/mathText";
import SkinMathSvg from "@/components/visualEngine/SkinMathSvg";

type MathTextLinesProps = {
  lines: string[];
  x: number;
  y: number;
  lineHeight: number;
  fontSize: number;
  textColor: string;
  fontWeight?: number | string;
  fontFamily?: string;
  textAnchor?: "start" | "middle" | "end";
  mathMode?: boolean;
  /** Drop-in SVG glyph skin from `public/math-skins/<id>/`. */
  mathSkin?: MathSkinId;
  /** KaTeX chalk styling when no mathSkin is active. */
  mathChalk?: boolean;
  maxWidth?: number;
};

function renderKatexBlock(
  html: string,
  props: {
    x: number;
    y: number;
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
    textColor: string;
    fontWeight?: number | string;
    fontFamily?: string;
    mathClass?: string;
  },
  key: string,
) {
  return (
    <foreignObject
      key={key}
      x={props.x}
      y={props.y - props.fontSize}
      width={props.maxWidth}
      height={props.lineHeight + 8}
    >
      <div
        className={props.mathClass}
        style={{
          color: props.textColor,
          fontSize: props.fontSize,
          fontWeight: props.fontWeight,
          fontFamily: props.fontFamily,
          lineHeight: `${props.lineHeight}px`,
          overflow: "visible",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  );
}

export default function MathTextLines({
  lines,
  x,
  y,
  lineHeight,
  fontSize,
  textColor,
  fontWeight,
  fontFamily,
  textAnchor = "start",
  mathMode = false,
  mathSkin,
  mathChalk = false,
  maxWidth = 280,
}: MathTextLinesProps) {
  if (!lines.length) return null;

  const anchorX =
    textAnchor === "middle" ? x + maxWidth / 2 : textAnchor === "end" ? x + maxWidth : x;
  const mathOptions = {
    ...(mathChalk ? { chalk: true as const } : {}),
    looseOperators: true,
  };
  const mathClass = [mathChalk ? "katex-chalk" : null, "katex-step-box"]
    .filter(Boolean)
    .join(" ");

  function renderMathExpression(expression: string, atX: number, atY: number, key: string) {
    if (mathSkin && canRenderWithSkin(expression, mathSkin)) {
      return (
        <SkinMathSvg
          key={key}
          expression={expression}
          skinId={mathSkin}
          fontSize={fontSize}
          x={atX}
          y={atY}
        />
      );
    }

    const html = hasMixedProseAndMath(expression)
      ? renderMixedMathHtml(expression, mathOptions)
      : renderMathHtml(expression, mathOptions);
    return renderKatexBlock(
      html,
      {
        x: atX,
        y: atY,
        fontSize,
        lineHeight,
        maxWidth,
        textColor,
        fontWeight,
        fontFamily,
        mathClass,
      },
      key,
    );
  }

  return (
    <>
      {lines.map((line, index) => {
        const lineY = y + index * lineHeight;
        if (!mathMode) {
          return (
            <text
              key={`line-${index}`}
              x={anchorX}
              y={lineY}
              fill={textColor}
              fontSize={fontSize}
              fontWeight={fontWeight}
              fontFamily={fontFamily}
              textAnchor={textAnchor}
            >
              {line}
            </text>
          );
        }

        const parsed = parseMathLine(line);

        if (parsed.kind === "plain") {
          return (
            <text
              key={`line-${index}`}
              x={anchorX}
              y={lineY}
              fill={textColor}
              fontSize={fontSize}
              fontWeight={fontWeight}
              fontFamily={fontFamily}
              textAnchor={textAnchor}
            >
              {parsed.text}
            </text>
          );
        }

        if (parsed.kind === "label-math") {
          const labelWidth = parsed.label.length * (fontSize * 0.52);
          return (
            <g key={`line-${index}`}>
              <text
                x={anchorX}
                y={lineY}
                fill={textColor}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                textAnchor={textAnchor}
              >
                {parsed.label}
              </text>
              {renderMathExpression(parsed.math, x + labelWidth, lineY, `math-${index}`)}
            </g>
          );
        }

        return renderMathExpression(parsed.text, x, lineY, `line-${index}`);
      })}
    </>
  );
}
