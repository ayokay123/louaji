// Read model for the operator dashboard: the caller's trips for today and the
// near future, each with live occupancy (booked seats vs total). Names are
// already locale-resolved by the adapter.

export interface DashboardTrip {
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
  vehiclePlate: string;
  driverName: string | null;
}

export interface OperatorDashboard {
  operatorName: string;
  isVerified: boolean;
  todayTrips: DashboardTrip[];
  upcomingTrips: DashboardTrip[];
}
