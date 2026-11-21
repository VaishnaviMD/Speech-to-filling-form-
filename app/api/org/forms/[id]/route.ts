import { cookies } from "next/headers";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth/service";
import { deleteOrgForm, getOrgForm, updateOrgForm } from "@/lib/org/service";
import { ExtractedFieldSchema, LangSchema } from "@/lib/types";

const UpdateBody = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).default(""),
  fields: z.array(ExtractedFieldSchema).min(1).max(60),
  translations: z.record(LangSchema, z.record(z.string(), z.string())).optional(),
});

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const form = getOrgForm(id);
    if (!form || !form.isPublished) {
      return Response.json({ error: "Form not found or unpublished." }, { status: 404 });
    }
    return Response.json({ form });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
    const user = getSessionUser(token);
    if (!user) {
      return Response.json({ error: "Session expired." }, { status: 401 });
    }

    const form = getOrgForm(id);
    if (!form || form.userId !== user.id) {
      return Response.json({ error: "Form not found or forbidden." }, { status: 403 });
    }

    const json = await req.json();
    const data = UpdateBody.parse(json);

    updateOrgForm(id, user.id, data);
    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
    const user = getSessionUser(token);
    if (!user) {
      return Response.json({ error: "Session expired." }, { status: 401 });
    }

    const form = getOrgForm(id);
    if (!form || form.userId !== user.id) {
      return Response.json({ error: "Form not found or forbidden." }, { status: 403 });
    }

    deleteOrgForm(id, user.id);
    return Response.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
