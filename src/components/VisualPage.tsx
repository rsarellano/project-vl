"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from "react";
import { setDrawingStageEndState } from "@/components/visualEngine/drawingStageTimeline";
import { Stage, type StageHandle } from "@/components/visualEngine/Stage";
import { ThemeSelect } from "@/components/visualEngine/ThemeSelect";
import { getTheme, type ThemeName } from "@/components/visualEngine/themes";
import { Timeline } from "@/components/visualEngine/Timeline";
import { getTwoSumCodeMapStage } from "@/components/visualEngine/samples/twoSumCodeMapStage";
import MathAskInput from "@/components/MathAskInput";
import MathPreview from "@/components/MathPreview";
import { createAnswer, fetchTwoSumSampleStage } from "@/lib/api";
import type { UserLearningPreferences } from "@/lib/userPreferences";
import type { DrawingStage } from "@/types/infographics";

type VisualPageProps = {
  preferences?: UserLearningPreferences | null;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
};

const DIAGRAM_ZOOM_MIN = 0.5;
const DIAGRAM_ZOOM_MAX = 3;
const DIAGRAM_ZOOM_STEP = 0.15;
const WORKSPACE_PANEL_WIDTH_PX = 420;
const WORKSPACE_PANEL_COLLAPSED_KEY = "vl-workspace-panel-collapsed";

