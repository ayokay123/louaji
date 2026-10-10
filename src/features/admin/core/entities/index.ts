// Read/write models for the super-admin platform surface (catalog curation,
// operator verification, user + role management). Names are already
// locale-resolved by the adapter where a single display string is needed; the
// city editor keeps the raw ar/fr/en fields so they can be edited.

export interface AdminCity {
  id: string;
  name: string;
  nameFr: string | null;
  nameEn: string | null;
  governorate: string | null;
  isActive: boolean;
}

export interface CreateCityInput {
  name: string;
  nameFr?: string | undefined;
  nameEn?: string | undefined;
  governorate?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateCityInput {
  name?: string | undefined;
  nameFr?: string | null | undefined;
  nameEn?: string | null | undefined;
  governorate?: string | null | undefined;
  isActive?: boolean | undefined;
}

export interface AdminRoute {
  id: string;
  originCityId: string;
  destinationCityId: string;
  originCity: string;
  destinationCity: string;
  estDurationMin: number | null;
  estDistanceKm: number | null;
}

export interface CreateRouteInput {
  originCityId: string;
  destinationCityId: string;
  estDurationMin?: number | undefined;
  estDistanceKm?: number | undefined;
}

export type OperatorKind = "company" | "driver";

export interface PendingOperator {
  id: string;
  kind: OperatorKind;
  name: string;
  contactPhone: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  roles: string[];
  createdAt: string;
}

export interface GrantRoleInput {
  userId: string;
  role: string;
  companyId?: string;
}
