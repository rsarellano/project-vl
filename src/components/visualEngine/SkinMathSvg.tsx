"use client";

import { useState } from "react";
import { renderSkinMathLayout } from "@/lib/mathSkins";
import type { MathSkinId, PlacedGlyph, PlacedGlyphImage } from "@/lib/mathSkins/types";

/** Hover affordance for individual skin glyph stickers (digits, letters, √). */
export const GLYPH_HOVER = {
  scale: 1.08,
  shadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
  durationMs: 180,
} as const;

function glyphDomId(glyphIdPrefix: string | undefined, index: number): string {
  return glyphIdPrefix ? `${glyphIdPrefix}-${index}` : `glyph-${index}`;
}

function SkinMathGlyphImage({
  glyph,
  domId,
  charAttr,
  hoverEnabled,
}: {
  glyph: PlacedGlyphImage;
  domId: string;
  charAttr?: string;
  hoverEnabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const cx = glyph.x + glyph.width / 2;
  const cy = glyph.y + glyph.height / 2;
  const hoveredStyle = hovered
    ? {
        transform: `scale(${GLYPH_HOVER.scale})`,
        filter: `drop-shadow(${GLYPH_HOVER.shadow})`,
      }
    : {
        transform: "scale(1)",
        filter: "none",
      };

  return (
    <g
      data-glyph-id={domId}
      data-char={charAttr}
      data-glyph-kind="image"
      onMouseEnter={hoverEnabled ? () => setHovered(true) : undefined}
      onMouseLeave={hoverEnabled ? () => setHovered(false) : undefined}
      style={
        hoverEnabled
          ? {
              cursor: "pointer",
              transformOrigin: `${cx}px ${cy}px`,
              transition: `transform ${GLYPH_HOVER.durationMs}ms ease-out, filter ${GLYPH_HOVER.durationMs}ms ease-out`,
              ...hoveredStyle,
            }
          : undefined
      }
    >
      <image
        href={glyph.href}
        x={glyph.x}
        y={glyph.y}
        width={glyph.width}
        height={glyph.height}
        preserveAspectRatio={glyph.preserveAspectRatio ?? "xMidYMax meet"}
        pointerEvents={hoverEnabled ? "all" : undefined}
      />
    </g>
  );
}

function renderPlacedGlyph(
  glyph: PlacedGlyph,
  index: number,
  fontSize: number,
  glyphIdPrefix?: string,
  glyphHover = true,
) {
  const domId = glyphDomId(glyphIdPrefix, index);
  const charAttr =
    glyph.kind === "image" ? glyph.char : undefined;

  if (glyph.kind === "image") {
    return (
      <SkinMathGlyphImage
        key={domId}
        glyph={glyph}
        domId={domId}
        charAttr={charAttr}
        hoverEnabled={glyphHover}
      />
    );
  }

  if (glyph.kind === "katex") {
    return (
      <g key={domId} data-glyph-id={domId} data-glyph-kind="katex">
        <foreignObject
          x={glyph.x}
          y={glyph.y}
          width={Math.max(glyph.width, fontSize * 0.55)}
          height={glyph.height + 6}
        >
          <div
            className={glyph.chalk ? "katex-chalk" : undefined}
            style={{
              color: glyph.chalk ? "#f2f2ea" : undefined,
              fontSize,
              lineHeight: `${glyph.height}px`,
              overflow: "visible",
            }}
            dangerouslySetInnerHTML={{ __html: glyph.html }}
          />
        </foreignObject>
      </g>
    );
  }

  return (
    <g key={domId} data-glyph-id={domId} data-glyph-kind="stroke">
      <path
        d={glyph.path}
        fill="none"
        stroke={glyph.stroke}
        strokeWidth={(glyph.strokeWidth ?? 1.8) * glyph.scale}
        strokeLinecap="round"
        transform={`translate(${glyph.x}, ${glyph.y}) scale(${glyph.scale})`}
      />
    </g>
  );
}

type SkinMathSvgProps = {
  expression: string;
  skinId: MathSkinId;
  fontSize: number;
  x?: number;
  y?: number;
  /** Prefix for `data-glyph-id` on each character (e.g. frame id in derivations). */
  glyphIdPrefix?: string;
  /** Scale + shadow on sticker hover (digits, letters, √). */
  glyphHover?: boolean;
};

/** Render math from drop-in SVG files (inside diagram SVG). */
export default function SkinMathSvg({
  expression,
  skinId,
  fontSize,
  x = 0,
  y = 0,
  glyphIdPrefix,
  glyphHover = true,
}: SkinMathSvgProps) {
  const layout = renderSkinMathLayout(expression, skinId, fontSize);
  if (!layout) return null;

  const baselineY = y + fontSize * 0.85;

  return (
    <g transform={`translate(${x}, ${baselineY})`}>
      {layout.glyphs.map((glyph, index) =>
        renderPlacedGlyph(glyph, index, fontSize, glyphIdPrefix, glyphHover),
      )}
    </g>
  );
}

/** Inline SVG for HTML previews (ask form). */
export function SkinMathInline({
  expression,
  skinId,
  fontSize = 18,
  className = "",
  glyphIdPrefix,
  glyphHover = true,
}: {
  expression: string;
  skinId: MathSkinId;
  fontSize?: number;
  className?: string;
  glyphIdPrefix?: string;
  glyphHover?: boolean;
}) {
  const layout = renderSkinMathLayout(expression, skinId, fontSize);
  if (!layout) return null;

  const pad = 4;
  const viewW = Math.max(layout.width + pad * 2, 40);
  const viewH = layout.height + pad * 2;

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={viewW}
      height={viewH}
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <g transform={`translate(${pad}, ${pad + fontSize * 0.85})`}>
        {layout.glyphs.map((glyph, index) =>
          renderPlacedGlyph(glyph, index, fontSize, glyphIdPrefix, glyphHover),
        )}
      </g>
    </svg>
  );
}
