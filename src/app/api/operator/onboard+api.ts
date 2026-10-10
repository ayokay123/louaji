// POST /api/operator/onboard — register the caller as a company or independent driver
import { onboardHandler } from "@/features/operators/api";

export function POST(request: Request): Promise<Response> {
  return onboardHandler(request);
}
