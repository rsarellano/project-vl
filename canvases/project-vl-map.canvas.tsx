import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  CollapsibleSection,
  computeDAGLayout,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type AppId = "frontend" | "backend";

type AppInfo = {
  id: AppId;
  name: string;
  path: string;
  port: string;
  stack: string;
  role: string;
  entry: string;
  highlights: string[];
};

type FlowNodeMeta = {
  id: string;
  label: string;
  detail: string;
  layer: string;
};

const APPS: AppInfo[] = [
  {
    id: "frontend",
    name: "project-vl",
    path: "project-vl/",
    port: ":3000",
    stack: "Next.js 15 · React 19 · GSAP · Tailwind 4",
    role: "Production UI — landing, auth, workspace, SVG visual engine, theme picker, zoom, export.",
    entry: "src/app/app/page.tsx → WorkspaceShell → VisualPage.tsx",
    highlights: [
      "visualEngine/ — Stage, CodeMapStage, DrawingStage, themes/",
      "layouts/codeMapLayout.ts — code-map geometry, spacing, connector lanes",
      "lib/api.ts — POST /api/answers/ · GET samples/two-sum",
      "types/infographics.ts — TS mirror of DrawingStage contract",
    ],
  },
  {
    id: "backend",
    name: "project_vl_be",
    path: "project_vl_be/",
    port: ":8000",
    stack: "FastAPI · LangChain · Pydantic · SQLAlchemy async",
    role: "AI pipeline, schema validation, sanitization, PostgreSQL persistence, JWT auth.",
    entry: "app/main.py → controllers/answer_router.py → answer_service.py",
    highlights: [
      "drawing_stage_prompts.py — trunk + code-map system prompts",
      "pasted_code.py — detect/extract user snippets for code_explain",
      "infographics_schema.py — Pydantic contract (CodeDisplay + code-map)",
      "drawing_stage_objects.py — post-AI sanitizer + pasted-code injection",
    ],
  },
];

const FLOW_NODES: FlowNodeMeta[] = [
  {
    id: "user",
    label: "User",
    detail: "Types a question in VisualPage textarea",
    layer: "Browser",
  },
  {
    id: "visualpage",
    label: "VisualPage",
    detail: "Theme picker · zoom · narration · export SVG/PNG",
    layer: "Frontend",
  },
  {
    id: "api",
    label: "api.ts",
    detail: "createAnswer() → POST /api/answers/",
    layer: "Frontend",
  },
  {
    id: "router",
    label: "answer_router",
    detail: "FastAPI controller — validates AnswerCreate",
    layer: "Backend",
  },
  {
    id: "service",
    label: "answer_service",
    detail: "Orchestrates classify → LLM → sanitize → persist",
    layer: "Backend",
  },
  {
    id: "classifier",
    label: "question_type",
    detail: "Keyword routing: coding.code_explain · code_solution · loop_trace · math.*",
    layer: "Backend",
  },
  {
    id: "llm",
    label: "LangChain + OpenAI",
    detail: "with_structured_output(DrawingStage)",
    layer: "AI",
  },
  {
    id: "prompts",
    label: "drawing_stage_prompts",
    detail: "Trunk system OR code-map system + pasted-code human block",
    layer: "AI",
  },
  {
    id: "pasted",
    label: "pasted_code.py",
    detail: "Extract snippet from prompt; max 80-line coding snippet guard for code-map",
    layer: "Backend",
  },
  {
    id: "schema",
    label: "infographics_schema",
    detail: "Pydantic — BoxCreation, TextCreation, CodeDisplay, layoutMode",
    layer: "Contract",
  },
  {
    id: "sanitizer",
    label: "improve_stage_quality",
    detail: "Strips coords, forbidden keys, legacy types",
    layer: "Contract",
  },
  {
    id: "db",
    label: "PostgreSQL",
    detail: "answers.stage JSONB column",
    layer: "Database",
  },
  {
    id: "stage",
    label: "Stage.tsx",
    detail: "Dynamic viewBox · theme canvas · zoom · GSAP ref",
    layer: "Render",
  },
  {
    id: "dispatch",
    label: "DrawingStage.tsx",
    detail: "layoutMode trunk → step row · code-map → CodeMapStage",
    layer: "Render",
  },
  {
    id: "codemap",
    label: "CodeMapStage",
    detail: "Code panel + highlights + explain boxes + click-to-expand second branches",
    layer: "Render",
  },
  {
    id: "objects",
    label: "box / text / code",
    detail: "Trunk: horizontal boxes. Code-map: CodeDisplay + linkedPortion boxes",
    layer: "Render",
  },
  {
    id: "gsap",
    label: "GSAP timeline",
    detail: "Staggered fade-in + line draw animations",
    layer: "Render",
  },
  {
    id: "themes",
    label: "Theme stickers",
    detail: "default (sharp rects, dark code panel) · cyberpunk",
    layer: "Render",
  },
];

