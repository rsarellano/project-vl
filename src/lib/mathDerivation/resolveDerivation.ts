import type { MathDerivationBeat, MathStepDerivation } from "@/lib/mathDerivation/types";
import { resolveDerivationBeats } from "@/lib/mathDerivation/flattenBeats";
import {
  contextTextsForMotionStage,
  inferBothSidesOperation,
} from "@/lib/mathDerivation/inferMotionOperation";
import { buildCombineLikeTermsFrames } from "@/lib/mathDerivation/combineLikeTermsFrames";
import { parseMathLine } from "@/lib/mathText";
import {
  isTextCreationItem,
  type DrawingStageObject,
} from "@/types/infographics";

type BoxLike = {
  id: string | number;
  text?: string | string[];
  derivation?: MathStepDerivation;
};

export type ResolveStepDerivationOptions = {
  /** Original problem equation (for step 1 when there is no previous box). */
  initialEquation?: string | null;
};

/** First line of step box text is usually the step title. */
export function getBoxTitle(text: string | string[] | undefined): string | null {
  if (!text) return null;
  const lines = Array.isArray(text) ? text : [text];
  const title = lines[0]?.trim();
  return title || null;
}

/** Third line of step box text is usually the equation (title, blank, equation). */
export function getBoxEquation(text: string | string[] | undefined): string | null {
  if (!text) return null;
  const lines = Array.isArray(text) ? text : [text];
  const trimmed = lines.map((line) => line.trim()).filter(Boolean);
  if (trimmed.length >= 3) return trimmed[2];
  if (trimmed.length >= 2) return trimmed[trimmed.length - 1];
  return trimmed[0] ?? null;
}

/** Pull the equation from a ``code-title`` line like "Solve the equation: …". */
export function extractProblemEquation(
  objects: ReadonlyArray<DrawingStageObject>,
): string | null {
  for (const object of objects) {
    if (!isTextCreationItem(object) || object.role !== "code-title" || !object.text) {
      continue;
    }
    const lines = Array.isArray(object.text) ? object.text : [object.text];
    for (const line of lines) {
      const parsed = parseMathLine(line);
      if (parsed.kind === "label-math") return parsed.math;
      if (parsed.kind === "math") return parsed.text;
    }
  }
  return null;
}

function splitEquationSides(expr: string): { left: string; right: string } | null {
  const idx = expr.indexOf("=");
  if (idx < 0) return null;
  return {
    left: expr.slice(0, idx).trim(),
    right: expr.slice(idx + 1).trim(),
  };
}

function inferMotionBeat(
  fromExpr: string,
  stepTitle: string | null,
): MathDerivationBeat | null {
  const title = (stepTitle ?? "").toLowerCase();
  if (!title.includes("isolate")) return null;

  const compact = fromExpr.replace(/\s/g, "").toLowerCase();
  if (compact.includes("-x") || /sqrt[^=]+-x=/.test(compact)) {
    return {
      type: "motion",
      text: fromExpr,
      id: "fb-motion",
      term: "-x",
      motion: "slide_right",
    };
  }
  return null;
}

function buildBothSidesMotionStage(
  fromExpr: string,
  toExpr: string,
  operation: string,
): MathDerivationBeat {
  return {
    type: "motion_stage",
    id: "auto-stage-both-sides",
    from: fromExpr,
    to: toExpr,
    operation,
  };
}

function isCombineLikeTermsStep(stepTitle: string | null): boolean {
  const title = (stepTitle ?? "").toLowerCase();
  return (
    title.includes("simplif") ||
    title.includes("combine") ||
    title.includes("like term") ||
    title.includes("collect")
  );
}

function buildCombineLikeTermsMotionStage(
  fromExpr: string,
  toExpr: string,
): MathDerivationBeat {
  const frames = buildCombineLikeTermsFrames(fromExpr, toExpr) ?? undefined;
  return {
    type: "motion_stage",
    id: "auto-stage-combine",
    from: fromExpr,
    to: toExpr,
    frames,
  };
}

