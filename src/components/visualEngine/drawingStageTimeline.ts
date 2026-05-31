import gsap from "gsap";
import { getCodeMapAnimationEntries } from "@/components/visualEngine/layouts/codeMapLayout";
import {
  getBoxAnimationEntries,
  type BoxCreationObject,
} from "@/components/visualEngine/objectConditions/boxCreation";
import { getLineAnimationEntries } from "@/components/visualEngine/objectConditions/lineCreation";
import {
  getTextAnimationEntries,
  type TextCreationObject,
} from "@/components/visualEngine/objectConditions/textCreation";
import {
  isCodeMapStage,
  isTextCreationItem,
  isTrunkBoxItem,
  type DrawingStage,
} from "@/types/infographics";

type AnimationEntry = {
  id: string;
  animation: { durationMs: number; delayMs: number };
};

function findByStageId(root: SVGSVGElement, id: string): Element | null {
  return root.querySelector(`[data-stage-id="${CSS.escape(id)}"]`);
}

function getDurationSeconds(animation: { durationMs: number }): number {
  return animation.durationMs / 1000;
}

function getDelaySeconds(animation: { durationMs: number; delayMs: number }): number {
  return animation.delayMs / 1000;
}

function collectAnimationEntries(stage: DrawingStage): {
  fades: AnimationEntry[];
  lines: AnimationEntry[];
} {
  if (isCodeMapStage(stage)) {
    return getCodeMapAnimationEntries(stage);
  }

  const objects = stage.objects;
  const flagBoxObjects = objects.filter(isTrunkBoxItem) as unknown as BoxCreationObject[];
  const textObjects = objects.filter(isTextCreationItem) as unknown as TextCreationObject[];

  return {
    fades: [
      ...getBoxAnimationEntries(flagBoxObjects),
      ...getTextAnimationEntries(textObjects),
    ],
    lines: getLineAnimationEntries(stage.connections ?? [], flagBoxObjects),
  };
}

/** Code-map connectors use absolute layout coords — avoid y-shifts on panel/highlights. */
function getFadeInitialProps(stage: DrawingStage): gsap.TweenVars {
  if (isCodeMapStage(stage)) {
    return { opacity: 0 };
  }
  return { opacity: 0, y: 12, transformOrigin: "center center" };
}

function getFadeFinalProps(stage: DrawingStage): gsap.TweenVars {
  if (isCodeMapStage(stage)) {
    return { opacity: 1 };
  }
  return { opacity: 1, y: 0 };
}

/** Initial hidden / undrawn state before the timeline runs. */
export function setDrawingStageInitialState(
  root: SVGSVGElement,
  stage: DrawingStage,
): void {
  const { fades, lines } = collectAnimationEntries(stage);
  const fadeInitial = getFadeInitialProps(stage);

  for (const entry of fades) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    gsap.set(el, fadeInitial);
  }

  for (const entry of lines) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    gsap.set(el, {
      opacity: 0,
      strokeDasharray: 1,
      strokeDashoffset: 1,
    });
  }
}

/** Jump to the fully revealed state (used before SVG export). */
export function setDrawingStageEndState(
  root: SVGSVGElement,
  stage: DrawingStage,
): void {
  const { fades, lines } = collectAnimationEntries(stage);
  const fadeFinal = getFadeFinalProps(stage);
  const fadeClear = isCodeMapStage(stage) ? "opacity" : "transform";

  for (const entry of fades) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    gsap.set(el, { ...fadeFinal, clearProps: fadeClear });
  }

  for (const entry of lines) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    gsap.set(el, {
      opacity: 1,
      strokeDashoffset: 0,
      clearProps: "strokeDashoffset,strokeDasharray,opacity",
    });
  }
}

export function buildDrawingStageTimeline(
  root: SVGSVGElement,
  stage: DrawingStage,
  onTimeUpdate?: (timeMs: number) => void,
): gsap.core.Timeline {
  const { fades, lines } = collectAnimationEntries(stage);
  const fadeFinal = getFadeFinalProps(stage);

  const tl = gsap.timeline({
    onUpdate: () => onTimeUpdate?.(Math.round(tl.time() * 1000)),
  });

  for (const entry of fades) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    tl.to(
      el,
      {
        ...fadeFinal,
        duration: getDurationSeconds(entry.animation),
      },
      getDelaySeconds(entry.animation),
    );
  }

  for (const entry of lines) {
    const el = findByStageId(root, entry.id);
    if (!el) continue;
    tl.to(
      el,
      {
        opacity: 1,
        strokeDashoffset: 0,
        duration: getDurationSeconds(entry.animation),
      },
      getDelaySeconds(entry.animation),
    );
  }

  return tl;
}
