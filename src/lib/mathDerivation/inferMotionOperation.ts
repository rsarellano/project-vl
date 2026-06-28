import type { MathDerivationBeat } from "@/lib/mathDerivation/types";

function splitEquation(expr: string): { left: string; right: string } | null {
  const idx = expr.indexOf("=");
  if (idx < 0) return null;
  return {
    left: expr.slice(0, idx).trim(),
    right: expr.slice(idx + 1).trim(),
  };
}

function normalizeMath(expr: string): string {
  return expr.replace(/\s+/g, "").toLowerCase();
}

function formatSignedTerm(sign: "+" | "-", term: string): string {
  const cleaned = term.trim().replace(/^\+\s*/, "");
  if (!cleaned) return sign === "+" ? "+" : "-";
  if (cleaned.startsWith("+") || cleaned.startsWith("-")) return cleaned;
  return `${sign}${cleaned}`;
}

/** Pull "+x" / "-5" from note or explain copy near a motion stage. */
function inferFromText(texts: string[]): string | undefined {
  for (const raw of texts) {
    const text = raw.trim();
    if (!text) continue;

    const addBoth = text.match(
      /add(?:ing)?\s+(?:the\s+term\s+)?([^\s,.]+)\s+to\s+both\s+sides/i,
    );
    if (addBoth?.[1]) return formatSignedTerm("+", addBoth[1]);

    const addAfter = text.match(/after\s+adding\s+([^\s.,]+)/i);
    if (addAfter?.[1]) return formatSignedTerm("+", addAfter[1]);

    const subBoth = text.match(
      /subtract(?:ing)?\s+(?:the\s+term\s+)?([^\s,.]+)\s+from\s+both\s+sides/i,
    );
    if (subBoth?.[1]) return formatSignedTerm("-", subBoth[1]);

    const subAfter = text.match(/after\s+subtracting\s+([^\s.,]+)/i);
    if (subAfter?.[1]) return formatSignedTerm("-", subAfter[1]);

    // "we added x to cancel the -x" / "because we added x to 1"
    const addedTo = text.match(/(?:we\s+)?added\s+([^\s.,]+)\s+to\b/i);
    if (addedTo?.[1]) return formatSignedTerm("+", addedTo[1]);

    const subtractedFrom = text.match(/(?:we\s+)?subtracted\s+([^\s.,]+)\s+from\b/i);
    if (subtractedFrom?.[1]) return formatSignedTerm("-", subtractedFrom[1]);

    const inlineOp = text.match(/\b([+-]\s*[a-zA-Z0-9]+)\s+to\s+both\s+sides/i);
    if (inlineOp?.[1]) return inlineOp[1].replace(/\s+/g, "");
  }
  return undefined;
}

/** Heuristic when copy omits the operation but both sides shift by the same term. */
function inferFromEquationDelta(fromExpr: string, toExpr: string): string | undefined {
  const from = splitEquation(fromExpr);
  const to = splitEquation(toExpr);
  if (!from || !to) return undefined;

  const fl = normalizeMath(from.left);
  const tl = normalizeMath(to.left);
  const fr = normalizeMath(from.right);
  const tr = normalizeMath(to.right);

  if (/-x$/.test(fl) && fl.replace(/-x$/, "") === tl && tr.includes("x") && !fr.includes("x")) {
    return "+x";
  }

  if (/\+x$/.test(fl) && fl.replace(/\+x$/, "") === tl && !tr.includes("x") && fr.includes("x")) {
    return "-x";
  }

  const leftDelta = tl.length - fl.length;
  const rightDelta = tr.length - fr.length;
  if (leftDelta > 0 && rightDelta > 0 && tl.startsWith(fl)) {
    const added = to.left.slice(from.left.length).trim();
    if (added && tr.endsWith(added.replace(/\s+/g, ""))) {
      return formatSignedTerm("+", added);
    }
  }

  return undefined;
}

/** Collect note/explain text between the surrounding expression beats. */
export function contextTextsForMotionStage(
  beats: MathDerivationBeat[],
  motionIndex: number,
): string[] {
  let fromExprIndex = -1;
  for (let i = motionIndex - 1; i >= 0; i -= 1) {
    if (beats[i]?.type === "expression") {
      fromExprIndex = i;
      break;
    }
  }

  const start = fromExprIndex >= 0 ? fromExprIndex + 1 : 0;
  const texts: string[] = [];
  for (let i = start; i < motionIndex; i += 1) {
    const beat = beats[i];
    if (beat?.type === "note" || beat?.type === "explain") {
      texts.push(beat.text);
    }
  }
  return texts;
}

/** Infer the floating "+x" badge when the API omits ``motion_stage.operation``. */
export function inferBothSidesOperation(
  fromExpr: string | undefined,
  toExpr: string | undefined,
  contextTexts: string[],
): string | undefined {
  if (!fromExpr?.includes("=") || !toExpr?.includes("=")) return undefined;

  return inferFromText(contextTexts) ?? inferFromEquationDelta(fromExpr, toExpr);
}