const FLOW_EDGES = [
  { from: "user", to: "visualpage" },
  { from: "visualpage", to: "api" },
  { from: "api", to: "router" },
  { from: "router", to: "service" },
  { from: "service", to: "classifier" },
  { from: "classifier", to: "llm" },
  { from: "llm", to: "prompts" },
  { from: "prompts", to: "schema" },
  { from: "schema", to: "sanitizer" },
  { from: "sanitizer", to: "pasted" },
  { from: "pasted", to: "db" },
  { from: "db", to: "stage" },
  { from: "stage", to: "dispatch" },
  { from: "dispatch", to: "codemap" },
  { from: "dispatch", to: "objects" },
  { from: "codemap", to: "gsap" },
  { from: "objects", to: "gsap" },
  { from: "gsap", to: "themes" },
];

const VISUAL_ENGINE_FILES = [
  { file: "Stage.tsx", role: "SVG canvas wrapper, computeViewBox, theme bg, zoom prop" },
  { file: "DrawingStage.tsx", role: "Routes layoutMode: trunk vs code-map" },
  { file: "CodeMapStage.tsx", role: "Code panel + highlights + expandable detail branches" },
  { file: "layouts/codeMapLayout.ts", role: "Code-map geometry, spacing, connector lanes, viewBox reserve" },
  { file: "objectConditions/codeDisplay.tsx", role: "Code panel chrome, HTML syntax, highlights" },
  {
    file: "objectConditions/codeMapExplanation.tsx",
    role: "Renders main explanation boxes; click toggles second-branch detail cards with wrapped text and loop-check iteration drilldown",
  },
  { file: "objectConditions/codeMapLineCreation.tsx", role: "L-shaped highlight → explain connectors" },
  { file: "drawingStageTimeline.ts", role: "GSAP — opacity-only for code-map, y-fade for trunk" },
  { file: "objectConditions/boxCreation.tsx", role: "Trunk horizontal layout · stroke 2.5 · hover" },
  { file: "objectConditions/textCreation.tsx", role: "code-title, objective, console roles" },
  { file: "objectConditions/lineCreation.tsx", role: "Trunk horizontal connectors" },
  { file: "themes/default/", role: "Sharp rects, dark code panel, light canvas" },
  { file: "themes/cyberpunk/", role: "Neon HUD panels, clipped corners, glow filters" },
];

const AI_PIPELINE_FILES = [
  { file: "answer_service.py", role: "Main orchestrator + rejects pasted code over 80 lines" },
  { file: "drawing_stage_prompts.py", role: "DRAWING_STAGE_SYSTEM + DRAWING_STAGE_CODE_MAP_SYSTEM" },
  { file: "pasted_code.py", role: "Detect/extract pasted snippets; line-count detection + snippet cap" },
  { file: "drawing_stage_objects.py", role: "Sanitizer + code-map normalize + inject pasted code" },
  { file: "question_type_identifier.py", role: "Classifier: pasted code defaults to code_explain unless explicit loop trace intent" },
  { file: "drawing_stage_samples.py", role: "Static while-loop + two-sum code-map samples" },
  { file: "infographics_schema.py", role: "Pydantic DrawingStage — CodeDisplay + layoutMode" },
];

const TECH_STACK = [
  { layer: "Frontend", tech: "Next.js 15, React 19, TypeScript, Tailwind 4, GSAP 3.15" },
  { layer: "Render", tech: "Inline SVG, theme registry, dynamic viewBox, ctrl+wheel zoom" },
  { layer: "Backend", tech: "FastAPI, Uvicorn, Python async, Pydantic v2" },
  { layer: "AI", tech: "LangChain, LangChain-OpenAI, structured output / function calling" },
  { layer: "Database", tech: "PostgreSQL 16, SQLAlchemy 2 async, asyncpg, JSONB stage column" },
  { layer: "Auth", tech: "bcrypt, PyJWT, HttpOnly cookie sessions" },
  { layer: "Dev", tech: "Docker Compose (Postgres), .env for OPENAI_API_KEY / DB_URL" },
];

