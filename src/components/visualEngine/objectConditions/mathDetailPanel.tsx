"use client";

import { useEffect, useRef, useState } from "react";
import MathDetailPanelContent, {
  type MathDetailChatMessage,
} from "@/components/visualEngine/objectConditions/MathDetailPanelContent";
import {
  MATH_DETAIL_CONNECTOR,
  MATH_DETAIL_PANEL,
  type MathDetailBounds,
} from "@/components/visualEngine/layouts/mathLayout";
import {
  isAnswerBox,
  type BoxCreationObject,
  type ResolvedBoxLayout,
} from "@/components/visualEngine/objectConditions/boxCreation";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";
import { CHALKBOARD_TOKENS } from "@/components/visualEngine/themes/chalkboard/tokens";
import { resolveStepDerivation } from "@/lib/mathDerivation/resolveDerivation";
import type { MathSkinId } from "@/lib/mathSkins/types";

const TRANSITION_MS = 280;

function resolveConnectorTargetY(
  boxCenterY: number,
  bounds: MathDetailBounds,
): number {
  return Math.max(
    bounds.y + 28,
    Math.min(bounds.y + bounds.height - 28, boxCenterY),
  );
}

export type MathDetailPanelProps = {
  box: BoxCreationObject;
  previousBox?: BoxCreationObject;
  /** Original problem equation — enables "How we got here" on step 1. */
  initialEquation?: string | null;
  boxLayout: ResolvedBoxLayout;
  boxIndex: number;
  totalBoxCount: number;
  bounds: MathDetailBounds;
  theme?: ThemeName;
  mathSkin: MathSkinId;
  messages?: MathDetailChatMessage[];
  onAsk?: (question: string) => Promise<void>;
};

/** Right-column detail panel + branch connector for math layout step selection. */
export default function MathDetailPanel({
  box,
  previousBox,
  initialEquation,
  boxLayout,
  boxIndex,
  totalBoxCount,
  bounds,
  theme,
  mathSkin,
  messages = [],
  onAsk,
}: MathDetailPanelProps) {
  const [contentVisible, setContentVisible] = useState(true);
  const prevBoxIdRef = useRef(String(box.id));

  const themeObj = getTheme(theme);
  const panelStyle = themeObj.mathDetailReserve;
  const isChalk = theme === "chalkboard";
  const isAnswer = isAnswerBox(boxIndex, totalBoxCount);
  const stepLabel = isAnswer ? "Answer" : `Step ${boxIndex + 1}`;
  const derivation = resolveStepDerivation(box, previousBox, {
    initialEquation,
  });

  const padding = MATH_DETAIL_PANEL.padding;
  const titleY = bounds.y + padding + 4;
  const textX = bounds.x + padding;
  const contentTop = bounds.y + padding + 28;
  const contentHeight = bounds.height - padding - 28;

  const labelColor = isChalk
    ? CHALKBOARD_TOKENS.chalkDim
    : (panelStyle?.labelColor ?? MATH_DETAIL_PANEL.labelColor);
  const connectorStroke = isChalk
    ? CHALKBOARD_TOKENS.connectorStroke
    : MATH_DETAIL_CONNECTOR.stroke;

  const branchStartX = boxLayout.x + boxLayout.width;
  const branchStartY = boxLayout.y + boxLayout.height / 2;
  const branchMidX = bounds.x - MATH_DETAIL_CONNECTOR.midGap;
  const branchEndX = bounds.x;
  const branchEndY = resolveConnectorTargetY(branchStartY, bounds);

  useEffect(() => {
    const nextId = String(box.id);
    if (nextId === prevBoxIdRef.current) return;

    setContentVisible(false);
    const swapTimer = window.setTimeout(() => {
      prevBoxIdRef.current = nextId;
      setContentVisible(true);
    }, TRANSITION_MS / 2);

    return () => window.clearTimeout(swapTimer);
  }, [box.id]);

  return (
    <g
      data-math-detail-for={String(box.id)}
      style={{
        opacity: contentVisible ? 1 : 0,
        transition: `opacity ${TRANSITION_MS}ms ease-out`,
      }}
    >
      <line
        x1={branchStartX}
        y1={branchStartY}
        x2={branchMidX}
        y2={branchStartY}
        stroke={connectorStroke}
        strokeWidth={MATH_DETAIL_CONNECTOR.strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1={branchMidX}
        y1={branchStartY}
        x2={branchMidX}
        y2={branchEndY}
        stroke={connectorStroke}
        strokeWidth={MATH_DETAIL_CONNECTOR.strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1={branchMidX}
        y1={branchEndY}
        x2={branchEndX}
        y2={branchEndY}
        stroke={connectorStroke}
        strokeWidth={MATH_DETAIL_CONNECTOR.strokeWidth}
        strokeLinecap="round"
      />

      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        rx={MATH_DETAIL_PANEL.radius}
        ry={MATH_DETAIL_PANEL.radius}
        fill={panelStyle?.fill ?? MATH_DETAIL_PANEL.fill}
        stroke={panelStyle?.stroke ?? MATH_DETAIL_PANEL.stroke}
        strokeWidth={panelStyle?.strokeWidth ?? MATH_DETAIL_PANEL.strokeWidth}
        strokeDasharray={panelStyle?.strokeDasharray}
      />

      <text
        x={textX}
        y={titleY}
        fill={labelColor}
        fontSize={MATH_DETAIL_PANEL.titleFontSize}
        fontWeight={600}
        fontFamily={isChalk ? CHALKBOARD_TOKENS.chalkFont : undefined}
        letterSpacing={isChalk ? "0.04em" : undefined}
      >
        {stepLabel}
      </text>

      <line
        x1={textX}
        y1={titleY + 10}
        x2={bounds.x + bounds.width - padding}
        y2={titleY + 10}
        stroke={panelStyle?.stroke ?? MATH_DETAIL_PANEL.stroke}
        strokeWidth={1}
        opacity={0.45}
        strokeDasharray={isChalk ? "4 3" : undefined}
      />

      <foreignObject
        x={bounds.x + padding}
        y={contentTop}
        width={bounds.width - padding * 2}
        height={contentHeight - padding}
        style={{ pointerEvents: "auto" }}
      >
        <div className="h-full w-full">
          <MathDetailPanelContent
            stepLabel={stepLabel}
            theme={theme}
            mathSkin={mathSkin}
            derivation={derivation}
            messages={messages}
            onAsk={onAsk}
          />
        </div>
      </foreignObject>
    </g>
  );
}
