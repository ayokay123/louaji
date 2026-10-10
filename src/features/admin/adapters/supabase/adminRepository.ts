import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { AppLocale } from "@/shared/lib/i18n";
import { AdminNotFound } from "../../core/errors";
import type { AdminRepository } from "../../core/ports/AdminRepository";
import type {
  AdminCity,
  AdminRoute,
  AdminUser,
  CreateCityInput,
  CreateRouteInput,
  GrantRoleInput,
  PendingOperator,
  UpdateCityInput,
} from "../../core/entities";

// Supabase/Drizzle adapter for the super-admin surface. Writes go through the
// service-role Drizzle client (RLS service_role policies allow it). City INSERTs
// deliberately never touch `location` (a PostGIS geography) — it stays null in
// v1. Raw SQL rows are read through an explicit `interface Row` so dot access
// satisfies `noPropertyAccessFromIndexSignature`. See docs/ARCHITECTURE.md §5.

// Explicit (non-index-signature) shape for raw SQL rows. All values are
// `unknown` and coerced at the mapping boundary.
interface Row {
  id?: unknown;
  name?: unknown;
  name_fr?: unknown;
  name_en?: unknown;
  governorate?: unknown;
  is_active?: unknown;
  origin_city_id?: unknown;
  destination_city_id?: unknown;
  origin_ar?: unknown;
  origin_fr?: unknown;
  origin_en?: unknown;
  dest_ar?: unknown;
  dest_fr?: unknown;
  dest_en?: unknown;
  est_duration_min?: unknown;
  est_distance_km?: unknown;
  kind?: unknown;
  contact_phone?: unknown;
  created_at?: unknown;
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  roles?: unknown;
  count?: unknown;
}

async function query(statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: Row[] };
  return result.rows ?? (result as unknown as Row[]);
}

function pick(locale: AppLocale, ar: unknown, fr: unknown, en: unknown): string {
  const value = locale === "fr" ? fr : locale === "en" ? en : ar;
  return String(value ?? ar ?? "");
}

function mapCity(row: Row): AdminCity {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    nameFr: row.name_fr != null ? String(row.name_fr) : null,
    nameEn: row.name_en != null ? String(row.name_en) : null,
    governorate: row.governorate != null ? String(row.governorate) : null,
    isActive: row.is_active === true,
  };
}

function mapRoute(row: Row, locale: AppLocale): AdminRoute {
  return {
    id: String(row.id),
    originCityId: String(row.origin_city_id),
    destinationCityId: String(row.destination_city_id),
    originCity: pick(locale, row.origin_ar, row.origin_fr, row.origin_en),
    destinationCity: pick(locale, row.dest_ar, row.dest_fr, row.dest_en),
    estDurationMin: row.est_duration_min != null ? Number(row.est_duration_min) : null,
    estDistanceKm: row.est_distance_km != null ? Number(row.est_distance_km) : null,
  };
}

const ROUTE_SELECT = sql`
  r.id, r.origin_city_id, r.destination_city_id, r.est_duration_min, r.est_distance_km AS est_distance_km,
  oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
  dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en
  FROM routes r
  JOIN cities oc ON oc.id = r.origin_city_id
  JOIN cities dc ON dc.id = r.destination_city_id
`;

