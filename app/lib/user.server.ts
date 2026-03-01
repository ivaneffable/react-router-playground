/**
 * User persistence (Neon). All functions throw on DB or config failure
 * so callers (e.g. auth callback) can catch and handle (e.g. show error, no session).
 */
import { neon } from "@neondatabase/serverless";

export type User = {
  id: string;
  email: string;
  name: string;
};

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
}

/**
 * Insert or update a user by id (from Google sub).
 * Creates a row on first sign-in; updates email and name on subsequent sign-ins.
 * @throws on missing DATABASE_URL or any DB error (connection, constraint, etc.)
 */
export async function upsertUser(user: User): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${user.id}, ${user.email}, ${user.name})
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = NOW()
  `;
}

/**
 * Get a user by id (from Google sub). Returns null if not found.
 * @throws on missing DATABASE_URL or any DB error (connection, etc.)
 */
export async function getUserById(id: string): Promise<User | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, email, name FROM users WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row || typeof row !== "object") return null;
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
  };
}
