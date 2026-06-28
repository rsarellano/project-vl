export const USAGE_CONTEXTS = [
  { id: "personal", label: "Personal", description: "Learning for yourself and everyday curiosity" },
  { id: "hobby", label: "Hobby", description: "Side projects, creative interests, and fun deep dives" },
  { id: "professional", label: "Professional", description: "Work skills, interviews, on-the-job learning" },
  { id: "business", label: "Business", description: "Teams, operations, and decision-making" },
  { id: "education", label: "Education", description: "School, courses, or teaching others" },
] as const;

export const SUBJECT_DOMAINS = [
  { id: "math", label: "Math", description: "Algebra, geometry, word problems" },
  { id: "science", label: "Science", description: "Physics, chemistry, biology concepts" },
  { id: "programming", label: "Programming", description: "Code, algorithms, data structures" },
  { id: "language", label: "Language", description: "Grammar, writing, literature" },
  { id: "history", label: "History & social studies", description: "Events, timelines, civics" },
  { id: "business_studies", label: "Business & finance", description: "Economics, accounting, strategy" },
  { id: "other", label: "Other / mixed", description: "General topics across subjects" },
] as const;

export type UsageContextId = (typeof USAGE_CONTEXTS)[number]["id"];
export type SubjectDomainId = (typeof SUBJECT_DOMAINS)[number]["id"];

export type UserLearningPreferences = {
  usageContext: UsageContextId;
  subjectDomain: SubjectDomainId;
};


const STORAGE_KEY = "project-vl-learning-preferences";

const USAGE_IDS = new Set(USAGE_CONTEXTS.map((u) => u.id));
const SUBJECT_IDS = new Set(SUBJECT_DOMAINS.map((s) => s.id));

export function getLearningPreferences(): UserLearningPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLearningPreferences;
    if (
      !parsed.usageContext ||
      !parsed.subjectDomain ||
      !USAGE_IDS.has(parsed.usageContext) ||
      !SUBJECT_IDS.has(parsed.subjectDomain)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLearningPreferences(prefs: UserLearningPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function clearLearningPreferences(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatPreferencesLabel(prefs: UserLearningPreferences): string {
  const usage = USAGE_CONTEXTS.find((u) => u.id === prefs.usageContext)?.label ?? prefs.usageContext;
  const subject = SUBJECT_DOMAINS.find((s) => s.id === prefs.subjectDomain)?.label ?? prefs.subjectDomain;
  return `${usage} · ${subject}`;
}
