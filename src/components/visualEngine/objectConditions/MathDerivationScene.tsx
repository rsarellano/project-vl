"use client";

import { useEffect, useRef } from "react";
import MotionStageBeat from "@/components/visualEngine/derivation/MotionStageBeat";
import MotionStickerBeat from "@/components/visualEngine/derivation/MotionStickerBeat";
import SideExplainBeat, {
  parseSideExplain,
  parseWhyExplain,
} from "@/components/visualEngine/derivation/SideExplainBeat";
import KatexMathHtml from "@/components/visualEngine/KatexMathHtml";
import MixedMathText from "@/components/visualEngine/MixedMathText";
import {
  playDerivationTimeline,
  resetDerivationTimeline,
} from "@/components/visualEngine/mathDerivationTimeline";
import { resolveDerivationBeats } from "@/lib/mathDerivation/flattenBeats";
import {
  contextTextsForMotionStage,
  inferBothSidesOperation,
} from "@/lib/mathDerivation/inferMotionOperation";
import type { MathDerivationBeat, MathStepDerivation } from "@/lib/mathDerivation/types";
import type { ThemeName } from "@/components/visualEngine/themes";

type MathDerivationSceneProps = {
  derivation: MathStepDerivation;
  theme?: ThemeName;
};

function ArrowDown({ chalk }: { chalk: boolean }) {
  const stroke = chalk ? "rgba(242,242,234,0.55)" : "#64748b";
  return (
    <svg
      width={24}
      height={32}
      viewBox="0 0 24 32"
      aria-hidden
      className="mx-auto block"
    >
      <line
        x1={12}
        y1={4}
        x2={12}
        y2={24}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <polyline
        points="6,20 12,28 18,20"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Nearest ``expression`` text before / after a given beat index. */
function surroundingExpressions(
  beats: MathDerivationBeat[],
  index: number,
): { fromExpr?: string; toExpr?: string } {
  let fromExpr: string | undefined;
  for (let i = index - 1; i >= 0; i -= 1) {
    const beat = beats[i];
    if (beat.type === "expression") {
      fromExpr = beat.text;
      break;
    }
  }

  let toExpr: string | undefined;
  for (let i = index + 1; i < beats.length; i += 1) {
    const beat = beats[i];
    if (beat.type === "expression") {
      toExpr = beat.text;
      break;
    }
  }

  return { fromExpr, toExpr };
}

function BeatBlock({
  beat,
  index,
  isChalk,
  beats,
}: {
  beat: MathDerivationBeat;
  index: number;
  isChalk: boolean;
  beats: MathDerivationBeat[];
}) {
  const noteClass = isChalk
    ? "text-xs leading-snug text-[rgba(242,242,234,0.72)]"
    : "text-xs leading-snug text-slate-600";

  const explainClass = isChalk
    ? "rounded-lg border border-[rgba(242,242,234,0.22)] bg-[rgba(0,0,0,0.12)] px-3 py-2.5 text-xs leading-relaxed text-[rgba(242,242,234,0.85)]"
    : "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700 shadow-sm";

  const motionClass = isChalk
    ? "rounded-lg border border-[rgba(232,208,96,0.35)] bg-[rgba(0,0,0,0.16)] px-3 py-2"
    : "rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2";

  const beatProps = {
    "data-derivation-beat": true,
    "data-beat-index": index,
    "data-beat-type": beat.type,
  };

  switch (beat.type) {
    case "note":
      return (
        <p {...beatProps} className={noteClass}>
          <MixedMathText text={beat.text} chalk={isChalk} />
        </p>
      );
    case "expression":
      return (
        <div {...beatProps}>
          <KatexMathHtml expression={beat.text} chalk={isChalk} />
        </div>
      );
    case "arrow":
      return (
        <div {...beatProps}>
          <ArrowDown chalk={isChalk} />
        </div>
      );
    case "explain": {
      const isFullWidth =
        Boolean(parseSideExplain(beat.text)) || Boolean(parseWhyExplain(beat.text));
      return (
        <div {...beatProps} className={isFullWidth ? "w-full" : explainClass}>
          <SideExplainBeat text={beat.text} chalk={isChalk} />
        </div>
      );
    }
    case "motion":
      return (
        <div
          {...beatProps}
          className={motionClass}
          data-motion-term={beat.term}
          data-motion-kind={beat.motion}
        >
          <MotionStickerBeat
            expression={beat.text}
            glyphIdPrefix={beat.id ?? `motion-${index}`}
            chalk={isChalk}
          />
        </div>
      );
    case "motion_stage": {
      const surrounding = surroundingExpressions(beats, index);
      const fromExpr = beat.from?.trim() || surrounding.fromExpr;
      const toExpr = beat.to?.trim() || surrounding.toExpr;
      const contextTexts = contextTextsForMotionStage(beats, index);
      const inferredOperation = inferBothSidesOperation(fromExpr, toExpr, contextTexts);
      const providedOperation = beat.operation?.trim();
      // Signed terms (+x, -5) from inference beat wrong labels like "squared".
      const operation =
        inferredOperation && /^[+-]/.test(inferredOperation)
          ? inferredOperation
          : providedOperation && providedOperation.length
            ? providedOperation
            : inferredOperation;
      return (
        <div {...beatProps} className="w-full">
          <MotionStageBeat
            steps={beat.steps}
            stageId={beat.id ?? `stage-${index}`}
            chalk={isChalk}
            fromExpr={fromExpr}
            toExpr={toExpr}
            frames={beat.frames}
            operation={operation}
          />
        </div>
      );
    }
    default:
      return null;
  }
}

/** Renders ``derivation.beats`` (or legacy frames) and plays sequential fade-ins. */
export default function MathDerivationScene({
  derivation,
  theme,
}: MathDerivationSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isChalk = theme === "chalkboard";
  const beats = resolveDerivationBeats(derivation);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    resetDerivationTimeline(root);
    const timeline = playDerivationTimeline(root);
    return () => {
      timeline.kill();
      resetDerivationTimeline(root);
    };
  }, [derivation]);

  if (!beats.length) return null;

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto p-1"
      data-math-derivation-scene
    >
      {beats.map((beat, index) => (
        <BeatBlock
          key={`${beat.type}-${index}`}
          beat={beat}
          index={index}
          isChalk={isChalk}
          beats={beats}
        />
      ))}
    </div>
  );
}
