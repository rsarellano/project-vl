import { DEFAULT_GRID_PATTERN_ID } from "./SharedDefs";

/**
 * Default background: solid white fill plus a faint grid overlay. Receives
 * the actual rendered canvas dimensions so it always covers the whole
 * viewBox (which can exceed `stage.width` when many trunk boxes push the
 * canvas wider — see `Stage.tsx#computeViewBox`).
 */
export function DefaultBackgroundDecor({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <>
      <rect width={width} height={height} fill="#ffffff" />
      <rect width={width} height={height} fill={`url(#${DEFAULT_GRID_PATTERN_ID})`} />
    </>
  );
}
