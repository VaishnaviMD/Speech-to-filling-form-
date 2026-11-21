import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { normalizeAnswer } from "@/lib/llm";
import { FieldBriefSchema, LangSchema } from "@/lib/types";

const Body = z.object({
  field: FieldBriefSchema,
  answer: z.string().min(1).max(1000),
  lang: LangSchema,
  today: z.string().max(20),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`normalize:${ip}`, 60, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many normalize requests. Please wait a minute." }, { status: 429 });
    }

    const { field, answer, lang, today } = Body.parse(await req.json());
    return Response.json(await normalizeAnswer(field, answer, lang, today));
  } catch (err) {
    return errorResponse(err);
  }
}
