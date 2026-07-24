// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Do not send user PII by default
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false,
  })
}

let replayLoadPromise: Promise<void> | null = null

function loadReplayAfterInteraction() {
  if (!sentryDsn) return

  replayLoadPromise ??= import('@sentry/replay')
    .then(({ replayIntegration }) => {
      Sentry.addIntegration(replayIntegration())
    })
    .catch(() => {
      // Error reporting remains active even when the optional replay bundle cannot load.
    })
}

if (typeof window !== 'undefined' && sentryDsn) {
  const interactionEvents = ['pointerdown', 'keydown', 'touchstart'] as const
  const scheduleReplay = () => {
    interactionEvents.forEach(event => window.removeEventListener(event, scheduleReplay))

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadReplayAfterInteraction, { timeout: 5000 })
      return
    }

    setTimeout(loadReplayAfterInteraction, 1000)
  }

  interactionEvents.forEach(event => {
    window.addEventListener(event, scheduleReplay, { once: true, passive: true })
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
