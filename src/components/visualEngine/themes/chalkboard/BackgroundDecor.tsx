import { CHALKBOARD_TOKENS as T } from "./tokens";

/** Green chalkboard with subtle smudges and grain. */
export function ChalkboardBackgroundDecor({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <>
      <rect width={width} height={height} fill={T.canvas} />
      <rect width={width} height={height} fill={`url(#${T.patternBoardId})`} opacity={0.9} />
      <rect
        width={width}
        height={height}
        fill="url(#vl-chalkboard-vignette)"
        opacity={0.35}
      />
    </>
  );
}