export const adminRepository: AdminRepository = {
  async isSuperAdmin(userId: string): Promise<boolean> {
    const rows = await query(sql`
      SELECT count(*) AS count FROM role_grants
      WHERE user_id = ${userId} AND role = 'super_admin'
    `);
    return Number(rows[0]?.count ?? 0) > 0;
  },

  async listCities(_locale: AppLocale): Promise<AdminCity[]> {
    const rows = await query(sql`
      SELECT id, name, name_fr, name_en, governorate, is_active
      FROM cities ORDER BY name ASC
    `);
    return rows.map(mapCity);
  },

  async createCity(input: CreateCityInput): Promise<AdminCity> {
    // NB: never write `location` — leave the PostGIS geography null in v1.
    const rows = await query(sql`
      INSERT INTO cities (name, name_fr, name_en, governorate, is_active)
      VALUES (
        ${input.name},
        ${input.nameFr ?? null},
        ${input.nameEn ?? null},
        ${input.governorate ?? null},
        ${input.isActive ?? true}
      )
      RETURNING id, name, name_fr, name_en, governorate, is_active
    `);
    const row = rows[0];
    if (!row) throw new AdminNotFound("City could not be created.");
    return mapCity(row);
  },

  async updateCity(id: string, input: UpdateCityInput): Promise<AdminCity> {
    const rows = await query(sql`
      UPDATE cities SET
        name = COALESCE(${input.name ?? null}, name),
        name_fr = ${input.nameFr === undefined ? sql`name_fr` : input.nameFr},
        name_en = ${input.nameEn === undefined ? sql`name_en` : input.nameEn},
        governorate = ${input.governorate === undefined ? sql`governorate` : input.governorate},
        is_active = COALESCE(${input.isActive ?? null}, is_active)
      WHERE id = ${id}
      RETURNING id, name, name_fr, name_en, governorate, is_active
    `);
    const row = rows[0];
    if (!row) throw new AdminNotFound("City not found.");
    return mapCity(row);
  },

  async listRoutes(locale: AppLocale): Promise<AdminRoute[]> {
    const rows = await query(sql`
      SELECT ${ROUTE_SELECT}
      ORDER BY oc.name ASC, dc.name ASC
    `);
    return rows.map((r) => mapRoute(r, locale));
  },

  async createRoute(input: CreateRouteInput): Promise<AdminRoute> {
    const inserted = await query(sql`
      INSERT INTO routes (origin_city_id, destination_city_id, est_duration_min, est_distance_km)
      VALUES (
        ${input.originCityId},
        ${input.destinationCityId},
        ${input.estDurationMin ?? null},
        ${input.estDistanceKm ?? null}
      )
      RETURNING id
    `);
    const insertedRow = inserted[0];
    if (!insertedRow) throw new AdminNotFound("Route could not be created.");
    const rows = await query(sql`
      SELECT ${ROUTE_SELECT}
      WHERE r.id = ${String(insertedRow.id)}
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) throw new AdminNotFound("Route not found after creation.");
    return mapRoute(row, "ar");
  },

  async listPendingOperators(locale: AppLocale): Promise<PendingOperator[]> {
    const rows = await query(sql`
      SELECT id, 'company' AS kind, name, name_fr, name_en,
             contact_phone, created_at
      FROM companies WHERE is_verified = false
      UNION ALL
      SELECT id, 'driver' AS kind, full_name AS name, NULL AS name_fr, NULL AS name_en,
             phone AS contact_phone, created_at
      FROM drivers WHERE is_verified = false
      ORDER BY created_at ASC
    `);
    return rows.map((row) => {
      const kind = row.kind === "driver" ? "driver" : "company";
      const name =
        kind === "company"
          ? pick(locale, row.name, row.name_fr, row.name_en)
          : String(row.name ?? "");
      return {
        id: String(row.id),
        kind,
        name,
        contactPhone: row.contact_phone != null ? String(row.contact_phone) : null,
        createdAt: String(row.created_at),
      };
    });
  },

  async verifyCompany(id: string): Promise<void> {
    const rows = await query(sql`
      UPDATE companies SET is_verified = true, verified_at = now(), updated_at = now()
      WHERE id = ${id} RETURNING id
    `);
    if (!rows[0]) throw new AdminNotFound("Company not found.");
  },

  async verifyDriver(id: string): Promise<void> {
    const rows = await query(sql`
      UPDATE drivers SET is_verified = true, verified_at = now(), updated_at = now()
      WHERE id = ${id} RETURNING id
    `);
    if (!rows[0]) throw new AdminNotFound("Driver not found.");
  },

  async suspendCompany(id: string): Promise<void> {
    const rows = await query(sql`
      UPDATE companies SET is_verified = false, verified_at = NULL, updated_at = now()
      WHERE id = ${id} RETURNING id
    `);
    if (!rows[0]) throw new AdminNotFound("Company not found.");
  },

  async listUsers(): Promise<AdminUser[]> {
    const rows = await query(sql`
      SELECT u.id, u.full_name, u.phone, u.email, u.created_at,
        COALESCE(
          (SELECT array_agg(DISTINCT rg.role::text)
           FROM role_grants rg WHERE rg.user_id = u.id), '{}'
        ) AS roles
      FROM users u
      ORDER BY u.created_at DESC
    `);
    return rows.map((row) => ({
      id: String(row.id),
      fullName: row.full_name != null ? String(row.full_name) : null,
      phone: String(row.phone ?? ""),
      email: row.email != null ? String(row.email) : null,
      roles: Array.isArray(row.roles) ? (row.roles as unknown[]).map((r) => String(r)) : [],
      createdAt: String(row.created_at),
    }));
  },

  async grantRole(input: GrantRoleInput): Promise<void> {
    await query(sql`
      INSERT INTO role_grants (user_id, role, company_id)
      VALUES (${input.userId}, ${input.role}::app_role, ${input.companyId ?? null})
      ON CONFLICT (user_id, role, company_id) DO NOTHING
    `);
  },
};
