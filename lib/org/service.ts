import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/auth/db";
import type { ExtractedField, Lang, OrgFormDefinition } from "@/lib/types";

interface CreateFormInput {
  userId: string;
  title: string;
  description: string;
  fields: ExtractedField[];
  translations?: Partial<Record<Lang, Record<string, string>>>;
}

export function createOrgForm(input: CreateFormInput): OrgFormDefinition {
  const db = getDb();
  const id = "form_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO org_forms (id, user_id, title, description, fields_json, translations_json, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  stmt.run(
    id,
    input.userId,
    input.title.trim(),
    input.description.trim(),
    JSON.stringify(input.fields),
    JSON.stringify(input.translations ?? {}),
    now,
    now
  );

  return {
    id,
    userId: input.userId,
    title: input.title.trim(),
    description: input.description.trim(),
    fields: input.fields,
    translations: input.translations ?? {},
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function listOrgForms(userId: string): OrgFormDefinition[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, user_id, title, description, fields_json, translations_json, is_published, created_at, updated_at
    FROM org_forms
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);

  const rows = stmt.all(userId) as Array<{
    id: string;
    user_id: string;
    title: string;
    description: string;
    fields_json: string;
    translations_json: string;
    is_published: number;
    created_at: number;
    updated_at: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    fields: JSON.parse(r.fields_json),
    translations: JSON.parse(r.translations_json || "{}"),
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getOrgForm(id: string): OrgFormDefinition | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, user_id, title, description, fields_json, translations_json, is_published, created_at, updated_at
    FROM org_forms
    WHERE id = ?
  `);

  const r = stmt.get(id) as {
    id: string;
    user_id: string;
    title: string;
    description: string;
    fields_json: string;
    translations_json: string;
    is_published: number;
    created_at: number;
    updated_at: number;
  } | undefined;

  if (!r) return null;

  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    fields: JSON.parse(r.fields_json),
    translations: JSON.parse(r.translations_json || "{}"),
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function updateOrgForm(
  id: string,
  userId: string,
  data: {
    title: string;
    description: string;
    fields: ExtractedField[];
    translations?: Partial<Record<Lang, Record<string, string>>>;
  }
): boolean {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE org_forms
    SET title = ?, description = ?, fields_json = ?, translations_json = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(
    data.title.trim(),
    data.description.trim(),
    JSON.stringify(data.fields),
    JSON.stringify(data.translations ?? {}),
    now,
    id,
    userId
  );

  return (result as { changes?: number }).changes ? (result as { changes: number }).changes > 0 : true;
}

export function deleteOrgForm(id: string, userId: string): boolean {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM org_forms
    WHERE id = ? AND user_id = ?
  `);
  stmt.run(id, userId);
  return true;
}
