"use client";

import { CodeMapSvgContent } from "@/components/visualEngine/CodeMapStage";
import BoxCreation, {
  getBoxIndexById,
  type BoxCreationObject,
} from "@/components/visualEngine/objectConditions/boxCreation";
import LineCreation from "@/components/visualEngine/objectConditions/lineCreation";
import TextCreation, {
  type TextCreationObject,
} from "@/components/visualEngine/objectConditions/textCreation";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";
import {
  isBoxCreationItem,
  isCodeMapStage,
  isLegacyCircleItem,
  isLegacyLineItem,
  isLegacyRectangleItem,
  isLegacyTextItem,
  isTextCreationItem,
  isTrunkBoxItem,
  type DrawingStage,
  type DrawingStageCircleObject,
  type DrawingStageLine,
  type DrawingStageLineObject,
  type DrawingStageObject,
  type DrawingStageRectangleObject,
  type DrawingStageTextObject,
} from "@/types/infographics";

interface DrawingStageProps {
  stage: DrawingStage;
  theme?: ThemeName;
  canvasWidth?: number;
  canvasHeight?: number;
}

function getTextLines(text: string | string[] | undefined): string[] {
  if (!text) return [];
  return Array.isArray(text) ? text : [text];
}

function StageRectangle({ object }: { object: DrawingStageRectangleObject }) {
  const lines = getTextLines(object.text);
  const textX = object.x + (object.padding ?? 12);
  const textY = object.y + (object.padding ?? 12);

  return (
    <g data-stage-id={String(object.id)}>
      <rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx={object.radius ?? 0}
        ry={object.radius ?? 0}
        fill={object.fill ?? "#ffffff"}
        stroke={object.stroke ?? "#111827"}
        strokeWidth={object.strokeWidth ?? 2}
      />
      {lines.length ? (
        <text
          x={textX}
          y={textY}
          fill={object.textColor ?? "#111827"}
          fontSize={object.fontSize ?? 14}
          fontWeight={object.fontWeight}
          textAnchor={object.textAnchor ?? "start"}
        >
          {lines.map((line, index) => (
            <tspan
              key={`${object.id}-line-${index}`}
              x={textX}
              dy={index === 0 ? 0 : object.lineHeight ?? 16}
            >
              {line}
            </tspan>
          ))}
        </text>
      ) : null}
    </g>
  );
}

function StageText({ object }: { object: DrawingStageTextObject }) {
  const lines = getTextLines(object.text);

  return (
    <g data-stage-id={String(object.id)}>
      <text
        x={object.x}
        y={object.y}
        fill={object.fill ?? "#111827"}
        fontSize={object.fontSize ?? 15}
        fontWeight={object.fontWeight}
        textAnchor={object.textAnchor ?? "start"}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${object.id}-line-${index}`}
            x={object.x}
            dy={index === 0 ? 0 : object.lineHeight ?? 18}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function StageCircle({ object }: { object: DrawingStageCircleObject }) {
  return (
    <g data-stage-id={String(object.id)}>
      <circle
        cx={object.cx}
        cy={object.cy}
        r={object.r}
        fill={object.fill ?? "#ffffff"}
        stroke={object.stroke ?? "#111827"}
        strokeWidth={object.strokeWidth ?? 2}
      />
    </g>
  );
}

function StageTypedLine({ object }: { object: DrawingStageLineObject }) {
  return (
    <g data-stage-id={String(object.id)}>
      <line
        x1={object.x1}
        y1={object.y1}
        x2={object.x2}
        y2={object.y2}
        stroke={object.stroke ?? "#64748b"}
        strokeWidth={object.strokeWidth ?? 2}
      />
    </g>
  );
}

function StageLine({ line }: { line: DrawingStageLine }) {
  const points = (line.points ?? [])
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <polyline
      data-stage-id={String(line.id)}
      points={points}
      fill="none"
      stroke={line.stroke ?? "#64748b"}
      strokeWidth={line.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
    />
  );
}

function StageObject({
  object,
  boxIndex,
  totalBoxCount,
  allObjects,
  theme,
}: {
  object: DrawingStageObject;
  boxIndex: number | undefined;
  totalBoxCount: number;
  allObjects: ReadonlyArray<DrawingStageObject>;
  theme?: ThemeName;
}) {
  if (isBoxCreationItem(object)) {
    return (
      <BoxCreation
        object={object as unknown as BoxCreationObject}
        boxIndex={boxIndex ?? 0}
        totalBoxCount={totalBoxCount}
        theme={theme}
      />
    );
  }

  if (isTextCreationItem(object)) {
    return (
      <TextCreation
        object={object as unknown as TextCreationObject}
        answers={
          allObjects.filter(isTextCreationItem) as unknown as TextCreationObject[]
        }
      />
    );
  }

  if (isLegacyRectangleItem(object)) {
    return <StageRectangle object={object} />;
  }

  if (isLegacyTextItem(object)) {
    return <StageText object={object} />;
  }

  if (isLegacyCircleItem(object)) {
    return <StageCircle object={object} />;
  }

  if (isLegacyLineItem(object)) {
    return <StageTypedLine object={object} />;
  }

  return null;
}

/** Renders drawing-stage shapes (GSAP drives motion). */
export function DrawingStageSvgContent({
  stage,
  theme,
  canvasWidth,
  canvasHeight,
}: DrawingStageProps) {
  if (isCodeMapStage(stage)) {
    return (
      <CodeMapSvgContent
        stage={stage}
        theme={theme}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    );
  }

  const objects = stage.objects;
  const trunkBoxes = objects.filter(isTrunkBoxItem) as unknown as BoxCreationObject[];
  const boxIndexById = getBoxIndexById(trunkBoxes);
  const connections = stage.connections ?? [];

  const themeObj = getTheme(theme);
  const decorWidth = canvasWidth ?? stage.width;
  const decorHeight = canvasHeight ?? stage.height;

  return (
    <>
      <themeObj.Defs />
      {themeObj.BackgroundDecor ? (
        <themeObj.BackgroundDecor width={decorWidth} height={decorHeight} />
      ) : (
        <rect width={decorWidth} height={decorHeight} fill={themeObj.canvasColor} />
      )}

      {connections.map((connection, index) => (
        <LineCreation
          key={`conn-${connection.from}-${connection.to}-${index}`}
          connection={connection}
          objects={trunkBoxes}
        />
      ))}

      {(stage.lines ?? []).map((line) => (
        <StageLine key={line.id} line={line} />
      ))}

      {objects.map((object) => {
        if (isBoxCreationItem(object) && object.linkedPortion) return null;
        return (
          <StageObject
            key={object.id}
            object={object}
            allObjects={objects}
            boxIndex={
              isTrunkBoxItem(object) ? boxIndexById.get(String(object.id)) : undefined
            }
            totalBoxCount={boxIndexById.size}
            theme={theme}
          />
        );
      })}
    </>
  );
}

export function DrawingStageView({ stage, theme }: DrawingStageProps) {
  return (
    <div className="h-full w-full rounded-xl bg-slate-950/5 p-3">
      <svg
        className="h-full w-full rounded-lg shadow-sm"
        viewBox={`0 0 ${stage.width} ${stage.height}`}
        role="img"
        aria-label="Drawing stage answer preview"
      >
        <DrawingStageSvgContent stage={stage} theme={theme} />
      </svg>
    </div>
  );
}
