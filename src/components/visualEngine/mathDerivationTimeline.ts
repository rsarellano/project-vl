import gsap from "gsap";
import { findMotionGlyphElements } from "@/lib/mathDerivation/motionGlyphs";
import type { MathDerivationMotionKind } from "@/lib/mathDerivation/types";

const BEAT_DURATION_S = 0.45;
const BEAT_GAP_S = 0.35;
const MOTION_DELAY_S = 0.15;
const MOTION_DURATION_S = 0.75;

function motionTargets(stepEl: HTMLElement, term: string): Element[] {
  const trimmed = term.trim();
  if (trimmed) return findMotionGlyphElements(stepEl, trimmed);
  return Array.from(stepEl.querySelectorAll<SVGGElement>("[data-glyph-id][data-char]"));
}

function runGlyphMotion(
  rootEl: HTMLElement,
  term: string,
  kind: MathDerivationMotionKind,
): void {
  const targets = motionTargets(rootEl, term);
  if (!targets.length) return;

  gsap.set(targets, { transformOrigin: "center center", transformBox: "fill-box" });

  switch (kind) {
    case "slide_right":
      gsap.to(targets, {
        x: 40,
        duration: MOTION_DURATION_S,
        ease: "power2.inOut",
        stagger: 0.04,
      });
      break;
    case "slide_left":
      gsap.to(targets, {
        x: -40,
        duration: MOTION_DURATION_S,
        ease: "power2.inOut",
        stagger: 0.04,
      });
      break;
    case "highlight":
      gsap.to(targets, {
        scale: 1.14,
        duration: 0.28,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
        stagger: 0.03,
      });
      break;
    case "fade_in":
    default:
      gsap.fromTo(
        targets,
        { opacity: 0.25 },
        { opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" },
      );
      break;
  }
}

/** Sequential fade-in for beats; motion beats run sticker glyph tweens after reveal. */
export function playDerivationTimeline(root: HTMLElement): gsap.core.Timeline {
  const beats = root.querySelectorAll<HTMLElement>("[data-derivation-beat]");
  const timeline = gsap.timeline();

  beats.forEach((element, index) => {
    const beatType = element.dataset.beatType;
    const isMotionStage = beatType === "motion_stage";

    if (!isMotionStage) {
      gsap.set(element, { opacity: 1, y: 0 });

      if (beatType === "motion") {
        const term = element.dataset.motionTerm ?? "";
        const kind = (element.dataset.motionKind ?? "highlight") as MathDerivationMotionKind;
        gsap.delayedCall(MOTION_DELAY_S, () => {
          runGlyphMotion(element, term, kind);
        });
      }
      return;
    }

    gsap.set(element, { opacity: 0, y: 6 });
    const position = index === 0 ? 0 : `+=${BEAT_GAP_S}`;

    timeline.to(
      element,
      { opacity: 1, y: 0, duration: BEAT_DURATION_S, ease: "power2.out" },
      position,
    );
  });

  return timeline;
}

export function resetDerivationTimeline(root: HTMLElement): void {
  const beats = root.querySelectorAll<HTMLElement>("[data-derivation-beat]");
  const glyphs = root.querySelectorAll<SVGGElement>("[data-glyph-id][data-char]");

  gsap.killTweensOf([...beats, ...glyphs]);
  gsap.set(beats, { opacity: 1, y: 0 });
  gsap.set(glyphs, { clearProps: "opacity,transform,x,y,scale" });
}
