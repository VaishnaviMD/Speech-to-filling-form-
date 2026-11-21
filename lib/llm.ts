import "server-only";
import { chatJSON } from "./groq";
import {
  ExplainResultSchema,
  ExtractResultSchema,
  FIELD_TYPES,
  NormalizeResultSchema,
  QuestionsResultSchema,
  type ExtractInput,
  type FieldBrief,
  type Lang,
} from "./types";

const LANG_NAME: Record<Lang, string> = {
  en: "simple English (Indian English is fine)",
  hi: "simple, everyday Hindi in Devanagari script (avoid formal/Sanskritised words)",
  hinglish: "Hinglish: conversational Hindi written in Roman (Latin) script, mixing common English words",
  kn: "simple, everyday Kannada in Kannada script (avoid overly formal words)",
  mr: "simple, everyday Marathi in Devanagari script",
  ta: "simple, everyday Tamil in Tamil script",
  te: "simple, everyday Telugu in Telugu script",
  bn: "simple, everyday Bengali in Bengali script",
  gu: "simple, everyday Gujarati in Gujarati script",
};

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const extractJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "fields"],
  properties: {
    title: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "ref", "label", "type", "format", "required", "options"],
        properties: {
          id: { type: "string" },
          ref: { type: "string" },
          label: { type: "string" },
          type: { type: "string", enum: [...FIELD_TYPES] },
          format: nullable({ type: "string" }),
          required: { type: "boolean" },
          options: nullable({ type: "array", items: { type: "string" } }),
        },
      },
    },
  },
};

// 1. extractFields: PDF structure -> list of fillable fields
export function extractFields(input: ExtractInput) {
  const system = `You read government, bank and scholarship application forms (often Indian) and list the fields a person must fill.
For each field return:
- id: short snake_case id, unique.
- ref: ${input.mode === "acro" ? "the exact AcroForm field name given to you" : "the id of the text line that contains the field's label (e.g. p1-L4)"}.
- label: the field's label as a human would read it, cleaned up (no underscores, colons or dots).
- type: one of ${FIELD_TYPES.join(", ")}. Use "name" for person names, "aadhaar" for 12-digit Aadhaar, "ifsc" for bank IFSC, "account" for bank account numbers, "pincode" for 6-digit PIN, "yesno" for checkboxes, "choice" when there are fixed options.
- format: expected format if any, e.g. "DD/MM/YYYY", "10 digits", otherwise null.
- required: true unless the form marks it optional. Signature, photo, and "for office use only" fields must be skipped entirely.
- options: list of allowed values for choice fields, otherwise null.
Keep the order in which fields appear on the form. title is the form's name.`;

  const user =
    input.mode === "acro"
      ? `The PDF has these AcroForm fields (name | kind | options | nearby printed text):
${input.fields.map((f) => `${f.name} | ${f.kind} | ${f.options?.join("/") ?? "-"} | ${f.nearby || "-"}`).join("\n")}

Full page text for context:
${input.text.slice(0, 8000)}`
      : `This PDF has no fillable fields. Here is its text, one line per row as "lineId: text":
${input.lines
  .map((l) => `${l.id}: ${l.text}`)
  .join("\n")
  .slice(0, 12000)}

Only include lines that are labels for something the applicant writes (blanks like ____ or ..... usually follow).`;

  return chatJSON({ system, user, schemaName: "form_fields", jsonSchema: extractJsonSchema, zod: ExtractResultSchema, temperature: 0 });
}

// 2. toSimpleQuestion (batched): field -> friendly spoken question
export function toSimpleQuestions(fields: FieldBrief[], lang: Lang) {
  const system = `You help elderly and low-literacy people fill forms by voice. Rewrite each form field as ONE short, warm, spoken question in ${LANG_NAME[lang]}.
Rules: under 15 words; no jargon (explain it in the question instead, e.g. IFSC -> "the bank code printed on your passbook"); say how to answer if format matters (e.g. "day, month and year"); for choice fields mention the options; never ask two things at once.`;
  const user = `Fields:\n${JSON.stringify(fields)}`;
  return chatJSON({
    system,
    user,
    schemaName: "questions",
    zod: QuestionsResultSchema,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "question"],
            properties: { id: { type: "string" }, question: { type: "string" } },
          },
        },
      },
    },
    temperature: 0.3,
  });
}

// 3. normalizeAnswer: spoken answer -> formatted value, or a clarifying question
export function normalizeAnswer(field: FieldBrief, answer: string, lang: Lang, today: string) {
  const system = `You turn a person's spoken answer into the exact value to write on a paper form.
Today is ${today}.
Rules:
- The value is written on an English form: ALWAYS output it in Latin script. Transliterate Hindi/Kannada names/places (e.g. "राम कुमार" / "ರಾಮೇಶ್ ಕುಮಾರ್" -> "Ram Kumar" / "Ramesh Kumar"), and use Title Case for names/addresses.
- CRITICAL: Strip all conversational sentence frames and filler words. Extract ONLY the entity itself.
  Examples of what to clean:
  * "My name is Vaishnavi" -> output "Vaishnavi" (NEVER "My name is Vaishnavi" or "My Name Is Vaishnavi")
  * "Mera naam Ramesh Kumar hai" -> output "Ramesh Kumar"
  * "Nanna hesaru Suresh" -> output "Suresh"
  * "I am Anita" -> output "Anita"
  * "It is 9876543210" -> output "9876543210"
  * "My date of birth is 12 March 1960" -> output "12/03/1960"
  NEVER include words like "My name is", "I am", "Mera naam", or "Nanna hesaru" in value.
- Convert spoken numbers to digits ("नौ आठ सात..." / "nine eight seven" -> "987..."). Remove spaces inside phone, Aadhaar, account and PIN numbers.
- Dates -> DD/MM/YYYY unless the field format says otherwise. If they give age instead of birth date, ask for the date.
- phone: 10 digits. pincode: 6 digits. aadhaar: 12 digits. ifsc: 11 characters, uppercase. yesno: "Yes" or "No". choice: one of the options exactly.
- If the answer is unclear, missing parts, or does not fit, return status "clarify" with value null and a short, kind follow-up question in "say".
- If they clearly say they don't have it / want to skip AND the field is not required, return status "skip".
- On success return status "ok" and in "say" a very short confirmation that repeats the value naturally (e.g. "Got it, 12 March 1958.").
"say" must be in ${LANG_NAME[lang]}.`;
  const user = `Field: ${JSON.stringify(field)}\nSpoken answer: """${answer.slice(0, 600)}"""`;
  return chatJSON({
    system,
    user,
    schemaName: "normalized_answer",
    zod: NormalizeResultSchema,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "value", "say"],
      properties: {
        status: { type: "string", enum: ["ok", "clarify", "skip"] },
        value: nullable({ type: "string" }),
        say: { type: "string" },
      },
    },
    temperature: 0,
  });
}

// 4. explainTerm: jargon -> one plain sentence
export function explainTerm(term: string, context: string, lang: Lang) {
  const system = `Explain form jargon to an elderly person with little schooling, in ${LANG_NAME[lang]}.
One or two short sentences. Say what it is and where they can find it (e.g. passbook, Aadhaar card, ration card). No English jargon unless it is the common word people use.`;
  const user = `Term: ${term.slice(0, 200)}\nForm context: ${context.slice(0, 300)}`;
  return chatJSON({
    system,
    user,
    schemaName: "explanation",
    zod: ExplainResultSchema,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["explanation"],
      properties: { explanation: { type: "string" } },
    },
    temperature: 0.3,
  });
}
