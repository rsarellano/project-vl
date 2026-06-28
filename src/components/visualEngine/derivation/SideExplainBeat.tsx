"use client";

import MixedMathText from "@/components/visualEngine/MixedMathText";

type SideExplainBeatProps = {
  text: string;
  chalk?: boolean;
};

export type ParsedSideExplain = {
  side: "left" | "right";
  label: string;
  body: string;
};

/** Split "The left side: …" into a label row + body for consistent side boxes. */
export function parseSideExplain(text: string): ParsedSideExplain | null {
  const match = text.trim().match(/^The\s+(left|right)\s+side:?\s*([\s\S]*)$/i);
  if (!match) return null;

  const side = match[1].toLowerCase() as "left" | "right";
  const body = (match[2] ?? "").trim();
  if (!body) return null;

  return {
    side,
    label: side === "left" ? "Left side" : "Right side",
    body,
  };
}

/** Detect a reason beat like "Why: …" / "Why we do this: …" → renders as a callout. */
export function parseWhyExplain(text: string): { body: string } | null {
  const match = text
    .trim()
    .match(/^why(?:\s+(?:we|this|it)[\s\S]*?)?[:.\u2014-]?\s*([\s\S]*)$/i);
  if (!match) return null;

  const body = (match[1] ?? "").trim();
  if (!body) return null;

  return { body };
}

function WhyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M8 1.75a4.25 4.25 0 0 0-2.6 7.61c.43.34.72.83.78 1.38l.02.26h3.6l.02-.26c.06-.55.35-1.04.78-1.38A4.25 4.25 0 0 0 8 1.75Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.4 13h3.2M6.9 14.4h2.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Paired left/right explain box — same layout for both sides. */
export default function SideExplainBeat({ text, chalk }: SideExplainBeatProps) {
  const why = parseWhyExplain(text);
  if (why) {
    const whyBox = chalk
      ? "rounded-lg border border-[rgba(232,208,96,0.4)] bg-[rgba(232,208,96,0.1)] px-3 py-2.5"
      : "rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5";
    const whyLabel = chalk
      ? "mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[rgba(232,208,96,0.85)]"
      : "mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-700";
    const whyBody = chalk
      ? "text-xs leading-relaxed text-[rgba(242,242,234,0.9)]"
      : "text-xs leading-relaxed text-amber-950";

    return (
      <div className={whyBox} data-why-explain>
        <span className={whyLabel}>
          <WhyIcon className="h-3 w-3" />
          Why this step
        </span>
        <div className={whyBody}>
          <MixedMathText text={why.body} chalk={chalk} />
        </div>
      </div>
    );
  }

  const parsed = parseSideExplain(text);
  if (!parsed) {
    return <MixedMathText text={text} chalk={chalk} />;
  }

  const boxClass = chalk
    ? "rounded-lg border border-[rgba(242,242,234,0.22)] bg-[rgba(0,0,0,0.12)] px-3 py-2.5"
    : "rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm";

  const labelClass = chalk
    ? "mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[rgba(232,208,96,0.75)]"
    : "mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500";

  const bodyClass = chalk
    ? "text-xs leading-relaxed text-[rgba(242,242,234,0.85)]"
    : "text-xs leading-relaxed text-slate-700";

  return (
    <div className={boxClass} data-side-explain={parsed.side}>
      <span className={labelClass}>{parsed.label}</span>
      <div className={bodyClass}>
        <MixedMathText text={parsed.body} chalk={chalk} />
      </div>
    </div>
  );
}