function buildSquareBothSidesMotionStage(
  fromExpr: string,
): MathDerivationBeat | null {
  const sides = splitEquationSides(fromExpr);
  if (!sides) return null;

  return {
    type: "motion_stage",
    id: "auto-stage",
    steps: [
      {
        label: "Left side",
        expression: sides.left,
        motion: "highlight",
      },
      {
        label: "Right side",
        expression: `(${sides.right})^2`,
        motion: "highlight",
      },
    ],
  };
}

/** True when the API sent too little for the detail panel (e.g. only ``motion_stage``). */
function isSparseDerivation(beats: MathDerivationBeat[]): boolean {
  if (!beats.length) return true;

  const expressionCount = beats.filter((beat) => beat.type === "expression").length;
  if (expressionCount < 2) return true;

  const hasReadableLead =
    beats.some((beat) => beat.type === "note") ||
    beats.some((beat) => beat.type === "explain");

  return !hasReadableLead;
}

/** Drop legacy sticker ``motion`` beats when the morph ``motion_stage`` handles the step. */
function removeRedundantMotionBeats(beats: MathDerivationBeat[]): MathDerivationBeat[] {
  const hasMotionStage = beats.some((beat) => beat.type === "motion_stage");
  if (!hasMotionStage) return beats;
  return beats.filter((beat) => beat.type !== "motion");
}

function patchMotionStageBeats(
  beats: MathDerivationBeat[],
  fromExpr: string,
  toExpr: string,
): MathDerivationBeat[] {
  return beats.map((beat, index) => {
    if (beat.type !== "motion_stage") return beat;

    const from = beat.from?.trim() || fromExpr;
    const to = beat.to?.trim() || toExpr;
    const inferred = inferBothSidesOperation(
      from,
      to,
      contextTextsForMotionStage(beats, index),
    );
    const provided = beat.operation?.trim();
    const operation =
      inferred && /^[+-]/.test(inferred)
        ? inferred
        : provided && provided.length
          ? provided
          : inferred;

    return { ...beat, from, to, operation };
  });
}

function buildIsolateSideExplains(fromExpr: string, toExpr: string): MathDerivationBeat[] {
  const from = splitEquationSides(fromExpr);
  const to = splitEquationSides(toExpr);
  if (!from || !to) return [];

  return [
    {
      type: "explain",
      text: `The left side: becomes ${to.left} after adding x.`,
    },
    {
      type: "explain",
      text: `The right side: becomes ${to.right} after adding x.`,
    },
  ];
}

/**
 * Ensure every step has a full beat script (notes, before/after expressions,
 * explains, motion stage). The API often sends only ``motion_stage`` — merge
 * with the deterministic fallback instead of showing an empty yellow box.
 */
function ensureDerivationBeatScript(
  beats: MathDerivationBeat[],
  fromExpr: string,
  toExpr: string,
  stepTitle: string | null,
  fromOriginal: boolean,
): MathDerivationBeat[] {
  if (!isSparseDerivation(beats)) {
    return removeRedundantMotionBeats(
      patchMotionStageBeats(beats, fromExpr, toExpr),
    );
  }

  const title = (stepTitle ?? "").toLowerCase();
  const motion = inferMotionBeat(fromExpr, stepTitle);
  const lead = title.includes("isolate")
    ? "Add x to both sides to isolate the square root."
    : title.includes("square") && title.includes("both")
      ? "Square both sides to remove the radical."
      : isCombineLikeTermsStep(stepTitle)
        ? "Combine like terms on each side."
        : stepTitle
          ? `This step: ${stepTitle}.`
          : "We transform the expression for the next move.";

  const script: MathDerivationBeat[] = [
    {
      type: "note",
      text: fromOriginal
        ? "We start from the original equation."
        : "We start from the previous step.",
    },
    { type: "expression", text: fromExpr, id: "fb-from" },
    { type: "arrow", direction: "down" },
    { type: "note", text: lead },
  ];

  if (motion && title.includes("isolate")) {
    script.push(...buildIsolateSideExplains(fromExpr, toExpr));
  } else {
    script.push({
      type: "explain",
      text: motion
        ? "The extra term on the left is in the way. We add x to both sides so it moves to the right."
        : "Each step must keep the math equivalent — use the chat below to ask why this specific move was chosen.",
    });
  }

  const aiStage = beats.find((beat) => beat.type === "motion_stage");
  const defaultStage = isCombineLikeTermsStep(stepTitle)
    ? buildCombineLikeTermsMotionStage(fromExpr, toExpr)
    : buildBothSidesMotionStage(
        fromExpr,
        toExpr,
        inferBothSidesOperation(fromExpr, toExpr, [lead]) ?? "+x",
      );
  script.push(
    aiStage ?? defaultStage,
    { type: "arrow", direction: "down" },
    { type: "note", text: "After this step:" },
    { type: "expression", text: toExpr, id: "fb-to" },
  );

  return patchMotionStageBeats(script, fromExpr, toExpr);
}

