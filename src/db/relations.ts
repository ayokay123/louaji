import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

// Drizzle `defineRelations()` — declares FK relationships so
// `db.query.<table>.findMany({ with: { ... } })` type-infers the nested shape.
// `one.X` for the FK-owner side; matching `alias` on both sides pairs two
// relations that point at the same table (e.g. bookings → users twice).
//
// Pure metadata — emits no SQL, not used by drizzle-kit's migration diff. Keep
// in sync with the schema by hand when you add / rename FKs. Reverse `many`
// relations are added as features need them.
export const relations = defineRelations(schema, (r) => ({
  users: {
    roleGrants: r.many.roleGrants({ alias: "roleGrantUser" }),
    bookingsAsPassenger: r.many.bookings({ alias: "bookingPassenger" }),
    operatedTrips: r.many.trips({ alias: "tripOperator" }),
    searchHistory: r.many.searchHistory(),
    notifications: r.many.notifications(),
    companiesOwned: r.many.companies(),
  },

  roleGrants: {
    user: r.one.users({ from: r.roleGrants.userId, to: r.users.id, alias: "roleGrantUser" }),
    company: r.one.companies({ from: r.roleGrants.companyId, to: r.companies.id }),
    grantedBy: r.one.users({
      from: r.roleGrants.grantedByUserId,
      to: r.users.id,
      alias: "roleGrantGrantedBy",
    }),
  },

  companies: {
    owner: r.one.users({ from: r.companies.ownerUserId, to: r.users.id }),
    drivers: r.many.drivers(),
    vehicles: r.many.vehicles({ alias: "vehicleCompany" }),
  },

  drivers: {
    company: r.one.companies({ from: r.drivers.companyId, to: r.companies.id }),
    user: r.one.users({ from: r.drivers.userId, to: r.users.id }),
    vehicles: r.many.vehicles({ alias: "vehicleDriver" }),
  },

  vehicles: {
    company: r.one.companies({
      from: r.vehicles.companyId,
      to: r.companies.id,
      alias: "vehicleCompany",
    }),
    driver: r.one.drivers({
      from: r.vehicles.driverId,
      to: r.drivers.id,
      alias: "vehicleDriver",
    }),
  },

  cities: {
    routesFrom: r.many.routes({ alias: "routeOrigin" }),
    routesTo: r.many.routes({ alias: "routeDestination" }),
  },

  routes: {
    originCity: r.one.cities({
      from: r.routes.originCityId,
      to: r.cities.id,
      alias: "routeOrigin",
    }),
    destinationCity: r.one.cities({
      from: r.routes.destinationCityId,
      to: r.cities.id,
      alias: "routeDestination",
    }),
    trips: r.many.trips(),
  },

  trips: {
    route: r.one.routes({ from: r.trips.routeId, to: r.routes.id }),
    company: r.one.companies({ from: r.trips.companyId, to: r.companies.id }),
    driver: r.one.drivers({ from: r.trips.driverId, to: r.drivers.id }),
    vehicle: r.one.vehicles({ from: r.trips.vehicleId, to: r.vehicles.id }),
    operator: r.one.users({
      from: r.trips.operatorUserId,
      to: r.users.id,
      alias: "tripOperator",
    }),
    bookings: r.many.bookings(),
    bookingSeats: r.many.bookingSeats(),
    seatHolds: r.many.seatHolds(),
  },

  bookings: {
    passenger: r.one.users({
      from: r.bookings.passengerUserId,
      to: r.users.id,
      alias: "bookingPassenger",
    }),
    operator: r.one.users({
      from: r.bookings.operatorUserId,
      to: r.users.id,
      alias: "bookingOperator",
    }),
    trip: r.one.trips({ from: r.bookings.tripId, to: r.trips.id }),
    seats: r.many.bookingSeats(),
  },

  bookingSeats: {
    booking: r.one.bookings({ from: r.bookingSeats.bookingId, to: r.bookings.id }),
    trip: r.one.trips({ from: r.bookingSeats.tripId, to: r.trips.id }),
  },

  seatHolds: {
    trip: r.one.trips({ from: r.seatHolds.tripId, to: r.trips.id }),
    heldByUser: r.one.users({ from: r.seatHolds.heldBy, to: r.users.id }),
  },

  searchHistory: {
    user: r.one.users({ from: r.searchHistory.userId, to: r.users.id }),
    originCity: r.one.cities({ from: r.searchHistory.originCityId, to: r.cities.id }),
    destinationCity: r.one.cities({
      from: r.searchHistory.destinationCityId,
      to: r.cities.id,
    }),
  },

  notifications: {
    recipient: r.one.users({ from: r.notifications.recipientId, to: r.users.id }),
  },
}));
