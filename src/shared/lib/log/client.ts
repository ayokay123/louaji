type Level = "debug" | "info" | "warn" | "error";

// Browser/universal logger — intentionally a thin console wrapper. Keeping
// pino out of the client bundle (it's a Node module) saves ~50 KB and avoids
// bundler shims. For client-side error tracking, send events to Sentry/PostHog
// from the same call sites once those are wired in.

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const payload = { level, message, ts: new Date().toISOString(), ...meta };
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else if (level === "debug") console.debug(payload);
  else console.log(payload);
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
