import type { AppLocale } from "@/shared/lib/i18n";
import type { BookingRepository } from "../ports/BookingRepository";
import type { SearchResultTrip, SearchTripsQuery } from "../entities/trip";

// Passenger search: exact origin/destination city pair on a date, only bookable
// trips with ≥1 free seat, ordered by departure time (docs/SRS.md §2.3). The
// adapter applies the filtering/ordering; this use-case guards the inputs.
export async function searchTrips(
  repo: BookingRepository,
  query: SearchTripsQuery,
  locale: AppLocale,
): Promise<SearchResultTrip[]> {
  if (query.originCityId === query.destinationCityId) {
    return [];
  }
  const trips = await repo.searchTrips(query, locale);
  return trips.filter((t) => t.availableSeats > 0);
}
