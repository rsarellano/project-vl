"use client";

import { useEffect, useRef, useState } from "react";
import BothSidesMorph from "@/components/visualEngine/derivation/BothSidesMorph";
import EquationMorph from "@/components/visualEngine/derivation/EquationMorph";
import {
  dispatchMotionStagePause,
  dispatchMotionStagePlay,
  dispatchMotionStageResume,
  dispatchMotionStageSpeed,
  MOTION_STAGE_STATE_EVENT,
  type MotionStageStateDetail,
} from "@/components/visualEngine/derivation/motionStageEvents";
import { buildExpansionFrames } from "@/lib/mathDerivation/binomialExpansion";
import { buildCombineLikeTermsFrames } from "@/lib/mathDerivation/combineLikeTermsFrames";
import type { MathDerivationMotionStep } from "@/lib/mathDerivation/types";

type MotionStageBeatProps = {
  steps?: MathDerivationMotionStep[];
  stageId?: string;
  chalk?: boolean;
  fromExpr?: string;
  toExpr?: string;
  frames?: string[];
  operation?: string;
};

function motionControlButtonClass(chalk: boolean, disabled?: boolean) {
  const base = chalk
    ? "group relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(232,208,96,0.55)] bg-[rgba(0,0,0,0.45)] text-[#e8d060] shadow-sm transition-all duration-150 hover:scale-110 hover:border-[#e8d060] hover:bg-[rgba(232,208,96,0.22)] hover:text-[#f5e6a8] hover:shadow-[0_0_0_3px_rgba(232,208,96,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d060]/80 active:scale-95"
    : "group relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-700 shadow-sm transition-all duration-150 hover:scale-110 hover:border-amber-500 hover:bg-amber-100 hover:text-amber-900 hover:shadow-md hover:ring-2 hover:ring-amber-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 active:scale-95";

  if (!disabled) return base;

  return `${base} cursor-not-allowed opacity-40 hover:scale-100 hover:shadow-sm hover:ring-0`;
}

const MOTION_SPEEDS = [0.5, 1, 1.5, 2] as const;

function formatSpeed(speed: number): string {
  return `${Number.isInteger(speed) ? speed : speed.toFixed(1)}x`;
}

function motionSpeedButtonClass(chalk: boolean) {
  return chalk
    ? "group relative inline-flex h-7 min-w-[2.4rem] items-center justify-center rounded-full border border-[rgba(232,208,96,0.55)] bg-[rgba(0,0,0,0.45)] px-2 text-[11px] font-semibold tabular-nums text-[#e8d060] shadow-sm transition-all duration-150 hover:scale-105 hover:border-[#e8d060] hover:bg-[rgba(232,208,96,0.22)] hover:text-[#f5e6a8] hover:shadow-[0_0_0_3px_rgba(232,208,96,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d060]/80 active:scale-95"
    : "group relative inline-flex h-7 min-w-[2.4rem] items-center justify-center rounded-full border border-amber-300 bg-white px-2 text-[11px] font-semibold tabular-nums text-amber-700 shadow-sm transition-all duration-150 hover:scale-105 hover:border-amber-500 hover:bg-amber-100 hover:text-amber-900 hover:shadow-md hover:ring-2 hover:ring-amber-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 active:scale-95";
}

