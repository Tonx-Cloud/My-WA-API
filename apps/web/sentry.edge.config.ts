﻿// This file configures the initialization of Sentry for edge runtime
import * as Sentry from '@sentry/nextjs';

const dsn = process.env['NEXT_PUBLIC_SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
