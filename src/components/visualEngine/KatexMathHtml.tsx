"use client";

import { renderMathHtml } from "@/lib/mathText";

type KatexMathHtmlProps = {
  expression: string;
  chalk?: boolean;
  className?: string;
  /** Inline for prose; block for standalone equations. */
  inline?: boolean;
};

/** Render a math expression with KaTeX (detail panel / explanations). */
export default function KatexMathHtml({
  expression,
  chalk,
  className = "",
  inline = false,
}: KatexMathHtmlProps) {
  const html = renderMathHtml(expression, chalk ? { chalk: true } : undefined);
  const Tag = inline ? "span" : "div";

  return (
    <Tag
      className={[
        inline ? "mx-0.5 inline-block align-middle" : "overflow-visible py-0.5",
        chalk ? "katex-chalk" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
