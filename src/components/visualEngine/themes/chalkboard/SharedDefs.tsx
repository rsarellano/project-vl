import { CHALKBOARD_TOKENS as T } from "./tokens";

/** SVG filters + board texture pattern for chalk rendering. */
export function ChalkboardDefs() {
  return (
    <defs>
      <filter id={T.filterChalkSoftId} x="-8%" y="-8%" width="116%" height="116%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feFlood floodColor={T.chalkWhite} floodOpacity="0.18" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <pattern
        id={T.patternBoardId}
        width="120"
        height="120"
        patternUnits="userSpaceOnUse"
      >
        <rect width="120" height="120" fill={T.canvasDark} />
        <circle cx="18" cy="24" r="28" fill={T.boardSmudge} />
        <circle cx="92" cy="78" r="36" fill={T.boardSmudge} />
        <path
          d="M 0 60 Q 40 58 80 62 T 120 60"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="2"
        />
      </pattern>

      <radialGradient id="vl-chalkboard-vignette" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
      </radialGradient>
    </defs>
  );
}
