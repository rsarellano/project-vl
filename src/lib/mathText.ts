import katex from "katex";

/** Step labels and headings that should stay plain text in math diagrams. */
const PLAIN_LABEL_PATTERNS = [
  /^group like terms$/i,
  /^combine\b/i,
  /^put groups together$/i,
  /^simplified expression$/i,
  /^objective:$/i,
  /^given$/i,
  /^check$/i,
  /^solution$/i,
  /^operands$/i,
  /^operation$/i,
  /^work$/i,
  /^answer$/i,
  / terms:/i,
  /^constants:/i,
];

/** Verb-led step descriptions (English prose, not equations). */
const INSTRUCTION_STEP = /^(subtract|add|divide|multiply|square|isolate|simplify|combine|expand|factor|check|verify|rewrite|remove|apply|take|move|cancel|reduce|distribute|rearrange|set|group|plug|substitute)\b/i;

function isPlainInstructionLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (INSTRUCTION_STEP.test(trimmed)) return true;
  return PLAIN_LABEL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** True when a line is an equation/expression, not an English step description. */
function containsMathSyntax(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || isPlainInstructionLine(trimmed)) return false;

  if (/\\sqrt|\\frac|\\cdot|\\times|\\left|\\right|√/.test(trimmed)) return true;
  if (/sqrt\s*\(/.test(trimmed)) return true;
  if (/=/.test(trimmed)) return true;
  if (/\^|\*\*/.test(trimmed)) return true;
  if (/\b\d+[a-zA-Z]\b/.test(trimmed)) return true;
  if (/\b[a-zA-Z]\b/.test(trimmed) && /[+\-*\/]/.test(trimmed) && /\d/.test(trimmed)) {
    return /\b\d+[a-zA-Z]\b|[a-zA-Z]\s*[+\-]/.test(trimmed);
  }
  return false;
}

function looksLikeCodeLine(line: string): boolean {
  if (/\\sqrt|\\frac|\\cdot|\\times|\\left|\\right/.test(line)) return false;
  return /function\s|const\s|let\s|def\s|import\s|console\.|=>|\};|#include/.test(line);
}

export type ParsedMathLine =
  | { kind: "plain"; text: string }
  | { kind: "math"; text: string }
  | { kind: "label-math"; label: string; math: string };

/** Split instructional prefixes from the equation (e.g. "Solve the equation: …"). */
export function parseMathLine(line: string): ParsedMathLine {
  const trimmed = line.trim();
  if (!trimmed) return { kind: "plain", text: "" };

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex > 0) {
    const label = trimmed.slice(0, colonIndex + 1);
    const rest = trimmed.slice(colonIndex + 1).trim();
    const labelWords = label.replace(":", "").trim();
    if (
      rest &&
      /^(solve|simplify|find|evaluate|calculate)\b/i.test(labelWords) &&
      (/\\sqrt|\\frac|\\cdot|\\times/.test(rest) || containsMathSyntax(rest))
    ) {
      return { kind: "label-math", label: `${label} `, math: rest };
    }
  }

  if (/\\sqrt|\\frac|\\cdot|\\times|\\left|\\right/.test(trimmed)) {
    return { kind: "math", text: trimmed };
  }
  if (containsMathSyntax(trimmed)) {
    return { kind: "math", text: trimmed };
  }
  return { kind: "plain", text: trimmed };
}

/** True when the ask-form text should show a live KaTeX preview. */
export function looksLikeMathInput(text: string): boolean {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.some(
    (line) =>
      !looksLikeCodeLine(line) &&
      (/\\sqrt|\\frac|\\cdot|\\times/.test(line) || containsMathSyntax(line)),
  );
}

/** True when a whole line should be rendered with KaTeX (math layout only). */
export function shouldRenderMathLine(line: string): boolean {
  const parsed = parseMathLine(line);
  return parsed.kind === "math";
}

function convertSqrtInner(inner: string): string {
  return inner.replace(/\*\*/g, "^");
}

