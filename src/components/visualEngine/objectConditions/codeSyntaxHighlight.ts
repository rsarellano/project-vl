import type { CodeSyntaxPalette } from "@/components/visualEngine/themes/types";

export type SyntaxToken = {
  text: string;
  color: string;
};

const KEYWORDS = new Set([
  "export",
  "import",
  "from",
  "default",
  "async",
  "await",
  "const",
  "let",
  "var",
  "function",
  "class",
  "interface",
  "type",
  "extends",
  "implements",
  "enum",
  "namespace",
  "declare",
  "public",
  "private",
  "protected",
  "readonly",
  "static",
  "abstract",
  "new",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "throw",
  "try",
  "catch",
  "finally",
  "typeof",
  "instanceof",
  "in",
  "of",
  "as",
  "is",
  "satisfies",
  "keyof",
  "infer",
  "null",
  "undefined",
  "true",
  "false",
  "void",
  "never",
]);

const TYPE_LITERALS = new Set([
  "number",
  "string",
  "boolean",
  "bigint",
  "symbol",
  "object",
  "unknown",
  "any",
  "never",
  "void",
  "null",
  "undefined",
]);

const TOKEN_PATTERN =
  /("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`|\?\?|\|\||&&|===|!==|==|!=|=>|\.\.\.|<<|>>|[{}()[\];,.:?=+*\/%-]|\w+|\s+)/g;

function isIdentifier(token: string): boolean {
  return /^\w+$/.test(token);
}

/** Lightweight TS/JS highlighter tuned for interface + function snippets. */
export function tokenizeCodeLine(
  line: string,
  palette: CodeSyntaxPalette,
): SyntaxToken[] {
  const raw = line.match(TOKEN_PATTERN) ?? [line];
  const tokens: SyntaxToken[] = [];

  let expectTypeName = false;
  let expectPropertyName = false;
  let afterColon = false;
  let braceDepth = 0;

  for (const part of raw) {
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, color: palette.default });
      continue;
    }

    if (part === "{") {
      braceDepth += 1;
      expectPropertyName = braceDepth > 0;
      afterColon = false;
      tokens.push({ text: part, color: palette.punctuation });
      continue;
    }

    if (part === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      expectPropertyName = braceDepth > 0;
      afterColon = false;
      tokens.push({ text: part, color: palette.punctuation });
      continue;
    }

    if (/^["'`]/.test(part)) {
      tokens.push({ text: part, color: palette.string });
      expectTypeName = false;
      expectPropertyName = false;
      afterColon = false;
      continue;
    }

    if (/^\d/.test(part)) {
      tokens.push({ text: part, color: palette.number });
      continue;
    }

    if (isIdentifier(part)) {
      if (KEYWORDS.has(part)) {
        tokens.push({ text: part, color: palette.keyword });
        expectTypeName = part === "interface" || part === "class" || part === "type";
        expectPropertyName = false;
        afterColon = false;
        continue;
      }

      if (part === "extends" || part === "implements") {
        tokens.push({ text: part, color: palette.keyword });
        expectTypeName = true;
        expectPropertyName = false;
        afterColon = false;
        continue;
      }

      if (TYPE_LITERALS.has(part) && (afterColon || expectTypeName)) {
        tokens.push({ text: part, color: palette.typeLiteral });
        expectTypeName = false;
        afterColon = false;
        continue;
      }

      if (expectTypeName) {
        tokens.push({ text: part, color: palette.typeName });
        expectTypeName = false;
        continue;
      }

      if (expectPropertyName && !afterColon) {
        tokens.push({ text: part, color: palette.property });
        continue;
      }

      tokens.push({ text: part, color: palette.default });
      continue;
    }

    if (part === ":") {
      afterColon = true;
      expectPropertyName = false;
      tokens.push({ text: part, color: palette.punctuation });
      continue;
    }

    if (part === ";" || part === ",") {
      afterColon = false;
      expectPropertyName = braceDepth > 0;
      tokens.push({ text: part, color: palette.punctuation });
      continue;
    }

    if (part === "?") {
      tokens.push({ text: part, color: palette.operator });
      continue;
    }

    tokens.push({
      text: part,
      color: palette.punctuation,
    });
  }

  return tokens;
}
