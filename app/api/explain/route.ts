import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { explainTerm } from "@/lib/llm";
import { LangSchema } from "@/lib/types";

const Body = z.object({ term: z.string().min(1).max(200), context: z.string().max(500), lang: LangSchema });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`explain:${ip}`, 30, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many explain requests. Please wait a minute." }, { status: 429 });
    }

    const { term, context, lang } = Body.parse(await req.json());
    return Response.json(await explainTerm(term, context, lang));
  } catch (err) {
    return errorResponse(err);
  }
}
