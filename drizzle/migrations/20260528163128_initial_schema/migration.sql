CREATE TYPE "app_role" AS ENUM('passenger', 'company_admin', 'driver', 'super_admin');--> statement-breakpoint
CREATE TYPE "booking_status" AS ENUM('confirmed', 'boarded', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "company_member_role" AS ENUM('owner', 'manager');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('booking_confirmed', 'trip_reminder', 'trip_cancelled', 'booking_cancelled', 'new_booking', 'passenger_cancellation');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash_on_boarding');--> statement-breakpoint
CREATE TYPE "trip_status" AS ENUM('scheduled', 'boarding', 'departed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "booking_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"seat_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_seats_trip_seat_unique" UNIQUE("trip_id","seat_number")
);
--> statement-breakpoint
ALTER TABLE "booking_seats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_number" text NOT NULL UNIQUE,
	"passenger_user_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"operator_user_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed'::"booking_status" NOT NULL,
	"seat_count" integer NOT NULL,
	"total_millimes" integer NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash_on_boarding'::"payment_method" NOT NULL,
	"passenger_name" text NOT NULL,
	"passenger_phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"name_fr" text,
	"name_en" text,
	"governorate" text,
	"location" geography(Point,4326),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"name_fr" text,
	"name_en" text,
	"logo_url" text,
	"contact_phone" text,
	"description" text,
	"owner_user_id" uuid NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" text NOT NULL,
	"phone" text,
	"license_ref" text,
	"company_id" uuid,
	"user_id" uuid,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recipient_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"data" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"company_id" uuid,
	"company_member_role" "company_member_role",
	"granted_by_user_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_grants_user_role_company_unique" UNIQUE("user_id","role","company_id")
);
--> statement-breakpoint
ALTER TABLE "role_grants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"origin_city_id" uuid NOT NULL,
	"destination_city_id" uuid NOT NULL,
	"est_duration_min" integer,
	"est_distance_km" numeric(6,1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routes_origin_destination_unique" UNIQUE("origin_city_id","destination_city_id")
);
--> statement-breakpoint
ALTER TABLE "routes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"origin_city_id" uuid NOT NULL,
	"destination_city_id" uuid NOT NULL,
	"service_date" date,
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seat_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"seat_number" integer NOT NULL,
	"held_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seat_holds_trip_seat_unique" UNIQUE("trip_id","seat_number")
);
--> statement-breakpoint
ALTER TABLE "seat_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"route_id" uuid NOT NULL,
	"company_id" uuid,
	"driver_id" uuid,
	"vehicle_id" uuid NOT NULL,
	"operator_user_id" uuid NOT NULL,
	"service_date" date NOT NULL,
	"departure_time" time NOT NULL,
	"est_arrival_time" time,
	"price_millimes" integer NOT NULL,
	"status" "trip_status" DEFAULT 'scheduled'::"trip_status" NOT NULL,
	"total_seats" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"full_name" text,
	"phone" text NOT NULL UNIQUE,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid,
	"driver_id" uuid,
	"plate" text NOT NULL,
	"model" text,
	"seat_count" integer NOT NULL,
	"seat_layout" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_one_owner" CHECK (num_nonnulls("company_id", "driver_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "bookings_passenger_idx" ON "bookings" ("passenger_user_id");--> statement-breakpoint
