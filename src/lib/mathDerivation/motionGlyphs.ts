/** GSAP targets for sticker ``data-char`` sequences inside a motion beat. */

export type MathDerivationMotionKind =
  | "slide_right"
  | "slide_left"
  | "highlight"
  | "fade_in";

export function findMotionGlyphElements(
  beatRoot: HTMLElement,
  term: string,
): SVGGElement[] {
  const normalized = term.replace(/\s/g, "");
  if (!normalized) return [];

  const glyphs = Array.from(
    beatRoot.querySelectorAll<SVGGElement>("[data-glyph-id][data-char]"),
  );
  if (!glyphs.length) return [];

  const chars = glyphs.map((glyph) => glyph.getAttribute("data-char") ?? "");

  for (let start = 0; start <= chars.length - normalized.length; start += 1) {
    let matched = true;
    for (let offset = 0; offset < normalized.length; offset += 1) {
      const glyphChar = chars[start + offset] ?? "";
      const termChar = normalized[offset] ?? "";
      if (glyphChar.toLowerCase() !== termChar.toLowerCase()) {
        matched = false;
        break;
      }
    }
    if (matched) return glyphs.slice(start, start + normalized.length);
  }

  return [];
}
