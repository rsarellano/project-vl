"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import {
  bindMotionStageControls,
  dispatchMotionStageState,
  whenDerivationBeatVisible,
} from "@/components/visualEngine/derivation/motionStageEvents";
import { renderMathHtml } from "@/lib/mathText";

type EquationMorphProps = {
  /** Plain-math equations to morph through, in order (e.g. ["sqrt(2x+5) = x+1", ...]). */
  frames: string[];
  chalk?: boolean;
  autoPlay?: boolean;
  waitForVisible?: boolean;
  loop?: boolean;
  duration?: number;
  /** Stop-motion hold on each frame before crossfading to the next. */
  holdMs?: number;
};

/**
 * Crossfade-morph between equation frames. Each frame holds still before transitioning.
 */
export default function EquationMorph({
  frames,
  chalk,
  autoPlay = false,
  waitForVisible = false,
  loop = false,
  duration = 0.6,
  holdMs = 1100,
}: EquationMorphProps) {
  const cleanFrames = useMemo(
    () => frames.map((f) => (f ?? "").trim()).filter(Boolean),
    [frames],
  );
  const framesKey = cleanFrames.join("\u0000");

  const baseRef = useRef<HTMLDivElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const speedRef = useRef(1);

  useEffect(() => {
    const base = baseRef.current;
    const incoming = incomingRef.current;
    if (!base || !incoming) return;

    const stageHost = base.closest("[data-motion-stage]");
    if (!(stageHost instanceof HTMLElement)) return;
    const stage: HTMLElement = stageHost;

    const render = (latex: string) =>
      renderMathHtml(latex, chalk ? { chalk: true } : undefined);

    const ordered = framesKey ? framesKey.split("\u0000") : [];

    function resetToStart() {
      if (!base || !incoming) return;
      base.innerHTML = render(ordered[0] ?? "");
      gsap.set(base, { opacity: 1, y: 0, scale: 1 });
      gsap.set(incoming, { opacity: 0, y: 0, scale: 1 });
    }

    function play() {
      if (!base || !incoming) return;
      timelineRef.current?.kill();
      resetToStart();

      if (ordered.length < 2) return;

      const tl = gsap.timeline({
        onComplete: () => {
          dispatchMotionStageState(stage, { playing: false, paused: false });
          if (loop) gsap.delayedCall(holdMs / 1000, play);
        },
      });

      for (let k = 0; k < ordered.length - 1; k += 1) {
        tl.call(() => {
          base.innerHTML = render(ordered[k]);
          incoming.innerHTML = render(ordered[k + 1]);
          gsap.set(base, { opacity: 1, y: 0, scale: 1 });
          gsap.set(incoming, { opacity: 0, y: 16, scale: 0.97 });
        });

        tl.to({}, { duration: holdMs / 1000 });

        tl.to(
          base,
          { opacity: 0, y: -16, scale: 0.96, duration, ease: "power2.inOut" },
        );
        tl.to(
          incoming,
          { opacity: 1, y: 0, scale: 1, duration, ease: "power2.out" },
          "<0.08",
        );

        tl.call(() => {
          base.innerHTML = render(ordered[k + 1]);
          gsap.set(base, { opacity: 1, y: 0, scale: 1 });
          gsap.set(incoming, { opacity: 0 });
        });
      }

      tl.timeScale(speedRef.current);
      timelineRef.current = tl;
      dispatchMotionStageState(stage, { playing: true, paused: false });
    }

    resetToStart();

    const unbindControls = bindMotionStageControls(stage, {
      play,
      getTimeline: () => timelineRef.current,
      setSpeed: (speed) => {
        speedRef.current = speed;
      },
    });

    let cancelVisibleWait: (() => void) | undefined;
    if (autoPlay) {
      play();
    } else if (waitForVisible) {
      cancelVisibleWait = whenDerivationBeatVisible(stage, play);
    }

    return () => {
      timelineRef.current?.kill();
      unbindControls();
      cancelVisibleWait?.();
    };
  }, [framesKey, chalk, autoPlay, waitForVisible, loop, duration, holdMs]);

  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative flex min-h-[3rem] w-full items-center justify-center">
        <div
          ref={baseRef}
          className={`absolute inset-0 flex items-center justify-center ${chalk ? "katex-chalk" : ""}`}
          style={{ willChange: "transform, opacity" }}
        />
        <div
          ref={incomingRef}
          className={`absolute inset-0 flex items-center justify-center ${chalk ? "katex-chalk" : ""}`}
          style={{ willChange: "transform, opacity" }}
        />
      </div>
    </div>
  );
}
