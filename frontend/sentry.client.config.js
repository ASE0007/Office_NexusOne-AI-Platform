// NexusOne AI — Sentry client-side error tracking
// Only activates if NEXT_PUBLIC_SENTRY_DSN is set in .env.local
// Without it, this file does nothing and the app runs exactly as before.

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Lazy-required so the @sentry/nextjs package (optionalDependency)
  // doesn't need to be installed for the app to build and run.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/nextjs');

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
    // Never capture replays/PII by default — business data stays private
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
