import { cookies } from "next/headers";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth/service";
import { createOrgForm, listOrgForms } from "@/lib/org/service";
import { ExtractedFieldSchema, LangSchema } from "@/lib/types";

const CreateBody = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).default(""),
  fields: z.array(ExtractedFieldSchema).min(1).max(60),
  translations: z.record(LangSchema, z.record(z.string(), z.string())).optional(),
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return Response.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const user = getSessionUser(token);
    if (!user) {
      return Response.json({ error: "Session expired." }, { status: 401 });
    }

    const forms = listOrgForms(user.id);
    return Response.json({ forms });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return Response.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const user = getSessionUser(token);
    if (!user) {
      return Response.json({ error: "Session expired." }, { status: 401 });
    }

    const json = await req.json();
    const data = CreateBody.parse(json);

    const form = createOrgForm({
      userId: user.id,
      title: data.title,
      description: data.description,
      fields: data.fields,
      translations: data.translations,
    });

    return Response.json({ form }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
