"use client";

import { useState } from "react";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";
import type { DrawingStageText } from "@/types/infographics";

/**
 * Flag-driven box renderer.
 * The AI only provides `BoxCreation: true` + `text` (+ optional `id`).
 * All spatial data (slots, dimensions, animation timing) is computed here.
 *
 * Layout model: single horizontal row, left-to-right, unlimited boxes.
 * Box `i` sits at `x = BOX_LAYOUT.startX + i * (boxWidth + horizontalGap)`,
 * all on the same `y`. There is no max box count — the canvas grows wider
 * as more boxes arrive (see `Stage.tsx` for the dynamic viewBox).
 */

export const BOX_DEFAULTS = {
  radius: 36,
  fill: "#ffffff",
  stroke: "#111827",
  strokeWidth: 2.5,
  padding: 36,
  textColor: "#111827",
  fontSize: 14,
  lineHeight: 16,
  minHeight: 160,
} as const;

/**
 * Visual treatment applied to the **last** BoxCreation in the stage so the
 * learner can immediately spot the result card.
 */
export const ANSWER_BOX_DEFAULTS = {
  fill: "#ecfdf5",
  stroke: "#16a34a",
  strokeWidth: 2.5,
  textColor: "#064e3b",
} as const;

export const BOX_LAYOUT = {
  /** Distance from the left edge of the canvas to the left edge of box #0. */
  startX: 80,
  /** Y of every box (single row). */
  y: 380,
  /** Fixed box width. Text wraps inside; the frontend owns this number. */
  boxWidth: 300,
  /** Horizontal gap between adjacent boxes. */
  horizontalGap: 80,
  /** Right-edge breathing room after the last box (used by the canvas width). */
  endMargin: 80,
} as const;

export const BOX_ANIMATION = {
  durationMs: 600,
  stepDelayMs: 1800,
} as const;

/**
 * Hover affordance applied to every BoxCreation. The transform lives on a
 * nested `<g>` so it does not fight the GSAP entrance transform on the outer
 * `<g data-stage-id>`.
 */
export const BOX_HOVER = {
  scale: 1.03,
  shadow: "0 10px 22px rgba(15, 23, 42, 0.18)",
  durationMs: 220,
} as const;

export type BoxCreationObject = {
  id: string | number;
  BoxCreation?: boolean;
  text?: string | string[];
  linkedPortion?: string;
  fontWeight?: number;
  textAnchor?: DrawingStageText["textAnchor"];
};

export type ResolvedBoxLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
};

export type ResolvedBoxSpec = ResolvedBoxLayout & {
  id: string;
  text?: string | string[];
  animation: { durationMs: number; delayMs: number };
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  fontWeight?: number;
  textAnchor?: DrawingStageText["textAnchor"];
};

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

export function isBoxCreationApproved(
  object: BoxCreationObject | undefined | null,
): boolean {
  return Boolean(object && object.BoxCreation === true);
}

/** Trunk + code-map boxes that passed the BoxCreation flag check. */
export function getBoxObjects(
  objects: ReadonlyArray<BoxCreationObject>,
): BoxCreationObject[] {
  return objects.filter(isBoxCreationApproved);
}

/** Zero-based index of each trunk box id (skips linkedPortion code-map boxes). */
export function getBoxIndexById(
  boxes: ReadonlyArray<BoxCreationObject>,
): Map<string, number> {
  const map = new Map<string, number>();
  let index = 0;
  for (const box of getBoxObjects(boxes)) {
    if (box.linkedPortion) continue;
    map.set(String(box.id), index);
    index += 1;
  }
  return map;
}

export function resolveBoxSlot(boxIndex: number): { x: number; y: number } {
  return {
    x: BOX_LAYOUT.startX + boxIndex * (BOX_LAYOUT.boxWidth + BOX_LAYOUT.horizontalGap),
    y: BOX_LAYOUT.y,
  };
}

