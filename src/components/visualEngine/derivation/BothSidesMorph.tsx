"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  bindMotionStageControls,
  dispatchMotionStageState,
  whenDerivationBeatVisible,
} from "@/components/visualEngine/derivation/motionStageEvents";
import { renderMathHtml } from "@/lib/mathText";

type BothSidesMorphProps = {
  /** Full equations in plain math; split on the comparator. */
  before: string;
  after: string;
  /** Operation floated above both sides, e.g. "+x" or "-5" (plain math). */
  operation?: string;
  comparator?: string;
  chalk?: boolean;
  /** Play immediately on mount (standalone demos). */
  autoPlay?: boolean;
  /** Wait until the parent derivation beat is visible, then play once. */
  waitForVisible?: boolean;
  loop?: boolean;
  duration?: number;
  /** Stop-motion hold on the starting frame (+ operation badge) before morphing. */
  holdMs?: number;
  /** Stop-motion hold on the result before looping. */
  endHoldMs?: number;
};

function splitEquation(equation: string, comparator: string) {
  if (!equation) return { left: "", right: "" };
  const idx = equation.indexOf(comparator);
  if (idx === -1) return { left: equation.trim(), right: "" };
  return {
    left: equation.slice(0, idx).trim(),
    right: equation.slice(idx + comparator.length).trim(),
  };
}

