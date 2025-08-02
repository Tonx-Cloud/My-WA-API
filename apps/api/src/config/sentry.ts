import * as Sentry from '@sentry/node'
// import { nodeProfilingIntegration } from '@sentry/profiling-node'

export function initSentry() {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        // nodeProfilingIntegration(), // Temporariamente desabilitado devido a conflito de tipos
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      tracesSampleRate: 1.0,
      // profilesSampleRate: 1.0, // Desabilitado junto com profiling
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
        }
        return event
      },
    })
  }
}

export { Sentry }
