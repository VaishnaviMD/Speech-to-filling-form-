import "server-only";
import type { z } from "zod";

const BASE = "https://api.groq.com/openai/v1";

export const LLM_MODEL = process.env.GROQ_LLM_MODEL || "openai/gpt-oss-120b";
export const STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3";

// Models that support strict json_schema decoding on Groq. Others fall back to json_object mode.
const STRICT_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "meta-models/muse-spark-open",
]);

export class UpstreamError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

function key() {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new UpstreamError("GROQ_API_KEY is not set on the server.", 500);
  return k;
}

export async function chatJSON<T>(opts: {
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  zod: z.ZodType<T>;
  temperature?: number;
}): Promise<T> {
  const strict = STRICT_MODELS.has(LLM_MODEL);
  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    temperature: opts.temperature ?? 0.2,
    messages: [
      { role: "system", content: opts.system + (strict ? "" : "\nRespond with a single JSON object only.") },
      { role: "user", content: opts.user },
    ],
    response_format: strict
      ? { type: "json_schema", json_schema: { name: opts.schemaName, strict: true, schema: opts.jsonSchema } }
      : { type: "json_object" },
  };
  if (LLM_MODEL.startsWith("openai/gpt-oss")) body.reasoning_effort = "low";

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      lastErr = new UpstreamError(`LLM request failed (${res.status}): ${text.slice(0, 300)}`, res.status === 429 ? 429 : 502);
      if (res.status === 429 || res.status >= 500) continue;
      throw lastErr;
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = opts.zod.safeParse(JSON.parse(content));
      if (parsed.success) return parsed.data;
      lastErr = new UpstreamError(`LLM returned invalid shape: ${parsed.error.message.slice(0, 300)}`);
    } catch {
      lastErr = new UpstreamError("LLM returned non-JSON output.");
    }
  }
  throw lastErr;
}

export async function transcribe(audio: Blob, filename: string, language?: string, prompt?: string) {
  const fd = new FormData();
  fd.append("file", audio, filename);
  fd.append("model", STT_MODEL);
  fd.append("response_format", "json");
  fd.append("temperature", "0");
  if (language) fd.append("language", language);
  if (prompt) fd.append("prompt", prompt);
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new UpstreamError(`Transcription failed (${res.status}): ${text.slice(0, 300)}`, res.status === 429 ? 429 : 502);
  }
  const data = await res.json();
  return String(data?.text ?? "").trim();
}
