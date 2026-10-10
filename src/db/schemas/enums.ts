import { pgEnum } from "drizzle-orm/pg-core";

// Centralized pg enums for every closed-set column. A single source of truth
// keeps pg type names, TS literal unions, and DDL coherent. Values are
// lower-snake-case so they read the same in SQL, URL params, and TS unions.
//
// Adding a value: push it to the array and regenerate the migration
// (drizzle-kit emits `ALTER TYPE ... ADD VALUE`). Removing a value needs a
// custom migration — drop is non-trivial in Postgres.

// Account roles. A user may hold several (passenger by default; operators and
// staff are granted additional roles). See role_grants.
export const appRoleEnum = pgEnum("app_role", [
  "passenger",
  "company_admin",
  "driver",
  "super_admin",
]);

// Within a company: the owner vs an added manager.
export const companyMemberRoleEnum = pgEnum("company_member_role", ["owner", "manager"]);

// A single scheduled departure's lifecycle. See docs/ARCHITECTURE.md §7.
export const tripStatusEnum = pgEnum("trip_status", [
  "scheduled",
  "boarding",
  "departed",
  "completed",
  "cancelled",
]);

// A reservation's lifecycle. Created `confirmed` (cash on boarding); the
// operator sets boarded/no_show at boarding; either side may cancel earlier.
export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "boarded",
  "no_show",
  "cancelled",
]);

// v1 is cash on boarding only. Online payment is FUTURE — the enum is
// extensible when a Tunisian gateway is added.
export const paymentMethodEnum = pgEnum("payment_method", ["cash_on_boarding"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "booking_confirmed",
  "trip_reminder",
  "trip_cancelled",
  "booking_cancelled",
  "new_booking",
  "passenger_cancellation",
]);

// TS literal unions derived from the pg enums, for use across features.
export type AppRole = (typeof appRoleEnum.enumValues)[number];
export type CompanyMemberRole = (typeof companyMemberRoleEnum.enumValues)[number];
export type TripStatus = (typeof tripStatusEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
