import type { GlyphFolderLayout, MathSkinDefinition, MathSkinId } from "./types";

/**
 * File naming for drop-in SVG glyph folders under `public/math-skins/<skinId>/`.
 *
 * Default skin (with `glyphFolders`):
 *   digits/    → mathDefaultDigit9.svg
 *   letters/   → mathDefaultLetterX.svg
 *   operators/ → mathDefaultPlus.svg
 *   special/   → mathDefaultSqrtRadical.svg
 *
 * Flat skins (chalkboard, etc.):
 *   mathChalkboardDigit9.svg in the skin root
 */

const OPERATOR_NAMES: Record<string, string> = {
  "+": "Plus",
  "-": "Minus",
  "=": "Equals",
  "±": "PlusMinus",
  "*": "Times",
  "/": "Slash",
  ".": "Dot",
  " ": "Space",
  "(": "ParenLeft",
  ")": "ParenRight",
};

const SPECIAL_ASSET_NAMES = {
  sqrtRadical: "SqrtRadical",
} as const;

export type SkinSpecialAsset = keyof typeof SPECIAL_ASSET_NAMES;

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isLetter(ch: string): boolean {
  const lower = ch.toLowerCase();
  return lower >= "a" && lower <= "z";
}

function glyphFolderKey(char: string): keyof GlyphFolderLayout | null {
  if (isDigit(char)) return "digits";
  if (isLetter(char)) return "letters";
  if (OPERATOR_NAMES[char]) return "operators";
  return null;
}

function resolveAssetUrl(
  basePath: string,
  fileName: string,
  folders: GlyphFolderLayout | undefined,
  folder: keyof GlyphFolderLayout,
): string {
  if (folders) {
    return `${basePath}/${folders[folder]}/${fileName}`;
  }
  return `${basePath}/${fileName}`;
}

/** Map one character to its SVG filename, or null when unsupported. */
export function skinGlyphFileName(assetPrefix: string, char: string): string | null {
  const ch = char.length === 1 ? char : "";
  if (!ch) return null;

  if (isDigit(ch)) {
    return `${assetPrefix}Digit${ch}.svg`;
  }

  const lower = ch.toLowerCase();
  if (isLetter(lower)) {
    return `${assetPrefix}Letter${lower.toUpperCase()}.svg`;
  }

  const operatorName = OPERATOR_NAMES[ch];
  if (operatorName) {
    return `${assetPrefix}${operatorName}.svg`;
  }

  return null;
}

export function skinSpecialAssetFileName(
  assetPrefix: string,
  asset: SkinSpecialAsset,
): string {
  return `${assetPrefix}${SPECIAL_ASSET_NAMES[asset]}.svg`;
}

/** Public URL for a character SVG in a skin folder. */
export function getSkinGlyphAssetUrl(
  skin: Pick<MathSkinDefinition, "assetPrefix" | "assetBasePath" | "glyphFolders">,
  char: string,
): string | null {
  const fileName = skinGlyphFileName(skin.assetPrefix, char);
  if (!fileName) return null;
  const folder = glyphFolderKey(char);
  if (skin.glyphFolders && folder) {
    return resolveAssetUrl(skin.assetBasePath, fileName, skin.glyphFolders, folder);
  }
  return `${skin.assetBasePath}/${fileName}`;
}

/** Public URL for composite assets (sqrt hook, etc.). */
export function getSkinSpecialAssetUrl(
  skin: Pick<
    MathSkinDefinition,
    "assetPrefix" | "assetBasePath" | "glyphFolders" | "specialAssetFolders"
  >,
  asset: SkinSpecialAsset,
): string {
  const fileName = skinSpecialAssetFileName(skin.assetPrefix, asset);
  const folder = skin.specialAssetFolders?.[asset] ?? "special";
  return resolveAssetUrl(
    skin.assetBasePath,
    fileName,
    skin.glyphFolders,
    folder,
  );
}

/** Convenience when you only have a skin id (looks up registered skin). */
export function getGlyphAssetUrlForSkin(
  skinId: MathSkinId,
  char: string,
  getSkin: (id: MathSkinId) => MathSkinDefinition | null,
): string | null {
  const skin = getSkin(skinId);
  if (!skin) return null;
  return getSkinGlyphAssetUrl(skin, char);
}

export function canMapCharToSkinAsset(assetPrefix: string, char: string): boolean {
  return skinGlyphFileName(assetPrefix, char) !== null;
}

export function getSkinSupportedCharKeys(): string[] {
  const digits = Array.from({ length: 10 }, (_, i) => String(i));
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
  return [...digits, ...letters, ...Object.keys(OPERATOR_NAMES)];
}