/** Insert animation stage after paired left/right explain beats when missing. */
export function enrichDerivationWithMotionStage(
  beats: MathDerivationBeat[],
  fromExpr: string,
  toExpr: string,
  stepTitle: string | null,
): MathDerivationBeat[] {
  if (
    beats.some(
      (beat) =>
        beat.type === "motion_stage" &&
        beat.from?.trim() &&
        beat.to?.trim(),
    )
  ) {
    return beats;
  }

  if (beats.some((beat) => beat.type === "motion_stage")) {
    return patchMotionStageBeats(beats, fromExpr, toExpr);
  }

  const leftExplainIdx = beats.findIndex(
    (beat) => beat.type === "explain" && /left side/i.test(beat.text),
  );
  const rightExplainIdx = beats.findIndex(
    (beat) => beat.type === "explain" && /right side/i.test(beat.text),
  );

  if (leftExplainIdx >= 0 && rightExplainIdx >= 0) {
    const insertAt = Math.max(leftExplainIdx, rightExplainIdx) + 1;
    const title = (stepTitle ?? "").toLowerCase();

    if (title.includes("isolate") && fromExpr !== toExpr) {
      return [
        ...beats.slice(0, insertAt),
        buildBothSidesMotionStage(fromExpr, toExpr, "+x"),
        ...beats.slice(insertAt),
      ];
    }

    const stage = buildSquareBothSidesMotionStage(fromExpr);
    if (!stage) return beats;
    return [...beats.slice(0, insertAt), stage, ...beats.slice(insertAt)];
  }

  const title = (stepTitle ?? "").toLowerCase();
  if (title.includes("square") && title.includes("both") && fromExpr !== toExpr) {
    const stage = buildSquareBothSidesMotionStage(fromExpr);
    if (!stage) return beats;

    const lastExplainIdx = beats.reduce(
      (last, beat, index) => (beat.type === "explain" ? index : last),
      -1,
    );
    const insertAt = lastExplainIdx >= 0 ? lastExplainIdx + 1 : beats.length;
    return [...beats.slice(0, insertAt), stage, ...beats.slice(insertAt)];
  }

  if (isCombineLikeTermsStep(stepTitle) && fromExpr !== toExpr) {
    const lastExplainIdx = beats.reduce(
      (last, beat, index) => (beat.type === "explain" ? index : last),
      -1,
    );
    const insertAt = lastExplainIdx >= 0 ? lastExplainIdx + 1 : beats.length;
    return [
      ...beats.slice(0, insertAt),
      buildCombineLikeTermsMotionStage(fromExpr, toExpr),
      ...beats.slice(insertAt),
    ];
  }

  if (fromExpr && toExpr && fromExpr !== toExpr) {
    const lastExplainIdx = beats.reduce(
      (last, beat, index) => (beat.type === "explain" ? index : last),
      -1,
    );
    const insertAt = lastExplainIdx >= 0 ? lastExplainIdx + 1 : beats.length;
    return [
      ...beats.slice(0, insertAt),
      buildBothSidesMotionStage(fromExpr, toExpr, ""),
      ...beats.slice(insertAt),
    ];
  }

  return beats;
}

