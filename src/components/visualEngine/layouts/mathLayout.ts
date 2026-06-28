import {
  BOX_ANIMATION,
  BOX_DEFAULTS,
  type BoxCreationObject,
} from "@/components/visualEngine/objectConditions/boxCreation";
import type { DrawingStage } from "@/types/infographics";
import { isTrunkBoxItem } from "@/types/infographics";

/**
 * Math layout: vertical step column on the left, interactive detail column on the right
 * (click a step to show its explanation — mirrors code-map explain/detail pattern).
 */

export const MATH_LAYOUT = {
  startX: 48,
  titleY: 56,
  objectiveY: 120,
  stepsStartY: 188,
  boxWidth: 320,
  verticalGap: 28,
  /** Gap between step column and the detail reserve column. */
  detailGap: 40,
  /** Wide enough for both-sides equation morphs (sqrt, badges) without squishing. */
  detailColumnWidth: 680,
  endMargin: 40,
  bottomMargin: 56,
} as const;

/** Step box text metrics — extra line height room for sqrt stickers. */
export const MATH_BOX_TEXT = {
  fontSize: 15,
  lineHeight: 36,
  minHeight: 160,
} as const;

export const MATH_TEXT_PRESETS = {
  "code-title": {
    x: MATH_LAYOUT.startX,
    y: MATH_LAYOUT.titleY,
    fontSize: 18,
    lineHeight: 24,
    animation: { durationMs: 500, delayMs: 0 },
  },
  objective: {
    x: MATH_LAYOUT.startX,
    y: MATH_LAYOUT.objectiveY,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
    animation: { durationMs: 500, delayMs: 200 },
  },
} as const;

export const MATH_DETAIL_PANEL = {
  x: MATH_LAYOUT.startX + MATH_LAYOUT.boxWidth + MATH_LAYOUT.detailGap,
  width: MATH_LAYOUT.detailColumnWidth,
  padding: 20,
  lineHeight: 22,
  bodyFontSize: 14,
  titleFontSize: 12,
  radius: 12,
  fill: "rgba(248, 250, 252, 0.92)",
  stroke: "#94a3b8",
  strokeWidth: 1.5,
  labelColor: "#64748b",
} as const;

/** Left-column step boxes — match the detail panel chrome on the right. */
export const MATH_BOX_DEFAULTS = {
  radius: MATH_DETAIL_PANEL.radius,
  fill: "#ffffff",
  stroke: MATH_DETAIL_PANEL.stroke,
  strokeWidth: MATH_DETAIL_PANEL.strokeWidth,
  textColor: "#0f172a",
} as const;

export const MATH_ANSWER_BOX_DEFAULTS = {
  radius: MATH_DETAIL_PANEL.radius,
  fill: "#ecfdf5",
  stroke: "#16a34a",
  strokeWidth: 1.5,
  textColor: "#064e3b",
} as const;

/** @deprecated Use MATH_DETAIL_PANEL — kept for theme fallbacks. */
export const MATH_DETAIL_RESERVE = MATH_DETAIL_PANEL;

export const MATH_DETAIL_CONNECTOR = {
  stroke: "#94a3b8",
  strokeWidth: 1.5,
  midGap: 14,
} as const;

export type MathDetailBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

export function resolveMathBoxDimensions(text: string | string[] | undefined): {
  width: number;
  height: number;
  padding: number;
} {
  const lines = getTextLines(text);
  const padding = BOX_DEFAULTS.padding;
  const lineHeight = MATH_BOX_TEXT.lineHeight;
  const height = Math.max(
    MATH_BOX_TEXT.minHeight,
    lines.length * lineHeight + padding * 2,
  );
  return { width: MATH_LAYOUT.boxWidth, height, padding };
}

export function resolveMathBoxSlot(
  boxIndex: number,
  boxes: ReadonlyArray<Pick<BoxCreationObject, "text">>,
): { x: number; y: number } {
  let y = MATH_LAYOUT.stepsStartY;
  for (let i = 0; i < boxIndex; i += 1) {
    y += resolveMathBoxDimensions(boxes[i]?.text).height + MATH_LAYOUT.verticalGap;
  }
  return { x: MATH_LAYOUT.startX, y };
}

export function resolveMathBoxLayout(
  text: string | string[] | undefined,
  boxIndex: number,
  boxes: ReadonlyArray<Pick<BoxCreationObject, "text">>,
) {
  const slot = resolveMathBoxSlot(boxIndex, boxes);
  const dimensions = resolveMathBoxDimensions(text);
  return { x: slot.x, y: slot.y, ...dimensions };
}

export function resolveMathConnectorPoints(
  fromBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number },
): Array<{ x: number; y: number }> {
  const laneX = fromBox.x + fromBox.width / 2;
  const startY = fromBox.y + fromBox.height;
  const endY = toBox.y;
  const midY = startY + (endY - startY) / 2;
  return [
    { x: laneX, y: startY },
    { x: laneX, y: midY },
    { x: laneX, y: endY },
  ];
}

export function computeMathViewBox(stage: DrawingStage): { width: number; height: number } {
  const boxObjects = stage.objects.filter(isTrunkBoxItem) as BoxCreationObject[];

  let stepsBottom = MATH_LAYOUT.stepsStartY;
  for (let index = 0; index < boxObjects.length; index += 1) {
    const dims = resolveMathBoxDimensions(boxObjects[index]?.text);
    stepsBottom = resolveMathBoxSlot(index, boxObjects).y + dims.height;
  }

  const contentHeight = Math.max(
    640,
    stepsBottom + MATH_LAYOUT.bottomMargin,
  );

  const contentWidth =
    MATH_DETAIL_PANEL.x + MATH_DETAIL_PANEL.width + MATH_LAYOUT.endMargin;

  return {
    width: Math.max(stage.width, contentWidth),
    height: contentHeight,
  };
}

export function resolveMathDetailReserveHeight(stepsBottom: number): MathDetailBounds {
  const top = MATH_LAYOUT.stepsStartY;
  const height = Math.max(240, stepsBottom - top);
  return {
    x: MATH_DETAIL_PANEL.x,
    y: top,
    width: MATH_DETAIL_PANEL.width,
    height,
  };
}

export function getMathBoxAnimation(boxIndex: number): {
  durationMs: number;
  delayMs: number;
} {
  return {
    durationMs: BOX_ANIMATION.durationMs,
    delayMs: boxIndex * BOX_ANIMATION.stepDelayMs,
  };
}
