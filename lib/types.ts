import { z } from "zod";

export const LANGS = [
  "en",
  "hi",
  "hinglish",
  "kn",
  "mr",
  "ta",
  "te",
  "bn",
  "gu",
] as const;
export type Lang = (typeof LANGS)[number];

export type FormMode = "visual" | "voice" | "conversational";

export interface FormEvaluationIssue {
  fieldId: string;
  label: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface FormEvaluationResult {
  valid: boolean;
  score: number; // 0 to 100
  summary: string;
  issues: FormEvaluationIssue[];
  say: string;
}

export interface OrgFormDefinition {
  id: string;
  userId: string;
  title: string;
  description: string;
  fields: ExtractedField[];
  translations: Partial<Record<Lang, Record<string, string>>>;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
}

export const FIELD_TYPES = [
  "text",
  "name",
  "date",
  "phone",
  "email",
  "number",
  "pincode",
  "aadhaar",
  "ifsc",
  "account",
  "address",
  "choice",
  "yesno",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// What the LLM returns for each field it finds in a form.
export const ExtractedFieldSchema = z.object({
  id: z.string().min(1),
  ref: z.string().min(1), // AcroForm field name, or a text line id like "p1-L4"
  label: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  format: z.string().nullable(),
  required: z.boolean(),
  options: z.array(z.string()).nullable(),
});
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

export const ExtractResultSchema = z.object({
  title: z.string(),
  fields: z.array(ExtractedFieldSchema),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

// Where a value gets written in the PDF.
export type Placement =
  | { kind: "acro"; name: string; acroKind: AcroKind }
  | { kind: "overlay"; page: number; x: number; y: number; size: number };

export type AcroKind = "text" | "checkbox" | "radio" | "dropdown";

export type Field = ExtractedField & { placement: Placement };

export const QuestionsResultSchema = z.object({
  questions: z.array(z.object({ id: z.string(), question: z.string().min(1) })),
});
export type QuestionsResult = z.infer<typeof QuestionsResultSchema>;

export const NormalizeResultSchema = z.object({
  status: z.enum(["ok", "clarify", "skip"]),
  value: z.string().nullable(),
  say: z.string(),
});
export type NormalizeResult = z.infer<typeof NormalizeResultSchema>;

export const ExplainResultSchema = z.object({
  explanation: z.string().min(1),
});
export type ExplainResult = z.infer<typeof ExplainResultSchema>;

// Compact field description sent from the browser to the LLM routes.
export const FieldBriefSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(FIELD_TYPES),
  format: z.string().nullable(),
  required: z.boolean(),
  options: z.array(z.string()).nullable(),
});
export type FieldBrief = z.infer<typeof FieldBriefSchema>;

export const LangSchema = z.enum(LANGS);

export type ExtractInput =
  | { mode: "acro"; fields: { name: string; kind: string; options: string[] | null; nearby: string }[]; text: string }
  | { mode: "text"; lines: { id: string; text: string }[] };
