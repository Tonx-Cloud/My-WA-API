// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs'

const dsn = process.env['NEXT_PUBLIC_SENTRY_DSN']

if (dsn) {
  Sentry.init({
    dsn,
    
    integrations: [
      Sentry.prismaIntegration(),
    ],
    
    tracesSampleRate: 1.0,
    
    debug: false,
    
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
