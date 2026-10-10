// Read models for the shared city/route catalog (super-admin curated). Names are
// already locale-resolved by the adapter.

export interface City {
  id: string;
  name: string;
  governorate: string | null;
}

export interface Route {
  id: string;
  originCityId: string;
  destinationCityId: string;
  originCity: string;
  destinationCity: string;
  estDurationMin: number | null;
}
