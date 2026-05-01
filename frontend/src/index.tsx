import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
function redactString(value: string | undefined): string | undefined {
  if (!value) return value;
  return value
    .replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, '[REDACTED]')
    .replace(/[A-Fa-f0-9]{32,}/g, '[REDACTED]');
}

function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  try {
    if (event.user && typeof event.user.email === 'string') {
      event.user.email = '[redacted]';
    }
    if (event.request && (event.request as any).headers) {
      const headers: Record<string, any> = (event.request as any).headers;
      if (headers.Authorization || headers.authorization) {
        headers.Authorization = '[redacted]';
        headers.authorization = '[redacted]';
      }
      if (headers.Cookie || headers.cookie) {
        headers.Cookie = '[redacted]';
        headers.cookie = '[redacted]';
      }
    }
    if (event.message && typeof event.message === 'string') {
      event.message = redactString(event.message);
    }
    return event;
  } catch (e) {
    return { message: '[sanitizer-failed]' } as Sentry.ErrorEvent;
  }
}

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || 0),
    beforeSend: (event) => sanitizeEvent(event)
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
