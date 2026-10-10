import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { AppLocale } from "@/shared/lib/i18n";
import type { City, Route } from "../../core/entities";

// Read-only access to the city/route catalog. Writes are the super-admin's job
// (src/features/admin). Names are resolved to the request locale here.

interface CityRow {
  id?: unknown;
  name?: unknown;
  name_fr?: unknown;
  name_en?: unknown;
  governorate?: unknown;
  origin_city_id?: unknown;
  destination_city_id?: unknown;
  origin_ar?: unknown;
  origin_fr?: unknown;
  origin_en?: unknown;
  dest_ar?: unknown;
  dest_fr?: unknown;
  dest_en?: unknown;
  est_duration_min?: unknown;
}

async function rows(statement: ReturnType<typeof sql>): Promise<CityRow[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: CityRow[] };
  return result.rows ?? (result as unknown as CityRow[]);
}

function pick(locale: AppLocale, ar: unknown, fr: unknown, en: unknown): string {
  const value = locale === "fr" ? fr : locale === "en" ? en : ar;
  return String(value ?? ar ?? "");
}

export const catalogRepository = {
  async listCities(locale: AppLocale): Promise<City[]> {
    const result = await rows(sql`
      SELECT id, name, name_fr, name_en, governorate
      FROM cities WHERE is_active = true ORDER BY name ASC
    `);
    return result.map((r) => ({
      id: String(r.id),
      name: pick(locale, r.name, r.name_fr, r.name_en),
      governorate: r.governorate ? String(r.governorate) : null,
    }));
  },

  async listRoutes(locale: AppLocale): Promise<Route[]> {
    const result = await rows(sql`
      SELECT r.id, r.origin_city_id, r.destination_city_id, r.est_duration_min,
        oc.name AS origin_ar, oc.name_fr AS origin_fr, oc.name_en AS origin_en,
        dc.name AS dest_ar, dc.name_fr AS dest_fr, dc.name_en AS dest_en
      FROM routes r
      JOIN cities oc ON oc.id = r.origin_city_id
      JOIN cities dc ON dc.id = r.destination_city_id
      ORDER BY oc.name ASC, dc.name ASC
    `);
    return result.map((r) => ({
      id: String(r.id),
      originCityId: String(r.origin_city_id),
      destinationCityId: String(r.destination_city_id),
      originCity: pick(locale, r.origin_ar, r.origin_fr, r.origin_en),
      destinationCity: pick(locale, r.dest_ar, r.dest_fr, r.dest_en),
      estDurationMin: r.est_duration_min != null ? Number(r.est_duration_min) : null,
    }));
  },
};
