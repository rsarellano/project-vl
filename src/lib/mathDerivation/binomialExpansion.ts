/**
 * Deterministic binomial-square expander used to enrich motion-stage frames so
 * algebra steps like ``(x+1)^2`` morph through the FOIL stages instead of
 * jumping straight to the answer:
 *
 *   (x+1)^2  →  (x+1)(x+1)  →  x^2 + x + x + 1  →  x^2 + 2x + 1
 *
 * Intentionally conservative: only single-variable binomials with integer
 * coefficients are expanded. Anything it can't parse confidently returns null
 * so the caller falls back to the plain from → to morph.
 */

type Monomial = {
  coeff: number;
  variable: string | null;
  power: number;
};

function parseMonomial(raw: string): Monomial | null {
  const token = raw.trim().replace(/\s+/g, "");
  if (!token) return null;

  // coeff[*]?var[^power]?  — e.g. "2x", "-3y^2", "x", "5", "-7"
  const match = token.match(/^([+-]?\d*)\*?([a-zA-Z]?)(?:\^(\d+))?$/);
  if (!match) return null;

  const [, coeffRaw, variable, powerRaw] = match;

  let coeff: number;
  if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
  else if (coeffRaw === "-") coeff = -1;
  else coeff = Number(coeffRaw);
  if (!Number.isFinite(coeff)) return null;

  if (!variable) {
    return { coeff, variable: null, power: 0 };
  }

  const power = powerRaw ? Number(powerRaw) : 1;
  if (!Number.isFinite(power)) return null;

  return { coeff, variable, power };
}

/** Split a binomial inner like "x + 1" or "2x - 5" into two signed monomials. */
function splitBinomial(inner: string): [Monomial, Monomial] | null {
  const trimmed = inner.trim();
  // Find a top-level + or - that is not the leading sign.
  for (let i = 1; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch !== "+" && ch !== "-") continue;
    const prev = trimmed[i - 1];
    // Skip exponent signs / operators glued to another operator.
    if (prev === "^" || prev === "*" || prev === "+" || prev === "-") continue;

    const left = trimmed.slice(0, i).trim();
    const right = trimmed.slice(i).trim();
    const a = parseMonomial(left);
    const b = parseMonomial(right);
    if (a && b) return [a, b];
  }
  return null;
}

function multiply(a: Monomial, b: Monomial): Monomial | null {
  const coeff = a.coeff * b.coeff;

  if (a.variable && b.variable) {
    if (a.variable !== b.variable) return null; // bail on mixed variables
    return { coeff, variable: a.variable, power: a.power + b.power };
  }
  const variable = a.variable ?? b.variable;
  const power = a.variable ? a.power : b.power;
  return { coeff, variable, power: variable ? power : 0 };
}

/** Render a monomial's magnitude (sign handled by the join). */
function renderMagnitude(m: Monomial): string {
  const mag = Math.abs(m.coeff);
  if (!m.variable) return String(mag);

  const varPart = m.power > 1 ? `${m.variable}^${m.power}` : m.variable;
  if (mag === 1) return varPart;
  return `${mag}${varPart}`;
}

/** Join signed monomials into "a + b - c", first term keeps its own sign. */
function joinTerms(terms: Monomial[]): string {
  return terms
    .map((term, index) => {
      const sign = term.coeff < 0 ? "-" : "+";
      const magnitude = renderMagnitude(term);
      if (index === 0) return term.coeff < 0 ? `-${magnitude}` : magnitude;
      return ` ${sign} ${magnitude}`;
    })
    .join("");
}

/** Locate the first ``(...)^2`` in expr and return inner + surrounding text. */
function findSquaredBinomial(
  expr: string,
): { before: string; inner: string; after: string } | null {
  for (let i = 0; i < expr.length; i += 1) {
    if (expr[i] !== "(") continue;

    let depth = 0;
    let close = -1;
    for (let j = i; j < expr.length; j += 1) {
      if (expr[j] === "(") depth += 1;
      else if (expr[j] === ")") {
        depth -= 1;
        if (depth === 0) {
          close = j;
          break;
        }
      }
    }
    if (close === -1) continue;

    const rest = expr.slice(close + 1);
    const powerMatch = rest.match(/^\s*\^\s*(?:\{\s*2\s*\}|2)/);
    if (!powerMatch) continue;

    return {
      before: expr.slice(0, i),
      inner: expr.slice(i + 1, close),
      after: rest.slice(powerMatch[0].length),
    };
  }
  return null;
}

/**
 * Build the FOIL stage strings for the first squared binomial in ``expr``.
 * Returns ``[product, foilRow, combined]`` substituted back into the full
 * expression (each keeps the rest of the equation intact), or null.
 */
export function expandSquaredBinomialStages(expr: string): string[] | null {
  const located = findSquaredBinomial(expr);
  if (!located) return null;

  const split = splitBinomial(located.inner);
  if (!split) return null;

  const [a, b] = split;
  const first = multiply(a, a);
  const outer = multiply(a, b);
  const inner = multiply(b, a);
  const last = multiply(b, b);
  if (!first || !outer || !inner || !last) return null;

  const combinedMiddle: Monomial = {
    coeff: outer.coeff + inner.coeff,
    variable: outer.variable,
    power: outer.power,
  };

  const innerExpr = located.inner.trim();
  const wrap = (body: string) => `${located.before}${body}${located.after}`;

  const productFrame = wrap(`(${innerExpr})(${innerExpr})`);
  const foilFrame = wrap(joinTerms([first, outer, inner, last]));
  const combinedFrame = wrap(joinTerms([first, combinedMiddle, last]));

  return [productFrame, foilFrame, combinedFrame];
}

/**
 * Produce an enriched morph frame list. When ``fromExpr`` contains a squared
 * binomial, inserts the FOIL stages between from and to so the expansion is
 * animated step-by-step. Returns null when there is nothing to expand.
 */
export function buildExpansionFrames(
  fromExpr: string | undefined,
  toExpr: string | undefined,
): string[] | null {
  const from = fromExpr?.trim();
  if (!from) return null;

  const stages = expandSquaredBinomialStages(from);
  if (!stages) return null;

  const frames = [from, ...stages];
  const to = toExpr?.trim();
  if (to) frames.push(to);

  // Drop consecutive duplicates (e.g. combined already equals ``to``).
  const deduped = frames.filter(
    (frame, index) => index === 0 || frame !== frames[index - 1],
  );

  return deduped.length >= 2 ? deduped : null;
}