/** Read a (...) or {...} group with nested delimiters. */
function readBalancedGroup(
  text: string,
  openIndex: number,
  open: string,
  close: string,
): { inner: string; end: number } | null {
  if (!text.startsWith(open, openIndex)) return null;
  let depth = 1;
  let i = openIndex + open.length;
  const innerStart = i;
  while (i < text.length && depth > 0) {
    if (text.startsWith(open, i)) {
      depth += 1;
      i += open.length;
      continue;
    }
    if (text.startsWith(close, i)) {
      depth -= 1;
      if (depth === 0) {
        return { inner: text.slice(innerStart, i), end: i + close.length };
      }
      i += close.length;
      continue;
    }
    i += 1;
  }
  return null;
}

/** Radicand after √ with no parens: `2(2)+5` → `2(2)+5`, `2(2)+5-2` → `2(2)+5`. */
function readUnparenedSqrtRadicand(
  text: string,
  start: number,
): { inner: string; end: number } | null {
  let i = start;
  const chunks: string[] = [];

  while (i < text.length) {
    if (/\s/.test(text[i])) {
      i += 1;
      continue;
    }
    if (text[i] === "(") {
      const group = readBalancedGroup(text, i, "(", ")");
      if (!group) break;
      chunks.push(text.slice(i, group.end));
      i = group.end;
      continue;
    }
    if (/[0-9a-zA-Z.]/.test(text[i])) {
      chunks.push(text[i]);
      i += 1;
      continue;
    }
    if (/[+\-*/]/.test(text[i])) {
      if (text[i] === "-" && chunks.length > 0) break;
      if (text[i] === "+" || text[i] === "*" || text[i] === "/") {
        chunks.push(text[i]);
        i += 1;
        continue;
      }
      if (text[i] === "-" && chunks.length === 0) {
        chunks.push(text[i]);
        i += 1;
        continue;
      }
      break;
    }
    break;
  }

  if (chunks.length === 0) return null;
  return { inner: chunks.join(""), end: i };
}