export function resolveBoxDimensions(
  text: string | string[] | undefined,
  _boxIndex: number,
): { width: number; height: number; padding: number } {
  const lines = getTextLines(text);
  const padding = BOX_DEFAULTS.padding;
  const lineHeight = BOX_DEFAULTS.lineHeight;
  const height = Math.max(
    BOX_DEFAULTS.minHeight,
    lines.length * lineHeight + padding * 2,
  );

  return { width: BOX_LAYOUT.boxWidth, height, padding };
}

export function resolveBoxLayout(
  text: string | string[] | undefined,
  boxIndex: number,
): ResolvedBoxLayout {
  const slot = resolveBoxSlot(boxIndex);
  const dimensions = resolveBoxDimensions(text, boxIndex);

  return {
    x: slot.x,
    y: slot.y,
    ...dimensions,
  };
}

function resolveBoxAnimation(boxIndex: number): {
  durationMs: number;
  delayMs: number;
} {
  return {
    durationMs: BOX_ANIMATION.durationMs,
    delayMs: boxIndex * BOX_ANIMATION.stepDelayMs,
  };
}

export function isAnswerBox(
  boxIndex: number,
  totalBoxCount: number | undefined,
): boolean {
  return (
    typeof totalBoxCount === "number" &&
    totalBoxCount > 0 &&
    boxIndex === totalBoxCount - 1
  );
}

export function resolveBoxSpec(
  object: BoxCreationObject,
  boxIndex: number,
  totalBoxCount?: number,
): ResolvedBoxSpec {
  const layout = resolveBoxLayout(object.text, boxIndex);
  const answer = isAnswerBox(boxIndex, totalBoxCount);

  return {
    id: String(object.id),
    text: object.text,
    ...layout,
    animation: resolveBoxAnimation(boxIndex),
    radius: BOX_DEFAULTS.radius,
    fill: answer ? ANSWER_BOX_DEFAULTS.fill : BOX_DEFAULTS.fill,
    stroke: answer ? ANSWER_BOX_DEFAULTS.stroke : BOX_DEFAULTS.stroke,
    strokeWidth: answer
      ? ANSWER_BOX_DEFAULTS.strokeWidth
      : BOX_DEFAULTS.strokeWidth,
    fontSize: BOX_DEFAULTS.fontSize,
    lineHeight: BOX_DEFAULTS.lineHeight,
    textColor: answer ? ANSWER_BOX_DEFAULTS.textColor : BOX_DEFAULTS.textColor,
    fontWeight: object.fontWeight,
    textAnchor: object.textAnchor,
  };
}

export function getBoxAnimationEntries(
  objects: ReadonlyArray<BoxCreationObject>,
): Array<{ id: string; animation: { durationMs: number; delayMs: number } }> {
  let boxIndex = 0;
  const entries: Array<{
    id: string;
    animation: { durationMs: number; delayMs: number };
  }> = [];

  for (const object of getBoxObjects(objects)) {
    if (object.linkedPortion) continue;
    entries.push({
      id: String(object.id),
      animation: resolveBoxAnimation(boxIndex),
    });
    boxIndex += 1;
  }

  return entries;
}

export default function BoxCreation({
  object,
  boxIndex = 0,
  totalBoxCount,
  theme,
}: {
  object: BoxCreationObject;
  boxIndex?: number;
  totalBoxCount?: number;
  theme?: ThemeName;
}) {
  const [hovered, setHovered] = useState(false);

  if (!isBoxCreationApproved(object)) return null;

  const box = resolveBoxSpec(object, boxIndex, totalBoxCount);
  const isAnswer = isAnswerBox(boxIndex, totalBoxCount);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  const { BoxSticker } = getTheme(theme);

  return (
    <g data-stage-id={box.id}>
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
          boxIndex={boxIndex}
          totalBoxCount={totalBoxCount}
          isAnswer={isAnswer}
        />
      </g>
    </g>
  );
}
