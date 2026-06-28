/**
 * Build motion-stage frames for "combine like terms" steps, e.g.:
 *
 *   0 = x^2 + 2x + 1 - 2x - 5
 *     → 0 = x^2 + (2x - 2x) + (1 - 5)
 *     → 0 = x^2 - 4
 *
 * Conservative: single-variable sums with integer coefficients only.
 */

type Term = {
  coeff: number;
  variable: string | null;
  power: number;
  text: string;
};

function splitEquation(expr: string): { left: string; right: string } | null {
  const idx = expr.indexOf("=");
  if (idx < 0) return null;
  return {
    left: expr.slice(0, idx).trim(),
    right: expr.slice(idx + 1).trim(),
  };
}

function parseMonomial(raw: string): Term | null {
  const token = raw.trim().replace(/\s+/g, "");
  if (!token) return null;

  const match = token.match(/^([+-]?\d*)\*?([a-zA-Z]?)(?:\^(\d+))?$/);
  if (!match) return null;

  const [, coeffRaw, variable, powerRaw] = match;

  let coeff: number;
  if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
  else if (coeffRaw === "-") coeff = -1;
  else coeff = Number(coeffRaw);
  if (!Number.isFinite(coeff)) return null;

  const power = variable ? (powerRaw ? Number(powerRaw) : 1) : 0;
  if (!Number.isFinite(power)) return null;

  return {
    coeff,
    variable: variable || null,
    power,
    text: token,
  };
}

/** Split a sum/difference into top-level signed terms. */
function splitTopLevelTerms(expr: string): Term[] {
  const trimmed = expr.trim();
  if (!trimmed) return [];

  const chunks: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);

    if (depth === 0 && i > 0 && (ch === "+" || ch === "-")) {
      chunks.push(current.trim());
      current = ch === "-" ? "-" : "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) chunks.push(current.trim());

  const terms: Term[] = [];
  for (const chunk of chunks) {
    const parsed = parseMonomial(chunk);
    if (parsed) terms.push(parsed);
  }
  return terms;
}

function termKey(term: Term): string {
  if (!term.variable) return "__const__";
  return `${term.variable}^${term.power}`;
}

function renderMagnitude(term: Term): string {
  const mag = Math.abs(term.coeff);
  if (!term.variable) return String(mag);
  const varPart = term.power > 1 ? `${term.variable}^${term.power}` : term.variable;
  if (mag === 1) return varPart;
  return `${mag}${varPart}`;
}

function renderSignedTerm(term: Term, index: number): string {
  const mag = renderMagnitude(term);
  if (index === 0) return term.coeff < 0 ? `-${mag}` : mag;
  return term.coeff < 0 ? ` - ${mag}` : ` + ${mag}`;
}

function joinTerms(terms: Term[]): string {
  return terms.map((term, index) => renderSignedTerm(term, index)).join("");
}

/** Group canceling variable pairs and constant sums with visible parentheses. */
function buildGroupedSide(expr: string): string | null {
  const terms = splitTopLevelTerms(expr);
  if (terms.length < 3) return null;

  const used = new Set<number>();
  const parts: string[] = [];

  for (let i = 0; i < terms.length; i += 1) {
    if (used.has(i)) continue;

    const a = terms[i];
    let paired = false;

    if (a.variable) {
      for (let j = i + 1; j < terms.length; j += 1) {
        if (used.has(j)) continue;
        const b = terms[j];
        if (termKey(a) !== termKey(b)) continue;
        if (a.coeff + b.coeff !== 0) continue;

        const left = renderMagnitude(a);
        const right = renderMagnitude({ ...b, coeff: Math.abs(b.coeff) });
        const group =
          parts.length === 0
            ? `(${left} - ${right})`
            : `(${left} - ${right})`;
        parts.push(group);
        used.add(i);
        used.add(j);
        paired = true;
        break;
      }
    }

    if (paired) continue;

    if (!a.variable) {
      const constants: Term[] = [a];
      used.add(i);
      for (let j = i + 1; j < terms.length; j += 1) {
        if (used.has(j)) continue;
        if (terms[j]?.variable) continue;
        constants.push(terms[j]);
        used.add(j);
      }
      if (constants.length >= 2) {
        const inner = constants
          .map((term, index) => renderSignedTerm(term, index))
          .join("")
          .replace(/^\+/, "");
        parts.push(`(${inner})`);
        continue;
      }
    }

    parts.push(renderSignedTerm(a, parts.length === 0 ? 0 : parts.length));
    used.add(i);
  }

  const grouped = parts
    .map((part, index) => (index === 0 ? part : ` + ${part}`))
    .join("");
  if (!grouped || grouped.replace(/\s+/g, "") === expr.replace(/\s+/g, "")) {
    return null;
  }
  return grouped;
}

function rebuildEquation(left: string, right: string): string {
  return `${left} = ${right}`;
}

/**
 * Produce morph frames for a combine-like-terms step, or null when unsure.
 */
export function expandCombineLikeTermsStages(expr: string): string[] | null {
  const sides = splitEquation(expr);
  if (!sides) return null;

  const groupedRight = buildGroupedSide(sides.right);
  const groupedLeft = buildGroupedSide(sides.left);
  if (!groupedRight && !groupedLeft) return null;

  const grouped = rebuildEquation(
    groupedLeft ?? sides.left,
    groupedRight ?? sides.right,
  );

  if (grouped.replace(/\s+/g, "") === expr.replace(/\s+/g, "")) return null;
  return [expr, grouped];
}

/** Merge auto-combine frames with from → to for the motion stage. */
export function buildCombineLikeTermsFrames(
  fromExpr: string | undefined,
  toExpr: string | undefined,
): string[] | null {
  const from = fromExpr?.trim();
  const to = toExpr?.trim();
  if (!from || !to) return null;
  if (from.replace(/\s+/g, "") === to.replace(/\s+/g, "")) return null;

  const stages = expandCombineLikeTermsStages(from);
  if (!stages) return null;

  const frames = [from, ...stages.slice(1), to];
  const deduped = frames.filter(
    (frame, index) => index === 0 || frame !== frames[index - 1],
  );

  return deduped.length >= 2 ? deduped : null;
}