function convertSqrtForms(text: string): string {
  let out = "";
  let i = 0;

  while (i < text.length) {
    if (text.startsWith("\\sqrt{", i)) {
      const group = readBalancedGroup(text, i + 5, "{", "}");
      if (group) {
        out += text.slice(i, group.end);
        i = group.end;
        continue;
      }
    }

    if (text.startsWith("\\sqrt", i)) {
      let j = i + 5;
      while (j < text.length && /\s/.test(text[j])) j += 1;
      if (text[j] === "(") {
        const group = readBalancedGroup(text, j, "(", ")");
        if (group) {
          out += `\\sqrt{${convertSqrtInner(group.inner)}}`;
          i = group.end;
          continue;
        }
      }
    }

    const sqrtParen = text.slice(i).match(/^sqrt\s*\(/i);
    if (sqrtParen && (i === 0 || !/[a-zA-Z\\]/.test(text[i - 1]))) {
      const openIndex = i + sqrtParen[0].length - 1;
      const group = readBalancedGroup(text, openIndex, "(", ")");
      if (group) {
        out += `\\sqrt{${convertSqrtInner(group.inner)}}`;
        i = group.end;
        continue;
      }
    }

    if (text[i] === "√") {
      i += 1;
      while (i < text.length && /\s/.test(text[i])) i += 1;

      if (text[i] === "(") {
        const group = readBalancedGroup(text, i, "(", ")");
        if (group) {
          out += `\\sqrt{${convertSqrtInner(group.inner)}}`;
          i = group.end;
          continue;
        }
      }

      const radicand = readUnparenedSqrtRadicand(text, i);
      if (radicand) {
        out += `\\sqrt{${convertSqrtInner(radicand.inner)}}`;
        i = radicand.end;
        continue;
      }

      out += "√";
      continue;
    }

    out += text[i];
    i += 1;
  }

  return out;
}

function escapeLatexText(text: string): string {
  return text.replace(/\\/g, "\\\\");
}

/** Turn a plain prose chunk into upright KaTeX text with sensible padding. */
function plainProseToLatex(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (/^(or|and)$/i.test(trimmed)) {
    return `\\quad\\text{${trimmed.toLowerCase()}}\\quad`;
  }

  if (/^(is|are|valid|invalid|no|not)$/i.test(trimmed)) {
    return `\\;\\text{${escapeLatexText(trimmed)}}\\;`;
  }

  return `\\text{${escapeLatexText(trimmed)}}`;
}

/** Build one LaTeX string from mixed prose + math segments. */
export function mixedMathToLatex(input: string, looseOperators = false): string {
  return splitMixedMathText(input)
    .map((segment) =>
      segment.kind === "plain"
        ? plainProseToLatex(segment.text)
        : plainMathToLatex(segment.text, looseOperators),
    )
    .join("");
}

/** Fallback when the whole line is still parsed as one math string. */
function wrapSpacedConnectors(text: string): string {
  return text
    .replace(/\s+\bor\b\s+/gi, " \\quad\\text{or}\\quad ")
    .replace(/\s+\band\b\s+/gi, " \\quad\\text{and}\\quad ");
}

/**
 * Add a little glue around **top-level** binary operators (``+ - =``) so the
 * main equation isn't cramped, while leaving operators *inside* groups like
 * ``(x+1)`` or ``\\sqrt{2x+5}`` untouched (those should stay tight).
 */
function loosenPlainMathSpacing(text: string, looseOperators = false): string {
  if (!looseOperators) return text;
  if (/\\text\{|\\frac|\\left|\\right|\\color/.test(text)) return text;

  const pad = "\\;";
  let out = "";
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === "(" || ch === "{") {
      depth += 1;
      out += ch;
      continue;
    }
    if (ch === ")" || ch === "}") {
      depth = Math.max(0, depth - 1);
      out += ch;
      continue;
    }

    const isOperator = ch === "+" || ch === "-" || ch === "=";
    if (depth === 0 && isOperator) {
      const prev = text.slice(0, i).replace(/\s+$/, "").slice(-1);
      const isBinary = /[0-9a-zA-Z)\}]/.test(prev);
      const rest = text.slice(i + 1).replace(/^\s+/, "");
      const hasOperand = /^[0-9a-zA-Z(\\]/.test(rest);

      if (isBinary && hasOperand) {
        out = out.replace(/\s+$/, "");
        out += `${pad}${ch}${pad}`;
        i += text.slice(i + 1).length - rest.length;
        continue;
      }
    }

    out += ch;
  }

  return out;
}

/** Convert AI / OCR plain math into KaTeX-ready LaTeX. */
export function plainMathToLatex(input: string, looseOperators = false): string {
  let text = input.trim();
  if (!text) return text;

  text = wrapSpacedConnectors(text);
  text = convertSqrtForms(text);
  text = text.replace(/\*\*/g, "^");
  text = loosenPlainMathSpacing(text, looseOperators);
  return text;
}

/** Chalk palette for the chalkboard diagram theme. */
export const CHALK_MATH_COLORS = {
  paren: "#f0a0b8",
  sqrt: "#6ec8e8",
  exp: "#e8c84a",
  rhs: "#e8d060",
  eq: "#f2f2ea",
} as const;

function wrapChalkColor(color: string, content: string): string {
  return `{\\color{${color}}{${content}}}`;
}

function colorizeSuperscripts(text: string): string {
  let result = text.replace(
    /\^\{([^{}]+)\}/g,
    (_, exp) => `^{${wrapChalkColor(CHALK_MATH_COLORS.exp, exp)}}`,
  );
  result = result.replace(
    /\^([0-9a-zA-Z])/g,
    (_, exp) => `^{${wrapChalkColor(CHALK_MATH_COLORS.exp, exp)}}`,
  );
  return result;
}

function colorizeSqrtBlocks(text: string): string {
  return text.replace(/\\sqrt\{([^{}]*)\}/g, (_, inner) =>
    wrapChalkColor(CHALK_MATH_COLORS.sqrt, `\\sqrt{${inner}}`),
  );
}

