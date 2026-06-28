"use client";

import KatexMathHtml from "@/components/visualEngine/KatexMathHtml";
import { splitMixedMathText } from "@/lib/mathText";

type MixedMathTextProps = {
  text: string;
  chalk?: boolean;
  className?: string;
};

/**
 * Prose with embedded math — AI sends plain text; frontend renders math chunks with KaTeX only.
 */
export default function MixedMathText({
  text,
  chalk,
  className = "",
}: MixedMathTextProps) {
  const segments = splitMixedMathText(text);

  if (segments.length === 1 && segments[0].kind === "plain") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.kind === "plain" ? (
          <span key={`p-${index}`}>{segment.text}</span>
        ) : (
          <KatexMathHtml
            key={`m-${index}`}
            expression={segment.text}
            chalk={chalk}
            inline
          />
        ),
      )}
    </span>
  );
}
