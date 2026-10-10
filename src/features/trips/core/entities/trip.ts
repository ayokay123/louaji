// Read/write models for operator trip scheduling. Money is integer millimes.

export interface ScheduleTripInput {
  routeId: string;
  serviceDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  estArrivalTime: string | null; // HH:mm
  priceMillimes: number;
  vehicleId: string;
  driverId: string | null;
}

export interface OperatorTrip {
  id: string;
  routeId: string;
  originCity: string;
  destinationCity: string;
  serviceDate: string;
  departureTime: string;
  estArrivalTime: string | null;
  status: "scheduled" | "boarding" | "departed" | "completed" | "cancelled";
  priceMillimes: number;
  totalSeats: number;
  bookedSeats: number;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string | null;
  driverName: string | null;
}
