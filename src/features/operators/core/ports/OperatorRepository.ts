import type { AppLocale } from "@/shared/lib/i18n";
import type {
  OnboardOperatorInput,
  OnboardOperatorResult,
  OperatorContext,
} from "../entities/operator";
import type { OperatorDashboard } from "../entities/dashboard";

// The port the operator use-cases depend on. The Supabase/Drizzle adapter
// implements it; the use-cases never see Drizzle or pg. `resolveOperator` reads
// role_grants + company/driver to build the operating context (used by the
// `requireOperator` server guard). See docs/ARCHITECTURE.md §2.

export interface OperatorRepository {
  /** Resolve the caller's operator context, or null if they hold no operator grant. */
  resolveOperator(userId: string, locale: AppLocale): Promise<OperatorContext | null>;
  /** Create a company/driver + role grant for the caller. */
  onboard(userId: string, input: OnboardOperatorInput): Promise<OnboardOperatorResult>;
  /** Today's + upcoming trips for the caller, with occupancy. */
  getDashboard(operator: OperatorContext, locale: AppLocale): Promise<OperatorDashboard>;
}
