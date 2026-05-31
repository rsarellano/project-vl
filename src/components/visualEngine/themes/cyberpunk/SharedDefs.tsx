import { CYBERPUNK_TOKENS as T } from "./tokens";

/**
 * Cyberpunk defs:
 *  - cyan glow filter applied to step-box outlines
 *  - magenta glow filter applied to the answer-box outline (stronger blur)
 *  - subtle grid pattern overlaid on the dark canvas
 *
 * The glow effect is built with `feGaussianBlur` + `feFlood` + `feComposite`
 * so the blur is colored to the neon hue (rather than just blurring the
 * stroke's own color, which would only give a softer cyan halo). This makes
 * the magenta answer box feel meaningfully different from the cyan trunk.
 */
export function CyberpunkDefs() {
  return (
    <defs>
      <filter
        id={T.filterCyanId}
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor={T.primaryNeon} floodOpacity="0.55" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter
        id={T.filterMagentaId}
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
      >
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feFlood floodColor={T.answerNeon} floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <pattern
        id={T.patternGridId}
        width="22"
        height="22"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 22 0 L 0 0 0 22"
          fill="none"
          stroke={T.gridLine}
          strokeWidth="1"
          opacity="0.7"
        />
      </pattern>
    </defs>
  );
}
