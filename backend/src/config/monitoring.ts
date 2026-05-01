import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

function redactString(value: string | undefined): string | undefined {
  if (!value) return value;
  // Remove bearer tokens and long hex strings that look like secrets
  return value
    .replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, '[REDACTED]')
    .replace(/[A-Fa-f0-9]{32,}/g, '[REDACTED]');
}

function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  try {
    // Redact user email
    if (event.user && typeof event.user.email === 'string') {
      event.user.email = '[redacted]';
    }

    // Redact request headers that may contain auth tokens
    if (event.request && (event.request as any).headers) {
      const headers: Record<string, any> = (event.request as any).headers;
      if (headers.Authorization || headers.authorization) {
        headers.Authorization = '[redacted]';
        headers.authorization = '[redacted]';
      }
      // Remove cookie header
      if (headers.Cookie || headers.cookie) {
        headers.Cookie = '[redacted]';
        headers.cookie = '[redacted]';
      }
      (event.request as any).headers = headers;
    }

    // Redact common sensitive keys in extras
    if (event.extra && typeof event.extra === 'object') {
      for (const k of Object.keys(event.extra)) {
        if (/token|secret|password|passwd|api[_-]?key/i.test(k)) {
          (event.extra as any)[k] = '[redacted]';
        }
        if (typeof (event.extra as any)[k] === 'string') {
          (event.extra as any)[k] = redactString((event.extra as any)[k]);
        }
      }
    }

    // Sanitize message
    if (event.message && typeof event.message === 'string') {
      event.message = redactString(event.message);
    }

    return event;
  } catch (e) {
    // In case sanitizer fails, avoid dropping the event: return minimal event
    return { message: '[sanitizer-failed]' } as Sentry.ErrorEvent;
  }
}

export function initMonitoring(): void {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    beforeSend: (event) => sanitizeEvent(event)
  });
}

export function captureException(error: unknown): void {
  if (!dsn) {
    return;
  }
  Sentry.captureException(error);
}