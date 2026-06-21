// NexusOne AI — Sentry server-side error tracking (Next.js server runtime)
// Only activates if SENTRY_DSN is set. No-op otherwise.

if (process.env.SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
  });
}
