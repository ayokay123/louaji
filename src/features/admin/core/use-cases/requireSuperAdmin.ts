import { ForbiddenError } from "../errors";
import type { AdminRepository } from "../ports/AdminRepository";

// The authorization boundary for every super-admin action. Reads the role
// grants via the repository and throws ForbiddenError (→ 403) when the caller
// is not a super_admin. Each API handler resolves the user id first
// (requireUserId), then calls this before touching any catalog/operator data.
export async function requireSuperAdmin(repo: AdminRepository, userId: string): Promise<void> {
  const ok = await repo.isSuperAdmin(userId);
  if (!ok) {
    throw new ForbiddenError();
  }
}
