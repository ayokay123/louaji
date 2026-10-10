import pino, { type Logger } from "pino";
import { env } from "@/shared/config/env";

// Server-side logger — pino. Use only in Expo Router API routes (`+api.ts`),
// Edge Functions, or other Node-only modules. NEVER import from a file that
// ends up in the client bundle (pino is a Node module and will explode the
// bundle size if pulled into the browser build).

const isDev = env.NODE_ENV !== "production";

// NOTE: deliberately no `transport` (e.g. pino-pretty). A pino transport runs in
// a worker thread (thread-stream), which the bundled Expo Router server runtime
// — and EAS Hosting — cannot spawn: the worker's module path can't be resolved
// inside a bundled API route, crashing it with MODULE_NOT_FOUND. Plain pino
// writes structured JSON to stdout synchronously, which is correct for the
// server runtime. Pipe logs through `pino-pretty` on the CLI for colors in dev.
export const logger: Logger = pino({
  level: env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
});
