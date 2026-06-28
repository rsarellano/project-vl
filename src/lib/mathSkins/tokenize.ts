import { plainMathToLatex } from "@/lib/mathText";
import type { MathToken } from "./types";

export type { MathToken };

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isLetter(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
}

/** Tokenize a normalized math string into a layout tree. */
export function tokenizeMathExpression(input: string): MathToken[] {
  const normalized = plainMathToLatex(input).replace(/\s+/g, "");
  const tokens: MathToken[] = [];
  let i = 0;

  function readGroup(open: string, close: string): MathToken[] {
    const children: MathToken[] = [];
    i += open.length;
    while (i < normalized.length) {
      if (normalized.startsWith(close, i)) {
        i += close.length;
        break;
      }
      const chunk = readAtom();
      if (chunk) children.push(...chunk);
    }
    return children;
  }

  function readSuperscript(): MathToken {
    i += 1;
    if (normalized[i] === "{") {
      const children = readGroup("{", "}");
      return { type: "sup", children };
    }
    const ch = normalized[i];
    i += 1;
    return { type: "sup", children: [{ type: "char", value: ch }] };
  }

  function readSqrt(): MathToken {
    if (normalized.startsWith("\\sqrt{", i)) {
      i += 5;
      return { type: "sqrt", children: readGroup("{", "}") };
    }
    if (normalized.startsWith("sqrt(", i)) {
      i += 4;
      return { type: "sqrt", children: readGroup("(", ")") };
    }
    return { type: "char", value: "s" };
  }

  function readAtom(): MathToken[] | null {
    if (i >= normalized.length) return null;

    if (normalized.startsWith("\\sqrt{", i) || normalized.startsWith("sqrt(", i)) {
      return [readSqrt()];
    }

    const ch = normalized[i];

    if (ch === "(") {
      return [{ type: "group", children: readGroup("(", ")") }];
    }
    if (ch === "{") {
      return [{ type: "group", children: readGroup("{", "}") }];
    }
    if (ch === "^") {
      return [readSuperscript()];
    }

    i += 1;
    return [{ type: "char", value: ch }];
  }

  while (i < normalized.length) {
    const chunk = readAtom();
    if (chunk) tokens.push(...chunk);
  }

  return tokens;
}

export function flattenTokenChars(tokens: MathToken[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    if (token.type === "char") out.push(token.value);
    else out.push(...flattenTokenChars(token.children));
  }
  return out;
}

/** True when every character maps to a drop-in SVG filename for the skin. */
export function expressionUsesOnlyKnownGlyphs(
  input: string,
  assetPrefix: string,
  canMap: (prefix: string, ch: string) => boolean,
): boolean {
  const chars = flattenTokenChars(tokenizeMathExpression(input));
  return chars.every((ch) => {
    if (ch === " ") return true;
    return canMap(assetPrefix, ch);
  });
}

export function isDigitChar(ch: string): boolean {
  return isDigit(ch);
}

export function isLetterChar(ch: string): boolean {
  return isLetter(ch);
}

/** Rebuild a LaTeX fragment from tokens (for KaTeX hybrid fallback). */
export function tokensToLatex(tokens: MathToken[]): string {
  let out = "";
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === "char") {
      out += token.value;
      continue;
    }
    if (token.type === "group") {
      out += `(${tokensToLatex(token.children)})`;
      const next = tokens[i + 1];
      if (next?.type === "sup") {
        out += `^{${tokensToLatex(next.children)}}`;
        i += 1;
      }
      continue;
    }
    if (token.type === "sqrt") {
      out += `\\sqrt{${tokensToLatex(token.children)}}`;
      const next = tokens[i + 1];
      if (next?.type === "sup") {
        out += `^{${tokensToLatex(next.children)}}`;
        i += 1;
      }
      continue;
    }
    if (token.type === "sup") {
      out += `^{${tokensToLatex(token.children)}}`;
    }
  }
  return out;
}
