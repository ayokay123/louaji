import { customType } from "drizzle-orm/pg-core";

export type GeographyPoint = { lat: number; lng: number };

// PostGIS geography(Point, 4326) — great-circle distance queries over real
// km. Drizzle has no first-class geography column, so we model it as a
// customType. Values are plain { lat, lng } on the JS side and EWKT strings
// over the wire. The PostGIS extension is enabled by the first drizzle
// migration (generated with `drizzle-kit generate --custom`).
export const geographyPoint = customType<{
  data: GeographyPoint;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
  },

  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value) {
    const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(value);
    if (!match) throw new Error(`invalid EWKT POINT: ${value}`);
    return { lng: Number(match[1]), lat: Number(match[2]) };
  },
});
