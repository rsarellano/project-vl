import type { InfographicBlueprint } from "@/types/infographics";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type AnswerResponse = {
  id: string;
  prompt: string;
  answer: string;
  blueprint: InfographicBlueprint | null;
  created_at: string;
};

export async function createAnswer(prompt: string): Promise<AnswerResponse> {
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = (await res.json()) as { detail?: unknown };
      if (typeof err.detail === "string") detail = err.detail;
      else if (err.detail != null) detail = JSON.stringify(err.detail);
    } catch {
      const text = await res.text();
      if (text) detail = text;
    }
    throw new Error(detail);
  }

  return res.json() as Promise<AnswerResponse>;
}
