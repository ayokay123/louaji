// GET /api/auth/profile — read own profile;  PUT /api/auth/profile — upsert it
import { profileGetHandler, profilePutHandler } from "@/features/auth/api";

export function GET(request: Request): Promise<Response> {
  return profileGetHandler(request);
}

export function PUT(request: Request): Promise<Response> {
  return profilePutHandler(request);
}
