import type { AppLocale } from "@/shared/lib/i18n";
import type {
  AdminCity,
  AdminRoute,
  AdminUser,
  CreateCityInput,
  CreateRouteInput,
  GrantRoleInput,
  PendingOperator,
  UpdateCityInput,
} from "../entities";

// The port the super-admin use-cases / handlers depend on. The Supabase/Drizzle
// adapter implements it; callers never see Drizzle, pg, or supabase-js. Every
// method that mutates is guarded upstream by `requireSuperAdmin` in the API
// layer (see src/features/admin/api). See docs/ARCHITECTURE.md §2 / SRS §3.1.

export interface AdminRepository {
  /** True if the user holds an active super_admin role grant. */
  isSuperAdmin(userId: string): Promise<boolean>;

  listCities(locale: AppLocale): Promise<AdminCity[]>;
  createCity(input: CreateCityInput): Promise<AdminCity>;
  updateCity(id: string, input: UpdateCityInput): Promise<AdminCity>;

  listRoutes(locale: AppLocale): Promise<AdminRoute[]>;
  createRoute(input: CreateRouteInput): Promise<AdminRoute>;

  listPendingOperators(locale: AppLocale): Promise<PendingOperator[]>;
  verifyCompany(id: string): Promise<void>;
  verifyDriver(id: string): Promise<void>;
  suspendCompany(id: string): Promise<void>;

  listUsers(): Promise<AdminUser[]>;
  grantRole(input: GrantRoleInput): Promise<void>;
}