/**
 * Thin safety-net beats when the API omits ``derivation``.
 * Rich "why" content should come from AI/backend — not maintained here.
 */
function buildMinimalFallbackBeats(
  fromExpr: string,
  toExpr: string,
  stepTitle: string | null,
  fromOriginal: boolean,
): MathDerivationBeat[] {
  const title = (stepTitle ?? "").toLowerCase();
  const motion = inferMotionBeat(fromExpr, stepTitle);
  const lead = title.includes("isolate")
    ? "Add x to both sides to isolate the square root."
    : stepTitle
      ? `This step: ${stepTitle}.`
      : "We transform the expression for the next move.";

  const beats: MathDerivationBeat[] = [
    {
      type: "note",
      text: fromOriginal
        ? "We start from the original equation."
        : "We start from the previous step.",
    },
    { type: "expression", text: fromExpr, id: "fb-from" },
    { type: "arrow", direction: "down" },
    { type: "note", text: lead },
  ];

  if (motion && title.includes("isolate")) {
    beats.push(...buildIsolateSideExplains(fromExpr, toExpr));
  } else {
    beats.push({
      type: "explain",
      text: motion
        ? "The extra term on the left is in the way. We add x to both sides so it moves to the right."
        : "Each step must keep the math equivalent — use the chat below to ask why this specific move was chosen.",
    });
  }

  beats.push(
    { type: "arrow", direction: "down" },
    { type: "note", text: "After this step:" },
    { type: "expression", text: toExpr, id: "fb-to" },
  );

  return beats;
}

/** Auto-build minimal beats when ``derivation`` is missing on the step box. */
export function buildFallbackDerivation(
  previousBox: BoxLike | undefined,
  currentBox: BoxLike,
  options?: ResolveStepDerivationOptions,
): MathStepDerivation | null {
  const toExpr = getBoxEquation(currentBox.text);
  if (!toExpr) return null;

  let fromExpr: string | null = null;
  let fromOriginal = false;
  let fromStepId: string;

  if (previousBox) {
    fromExpr = getBoxEquation(previousBox.text);
    fromStepId = String(previousBox.id);
  } else if (options?.initialEquation) {
    fromExpr = options.initialEquation;
    fromOriginal = true;
    fromStepId = "problem";
  } else {
    return null;
  }

  if (!fromExpr || fromExpr === toExpr) return null;

  const stepTitle = getBoxTitle(currentBox.text);
  const beats = buildMinimalFallbackBeats(fromExpr, toExpr, stepTitle, fromOriginal);

  return {
    fromStepId,
    beats: enrichDerivationWithMotionStage(beats, fromExpr, toExpr, stepTitle),
  };
}

export function resolveStepDerivation(
  box: BoxLike,
  previousBox: BoxLike | undefined,
  options?: ResolveStepDerivationOptions,
): MathStepDerivation | null {
  let derivation: MathStepDerivation | null = null;

  if (box.derivation?.beats?.length || box.derivation?.frames?.length) {
    derivation = box.derivation;
  } else {
    derivation = buildFallbackDerivation(previousBox, box, options);
  }

  if (!derivation) return null;

  const toExpr = getBoxEquation(box.text);
  let fromExpr: string | null = null;
  if (previousBox) {
    fromExpr = getBoxEquation(previousBox.text);
  } else if (options?.initialEquation) {
    fromExpr = options.initialEquation;
  }

  if (!fromExpr || !toExpr) return derivation;

  const fromOriginal = !previousBox && Boolean(options?.initialEquation);
  const rawBeats = resolveDerivationBeats(derivation);
  const ensured = ensureDerivationBeatScript(
    rawBeats,
    fromExpr,
    toExpr,
    getBoxTitle(box.text),
    fromOriginal,
  );
  const enriched = removeRedundantMotionBeats(
    enrichDerivationWithMotionStage(
      ensured,
      fromExpr,
      toExpr,
      getBoxTitle(box.text),
    ),
  );

  if (enriched === rawBeats && ensured === rawBeats) return derivation;
  return { ...derivation, beats: enriched };
}