function motionControlTooltipClass(chalk: boolean) {
  return chalk
    ? "pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-md border border-[rgba(232,208,96,0.45)] bg-[rgba(20,20,20,0.92)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#f5e6a8] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 translate-y-[-2px]"
    : "pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-md border border-amber-200 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 translate-y-[-2px]";
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M5.5 4.5v7M10.5 4.5v7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResumeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M5.5 4.25v7.5l6.5-3.75-6.5-3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M2.75 8a5.25 5.25 0 1 0 1.65-3.84"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.75 3.25V6.5H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Animated yellow box — morphs the equation through this step (katex simulator style). */
export default function MotionStageBeat({
  chalk,
  fromExpr,
  toExpr,
  frames,
  operation,
}: MotionStageBeatProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<MotionStageStateDetail>({
    playing: false,
    paused: false,
  });
  const [speed, setSpeed] = useState(1);

  const isChalk = Boolean(chalk);
  const tooltipClass = motionControlTooltipClass(isChalk);

  const stageClass = isChalk
    ? "relative flex min-h-[6.5rem] w-full flex-col rounded-lg border border-[rgba(232,208,96,0.45)] bg-[rgba(0,0,0,0.2)] px-3 py-2"
    : "relative flex min-h-[6.5rem] w-full flex-col rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 px-3 py-2";

  // Explicit AI frames win; otherwise auto-build FOIL or combine-like-terms
  // sequences so the yellow box morphs through stages instead of jumping.
  const explicitFrames = frames && frames.length ? frames : undefined;
  const autoFrames = explicitFrames
    ? undefined
    : buildExpansionFrames(fromExpr, toExpr) ??
      buildCombineLikeTermsFrames(fromExpr, toExpr) ??
      undefined;
  const richFrames = explicitFrames ?? autoFrames;

  const morphFrames =
    richFrames && richFrames.length
      ? richFrames
      : [fromExpr, toExpr].filter((v): v is string => Boolean(v && v.trim()));

  const canBothSides =
    Boolean(fromExpr?.includes("=")) && Boolean(toExpr?.includes("="));

  const trimmedOperation = operation?.trim();

  // FOIL / multi-frame expansions need EquationMorph; balancing steps use the
  // split layout with floating operation badges (katex simulator style).
  const isExpansionSequence = Boolean(richFrames && richFrames.length >= 3);
  const useBothSidesMorph =
    canBothSides &&
    Boolean(fromExpr) &&
    Boolean(toExpr) &&
    !isExpansionSequence;

  const useFrameMorph =
    Boolean(richFrames && richFrames.length >= 2) && !useBothSidesMorph;

  const hasMorphContent = useBothSidesMorph || useFrameMorph || morphFrames.length >= 2;

  const canPause = playback.playing || playback.paused;
  const pauseDisabled = !canPause;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onState = (event: Event) => {
      const detail = (event as CustomEvent<MotionStageStateDetail>).detail;
      if (detail) setPlayback(detail);
    };

    stage.addEventListener(MOTION_STAGE_STATE_EVENT, onState);
    return () => stage.removeEventListener(MOTION_STAGE_STATE_EVENT, onState);
  }, []);

  function handleReplay() {
    if (stageRef.current) dispatchMotionStagePlay(stageRef.current);
  }

  function handlePauseToggle() {
    if (!stageRef.current || pauseDisabled) return;
    if (playback.paused) {
      dispatchMotionStageResume(stageRef.current);
    } else {
      dispatchMotionStagePause(stageRef.current);
    }
  }

  function handleSpeedCycle() {
    if (!stageRef.current) return;
    const index = MOTION_SPEEDS.indexOf(speed as (typeof MOTION_SPEEDS)[number]);
    const next = MOTION_SPEEDS[(index + 1) % MOTION_SPEEDS.length];
    setSpeed(next);
    dispatchMotionStageSpeed(stageRef.current, next);
  }

  return (
    <div
      ref={stageRef}
      data-motion-stage
      className={stageClass}
      aria-label="Animation stage"
    >
      {hasMorphContent ? (
        <div className="mb-1 flex w-full shrink-0 items-center justify-end gap-1 pb-1.5">
          <button
            type="button"
            onClick={handleSpeedCycle}
            className={motionSpeedButtonClass(isChalk)}
            aria-label={`Playback speed ${formatSpeed(speed)}`}
            title="Playback speed"
          >
            {formatSpeed(speed)}
            <span className={tooltipClass} aria-hidden>
              Speed
            </span>
          </button>

          <button
            type="button"
            onClick={handlePauseToggle}
            disabled={pauseDisabled}
            className={motionControlButtonClass(isChalk, pauseDisabled)}
            aria-label={playback.paused ? "Resume animation" : "Pause animation"}
            title={playback.paused ? "Resume animation" : "Pause animation"}
          >
            {playback.paused ? (
              <ResumeIcon className="h-3.5 w-3.5" />
            ) : (
              <PauseIcon className="h-3.5 w-3.5" />
            )}
            {!pauseDisabled ? (
              <span className={tooltipClass} aria-hidden>
                {playback.paused ? "Resume" : "Pause"}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className={motionControlButtonClass(isChalk)}
            aria-label="Replay animation"
            title="Replay animation"
          >
            <ReplayIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-rotate-45" />
            <span className={tooltipClass} aria-hidden>
              Replay
            </span>
          </button>
        </div>
      ) : null}

      {useFrameMorph ? (
        <EquationMorph frames={morphFrames} chalk={chalk} waitForVisible />
      ) : useBothSidesMorph && fromExpr && toExpr ? (
        <BothSidesMorph
          before={fromExpr}
          after={toExpr}
          operation={trimmedOperation}
          chalk={chalk}
          waitForVisible
        />
      ) : morphFrames.length >= 2 ? (
        <EquationMorph frames={morphFrames} chalk={chalk} waitForVisible />
      ) : null}
    </div>
  );
}
