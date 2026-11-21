import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { toSimpleQuestions } from "@/lib/llm";
import { FieldBriefSchema, LangSchema } from "@/lib/types";

const Body = z.object({ fields: z.array(FieldBriefSchema).max(80), lang: LangSchema });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`questions:${ip}`, 30, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many questions requests. Please wait a minute." }, { status: 429 });
    }

    const { fields, lang } = Body.parse(await req.json());
    return Response.json(await toSimpleQuestions(fields, lang));
  } catch (err) {
    return errorResponse(err);
  }
}