const CONTRACT_RULES = [
  "AI emits flags only — never x/y/width/fill/stroke/animation",
  "layoutMode trunk: BoxCreation + TextCreation + connections in teaching order",
  "layoutMode code-map: one CodeDisplay (text + portions) + linkedPortion BoxCreation per portion; connections []",
  "When user pastes code: max 80 lines; otherwise API returns a validation message",
  "For valid pasted code: CodeDisplay.text must match the snippet verbatim (pasted_code.py enforces)",
  "Frontend owns all spatial decisions: BOX_LAYOUT, codeMapLayout, themes, GSAP timing",
  "Three layers enforce contract: Pydantic schema → backend sanitizer → frontend role guards",
];

const PLANNED = [
  { area: "Code-map Phase 3", status: "Shipped", note: "Click-to-expand branches on explanation boxes" },
  { area: "Code-map Phase 4", status: "In progress", note: "Level-2 fan layout with anti-overlap spacing for detail branches" },
  { area: "Stickers", status: "In progress", note: "Custom SVG themes (anime, comic) replacing BoxSticker components" },
  { area: "History UI", status: "Not started", note: "answers table exists but no list/replay UI in frontend yet" },
];

function nodeMeta(id: string): FlowNodeMeta {
  return FLOW_NODES.find((n) => n.id === id) ?? { id, label: id, detail: "", layer: "" };
}

