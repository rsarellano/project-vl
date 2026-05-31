/**
 * Default theme defs: a single light grid pattern referenced by
 * `BackgroundDecor` to draw faint canvas grid lines under the diagram.
 */

export const DEFAULT_GRID_PATTERN_ID = "vl-default-grid";

const GRID_STEP = 20;

export function DefaultDefs() {
  return (
    <defs>
      <pattern
        id={DEFAULT_GRID_PATTERN_ID}
        width={GRID_STEP}
        height={GRID_STEP}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="0.6"
        />
      </pattern>
    </defs>
  );
}
