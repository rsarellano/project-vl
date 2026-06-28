"use client";

import {
  BOX_DEFAULTS,
  BOX_LAYOUT,
  getBoxIndexById,
  getBoxObjects,
  resolveBoxSpec,
  type BoxCreationObject,
  type BoxLayoutOptions,
} from "@/components/visualEngine/objectConditions/boxCreation";
import { resolveMathConnectorPoints } from "@/components/visualEngine/layouts/mathLayout";
import type { DrawingStageConnection } from "@/types/infographics";

export const LINE_DEFAULTS = {
  stroke: "#64748b",
  strokeWidth: 2.5,
} as const;

export const LINE_ANIMATION = {
  durationMs: 500,
  delayAfterFromBoxMs: 400,
} as const;

const CONNECTOR_Y = BOX_LAYOUT.y + BOX_DEFAULTS.minHeight / 2;

export function resolveConnectorPoints(
  fromBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number },
  options?: BoxLayoutOptions,
): Array<{ x: number; y: number }> {
  if (options?.mathMode) {
    return resolveMathConnectorPoints(fromBox, toBox);
  }
  const start = { x: fromBox.x + fromBox.width, y: CONNECTOR_Y };
  const end = { x: toBox.x, y: CONNECTOR_Y };
  return [start, end];
}

function pointsToSvg(points: ReadonlyArray<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function connectionId(connection: DrawingStageConnection): string {
  if (connection.id != null && connection.id !== "") {
    return String(connection.id);
  }
  return `${connection.from}-to-${connection.to}`;
}

function resolveLineSpec(
  connection: DrawingStageConnection,
  objects: ReadonlyArray<BoxCreationObject>,
  options?: BoxLayoutOptions,
) {
  const boxes = getBoxObjects(objects).filter((b) => !b.linkedPortion);
  const layoutOptions = options?.mathMode
    ? { mathMode: true, allBoxes: boxes }
    : undefined;
  const indexById = getBoxIndexById(boxes);
  const fromIndex = indexById.get(String(connection.from));
  const toIndex = indexById.get(String(connection.to));
  if (fromIndex == null || toIndex == null) return null;

  const fromBox = resolveBoxSpec(boxes[fromIndex], fromIndex, boxes.length, layoutOptions);
  const toBox = resolveBoxSpec(boxes[toIndex], toIndex, boxes.length, layoutOptions);
  const points = resolveConnectorPoints(fromBox, toBox, layoutOptions);

  return {
    id: connectionId(connection),
    points,
    stroke: LINE_DEFAULTS.stroke,
    strokeWidth: LINE_DEFAULTS.strokeWidth,
    animation: {
      durationMs: LINE_ANIMATION.durationMs,
      delayMs:
        fromBox.animation.delayMs +
        fromBox.animation.durationMs +
        LINE_ANIMATION.delayAfterFromBoxMs,
    },
  };
}

export function getLineAnimationEntries(
  connections: ReadonlyArray<DrawingStageConnection>,
  objects: ReadonlyArray<BoxCreationObject>,
  options?: BoxLayoutOptions,
): Array<{ id: string; animation: { durationMs: number; delayMs: number } }> {
  const entries: Array<{ id: string; animation: { durationMs: number; delayMs: number } }> =
    [];

  for (const connection of connections) {
    const spec = resolveLineSpec(connection, objects, options);
    if (!spec) continue;
    entries.push({ id: spec.id, animation: spec.animation });
  }

  return entries;
}

export default function LineCreation({
  connection,
  objects,
  mathMode = false,
}: {
  connection: DrawingStageConnection;
  objects: ReadonlyArray<BoxCreationObject>;
  mathMode?: boolean;
}) {
  const spec = resolveLineSpec(
    connection,
    objects,
    mathMode ? { mathMode: true } : undefined,
  );
  if (!spec) return null;

  return (
    <polyline
      data-stage-id={spec.id}
      points={pointsToSvg(spec.points)}
      fill="none"
      stroke={spec.stroke}
      strokeWidth={spec.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
    />
  );
}
