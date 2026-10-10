import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { AppRole } from "@/db/schemas/enums";
import type { Profile } from "../../core/entities/profile";
import type { AuthRepository, UpsertProfileInput } from "../../core/ports/AuthRepository";

// Supabase/Drizzle adapter for the auth/profile flow. Runs on the service-role
// `db` client (server-only). The phone-OTP credential itself lives in Supabase
// Auth (auth.users); this adapter just mirrors a public.users row keyed by the
// auth uid and reads role_grants. Mirrors src/features/booking adapter style.

// Explicit (non-index-signature) shape for raw SQL rows so dot access satisfies
// `noPropertyAccessFromIndexSignature`. All values are `unknown` and coerced at
// the mapping boundary.
interface Row {
  id?: unknown;
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  role?: unknown;
}

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function mapProfileRow(row: Row): Profile {
  return {
    id: String(row.id),
    fullName: row.full_name != null ? String(row.full_name) : null,
    phone: String(row.phone),
    email: row.email != null ? String(row.email) : null,
  };
}

export const authRepository: AuthRepository = {
  async upsertProfile(userId: string, input: UpsertProfileInput): Promise<Profile> {
    // INSERT the public.users row (id = auth uid), or refresh the mutable
    // fields if it already exists. COALESCE keeps an existing name when the
    // caller omits it (e.g. a login that only re-syncs the phone).
    const fullName = input.fullName ?? null;
    const email = input.email ?? null;
    const rows = await query(sql`
      INSERT INTO users (id, phone, full_name, email)
      VALUES (${userId}, ${input.phone}, ${fullName}, ${email})
      ON CONFLICT (id) DO UPDATE SET
        phone = EXCLUDED.phone,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        email = COALESCE(EXCLUDED.email, users.email),
        updated_at = now()
      RETURNING id, phone, full_name, email
    `);
    const row = rows[0];
    if (!row) throw new Error("Upsert returned no profile row");
    return mapProfileRow(row);
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const rows = await query(sql`
      SELECT id, phone, full_name, email FROM users
      WHERE id = ${userId} AND deleted_at IS NULL
      LIMIT 1
    `);
    const row = rows[0];
    return row ? mapProfileRow(row) : null;
  },

  async getRoles(userId: string): Promise<AppRole[]> {
    const rows = await query(sql`
      SELECT role FROM role_grants WHERE user_id = ${userId}
    `);
    return rows.map((r) => String(r.role) as AppRole);
  },
};