function FlowDiagram({
  selectedNode,
  onSelectNode,
}: {
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const theme = useHostTheme();
  const layout = computeDAGLayout({
    nodes: FLOW_NODES.map((n) => ({ id: n.id })),
    edges: FLOW_EDGES,
    direction: "horizontal",
    nodeWidth: 132,
    nodeHeight: 52,
    rankGap: 56,
    nodeGap: 16,
    padding: 20,
  });

  const selected = selectedNode ? nodeMeta(selectedNode) : null;

  return (
    <Stack gap={12}>
      <Row gap={8} align="center" wrap>
        <Text weight="medium">End-to-end data flow</Text>
        <Pill tone="info" size="sm">
          click a node
        </Pill>
      </Row>
      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${theme.stroke.secondary}`,
          borderRadius: 8,
          background: theme.bg.editor,
        }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          style={{ display: "block", minWidth: "100%" }}
          role="img"
          aria-label="Project VL data flow diagram"
        >
          {layout.edges.map((edge) => {
            const isSelected =
              selectedNode === edge.from || selectedNode === edge.to;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={edge.sourceX}
                y1={edge.sourceY}
                x2={edge.targetX}
                y2={edge.targetY}
                stroke={isSelected ? theme.accent.primary : theme.stroke.secondary}
                strokeWidth={isSelected ? 2 : 1.5}
                strokeDasharray={edge.isBackEdge ? "4 3" : undefined}
              />
            );
          })}
          {layout.nodes.map((node) => {
            const meta = nodeMeta(node.id);
            const active = selectedNode === node.id;
            return (
              <g
                key={node.id}
                onClick={() => onSelectNode(active ? null : node.id)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={132}
                  height={52}
                  rx={6}
                  fill={active ? theme.fill.secondary : theme.fill.tertiary}
                  stroke={active ? theme.accent.primary : theme.stroke.primary}
                  strokeWidth={active ? 2 : 1}
                />
                <text
                  x={node.x + 66}
                  y={node.y + 20}
                  textAnchor="middle"
                  fill={theme.text.primary}
                  fontSize={11}
                  fontWeight={600}
                >
                  {meta.label}
                </text>
                <text
                  x={node.x + 66}
                  y={node.y + 36}
                  textAnchor="middle"
                  fill={theme.text.tertiary}
                  fontSize={9}
                >
                  {meta.layer}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {selected ? (
        <Callout tone="info">
          <Stack gap={4}>
            <Text weight="medium">{selected.label}</Text>
            <Text>{selected.detail}</Text>
          </Stack>
        </Callout>
      ) : (
        <Text tone="tertiary">
          Trace a question from the browser through the AI pipeline to themed SVG
          rendering. Select any node for details.
        </Text>
      )}
    </Stack>
  );
}

function AppCard({
  app,
  active,
  onSelect,
}: {
  app: AppInfo;
  active: boolean;
  onSelect: () => void;
}) {
  const theme = useHostTheme();
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: "pointer",
        border: `1px solid ${active ? theme.accent.primary : theme.stroke.secondary}`,
        borderRadius: 8,
        padding: 16,
        background: active ? theme.fill.secondary : theme.bg.elevated,
      }}
    >
      <Stack gap={10}>
        <Row justify="space-between" align="center">
          <H3>{app.name}</H3>
          <Pill tone={active ? "info" : "neutral"} size="sm">
            {app.port}
          </Pill>
        </Row>
        <Text tone="tertiary">{app.path}</Text>
        <Text>{app.role}</Text>
        <Text tone="tertiary">{app.stack}</Text>
        <Text tone="tertiary">Entry: {app.entry}</Text>
        <Stack gap={4}>
          {app.highlights.map((h) => (
            <Text key={h} tone="tertiary">
              · {h}
            </Text>
          ))}
        </Stack>
      </Stack>
    </div>
  );
}

function ContractDiagram() {
  const theme = useHostTheme();
  const zones = [
    {
      title: "Zone A — Schema (shape)",
      file: "infographics_schema.py",
      owns: "What fields exist: BoxCreation, TextCreation, connections",
      forbids: "x, y, width, fill, stroke, animation, lines, explanation",
    },
    {
      title: "Zone B — Prompts (content)",
      file: "drawing_stage_prompts.py",
      owns: "What to write inside boxes, step order, final-answer placement",
      forbids: "Spatial hints, styling, coordinate math",
    },
    {
      title: "Zone C — Frontend (layout)",
      file: "boxCreation.tsx + themes/",
      owns: "Positions, sizes, fonts, colors, animation, stickers, hover",
      forbids: "Changing AI semantic content",
    },
  ];

  return (
    <Grid columns={3} gap={12}>
      {zones.map((z) => (
        <div
          key={z.title}
          style={{
            border: `1px solid ${theme.stroke.secondary}`,
            borderRadius: 8,
            padding: 14,
            background: theme.fill.tertiary,
          }}
        >
          <Stack gap={8}>
            <Text weight="medium">{z.title}</Text>
            <Pill tone="neutral" size="sm">
              {z.file}
            </Pill>
            <Stack gap={4}>
              <Text tone="tertiary">Owns</Text>
              <Text>{z.owns}</Text>
            </Stack>
            <Stack gap={4}>
              <Text tone="tertiary">Forbids</Text>
              <Text tone="tertiary">{z.forbids}</Text>
            </Stack>
          </Stack>
        </div>
      ))}
    </Grid>
  );
}

function VisualEngineMap() {
  const theme = useHostTheme();
  const boxes = [
    { label: "Stage.tsx", sub: "viewBox · theme bg · zoom · GSAP ref" },
    { label: "DrawingStage.tsx", sub: "dispatch trunk vs code-map" },
    { label: "CodeMapStage.tsx", sub: "code panel · highlights · explains" },
    { label: "codeMapLayout.ts", sub: "layout math · connector lanes" },
    { label: "codeDisplay.tsx", sub: "syntax HTML · portion highlights" },
    { label: "boxCreation.tsx", sub: "trunk row · sharp rects · stroke 2.5" },
    { label: "textCreation.tsx", sub: "code-title · objective · console" },
    { label: "drawingStageTimeline.ts", sub: "GSAP fades + line draw" },
    { label: "themes/default", sub: "sharp sticker · dark code panel" },
    { label: "themes/cyberpunk", sub: "neon HUD sticker" },
  ];

  return (
    <div
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 8,
        padding: 16,
        background: theme.bg.editor,
      }}
    >
      <Stack gap={12}>
        <Text weight="medium">visualEngine/ component tree</Text>
        <Callout tone="info">
          <Stack gap={4}>
            <Text weight="medium">Where code-map explanations are rendered</Text>
            <Text tone="tertiary">
              <Text weight="medium">objectConditions/codeMapExplanation.tsx</Text> draws the
              first-level explanation boxes and handles click-to-expand second branches.
              The CHECK branch can auto-generate iteration-by-iteration detail from a
              parsed <Text weight="medium">for (...)</Text> header.
            </Text>
          </Stack>
        </Callout>
        <Grid columns={4} gap={8}>
          {boxes.map((b) => (
            <div
              key={b.label}
              style={{
                border: `1px solid ${theme.stroke.primary}`,
                borderRadius: 6,
                padding: 10,
                background: theme.fill.quaternary,
              }}
            >
              <Stack gap={4}>
                <Text weight="medium">{b.label}</Text>
                <Text tone="tertiary">{b.sub}</Text>
              </Stack>
            </div>
          ))}
        </Grid>
      </Stack>
    </div>
  );
}

export default function ProjectVLMap() {
  const [selectedApp, setSelectedApp] = useCanvasState<AppId>("selectedApp", "frontend");
  const [selectedNode, setSelectedNode] = useCanvasState<string | null>("selectedNode", null);
  const activeApp = APPS.find((a) => a.id === selectedApp) ?? APPS[0];

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1200 }}>
      <Stack gap={8}>
        <H1>Project VL — System Map</H1>
        <Text tone="tertiary">
          Monorepo: Next.js frontend + FastAPI backend. Shared flag-driven
          DrawingStage contract — two layout modes: trunk (step row) and
          code-map (code panel + explanations).
        </Text>
        <Row gap={8} wrap>
          <Stat label="Apps" value="2" />
          <Stat label="Layout modes" value="2" tone="info" />
          <Stat label="Themes" value="2" />
          <Stat label="Render" value="SVG + GSAP" />
        </Row>
      </Stack>

      <Stack gap={12}>
        <H2>Applications</H2>
        <Grid columns={2} gap={12}>
          {APPS.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              active={selectedApp === app.id}
              onSelect={() => setSelectedApp(app.id)}
            />
          ))}
        </Grid>
        <Callout tone="info">
          <Text>
            Selected: <Text weight="medium">{activeApp.name}</Text> — {activeApp.role}
          </Text>
        </Callout>
      </Stack>

      <Card>
        <CardHeader trailing="User question → AI → themed diagram">Data flow</CardHeader>
        <CardBody>
          <FlowDiagram selectedNode={selectedNode} onSelectNode={setSelectedNode} />
        </CardBody>
      </Card>

      <Stack gap={12}>
        <H2>Flag-driven contract (three zones)</H2>
        <Text tone="tertiary">
          The core architectural decision: AI decides what to teach and in what order;
          the frontend decides how it looks and where it sits.
        </Text>
        <ContractDiagram />
        <Stack gap={6}>
          {CONTRACT_RULES.map((rule) => (
            <Text key={rule} tone="tertiary">
              · {rule}
            </Text>
          ))}
        </Stack>
      </Stack>

      <Stack gap={12}>
        <H2>Visual engine</H2>
        <VisualEngineMap />
        <Table
          headers={["File", "Responsibility"]}
          rows={VISUAL_ENGINE_FILES.map((f) => [f.file, f.role])}
        />
      </Stack>

      <CollapsibleSection
        title="Backend AI pipeline"
        trailing="ai_services/"
      >
        <Stack gap={12}>
          <Table
            headers={["File", "Role"]}
            rows={AI_PIPELINE_FILES.map((f) => [f.file, f.role])}
          />
          <Callout tone="neutral">
            <Text tone="tertiary">
              Sample endpoints: GET /api/answers/samples/while-loop · GET
              /api/answers/samples/two-sum (code-map). Main: POST /api/answers/
            </Text>
          </Callout>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        title="Tech stack"
        trailing="package.json + requirements.txt"
      >
        <Table
          headers={["Layer", "Technologies"]}
          rows={TECH_STACK.map((t) => [t.layer, t.tech])}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Database & persistence" trailing="PostgreSQL">
        <Stack gap={10}>
          <Grid columns={2} gap={12}>
            <Stack gap={6}>
              <Text weight="medium">Stored in DB</Text>
              <Text tone="tertiary">answers.stage — full DrawingStage JSONB per prompt</Text>
              <Text tone="tertiary">answers.answer — derived summary text (box snippets joined)</Text>
              <Text tone="tertiary">users + tokens — registration and JWT sessions</Text>
            </Stack>
            <Stack gap={6}>
              <Text weight="medium">Client-side only</Text>
              <Text tone="tertiary">Learning preferences — localStorage</Text>
              <Text tone="tertiary">Theme selection — React state in VisualPage (session)</Text>
              <Text tone="tertiary">Zoom level — React state in VisualPage (session)</Text>
            </Stack>
          </Grid>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection title="Roadmap (planned)" trailing="design notes">
        <Table
          headers={["Area", "Status", "Notes"]}
          rows={PLANNED.map((p) => [p.area, p.status, p.note])}
        />
      </CollapsibleSection>

      <Callout tone="neutral">
        <Text tone="tertiary">
          This canvas is documentation only — it does not auto-sync with code changes.
          Ask the agent to refresh it after major architecture updates. ·
          Reference samples: GET /api/answers/samples/while-loop ·
          GET /api/answers/samples/two-sum ·
          Frontend types: project-vl/src/types/infographics.ts ·
          Backend schema: project_vl_be/app/schemas/infographics_schema.py
        </Text>
      </Callout>
    </Stack>
  );
}
