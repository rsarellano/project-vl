# Math Detail Panel — Derivation & Visual Learning

A design and implementation guide for the **“How we got here”** section in math-layout stages. Written for reading outside the IDE.

---

## 1. Vision

The left column is the **spine**: ordered step boxes (“what happened”). The right detail panel is where **visual learning shines**: “why this step exists” and “how we moved from the previous state to this one.”

| Left column | Detail panel (“How we got here”) |
|-------------|----------------------------------|
| Clean, repeatable step cards | Composed micro-diagrams: stickers, arrows, highlights |
| Short summary text | Full derivation with intuition |
| Same rhythm every time | Can change shape per step type |

The bottom third of the panel is reserved for **“Ask about this step”** (follow-up chat). The top two thirds is the **cinematic explanation** — this document focuses on that top section.

**Product goal:** When a learner clicks Step 2, they should *see* the move — previous equation, the transform, the new equation — not only read more text.

---

## 2. Current UI (what exists today)

### Panel structure

- **File:** `src/components/visualEngine/objectConditions/MathDetailPanelContent.tsx`
- **Layout:** 2:1 flex split
  - Top ~66%: `HOW WE GOT HERE` — empty placeholder with `data-math-step-explanation`
  - Bottom ~33%: chat input + message history
- **Selection:** Click a step box on the left → detail panel appears with connector line
- **Chat:** Textarea is typable; **Ask** button stays disabled until `onStepFollowUp` is wired from `VisualPage` → `Stage` → `DrawingStageSvgContent`

### Key files

| File | Role |
|------|------|
| `objectConditions/MathDetailPanelContent.tsx` | HTML body: explanation slot + chat |
| `objectConditions/mathDetailPanel.tsx` | SVG panel chrome, connector, `foreignObject` wrapper |
| `DrawingStage.tsx` | Step selection state, per-step chat history |
| `layouts/mathLayout.ts` | Detail column geometry (`MATH_DETAIL_PANEL`) |
| `lib/api.ts` | `MathStepFollowUpRequest`, stub `askMathStepFollowUp()` |

---

## 3. Target experience (mockup → composed scene)

### Before (placeholder)

- Panel shows step title and an empty dashed box.

### After (visual derivation)

Example for “Isolate the square root” → “Square both sides”:

1. **Note:** “transfer x which is negative then becomes positive due to property of equality”
2. **Equation 1:** `sqrt(2x+5) - x = 1` with a **caret** above `-x`
3. **Arrow** pointing down
4. **Equation 2:** `sqrt(2x+5) = x + 1`
5. **Note:** “Once it is isolated, we apply square root to both sides”
6. **Equation 3:** `(sqrt(2x+5))^2 = (x+1)^2`

This is a **composed scene** (prose + sticker-equations + carets + arrows + staged transitions), not a single block of text.

---

## 4. Core architecture

Three layers — same pattern as code-map mode:

```
┌─────────────────────────────────────────────────────────┐
│  1. SCENE DATA                                          │
│     derivation JSON per step (from AI or deterministic) │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. COMPOSER (you build)                                │
│     mathDerivationLayout.ts — positions frames in panel │
│     MathDerivationScene.tsx — stacks notes + equations  │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. RENDER + ANIMATE                                    │
│     SkinMathSvg (per-glyph stickers)                    │
│     arrows, carets, labels                              │
│     GSAP timelines on data-glyph-id                     │
└─────────────────────────────────────────────────────────┘
```

| Layer | Provides | Does not provide |
|-------|----------|------------------|
| AI / deterministic builder | Equations, operation labels, notes, frame order | Pixel positions, animations |
| Composer | Layout of each frame inside the panel | Visual theme |
| Renderer | Chalk stickers, arrows, motion | Pedagogy decisions |

**You do not hand-draw each diagram.** You build a **renderer** that draws comparisons from structured data.

---

## 5. Do you need another AI API?

**Not for the visuals.** You need structured **scene data** per step.

| Source | When to use | Second API? |
|--------|-------------|-------------|
| **Same diagram API** (`POST /api/answers/`) | Add `derivation` to each `BoxCreation` in the initial response | No |
| **Deterministic code** | Known subtypes (e.g. `algebra_simplify.py`) | No |
| **Lazy API on click** | Rich explanations only when user opens a step | Optional |

**Recommended default:** extend the **initial** `DrawingStage` response with per-step `derivation`. Use a lazy follow-up API only as fallback or for the chat section below.

---

## 6. Existing foundation: math skins

The project already has a **per-character sticker pipeline**:

```
expression
  → tokenizeMathExpression()     (lib/mathSkins/tokenize.ts)
  → layoutSkinMath()               (lib/mathSkins/layout.ts)
  → PlacedGlyph[]                  (x, y, width, height per char)
  → <image> per character          (SkinMathSvg.tsx)
```

### Glyph asset naming

**Folder:** `public/math-skins/chalkboard/`

