"use client";

import { useState } from "react";
import { BOX_HOVER } from "@/components/visualEngine/objectConditions/boxCreation";
import {
  CODE_HIGHLIGHT,
  EXPLAIN_LABEL,
  explainBoxDisplayLines,
  toExplainBoxSpec,
  type ResolvedExplainLayout,
  type ResolvedPortionLayout,
} from "@/components/visualEngine/layouts/codeMapLayout";
type CodeMapExplanationProps = {
  explain: ResolvedExplainLayout;
  linkedPortion?: ResolvedPortionLayout;
  codeLines: string[];
  expanded: boolean;
  onToggle: () => void;
};

const DETAIL_BOX = {
  gapY: 16,
  gapX: 72,
  width: 360,
  padding: 16,
  lineHeight: 16,
  minHeight: 84,
  fill: "#f8fafc",
  stroke: "#334155",
  strokeWidth: 1.2,
  title: "DETAIL",
} as const;

function wrapLine(line: string, maxChars = 46): string[] {
  const normalized = line.trim();
  if (!normalized) return [""];
  if (normalized.length <= maxChars) return [normalized];

  const words = normalized.split(/\s+/);
  const wrapped: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) wrapped.push(current);
    current = word;
  }
  if (current) wrapped.push(current);
  return wrapped.length ? wrapped : [normalized];
}

function wrapLines(lines: string[]): string[] {
  return lines.flatMap((line) => wrapLine(line));
}

function safeEvalCondition(condition: string, value: number): boolean | null {
  const cmp = condition
    .replace(/\s+/g, " ")
    .replace(/\bi\b/g, String(value))
    .trim();

  const match = cmp.match(/^(-?\d+)\s*(<=|>=|<|>|==|!=)\s*(-?\d+)$/);
  if (!match) return null;
  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);

  switch (operator) {
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    default:
      return null;
  }
}

function parseLoopParts(loopLine: string): {
  initValue: number;
  condition: string;
  increment: string;
} | null {
  const match = loopLine.match(/for\s*\(([^;]+);([^;]+);([^)]+)\)/i);
  if (!match) return null;

  const init = match[1].trim();
  const condition = match[2].trim();
  const increment = match[3].trim();
  const initMatch = init.match(/=\s*(-?\d+)/);
  if (!initMatch) return null;
  return {
    initValue: Number(initMatch[1]),
    condition,
    increment,
  };
}

function stepIncrement(value: number, increment: string): number | null {
  const normalized = increment.replace(/\s+/g, "");
  if (normalized.includes("++")) return value + 1;
  if (normalized.includes("--")) return value - 1;

  const plusEq = normalized.match(/\+=(-?\d+)/);
  if (plusEq) return value + Number(plusEq[1]);

  const minusEq = normalized.match(/-=(-?\d+)/);
  if (minusEq) return value - Number(minusEq[1]);

  return null;
}

function buildLoopCheckDetails(loopLine: string): string[] {
  const parts = parseLoopParts(loopLine);
  if (!parts) {
    return [
      "Loop condition check:",
      "Evaluate condition before each run.",
      "If true, execute body then increment.",
      "If false, loop stops.",
    ];
  }

  const lines: string[] = [];
  let value = parts.initValue;
  for (let iteration = 1; iteration <= 6; iteration += 1) {
    const pass = safeEvalCondition(parts.condition, value);
    if (pass === null) break;
    lines.push(
      `Iteration ${iteration}: i = ${value}, ${parts.condition} is ${pass ? "true" : "false"}.`,
    );
    if (!pass) {
      lines.push("Loop stops because condition is false.");
      return lines;
    }
    const next = stepIncrement(value, parts.increment);
    if (next === null) break;
    lines.push(`After ${parts.increment}, i becomes ${next}.`);
    value = next;
  }

  if (!lines.length) {
    lines.push("Condition is checked every iteration before running body.");
  }
  return lines;
}

function buildDetailLines(
  explain: ResolvedExplainLayout,
  linkedPortion: ResolvedPortionLayout | undefined,
  codeLines: string[],
): string[] {
  const label = explain.portionLabel?.trim().toUpperCase() ?? "";
  if (label === "CHECK" && linkedPortion) {
    const [start] = linkedPortion.lines;
    const loopLine = codeLines[start] ?? "";
    return buildLoopCheckDetails(loopLine);
  }

  const base = Array.isArray(explain.text) ? explain.text : explain.text ? [explain.text] : [];
  const lines = base.map((line) => String(line).trim()).filter(Boolean);
  if (!lines.length) return ["No additional details."];
  return lines;
}

