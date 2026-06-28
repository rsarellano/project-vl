"use client";

import MathExpressionPreview from "@/components/MathExpressionPreview";
import type { MathSkinId } from "@/lib/mathSkins";
import { looksLikeMathInput, parseMathLine } from "@/lib/mathText";

type MathPreviewProps = {
  text: string;
  label?: string;
  className?: string;
  mathSkin?: MathSkinId;
  chalk?: boolean;
};

function previewLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => parseMathLine(line).kind !== "plain");
}

export default function MathPreview({
  text,
  label,
  className = "",
  mathSkin,
  chalk = false,
}: MathPreviewProps) {
  const lines = previewLines(text);
  if (!lines.length && !looksLikeMathInput(text)) return null;

  const renderLines = lines.length ? lines : [text.trim()];
  const chalkStyled = chalk;

  return (
    <div
      className={
        chalkStyled
          ? `katex-chalk-preview ${className}`.trim()
          : `rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 ${className}`
      }
    >
      {label ? (
        <p
          className={
            chalkStyled
              ? "mb-1.5 text-xs font-medium text-[rgba(242,242,234,0.55)]"
              : "mb-1.5 text-xs font-medium text-slate-500"
          }
        >
          {label}
        </p>
      ) : null}
      <div
        className={`flex flex-col gap-2 overflow-x-auto ${chalkStyled ? "text-[#f2f2ea]" : "text-slate-900"}`}
      >
        {renderLines.map((line, index) => (
          <MathExpressionPreview
            key={`${line}-${index}`}
            expression={line}
            mathSkin={mathSkin}
            chalk={chalk}
            fontSize={16}
            className="text-base leading-relaxed"
          />
        ))}
      </div>
    </div>
  );
}
