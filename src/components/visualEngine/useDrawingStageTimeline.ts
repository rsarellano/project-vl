"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef } from "react";
import type { DrawingStage } from "@/types/infographics";
import {
  buildDrawingStageTimeline,
  setDrawingStageInitialState,
} from "@/components/visualEngine/drawingStageTimeline";

export type DrawingStageTimelineHandle = {
  replay: () => void;
  getTimeMs: () => number;
};

export function useDrawingStageTimeline(
  svgRef: React.RefObject<SVGSVGElement | null>,
  stage: DrawingStage | null,
  playKey: number,
  onTimeUpdate?: (timeMs: number) => void,
): DrawingStageTimelineHandle {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !stage) return;

    timelineRef.current?.kill();
    timelineRef.current = null;

    const frame = requestAnimationFrame(() => {
      setDrawingStageInitialState(svg, stage);
      const tl = buildDrawingStageTimeline(svg, stage, (ms) =>
        onTimeUpdateRef.current?.(ms),
      );
      timelineRef.current = tl;
      onTimeUpdateRef.current?.(0);
      tl.play(0);
    });

    return () => {
      cancelAnimationFrame(frame);
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [svgRef, stage, playKey]);

  const replay = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    onTimeUpdateRef.current?.(0);
    tl.restart(true);
  }, []);

  const getTimeMs = useCallback(
    () => Math.round((timelineRef.current?.time() ?? 0) * 1000),
    [],
  );

  return { replay, getTimeMs };
}