function colorizeParens(text: string): string {
  return text
    .replace(/\(/g, wrapChalkColor(CHALK_MATH_COLORS.paren, "("))
    .replace(/\)/g, wrapChalkColor(CHALK_MATH_COLORS.paren, ")"));
}

/** Apply multi-color chalk styling to a KaTeX-ready LaTeX string. */
export function colorizeMathLatex(latex: string): string {
  if (!latex || /\\color\{/.test(latex)) return latex;

  let s = colorizeSqrtBlocks(latex);
  s = colorizeSuperscripts(s);

  const eqIndex = s.indexOf("=");
  if (eqIndex >= 0) {
    const lhs = colorizeParens(s.slice(0, eqIndex));
    const rhs = wrapChalkColor(CHALK_MATH_COLORS.rhs, s.slice(eqIndex + 1));
    return lhs + wrapChalkColor(CHALK_MATH_COLORS.eq, "=") + rhs;
  }

  return colorizeParens(s);
}

export type RenderMathOptions = {
  chalk?: boolean;
  /** Extra gap around ``+``, ``-``, and ``=`` (step boxes). */
  looseOperators?: boolean;
};

export type MixedMathSegment =
  | { kind: "plain"; text: string }
  | { kind: "math"; text: string };

function appendPlainSegment(segments: MixedMathSegment[], text: string): void {
  if (!text) return;
  const last = segments[segments.length - 1];
  if (last?.kind === "plain") {
    last.text += text;
  } else {
    segments.push({ kind: "plain", text });
  }
}

const ENGLISH_MATH_FALSE_POSITIVES =
  /^(gives|give|gets|get|the|left|right|side|after|before|when|which|that|this|each|both|then|from|into|with|have|will|were|been|being|where|while|squaring|simplify|expand|isolate|move|add|subtract|divide|multiply|equals|equal|result|step|same|value|values|term|terms|side|sides)$/i;

/** English words that break inline math runs (step-box prose like ``x = 2 or x = -2``). */
const INLINE_MATH_PROSE_BREAK =
  /^(or|and|is|are|was|were|valid|invalid|extraneous|rejected|accepted|solution|solutions|check|checks|no|not|yes|true|false|if|when|then|else|for|the|a|an|but|so|as|be|by|to|from|with|both|either|neither|since|because|therefore|hence|thus|where|which|that|this|these|those|only|also|must|can|cannot|satisfies|satisfy|works|work|fails|fail|reject|accept|discard|discarded)$/i;

function readAlphaWord(text: string, start: number): { word: string; end: number } | null {
  if (start >= text.length || !/[a-zA-Z]/.test(text[start])) return null;
  let end = start + 1;
  while (end < text.length && /[a-zA-Z]/.test(text[end])) end += 1;
  return { word: text.slice(start, end), end };
}

function isProseBreakWord(word: string): boolean {
  if (word.length < 2) return false;
  return INLINE_MATH_PROSE_BREAK.test(word) || ENGLISH_MATH_FALSE_POSITIVES.test(word);
}

function isMathIdentifierWord(word: string): boolean {
  if (word.length === 1) return true;
  return /^(sqrt|sin|cos|tan|log|ln)$/i.test(word);
}

function looksLikeEnglishProse(fragment: string): boolean {
  const trimmed = fragment.trim();
  if (!trimmed || isPlainInstructionLine(trimmed)) return true;

  const words = trimmed.split(/\s+/);
  const first = words[0] ?? "";
  if (/^[a-zA-Z]{2,}$/.test(first) && !/^(sqrt|sin|cos|tan|log|ln)$/i.test(first)) {
    return true;
  }

  let alphaWords = 0;
  for (const word of words) {
    if (/^[a-zA-Z]{2,}$/.test(word)) {
      if (ENGLISH_MATH_FALSE_POSITIVES.test(word)) return true;
      alphaWords += 1;
    }
  }
  if (alphaWords >= 2) return true;
  if (alphaWords === 1 && words.length === 1 && !/[+\-*/^=()^0-9]/.test(trimmed)) {
    return true;
  }
  return false;
}

/** Only begin a inline math scan at unambiguous math starts — not English words. */
function canStartInlineMathRun(text: string, start: number): boolean {
  const ch = text[start];
  if (/[0-9(√\\$`=+\-<>*/^]/.test(ch)) return true;
  if (/[A-Z]/.test(ch)) return false;

  const sqrtParen = text.slice(start).match(/^sqrt\s*\(/i);
  if (sqrtParen && (start === 0 || !/[a-zA-Z\\]/.test(text[start - 1]))) {
    return true;
  }

  if (/[a-z]/.test(ch)) {
    const head = text.slice(start, start + 8);
    // Single-letter variable with an operator: x + 1, n = 5
    if (/^[a-z]\s*[+\-*/^=]/.test(head)) return true;
    if (/^[a-z]\^/.test(head)) return true;
    if (/^[a-z]\d/.test(head)) return true;
  }

  return false;
}

function readMathFragment(
  text: string,
  start: number,
): { text: string; start: number; end: number } | null {
  if (start >= text.length || /\s/.test(text[start])) return null;

  if (text[start] === "$") {
    const close = text.indexOf("$", start + 1);
    if (close > start + 1) {
      return { text: text.slice(start + 1, close), start, end: close + 1 };
    }
  }

  if (text[start] === "`") {
    const close = text.indexOf("`", start + 1);
    if (close > start + 1) {
      return { text: text.slice(start + 1, close), start, end: close + 1 };
    }
  }

  if (text.startsWith("\\sqrt{", start)) {
    const group = readBalancedGroup(text, start + 5, "{", "}");
    if (group) {
      return { text: text.slice(start, group.end), start, end: group.end };
    }
  }

  const sqrtParen = text.slice(start).match(/^sqrt\s*\(/i);
  if (sqrtParen && (start === 0 || !/[a-zA-Z\\]/.test(text[start - 1]))) {
    const openIndex = start + sqrtParen[0].length - 1;
    const group = readBalancedGroup(text, openIndex, "(", ")");
    if (group) {
      return { text: text.slice(start, group.end), start, end: group.end };
    }
  }

  if (text[start] === "\\") {
    let end = start + 1;
    while (end < text.length && /[a-zA-Z]/.test(text[end])) end += 1;
    while (end < text.length && text[end] === "{") {
      const group = readBalancedGroup(text, end, "{", "}");
      if (!group) break;
      end = group.end;
    }
    if (end > start + 1) {
      return { text: text.slice(start, end), start, end };
    }
  }

  if (text[start] === "√") {
    let end = start + 1;
    while (end < text.length && /\s/.test(text[end])) end += 1;
    if (text[end] === "(") {
      const group = readBalancedGroup(text, end, "(", ")");
      if (group) return { text: text.slice(start, group.end), start, end: group.end };
    }
    const radicand = readUnparenedSqrtRadicand(text, end);
    if (radicand) {
      return { text: text.slice(start, radicand.end), start, end: radicand.end };
    }
  }

  if (text[start] === "(") {
    const group = readBalancedGroup(text, start, "(", ")");
    if (group) {
      let end = group.end;
      if (text[end] === "^") {
        end += 1;
        if (text[end] === "{") {
          const exp = readBalancedGroup(text, end, "{", "}");
          if (exp) end = exp.end;
        } else if (/[0-9a-zA-Z.]/.test(text[end] ?? "")) {
          end += 1;
        }
      }
      const fragment = text.slice(start, end);
      if (containsMathSyntax(fragment) && !looksLikeEnglishProse(fragment)) {
        return { text: fragment, start, end };
      }
    }
  }

  if (!canStartInlineMathRun(text, start)) return null;

  let end = start;
  while (end < text.length) {
    if (/[a-zA-Z]/.test(text[end])) {
      const alphaWord = readAlphaWord(text, end);
      if (alphaWord) {
        if (isProseBreakWord(alphaWord.word)) break;
        if (alphaWord.word.length > 1 && !isMathIdentifierWord(alphaWord.word)) break;
        end = alphaWord.end;
        continue;
      }
    }
    if (/[0-9.+\-*/^=()√]/.test(text[end])) {
      end += 1;
      continue;
    }
    if (/\s/.test(text[end])) {
      let j = end;
      while (j < text.length && /\s/.test(text[j])) j += 1;
      const alphaWord = readAlphaWord(text, j);
      if (alphaWord && isProseBreakWord(alphaWord.word)) break;
      if (j < text.length && /[0-9(√\\]/.test(text[j])) {
        end = j;
        continue;
      }
      if (j < text.length && /[a-z]/.test(text[j])) {
        if (canStartInlineMathRun(text, j)) {
          end = j;
          continue;
        }
        break;
      }
      if (j < text.length && /[A-Z.]/.test(text[j])) {
        end = j;
        continue;
      }
    }
    break;
  }

  if (end > start) {
    let fragment = text.slice(start, end).trimEnd();
    while (fragment.length > 1 && /[+\-*/=]$/.test(fragment)) {
      fragment = fragment.slice(0, -1);
      end -= 1;
    }
    if (fragment && containsMathSyntax(fragment) && !looksLikeEnglishProse(fragment)) {
      return { text: fragment, start, end };
    }
  }

  return null;
}

/**
 * Split AI prose into plain text and embedded math fragments.
 * Accepts plain ``sqrt(2x+5)``, ``(x+1)^2``, and legacy ``\\sqrt{...}`` from older payloads.
 */
export function splitMixedMathText(input: string): MixedMathSegment[] {
  if (!input) return [{ kind: "plain", text: "" }];

  const segments: MixedMathSegment[] = [];
  let plainStart = 0;
  let i = 0;

  while (i < input.length) {
    const math = readMathFragment(input, i);
    if (math) {
      if (math.start > plainStart) {
        appendPlainSegment(segments, input.slice(plainStart, math.start));
      }
      segments.push({ kind: "math", text: math.text });
      i = math.end;
      plainStart = i;
      continue;
    }
    i += 1;
  }

  if (plainStart < input.length) {
    appendPlainSegment(segments, input.slice(plainStart));
  }

  return segments.length ? segments : [{ kind: "plain", text: input }];
}

/** True when a line mixes English prose with math fragments (needs split rendering). */
export function hasMixedProseAndMath(input: string): boolean {
  const segments = splitMixedMathText(input);
  const hasPlain = segments.some(
    (segment) => segment.kind === "plain" && segment.text.trim().length > 0,
  );
  const hasMath = segments.some((segment) => segment.kind === "math");
  return hasPlain && hasMath;
}

/** HTML for foreignObject: one KaTeX line with \\text{…} prose and \\quad gaps. */
export function renderMixedMathHtml(
  input: string,
  options?: RenderMathOptions,
): string {
  return renderMathHtml(mixedMathToLatex(input, options?.looseOperators), options);
}

const CHALK_DEFAULT_TEXT = "#f2f2ea";

/** Hybrid skin renders small KaTeX chunks — ensure a visible chalk color on each. */
function ensureChalkDefaultColor(latex: string): string {
  if (/\\color\{/.test(latex)) return latex;
  return `{\\color{${CHALK_DEFAULT_TEXT}}{${latex}}}`;
}

export function renderMathHtml(latex: string, options?: RenderMathOptions): string {
  try {
    let prepared = plainMathToLatex(latex, options?.looseOperators);
    if (options?.chalk) {
      prepared = colorizeMathLatex(prepared);
      prepared = ensureChalkDefaultColor(prepared);
    }
    return katex.renderToString(prepared, {
      throwOnError: false,
      displayMode: false,
      output: "html",
    });
  } catch {
    return latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
