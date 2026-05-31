import { CYBERPUNK_TOKENS as T } from "./tokens";

/**
 * Dark canvas with a faint grid pattern. The grid is subtle on purpose so
 * it reads as "tech surface" rather than competing with the box outlines.
 */
export function CyberpunkBackgroundDecor({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <>
      <rect width={width} height={height} fill={T.canvas} />
      <rect
        width={width}
        height={height}
        fill={`url(#${T.patternGridId})`}
        opacity={0.45}
      />
    </>
  );
}
