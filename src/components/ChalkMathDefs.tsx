/** Global chalk grain filter so HTML KaTeX previews can reference `#vl-chalk-text-grain`. */
export function ChalkMathDefs() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter
          id="vl-chalk-text-grain"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            seed="4"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.65"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.25" result="soft" />
          <feMerge>
            <feMergeNode in="soft" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
