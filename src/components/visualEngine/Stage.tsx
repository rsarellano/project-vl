"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { DrawingStageSvgContent } from "@/components/visualEngine/DrawingStage";
import { computeCodeMapViewBox } from "@/components/visualEngine/layouts/codeMapLayout";
import {
  BOX_LAYOUT,
  resolveBoxDimensions,
  type BoxCreationObject,
} from "@/components/visualEngine/objectConditions/boxCreation";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";
import {
  useDrawingStageTimeline,
  type DrawingStageTimelineHandle,
} from "@/components/visualEngine/useDrawingStageTimeline";
import {
  isBoxCreationItem,
  isCodeMapStage,
  isTrunkBoxItem,
  type DrawingStage as DrawingStageModel,
} from "@/types/infographics";

export type StageHandle = DrawingStageTimelineHandle;

interface StageProps {
  drawingStage: DrawingStageModel;
  /** Bump when a new diagram should play from the start (new API answer). */
  playKey?: number;
  onTimeUpdate?: (timeMs: number) => void;
  /** Visual theme for box stickers + canvas. Defaults to "default". */
  theme?: ThemeName;
  /**
   * Zoom multiplier. The diagram is sized to fit the container height at
   * zoom=1 (so a single horizontal row stays readable) and overflows
   * horizontally; higher zoom scales the rendered height and the parent
   * scroll container handles panning.
   */
  zoom?: number;
}

/** Base diagram height at zoom=1, before the zoom multiplier. */
const BASE_DIAGRAM_HEIGHT = "min(72vh, 780px)";

/**
 * Compute the actual viewBox size needed to fit all boxes side-by-side.
 *
 * The backend sends `width` / `height` (1400 × 1250) as a baseline, but the
 * horizontal layout has no max box count, so the canvas must grow when there
 * are more boxes than fit in the baseline width.
 */
function computeViewBox(stage: DrawingStageModel): { width: number; height: number } {
  if (isCodeMapStage(stage)) {
    return computeCodeMapViewBox(stage);
  }

  const boxObjects = stage.objects.filter(isTrunkBoxItem) as unknown as BoxCreationObject[];

  const lastBoxRight =
    BOX_LAYOUT.startX +
    boxObjects.length * BOX_LAYOUT.boxWidth +
    Math.max(0, boxObjects.length - 1) * BOX_LAYOUT.horizontalGap;

  const tallestBoxBottom = boxObjects.reduce<number>((max, box, index) => {
    const dims = resolveBoxDimensions(box.text, index);
    return Math.max(max, BOX_LAYOUT.y + dims.height);
  }, BOX_LAYOUT.y);

  // Hug the actual content height (header + box row + console line + bottom
  // gap) instead of the 1250 baseline. The baseline left a tall empty band
  // below a single horizontal row, which shrank the boxes when fitting to
  // height. A modest floor keeps very short diagrams from collapsing.
  const contentHeight = Math.max(560, tallestBoxBottom + 160);

  return {
    width: Math.max(stage.width, lastBoxRight + BOX_LAYOUT.endMargin),
    height: contentHeight,
  };
}

/** SVG canvas for a `DrawingStage` payload; animations run via GSAP timeline. */
export const Stage = forwardRef<StageHandle, StageProps>(function Stage(
  { drawingStage, playKey = 0, onTimeUpdate, theme, zoom = 1 },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timeline = useDrawingStageTimeline(
    svgRef,
    drawingStage,
    playKey,
    onTimeUpdate,
  );

  useImperativeHandle(ref, () => timeline, [timeline]);

  const { width, height } = computeViewBox(drawingStage);
  const viewBox = `0 0 ${width} ${height}`;
  const themeObj = getTheme(theme);

  // Width is derived from the viewBox aspect ratio (`width: auto` on an SVG
  // with a viewBox). The wrapper uses `w-max` so it grows to the rendered
  // SVG width, letting the parent scroll container pan horizontally. The
  // theme canvas color lives on the wrapper (which fills the viewport area
  // via `min-h-full`/`min-w-full`) so any space the SVG doesn't cover —
  // below or beside it — still reads as the active theme.
  return (
    <div
      className="flex min-h-full w-max min-w-full items-center justify-center p-4"
      style={{ backgroundColor: themeObj.canvasColor }}
    >
      <svg
        ref={svgRef}
        id="drawing-stage-svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          height: `calc(${BASE_DIAGRAM_HEIGHT} * ${zoom})`,
          width: "auto",
        }}
      >
        <DrawingStageSvgContent
          stage={drawingStage}
          theme={theme}
          canvasWidth={width}
          canvasHeight={height}
        />
      </svg>
    </div>
  );
});