function applyCancelMath(expr: string, op: string) {
  if (!op || !expr) return { expr, cancelled: false };
  const cleanOp = op.replace(/\s+/g, "");
  const isAdd = cleanOp.startsWith("+");
  const isSub = cleanOp.startsWith("-");
  if (!isAdd && !isSub) return { expr, cancelled: false };
  
  const inverseOp = isAdd ? cleanOp.replace("+", "-") : cleanOp.replace("-", "+");
  const escapedInverse = inverseOp.split('').map(c => /[a-zA-Z0-9]/.test(c) ? c : '\\' + c).join('\\s*');
  
  const regex = new RegExp(`^(.*?)(${escapedInverse})\\s*$`);
  if (regex.test(expr)) {
    const nextExpr = expr.replace(regex, (match, prefix, term) => {
      const trimmed = prefix.trim();
      if (!trimmed || /[=+\-*/(]$/.test(trimmed)) {
        return `${prefix}\\cancel{${term}}`;
      }
      return `${prefix}\\cancel{{}${term}}`;
    });
    return { expr: nextExpr, cancelled: true };
  }
  return { expr, cancelled: false };
}


/**
 * "Do the same thing to both sides" morph. Starts on a stop-motion frame with the
 * operation badge visible, holds, then morphs each side into its new form.
 */
export default function BothSidesMorph({
  before,
  after,
  operation = "",
  comparator = "=",
  chalk,
  autoPlay = false,
  waitForVisible = false,
  loop = false,
  duration = 0.4,
  holdMs = 900,
  endHoldMs = 700,
}: BothSidesMorphProps) {
  const splitBefore = splitEquation(before, comparator);
  const splitAfter = splitEquation(after, comparator);

  const leftFrom = splitBefore.left;
  const rightFrom = splitBefore.right;
  const leftTo = splitAfter.left;
  const rightTo = splitAfter.right;

  const key = [leftFrom, rightFrom, leftTo, rightTo, operation, String(chalk)].join(
    "\u0000",
  );

  const outerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLSpanElement>(null);
  const rightContentRef = useRef<HTMLSpanElement>(null);
  const leftBadgeRef = useRef<HTMLSpanElement>(null);
  const rightBadgeRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const speedRef = useRef(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const grid = gridRef.current;
    if (!outer || !grid) return;

    const fit = () => {
      grid.style.transform = "none";
      grid.style.width = "max-content";
      const available = outer.clientWidth;
      const needed = grid.scrollWidth;
      if (needed > available && available > 0) {
        const scale = available / needed;
        grid.style.transform = `scale(${scale})`;
        grid.style.transformOrigin = "center center";
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [key]);

  useEffect(() => {
    const leftEl = leftContentRef.current;
    const rightEl = rightContentRef.current;
    const badges = [leftBadgeRef.current, rightBadgeRef.current].filter(
      Boolean,
    ) as HTMLSpanElement[];
    if (!leftEl || !rightEl) return;

    const stageHost = leftEl.closest("[data-motion-stage]");
    if (!(stageHost instanceof HTMLElement)) return;
    const stage: HTMLElement = stageHost;

    const render = (latex: string) =>
      renderMathHtml(latex, chalk ? { chalk: true } : undefined);

    function resetToStart() {
      if (!leftEl || !rightEl) return;
      leftEl.innerHTML = render(leftFrom);
      rightEl.innerHTML = render(rightFrom);
      gsap.set([leftEl, rightEl], { opacity: 1, y: 0 });
      if (badges.length) {
        gsap.set(badges, { xPercent: -50, opacity: 0, y: -8 });
        if (leftBadgeRef.current) leftBadgeRef.current.innerHTML = render(operation);
        if (rightBadgeRef.current) rightBadgeRef.current.innerHTML = render(operation);
      }
    }

    function play() {
      if (!leftEl || !rightEl) return;
      timelineRef.current?.kill();
      resetToStart();

      const tl = gsap.timeline({
        onComplete: () => {
          dispatchMotionStageState(stage, { playing: false, paused: false });
          if (loop) gsap.delayedCall(endHoldMs / 1000, play);
        },
      });

      if (operation && badges.length) {
        tl.to(
          badges,
          { opacity: 1, y: -4, duration: duration + 0.1, ease: "back.out(2)" },
          0.15,
        );
        
        const leftCancel = applyCancelMath(leftFrom, operation);
        const rightCancel = applyCancelMath(rightFrom, operation);
        const hasCancel = leftCancel.cancelled || rightCancel.cancelled;

        if (hasCancel) {
          const cancelDur = holdMs / 2 / 1000;
          tl.addLabel("precancel", `+=${cancelDur}`);
          tl.call(() => {
            if (leftCancel.cancelled) {
              leftEl.innerHTML = render(leftCancel.expr);
              if (leftBadgeRef.current) leftBadgeRef.current.innerHTML = render(`\\cancel{${operation}}`);
            }
            if (rightCancel.cancelled) {
              rightEl.innerHTML = render(rightCancel.expr);
              if (rightBadgeRef.current) rightBadgeRef.current.innerHTML = render(`\\cancel{${operation}}`);
            }

            // Setup SVG lines for drawing animation
            const lines = [
              ...leftEl.querySelectorAll("svg line"),
              ...rightEl.querySelectorAll("svg line"),
            ];
            if (leftBadgeRef.current) lines.push(...leftBadgeRef.current.querySelectorAll("svg line"));
            if (rightBadgeRef.current) lines.push(...rightBadgeRef.current.querySelectorAll("svg line"));

            lines.forEach((line) => {
              line.setAttribute("pathLength", "100");
              line.setAttribute("stroke-dasharray", "100");
              line.setAttribute("stroke-dashoffset", "100");
            });
          }, undefined, "precancel");

          const cancelProxy = { progress: 0 };
          tl.to(
            cancelProxy,
            {
              progress: 1,
              duration: cancelDur,
              ease: "power2.out",
              onUpdate: () => {
                const lines = [
                  ...leftEl.querySelectorAll("svg line"),
                  ...rightEl.querySelectorAll("svg line"),
                ];
                if (leftBadgeRef.current) lines.push(...leftBadgeRef.current.querySelectorAll("svg line"));
                if (rightBadgeRef.current) lines.push(...rightBadgeRef.current.querySelectorAll("svg line"));

                lines.forEach((line) => {
                  line.setAttribute("stroke-dashoffset", (100 * (1 - cancelProxy.progress)).toString());
                });
              },
            },
            "precancel"
          );

          tl.addLabel("applied", `+=${cancelDur}`);
        } else {
          tl.addLabel("applied", `+=${holdMs / 1000}`);
        }

        tl.to(
          [leftEl, rightEl],
          { opacity: 0, y: 8, duration, ease: "power2.in" },
          "applied",
        );
        tl.to(
          badges,
          { opacity: 0, y: 16, duration, ease: "power2.in" },
          "applied",
        );
      } else {
        tl.to(
          [leftEl, rightEl],
          { opacity: 0, y: 8, duration, ease: "power2.in" },
          0.15,
        );
      }

      tl.call(() => {
        leftEl.innerHTML = render(leftTo);
        rightEl.innerHTML = render(rightTo);
      });

      tl.to([leftEl, rightEl], {
        opacity: 1,
        y: 0,
        duration: duration + 0.15,
        ease: "power2.out",
      });

      if (!loop) {
        tl.to({}, { duration: endHoldMs / 1000 });
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
  }, [
    key,
    leftFrom,
    rightFrom,
    leftTo,
    rightTo,
    operation,
    chalk,
    autoPlay,
    waitForVisible,
    loop,
    duration,
    holdMs,
    endHoldMs,
  ]);

  const operationHtml = operation
    ? renderMathHtml(operation, chalk ? { chalk: true } : undefined)
    : "";
  const badgeColor = chalk ? "rgba(232,208,96,0.9)" : "#6366f1";

  return (
    <div ref={outerRef} className="w-full min-w-0 px-1 pt-4">
      <div
        ref={gridRef}
        className={`mx-auto grid items-center ${chalk ? "katex-chalk" : ""}`}
        style={{
          gridTemplateColumns: "max-content auto max-content",
          columnGap: "0.45em",
          width: "max-content",
        }}
      >
        <div className="relative inline-flex items-center justify-self-end">
          {operation ? (
            <span
              ref={leftBadgeRef}
              className="pointer-events-none absolute left-1/2 bottom-full z-[1] mb-1.5 whitespace-nowrap font-semibold"
              style={{ color: badgeColor, willChange: "transform, opacity" }}
              dangerouslySetInnerHTML={{ __html: operationHtml }}
            />
          ) : null}
          <span
            ref={leftContentRef}
            className="inline-flex whitespace-nowrap"
            style={{ willChange: "transform, opacity" }}
          />
        </div>

        <span
          className="shrink-0 justify-self-center px-0.5"
          dangerouslySetInnerHTML={{
            __html: renderMathHtml(comparator, chalk ? { chalk: true } : undefined),
          }}
        />

        <div className="relative inline-flex items-center justify-self-start">
          {operation ? (
            <span
              ref={rightBadgeRef}
              className="pointer-events-none absolute left-1/2 bottom-full z-[1] mb-1.5 whitespace-nowrap font-semibold"
              style={{ color: badgeColor, willChange: "transform, opacity" }}
              dangerouslySetInnerHTML={{ __html: operationHtml }}
            />
          ) : null}
          <span
            ref={rightContentRef}
            className="inline-flex whitespace-nowrap"
            style={{ willChange: "transform, opacity" }}
          />
        </div>
      </div>
    </div>
  );
}