function PanelToggleIcon({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden className="h-4 w-4">
        <path
          d="M6 3.5 10.5 8 6 12.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="h-4 w-4">
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VisualPage({
  preferences,
  theme,
  onThemeChange,
}: VisualPageProps) {
  const [question, setQuestion] = useState("");
  const [equationImage, setEquationImage] = useState<string | null>(null);
  const [extractedEquation, setExtractedEquation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawingStage, setDrawingStage] = useState<DrawingStage | null>(null);
  const [questionType, setQuestionType] = useState<string | null>(null);
  const [diagramZoom, setDiagramZoom] = useState(1);
  const [playKey, setPlayKey] = useState(0);
  const [narrationMs, setNarrationMs] = useState(0);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const stageRef = useRef<StageHandle>(null);
  const diagramScrollRef = useRef<HTMLDivElement>(null);
  const themeConfig = getTheme(theme);
  const mathSkin = themeConfig.mathSkin;
  const mathChalk = themeConfig.mathChalk;
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(null);

  useEffect(() => {
    try {
      setPanelCollapsed(localStorage.getItem(WORKSPACE_PANEL_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_PANEL_COLLAPSED_KEY, panelCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [panelCollapsed]);

  useEffect(() => {
    const el = diagramScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      setDiagramZoom((z) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const next =
          Math.round(
            Math.min(DIAGRAM_ZOOM_MAX, Math.max(DIAGRAM_ZOOM_MIN, z * factor)) *
              100,
          ) / 100;
        if (next !== z) {
          const ratio = next / z;
          pendingScrollRef.current = {
            left: (el.scrollLeft + pointerX) * ratio - pointerX,
            top: (el.scrollTop + pointerY) * ratio - pointerY,
          };
        }
        return next;
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [drawingStage]);

  useLayoutEffect(() => {
    const el = diagramScrollRef.current;
    const pending = pendingScrollRef.current;
    if (el && pending) {
      el.scrollLeft = pending.left;
      el.scrollTop = pending.top;
      pendingScrollRef.current = null;
    }
  }, [diagramZoom]);

  function handleEquationPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (!file) continue;

      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setEquationImage(reader.result);
          setExtractedEquation(null);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
      return;
    }
  }

  function clearEquationImage() {
    setEquationImage(null);
    setExtractedEquation(null);
  }

  const canSubmit = Boolean(question.trim() || equationImage) && !loading;

  async function handleAsk(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const data = await createAnswer(question.trim(), {
        preferences,
        equationImage,
      });
      if (!data.stage) {
        throw new Error("Server returned no drawing stage.");
      }
      setDrawingStage(data.stage ?? null);
      setQuestionType(data.question_type ?? null);
      setExtractedEquation(data.extracted_equation ?? null);
      if (data.extracted_equation && !question.trim()) {
        setQuestion(data.extracted_equation);
      }
      setEquationImage(null);
      setDiagramZoom(1);
      setPlayKey((k) => k + 1);
      setNarrationMs(0);
    } catch (err) {
      setQuestionType(null);
      setExtractedEquation(null);
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTwoSumSample() {
    setError(null);
    setLoading(true);
    try {
      let stage: DrawingStage;
      try {
        stage = await fetchTwoSumSampleStage();
      } catch {
        stage = getTwoSumCodeMapStage();
      }
      setQuestion("Two Sum — hash map approach (code map sample)");
      setQuestionType("coding.code_solution (sample)");
      setDrawingStage(stage);
      setDiagramZoom(1);
      setPlayKey((k) => k + 1);
      setNarrationMs(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample.");
    } finally {
      setLoading(false);
    }
  }

  const replayDiagram = () => {
    stageRef.current?.replay();
  };

  const downloadSvg = () => {
    const svg = document.getElementById("drawing-stage-svg") as SVGSVGElement | null;
    if (!svg || !drawingStage) return;

    setDrawingStageEndState(svg, drawingStage);

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing-stage.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const togglePanel = () => setPanelCollapsed((collapsed) => !collapsed);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-slate-100 lg:flex-row">
      {/* Left: ask form + playback controls */}
      <aside
        className={`flex shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-white transition-[width,max-height,opacity] duration-300 ease-in-out lg:border-b-0 lg:border-r ${
          panelCollapsed
            ? "max-h-0 border-b-0 opacity-0 lg:max-h-none lg:w-0 lg:border-r-0 lg:opacity-100"
            : "w-full max-h-[2400px] opacity-100 lg:w-[420px]"
        }`}
        aria-hidden={panelCollapsed}
      >
        <div className="flex w-full min-w-[min(100%,420px)] flex-col lg:w-[420px]">
        <form
          onSubmit={handleAsk}
          className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4"
        >
          <label className="text-sm font-medium text-slate-700" htmlFor="question">
            Ask a question
          </label>
          <MathAskInput
            id="question"
            value={question}
            onChange={setQuestion}
            onPaste={handleEquationPaste}
            rows={6}
            mathSkin={mathSkin}
            chalk={mathChalk}
            placeholder="Type a question, paste code, or paste an equation image (Ctrl+V)…"
          />
          {equationImage ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600">
                  Pasted equation image
                </p>
                <button
                  type="button"
                  onClick={clearEquationImage}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Remove
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equationImage}
                alt="Pasted equation"
                className="max-h-36 w-full rounded-lg border border-slate-200 bg-white object-contain"
              />
              <p className="mt-2 text-xs text-slate-500">
                The AI will read this equation when you generate the diagram.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate diagram"}
            </button>
            <button
              type="button"
              onClick={loadTwoSumSample}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            >
              Load Two Sum sample
            </button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {extractedEquation ? (
            <MathPreview
              text={extractedEquation}
              label="Read from image"
              mathSkin={mathSkin}
              chalk={mathChalk}
            />
          ) : null}
          {questionType ? (
            <p className="text-xs text-slate-500">Classifier: {questionType}</p>
          ) : null}
        </form>

        <div className="flex flex-col gap-3 px-4 py-4">
          <ThemeSelect
            id="ask-form-theme"
            value={theme}
            onChange={onThemeChange}
          />
          {drawingStage ? (
            <Timeline
              timeMs={narrationMs}
              onReplay={replayDiagram}
              onDownloadSvg={downloadSvg}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Generate a diagram or load the Two Sum sample to preview the visual
              engine.
            </p>
          )}
        </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={togglePanel}
        className={`absolute top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-slate-200 bg-white text-slate-600 shadow-md transition-[left,background-color,color,box-shadow] duration-300 ease-in-out hover:bg-blue-50 hover:text-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 lg:flex ${
          panelCollapsed ? "left-0 h-14 w-8" : "h-12 w-7"
        }`}
        style={panelCollapsed ? undefined : { left: WORKSPACE_PANEL_WIDTH_PX }}
        aria-label={panelCollapsed ? "Show workspace panel" : "Hide workspace panel"}
        aria-expanded={!panelCollapsed}
        title={panelCollapsed ? "Show panel" : "Hide panel"}
      >
        <PanelToggleIcon collapsed={panelCollapsed} />
      </button>

      {/* Right: drawing stage */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={togglePanel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
            aria-expanded={!panelCollapsed}
          >
            <PanelToggleIcon collapsed={panelCollapsed} />
            {panelCollapsed ? "Show panel" : "Hide panel"}
          </button>

          {drawingStage ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <ThemeSelect
                id="diagram-toolbar-theme"
                value={theme}
                onChange={onThemeChange}
              />
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
              <button
                type="button"
                onClick={() =>
                  setDiagramZoom((z) =>
                    Math.max(
                      DIAGRAM_ZOOM_MIN,
                      Math.round((z - DIAGRAM_ZOOM_STEP) * 100) / 100,
                    ),
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="min-w-12 text-center text-xs tabular-nums text-slate-600">
                {Math.round(diagramZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setDiagramZoom((z) =>
                    Math.min(
                      DIAGRAM_ZOOM_MAX,
                      Math.round((z + DIAGRAM_ZOOM_STEP) * 100) / 100,
                    ),
                  )
                }
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          ) : null}
        </div>

        {drawingStage ? (
          <>
            <div
              ref={diagramScrollRef}
              className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50/80 shadow-inner"
            >
              <Stage
                ref={stageRef}
                drawingStage={drawingStage}
                playKey={playKey}
                onTimeUpdate={setNarrationMs}
                theme={theme}
                zoom={diagramZoom}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
            Your diagram will appear here after you generate or load a sample.
          </div>
        )}
      </div>
    </div>
  );
}