| Character | Filename |
|-----------|----------|
| `9` | `mathChalkboardDigit9.svg` |
| `x` | `mathChalkboardLetterX.svg` |
| `+` | `mathChalkboardPlus.svg` |
| `(` | `mathChalkboardParenLeft.svg` |
| sqrt hook | `mathChalkboardSqrtRadical.svg` |

**Registry:** `lib/mathSkins/skins/chalkboard/index.ts`  
**Hybrid mode:** `hybridGlyphs` + `availableGlyphs` — add stickers one file at a time; missing chars fall back to KaTeX until SVG exists.

### What’s missing for “total control”

1. **Stable glyph IDs** — each character needs `data-glyph-id` for GSAP targeting
2. **Scene composer** — stack multiple equations + annotations vertically (not one expression only)
3. **Annotation anchors** — carets/highlights positioned from glyph bounding boxes
4. **SVG in explanation slot** — derivation should render as SVG scene, not plain HTML text
5. **More glyph files** — expand library (`x`, `+`, `-`, `=`, parens, sqrt, etc.)

---

## 7. Proposed data model

Add optional `derivation` on each `BoxCreation` object (frontend type already has optional `detail`; `derivation` should be a separate structured field).

### Example JSON

```json
{
  "id": "step-2",
  "BoxCreation": true,
  "text": ["Square both sides", "", "(sqrt(2x+5))^2 = (x+1)^2"],
  "derivation": {
    "frames": [
      {
        "id": "f1",
        "note": "transfer x which is negative then becomes positive due to property of equality",
        "expression": "sqrt(2x+5) - x = 1",
        "annotations": [
          {
            "type": "caret",
            "anchor": { "charIndex": 11, "length": 2 },
            "label": "move to RHS"
          }
        ]
      },
      {
        "id": "f2",
        "transition": { "type": "arrow", "direction": "down" },
        "expression": "sqrt(2x+5) = x + 1"
      },
      {
        "id": "f3",
        "note": "Once it is isolated, we apply square root to both sides",
        "expression": "(sqrt(2x+5))^2 = (x+1)^2"
      }
    ]
  }
}
```

- `charIndex` / `length` tie annotations to **specific glyphs** — the hook for per-character animation.
- `transition` between frames drives arrows and timeline sequencing.

### Fallback without `derivation`

Until AI emits this field:

- Use previous step’s `text` vs current step’s `text` for a simple before → arrow → after layout
- Or compute frames deterministically for subtypes you implement in Python (like simplify algebra)

---

## 8. Per-character control — implementation plan

### 8.1 Extend `SkinMathSvg` with glyph IDs

Render each placed glyph inside a group:

```tsx
<g data-glyph-id="f1-char-11" data-char="-">
  <image href="/math-skins/chalkboard/mathChalkboardMinus.svg" ... />
</g>
```

Props to add:

- `glyphIdPrefix` — e.g. `"f1"` so IDs are unique across frames
- Optional `onGlyphsPlaced` callback for annotation layout

### 8.2 Annotation anchors from layout

After `layoutSkinMath(expression)`, each glyph has `x`, `y`, `width`, `height`.

```typescript
// Pseudocode
function resolveGlyphAnchor(layout: SkinMathLayout, charIndex: number) {
  const glyph = layout.glyphs[charIndex];
  return {
    x: glyph.x + glyph.width / 2,
    y: glyph.y - 8,  // caret above
  };
}
```

No manual caret placement per diagram — layout drives overlays.

### 8.3 `MathDerivationScene` component

**New file (suggested):** `src/components/visualEngine/objectConditions/MathDerivationScene.tsx`

Responsibilities:

- Render inside `[data-math-step-explanation]` (replace empty placeholder)
- Stack frames vertically: note → equation → annotations → transition arrow → next frame
- Use theme tokens (chalkboard colors, fonts)
- Accept `derivation.frames` + `mathSkin` + `theme`

**Layout helper (suggested):** `src/components/visualEngine/layouts/mathDerivationLayout.ts`

- Computes Y positions for each frame inside panel bounds
- Returns connector points for arrows between frames

### 8.4 Rendering surface: prefer SVG

| Approach | Per-char control | Fits picture 2? |
|----------|------------------|-----------------|
| KaTeX in `foreignObject` | No | No |
| `SkinMathSvg` + scene composer | Yes | **Yes** |
| Whole equation as one PNG | No | No |

Options for embedding:

- Nested `<svg>` inside the explanation `foreignObject`, or
- Render derivation as sibling SVG content in `mathDetailPanel.tsx` (clipped to panel bounds)

---

## 9. Animation (GSAP)

The main stage already uses GSAP (`drawingStageTimeline.ts`). Use a **separate** timeline for derivations so opening a step does not replay the full diagram.

| Effect | GSAP target |
|--------|-------------|
| Frame 1 → 2 | Fade out frame 1, draw arrow, fade in frame 2 |
| Move term to RHS | Tween `x`/`y` on `[data-glyph-id="f1-char-11"]` |
| Swap sticker | Change `href` or crossfade two `<image>` elements |
| Caret emphasis | Short `y` bounce on caret group |
| “Square both sides” | Highlight both sides, then reveal squared equation |

