-- Bootstrap extensions used across the schema. Runs before every
-- drizzle-generated migration so the objects below are available when tables
-- reference them. CREATE EXTENSION is IF NOT EXISTS so the migration is
-- idempotent on prod Supabase (where postgis is typically pre-enabled) and on
-- fresh local stacks.

-- PostGIS provides the `geography(Point, 4326)` type used by city coordinates
-- (and FUTURE live tracking). GiST indexes over geography columns enable
-- great-circle distance queries in real kilometers.
CREATE EXTENSION IF NOT EXISTS postgis;