export default function CodeMapExplanation({
  explain,
  linkedPortion,
  codeLines,
  expanded,
  onToggle,
}: CodeMapExplanationProps) {
  const [hovered, setHovered] = useState(false);
  const displayLines = explainBoxDisplayLines(explain.text, explain.portionLabel);
  const hasLabel = Boolean(explain.portionLabel?.trim());
  const box = toExplainBoxSpec(explain);
  const detailLines = wrapLines(buildDetailLines(explain, linkedPortion, codeLines));
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const textX = box.x + box.padding;
  const textY = box.y + box.padding;
  const detailHeight = Math.max(
    DETAIL_BOX.minHeight,
    detailLines.length * DETAIL_BOX.lineHeight + DETAIL_BOX.padding * 2,
  );
  const detailY = box.y + DETAIL_BOX.gapY;
  const detailX = box.x + box.width + DETAIL_BOX.gapX;
  const detailTextX = detailX + DETAIL_BOX.padding;
  const detailTextY = detailY + DETAIL_BOX.padding;
  const branchStartX = box.x + box.width;
  const branchStartY = box.y + box.height / 2;
  const branchMidX = detailX - 14;
  const branchEndX = detailX;
  const branchEndY = detailY + Math.min(30, detailHeight / 2);

  return (
    <g data-stage-id={box.id}>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
        style={{
          cursor: "pointer",
          transformOrigin: `${centerX}px ${centerY}px`,
          transform: hovered ? `scale(${BOX_HOVER.scale})` : "scale(1)",
          transition: `transform ${BOX_HOVER.durationMs}ms ease-out, filter ${BOX_HOVER.durationMs}ms ease-out`,
          filter: hovered ? `drop-shadow(${BOX_HOVER.shadow})` : "none",
        }}
      >
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={box.radius ?? 0}
          ry={box.radius ?? 0}
          fill={box.fill}
          stroke={box.stroke}
          strokeWidth={box.strokeWidth}
        />
        {displayLines.length ? (
          <text
            x={textX}
            y={textY}
            fill={box.textColor}
            fontSize={box.fontSize}
            fontWeight={box.fontWeight}
            textAnchor={box.textAnchor ?? "start"}
          >
            {displayLines.map((line, index) => {
              const isLabelLine = hasLabel && index === 0;
              return (
                <tspan
                  key={`${box.id}-line-${index}`}
                  x={textX}
                  dy={index === 0 ? 0 : box.lineHeight}
                  fill={isLabelLine ? EXPLAIN_LABEL.color : box.textColor}
                  fontSize={isLabelLine ? EXPLAIN_LABEL.fontSize : box.fontSize}
                  fontWeight={isLabelLine ? EXPLAIN_LABEL.fontWeight : box.fontWeight}
                  fontFamily={isLabelLine ? EXPLAIN_LABEL.monoFont : undefined}
                  letterSpacing={isLabelLine ? "0.06em" : undefined}
                >
                  {line}
                </tspan>
              );
            })}
          </text>
        ) : null}
      </g>
      {expanded ? (
        <g>
          <line
            x1={branchStartX}
            y1={branchStartY}
            x2={branchMidX}
            y2={branchStartY}
            stroke={CODE_HIGHLIGHT.stroke}
            strokeWidth={1.5}
          />
          <line
            x1={branchMidX}
            y1={branchStartY}
            x2={branchMidX}
            y2={branchEndY}
            stroke={CODE_HIGHLIGHT.stroke}
            strokeWidth={1.5}
          />
          <line
            x1={branchMidX}
            y1={branchEndY}
            x2={branchEndX}
            y2={branchEndY}
            stroke={CODE_HIGHLIGHT.stroke}
            strokeWidth={1.5}
          />
          <rect
            x={detailX}
            y={detailY}
            width={DETAIL_BOX.width}
            height={detailHeight}
            rx={12}
            ry={12}
            fill={DETAIL_BOX.fill}
            stroke={DETAIL_BOX.stroke}
            strokeWidth={DETAIL_BOX.strokeWidth}
          />
          <text
            x={detailTextX}
            y={detailTextY}
            fill={box.textColor}
            fontSize={box.fontSize}
            fontWeight={box.fontWeight}
            textAnchor="start"
          >
            {[DETAIL_BOX.title, "", ...detailLines].map((line, index) => (
              <tspan
                key={`${box.id}-detail-${index}`}
                x={detailTextX}
                dy={index === 0 ? 0 : DETAIL_BOX.lineHeight}
                fill={index === 0 ? EXPLAIN_LABEL.color : box.textColor}
                fontSize={index === 0 ? EXPLAIN_LABEL.fontSize : box.fontSize}
                fontWeight={index === 0 ? EXPLAIN_LABEL.fontWeight : box.fontWeight}
                fontFamily={index === 0 ? EXPLAIN_LABEL.monoFont : undefined}
                letterSpacing={index === 0 ? "0.06em" : undefined}
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ) : null}
    </g>
  );
}
