import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

export function initMonitoring(): void {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0)
  });
}

export function captureException(error: unknown): void {
  if (!dsn) {
    return;
  }
  Sentry.captureException(error);
}