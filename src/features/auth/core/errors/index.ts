import { registerDomainErrorStatus } from "@/shared/lib/http/error-mapper";

// Domain errors for the auth / profile flow. Each carries a `_tag` that the HTTP
// error mapper turns into a status code. We register the status here (rather than
// editing error-mapper's static table) so the feature owns its own mapping.
// See src/shared/lib/http/error-mapper.ts.

/** No public.users row exists for the resolved auth user. */
export class ProfileNotFound extends Error {
  readonly _tag = "ProfileNotFound";
  constructor() {
    super("No profile found for this account.");
  }
}

registerDomainErrorStatus("ProfileNotFound", 404);
