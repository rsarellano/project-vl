"use client";

import {
  BOX_ANIMATION,
  getBoxObjects,
  resolveBoxDimensions,
  resolveBoxSlot,
  type BoxCreationObject,
} from "@/components/visualEngine/objectConditions/boxCreation";
import type { DrawingStageText } from "@/types/infographics";

/**
 * Flag-driven text renderer for roles: `code-title`, `objective`, `console`.
 * The AI only supplies `TextCreation: true` + `role` + `text` (+ optional `id`).
 */

export type TextRole = "code-title" | "objective" | "console";

const VALID_TEXT_ROLES: ReadonlySet<TextRole> = new Set([
  "code-title",
  "objective",
  "console",
]);

export type TextCreationObject = {
  id: string | number;
  TextCreation?: boolean;
  text?: string | string[];
  role?: TextRole | string;
  fontWeight?: number;
  textAnchor?: DrawingStageText["textAnchor"];
};

type ResolvedTextPreset = {
  x: number;
  y: number;
  fontSize: number;
  lineHeight: number;
  fontWeight?: number;
  animation?: { durationMs: number; delayMs: number };
};

export type ResolvedTextSpec = ResolvedTextPreset & {
  id: string;
  text?: string | string[];
  textColor: string;
  fontWeight?: number;
  textAnchor?: DrawingStageText["textAnchor"];
  animation?: { durationMs: number; delayMs: number };
};

const TEXT_DEFAULTS = {
  textColor: "#111827",
  fontSize: 15,
  lineHeight: 20,
} as const;

const TEXT_PRESETS: Record<string, ResolvedTextPreset | undefined> = {
  "code-title": {
    x: 90,
    y: 60,
    fontSize: 18,
    lineHeight: 24,
    animation: { durationMs: 500, delayMs: 0 },
  },
  objective: {
    x: 90,
    y: 140,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
    animation: { durationMs: 500, delayMs: 200 },
  },
};

const CONSOLE_LAYOUT = {
  offsetX: 10,
  gapY: 28,
  delayMsAfterBox: 700,
} as const;

const CONSOLE_ANIMATION = {
  durationMs: 500,
} as const;

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

function hasValidRole(
  object: TextCreationObject,
): object is TextCreationObject & { role: TextRole } {
  return typeof object.role === "string" && VALID_TEXT_ROLES.has(object.role as TextRole);
}

export function isTextCreationApproved(
  object: TextCreationObject | undefined | null,
): boolean {
  if (!object || object.TextCreation !== true) return false;
  return hasValidRole(object);
}

export function getTextObjects(
  objects: ReadonlyArray<TextCreationObject>,
): TextCreationObject[] {
  return objects.filter(isTextCreationApproved);
}

function getConsoleIndex(
  object: TextCreationObject,
  answers: ReadonlyArray<TextCreationObject>,
): number {
  const consoles = getTextObjects(answers).filter((item) => item.role === "console");
  return consoles.findIndex((item) => String(item.id) === String(object.id));
}

function resolveConsolePreset(
  object: TextCreationObject,
  answers: ReadonlyArray<TextCreationObject>,
): ResolvedTextPreset | null {
  const consoleIndex = getConsoleIndex(object, answers);
  if (consoleIndex < 0) return null;

  const boxes = getBoxObjects(answers as unknown as ReadonlyArray<BoxCreationObject>);
  const matchingBox = boxes[consoleIndex];
  const boxSlot = resolveBoxSlot(consoleIndex);
  const boxDimensions = resolveBoxDimensions(matchingBox?.text, consoleIndex);

  return {
    x: boxSlot.x + CONSOLE_LAYOUT.offsetX,
    y: boxSlot.y + boxDimensions.height + CONSOLE_LAYOUT.gapY,
    fontSize: TEXT_DEFAULTS.fontSize,
    lineHeight: TEXT_DEFAULTS.lineHeight,
    animation: {
      durationMs: CONSOLE_ANIMATION.durationMs,
      delayMs:
        consoleIndex * BOX_ANIMATION.stepDelayMs + CONSOLE_LAYOUT.delayMsAfterBox,
    },
  };
}

export function resolveTextSpec(
  object: TextCreationObject,
  answers: ReadonlyArray<TextCreationObject> = [],
): ResolvedTextSpec | null {
  if (!hasValidRole(object)) return null;

  const role = object.role;
  const preset: ResolvedTextPreset | null =
    role === "console"
      ? resolveConsolePreset(object, answers)
      : (TEXT_PRESETS[role] ?? null);
  if (!preset) return null;

  return {
    id: String(object.id),
    text: object.text,
    fontWeight: object.fontWeight ?? preset.fontWeight,
    textAnchor: object.textAnchor,
    ...preset,
    textColor: TEXT_DEFAULTS.textColor,
  };
}

export function getTextAnimationEntries(
  objects: ReadonlyArray<TextCreationObject>,
): Array<{ id: string; animation: { durationMs: number; delayMs: number } }> {
  return getTextObjects(objects)
    .map((object) => {
      const spec = resolveTextSpec(object, objects);
      if (!spec?.animation) return null;
      return { id: spec.id, animation: spec.animation };
    })
    .filter(
      (
        entry,
      ): entry is { id: string; animation: { durationMs: number; delayMs: number } } =>
        entry !== null,
    );
}

export default function TextCreation({
  object,
  answers = [],
}: {
  object: TextCreationObject;
  answers?: ReadonlyArray<TextCreationObject>;
}) {
  if (!isTextCreationApproved(object)) return null;

  const spec = resolveTextSpec(object, answers);
  if (!spec) return null;
  const lines = getTextLines(spec.text);

  return (
    <g data-stage-id={spec.id}>
      <text
        x={spec.x}
        y={spec.y}
        fill={spec.textColor}
        fontSize={spec.fontSize}
        fontWeight={spec.fontWeight}
        textAnchor={spec.textAnchor ?? "start"}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${spec.id}-line-${index}`}
            x={spec.x}
            dy={index === 0 ? 0 : spec.lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
