import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractFields } from "@/lib/llm";

const Body = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("acro"),
    fields: z
      .array(
        z.object({
          name: z.string().max(200),
          kind: z.string().max(20),
          options: z.array(z.string().max(100)).max(50).nullable(),
          nearby: z.string().max(300),
        }),
      )
      .max(150),
    text: z.string().max(20000),
  }),
  z.object({
    mode: z.literal("text"),
    lines: z.array(z.object({ id: z.string().max(20), text: z.string().max(500) })).max(800),
  }),
]);

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const limit = checkRateLimit(`extract:${ip}`, 20, 60 * 1000);
    if (!limit.ok) {
      return Response.json({ error: "Too many document extraction requests. Please wait a minute." }, { status: 429 });
    }

    const body = Body.parse(await req.json());
    return Response.json(await extractFields(body));
  } catch (err) {
    return errorResponse(err);
  }
}
