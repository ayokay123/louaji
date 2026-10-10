// Barrel that re-exports every per-table schema under ./schemas/.
// This is the entry point drizzle.config.ts's `schema` field points at — so
// `drizzle-kit generate` walks this file to diff against the previous
// snapshot and produce the next migration.
//
// Add new tables by creating ./schemas/<table>.ts and appending a re-export
// below (alphabetical). See drizzle.config.ts for the end-to-end workflow.

export * from "./schemas/enums";
export * from "./schemas/booking-seats";
export * from "./schemas/bookings";
export * from "./schemas/cities";
export * from "./schemas/companies";
export * from "./schemas/drivers";
export * from "./schemas/notifications";
export * from "./schemas/role-grants";
export * from "./schemas/routes";
export * from "./schemas/search-history";
export * from "./schemas/seat-holds";
export * from "./schemas/trips";
export * from "./schemas/users";
export * from "./schemas/vehicles";