**Suggested file:** `src/components/visualEngine/mathDerivationTimeline.ts`

Trigger on:

- Step selection (panel open)
- Optional “play derivation” button later

---

## 10. Recommended build order

| Step | Task | Outcome |
|------|------|---------|
| 1 | `MathDerivationScene.tsx` — static 3-frame scene (sqrt example), hardcoded | Proves layout in panel |
| 2 | `SkinMathSvg` — add `glyphIdPrefix` + `data-glyph-id` on every glyph | Per-char targeting |
| 3 | `resolveGlyphAnchor()` using layout bboxes | Carets and highlights |
| 4 | Add chalk SVG glyphs: `x`, `+`, `-`, `=`, `(`, `)`, `2`, `5`, sqrt radical | Full equations as stickers |
| 5 | `derivation.frames` schema (TS + Python) + wire from `BoxCreation` | Data-driven scenes |
| 6 | `mathDerivationTimeline.ts` — GSAP on panel open | Motion |
| 7 | Extend math AI prompt or deterministic builders to emit `derivation` | Automatic content |

---

## 11. Chat section (bottom third)

Separate concern from derivation visuals.

| Piece | Status |
|-------|--------|
| UI (textarea, messages) | Done |
| Per-step message history | Done |
| `onStepFollowUp` handler | Not wired from `VisualPage` |
| Backend endpoint | Not implemented (`askMathStepFollowUp` stub in `lib/api.ts`) |

To enable Ask:

```tsx
// VisualPage.tsx
import { askMathStepFollowUp } from "@/lib/api";

<Stage
  ...
  originalPrompt={question}
  onStepFollowUp={
    drawingStage?.layoutMode === "math" ? askMathStepFollowUp : undefined
  }
/>
```

Implement `askMathStepFollowUp` when backend exposes e.g. `POST /api/answers/step-follow-up`.

---

## 12. Code-map precedent

Code-map mode already follows the same split:

- **AI supplies:** `CodeDisplay` text, `portions`, explanation box `text`
- **Frontend draws:** highlights, connectors, detail branch (`codeMapExplanation.tsx`)
- **Layout:** `codeMapLayout.ts` resolves all positions

Math derivation should mirror this:

- **AI supplies:** `derivation.frames`
- **Frontend draws:** `MathDerivationScene.tsx`
- **Layout:** `mathDerivationLayout.ts`

---

## 13. File reference map

### Panel & selection

```
src/components/visualEngine/
  DrawingStage.tsx
  objectConditions/
    mathDetailPanel.tsx
    MathDetailPanelContent.tsx
    boxCreation.tsx
  layouts/
    mathLayout.ts
  Stage.tsx
```

### Math skins (per-character stickers)

```
src/lib/mathSkins/
  tokenize.ts
  layout.ts
  glyphAssets.ts
  renderSkinMath.ts
  skins/chalkboard/index.ts
src/components/visualEngine/
  SkinMathSvg.tsx
  MathTextLines.tsx
public/math-skins/chalkboard/
  mathChalkboardDigit5.svg
  mathChalkboardDigit9.svg
  ... (add more glyphs here)
```

### Backend (diagram generation)

```
project_vl_be/app/
  schemas/infographics_schema.py
  services/ai_services/drawing_stage/
    _trunk_contract.py
    math/general.py
    math/algebra_simplify.py   # deterministic example
  controllers/answer_router.py
```

### Suggested new files

```
src/components/visualEngine/
  objectConditions/MathDerivationScene.tsx
  layouts/mathDerivationLayout.ts
  mathDerivationTimeline.ts
src/lib/mathDerivation/
  types.ts                     # DerivationFrame, Annotation, etc.
```

---

## 14. Summary

| Question | Answer |
|----------|--------|
| Hand-draw box 1 vs box 2 each time? | **No** — build a scene composer + renderer |
| Another AI API required? | **Optional** — prefer `derivation` in the first diagram response |
| Where does artistic style live? | Top 2/3 of detail panel, SVG scene with chalk stickers |
| Per-character control? | Extend existing **math skins** pipeline with glyph IDs + more SVG assets |
| Animation? | GSAP on `data-glyph-id` groups, separate from main stage timeline |
| First coding slice? | Static 3-frame sqrt scene + `data-glyph-id` on `SkinMathSvg` |

---

## 15. Related types (frontend, today)

```typescript
// BoxCreationObject (boxCreation.tsx)
type BoxCreationObject = {
  id: string | number;
  BoxCreation?: boolean;
  text?: string | string[];
  detail?: string | string[];  // optional expanded copy (fallback text)
  // derivation?: StepDerivation;  // proposed — not yet in schema
};

// MathStepFollowUpRequest (lib/api.ts)
type MathStepFollowUpRequest = {
  question: string;
  stepId: string;
  stepIndex: number;
  stage: DrawingStage;
  originalPrompt?: string | null;
};
```

---

*Last updated: June 2026 — reflects math detail panel, chat scaffold, and derivation design discussions.*
