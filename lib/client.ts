import type { ExplainResult, ExtractInput, ExtractResult, Field, FieldBrief, Lang, NormalizeResult, QuestionsResult } from "./types";

async function post<T>(url: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const brief = (f: Field): FieldBrief => ({
  id: f.id,
  label: f.label,
  type: f.type,
  format: f.format,
  required: f.required,
  options: f.options,
});

export const api = {
  extract: (input: ExtractInput) => post<ExtractResult>("/api/extract", input, 60000),
  questions: (fields: FieldBrief[], lang: Lang) => post<QuestionsResult>("/api/questions", { fields, lang }, 45000),
  normalize: (field: FieldBrief, answer: string, lang: Lang) =>
    post<NormalizeResult>("/api/normalize", {
      field,
      answer,
      lang,
      today: new Date().toLocaleDateString("en-GB"),
    }),
  explain: (term: string, context: string, lang: Lang) => post<ExplainResult>("/api/explain", { term, context, lang }),
  async transcribe(audio: Blob, filename: string, lang: Lang): Promise<string> {
    const fd = new FormData();
    fd.append("audio", audio, filename);
    fd.append("lang", lang);
    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Transcription failed (${res.status})`);
    return String(data.text ?? "");
  },
};
