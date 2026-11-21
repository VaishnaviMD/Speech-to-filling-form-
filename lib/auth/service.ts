import "server-only";
import crypto from "node:crypto";
import { getDb } from "./db";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_COOKIE_NAME = "formsathi_session";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

export function registerUser(name: string, email: string, password: string): { user: AuthUser; token: string } {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Check existing
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const userId = crypto.randomUUID();
  const now = Date.now();
  const { hash, salt } = hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, cleanName, cleanEmail, hash, salt, now);

  const token = createSession(userId);
  return {
    user: { id: userId, name: cleanName, email: cleanEmail, createdAt: now },
    token,
  };
}

export function loginUser(email: string, password: string): { user: AuthUser; token: string } {
  const db = getDb();
  const cleanEmail = email.trim().toLowerCase();

  const row = db.prepare("SELECT id, name, email, password_hash, salt, created_at FROM users WHERE email = ?").get(cleanEmail) as
    | { id: string; name: string; email: string; password_hash: string; salt: string; created_at: number }
    | undefined;

  if (!row || !verifyPassword(password, row.salt, row.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  const token = createSession(row.id);
  return {
    user: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at },
    token,
  };
}

export function createSession(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, expiresAt, now);

  return token;
}

export function getSessionUser(token: string): AuthUser | null {
  if (!token) return null;
  const db = getDb();
  const now = Date.now();

  const row = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as { id: string; name: string; email: string; created_at: number; expires_at: number } | undefined;

  if (!row) return null;

  if (row.expires_at < now) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }

  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

export function deleteSession(token: string): void {
  if (!token) return;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
