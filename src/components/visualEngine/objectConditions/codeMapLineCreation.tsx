"use client";

import type { ResolvedCodeMapConnection } from "@/components/visualEngine/layouts/codeMapLayout";

const LINE_DEFAULTS = {
  stroke: "#fbbf24",
  strokeWidth: 2.5,
} as const;

function pointsToSvg(points: ReadonlyArray<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export default function CodeMapLineCreation({
  connection,
}: {
  connection: ResolvedCodeMapConnection;
}) {
  return (
    <polyline
      data-stage-id={connection.id}
      points={pointsToSvg(connection.points)}
      fill="none"
      stroke={LINE_DEFAULTS.stroke}
      strokeWidth={LINE_DEFAULTS.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
    />
  );
}
