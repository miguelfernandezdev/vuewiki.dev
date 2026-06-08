type PostHogLike = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  captureException: (error: unknown) => void
}

let instance: PostHogLike | null = null
const queue: Array<[string, Record<string, unknown>?]> = []

function flush() {
  if (!instance) return
  for (const [event, props] of queue) instance.capture(event, props)
  queue.length = 0
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (instance) return instance.capture(event, properties)
  queue.push([event, properties])
}

export function captureException(error: unknown) {
  if (instance) return instance.captureException(error)
}

export function initAnalytics() {
  if (typeof window === 'undefined') return

  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
  if (!token) return

  const schedule =
    globalThis.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
  schedule(() => {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(token, {
        api_host:
          import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
        defaults: '2026-01-30',
        disable_session_recording: true
      })
      instance = posthog
      flush()
    })
  })
}
