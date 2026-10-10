// Read models for the passenger-facing search + trip-detail screens. These are
// shaped for the UI, not 1:1 with the DB rows — the adapter assembles them.

export interface TripOperator {
  /** Display name (company or independent driver), already locale-resolved. */
  name: string;
  isCompany: boolean;
}

export interface SearchResultTrip {
  id: string;
  originCity: string;
  destinationCity: string;
  serviceDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  estArrivalTime: string | null; // HH:mm
  operator: TripOperator;
  priceMillimes: number;
  totalSeats: number;
  availableSeats: number;
}

export interface TripDetail extends SearchResultTrip {
  vehicleModel: string | null;
}

export interface SearchTripsQuery {
  originCityId: string;
  destinationCityId: string;
  serviceDate: string; // YYYY-MM-DD
}
