import type { DrawingStage } from "@/types/infographics";
import type { UserLearningPreferences } from "@/lib/userPreferences";

export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env && env.trim()) {
    return env.replace(/\/$/, "");
  }
  return "http://localhost:8000";
}

export type AnswerResponse = {
  id: string;
  prompt: string;
  answer: string;
  question_type?: string | null;
  blueprint?: unknown;
  stage?: DrawingStage | null;
  created_at: string;
};

export async function parseFastAPIError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    const d = body.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((item) => (item as { msg?: string }).msg ?? "")
        .filter(Boolean)
        .join(", ");
    }
    return res.statusText || "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

/** POST `/api/answers/` — generate a flag-driven DrawingStage from a prompt. */
export async function createAnswer(
  prompt: string,
  preferences?: UserLearningPreferences | null,
): Promise<AnswerResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/answers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      usage_context: preferences?.usageContext ?? null,
      subject_domain: preferences?.subjectDomain ?? null,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseFastAPIError(res));
  }

  return res.json() as Promise<AnswerResponse>;
}

/** GET `/api/answers/samples/while-loop` — static trunk DrawingStage sample. */
export async function fetchWhileLoopSampleStage(): Promise<DrawingStage> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/answers/samples/while-loop`);
  if (!res.ok) {
    throw new Error(await parseFastAPIError(res));
  }
  return res.json() as Promise<DrawingStage>;
}

/** GET `/api/answers/samples/two-sum` — static code-map DrawingStage sample. */
export async function fetchTwoSumSampleStage(): Promise<DrawingStage> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/answers/samples/two-sum`);
  if (!res.ok) {
    throw new Error(await parseFastAPIError(res));
  }
  return res.json() as Promise<DrawingStage>;
}
