"use client";

import { useState } from "react";
import { BOX_HOVER } from "@/components/visualEngine/objectConditions/boxCreation";
import {
  EXPLAIN_LABEL,
  toExplainBoxSpec,
  type ResolvedExplainLayout,
} from "@/components/visualEngine/layouts/codeMapLayout";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";

type CodeMapExplanationProps = {
  explain: ResolvedExplainLayout;
  portionIndex: number;
  totalCount: number;
  theme?: ThemeName;
};

export default function CodeMapExplanation({
  explain,
  portionIndex,
  totalCount,
  theme,
}: CodeMapExplanationProps) {
  const [hovered, setHovered] = useState(false);
  const box = toExplainBoxSpec(explain);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  const { BoxSticker } = getTheme(theme);

  return (
    <g data-stage-id={box.id}>
      {explain.portionLabel ? (
        <text
          x={box.x + box.padding}
          y={box.y - EXPLAIN_LABEL.offsetY}
          fill={EXPLAIN_LABEL.color}
          fontSize={EXPLAIN_LABEL.fontSize}
          fontWeight={EXPLAIN_LABEL.fontWeight}
          fontFamily={EXPLAIN_LABEL.monoFont}
          letterSpacing="0.06em"
        >
          {explain.portionLabel.toUpperCase()}
        </text>
      ) : null}
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: "pointer",
          transformOrigin: `${centerX}px ${centerY}px`,
          transform: hovered ? `scale(${BOX_HOVER.scale})` : "scale(1)",
          transition: `transform ${BOX_HOVER.durationMs}ms ease-out, filter ${BOX_HOVER.durationMs}ms ease-out`,
          filter: hovered ? `drop-shadow(${BOX_HOVER.shadow})` : "none",
        }}
      >
        <BoxSticker
          box={box}
          boxIndex={portionIndex}
          totalBoxCount={totalCount}
          isAnswer={false}
        />
      </g>
    </g>
  );
}