CREATE INDEX "bookings_operator_idx" ON "bookings" ("operator_user_id");--> statement-breakpoint
CREATE INDEX "bookings_trip_idx" ON "bookings" ("trip_id");--> statement-breakpoint
CREATE INDEX "cities_location_gist_idx" ON "cities" USING gist ("location");--> statement-breakpoint
CREATE INDEX "cities_active_idx" ON "cities" ("id") WHERE "is_active" = true;--> statement-breakpoint
CREATE INDEX "companies_owner_idx" ON "companies" ("owner_user_id");--> statement-breakpoint
CREATE INDEX "drivers_company_idx" ON "drivers" ("company_id") WHERE "company_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "drivers_user_idx" ON "drivers" ("user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" ("recipient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" ("recipient_id","created_at" DESC NULLS LAST) WHERE "read_at" IS NULL;--> statement-breakpoint
CREATE INDEX "role_grants_user_idx" ON "role_grants" ("user_id");--> statement-breakpoint
CREATE INDEX "search_history_user_idx" ON "search_history" ("user_id","searched_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "seat_holds_expires_idx" ON "seat_holds" ("expires_at");--> statement-breakpoint
CREATE INDEX "trips_search_idx" ON "trips" ("route_id","service_date","status");--> statement-breakpoint
CREATE INDEX "trips_operator_idx" ON "trips" ("operator_user_id");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" ("phone");--> statement-breakpoint
CREATE INDEX "vehicles_company_idx" ON "vehicles" ("company_id") WHERE "company_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "vehicles_driver_idx" ON "vehicles" ("driver_id") WHERE "driver_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_user_id_users_id_fkey" FOREIGN KEY ("passenger_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operator_user_id_users_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_user_id_users_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_granted_by_user_id_users_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_city_id_cities_id_fkey" FOREIGN KEY ("origin_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_city_id_cities_id_fkey" FOREIGN KEY ("destination_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_origin_city_id_cities_id_fkey" FOREIGN KEY ("origin_city_id") REFERENCES "cities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_destination_city_id_cities_id_fkey" FOREIGN KEY ("destination_city_id") REFERENCES "cities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_held_by_users_id_fkey" FOREIGN KEY ("held_by") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_routes_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_operator_user_id_users_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_drivers_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "booking_seats_public_read" ON "booking_seats" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "booking_seats_service_role_write" ON "booking_seats" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "bookings_passenger_read" ON "bookings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("bookings"."passenger_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "bookings_operator_read" ON "bookings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("bookings"."operator_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "bookings_service_role_write" ON "bookings" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "cities_public_read" ON "cities" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "cities_service_role_write" ON "cities" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "companies_public_read_verified" ON "companies" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("companies"."is_verified" = true OR "companies"."owner_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "companies_owner_write" ON "companies" AS PERMISSIVE FOR ALL TO "authenticated" USING ("companies"."owner_user_id" = (select auth.uid())) WITH CHECK ("companies"."owner_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "companies_service_role_write" ON "companies" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "drivers_public_read_verified" ON "drivers" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("drivers"."is_verified" = true OR "drivers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "drivers_self_write" ON "drivers" AS PERMISSIVE FOR ALL TO "authenticated" USING ("drivers"."user_id" = (select auth.uid())) WITH CHECK ("drivers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "drivers_service_role_write" ON "drivers" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "notifications_recipient_read" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."recipient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_recipient_update" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."recipient_id" = (select auth.uid())) WITH CHECK ("notifications"."recipient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_service_role_write" ON "notifications" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "role_grants_self_read" ON "role_grants" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("role_grants"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "role_grants_service_role_write" ON "role_grants" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "routes_public_read" ON "routes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "routes_service_role_write" ON "routes" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "search_history_self_read" ON "search_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("search_history"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "search_history_self_insert" ON "search_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("search_history"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "search_history_self_delete" ON "search_history" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("search_history"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "search_history_service_role_write" ON "search_history" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "seat_holds_public_read" ON "seat_holds" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "seat_holds_service_role_write" ON "seat_holds" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "trips_public_read_bookable" ON "trips" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("trips"."status" IN ('scheduled', 'boarding'));--> statement-breakpoint
CREATE POLICY "trips_operator_write" ON "trips" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trips"."operator_user_id" = (select auth.uid())) WITH CHECK ("trips"."operator_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "trips_service_role_write" ON "trips" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "users_self_read" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_self_insert" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("users"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_self_update" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."id" = (select auth.uid())) WITH CHECK ("users"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "users_service_role_write" ON "users" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "vehicles_public_read_active" ON "vehicles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("vehicles"."is_active" = true);--> statement-breakpoint
CREATE POLICY "vehicles_service_role_write" ON "vehicles" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);